// Service Worker pour Villa SaaS PWA
const CACHE_NAME = 'villa-saas-v1';
const urlsToCache = [
  '/',
  '/offline.html'
];

// Installation du Service Worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Cache ouvert');
        // On ne cache que la page offline pour l'instant
        return cache.addAll(urlsToCache).catch(err => {
          console.log('Erreur lors du cache initial:', err);
          // Continue même si le cache échoue
          return Promise.resolve();
        });
      })
  );
  self.skipWaiting();
});

// Activation du Service Worker
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Suppression de l\'ancien cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  return self.clients.claim();
});

// Stratégie de cache : Network First avec fallback
self.addEventListener('fetch', (event) => {
  // Ignore les requêtes non-GET
  if (event.request.method !== 'GET') {
    return;
  }

  // Ignore les requêtes API
  if (event.request.url.includes('/api/')) {
    return;
  }

  // Ignore les requêtes vers des domaines externes
  const requestUrl = new URL(event.request.url);
  const currentUrl = new URL(self.location);
  if (requestUrl.origin !== currentUrl.origin) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Ne cache que les réponses valides
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }

        // Clone la réponse pour le cache
        const responseToCache = response.clone();

        caches.open(CACHE_NAME)
          .then((cache) => {
            // Cache les assets statiques
            if (event.request.url.match(/\.(js|css|png|jpg|jpeg|svg|webp|woff2?)$/)) {
              cache.put(event.request, responseToCache);
            }
          });

        return response;
      })
      .catch(() => {
        // En cas d'erreur réseau, essayer le cache
        return caches.match(event.request)
          .then((response) => {
            if (response) {
              return response;
            }
            // Si c'est une page HTML, retourner la page offline
            if (event.request.headers.get('accept').includes('text/html')) {
              return caches.match('/offline.html');
            }
          });
      })
  );
});

// Écouter les messages du client
self.addEventListener('message', (event) => {
  if (event.data && event.data.action === 'skipWaiting') {
    self.skipWaiting();
  }
});

// Notification de mise à jour disponible
self.addEventListener('controllerchange', () => {
  self.clients.matchAll().then(clients => {
    clients.forEach(client => {
      client.postMessage({
        type: 'SW_UPDATE_AVAILABLE'
      });
    });
  });
});