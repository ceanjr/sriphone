// Script para limpar completamente o cache do navegador
// Cole isso no console do navegador (F12 -> Console)

(async function clearAllCache() {
  console.log('🧹 Iniciando limpeza completa...');

  // 1. Limpar localStorage
  try {
    localStorage.clear();
    console.log('✅ localStorage limpo');
  } catch (e) {
    console.error('❌ Erro ao limpar localStorage:', e);
  }

  // 2. Limpar sessionStorage
  try {
    sessionStorage.clear();
    console.log('✅ sessionStorage limpo');
  } catch (e) {
    console.error('❌ Erro ao limpar sessionStorage:', e);
  }

  // 3. Limpar IndexedDB
  try {
    const dbs = await window.indexedDB.databases();
    dbs.forEach(db => {
      if (db.name) {
        window.indexedDB.deleteDatabase(db.name);
        console.log('✅ IndexedDB deletado:', db.name);
      }
    });
  } catch (e) {
    console.error('❌ Erro ao limpar IndexedDB:', e);
  }

  // 4. Desregistrar Service Workers
  try {
    const registrations = await navigator.serviceWorker.getRegistrations();
    for (let registration of registrations) {
      await registration.unregister();
      console.log('✅ Service Worker desregistrado:', registration.scope);
    }
    if (registrations.length === 0) {
      console.log('ℹ️  Nenhum Service Worker encontrado');
    }
  } catch (e) {
    console.error('❌ Erro ao desregistrar Service Workers:', e);
  }

  // 5. Limpar Cache API
  try {
    const cacheNames = await caches.keys();
    for (let name of cacheNames) {
      await caches.delete(name);
      console.log('✅ Cache deletado:', name);
    }
    if (cacheNames.length === 0) {
      console.log('ℹ️  Nenhum cache encontrado');
    }
  } catch (e) {
    console.error('❌ Erro ao limpar Cache API:', e);
  }

  console.log('');
  console.log('🎉 Limpeza completa!');
  console.log('👉 Agora pressione Ctrl+Shift+R (ou Cmd+Shift+R no Mac) para recarregar');
})();
