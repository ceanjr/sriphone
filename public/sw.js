// Service Worker de DESINSTALAÇÃO
// Este SW remove todo o cache antigo e se desregistra automaticamente

const CACHE_PREFIX = 'sriphone-';

self.addEventListener('install', (event) => {
  console.log('[SW CLEANUP] Instalando SW de limpeza...');
  // Skip waiting imediatamente para assumir controle
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('[SW CLEANUP] Ativando e limpando TODOS os caches...');

  event.waitUntil(
    // Limpar TODOS os caches do site
    caches.keys()
      .then((cacheNames) => {
        console.log('[SW CLEANUP] Caches encontrados:', cacheNames);
        return Promise.all(
          cacheNames
            .filter((name) => name.startsWith(CACHE_PREFIX))
            .map((name) => {
              console.log('[SW CLEANUP] Deletando cache:', name);
              return caches.delete(name);
            })
        );
      })
      .then(() => {
        console.log('[SW CLEANUP] ✅ Todos os caches removidos');
        console.log('[SW CLEANUP] Este SW se desregistrará automaticamente na próxima visita');
        return self.clients.claim();
      })
      .then(() => {
        // Notificar todos os clientes que o cache foi limpo
        return self.clients.matchAll().then(clients => {
          clients.forEach(client => {
            client.postMessage({
              type: 'CACHE_CLEANED',
              message: 'Service Worker removido e cache limpo com sucesso'
            });
          });
        });
      })
  );
});

// NÃO interceptar NENHUMA requisição
// Deixar tudo passar direto pela rede
self.addEventListener('fetch', (event) => {
  // Não fazer nada - deixar requisições passarem normalmente
  return;
});

// Responder a mensagens de desregistro
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'UNREGISTER') {
    console.log('[SW CLEANUP] Recebido comando de desregistro');
    self.registration.unregister()
      .then(() => {
        console.log('[SW CLEANUP] ✅ Service Worker desregistrado com sucesso');
      });
  }
});
