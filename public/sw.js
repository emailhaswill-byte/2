// Service Worker for Prospector's Pal
const CACHE_NAME = 'prospectors-pal-v2';
const urlsToCache = [
  '/',
  '/index.html'
];

// Install event: Cache core static assets immediately
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(urlsToCache);
      })
  );
  self.skipWaiting();
});

// Fetch event: Stale-While-Revalidate Strategy
// This serves content from cache immediately (fast), then updates the cache from network (fresh)
self.addEventListener('fetch', (event) => {
  // Skip cross-origin requests (like Google API or Analytics) for generic caching
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }

  event.respondWith(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.match(event.request).then((response) => {
        const fetchPromise = fetch(event.request).then((networkResponse) => {
          // Check if we received a valid response
          if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
             // Update the cache with the new version
            cache.put(event.request, networkResponse.clone());
          }
          return networkResponse;
        }).catch(() => {
           // Network failed, nothing to do here, response will handle it if available
        });

        // Return cached response if found, otherwise wait for network
        return response || fetchPromise;
      });
    })
  );
});

// Activate event: Clean up old caches
self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});