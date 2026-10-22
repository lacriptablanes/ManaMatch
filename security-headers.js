// Cabeceras de seguridad HTTP de ManaMatch.
// Se aplican en `npm run preview` (para probarlas en local) y al compilar se genera `dist/_headers`,
// el formato que usan Netlify y Cloudflare Pages. Si se publica en otro hosting, hay que copiarlas allí.

// Orígenes externos que la app necesita. Si se añade una API o un CDN de imágenes nuevo, va aquí.
const IMAGES = [
  'https://api.scryfall.com', 'https://cards.scryfall.io', // Magic (Scryfall redirige a su CDN)
  'https://images.pokemontcg.io', 'https://images.scrydex.com', // Pokémon
  'https://optcgapi.com', // One Piece
  'https://randomuser.me', // avatares de los jugadores de ejemplo
  'https://cdn.discordapp.com', // avatares de Discord (quien entra con Discord)
];
const APIS = ['https://api.scryfall.com', 'https://api.pokemontcg.io', 'https://*.supabase.co'];

// Política de contenido: solo se ejecuta el código propio y solo se conecta a los servicios de la lista
const CSP = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src https://fonts.gstatic.com",
  `img-src 'self' data: blob: ${IMAGES.join(' ')} https://*.supabase.co`,
  // El service worker descarga imágenes y tipografías con fetch, así que también van en connect-src
  `connect-src 'self' ${[...new Set([...APIS, ...IMAGES, 'https://fonts.googleapis.com', 'https://fonts.gstatic.com', 'https://*.supabase.co', 'wss://*.supabase.co'])].join(' ')}`,
  "worker-src 'self'",
  "manifest-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  'upgrade-insecure-requests',
].join('; ');

export const SECURITY_HEADERS = {
  'Content-Security-Policy': CSP,
  // Solo HTTPS durante dos años, también en subdominios
  'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload',
  // Nadie puede incrustar la app en otra web (evita engaños de "clickjacking")
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  // Permisos del navegador: nada de cámara, micro ni pagos; ubicación solo para la propia app
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(self), payment=(), usb=(), interest-cohort=()',
  'Cross-Origin-Opener-Policy': 'same-origin',
};

/* Genera el archivo `_headers` (Netlify / Cloudflare Pages) */
export function headersFile() {
  const all = Object.entries(SECURITY_HEADERS).map(([k, v]) => `  ${k}: ${v}`).join('\n');
  return [
    '/*', all, '',
    // El service worker no debe quedarse cacheado: así las actualizaciones llegan enseguida
    '/sw.js', '  Cache-Control: no-cache', '',
    // Los archivos con huella en el nombre no cambian nunca
    '/assets/*', '  Cache-Control: public, max-age=31536000, immutable', '',
  ].join('\n');
}
