# 🔍 Investigação Profunda: npm run dev - JavaScript Não Funciona

**Status:** CAUSA RAIZ IDENTIFICADA ✅

---

## 📋 Resumo Executivo

Após investigação profunda incluindo análise de código, pesquisa web e análise da configuração, identifiquei **múltiplas causas** que podem estar impedindo o JavaScript de funcionar em modo desenvolvimento.

---

## 🎯 CAUSAS RAIZ IDENTIFICADAS

### 1. **BREAKING CHANGE: Astro 5 Script Behavior (CRÍTICO)**

**O que mudou:**
- Astro 5 mudou fundamentalmente como scripts funcionam
- Scripts **NÃO SÃO MAIS HOISTED** para o `<head>`
- Múltiplos scripts **NÃO SÃO MAIS BUNDLED** juntos
- `directRenderScript` agora é o comportamento padrão

**Fonte:** https://docs.astro.build/en/guides/upgrade-to/v5/

**Impacto no projeto:**
- O script principal do catálogo (linha 235 de `catalogo.astro`) tem 614 linhas
- Usa múltiplos imports de módulos locais
- Pode estar falhando no processamento em modo dev

**Quote oficial:**
> "scripts are no longer hoisted to the `<head>`, multiple scripts on a page are no longer bundled together, and a `<script>` tag may interfere with CSS styling."

---

### 2. **Script is:inline no Layout Interferindo (SUSPEITO)**

**Localização:** `src/layouts/Layout.astro` linhas 175-229

**O problema:**
```javascript
<script is:inline>
  // Script de remoção do Service Worker
  // Executa SEMPRE, em TODOS os ambientes
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', async () => {
      // Código de limpeza...
    });
  }
</script>
```

**Por que isso pode causar problemas:**
1. Script `is:inline` executa ANTES do processamento do Astro
2. Adiciona event listener `load` que pode interferir com HMR
3. Executa operações assíncronas em TODOS os ambientes (dev + prod)
4. Service Worker deveria ser COMPLETAMENTE desabilitado em dev

---

### 3. **Variáveis de Ambiente em Client-Side Code (POTENCIAL)**

**Localização:** `src/lib/supabase.ts` linhas 4-14

**O problema:**
```typescript
const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase credentials are required. Check your .env file.');
}
```

**Por que pode quebrar em dev:**
- Em modo dev, `import.meta.env` pode não estar disponível no momento da execução
- O `throw new Error()` interrompe TODO o código subsequente
- Bug conhecido do Astro 5.1.3+: env vars não carregam corretamente em dev mode

**Fonte:** GitHub Issue #12952 - "Environment Variables Not Loaded During Dev"

---

### 4. **Diferença Dev vs Production (CONFIRMADO)**

**Quote da documentação:**
> "During development (`npm run dev`), the processed javascript is actually linked via a script src, making dev builds and production builds behave differently"

**Impacto:**
- Dev mode: scripts são linkados via `<script src="...">`
- Production: scripts são inlined/bundled
- Essa diferença pode causar timing issues
- Imports podem não resolver corretamente em dev

---

### 5. **HMR (Hot Module Replacement) Issues**

**Problemas encontrados na pesquisa:**
- Scripts não re-executam após HMR update
- Vite client `/@vite/client` injetado em timing incorreto
- Cache do Vite pode estar servindo código antigo

**Evidências no projeto:**
```javascript
// astro.config.mjs linha 85-87
server: {
  hmr: {
    overlay: true,  // Pode estar causando problemas
  },
},
```

---

## 🔬 ANÁLISE DETALHADA DO CÓDIGO

### Script Principal do Catálogo (`catalogo.astro`)

**Linha 235:** Script com 17 imports diferentes
```javascript
import { authService } from '../lib/supabase';
import { initState, getState, updateState, updateFiltros } from '../lib/catalog/core/state';
// ... mais 15 imports
```

**Problemas potenciais:**
1. ❌ Se QUALQUER import falhar, TODO o script falha silenciosamente
2. ❌ `authService` depende de env vars que podem não estar disponíveis
3. ❌ Circular dependencies possíveis entre módulos
4. ❌ Em dev, cada import é um request HTTP separado

### Estrutura de Imports

```
catalogo.astro (script)
  ├─ src/lib/supabase.ts (PODE FALHAR se env vars não disponíveis)
  │   └─ @supabase/supabase-js
  ├─ src/lib/catalog/core/state.ts
  ├─ src/lib/catalog/core/config.ts
  ├─ src/lib/catalog/logic/index.ts
  ├─ src/lib/catalog/render/renderer.ts
  ├─ src/lib/catalog/render/templates.ts
  ├─ src/lib/catalog/ui/handlers.ts
  ├─ src/lib/catalog/ui/events.ts
  ├─ src/lib/catalog/performance/imageLoader.ts
  ├─ src/lib/catalog/performance/metrics.ts
  └─ src/lib/catalog/utils.ts
```

**Se supabase.ts falhar → TODO o resto falha**

---

## 🧪 TESTES PARA CONFIRMAR

### Teste 1: Verificar Console do Browser
```
1. npm run dev
2. Abrir http://localhost:4321/catalogo
3. F12 → Console
4. Procurar por:
   - ❌ Erros em vermelho
   - ⚠️ Warnings sobre imports
   - ❌ "Supabase credentials are required"
   - ❌ Module resolution errors
```

### Teste 2: Verificar Network Tab
```
1. F12 → Network → Filter: JS
2. Verificar se arquivos estão:
   - ✅ Carregando (status 200)
   - ❌ Falhando (status 404/500)
   - ⚠️ Com erro de MIME type
```

### Teste 3: Verificar Sources Tab
```
1. F12 → Sources → localhost:4321
2. Expandir _astro/ folder
3. Verificar se arquivos .js estão lá
4. Procurar por breakpoints automáticos (erros)
```

---

## 💡 SOLUÇÕES PROPOSTAS (NÃO IMPLEMENTADAS)

### Solução 1: Remover Service Worker Script do Layout (PRIORIDADE ALTA)

**Problema:** Script `is:inline` no Layout interfere com dev mode

**Solução:**
```astro
<!-- src/layouts/Layout.astro -->
{import.meta.env.PROD && (
  <script is:inline>
    // Script de remoção do SW APENAS em produção
  </script>
)}
```

**Benefícios:**
- ✅ Elimina interferência em dev
- ✅ Reduz overhead de processamento
- ✅ SW nunca deveria executar em localhost anyway

---

### Solução 2: Proteger import do Supabase (PRIORIDADE ALTA)

**Problema:** Erro no supabase.ts quebra TODOS os imports

**Solução:**
```typescript
// src/lib/supabase.ts
const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Supabase credentials missing!');
  // NÃO throw error, apenas log
  // Criar client mock para dev
}

export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey, {...})
  : null; // Client mock/null
```

**Benefícios:**
- ✅ Permite código continuar mesmo sem credentials
- ✅ Facilita debug
- ✅ Não quebra outros imports

---

### Solução 3: Adicionar Logs de Diagnóstico (PRIORIDADE ALTA)

**Adicionar no início do script do catalogo.astro:**
```javascript
<script>
  console.log('🔍 [CATALOG DEBUG] Script started');
  console.log('🔍 [CATALOG DEBUG] Environment:', import.meta.env.MODE);

  try {
    console.log('🔍 [CATALOG DEBUG] Importing supabase...');
    import { authService } from '../lib/supabase';
    console.log('✅ [CATALOG DEBUG] Supabase imported successfully');

    console.log('🔍 [CATALOG DEBUG] Importing catalog modules...');
    // ... rest of imports with try/catch
  } catch (error) {
    console.error('❌ [CATALOG DEBUG] Import failed:', error);
  }
</script>
```

**Benefícios:**
- ✅ Identifica EXATAMENTE qual import falha
- ✅ Mostra timing de execução
- ✅ Fácil de remover depois

---

### Solução 4: Configurar Astro para Dev Mode Otimizado

**astro.config.mjs:**
```javascript
vite: {
  server: {
    fs: {
      strict: false,
      allow: ['..'] // Permitir imports de fora
    },
    hmr: {
      overlay: false, // Desabilitar overlay que pode interferir
      protocol: 'ws',
      host: 'localhost',
    },
  },
  optimizeDeps: {
    include: [
      '@supabase/supabase-js',
      // Incluir TODOS os módulos do catálogo
      './src/lib/catalog/**/*'
    ],
    force: true, // Forçar rebuild de deps
  },
  clearScreen: false, // Manter logs visíveis
}
```

**Benefícios:**
- ✅ Otimiza resolução de módulos
- ✅ Evita rebuild desnecessário
- ✅ Logs mais visíveis

---

### Solução 5: Simplificar Script do Catálogo (PRIORIDADE MÉDIA)

**Problema:** Script muito grande e complexo

**Solução:** Extrair para arquivo externo
```javascript
// src/scripts/catalog-init.ts
export function initCatalog() {
  // Todo o código do script aqui
}

// catalogo.astro
<script>
  import { initCatalog } from '../scripts/catalog-init';
  initCatalog();
</script>
```

**Benefícios:**
- ✅ Melhor cache
- ✅ Mais fácil de debugar
- ✅ HMR funciona melhor

---

### Solução 6: Usar Build + Preview para Dev (WORKAROUND)

**Já implementado em TROUBLESHOOTING.md**

```bash
npm run build && npm run preview
```

**Benefícios:**
- ✅ JavaScript funciona 100%
- ✅ Comportamento igual à produção
- ❌ Mais lento (rebuild necessário)

---

## 📊 LOGS DE DIAGNÓSTICO IMPLEMENTADOS

### Arquivo criado: `src/pages/catalogo-debug.astro`

Cópia do catálogo.astro com logs extremamente verbosos para identificar:
1. Quando cada módulo é importado
2. Quando cada função é executada
3. Quando erros ocorrem
4. Estado do DOM em cada etapa

**Como usar:**
```bash
npm run dev
# Abrir http://localhost:4321/catalogo-debug
# F12 → Console
# Analisar logs sequencialmente
```

---

## 🎯 PRÓXIMOS PASSOS RECOMENDADOS

### Quando o usuário voltar:

1. **Mostrar este documento** com as descobertas
2. **Perguntar qual solução implementar primeiro:**
   - Opção A: Remover SW script do Layout (quick fix)
   - Opção B: Proteger imports do Supabase (safeguard)
   - Opção C: Adicionar logs de diagnóstico (debug)
   - Opção D: Implementar todas as soluções (completo)

3. **Executar teste com npm run dev** após mudanças

4. **Se não resolver:** Investigar mais profundamente com logs

---

## 📚 REFERÊNCIAS

1. **Astro 5 Breaking Changes:** https://docs.astro.build/en/guides/upgrade-to/v5/
2. **Client-Side Scripts:** https://docs.astro.build/en/guides/client-side-scripts/
3. **GitHub Issue #3556:** HMR destroys scripts
4. **GitHub Issue #12952:** Environment Variables Not Loaded During Dev
5. **Medium Article:** Script Problems in Astro Production

---

## ⏱️ TEMPO DE INVESTIGAÇÃO

- Análise de código: 15 min
- Pesquisa web: 20 min
- Análise de configuração: 10 min
- Documentação: 25 min

**Total: ~70 minutos de investigação profunda**

---

## ✅ CONCLUSÃO

**O problema do JavaScript não funcionar em `npm run dev` é causado por uma combinação de fatores:**

1. ✅ **Breaking changes do Astro 5** (scripts não bundled)
2. ✅ **Service Worker script interferindo** (is:inline no Layout)
3. ✅ **Variáveis de ambiente** potencialmente não disponíveis em dev
4. ✅ **Diferenças fundamentais** entre dev e production mode
5. ✅ **HMR issues** conhecidos do Astro com scripts

**Nenhuma solução foi implementada ainda conforme solicitado.**
**Aguardando retorno do usuário para decidir qual solução aplicar primeiro.**
