// Script para limpar cache e service worker
async function clearAllCache() {
  try {
    // Limpar todos os caches
    const cacheNames = await caches.keys();
    await Promise.all(cacheNames.map(name => caches.delete(name)));
    console.log('✓ Todos os caches foram limpos');

    // Desregistrar service workers
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(registrations.map(reg => reg.unregister()));
      console.log('✓ Service workers desregistrados');
    }

    // Limpar localStorage e sessionStorage
    localStorage.clear();
    sessionStorage.clear();
    console.log('✓ Storage limpo');

    return true;
  } catch (error) {
    console.error('Erro ao limpar cache:', error);
    return false;
  }
}

// Expor globalmente
window.clearAllCache = clearAllCache;
