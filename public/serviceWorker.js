/**
 * QuranIQ Service Worker
 * Stable, production-safe version for Vercel + PWA + Play Store
 */

const CACHE_VERSION = 'quraniq-v1.0.1';
const CACHE_NAME = `quraniq-${CACHE_VERSION}`;

/**
 * ONLY local assets are pre-cached.
 * External CDN assets MUST NOT be included here,
 * or the install will fail.
 */
const CRITICAL_ASSETS = [
  '/',
  '/index.html',
  '/app.js',
  '/manifest.json',

  // Local JS
  '/utils/config.js',
  '/utils/api-client.js',
  '/utils/firebase.js',
  '/components/Logo.js'
];

/**
 * INSTALL
 */
self.addEventListener('install', (event) => {
  console.log('[ServiceWorker] Installing…');

  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[ServiceWorker] Caching critical assets');
        return cache.addAll(CRITICAL_ASSETS);
      })
      .then(() => self.skipWaiting())
      .catch((err) => {
        console.error('[ServiceWorker] Install failed:', err);
      })
  );
});

/**
 * ACTIVATE
 */
self.addEventListener('activate', (event) => {
  console.log('[ServiceWorker] Activating…');

  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name.startsWith('quraniq-') && name !== CACHE_NAME)
          .map((name) => {
            console.log('[ServiceWorker] Removing old cache:', name);
            return caches.delete(name);
          })
      );
    }).then(() => self.clients.claim())
  );
});

/**
 * FETCH
 * Cache-first for local static files
 * Network-first for everything else
 */
self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Only handle GET requests
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // Never cache API calls
  if (url.pathname.startsWith('/api/')) {
    return;
  }

  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        // Update cache in background
        fetch(request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            caches.open(CACHE_NAME)
              .then((cache) => cache.put(request, networkResponse.clone()));
          }
        }).catch(() => {});
        return cachedResponse;
      }

      // Not cached → fetch from network
      return fetch(request).then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          caches.open(CACHE_NAME)
            .then((cache) => cache.put(request, networkResponse.clone()));
        }
        return networkResponse;
      }).catch(() => {
        // Offline fallback
        return new Response('Offline', {
          status: 503,
          headers: { 'Content-Type': 'text/plain' }
        });
      });
    })
  );
});
