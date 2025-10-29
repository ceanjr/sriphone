# 🚀 Prompt para Claude Code — Análise Completa Astro + Supabase

## 🧠 Objetivo Geral
Analise **todo o projeto Astro + Supabase** minuciosamente, com foco em:
- Detectar **qualquer tipo de problema** (códigos, imports, SSR, cache, etc.).
- Entender **por que o CRUD (categorias e produtos)** não está funcionando corretamente.
- Corrigir ou **refatorar integralmente o CRUD**, garantindo que funcione 100%.

---

## 🔍 Escopo da Análise

### 1. Estrutura e Organização
- Mapeie todas as pastas e dependências do projeto.
- Liste arquivos e funções não utilizadas.
- Identifique imports quebrados, caminhos incorretos e duplicações.
- Detecte código obsoleto ou redundante.

### 2. Análise Detalhada do CRUD
- Analise toda a cadeia CRUD (criar, ler, atualizar, deletar):
  - **Arquivos**: `lib/supabase.ts`, `lib/crud.ts`, `/api/admin/*`, componentes de formulário.
- Verifique se o **Supabase** está inicializado corretamente (client e server).
- Confirme se as variáveis de ambiente estão corretas (`PUBLIC_SUPABASE_URL`, `PUBLIC_SUPABASE_ANON_KEY`).
- Valide respostas JSON e status codes.
- Corrija falhas como:
  - `Unexpected end of JSON input`
  - `Conflict ... is not valid JSON`
  - Falhas de persistência pós-reload.
- Corrija o CRUD para que:
  - O front envie dados corretamente.
  - O backend responda com JSON válido e status coerentes.

### 3. SSR, Cache e Service Worker
- Cheque se `export const prerender = false` está presente onde necessário.
- Identifique conflitos entre SSR dinâmico e Service Workers.
- Verifique se há cache interferindo no CRUD (principalmente em `/public`).
- Garanta que páginas admin e APIs não sejam cacheadas indevidamente.

### 4. Diagnóstico e Refatoração
- Explique tecnicamente as causas das falhas.
- Se necessário, refatore o CRUD completamente, com endpoints limpos e consistentes.
- Centralize lógica CRUD em `lib/crud.ts`.

### 5. Otimizações
- Remova `console.log`s inúteis.
- Simplifique funções longas.
- Otimize consultas ao Supabase.
- Elimine dependências e imports obsoletos.

---

## 🧱 Exemplo de Refatoração CRUD

```ts
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function POST({ request }) {
  try {
    const body = await request.json();
    const { data, error } = await supabaseAdmin
      .from('categorias')
      .insert(body)
      .select();

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), { status: 400 });
    }

    return new Response(JSON.stringify({ sucesso: true, data }), { status: 201 });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}
```

---

## 🧾 Resultado Esperado: `ANALYSIS_PLAN.md`

### 📋 Diagnóstico Geral
- Problemas detectados em cada módulo (frontend, backend, supabase, api, SW).

### 🧠 Ações Corrigidas / Refatoradas
- Lista de mudanças feitas.
- Arquivos alterados e motivos.

### ✅ TODO / Plano de Ação
- [ ] Remover arquivos não usados  
- [ ] Revisar variáveis no `.env`  
- [ ] Revalidar SSR vs SW  
- [ ] Testar CRUD completo  
- [ ] Revisar chamadas e respostas Supabase  

---

## ⚙️ Instruções Finais
- Analise **todo o projeto**, incluindo `src/lib/`, `src/api/`, `src/pages/admin/`, `components/` e `public/`.
- Refatore automaticamente o CRUD se necessário.
- Gere **um arquivo markdown com diagnóstico, correções e TODO** ao final.
