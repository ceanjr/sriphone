# 🚨 GUIA COMPLETO DE DEBUG - Erro "Unexpected end of JSON input"

## PASSO A PASSO PARA RESOLVER

### 1️⃣ LIMPAR CACHE COMPLETAMENTE (OBRIGATÓRIO!)

#### No Navegador (Chrome/Edge/Brave):
1. Abra o site **em uma aba anônima/privativa** (Ctrl+Shift+N)
2. Ou, em uma aba normal:
   - Pressione **F12** para abrir DevTools
   - Clique com o **botão direito** no ícone de recarregar
   - Selecione **"Limpar cache e recarregar forçadamente"** (Empty Cache and Hard Reload)

#### Pelo Console (RECOMENDADO):
1. Pressione **F12**
2. Vá para a aba **Console**
3. Cole este código:
```javascript
// Limpar tudo
await window.clearAllCache();

// Desregistrar service worker manualmente
navigator.serviceWorker.getRegistrations().then(function(registrations) {
  for(let registration of registrations) {
    registration.unregister();
    console.log('SW desregistrado:', registration);
  }
});

// Limpar todos os caches
caches.keys().then(function(names) {
  for (let name of names) {
    caches.delete(name);
    console.log('Cache deletado:', name);
  }
});

// Limpar storage
localStorage.clear();
sessionStorage.clear();

// Recarregar
location.reload();
```

### 2️⃣ VERIFICAR SE ESTÁ LOGADO

**IMPORTANTE**: As APIs de admin precisam de autenticação!

1. Vá para `/admin/login`
2. Faça login com suas credenciais
3. Só depois vá para `/admin/categorias` ou `/admin/produtos`

### 3️⃣ TESTAR E VER OS LOGS

Agora eu adicionei logs detalhados. Siga estes passos:

1. Pressione **F12** para abrir DevTools
2. Vá para a aba **Console**
3. Limpe o console (ícone 🚫)
4. Tente criar uma categoria
5. **SCREENSHOT** todo o console e me envie

Você verá logs assim:
```
📤 Enviando categoria: {nome: "Teste"}
📤 POST /api/admin/categorias
📥 Response status: 201 Created
📥 Response headers: {...}
📥 Response text: {"categoria": {...}}
📥 Parsed data: {...}
✅ Sucesso!
```

Se der erro, verá:
```
❌ Erro: ...
```

### 4️⃣ VERIFICAR NETWORK

1. F12 → Aba **Network**
2. Marque **"Preserve log"**
3. Tente criar uma categoria
4. Clique na requisição `categorias`
5. Vá para a aba **Response**
6. **SCREENSHOT** o que aparece

### 5️⃣ SE AINDA NÃO FUNCIONAR

Execute este teste:

```javascript
// Testar API diretamente
fetch('/api/test')
  .then(r => r.text())
  .then(t => console.log('API Test:', t))
  .catch(e => console.error('Erro:', e));

// Testar API de categorias
fetch('/api/admin/categorias', {
  method: 'GET',
  cache: 'no-store'
})
  .then(async r => {
    console.log('Status:', r.status);
    const text = await r.text();
    console.log('Response:', text);
    return text ? JSON.parse(text) : null;
  })
  .catch(e => console.error('Erro:', e));
```

Cole isso no Console e me envie o resultado.

### 6️⃣ POSSÍVEIS CAUSAS DO ERRO

#### A) Service Worker Antigo Cacheado
**Solução**: Limpar cache como no passo 1

#### B) Não está logado
**Solução**: Fazer login em `/admin/login`

#### C) Resposta vazia da API
**Possível causa**: 
- Erro no Supabase
- Token expirado
- RLS (Row Level Security) bloqueando

**Solução**: Ver logs do servidor no Vercel

#### D) CORS ou Headers
**Verificar**: Na aba Network, ver se tem erros de CORS

### 7️⃣ DEBUG AVANÇADO

Se nada funcionar, me envie:

1. **Screenshot** do Console completo
2. **Screenshot** do Network → Response
3. **Screenshot** do Network → Headers
4. Logs do Vercel (se tiver acesso)

### 8️⃣ TESTE RÁPIDO

Cole no Console:

```javascript
// Teste 1: API funciona?
fetch('/api/test').then(r => r.json()).then(d => console.log('✅ API OK:', d)).catch(e => console.error('❌ API falhou:', e));

// Teste 2: Está logado?
const token = document.cookie.match(/sb-access-token=([^;]+)/)?.[1];
console.log('Token:', token ? '✅ Presente' : '❌ Ausente');

// Teste 3: Service Worker ativo?
navigator.serviceWorker.getRegistrations().then(regs => {
  console.log('Service Workers:', regs.length);
  regs.forEach((r, i) => console.log(`  ${i}:`, r.active?.scriptURL));
});

// Teste 4: Caches ativos?
caches.keys().then(keys => {
  console.log('Caches:', keys);
});
```

### ⚡ SOLUÇÃO RÁPIDA

Na maioria dos casos, este comando resolve:

```javascript
// Cole no Console e pressione Enter
await (async () => {
  // Desregistrar SW
  const regs = await navigator.serviceWorker.getRegistrations();
  await Promise.all(regs.map(r => r.unregister()));
  
  // Limpar caches
  const keys = await caches.keys();
  await Promise.all(keys.map(k => caches.delete(k)));
  
  // Limpar storage
  localStorage.clear();
  sessionStorage.clear();
  
  console.log('✅ Cache limpo!');
  
  // Recarregar sem cache
  location.reload(true);
})();
```

### 📞 PRECISO VER

Me envie screenshots de:
1. ✅ Console (F12 → Console)
2. ✅ Network tab mostrando a requisição falhando
3. ✅ Response da requisição no Network
4. ✅ Resultado dos testes acima

Isso vai me mostrar exatamente o que está acontecendo!
