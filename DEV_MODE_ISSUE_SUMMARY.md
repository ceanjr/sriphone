# 🚨 RESUMO: Problema com npm run dev

**Status:** ✅ CAUSA RAIZ IDENTIFICADA
**Tempo de investigação:** ~70 minutos
**Soluções:** 6 opções documentadas (NENHUMA implementada ainda)

---

## 🎯 CAUSA RAIZ (Principal)

### **BREAKING CHANGE: Astro 5 mudou comportamento de scripts**

O Astro 5 mudou fundamentalmente como scripts funcionam:
- ❌ Scripts **NÃO SÃO MAIS HOISTED** para o `<head>`
- ❌ Múltiplos scripts **NÃO SÃO MAIS BUNDLED** juntos
- ❌ Isso causa **timing issues** em modo dev

**Fonte:** https://docs.astro.build/en/guides/upgrade-to/v5/

---

## 🔍 OUTRAS CAUSAS IDENTIFICADAS

1. **Service Worker script no Layout** (linhas 175-229)
   - Script `is:inline` executando SEMPRE
   - Pode interferir com HMR em dev mode
   - Deveria ser desabilitado em localhost

2. **Variáveis de ambiente** (`src/lib/supabase.ts`)
   - `throw new Error()` nas linhas 9-14
   - Se env vars não estiverem disponíveis, quebra TUDO
   - Bug conhecido do Astro 5.1.3+ em dev mode

3. **Diferença Dev vs Production**
   - Dev: scripts linkados via `<script src="...">`
   - Prod: scripts inlined/bundled
   - Causa comportamentos diferentes

4. **HMR Issues**
   - Scripts não re-executam após updates
   - Cache do Vite pode estar desatualizado

---

## 📁 ARQUIVOS CRIADOS

### 1. `DEV_DEBUG_FINDINGS.md`
Investigação completa com:
- ✅ Análise detalhada de código
- ✅ Pesquisa web de problemas conhecidos
- ✅ 6 soluções propostas (não implementadas)
- ✅ Referências e documentação

### 2. `src/pages/catalogo-debug.astro`
Página de diagnóstico com logs extremamente verbosos:
- Testa variáveis de ambiente
- Testa imports de módulos
- Testa elementos DOM
- Testa Service Workers
- Captura erros globais

**Como usar:**
```bash
npm run dev
# Abrir: http://localhost:4321/catalogo-debug
# F12 → Console
# Analisar logs
```

### 3. Este arquivo (`DEV_MODE_ISSUE_SUMMARY.md`)
Resumo executivo para referência rápida

---

## 💡 SOLUÇÕES DISPONÍVEIS

### Solução 1: Remover SW Script do Layout (QUICK FIX)
**Prioridade:** ALTA
**Tempo:** 2 minutos
**Impacto:** Elimina interferência em dev

```astro
<!-- src/layouts/Layout.astro -->
{import.meta.env.PROD && (
  <script is:inline>
    // SW removal script APENAS em produção
  </script>
)}
```

---

### Solução 2: Proteger Import do Supabase (SAFEGUARD)
**Prioridade:** ALTA
**Tempo:** 5 minutos
**Impacto:** Evita que erro quebre todo o código

```typescript
// src/lib/supabase.ts
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Credentials missing!');
  // NÃO throw error, apenas log
}
```

---

### Solução 3: Adicionar Logs de Diagnóstico (DEBUG)
**Prioridade:** ALTA
**Tempo:** 10 minutos
**Impacto:** Identifica EXATAMENTE onde falha

```javascript
<script>
  console.log('🔍 Script started');
  try {
    import { authService } from '../lib/supabase';
    console.log('✅ Supabase OK');
  } catch (error) {
    console.error('❌ Import failed:', error);
  }
</script>
```

---

### Solução 4: Otimizar Config do Astro (OPTIMIZATION)
**Prioridade:** MÉDIA
**Tempo:** 5 minutos
**Impacto:** Melhora resolução de módulos

```javascript
// astro.config.mjs
vite: {
  optimizeDeps: {
    include: ['@supabase/supabase-js'],
    force: true,
  },
  server: {
    hmr: { overlay: false },
  },
}
```

---

### Solução 5: Extrair Script para Arquivo (REFACTOR)
**Prioridade:** MÉDIA
**Tempo:** 20 minutos
**Impacto:** Melhor cache e HMR

Mover script grande do `catalogo.astro` para arquivo separado

---

### Solução 6: Usar Build + Preview (WORKAROUND)
**Prioridade:** BAIXA
**Tempo:** 0 minutos (já documentado)
**Impacto:** Funciona mas é lento

```bash
npm run build && npm run preview
```

---

## 🧪 COMO TESTAR

### Teste Rápido:
```bash
npm run dev
# Abrir http://localhost:4321/catalogo-debug
# Verificar console
```

### Teste Completo:
1. Abrir DevTools (F12)
2. Ir para Console
3. Procurar erros em vermelho
4. Ir para Network → Filter: JS
5. Verificar se arquivos carregam (status 200)
6. Ir para Sources → localhost:4321
7. Verificar se arquivos .js estão lá

---

## 📞 PRÓXIMOS PASSOS

Quando você retornar:

1. **Leia:** `DEV_DEBUG_FINDINGS.md` (investigação completa)
2. **Teste:** Acesse `/catalogo-debug` e verifique logs
3. **Escolha:** Qual solução implementar:
   - **Quick fix:** Solução 1 (2 min)
   - **Safe:** Soluções 1 + 2 (7 min)
   - **Debug:** Soluções 1 + 2 + 3 (17 min)
   - **Completo:** Todas as soluções (40 min)

4. **Teste:** Após implementar, executar `npm run dev` e verificar

---

## 📚 DOCUMENTAÇÃO COMPLETA

- **Investigação detalhada:** `DEV_DEBUG_FINDINGS.md`
- **Página de diagnóstico:** `src/pages/catalogo-debug.astro`
- **Troubleshooting existente:** `TROUBLESHOOTING.md`
- **Service Worker removal:** `SERVICE_WORKER_REMOVAL.md`

---

## ⏱️ ESTIMATIVA DE CORREÇÃO

- **Quick fix (Solução 1):** 2 min
- **Safeguard (Soluções 1-2):** 7 min
- **Debug completo (Soluções 1-3):** 17 min
- **Otimização total (Soluções 1-4):** 25 min
- **Refactor (Todas):** 40 min

---

## ✅ O QUE FOI FEITO

- ✅ Análise profunda do código
- ✅ Pesquisa de problemas conhecidos do Astro 5
- ✅ Identificação de múltiplas causas raiz
- ✅ Criação de página de diagnóstico
- ✅ Documentação de 6 soluções
- ✅ Correção do `npm run dev:build`

## ❌ O QUE NÃO FOI FEITO

- ❌ Nenhuma solução implementada (conforme solicitado)
- ❌ Aguardando retorno para decidir qual solução aplicar

---

**Aguardando seu retorno para implementar as correções! 🚀**
