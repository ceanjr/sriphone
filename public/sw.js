const CACHE_VERSION = 'v25-dev-fix';
const STATIC_CACHE = `sriphone-static-${CACHE_VERSION}`;
const DYNAMIC_CACHE = `sriphone-dynamic-${CACHE_VERSION}`;
const IMAGE_CACHE = `sriphone-images-${CACHE_VERSION}`;
const API_CACHE = `sriphone-api-${CACHE_VERSION}`;

const STATIC_ASSETS = [
  '/',
  '/catalogo',
  '/manifest.json',
  '/offline.html',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/fonts/Halenoir-Bold.otf',
  '/images/Barbudo.webp',
  '/images/logo-fundo.webp',
  '/favicon.webp',
  '/favicon.svg'
];

const MAX_CACHE_SIZE = 100;
const API_CACHE_TIME = 5 * 60 * 1000; // 5 minutos

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

// Ativação - Limpa caches antigos E notifica clientes
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
      .then(() => {
        // Notificar todos os clientes para recarregar
        return self.clients.matchAll().then((clients) => {
          clients.forEach((client) => {
            client.postMessage({
              type: 'SW_UPDATED',
              version: CACHE_VERSION
            });
          });
        });
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

  // Ignorar chrome-extension e outros protocolos não-http
  if (!url.protocol.startsWith('http')) {
    return;
  }

  // DESENVOLVIMENTO: Não cachear localhost
  if (url.hostname === 'localhost' || url.hostname === '127.0.0.1' || url.port === '4321') {
    return;
  }

  // NUNCA cachear APIs de admin (leitura E escrita)
  if (url.pathname.startsWith('/api/admin/')) {
    return;
  }

  // NUNCA cachear páginas de admin
  if (url.pathname.startsWith('/admin')) {
    return;
  }

  // Apenas GET
  if (request.method !== 'GET') return;

  // API Pública (/api/produtos): Stale-While-Revalidate
  if (url.pathname === '/api/produtos') {
    event.respondWith(
      caches.open(API_CACHE).then((cache) => {
        return cache.match(request).then((cached) => {
          const fetchPromise = fetch(request).then((response) => {
            if (response.ok) {
              cache.put(request, response.clone());
            }
            return response;
          });

          // Retorna cache se existir, mas atualiza em background
          return cached || fetchPromise;
        });
      })
    );
    return;
  }

  // Outras APIs de admin (leitura): Network-First
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok && url.pathname.includes('/produtos')) {
            return caches.open(API_CACHE).then((cache) => {
              cache.put(request, response.clone());
              return response;
            });
          }
          return response;
        })
        .catch(() => caches.match(request))
    );
    return;
  }
  
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

  // Supabase Storage (imagens): Cache-First com revalidação
  if (url.hostname.includes('supabase') && url.pathname.includes('/storage/')) {
    event.respondWith(
      caches.match(request).then((cached) => {
        const fetchPromise = fetch(request).then((response) => {
          if (response.ok) {
            return caches.open(IMAGE_CACHE).then((cache) => {
              cache.put(request, response.clone());
              limitCacheSize(IMAGE_CACHE, MAX_CACHE_SIZE);
              return response;
            });
          }
          return response;
        }).catch(() => cached);

        return cached || fetchPromise;
      })
    );
    return;
  }

  // Outras requisições Supabase: Network-Only
  if (url.hostname.includes('supabase')) {
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
  
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => caches.delete(cacheName))
        );
      }).then(() => {
        console.log('[SW] All caches cleared');
      })
    );
  }
  
  if (event.data && event.data.type === 'CLEAR_API_CACHE') {
    event.waitUntil(
      caches.delete(API_CACHE).then(() => {
        console.log('[SW] API cache cleared');
      })
    );
  }
});
