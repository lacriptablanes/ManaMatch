import react from '@vitejs/plugin-react'
import { readFileSync } from 'node:fs'
import { defineConfig } from 'vite'
import { SECURITY_HEADERS, headersFile } from './security-headers.js'

// Escribe dist/_headers con las cabeceras de seguridad al compilar
const securityHeaders = () => ({
  name: 'security-headers',
  apply: 'build',
  generateBundle() {
    // vercel.json debe llevar las mismas cabeceras (incluida la CSP); si alguien cambia una lista y no la otra, la compilación falla
    const vercel = JSON.parse(readFileSync('vercel.json', 'utf8')).headers.find((h) => h.source === '/(.*)')?.headers ?? []
    const missing = Object.entries(SECURITY_HEADERS).filter(([k, v]) => !vercel.some((h) => h.key === k && h.value === v))
    if (missing.length) this.error(`vercel.json no coincide con security-headers.js en: ${missing.map(([k]) => k).join(', ')}`)
    this.emitFile({ type: 'asset', fileName: '_headers', source: headersFile() })
  },
})

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), securityHeaders()],
  // `npm run preview` sirve la versión compilada con las mismas cabeceras que en producción.
  // (En `npm run dev` no se aplican: Vite inyecta scripts propios que la política bloquearía.)
  preview: { headers: SECURITY_HEADERS },
})
