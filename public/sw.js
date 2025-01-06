// Service Worker для PWA
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open('openwebui-cache-v1').then((cache) => {
            return cache.addAll([
                '/',
                '/index.html',
                '/css/styles.css',
                '/js/app.js',
                '/js/db.js',
                '/js/env.js',
                '/js/config.js',
                '/manifest.json',
                '/images/icon-192x192.png',
                '/images/icon-512x512.png'
            ]);
        })
    );
});

self.addEventListener('fetch', (event) => {
    event.respondWith(
        fetch(event.request).catch(() => {
            return caches.match(event.request);
        })
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames
                    .filter((cacheName) => {
                        return cacheName.startsWith('openwebui-cache-') && 
                               cacheName !== 'openwebui-cache-v1';
                    })
                    .map((cacheName) => {
                        return caches.delete(cacheName);
                    })
            );
        })
    );
});

// Добавить стратегии кэширования
const CACHE_STRATEGIES = {
    NETWORK_FIRST: 'network-first',
    CACHE_FIRST: 'cache-first',
    STALE_WHILE_REVALIDATE: 'stale-while-revalidate'
}; 

// Улучшенное кэширование
workbox.routing.registerRoute(
    /\.(?:js|css|png)$/,
    new workbox.strategies.StaleWhileRevalidate()
);

// Offline fallback
workbox.routing.registerRoute(
    new RegExp('/api/.*'),
    new workbox.strategies.NetworkFirst()
); 