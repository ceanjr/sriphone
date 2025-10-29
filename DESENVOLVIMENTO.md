# Guia de Desenvolvimento - Sr. IPHONE VCA

## Problema: Catálogo não funciona em desenvolvimento

Se o catálogo não estiver carregando produtos ou não tiver interatividade em `localhost:4321`, siga estes passos:

### 1. Limpar Cache do Navegador

**Chrome/Edge:**
1. Abra DevTools (F12)
2. Vá em Application > Storage
3. Clique em "Clear site data"
4. Recarregue a página (Ctrl+Shift+R ou Cmd+Shift+R)

**Firefox:**
1. Abra DevTools (F12)
2. Vá em Storage
3. Clique com botão direito em "Service Workers" > "Unregister"
4. Limpe todos os caches
5. Recarregue a página (Ctrl+Shift+R)

### 2. Desregistrar Service Worker

Abra o Console do DevTools e execute:

```javascript
navigator.serviceWorker.getRegistrations().then(function(registrations) {
  for(let registration of registrations) {
    registration.unregister();
    console.log('Service Worker desregistrado');
  }
});
```

### 3. Forçar Hard Reload

- **Windows/Linux**: `Ctrl + Shift + R` ou `Ctrl + F5`
- **Mac**: `Cmd + Shift + R`

### 4. Modo Anônimo

Se ainda não funcionar, teste em uma janela anônima/privada:
- **Chrome**: `Ctrl + Shift + N`
- **Firefox**: `Ctrl + Shift + P`

## Correções Aplicadas

✅ **astro.config.mjs**: Removido cache agressivo do servidor de desenvolvimento
✅ **public/sw.js**: Service Worker agora ignora localhost (não cacheia em desenvolvimento)
✅ **public/sw.js**: Versão do cache atualizada para forçar reload

## Comandos de Desenvolvimento

```bash
# Iniciar servidor de desenvolvimento
npm run dev

# Build para produção
npm run build

# Preview do build
npm run preview
```

## Diferenças entre Dev e Produção

### Desenvolvimento (localhost:4321)
- ❌ Service Worker não cacheia (desde a correção)
- ✅ Hot Module Replacement (HMR) ativo
- ✅ Source maps disponíveis
- ✅ Console logs preservados

### Produção (sriphonevca.com.br)
- ✅ Service Worker ativo e cacheando agressivamente
- ✅ Código minificado
- ✅ Console logs removidos
- ✅ Cache otimizado

## Verificar se o Problema Persiste

1. Abra o Console do navegador (F12)
2. Procure por erros em vermelho
3. Verifique a aba Network para ver se os scripts estão carregando
4. Na aba Application, verifique se há Service Workers registrados

## Portas Usadas

- **Dev Server**: `http://localhost:4321`
- **Preview**: `http://localhost:4322` (após build)

## Notas Importantes

⚠️ **SEMPRE** use Hard Reload (Ctrl+Shift+R) ao testar mudanças em desenvolvimento
⚠️ **NÃO** confie no cache do navegador em desenvolvimento
⚠️ Se o problema persistir, delete a pasta `.astro` e `node_modules/.vite`
