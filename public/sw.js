const CACHE_VERSION = 'v6-pwa';
const STATIC_CACHE = `sriphone-static-${CACHE_VERSION}`;
const DYNAMIC_CACHE = `sriphone-dynamic-${CACHE_VERSION}`;
const IMAGE_CACHE = `sriphone-images-${CACHE_VERSION}`;

// Assets críticos para cache agressivo (apenas arquivos que existem)
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

const MAX_CACHE_SIZE = 100; // Aumentado para performance
const MAX_CACHE_AGE = 30 * 24 * 60 * 60 * 1000; // 30 dias - mais agressivo

// Instalação - cachear assets estáticos (com tratamento de erro)
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        // Cachear individualmente para evitar falha total
        return Promise.allSettled(
          STATIC_ASSETS.map(url => 
            cache.add(url).catch(err => console.warn(`Failed to cache ${url}:`, err))
          )
        );
      })
      .then(() => self.skipWaiting())
  );
});

// Ativação - limpar caches antigos
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => name.startsWith('sriphone-') && name !== STATIC_CACHE && name !== DYNAMIC_CACHE && name !== IMAGE_CACHE)
            .map((name) => caches.delete(name))
        );
      })
      .then(() => self.clients.claim())
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

// Fetch - estratégias diferentes por tipo de recurso
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // NUNCA cachear rotas de API do admin (POST, PUT, DELETE, GET)
  if (url.pathname.startsWith('/api/admin/')) {
    return; // Deixa passar direto, sem cache
  }

  // NUNCA cachear outras APIs internas
  if (url.pathname.startsWith('/api/')) {
    return; // Deixa passar direto, sem cache
  }

  // Ignorar requisições não-GET
  if (request.method !== 'GET') return;
  
  // Estratégia para imagens: Cache-First
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

  // Estratégia para CSS/JS: Cache-First com fallback
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

  // Estratégia para API Supabase: Network-First com timeout
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

  // Estratégia padrão para páginas: Network-First
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
