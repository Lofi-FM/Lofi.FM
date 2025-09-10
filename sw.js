// Minimal service worker: keeps PWA install support but does not cache app shell or assets.
self.addEventListener('install', (e) => {
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  self.clients.claim();
});

// No fetch handler that caches anything. Just let network handle requests.
self.addEventListener('fetch', (e) => {
  // intentionally empty — no caching
});
