const CACHE_NAME = 'gibbs-bakehouse-loyalty-v1';
const PRECACHE = [
  '/', '/index.html', '/manifest.json',
  '/icon-192x192.png', '/icon-512x512.png',
  '/logo_cream.svg', '/icon_cream.svg'
];
self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(PRECACHE)));
  self.skipWaiting();
});
self.addEventListener('activate', (event) => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.map(k => k !== CACHE_NAME && caches.delete(k)))));
  self.clients.claim();
});
self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  event.respondWith((async () => {
    try {
      const network = await fetch(request);
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, network.clone());
      return network;
    } catch (e) {
      const cached = await caches.match(request, { ignoreSearch: true });
      if (cached) return cached;
      if (request.mode === 'navigate') return caches.match('/index.html');
      throw e;
    }
  })());
});
