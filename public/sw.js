// SERVICE WORKER v7 - CORRIGIDO SEM LOOP
const CACHE_VERSION = 'v7-force-update';
const STATIC_CACHE = `sriphone-static-${CACHE_VERSION}`;
const DYNAMIC_CACHE = `sriphone-dynamic-${CACHE_VERSION}`;
const IMAGE_CACHE = `sriphone-images-${CACHE_VERSION}`;

const STATIC_ASSETS = [
  '/',
  '/catalogo',
  '/manifest.json',
  '/offline.html',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/fonts/Halenoir-Bold.otf',
  '/images/Barbudo.webp',
  '/favicon.webp',
  '/favicon.svg'
];

const MAX_CACHE_SIZE = 100;

// Instalação - Skip waiting imediato
self.addEventListener('install', (event) => {
  console.log('[SW] Installing:', CACHE_VERSION);
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        return Promise.allSettled(
          STATIC_ASSETS.map(url => 
            cache.add(url).catch(err => console.warn(`[SW] Failed to cache ${url}:`, err))
          )
        );
      })
      .then(() => {
        console.log('[SW] Skip waiting');
        return self.skipWaiting();
      })
  );
});

// Ativação - Limpa caches antigos
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating:', CACHE_VERSION);
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => name.startsWith('sriphone-') && !name.includes(CACHE_VERSION))
            .map((name) => {
              console.log('[SW] Deleting old cache:', name);
              return caches.delete(name);
            })
        );
      })
      .then(() => {
        console.log('[SW] Claiming clients');
        return self.clients.claim();
      })
  );
});

const limitCacheSize = (cacheName, maxItems) => {
  caches.open(cacheName).then((cache) => {
    cache.keys().then((keys) => {
      if (keys.length > maxItems) {
        cache.delete(keys[0]).then(() => limitCacheSize(cacheName, maxItems));
      }
    });
  });
};

// FETCH - Estratégia inteligente
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // NUNCA cachear APIs de admin
  if (url.pathname.startsWith('/api/admin/')) {
    return;
  }

  // NUNCA cachear outras APIs
  if (url.pathname.startsWith('/api/')) {
    return;
  }

  // NUNCA cachear páginas de admin
  if (url.pathname.startsWith('/admin/')) {
    return;
  }

  // Apenas GET
  if (request.method !== 'GET') return;
  
  // Imagens: Cache-First
  if (request.destination === 'image' || url.pathname.match(/\.(jpg|jpeg|png|gif|webp|svg)$/)) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        
        return fetch(request).then((response) => {
          return caches.open(IMAGE_CACHE).then((cache) => {
            cache.put(request, response.clone());
            limitCacheSize(IMAGE_CACHE, MAX_CACHE_SIZE);
            return response;
          });
        });
      })
    );
    return;
  }

  // CSS/JS: Cache-First
  if (request.destination === 'style' || request.destination === 'script' || url.pathname.match(/\.(css|js)$/)) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        
        return fetch(request).then((response) => {
          return caches.open(STATIC_CACHE).then((cache) => {
            cache.put(request, response.clone());
            return response;
          });
        }).catch(() => cached);
      })
    );
    return;
  }

  // Supabase: Network-First
  if (url.hostname.includes('supabase')) {
    event.respondWith(
      Promise.race([
        fetch(request).then((response) => {
          if (response.ok) {
            return caches.open(DYNAMIC_CACHE).then((cache) => {
              cache.put(request, response.clone());
              return response;
            });
          }
          return response;
        }),
        new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 3000))
      ]).catch(() => {
        return caches.match(request);
      })
    );
    return;
  }

  // Páginas: Network-First
  event.respondWith(
    fetch(request)
      .then((response) => {
        return caches.open(DYNAMIC_CACHE).then((cache) => {
          cache.put(request, response.clone());
          limitCacheSize(DYNAMIC_CACHE, 30);
          return response;
        });
      })
      .catch(() => {
        return caches.match(request).then((cached) => {
          return cached || caches.match('/offline.html');
        });
      })
  );
});

// Mensagens
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
