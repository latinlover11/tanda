/* Tanda service worker — the ledger must open with no signal.
   The shell is precached on install; everything else (fonts,
   versioned assets) fills the cache as it's first used.
   Matching with ignoreSearch keeps the ?v=N cache-busters in
   index.html decoupled from this file. */
const CACHE = 'tanda-v2';
const SHELL = ['./', './index.html', './app.js', './styles.css', './manifest.webmanifest', './icon.svg'];

const cacheable = (res) => !!res && (res.ok || res.type === 'opaque');

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE)
      .then((c) => Promise.allSettled(SHELL.map((u) => c.add(u))))
      .then(() => self.skipWaiting())
      .catch(() => {})
  );
});

self.addEventListener('message', (e) => {
  if (e.data === 'skipWaiting') self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  // The shared ledger is never cacheable — every read must see
  // the latest state, and a cached miss would fake being offline.
  if (new URL(req.url).pathname.startsWith('/api/')) return;
  e.respondWith((async () => {
    const hit = await caches.match(req, { ignoreSearch: true });

    // Static assets answer from cache without waiting on the network,
    // and refresh themselves in the background.
    if (hit && req.mode !== 'navigate') {
      fetch(req).then((res) => {
        if (cacheable(res)) {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
        }
      }).catch(() => {});
      return hit;
    }

    // Navigations prefer the network so a deploy lands immediately;
    // offline (or a dead origin) falls back to whatever is cached.
    try {
      const res = await fetch(req);
      if (cacheable(res)) {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
      }
      return res;
    } catch (err) {
      if (hit) return hit;
      const shell = await caches.match('./index.html');
      if (shell && req.mode === 'navigate') return shell;
      throw err;
    }
  })());
});
