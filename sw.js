const CACHE_NAME = 'hris-bro-v2.5-cache';
const ASSETS_TO_CACHE = [
  './index.html',
  './manifest.json',
  'https://cdn.tailwindcss.com',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
  'https://cdn.jsdelivr.net/npm/chart.js'
];

// Install Event: Mengunduh dan menyimpan aset ke cache
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Caching static assets');
      return cache.addAll(ASSETS_TO_CACHE);
    }).catch(err => console.log('[Service Worker] Cache install failed:', err))
  );
  self.skipWaiting();
});

// Activate Event: Membersihkan cache lama jika ada pembaruan versi
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[Service Worker] Removing old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch Event: Strategi Network-First untuk halaman utama & Cache-First untuk aset CDN
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Abaikan request POST atau request ke Google Apps Script backend agar selalu mengambil data real-time
  if (event.request.method !== 'GET' || url.hostname.includes('script.google.com')) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Jika Berhasil dari Network, perbarui cache
        if (response && response.status === 200) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        // Jika offline, ambil dari cache
        return caches.match(event.request);
      })
  );
});
