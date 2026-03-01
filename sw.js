/* Simple offline-first SW (Netlify-ready) */
const CACHE_NAME = 'alyuma-v1';
const CORE_ASSETS = [
  '/',
  '/index.html',
  '/about.html',
  '/services.html',
  '/projects.html',
  '/branches.html',
  '/contact.html',
  '/tender.html',
  '/investor.html',
  '/assets/css/styles.css',
  '/assets/js/app.js',
  '/manifest.json',
  '/assets/img/logo-mark.svg',
  '/assets/img/favicon.svg',
  '/assets/img/avatar.svg',
  '/content/settings.json',
  '/content/ticker.json',
  '/content/services.json',
  '/content/projects.json',
  '/content/branches.json',
  '/content/testimonials.json',
  '/content/certifications.json',
  '/content/investor.json',
  '/content/tender.json',
  '/content/clients.json'
];

self.addEventListener('install', (event)=>{
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache=>cache.addAll(CORE_ASSETS)).then(()=>self.skipWaiting())
  );
});

self.addEventListener('activate', (event)=>{
  event.waitUntil(
    caches.keys().then(keys=>Promise.all(keys.map(k=>k===CACHE_NAME?null:caches.delete(k)))).then(()=>self.clients.claim())
  );
});

self.addEventListener('fetch', (event)=>{
  const req = event.request;
  if(req.method !== 'GET') return;

  const url = new URL(req.url);
  // Network-first for JSON content (so CMS edits show quickly), fallback to cache.
  if(url.pathname.startsWith('/content/')){
    event.respondWith(
      fetch(req).then(res=>{
        const copy = res.clone();
        caches.open(CACHE_NAME).then(cache=>cache.put(req, copy));
        return res;
      }).catch(()=>caches.match(req))
    );
    return;
  }

  // Cache-first for static assets, fallback to network
  event.respondWith(
    caches.match(req).then(cached=>{
      if(cached) return cached;
      return fetch(req).then(res=>{
        const copy = res.clone();
        caches.open(CACHE_NAME).then(cache=>cache.put(req, copy));
        return res;
      }).catch(()=>caches.match('/index.html'));
    })
  );
});
