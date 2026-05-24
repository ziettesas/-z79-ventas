// ══════════════════════════════════════════════════
//  Ziette Z79 — Service Worker v1.1
//  Estrategia: cache-first para assets locales,
//  network-first para CDNs externos.
// ══════════════════════════════════════════════════
const CACHE  = 'ziette-z79-v1.3';
const LOCAL  = [
  './mapa-ventas-ziette.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
];
const CDNS   = [
  'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js',
];

// Instalación: pre-cachear assets locales + CDNs
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll([...LOCAL, ...CDNS]))
      .then(() => self.skipWaiting())
  );
});

// Activación: borrar caches viejos
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Fetch: cache-first para assets, network-first para el resto
self.addEventListener('fetch', e => {
  const url = e.request.url;
  const isLocal = LOCAL.some(p => url.endsWith(p.replace('./', '')));
  const isCDN   = CDNS.some(p => url.startsWith(p));

  if (isLocal || isCDN) {
    // Cache-first
    e.respondWith(
      caches.match(e.request).then(r => r || fetch(e.request).then(res => {
        const clone = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, clone));
        return res;
      }))
    );
  }
  // El resto (archivos Excel del usuario) pasan directo
});
