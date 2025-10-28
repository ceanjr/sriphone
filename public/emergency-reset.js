// SCRIPT DE EMERGÊNCIA - Resetar tudo e parar loops
(async function emergencyReset() {
  console.log('🚨 RESET DE EMERGÊNCIA');
  
  try {
    // 1. Parar todos os intervalos e timeouts
    const highestId = setTimeout(() => {});
    for (let i = 0; i < highestId; i++) {
      clearTimeout(i);
      clearInterval(i);
    }
    console.log('✓ Timers parados');

    // 2. Salvar auth
    const authToken = localStorage.getItem('sb-access-token');
    const authRefresh = localStorage.getItem('sb-refresh-token');

    // 3. Limpar tudo
    localStorage.clear();
    sessionStorage.clear();
    
    // 4. Restaurar auth e versão correta
    if (authToken) localStorage.setItem('sb-access-token', authToken);
    if (authRefresh) localStorage.setItem('sb-refresh-token', authRefresh);
    localStorage.setItem('app-version', '7.0.0');
    localStorage.setItem('last-version-check', Date.now().toString());
    console.log('✓ Storage limpo e versão definida');

    // 5. Desregistrar service workers
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      for (const registration of registrations) {
        await registration.unregister();
      }
      console.log('✓ Service workers desregistrados');
    }

    // 6. Limpar caches
    const cacheNames = await caches.keys();
    for (const cacheName of cacheNames) {
      await caches.delete(cacheName);
    }
    console.log('✓ Caches deletados');

    // 7. Aguardar e recarregar UMA VEZ
    console.log('✓ Recarregando em 2 segundos...');
    setTimeout(() => {
      window.location.href = window.location.href.split('?')[0] + '?t=' + Date.now();
    }, 2000);
  } catch (error) {
    console.error('Erro no reset:', error);
    // Forçar reload mesmo com erro
    setTimeout(() => {
      window.location.href = window.location.href.split('?')[0] + '?t=' + Date.now();
    }, 2000);
  }
})();
