// Service Worker — cache de app-shell voor offline gebruik
const CACHE = 'voiceroute-v2';
const ASSETS = [
  '/',
  '/index.html',
  '/css/style.css',
  '/js/settings.js',
  '/js/router.js',
  '/js/api.js',
  '/js/voice.js',
  '/js/app.js',
  '/manifest.json'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Network-first voor API-calls, cache-first voor assets
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  // Webhook-calls altijd via netwerk
  if (url.hostname.includes('make.com') || url.hostname.includes('hook.')) {
    return; // geen interceptie
  }

  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request))
  );
});
