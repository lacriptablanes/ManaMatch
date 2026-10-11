import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { SECURITY_HEADERS, headersFile } from './security-headers.js'

// Escribe dist/_headers con las cabeceras de seguridad al compilar
const securityHeaders = () => ({
  name: 'security-headers',
  apply: 'build',
  generateBundle() {
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
