// PWA Status Checker
// Adicione este script ao console para verificar o status do PWA

console.log('🔍 Verificando status do PWA...\n');

// 1. Service Worker
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(registrations => {
    if (registrations.length > 0) {
      console.log('✅ Service Worker registrado');
      console.log(`   Total: ${registrations.length} worker(s)`);
      registrations.forEach((reg, i) => {
        console.log(`   Worker ${i + 1}: ${reg.active?.scriptURL || 'inativo'}`);
      });
    } else {
      console.log('❌ Nenhum Service Worker registrado');
    }
  });
} else {
  console.log('❌ Service Worker não suportado');
}

// 2. Manifest
fetch('/manifest.json')
  .then(res => res.json())
  .then(manifest => {
    console.log('\n✅ Manifest carregado');
    console.log(`   Nome: ${manifest.name}`);
    console.log(`   Nome curto: ${manifest.short_name}`);
    console.log(`   Ícones: ${manifest.icons.length}`);
  })
  .catch(() => console.log('❌ Erro ao carregar manifest'));

// 3. Cache
if ('caches' in window) {
  caches.keys().then(keys => {
    console.log(`\n✅ Cache ativo (${keys.length} cache(s))`);
    keys.forEach(key => console.log(`   - ${key}`));
    
    keys.forEach(key => {
      caches.open(key).then(cache => {
        cache.keys().then(requests => {
          console.log(`   ${key}: ${requests.length} recursos`);
        });
      });
    });
  });
} else {
  console.log('\n❌ Cache API não disponível');
}

// 4. Modo Standalone
const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
console.log(`\n${isStandalone ? '✅' : 'ℹ️'} Modo standalone: ${isStandalone ? 'Sim (instalado)' : 'Não'}`);

// 5. Instalação
if ('BeforeInstallPromptEvent' in window) {
  console.log('✅ Instalação PWA suportada');
} else {
  console.log('ℹ️ API de instalação não disponível (normal no iOS)');
}

// 6. Online/Offline
console.log(`\n${navigator.onLine ? '🌐' : '📡'} Status: ${navigator.onLine ? 'Online' : 'Offline'}`);

// 7. HTTPS
console.log(`${location.protocol === 'https:' ? '🔒' : '⚠️'} Protocolo: ${location.protocol}`);

// 8. Prompt dismissado
const dismissed = localStorage.getItem('pwa-prompt-dismissed');
if (dismissed) {
  const date = new Date(parseInt(dismissed));
  console.log(`\nℹ️ Prompt dismissado em: ${date.toLocaleString('pt-BR')}`);
} else {
  console.log('\nℹ️ Prompt nunca foi dismissado');
}

console.log('\n✨ Verificação completa!\n');
