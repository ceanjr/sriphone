console.log('🐞 [DEBUG] Script de debug persistente carregado.');

// Função para exibir o log do último upload que ocorreu antes do redirecionamento
function showPreviousUploadLogs() {
  const lastUpload = localStorage.getItem('last_upload_debug');
  if (lastUpload) {
    const data = JSON.parse(lastUpload);
    console.group('📦 [DEBUG] RESULTADO DO ÚLTIMO UPLOAD (PÁGINA ANTERIOR)');
    console.log('Horário:', data.timestamp);
    console.log('Batch ID:', data.batchId);
    console.log('URLs retornadas pelo servidor:');
    data.urls.forEach((u, i) => console.log(`   [${i}] ${u}`));
    console.groupEnd();
    // Limpar para não repetir no próximo refresh
    localStorage.removeItem('last_upload_debug');
  }
}

// Executar ao carregar a página
showPreviousUploadLogs();

// Interceptar fetch para capturar dados antes do redirecionamento
const originalFetch = window.fetch;
window.fetch = async function(input, init) {
  const url = typeof input === 'string' ? input : input.url;
  
  if (url.includes('/api/admin/upload')) {
    console.log(`🔍 [FETCH] Upload Request: ${url}`);
    const response = await originalFetch(input, init);
    const clone = response.clone();
    
    // Log headers
    console.log('🛡️ [FETCH] Response Headers:');
    response.headers.forEach((val, key) => console.log(`   ${key}: ${val}`));

    try {
      const data = await clone.json();
      const urlObj = new URL(url, window.location.origin);
      const batchId = urlObj.searchParams.get('batch');
      
      // Salvar no localStorage para persistir após o redirecionamento
      localStorage.setItem('last_upload_debug', JSON.stringify({
        timestamp: new Date().toISOString(),
        batchId: batchId,
        urls: data.urls || [],
        endpoint: url
      }));
      
      console.log('💾 [DEBUG] Dados de upload salvos no localStorage para o redirecionamento.');
    } catch (e) {
      console.error('❌ [DEBUG] Erro ao capturar dados de upload:', e);
    }
    
    return response;
  }
  
  return originalFetch(input, init);
};