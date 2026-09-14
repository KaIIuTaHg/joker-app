const CACHE_NAME = 'joker-cache-v3';
const ASSETS = ['./', './index.html', './manifest.json', './icon-192.png', './icon-512.png'];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS)).then(()=>self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k=>k!==CACHE_NAME).map(k=>caches.delete(k))))
    .then(()=>self.clients.claim())
  );
});

// HTML (the app itself): always try the network first, so updates are picked
// up immediately. Only use the cached copy if there's no internet.
// Everything else (icons, manifest): cache-first, since those rarely change.
self.addEventListener('fetch', event => {
  const req = event.request;
  const isHTML = req.mode === 'navigate' || (req.headers.get('accept') || '').includes('text/html');

  if(isHTML){
    event.respondWith(
      fetch(req).then(resp => {
        const copy = resp.clone();
        caches.open(CACHE_NAME).then(cache => cache.put('./index.html', copy));
        return resp;
      }).catch(()=>caches.match('./index.html'))
    );
    return;
  }

  event.respondWith(
    caches.match(req).then(cached => cached || fetch(req).then(resp => {
      const copy = resp.clone();
      caches.open(CACHE_NAME).then(cache => cache.put(req, copy));
      return resp;
    }))
  );
});
