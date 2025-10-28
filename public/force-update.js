// SISTEMA DE FORÇA DE ATUALIZAÇÃO
// Garante que TODOS os usuários atualizem para a versão mais recente

const CURRENT_VERSION = '7.0.0'; // Incrementar a cada deploy crítico
const VERSION_KEY = 'app-version';
const LAST_CHECK_KEY = 'last-version-check';
const CHECK_INTERVAL = 5 * 60 * 1000; // Verificar a cada 5 minutos

// Verificar versão no localStorage
function checkVersion() {
  try {
    const storedVersion = localStorage.getItem(VERSION_KEY);
    const lastCheck = localStorage.getItem(LAST_CHECK_KEY);
    const now = Date.now();

    // Se versão diferente, forçar atualização
    if (storedVersion && storedVersion !== CURRENT_VERSION) {
      console.log(`🔄 Versão desatualizada: ${storedVersion} → ${CURRENT_VERSION}`);
      forceUpdate();
      return;
    }

    // Se nunca verificou ou passou do intervalo, verificar novamente
    if (!lastCheck || (now - parseInt(lastCheck)) > CHECK_INTERVAL) {
      localStorage.setItem(LAST_CHECK_KEY, now.toString());
      
      // Verificar se há nova versão no servidor
      fetch('/version.json?t=' + now, { cache: 'no-store' })
        .then(r => r.json())
        .then(data => {
          if (data.version !== CURRENT_VERSION) {
            console.log(`🔄 Nova versão disponível: ${data.version}`);
            forceUpdate();
          } else {
            localStorage.setItem(VERSION_KEY, CURRENT_VERSION);
          }
        })
        .catch(err => {
          console.warn('Erro ao verificar versão:', err);
          // Se não conseguiu verificar, atualiza mesmo assim por segurança
          localStorage.setItem(VERSION_KEY, CURRENT_VERSION);
        });
    }
  } catch (error) {
    console.error('Erro no checkVersion:', error);
  }
}

// Forçar atualização completa
async function forceUpdate() {
  console.log('🔄 Forçando atualização...');

  try {
    // 1. Limpar todo o localStorage (exceto auth)
    const authToken = localStorage.getItem('sb-access-token');
    const authRefresh = localStorage.getItem('sb-refresh-token');
    
    localStorage.clear();
    
    if (authToken) localStorage.setItem('sb-access-token', authToken);
    if (authRefresh) localStorage.setItem('sb-refresh-token', authRefresh);
    localStorage.setItem(VERSION_KEY, CURRENT_VERSION);

    // 2. Limpar sessionStorage
    sessionStorage.clear();

    // 3. Desregistrar service workers antigos
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      for (const registration of registrations) {
        await registration.unregister();
        console.log('✓ SW desregistrado');
      }
    }

    // 4. Limpar todos os caches
    const cacheNames = await caches.keys();
    for (const cacheName of cacheNames) {
      await caches.delete(cacheName);
      console.log('✓ Cache deletado:', cacheName);
    }

    // 5. Recarregar sem cache
    console.log('✓ Recarregando...');
    window.location.reload(true);
  } catch (error) {
    console.error('Erro ao forçar atualização:', error);
    // Mesmo com erro, tenta recarregar
    window.location.reload(true);
  }
}

// Escutar mensagens do Service Worker
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'FORCE_RELOAD') {
      console.log('📨 Mensagem do SW: FORCE_RELOAD');
      forceUpdate();
    }
  });

  // Detectar quando há novo SW esperando
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    console.log('📨 Controller change detectado');
    forceUpdate();
  });
}

// Verificar versão na inicialização
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', checkVersion);
} else {
  checkVersion();
}

// Verificar periodicamente
setInterval(checkVersion, CHECK_INTERVAL);

// Expor função global para debug
window.forceUpdate = forceUpdate;
window.checkVersion = checkVersion;

console.log(`✓ Sistema de atualização ativo - Versão ${CURRENT_VERSION}`);
