# 🔧 Correção de Erros 404 na Vercel

## Problema Identificado
O site está retornando 404 na Vercel devido a configurações conflitantes entre:
- Modo SSR (`output: 'server'`)
- Configuração antiga do Netlify (SPA)
- Adapter Vercel não otimizado

## ✅ Soluções Implementadas

### 1. Criado `vercel.json`
Arquivo de configuração específico para Vercel com os comandos corretos.

### 2. Criado `.vercelignore`
Ignora arquivos desnecessários no deploy, incluindo `netlify.toml`.

### 3. Verificações Necessárias

#### Na Vercel Dashboard:

1. **Environment Variables**
   Certifique-se de que as variáveis estão configuradas:
   ```
   PUBLIC_SUPABASE_URL=sua_url_aqui
   PUBLIC_SUPABASE_ANON_KEY=sua_chave_aqui
   ```

2. **Framework Preset**
   - Deve estar como: **Astro**
   - Build Command: `npm run build`
   - Output Directory: `.vercel/output`
   - Install Command: `npm install`

3. **Node.js Version**
   - Recomendado: **18.x** ou **20.x**
   - Configurar em: Settings → Environment Variables
   - Adicionar: `NODE_VERSION=20`

4. **Regions**
   - Para melhor performance no Brasil, usar região: `gru1` (São Paulo)

## 🚀 Passos para Re-deploy

1. **Commit as mudanças:**
   ```bash
   git add vercel.json .vercelignore
   git commit -m "fix: Correção configuração Vercel para SSR"
   git push
   ```

2. **Na Vercel:**
   - Acesse o projeto
   - Vá em Settings → General
   - Verifique que o Framework Preset está como "Astro"
   - Em Settings → Environment Variables, adicione as variáveis do Supabase
   - Faça um novo deploy manual ou espere o auto-deploy do git

3. **Se ainda der erro:**
   - Delete o projeto na Vercel
   - Re-importe do repositório
   - Configure as variáveis de ambiente novamente

## 🔍 Debug de Erros 404

Se continuar com 404, verifique:

1. **Build Logs na Vercel:**
   - Procure por erros no build
   - Verifique se o output está em `.vercel/output`

2. **Function Logs:**
   - Na Vercel → Functions
   - Verifique se `_render` está sendo criada

3. **Rotas:**
   - Verifique se `.vercel/output/config.json` tem as rotas corretas
   - Deve incluir rotas para `/admin/*` e API routes

## ⚠️ Importante

### O que DEVE estar na Vercel:
- ✅ `output: 'server'` no astro.config.mjs
- ✅ `adapter: vercel()` 
- ✅ Variáveis de ambiente configuradas
- ✅ `.vercel/output` directory no build

### O que NÃO usar:
- ❌ `netlify.toml` (será ignorado)
- ❌ `output: 'static'`
- ❌ Tentar servir como SPA

## 📝 Checklist Final

Antes de fazer deploy na Vercel, confirme:

- [ ] `astro.config.mjs` tem `output: 'server'`
- [ ] `@astrojs/vercel` está instalado
- [ ] `vercel.json` existe no root
- [ ] `.vercelignore` existe no root
- [ ] Variáveis de ambiente estão configuradas na Vercel
- [ ] Framework preset é "Astro"
- [ ] Node version é 18.x ou 20.x

## 🎯 Resultado Esperado

Após corrigir, você deve ver:
- ✅ Build passa sem erros
- ✅ Página inicial carrega
- ✅ Rotas `/admin/*` funcionam
- ✅ API routes `/api/admin/*` funcionam
- ✅ Sem erros 404

## 🆘 Ainda com problemas?

Se mesmo após essas mudanças continuar com erro:

1. Exporte os logs da Vercel
2. Verifique se o banco Supabase está acessível
3. Teste localmente com `npm run build && npm run preview`
4. Compare o `.vercel/output/config.json` local com o da Vercel

---

**Criado em:** 2024-10-27
**Status:** Pronto para deploy ✅
