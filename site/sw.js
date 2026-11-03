const VERSION = 'awradna-e22099d2';
const SHELL = ['./', 'index.html', 'manifest.webmanifest', 'icons/icon-192.png'];
self.addEventListener('install', (e) => { e.waitUntil(caches.open(VERSION).then(c => c.addAll(SHELL)).then(() => self.skipWaiting())); });
self.addEventListener('activate', (e) => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== VERSION && k !== 'awradna-pages').map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET') return;
  if (url.pathname.includes('/pages/')) {
    // book pages: cache first, forever
    e.respondWith(caches.open('awradna-pages').then(async c => { const hit = await c.match(e.request); if (hit) return hit; const res = await fetch(e.request); if (res.ok) c.put(e.request, res.clone()); return res; }));
    return;
  }
  if (url.origin === location.origin) {
    // app shell: network first, fall back to cache
    e.respondWith(fetch(e.request).then(res => { const copy = res.clone(); caches.open(VERSION).then(c => c.put(e.request, copy)); return res; }).catch(() => caches.match(e.request).then(r => r || caches.match('index.html'))));
    return;
  }
  // fonts: cache first
  e.respondWith(caches.open('awradna-ext').then(async c => { const hit = await c.match(e.request); if (hit) return hit; try { const res = await fetch(e.request); if (res.ok) c.put(e.request, res.clone()); return res; } catch (err) { return hit || Response.error(); } }));
});
