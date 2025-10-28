// force-update.js - Script de atualização forçada do Service Worker
(function() {
  'use strict';
  
  console.log('🚀 Iniciando atualização forçada...');
  
  if (!('serviceWorker' in navigator)) {
    console.warn('Service Worker não suportado');
    return;
  }
  
  async function forceUpdate() {
    try {
      // 1. Desregistrar todos os service workers
      const registrations = await navigator.serviceWorker.getRegistrations();
      console.log(`📋 Encontrados ${registrations.length} service workers`);
      
      for (const registration of registrations) {
        const result = await registration.unregister();
        console.log('✅ Service Worker desregistrado:', result);
      }
      
      // 2. Limpar todos os caches
      const cacheNames = await caches.keys();
      console.log(`📋 Encontrados ${cacheNames.length} caches`);
      
      for (const cacheName of cacheNames) {
        const result = await caches.delete(cacheName);
        console.log('🗑️ Cache deletado:', cacheName, result);
      }
      
      // 3. Limpar localStorage relacionado ao SW
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.includes('sw-') || key.includes('cache-'))) {
          keysToRemove.push(key);
        }
      }
      
      keysToRemove.forEach(key => {
        localStorage.removeItem(key);
        console.log('🧹 localStorage removido:', key);
      });
      
      // 4. Atualizar versão
      localStorage.setItem('sw-last-version', 'v8-2025-10-28');
      console.log('✅ Versão atualizada para v8');
      
      // 5. Mostrar mensagem e recarregar
      console.log('✅ Limpeza completa! Recarregando em 2 segundos...');
      
      // Criar notificação visual
      const banner = document.createElement('div');
      banner.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        background: #4CAF50;
        color: white;
        padding: 16px;
        text-align: center;
        font-family: system-ui, -apple-system, sans-serif;
        font-size: 14px;
        font-weight: 600;
        z-index: 999999;
        box-shadow: 0 2px 8px rgba(0,0,0,0.2);
      `;
      banner.textContent = '✅ Cache limpo! Recarregando...';
      document.body.appendChild(banner);
      
      setTimeout(() => {
        window.location.href = window.location.href.split('?')[0];
      }, 2000);
      
    } catch (error) {
      console.error('❌ Erro durante atualização:', error);
      alert('Erro ao atualizar. Por favor, limpe o cache manualmente.');
    }
  }
  
  // Executar automaticamente
  forceUpdate();
  
})();
