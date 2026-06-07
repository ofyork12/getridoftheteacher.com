// Caches the app shell so it opens instantly and works as an installed app.
// Audio itself always streams from archive.org (not cached).
const CACHE = 'tomsawyer-v1';
const SHELL = ['index.html', 'cover.png', 'icon.png', 'manifest.webmanifest'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(k => k !== CACHE).map(k => caches.delete(k))
    )).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const url = e.request.url;
  // Never intercept the audio stream — let the browser handle range requests.
  if (url.includes('archive.org')) return;

  // HTML pages: network-first so updates show immediately; fall back to cache offline.
  if (e.request.mode === 'navigate' || url.endsWith('.html') || url.endsWith('/')) {
    e.respondWith(
      fetch(e.request)
        .then(res => { caches.open(CACHE).then(c => c.put(e.request, res.clone())); return res; })
        .catch(() => caches.match(e.request).then(hit => hit || caches.match('index.html')))
    );
    return;
  }

  // Static assets (icons, manifest): cache-first for speed.
  e.respondWith(caches.match(e.request).then(hit => hit || fetch(e.request)));
});
