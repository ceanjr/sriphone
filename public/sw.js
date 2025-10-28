// VERSÃO CRÍTICA - FORÇA ATUALIZAÇÃO IMEDIATA
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
const MAX_CACHE_AGE = 30 * 24 * 60 * 60 * 1000;

// INSTALAÇÃO - Força skip waiting imediato
self.addEventListener('install', (event) => {
  console.log('[SW] Installing version:', CACHE_VERSION);
  
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
        console.log('[SW] Skip waiting - force activation');
        return self.skipWaiting(); // FORÇA ativação imediata
      })
  );
});

// ATIVAÇÃO - Limpa tudo e assume controle imediatamente
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating version:', CACHE_VERSION);
  
  event.waitUntil(
    Promise.all([
      // Limpar TODOS os caches antigos
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => name.startsWith('sriphone-') && !name.includes(CACHE_VERSION))
            .map((name) => {
              console.log('[SW] Deleting old cache:', name);
              return caches.delete(name);
            })
        );
      }),
      // Assume controle de TODAS as páginas imediatamente
      self.clients.claim()
    ]).then(() => {
      console.log('[SW] Activated and claimed all clients');
      
      // Notifica TODOS os clientes para recarregar
      return self.clients.matchAll().then(clients => {
        clients.forEach(client => {
          console.log('[SW] Sending reload message to client');
          client.postMessage({
            type: 'FORCE_RELOAD',
            version: CACHE_VERSION
          });
        });
      });
    })
  );
});

// Limitar tamanho do cache
const limitCacheSize = (cacheName, maxItems) => {
  caches.open(cacheName).then((cache) => {
    cache.keys().then((keys) => {
      if (keys.length > maxItems) {
        cache.delete(keys[0]).then(() => limitCacheSize(cacheName, maxItems));
      }
    });
  });
};

// FETCH - Com exclusões críticas
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // ❌ NUNCA cachear APIs de admin
  if (url.pathname.startsWith('/api/admin/')) {
    return; // Bypass - vai direto pro servidor
  }

  // ❌ NUNCA cachear outras APIs
  if (url.pathname.startsWith('/api/')) {
    return; // Bypass
  }

  // ❌ NUNCA cachear páginas de admin
  if (url.pathname.startsWith('/admin/')) {
    return; // Bypass
  }

  // Apenas GET requests
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

  // Supabase: Network-First com timeout
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

// Mensagens dos clientes
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
