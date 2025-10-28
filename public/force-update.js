// SISTEMA DE ATUALIZAÇÃO - VERSÃO CORRIGIDA (SEM LOOP)
const CURRENT_VERSION = '7.0.0';
const VERSION_KEY = 'app-version';
const LAST_CHECK_KEY = 'last-version-check';
const CHECK_INTERVAL = 5 * 60 * 1000; // 5 minutos

let isUpdating = false; // Prevenir múltiplas atualizações

function checkVersion() {
  if (isUpdating) {
    console.log('⏸️ Atualização já em andamento, ignorando...');
    return;
  }

  try {
    const storedVersion = localStorage.getItem(VERSION_KEY);
    
    // Se versão já está correta, não fazer nada
    if (storedVersion === CURRENT_VERSION) {
      console.log(`✓ Versão atual: ${CURRENT_VERSION}`);
      return;
    }

    // Se nunca foi definida, definir agora
    if (!storedVersion) {
      console.log(`📝 Definindo versão inicial: ${CURRENT_VERSION}`);
      localStorage.setItem(VERSION_KEY, CURRENT_VERSION);
      localStorage.setItem(LAST_CHECK_KEY, Date.now().toString());
      return;
    }

    // Versão diferente - precisa atualizar
    console.log(`🔄 Versão desatualizada: ${storedVersion} → ${CURRENT_VERSION}`);
    forceUpdate();
  } catch (error) {
    console.error('Erro no checkVersion:', error);
    // Em caso de erro, define a versão atual para evitar loops
    try {
      localStorage.setItem(VERSION_KEY, CURRENT_VERSION);
    } catch {}
  }
}

async function forceUpdate() {
  if (isUpdating) return;
  
  isUpdating = true;
  console.log('🔄 Forçando atualização completa...');

  try {
    // Salvar tokens de autenticação
    const authToken = localStorage.getItem('sb-access-token');
    const authRefresh = localStorage.getItem('sb-refresh-token');
    
    // Limpar localStorage
    localStorage.clear();
    
    // Restaurar auth e definir nova versão
    if (authToken) localStorage.setItem('sb-access-token', authToken);
    if (authRefresh) localStorage.setItem('sb-refresh-token', authRefresh);
    localStorage.setItem(VERSION_KEY, CURRENT_VERSION);
    localStorage.setItem(LAST_CHECK_KEY, Date.now().toString());

    // Limpar sessionStorage
    sessionStorage.clear();

    // Desregistrar service workers
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      for (const registration of registrations) {
        await registration.unregister();
        console.log('✓ SW desregistrado');
      }
    }

    // Limpar caches
    const cacheNames = await caches.keys();
    for (const cacheName of cacheNames) {
      await caches.delete(cacheName);
      console.log('✓ Cache deletado:', cacheName);
    }

    console.log('✓ Recarregando...');
    
    // Aguardar um momento antes de recarregar
    setTimeout(() => {
      window.location.reload(true);
    }, 500);
  } catch (error) {
    console.error('Erro ao forçar atualização:', error);
    // Mesmo com erro, define versão para evitar loop
    localStorage.setItem(VERSION_KEY, CURRENT_VERSION);
    window.location.reload(true);
  }
}

// Escutar mensagens do Service Worker
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'FORCE_RELOAD') {
      const storedVersion = localStorage.getItem(VERSION_KEY);
      if (storedVersion !== CURRENT_VERSION) {
        console.log('📨 Mensagem do SW: FORCE_RELOAD');
        forceUpdate();
      }
    }
  });

  // Detectar controller change apenas se versão diferente
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    const storedVersion = localStorage.getItem(VERSION_KEY);
    if (storedVersion !== CURRENT_VERSION) {
      console.log('📨 Controller change detectado');
      forceUpdate();
    }
  });
}

// Verificar versão apenas uma vez na inicialização
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    setTimeout(checkVersion, 100);
  });
} else {
  setTimeout(checkVersion, 100);
}

// Expor funções para debug
window.forceUpdate = forceUpdate;
window.checkVersion = checkVersion;
window.getAppVersion = () => localStorage.getItem(VERSION_KEY);
window.resetVersion = () => {
  localStorage.removeItem(VERSION_KEY);
  localStorage.removeItem(LAST_CHECK_KEY);
  console.log('✓ Versão resetada');
};

console.log(`✓ Sistema de atualização ativo - Versão ${CURRENT_VERSION}`);
