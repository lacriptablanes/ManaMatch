// Service worker de ManaMatch: la app abre sin conexión y las imágenes de cartas
// se guardan en caché para ahorrar datos móviles.
const SHELL_CACHE = 'mm-shell-v1';
const MEDIA_CACHE = 'mm-media-v1';
const MAX_MEDIA = 300; // límite de imágenes guardadas
const SHELL = ['/', '/manifest.webmanifest', '/icon.svg', '/icon-192.png', '/icon-512.png', '/apple-touch-icon.png'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(SHELL_CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== SHELL_CACHE && k !== MEDIA_CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

/* Borra las imágenes más antiguas cuando se supera el límite */
const trim = async () => {
  const cache = await caches.open(MEDIA_CACHE);
  const keys = await cache.keys();
  await Promise.all(keys.slice(0, Math.max(0, keys.length - MAX_MEDIA)).map((k) => cache.delete(k)));
};

/* Devuelve lo guardado al instante y lo actualiza en segundo plano */
const staleWhileRevalidate = async (request) => {
  const cache = await caches.open(MEDIA_CACHE);
  const hit = await cache.match(request);
  const update = fetch(request)
    .then((res) => { if (res.ok || res.type === 'opaque') { cache.put(request, res.clone()).then(trim); } return res; })
    .catch(() => hit);
  return hit || update;
};

self.addEventListener('fetch', (e) => {
  const { request } = e;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);

  // Navegación: red primero y, sin conexión, la última versión guardada de la app
  if (request.mode === 'navigate') {
    e.respondWith(
      fetch(request)
        .then((res) => { const copy = res.clone(); caches.open(SHELL_CACHE).then((c) => c.put('/', copy)); return res; })
        .catch(() => caches.match('/')),
    );
    return;
  }

  // Recursos de la propia app (JS y CSS con nombre único en cada versión): caché primero
  if (url.origin === self.location.origin) {
    e.respondWith(
      caches.match(request).then((hit) => hit || fetch(request).then((res) => {
        if (res.ok) { const copy = res.clone(); caches.open(SHELL_CACHE).then((c) => c.put(request, copy)); }
        return res;
      })),
    );
    return;
  }

  // Imágenes de cartas, avatares y tipografías
  if (['image', 'font', 'style'].includes(request.destination)) {
    e.respondWith(staleWhileRevalidate(request));
  }
  // El resto (búsquedas en las APIs de cartas) va siempre a la red
});
