/* V40: small critical shell, progressive asset caching, versioned offline store. */
const CACHE_NAME = 'bounce-tales-v40';
const APP_SHELL = [
  "./",
  "index.html",
  "style.css?v=40",
  "manifest.webmanifest",
  "sw.js?v=40",
  "src/image-map.json",
  "src/sprite-atlas.json",
  "assets/original/lang.xx",
  "assets/original/lang.bs-BA",
  "assets/original/lang.cs-CZ",
  "assets/original/lang.de",
  "assets/original/lang.hr-HR",
  "assets/original/lang.hu-HU",
  "assets/original/lang.mk-MK",
  "assets/original/lang.sk-SK",
  "assets/original/lang.sl-SI",
  "assets/original/lang.sq",
  "assets/original/lang.sr-YU",
  "assets/original/bf",
  "favicon.png",
  "icon-192.png",
  "icon-512.png",
  "apple-touch-icon.png",
  "src/fixed-point.js?v=40",
  "src/original-input-map.js?v=40",
  "src/original-camera.js?v=40",
  "src/rlef-reader.js?v=40",
  "src/bounce-physics.js?v=40",
  "src/terrain-collision.js?v=40",
  "src/original-collision.js?v=40",
  "src/game-timing.js?v=40",
  "src/event-engine.js?v=40",
  "src/original-sprite-animation.js?v=40",
  "src/original-enemies.js?v=40",
  "src/original-water.js?v=40",
  "src/original-trampoline.js?v=40",
  "src/midp-graphics.js?v=40",
  "src/original-progression.js?v=40",
  "src/game-particles.js?v=40",
  "src/sprite-atlas.js?v=40",
  "src/audio-controller.js?v=40",
  "src/control-layout.js?v=40",
  "game.js?v=40"
];
self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    // Do not make first launch wait for every original sprite, soundtrack, or preview.
    await Promise.allSettled(APP_SHELL.map(async path => {
      const url = new URL(path, self.registration.scope).toString();
      const request = new Request(url, { cache: 'reload' });
      const response = await fetch(request);
      if (response && response.ok && response.type === 'basic') await cache.put(request, response);
    }));
    await self.skipWaiting();
  })());
});
self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(key => key.startsWith('bounce-tales-') && key !== CACHE_NAME).map(key => caches.delete(key)));
    await self.clients.claim();
  })());
});
self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);
    // Shell and previously used resources are served immediately on repeat visits.
    const cached = await cache.match(request);
    if (cached) return cached;
    try {
      const response = await fetch(request);
      if (response && response.ok && response.type === 'basic') await cache.put(request, response.clone());
      return response;
    } catch (error) {
      const keys = await cache.keys();
      const fallback = keys.find(key => {
        const candidate = new URL(key.url);
        return candidate.origin === url.origin && candidate.pathname === url.pathname;
      });
      if (fallback) return cache.match(fallback);
      if (request.mode === 'navigate') {
        const shell = await cache.match(new URL('index.html', self.registration.scope).toString());
        if (shell) return shell;
      }
      throw error;
    }
  })());
});
