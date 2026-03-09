// ═══════════════════════════════════════
// Service Worker — مقرأة بيجي
// Version: 8
// ═══════════════════════════════════════

const CACHE_NAME   = 'beeji-v8';
const OFFLINE_PAGE = '/Ha/index.html';

const STATIC_ASSETS = [
  '/Ha/index.html',
  '/Ha/manifest.json',
  '/Ha/icon-192.png',
  '/Ha/icon-512.png',
  '/Ha/icon-96.png',
  '/Ha/icon-48.png',
  '/Ha/favicon.ico'
];

// ═══ Install ═══
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

// ═══ Activate ═══
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// ═══ Fetch ═══
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  // Firebase & Google APIs — شبكة أولاً
  if (event.request.url.includes('firebase') ||
      event.request.url.includes('googleapis') ||
      event.request.url.includes('firestore') ||
      event.request.url.includes('gstatic')) {
    return;
  }
  event.respondWith(
    fetch(event.request)
      .then(res => {
        const clone = res.clone();
        caches.open(CACHE_NAME).then(c => c.put(event.request, clone));
        return res;
      })
      .catch(() => caches.match(event.request).then(r => r || caches.match(OFFLINE_PAGE)))
  );
});

// ═══ Push Notification Click ═══
self.addEventListener('notificationclick', event => {
  event.notification.close();
  if (event.action === 'dismiss') return;
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
      for (const client of list) {
        if (client.url.includes('/Ha/') && 'focus' in client) return client.focus();
      }
      return clients.openWindow(OFFLINE_PAGE);
    })
  );
});

// ═══ Push Event ═══
self.addEventListener('push', event => {
  if (!event.data) return;
  const data = event.data.json();
  event.waitUntil(
    self.registration.showNotification(data.title || 'مقرأة بيجي', {
      body:    data.body  || '',
      icon:    '/Ha/icon-192.png',
      badge:   '/Ha/icon-96.png',
      vibrate: [200, 100, 200],
      dir:     'rtl',
      lang:    'ar',
      actions: [
        { action: 'open',    title: '📖 فتح التطبيق' },
        { action: 'dismiss', title: '✕ إغلاق' }
      ]
    })
  );
});

// ═══ تحديث تلقائي ═══
self.addEventListener('message', event => {
  if (event.data === 'skipWaiting') self.skipWaiting();
});
