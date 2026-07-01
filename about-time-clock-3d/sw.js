/* About Time 3D — network-first; own cache prefix so it won't clash with the 2D clock */
const CACHE = 'atc3d-v10';
const ASSETS = ['./', './index.html', './manifest.webmanifest', './three.min.js', './cannon.min.js',
  './gfx/device_frozen_time.png', './gfx/device_frozen_time_slow.png', './gfx/device_frozen_reset.png', './gfx/device_frozen_time_fast.png',
  './icons/icon-192.png', './icons/icon-512.png', './icons/maskable-512.png', './icons/icon-180.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k.startsWith('atc3d-') && k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;
  e.respondWith(
    fetch(req, {cache:'no-cache'}).then(res => { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)).catch(()=>{}); return res; })
      .catch(() => caches.match(req).then(hit => hit || caches.match('./index.html')))
  );
});
