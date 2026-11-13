/* Bounce Tales V31: always prefer the live network; use the versioned shell offline. */
const CACHE_NAME = 'bounce-tales-v36';
const APP_SHELL = [
  "./",
  "index.html",
  "style.css?v=33",
  "game.js?v=33",
  "manifest.webmanifest",
  "icon-192.png",
  "icon-512.png",
  "apple-touch-icon.png",
  "favicon.png",
  "bounce-tales-web-preview.png",
  "LICENSE",
  "README.md",
  "ARCHITECTURE.md",
  "src/audio-controller.js?v=33",
  "src/bounce-physics.js?v=33",
  "src/event-engine.js?v=33",
  "src/fixed-point.js?v=33",
  "src/game-particles.js?v=33",
  "src/game-timing.js?v=33",
  "src/image-map.json",
  "assets/logo-transparent.png",
  "src/midp-graphics.js?v=33",
  "src/original-camera.js?v=33",
  "src/original-collision.js?v=33",
  "src/original-enemies.js?v=33",
  "src/original-input-map.js?v=33",
  "src/original-progression.js?v=33",
  "src/original-sprite-animation.js?v=33",
  "src/original-trampoline.js?v=33",
  "src/original-water.js?v=33",
  "src/rlef-reader.js?v=33",
  "src/sprite-atlas.js?v=33",
  "src/sprite-atlas.json",
  "src/terrain-collision.js?v=33",
  "assets/audio/act1.ogg",
  "assets/audio/act2.ogg",
  "assets/audio/act3.ogg",
  "assets/audio/bonus.ogg",
  "assets/audio/boss.ogg",
  "assets/audio/lose.ogg",
  "assets/audio/title.ogg",
  "assets/audio/win.ogg",
  "assets/original/META-INF/MANIFEST.MF",
  "assets/original/RMIDlet.class",
  "assets/original/a",
  "assets/original/a.class",
  "assets/original/aa.png",
  "assets/original/ab.png",
  "assets/original/ac.png",
  "assets/original/ad.png",
  "assets/original/ae.png",
  "assets/original/af.png",
  "assets/original/ag.png",
  "assets/original/ah.png",
  "assets/original/ai.png",
  "assets/original/aj.png",
  "assets/original/ak.png",
  "assets/original/al.png",
  "assets/original/am.png",
  "assets/original/an.png",
  "assets/original/ao.png",
  "assets/original/ap.png",
  "assets/original/aq.png",
  "assets/original/ar.png",
  "assets/original/as.png",
  "assets/original/at.png",
  "assets/original/au.png",
  "assets/original/av.png",
  "assets/original/aw.mid",
  "assets/original/ax.mid",
  "assets/original/ay.mid",
  "assets/original/az.mid",
  "assets/original/b",
  "assets/original/b.class",
  "assets/original/ba.mid",
  "assets/original/bb.mid",
  "assets/original/bc.mid",
  "assets/original/bd.mid",
  "assets/original/be",
  "assets/original/bf",
  "assets/original/bg",
  "assets/original/bh",
  "assets/original/bi",
  "assets/original/bj",
  "assets/original/bk",
  "assets/original/bl",
  "assets/original/bm",
  "assets/original/bn",
  "assets/original/bo",
  "assets/original/bp",
  "assets/original/bq",
  "assets/original/br",
  "assets/original/bs",
  "assets/original/bt",
  "assets/original/bu",
  "assets/original/bv",
  "assets/original/c.class",
  "assets/original/c.png",
  "assets/original/d.class",
  "assets/original/d.png",
  "assets/original/e.class",
  "assets/original/e.png",
  "assets/original/f.class",
  "assets/original/f.png",
  "assets/original/g.class",
  "assets/original/g.png",
  "assets/original/h.class",
  "assets/original/h.png",
  "assets/original/i.class",
  "assets/original/i.png",
  "assets/original/icon.png",
  "assets/original/j.class",
  "assets/original/j.png",
  "assets/original/k.class",
  "assets/original/k.png",
  "assets/original/l.class",
  "assets/original/l.png",
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
  "assets/original/lang.xx",
  "assets/original/m.class",
  "assets/original/m.png",
  "assets/original/n.class",
  "assets/original/n.png",
  "assets/original/o.class",
  "assets/original/o.png",
  "assets/original/p.class",
  "assets/original/p.png",
  "assets/original/q.class",
  "assets/original/q.png",
  "assets/original/r.class",
  "assets/original/r.png",
  "assets/original/s.png",
  "assets/original/t.png",
  "assets/original/u.png",
  "assets/original/v.png",
  "assets/original/w.png",
  "assets/original/x.png",
  "assets/original/y.png",
  "assets/original/z.png",
  "assets/pwa-192.png",
  "assets/pwa-512.png",
  "sw.js",
];
self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    await cache.addAll(APP_SHELL.map(path => new URL(path, self.registration.scope).toString()));
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
    try {
      const response = await fetch(request, {cache:'no-store'});
      if (response && response.ok && response.type === 'basic') {
        await cache.put(request, response.clone());
      }
      return response;
    } catch (error) {
      const exact = await cache.match(request);
      if (exact) return exact;
      const samePath = await cache.keys();
      const fallback = samePath.find(key => {
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
