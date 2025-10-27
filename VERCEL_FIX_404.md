# 🔧 Correção de Erros 404 na Vercel - ATUALIZADO

## ⚠️ Erro Atual
```
Config file was not found at "/vercel/path0/.vercel/output/config.json"
```

## Problema Identificado
O adapter `@astrojs/vercel` não está gerando o `config.json` corretamente durante o build na Vercel. Isso acontece porque:

1. A Vercel executa o build em ambiente próprio
2. Pode haver conflito com o `vercel.json` customizado
3. O adapter precisa detectar automaticamente o ambiente Vercel

## ✅ Solução Implementada

### 1. Simplificado `vercel.json`
```json
{
  "framework": "astro"
}
```

**Por quê?** O Astro adapter já sabe como configurar tudo automaticamente. Comandos customizados podem interferir.

### 2. Criado `build.sh`
Script de build com validação que ajuda a debugar problemas.

### 3. Atualizado `.gitignore`
Adicionado `.vercel/` para evitar commit de arquivos de build local.

## 🚀 Como Corrigir na Vercel

### Opção 1: Configuração Automática (RECOMENDADO)

1. **Delete `vercel.json` temporariamente**
   ```bash
   git rm vercel.json
   git commit -m "Remove vercel.json para auto-detect"
   git push
   ```

2. **Na Vercel Dashboard:**
   - Settings → General
   - **Framework Preset**: Selecione "Astro" 
   - **Build Command**: Deixe VAZIO (auto-detect)
   - **Output Directory**: Deixe VAZIO (auto-detect)
   - **Install Command**: Deixe VAZIO (auto-detect)

3. **Environment Variables:**
   ```
   PUBLIC_SUPABASE_URL=sua_url
   PUBLIC_SUPABASE_ANON_KEY=sua_chave
   ```

4. **Re-deploy**

### Opção 2: Com vercel.json Mínimo

Se quiser manter `vercel.json`:

```json
{
  "framework": "astro"
}
```

**Na Vercel:**
- Não configure nada manualmente
- Deixe a Vercel auto-detectar tudo
- Apenas adicione as variáveis de ambiente

### Opção 3: Script de Build Customizado

Se ainda falhar, use o script:

1. **Na Vercel → Settings → General:**
   - Build Command: `./build.sh`
   
2. **Commit o build.sh:**
   ```bash
   git add build.sh
   git commit -m "Add custom build script"
   git push
   ```

## 🔍 Debug no Build

Se continuar falhando, nos logs da Vercel procure por:

```
[@astrojs/vercel] Copying static files to .vercel/output/static
```

Se essa linha aparecer mas ainda der erro, o problema é:

1. **Versão do Node**: Tente adicionar em Environment Variables:
   ```
   NODE_VERSION=20
   ```

2. **Cache Issues**: Na Vercel:
   - Deployments → ... → Redeploy
   - Marque "Clear cache and deploy"

3. **Reinstale Adapter**: Localmente:
   ```bash
   npm uninstall @astrojs/vercel
   npm install @astrojs/vercel@latest
   git add package.json package-lock.json
   git commit -m "Update vercel adapter"
   git push
   ```

## ⚠️ IMPORTANTE: Não Use

❌ `buildCommand` no vercel.json (interfere com auto-detect)
❌ `outputDirectory` customizado (o adapter já sabe)
❌ `installCommand` customizado (causa problemas)

## ✅ APENAS Use

✓ `{ "framework": "astro" }` no vercel.json
✓ Ou nenhum vercel.json (auto-detect total)
✓ Variáveis de ambiente configuradas
✓ Node 18.x ou 20.x

## 🎯 Checklist Final

- [ ] `vercel.json` tem APENAS `{ "framework": "astro" }` OU foi removido
- [ ] Framework Preset na Vercel = "Astro"
- [ ] Build/Install/Output Commands = VAZIOS (auto)
- [ ] `PUBLIC_SUPABASE_URL` configurada
- [ ] `PUBLIC_SUPABASE_ANON_KEY` configurada
- [ ] `.vercel/` no `.gitignore`
- [ ] Cache cleared no próximo deploy

## 🆘 Se AINDA Falhar

**Última alternativa - Forçar output static temporariamente:**

1. Em `astro.config.mjs`:
   ```js
   export default defineConfig({
     site: 'https://sriphonevca.com.br',
     output: 'static', // Temporário!
     adapter: vercel(),
     // ...
   });
   ```

2. Deploy e verifique se funciona

3. Se funcionar, o problema é com SSR na Vercel

4. Para manter SSR, talvez precise migrar para Vercel Functions manualmente ou usar outro hosting

---

**Status:** Aguardando teste com configuração simplificada
**Última atualização:** 2024-10-27 17:15

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
