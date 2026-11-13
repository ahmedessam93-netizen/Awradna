// Awradna on GitHub Pages (iPhone Home Screen): works with no connection at all.
// On the first open it saves the whole app, every page of the book included, so the next
// open needs no internet. A new version replaces the saved copy the next time there is a
// connection. The file list and version are filled in by build_pages.sh.
const VERSION = '__VERSION__';
const FILES = __FILES__;
const CACHE = 'awradna-pages-' + VERSION;
const BASE = new URL('./', self.location).pathname;           // /Awradna/app/

self.addEventListener('install', (e) => {
  e.waitUntil((async () => {
    const c = await caches.open(CACHE);
    // the app itself first, so it opens offline even if the pages are still coming
    await c.addAll([BASE, ...FILES.filter((f) => !f.includes('/pages/')).map((f) => BASE + f)]);
    const pages = FILES.filter((f) => f.includes('/pages/'));
    for (let i = 0; i < pages.length; i += 8) {
      await Promise.all(pages.slice(i, i + 8).map((f) => c.add(BASE + f).catch(() => {})));
    }
    self.skipWaiting();
  })());
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k.startsWith('awradna-pages-') && k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== location.origin || !url.pathname.startsWith(BASE)) return;
  // opening the app or any of its screens: the saved app, then the network for updates
  if (req.mode === 'navigate') {
    e.respondWith((async () => {
      const c = await caches.open(CACHE);
      try { const res = await fetch(req); if (res.ok) c.put(BASE, res.clone()); return res; }
      catch (err) { return (await c.match(BASE)) || Response.error(); }
    })());
    return;
  }
  // everything else never changes once built: saved copy first
  e.respondWith((async () => {
    const c = await caches.open(CACHE);
    const hit = await c.match(req, { ignoreSearch: true }); if (hit) return hit;
    try { const res = await fetch(req); if (res.ok) c.put(req, res.clone()); return res; }
    catch (err) { return Response.error(); }
  })());
});
