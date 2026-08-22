// SYNCROZZ Link - Safe Service Worker for Production
const CACHE_NAME = 'syncrozz-link-cache-v1';
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/manifest.json',
  '/favicon.svg',
  '/favicon-32x32.png',
  '/favicon-16x16.png',
  '/icon-192.png',
  '/icon-512.png',
  '/icon-maskable-192.png',
  '/icon-maskable-512.png',
  '/apple-touch-icon.png',
  '/og-image.png',
  '/assets/og/syncrozz-link-og.png'
];

self.addEventListener('install', (event) => {
  // Activate new service worker immediately without waiting
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS).catch((err) => {
        console.warn('Service Worker precache warning:', err);
      });
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('[SW] Clearing legacy cache:', cache);
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // 1. Only handle GET requests
  if (request.method !== 'GET') {
    return;
  }

  // 2. CRITICAL: Never cache API endpoints, Firestore, or Admin auth
  // Must always be live to guarantee single-source-of-truth
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(fetch(request));
    return;
  }

  // 3. CRITICAL: Never cache short link redirection (/r/*) or dynamic paths
  if (url.pathname.startsWith('/r/')) {
    event.respondWith(fetch(request));
    return;
  }

  // 4. External or cross-origin requests (e.g. Firebase SDK, Google APIs, analytics)
  if (url.origin !== self.location.origin) {
    // Network-only for external requests
    event.respondWith(fetch(request));
    return;
  }

  // 5. Static assets (Vite compiled chunks, CSS, JS, images, icons, fonts)
  if (
    url.pathname.startsWith('/assets/') ||
    url.pathname.endsWith('.js') ||
    url.pathname.endsWith('.css') ||
    url.pathname.endsWith('.png') ||
    url.pathname.endsWith('.svg') ||
    url.pathname.endsWith('.jpg') ||
    url.pathname.endsWith('.woff2') ||
    url.pathname.endsWith('.webmanifest')
  ) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        const fetchPromise = fetch(request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              const responseToCache = networkResponse.clone();
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(request, responseToCache);
              });
            }
            return networkResponse;
          })
          .catch(() => cachedResponse);

        return cachedResponse || fetchPromise;
      })
    );
    return;
  }

  // 6. Navigation requests (HTML document) - Network First with Cache Fallback
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseToCache);
            });
          }
          return networkResponse;
        })
        .catch(async () => {
          const cached = await caches.match(request);
          if (cached) return cached;
          const indexFallback = await caches.match('/index.html');
          if (indexFallback) return indexFallback;
          return new Response(
            `<!DOCTYPE html>
            <html lang="ms">
            <head>
              <meta charset="UTF-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>Offline | SYNCROZZ Link</title>
              <style>
                body { background: #0A0A0B; color: #F4F4F5; font-family: system-ui, sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 20px; text-align: center; }
                .card { background: #18181B; border: 1px solid #27272A; border-radius: 16px; padding: 32px; max-width: 400px; width: 100%; }
                h1 { font-size: 20px; margin-bottom: 8px; color: #fff; }
                p { color: #A1A1AA; font-size: 14px; line-height: 1.5; margin-bottom: 20px; }
                button { background: #10B981; color: #09090B; border: none; padding: 10px 20px; border-radius: 8px; font-weight: bold; cursor: pointer; }
              </style>
            </head>
            <body>
              <div class="card">
                <h1>Anda Sedang Offline</h1>
                <p>Sambungan internet diperlukan untuk mengurus dan menggunakan short link SYNCROZZ.</p>
                <button onclick="window.location.reload()">Cuba Semula</button>
              </div>
            </body>
            </html>`,
            { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
          );
        })
    );
    return;
  }

  // Default: Network with Cache fallback
  event.respondWith(
    fetch(request).catch(() => caches.match(request))
  );
});
