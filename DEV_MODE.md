# Modo de Desenvolvimento

## Como executar o projeto em modo de desenvolvimento

```bash
npm run dev
```

O servidor estará disponível em:
- Local: http://localhost:4321/
- Network: http://[seu-ip]:4321/

## Correções Implementadas para Desenvolvimento

### 1. Minificação e Otimização
- **Problema**: Terser estava removendo console.log e minificando código em dev
- **Solução**: Minificação apenas em produção (NODE_ENV === 'production')
- **Resultado**: Console.log e debugger funcionam normalmente em dev

### 2. Service Worker
- **Problema**: SW estava cacheando arquivos JavaScript em desenvolvimento
- **Solução**: SW desabilitado automaticamente em localhost/portas de dev
- **Resultado**: Alterações refletem imediatamente sem cache

### 3. Hot Module Replacement (HMR)
- **Configuração**: HMR ativado com overlay de erros
- **Resultado**: Alterações no código refletem automaticamente no navegador

## Debug e Logs

Em modo de desenvolvimento:
- ✅ `console.log()` funciona normalmente
- ✅ `debugger` funciona no DevTools
- ✅ Source maps disponíveis
- ✅ Erros aparecem com overlay no navegador

## Portas de Desenvolvimento Reconhecidas

O sistema reconhece as seguintes portas como ambiente de desenvolvimento:
- `4321` (padrão do Astro)
- `3000` (comum em projetos Node)
- `5173` (padrão do Vite)

## Comandos Úteis

```bash
# Desenvolvimento com host exposto
npm run dev

# Build de produção
npm run build

# Preview do build de produção
npm run preview

# Análise de bundle
npm run build:analyze
```

## Troubleshooting

### JavaScript não funciona
1. Limpe o cache do navegador (Ctrl+Shift+Del)
2. Force reload sem cache (Ctrl+Shift+R)
3. Verifique o console do navegador para erros
4. Reinicie o servidor dev (Ctrl+C e npm run dev)

### Service Worker em desenvolvimento
Se ainda houver problemas com cache:
1. Abra DevTools → Application → Service Workers
2. Clique em "Unregister" em todos os service workers
3. Recarregue a página

### Variáveis de Ambiente
Verifique se o arquivo `.env` existe e contém:
```
PUBLIC_SUPABASE_URL=...
PUBLIC_SUPABASE_ANON_KEY=...
```
