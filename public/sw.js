/* Almacena únicamente recursos estáticos de la aplicación, nunca archivos de pacientes. */
const CACHE = 'vera-dicom-shell-v1';
const SCOPE = self.registration.scope;
self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    try {
      const response = await fetch(new URL('precache.json', SCOPE), { cache: 'reload' });
      if (response.ok) {
        const assets = await response.json();
        await cache.addAll(assets.map((file) => new URL(file, SCOPE).href));
      }
    } catch (error) { console.warn('Precarga parcial:', error); }
    await self.skipWaiting();
  })());
});
self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((key) => key.startsWith('vera-dicom-') && key !== CACHE).map((key) => caches.delete(key)));
    await self.clients.claim();
  })());
});
self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== location.origin || !url.href.startsWith(SCOPE)) return;
  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const hit = await cache.match(request, { ignoreSearch: true });
    if (hit) return hit;
    const response = await fetch(request);
    if (response.ok && response.type === 'basic') await cache.put(request, response.clone());
    return response;
  })());
});
