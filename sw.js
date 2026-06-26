// ===== SERVICE WORKER FOR TASK EXPERT PWA =====
const CACHE_NAME = 'task-expert-v1';
const urlsToCache = [
    '/',                           // root (user.html default)
    '/user.html',                  // main HTML file
    '/index.html',                 // fallback if index exists
    '/offline.html',               // offline fallback page (optional)
    '/manifest.json',
    '/launchericon-512x512.png',   // icon file (update name if different)
    'https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js',
    'https://www.gstatic.com/firebasejs/10.8.0/firebase-auth-compat.js',
    'https://www.gstatic.com/firebasejs/10.8.0/firebase-database-compat.js',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css'
];

// Install event - cache all required assets
self.addEventListener('install', function(event) {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(function(cache) {
                console.log('✅ Service Worker: Caching assets...');
                return cache.addAll(urlsToCache)
                    .catch(function(err) {
                        console.warn('⚠️ Some assets failed to cache:', err);
                    });
            })
            .then(function() {
                // Force the waiting service worker to become active
                return self.skipWaiting();
            })
    );
});

// Activate event - clean up old caches and claim clients
self.addEventListener('activate', function(event) {
    const cacheWhitelist = [CACHE_NAME];
    event.waitUntil(
        caches.keys().then(function(cacheNames) {
            return Promise.all(
                cacheNames.map(function(cacheName) {
                    if (cacheWhitelist.indexOf(cacheName) === -1) {
                        console.log('🗑️ Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
        .then(function() {
            // Take control of all clients immediately
            return self.clients.claim();
        })
    );
});

// Fetch event - serve from cache if available, otherwise fetch from network
self.addEventListener('fetch', function(event) {
    event.respondWith(
        caches.match(event.request)
            .then(function(response) {
                // If cached response exists, return it
                if (response) {
                    return response;
                }
                // Otherwise, fetch from network
                let fetchRequest = event.request.clone();
                return fetch(fetchRequest)
                    .then(function(response) {
                        // Check if response is valid
                        if (!response || response.status !== 200 || response.type !== 'basic') {
                            return response;
                        }
                        // Clone the response to cache it
                        let responseToCache = response.clone();
                        caches.open(CACHE_NAME)
                            .then(function(cache) {
                                cache.put(event.request, responseToCache);
                            });
                        return response;
                    })
                    .catch(function() {
                        // If network fails, try to return offline fallback page
                        return caches.match('/offline.html');
                    });
            })
    );
});