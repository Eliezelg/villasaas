// Service Worker minimal pour éviter l'erreur 404
self.addEventListener('install', function(event) {
  self.skipWaiting();
});

self.addEventListener('activate', function(event) {
  event.waitUntil(clients.claim());
});

self.addEventListener('fetch', function(event) {
  // Pas de cache pour l'instant
  event.respondWith(fetch(event.request));
});