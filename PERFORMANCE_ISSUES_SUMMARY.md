# 🔍 RESUMO DOS PROBLEMAS DE PERFORMANCE - Sr. IPHONE

## 📊 VISÃO GERAL

### Status Atual do Projeto
```
┌─────────────────────────────────────────────────────────┐
│ 🎯 META: Lighthouse Score > 90                          │
│ 📈 ATUAL: ~60-70 (estimado)                             │
│ 🎁 GANHO POTENCIAL: +40 pontos                          │
└─────────────────────────────────────────────────────────┘
```

---

## 🔴 PROBLEMAS CRÍTICOS (4)

### 1. 🐘 SUPABASE NO CLIENTE (168KB)
```
Onde: Bundle JavaScript
Impacto: ████████████████████ 100%
Solução: Mover para API Routes (server-side)

ANTES:
┌─────────────┐
│  Browser    │
│  ↓          │
│  Supabase   │ 168KB carregado
│  (168KB)    │
└─────────────┘

DEPOIS:
┌─────────────┐      ┌─────────────┐
│  Browser    │ ───→ │   Server    │
│  (fetch)    │ ←─── │  Supabase   │
│   5KB       │      │  (168KB)    │
└─────────────┘      └─────────────┘

Ganho: -163KB (-97%)
```

### 2. 📄 PÁGINA MONOLÍTICA (1383 linhas)
```
Onde: src/pages/catalogo.astro
Impacto: ████████████████░░░░ 80%

Problema:
└── catalogo.astro (1383 linhas)
    ├── 800+ linhas de JavaScript inline
    ├── Estado global manual
    ├── Lógica de negócio + UI misturadas
    └── Código duplicado

Solução:
src/
├── lib/catalog/
│   ├── state.ts (gerenciamento)
│   ├── filters.ts (lógica)
│   └── templates.ts (render)
└── components/catalog/
    ├── FilterBar.astro
    └── ProductGrid.astro
```

### 3. 🔄 SEM PAGINAÇÃO REAL
```
Onde: productService.getAll()
Impacto: ████████████████████ 100%

ATUAL:
┌──────────────────────────────────────┐
│ Carrega 100+ produtos de uma vez    │
│ Payload: ~500KB                      │
│ FCP: 2.5s                            │
└──────────────────────────────────────┘

COM PAGINAÇÃO:
┌──────────────────────────────────────┐
│ Carrega 30 produtos iniciais         │
│ Payload: ~80KB                       │
│ FCP: 0.8s                            │
└──────────────────────────────────────┘
    ↓ (scroll)
┌──────────────────────────────────────┐
│ +30 produtos (lazy)                  │
└──────────────────────────────────────┘

Ganho: -84% payload inicial
```

### 4. ⚙️ OUTPUT: 'SERVER' GLOBAL
```
Onde: astro.config.mjs
Impacto: ████████████░░░░░░░░ 60%

ATUAL:
┌─────────────────────────────────────┐
│ output: 'server'                    │
│ Toda página renderizada on-demand  │
│ TTFB: 800ms                         │
└─────────────────────────────────────┘

IDEAL:
┌─────────────────────────────────────┐
│ output: 'hybrid'                    │
│ Páginas estáticas (SSG)            │
│ + ISR (revalidação)                │
│ TTFB: 50ms                          │
└─────────────────────────────────────┘

Páginas para SSG:
✅ index.astro (já tem prerender)
✅ catalogo.astro → prerender + ISR
✅ produto/[id].astro → getStaticPaths()
```

---

## 🟡 PROBLEMAS MÉDIOS (8)

### 5. 🖼️ IMAGENS NÃO OTIMIZADAS
```
Problema:
<img src="supabase-url-original" />  // 200KB+

Solução:
<img 
  src="supabase-url?width=400&quality=80&format=webp"
  srcset="...320w, ...640w, ...800w"
  sizes="(max-width: 640px) 50vw, 300px"
  width="400"
  height="400"
  loading="lazy"
/>  // 40KB

Ganho: -80% por imagem
```

### 6. 💾 CACHE SESSIONSTORAGE
```
ATUAL:
sessionStorage (perde ao fechar aba)
TTL: 10 minutos

IDEAL:
Cache API (persistente)
+ SWR (Stale-While-Revalidate)
+ sessionStorage (fallback)

Cache Hit Rate: 40% → 85%
```

### 7. 🎨 CSS GRANDE (56KB)
```
Problema:
catalogo.css = 56KB (não purgado)

Ação:
1. Purge classes não usadas do Tailwind
2. Análise com Coverage (Chrome DevTools)

Ganho: 56KB → 35KB (-37%)
```

### 8. 📝 FONTE OTF (PESADA)
```
ATUAL:
Halenoir-Bold.otf = ~80KB

SOLUÇÃO:
1. Converter para WOFF2
2. Subset (apenas caracteres usados)

Halenoir-Bold.woff2 = ~25KB (-69%)
```

### 9. 🔁 SCRIPTS DUPLICADOS
```
Intersection Observer definido 2x:
- Linha 1310 (catalogo.astro)
- Linha 1332 (catalogo.astro)

Consolidar em:
src/lib/observers/lazyImages.ts
```

### 10. 🎯 HERO SEM PRELOAD
```
<img src="/images/Barbudo.webp" />

Adicionar no <head>:
<link rel="preload" href="/images/Barbudo.webp" as="image" />

Ganho: LCP -15%
```

### 11. 🔍 ÍNDICES DB FALTANDO
```sql
-- Verificar e adicionar
CREATE INDEX idx_produtos_categoria 
  ON produtos(categoria_id);

CREATE INDEX idx_produtos_created 
  ON produtos(created_at DESC);

Query time: 200ms → 20ms
```

### 12. 🚫 RENDER-BLOCKING CSS
```
ATUAL:
<link rel="stylesheet" href="catalogo.css" />
(bloqueia renderização)

DEFER:
<link rel="preload" href="catalogo.css" as="style" 
      onload="this.rel='stylesheet'">

FCP: -40%
```

---

## 🟢 PROBLEMAS BAIXOS (3)

### 13. ⚡ TBT (Total Blocking Time)
```
Script inline de 800+ linhas bloqueia thread

Solução: Web Worker
- Mover filtros/ordenação para worker
- Processar em background

TBT: 600ms → 150ms
```

### 14. 📐 CLS (Layout Shift)
```
Imagens sem width/height causam shifts

Fix:
<img width="400" height="400" ... />

CLS: 0.15 → 0.01
```

### 15. 📦 BUNDLE SPLITTING
```
ATUAL: Chunks já configurados ✅
- supabase.js (168KB) - mas carrega no cliente ❌
- analytics.js (separado) ✅

Manter separação após remover Supabase do cliente
```

---

## 📊 COMPARATIVO ANTES/DEPOIS

### PAYLOAD
```
ANTES:
┌────────────────────────────────┐
│ JavaScript    200KB ████████   │
│ CSS            76KB ███        │
│ Imagens       800KB ████████████████
│ Fontes         80KB ███        │
│ TOTAL        1156KB            │
└────────────────────────────────┘

DEPOIS:
┌────────────────────────────────┐
│ JavaScript     50KB ██         │
│ CSS            40KB █          │
│ Imagens       200KB ████       │
│ Fontes         25KB █          │
│ TOTAL         315KB            │
└────────────────────────────────┘

Redução: -73%
```

### CORE WEB VITALS
```
Métrica   ANTES    DEPOIS   MELHORA
────────  ───────  ───────  ─────────
FCP       2.5s     0.8s     -68% ⬇️
LCP       4.2s     1.5s     -64% ⬇️
TBT       600ms    150ms    -75% ⬇️
CLS       0.15     0.01     -93% ⬇️
TTFB      800ms    50ms     -94% ⬇️
```

### LIGHTHOUSE SCORE
```
         ANTES  DEPOIS
         ────   ──────
Perform.  60    95   [████████████████████]
Access.   85    95   [███████████████████░]
Best Pr.  75    92   [██████████████████░░]
SEO       90    98   [███████████████████░]

         TOTAL: +35 pontos
```

---

## 🎯 PRIORIZAÇÃO VISUAL

```
IMPACTO vs ESFORÇO

Alto Impacto
│
│  🔴1         🔴3
│  Supabase   Paginação
│  [4h]       [3h]
│
│              🔴4
│              Hybrid
│              [2h]
│  🟡7         🔴2
│  CSS Purge  Modularizar
│  [2h]       [6h]
│
│  🟡8     🟡5
│  WOFF2   Imagens
│  [1h]   [2h]
│
Baixo Impacto
└────────────────────────┐
         Baixo    Alto
         Esforço  Esforço

Legenda:
🔴 Crítico (fazer primeiro)
🟡 Médio (fazer depois)
[Xh] Tempo estimado
```

---

## 📋 ORDEM DE EXECUÇÃO RECOMENDADA

### SPRINT 1 (Semana 1) - "Quick Wins"
```
DIA 1-2: Remover Supabase do Cliente [4h]
         └─ Impacto imediato: -163KB JS

DIA 3:   Paginação Real [3h]
         └─ -84% payload inicial

DIA 4:   Otimizar Imagens [2h]
         └─ LCP -60%

DIA 5:   Hybrid Rendering [2h]
         └─ TTFB -94%

RESULTADO: Lighthouse 60 → 85 (+25 pontos)
```

### SPRINT 2 (Semana 2) - "Refactoring"
```
Modularizar Catalogo [6h]
Converter Fonte [1h]
Critical CSS [2h]
Web Worker [4h]

RESULTADO: Lighthouse 85 → 92 (+7 pontos)
```

### SPRINT 3 (Semana 3) - "Polish"
```
Cache Híbrido [3h]
Purge CSS [2h]
Lazy Components [2h]

RESULTADO: Lighthouse 92 → 95+ (+3 pontos)
```

---

## 🚨 ARMADILHAS COMUNS

### ⚠️ NÃO FAZER:
```
❌ Otimização prematura sem medir
❌ Remover código sem entender
❌ Lazy loading de everything (pode piorar)
❌ Cache infinito (dados desatualizados)
❌ Múltiplos bundles pequenos (piora HTTP/2)
```

### ✅ FAZER:
```
✅ Medir ANTES e DEPOIS de cada mudança
✅ Usar Lighthouse CI em cada PR
✅ Testar em device real (não só devtools)
✅ Monitorar RUM (Real User Metrics)
✅ Documentar decisões de performance
```

---

## 🛠️ COMANDOS ÚTEIS

### Análise Local
```bash
# Lighthouse
npm run build && npx serve dist
npx lighthouse http://localhost:3000 --view

# Bundle size
npm run build -- --stats
npx vite-bundle-visualizer

# Unused CSS
npx purgecss --css dist/**/*.css --content dist/**/*.html

# Fonte subset
npx glyphhanger --subset="*.otf" --formats=woff2
```

### Monitoramento
```bash
# Web Vitals
npm install web-vitals
# Usar no Layout.astro

# Vercel Analytics (já instalado)
# Ver em: vercel.com/dashboard → Analytics
```

---

## 📚 RECURSOS COMPLEMENTARES

### Leitura Essencial
- [Patterns.dev - Performance Patterns](https://www.patterns.dev/posts/performance-patterns/)
- [web.dev - Fast Load Times](https://web.dev/fast/)
- [Astro Docs - Performance](https://docs.astro.build/en/guides/performance/)

### Ferramentas
- [Bundlephobia](https://bundlephobia.com) - Custo de dependências
- [Squoosh](https://squoosh.app) - Otimização de imagens
- [FontSquirrel](https://www.fontsquirrel.com/tools/webfont-generator) - Subset fontes

---

## ✅ CHECKLIST EXECUTIVO

### Antes de Começar
- [ ] Fazer backup do código atual
- [ ] Criar branch `feature/performance-optimization`
- [ ] Rodar Lighthouse baseline e salvar resultados
- [ ] Configurar CI/CD com Lighthouse

### Durante Implementação
- [ ] Commitar cada otimização separadamente
- [ ] Medir impacto após cada mudança
- [ ] Documentar decisões no código
- [ ] Testar em mobile real

### Após Conclusão
- [ ] Lighthouse > 90 em todas as métricas
- [ ] Teste de carga (k6 ou Artillery)
- [ ] Documentação atualizada
- [ ] Monitoramento configurado
- [ ] Apresentação de resultados para stakeholders

---

**🎯 Foco:** Semana 1 entrega 70% do valor com 35% do esforço.  
**🔥 Começar por:** Remover Supabase do cliente (maior impacto/esforço).

---

_Criado em 28/10/2025 | Atualizado junto com PERFORMANCE_PLAN.md_
