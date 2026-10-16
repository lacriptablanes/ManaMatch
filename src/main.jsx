import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { ready } from './i18n'

// Se espera al diccionario del idioma elegido (si no es español) para pintar la app ya traducida
ready.finally(() => {
  createRoot(document.getElementById('root')).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
})

// El service worker solo se activa en la versión publicada: en desarrollo cachearía el código y
// ocultaría los cambios, así que allí se elimina si existiera de una prueba anterior.
if ('serviceWorker' in navigator) {
  if (import.meta.env.PROD) {
    window.addEventListener('load', () => navigator.serviceWorker.register('/sw.js').catch(() => {}))
  } else {
    navigator.serviceWorker.getRegistrations().then((regs) => regs.forEach((r) => r.unregister()))
  }
}
