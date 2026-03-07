// ══════════════════════════════════════
// مقرأة بيجي - Service Worker
// ══════════════════════════════════════
const CACHE_NAME = 'beeji-v3';
const BASE = '/Ha/';

const ASSETS = [
  BASE,
  BASE + 'index.html',
  BASE + 'manifest.json',
  BASE + 'icon-192.png',
  BASE + 'icon-512.png',
  'https://fonts.googleapis.com/css2?family=Scheherazade+New:wght@400;700&family=Cairo:wght@300;400;700;900&display=swap',
  'https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js',
  'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore-compat.js'
];

// ── INSTALL ──
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(ASSETS.slice(0, 5))) // فقط الملفات المحلية
      .catch(() => {})
  );
  self.skipWaiting();
});

// ── ACTIVATE ──
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// ── FETCH ──
self.addEventListener('fetch', e => {
  // تجاهل Firebase وطلبات غير HTTP
  const url = e.request.url;
  if (!url.startsWith('http') || url.includes('firestore') || url.includes('firebase')) {
    return;
  }

  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request)
        .then(resp => {
          // حفظ نسخة في الكاش للاستخدام offline
          if (resp && resp.status === 200 && resp.type !== 'opaque') {
            const clone = resp.clone();
            caches.open(CACHE_NAME).then(c => c.put(e.request, clone));
          }
          return resp;
        })
        .catch(() => {
          // offline fallback
          if (e.request.destination === 'document') {
            return caches.match(BASE + 'index.html');
          }
        });
    })
  );
});
