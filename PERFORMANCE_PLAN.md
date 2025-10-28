# 🚀 PLANO DE OTIMIZAÇÃO DE PERFORMANCE - Sr. IPHONE

**Data da Análise:** 28/10/2025  
**Projeto:** Astro + Supabase + Tailwind CSS  
**Meta:** Lighthouse Score > 90 em Performance, Accessibility e Best Practices

---

## 📊 RESUMO EXECUTIVO

### ✅ Pontos Positivos Identificados
- Astro configurado para SSG (Static Site Generation) na home
- Configuração de cache agressivo no Vercel
- Service Worker implementado para PWA
- Compressão HTML ativa
- Tree-shaking e code-splitting configurados
- Critical CSS inline no Layout
- Fonte com `font-display: swap`

### ⚠️ Problemas Críticos Encontrados
1. **Página `/catalogo` com 1383 linhas** - Muito JavaScript inline
2. **168KB de código Supabase** no bundle do cliente
3. **Renderização Server-Side em todas as páginas exceto home** (`output: 'server'`)
4. **Falta de lazy loading sistemático** em componentes
5. **Consultas Supabase sem paginação real** (carrega tudo de uma vez)
6. **Cache sessionStorage** em vez de estratégia híbrida
7. **Múltiplos scripts inline** duplicados (Intersection Observer)

---

## 🔍 1. PERFORMANCE DE BUILD E RENDERIZAÇÃO

### 🔴 PROBLEMA 1.1: Página `/catalogo` Monolítica
**Impacto:** Alto  
**Localização:** `src/pages/catalogo.astro` (1383 linhas)

**Diagnóstico:**
- Script inline com 800+ linhas de JavaScript
- Lógica de negócio misturada com renderização
- Estado global gerenciado manualmente
- Funções duplicadas (ordenação, filtros)

**Solução:**
```typescript
// ANTES: catalogo.astro (1383 linhas com tudo inline)

// DEPOIS: Separar em módulos
// src/lib/catalog/state.ts - Gerenciamento de estado
// src/lib/catalog/filters.ts - Lógica de filtros
// src/lib/catalog/render.ts - Templates
// src/components/catalog/FilterBar.astro - Componente de filtros
// src/components/catalog/ProductGrid.astro - Grid de produtos
```

**Implementação:**
```bash
# 1. Criar estrutura modular
mkdir -p src/lib/catalog
mkdir -p src/components/catalog

# 2. Extrair lógica de estado
# src/lib/catalog/state.ts
export class CatalogState {
  produtos = []
  categorias = []
  filtros = {
    busca: '',
    categoria: 'todos',
    condicao: '',
    bateria: 0,
    ordenacao: 'recente'
  }
  
  aplicarFiltros() { /* ... */ }
  ordenar() { /* ... */ }
}

# 3. Usar Web Components para interatividade
# src/components/catalog/FilterBar.astro com <script> mínimo
```

**Ganho Estimado:** -30% JavaScript no cliente, melhor cache

---

### 🔴 PROBLEMA 1.2: Supabase Client-Side (168KB)
**Impacto:** Crítico  
**Localização:** Bundle `supabase.szQoanm8.js`

**Diagnóstico:**
- `@supabase/supabase-js` carregado no cliente
- Usado em scripts inline nas páginas
- Não há separação server/client

**Solução:**
```typescript
// ANTES: Import direto no cliente
import { supabase } from '../lib/supabase'

// DEPOIS: API Routes para dados
// src/pages/api/produtos.ts
export async function GET({ request }) {
  const url = new URL(request.url)
  const categoria = url.searchParams.get('categoria')
  
  const produtos = await productService.getByCategory(categoria)
  return new Response(JSON.stringify(produtos), {
    headers: { 'Content-Type': 'application/json' }
  })
}

// Cliente usa fetch nativo
fetch('/api/produtos?categoria=iphone-15')
```

**Implementação Prioritária:**
```astro
---
// src/pages/catalogo.astro
// REMOVER: import { productService } from '../lib/supabase'

// ADICIONAR: Server-side data fetching
export const prerender = false // Já está como server-side
const produtos = await productService.getAll() // Fica no server
const categorias = await categoryService.getAll()
---

<script>
  // Cliente recebe dados via props, não faz queries diretas
  const produtosIniciais = JSON.parse(document.getElementById('produtos-data').textContent)
</script>

<script type="application/json" id="produtos-data">
  {JSON.stringify({ produtos, categorias })}
</script>
```

**Ganho Estimado:** -168KB JavaScript, FCP -40%, TTI -60%

---

### 🟡 PROBLEMA 1.3: Híbrido SSR/SSG Mal Configurado
**Impacto:** Médio  
**Localização:** `astro.config.mjs`

**Diagnóstico:**
- `output: 'server'` global, mas `/index` tem `prerender: true`
- `/catalogo` deveria ser SSG com ISR (Incremental Static Regeneration)
- Páginas de produto dinâmicas sem cache

**Solução:**
```javascript
// astro.config.mjs
export default defineConfig({
  output: 'hybrid', // ⚠️ MUDAR de 'server' para 'hybrid'
  adapter: vercel({
    isr: {
      expiration: 60 * 10, // Revalidar a cada 10 minutos
      bypassToken: '...'
    }
  })
})
```

```astro
---
// src/pages/catalogo.astro
export const prerender = true // ✅ Gerar no build
export const revalidate = 600 // ✅ ISR - revalidar a cada 10min

// Dados buscados no build
const produtos = await productService.getAll()
const categorias = await categoryService.getAll()
---
```

**Para páginas de produto:**
```astro
---
// src/pages/produto/[id].astro
export const prerender = true

// Gerar todas as páginas no build
export async function getStaticPaths() {
  const produtos = await productService.getAll()
  return produtos.map(p => ({
    params: { id: p.id },
    props: { produto: p }
  }))
}

const { produto } = Astro.props
---
```

**Ganho Estimado:** LCP -50%, TTFB de 800ms → 50ms

---

### 🟡 PROBLEMA 1.4: Scripts Inline Duplicados
**Impacto:** Médio

**Diagnóstico:**
- Intersection Observer definido 2x em `catalogo.astro` (linhas 1310 e 1332)
- Lógica de imagens repetida

**Solução:**
```typescript
// src/lib/observers/lazyImages.ts
export function setupLazyImages(selector = 'img[loading="lazy"]') {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target as HTMLImageElement
        if (img.dataset.src) {
          img.src = img.dataset.src
          observer.unobserve(img)
        }
      }
    })
  }, { rootMargin: '50px' })
  
  document.querySelectorAll(selector).forEach(img => observer.observe(img))
}
```

```astro
<!-- Usar uma vez no Layout -->
<script>
  import { setupLazyImages } from '@/lib/observers/lazyImages'
  setupLazyImages()
</script>
```

**Ganho Estimado:** -5KB JavaScript duplicado

---

## ⚙️ 2. CONSULTAS E INTEGRAÇÃO COM SUPABASE

### 🔴 PROBLEMA 2.1: Falta de Paginação Real
**Impacto:** Crítico  
**Localização:** `src/pages/catalogo.astro`

**Diagnóstico:**
```typescript
// Linha 1061: Carrega TODOS os produtos de uma vez
const [produtosData, categoriasData] = await Promise.all([
  productService.getAll(), // ⚠️ Sem limit
  categoryService.getAll(),
])
```

**Solução:**
```typescript
// src/lib/supabase.ts - Adicionar paginação cursor-based
export const productService = {
  async getPaginated(cursor?: string, limit = 30) {
    let query = supabase
      .from('produtos')
      .select(`
        id, codigo, nome, descricao, preco, condicao, bateria,
        categoria_id, imagens, created_at,
        categoria:categorias(id, nome)
      `)
      .order('created_at', { ascending: false })
      .limit(limit)
    
    if (cursor) {
      query = query.lt('created_at', cursor)
    }
    
    const { data, error } = await query
    if (error) throw error
    
    return {
      produtos: data,
      nextCursor: data.length === limit ? data[data.length - 1].created_at : null
    }
  }
}
```

```typescript
// Cliente: Infinite scroll otimizado
let nextCursor = null
let loading = false

async function carregarMais() {
  if (loading || !nextCursor) return
  loading = true
  
  const response = await fetch(`/api/produtos?cursor=${nextCursor}&limit=30`)
  const { produtos, nextCursor: novoCursor } = await response.json()
  
  renderizarProdutos(produtos, 'append')
  nextCursor = novoCursor
  loading = false
}
```

**Ganho Estimado:** Payload inicial: 500KB → 80KB, FCP -70%

---

### 🟡 PROBLEMA 2.2: Cache sessionStorage Limitado
**Impacto:** Médio  
**Localização:** `src/pages/catalogo.astro` linha 1024-1060

**Diagnóstico:**
- Cache de 10 minutos apenas em sessionStorage
- Perde cache ao fechar aba
- Não usa HTTP cache nem SWR (Stale-While-Revalidate)

**Solução: Estratégia Híbrida**
```typescript
// src/lib/cache/productCache.ts
export class ProductCache {
  private static CACHE_NAME = 'sriphone-v1'
  private static TTL = 10 * 60 * 1000 // 10 min
  
  // 1. Tentar Cache API (persistente, mais rápido)
  static async get(key: string) {
    try {
      const cache = await caches.open(this.CACHE_NAME)
      const response = await cache.match(key)
      
      if (response) {
        const data = await response.json()
        const age = Date.now() - data.timestamp
        
        if (age < this.TTL) {
          return data.value
        }
      }
    } catch {}
    
    // 2. Fallback para sessionStorage
    const stored = sessionStorage.getItem(key)
    if (stored) {
      const { value, timestamp } = JSON.parse(stored)
      if (Date.now() - timestamp < this.TTL) {
        return value
      }
    }
    
    return null
  }
  
  static async set(key: string, value: any) {
    const data = { value, timestamp: Date.now() }
    
    // Cache API
    try {
      const cache = await caches.open(this.CACHE_NAME)
      const response = new Response(JSON.stringify(data))
      await cache.put(key, response)
    } catch {}
    
    // sessionStorage backup
    sessionStorage.setItem(key, JSON.stringify(data))
  }
}
```

**Com SWR no Service Worker:**
```javascript
// public/sw.js
self.addEventListener('fetch', (event) => {
  if (event.request.url.includes('/api/produtos')) {
    event.respondWith(
      caches.open('api-cache').then(cache =>
        cache.match(event.request).then(cached => {
          const fetched = fetch(event.request).then(response => {
            cache.put(event.request, response.clone())
            return response
          })
          
          // Retorna cache imediatamente, atualiza em background
          return cached || fetched
        })
      )
    )
  }
})
```

**Ganho Estimado:** Cache hit rate: 40% → 85%

---

### 🟡 PROBLEMA 2.3: Consultas sem Índices Otimizados
**Impacto:** Médio

**Diagnóstico:**
- Arquivo `supabase_indexes.sql` existe mas precisa de análise
- Filtros por `categoria_id`, `bateria`, `condicao` podem estar lentos

**Solução:**
```sql
-- supabase_indexes.sql - Adicionar/Verificar
CREATE INDEX IF NOT EXISTS idx_produtos_categoria 
  ON produtos(categoria_id);

CREATE INDEX IF NOT EXISTS idx_produtos_created 
  ON produtos(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_produtos_bateria 
  ON produtos(bateria) WHERE bateria >= 80;

CREATE INDEX IF NOT EXISTS idx_produtos_condicao 
  ON produtos(condicao);

-- Índice composto para queries comuns
CREATE INDEX IF NOT EXISTS idx_produtos_categoria_created 
  ON produtos(categoria_id, created_at DESC);

-- Analisar plano de query
EXPLAIN ANALYZE 
SELECT * FROM produtos 
WHERE categoria_id = '...' 
ORDER BY created_at DESC 
LIMIT 30;
```

**Ganho Estimado:** Query time: 200ms → 20ms

---

## 🖼️ 3. IMAGENS E MÍDIA

### ✅ BOM: Estrutura de Otimização Existente
- `imageOptimizer.ts` com funções de otimização
- Sharp configurado no Astro
- WebP como formato padrão

### 🟡 PROBLEMA 3.1: Imagens não Otimizadas do Supabase
**Impacto:** Alto  
**Localização:** `src/pages/catalogo.astro` linha 576-586

**Diagnóstico:**
```astro
<!-- Imagens do Supabase sem transformação -->
<img 
  src="${imagemPrincipal}" 
  alt="${utils.escapeHtml(produto.nome)}" 
  loading="lazy" 
/>
```

**Solução:**
```typescript
// Usar imageOptimizer em TODAS as imagens
import { optimizeSupabaseImage, generateResponsiveSrcSet, generateSizes } from '../lib/imageOptimizer'

const templates = {
  produtoCard(produto) {
    const imagemPrincipal = produto.imagens?.[0]
    const optimizedSrc = optimizeSupabaseImage(imagemPrincipal, { 
      width: 400, 
      quality: 80 
    })
    const srcset = generateResponsiveSrcSet(imagemPrincipal, [400, 600, 800])
    const sizes = generateSizes('product')
    
    return `
      <img 
        src="${optimizedSrc}"
        srcset="${srcset}"
        sizes="${sizes}"
        alt="${utils.escapeHtml(produto.nome)}" 
        loading="lazy"
        decoding="async"
        width="400"
        height="400"
      />
    `
  }
}
```

**Ganho Estimado:** Imagens: 200KB → 40KB cada, LCP -60%

---

### 🟡 PROBLEMA 3.2: Hero Image sem Priority
**Impacto:** Médio  
**Localização:** `src/components/Hero.astro`

**Diagnóstico:**
```astro
<img
  src="/images/Barbudo.webp"
  fetchpriority="high"
  loading="eager"
/>
```

**Melhorias:**
```astro
<!-- Adicionar preload no Layout -->
<link rel="preload" href="/images/Barbudo.webp" as="image" type="image/webp" />

<!-- Adicionar dimensões explícitas -->
<img
  src="/images/Barbudo.webp"
  width="50"
  height="50"
  fetchpriority="high"
  loading="eager"
  decoding="async"
  alt="Sr. IPHONE Logo"
/>
```

**Ganho Estimado:** LCP -15%

---

### 🟢 PROBLEMA 3.3: CDN e Cache Headers
**Impacto:** Baixo (já bem configurado)

**Status Atual:**
```json
// vercel.json ✅
"Cache-Control": "public, max-age=31536000, immutable"
```

**Recomendação Adicional:**
- Usar Vercel Image Optimization para imagens do Supabase
- Configurar Image CDN proxy

```typescript
// src/lib/imageOptimizer.ts
export function getVercelOptimizedUrl(url: string, width: number) {
  return `/_vercel/image?url=${encodeURIComponent(url)}&w=${width}&q=80`
}
```

---

## 📦 4. ESTRUTURA E DEPENDÊNCIAS

### ✅ BOM: Bundle Size Controlado
- Total dist: 968KB
- Supabase: 168KB (mas no cliente - problema já identificado)
- CSS: 76KB total

### 🟡 PROBLEMA 4.1: CSS Grande (56KB catalogo.css)
**Impacto:** Médio  
**Localização:** `dist/client/_astro/catalogo.D1wURyJR.css`

**Diagnóstico:**
- CSS do catálogo não está sendo purgado adequadamente
- Possíveis classes do Tailwind não usadas

**Solução:**
```javascript
// tailwind.config.mjs
export default {
  content: [
    './src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'
  ],
  safelist: [], // Remover classes não usadas da safelist
  theme: {
    extend: {}
  },
  plugins: []
}

// Verificar classes não usadas
npx tailwindcss-unused-class-scanner
```

**Ganho Estimado:** CSS: 56KB → 35KB

---

### 🟡 PROBLEMA 4.2: Font Loading
**Impacto:** Médio

**Diagnóstico:**
```css
@font-face {
  font-family: 'Halenoir';
  src: url('/fonts/Halenoir-Bold.otf') format('otf'); /* ⚠️ otf é pesado */
  font-display: swap;
}
```

**Solução:**
```bash
# 1. Converter OTF para WOFF2 (70% menor)
npx ttf2woff2 public/fonts/Halenoir-Bold.otf

# 2. Subset da fonte (apenas caracteres usados)
npx glyphhanger --subset="*.otf" --formats=woff2 --whitelist="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789ÁÉÍÓÚáéíóúÂÊÔâêôÃÕãõÇç"
```

```css
@font-face {
  font-family: 'Halenoir';
  src: url('/fonts/Halenoir-Bold.woff2') format('woff2');
  font-weight: 700;
  font-style: normal;
  font-display: swap;
  unicode-range: U+0020-007F, U+00C0-00FF; /* Apenas Latin + Acentos */
}
```

**Ganho Estimado:** Fonte: 80KB → 25KB, FCP -10%

---

### 🟢 PROBLEMA 4.3: Vercel Analytics
**Impacto:** Baixo (já otimizado)

**Status:**
- `@vercel/analytics` já está separado em chunk
- Carregado de forma assíncrona

---

## 📱 5. MOBILE E LIGHTHOUSE

### 🔴 PROBLEMA 5.1: Render-Blocking Resources
**Impacto:** Crítico

**Diagnóstico:**
- CSS global bloqueia renderização
- Fonte bloqueia render

**Solução: Critical CSS Inline Expandido**
```astro
---
// src/layouts/Layout.astro
const criticalCSS = `
  /* ADICIONAR ao critical CSS existente */
  
  /* Skeleton screens */
  .skeleton { 
    background: linear-gradient(90deg, #1a1a1a 0%, #2a2a2a 50%, #1a1a1a 100%);
    background-size: 200% 100%;
    animation: skeleton 1.5s ease-in-out infinite;
  }
  
  /* Product card skeleton */
  .product-skeleton {
    aspect-ratio: 1;
    border-radius: 16px;
  }
  
  /* Defer non-critical CSS */
  @media print { /* Move estilos menos críticos */ }
`
---

<style is:inline set:html={criticalCSS} />

<!-- Defer CSS não crítico -->
<link rel="preload" href="/styles/catalogo.css" as="style" onload="this.onload=null;this.rel='stylesheet'">
<noscript><link rel="stylesheet" href="/styles/catalogo.css"></noscript>
```

**Ganho Estimado:** FCP -40%, LCP -25%

---

### 🟡 PROBLEMA 5.2: TBT (Total Blocking Time)
**Impacto:** Alto

**Diagnóstico:**
- Script inline de 800+ linhas bloqueia thread principal
- Processamento síncrono de 100+ produtos

**Solução: Web Workers para Processamento**
```typescript
// src/workers/catalogWorker.ts
self.addEventListener('message', (e) => {
  const { type, data } = e.data
  
  switch(type) {
    case 'FILTER':
      const filtered = filterProducts(data.produtos, data.filtros)
      self.postMessage({ type: 'FILTERED', data: filtered })
      break
      
    case 'SORT':
      const sorted = sortProducts(data.produtos, data.ordenacao)
      self.postMessage({ type: 'SORTED', data: sorted })
      break
  }
})
```

```typescript
// Cliente
const worker = new Worker('/workers/catalogWorker.js')

worker.postMessage({ 
  type: 'FILTER', 
  data: { produtos, filtros } 
})

worker.onmessage = (e) => {
  if (e.data.type === 'FILTERED') {
    renderizarProdutos(e.data.data)
  }
}
```

**Ganho Estimado:** TBT: 600ms → 150ms

---

### 🟡 PROBLEMA 5.3: CLS (Cumulative Layout Shift)
**Impacto:** Médio

**Diagnóstico:**
- Imagens sem `width` e `height`
- Produtos carregam e causam shift

**Solução:**
```astro
<!-- SEMPRE adicionar dimensões -->
<img
  src={optimizedSrc}
  width="400"
  height="400"
  alt={produto.nome}
  style="aspect-ratio: 1; object-fit: cover;"
/>

<!-- Skeleton com altura fixa -->
<div class="product-grid" style="min-height: 1200px;">
  <!-- produtos -->
</div>
```

**Ganho Estimado:** CLS: 0.15 → 0.01

---

## 🚀 6. PLANO DE AÇÃO PRIORITIZADO

### 🔥 PRIORIDADE 1 - IMPACTO IMEDIATO (Semana 1)

#### ✅ Tarefa 1.1: Remover Supabase do Cliente
**Tempo:** 4 horas  
**Impacto:** -168KB JS, FCP -40%

```bash
# Checklist
[ ] Criar API routes em src/pages/api/
[ ] Mover queries para server-side
[ ] Atualizar catalogo.astro para usar fetch
[ ] Testar em produção
```

#### ✅ Tarefa 1.2: Implementar Paginação Real
**Tempo:** 3 horas  
**Impacto:** Payload -85%, TTI -60%

```bash
[ ] Adicionar getPaginated() no supabase.ts
[ ] Implementar cursor-based pagination
[ ] Adicionar infinite scroll
[ ] Testar performance
```

#### ✅ Tarefa 1.3: Otimizar Imagens
**Tempo:** 2 horas  
**Impacto:** LCP -60%

```bash
[ ] Aplicar optimizeSupabaseImage em todos os <img>
[ ] Adicionar srcset e sizes
[ ] Adicionar width/height
[ ] Converter Barbudo.webp para múltiplos tamanhos
```

#### ✅ Tarefa 1.4: Mudar para output: 'hybrid'
**Tempo:** 2 horas  
**Impacto:** TTFB: 800ms → 50ms

```bash
[ ] Alterar astro.config.mjs
[ ] Adicionar prerender nas páginas
[ ] Configurar ISR no Vercel
[ ] Deploy e teste
```

**Total Semana 1:** 11 horas  
**Ganho Esperado:** Lighthouse 60 → 85

---

### 🎯 PRIORIDADE 2 - OTIMIZAÇÕES ESTRUTURAIS (Semana 2)

#### ✅ Tarefa 2.1: Modularizar catalogo.astro
**Tempo:** 6 horas

```bash
[ ] Criar src/lib/catalog/
[ ] Extrair state management
[ ] Criar componentes FilterBar, ProductGrid
[ ] Remover código duplicado
```

#### ✅ Tarefa 2.2: Converter Fonte para WOFF2
**Tempo:** 1 hora

```bash
[ ] Instalar ttf2woff2
[ ] Converter Halenoir-Bold.otf
[ ] Criar subset da fonte
[ ] Atualizar global.css
```

#### ✅ Tarefa 2.3: Critical CSS Expandido
**Tempo:** 2 horas

```bash
[ ] Adicionar skeleton screens ao critical CSS
[ ] Defer CSS não crítico
[ ] Testar FCP/LCP
```

#### ✅ Tarefa 2.4: Web Worker para Filtros
**Tempo:** 4 horas

```bash
[ ] Criar catalogWorker.ts
[ ] Mover lógica de filtros/ordenação
[ ] Integrar no catalogo
[ ] Benchmark TBT
```

**Total Semana 2:** 13 horas  
**Ganho Esperado:** Lighthouse 85 → 92

---

### 🌟 PRIORIDADE 3 - POLISH E MOBILE (Semana 3)

#### ✅ Tarefa 3.1: Cache Híbrido (Cache API + SWR)
**Tempo:** 3 horas

```bash
[ ] Criar ProductCache class
[ ] Implementar SWR no service worker
[ ] Testar cache hit rate
```

#### ✅ Tarefa 3.2: Purge CSS Não Usado
**Tempo:** 2 horas

```bash
[ ] Analisar com Coverage do Chrome
[ ] Remover classes não usadas
[ ] Otimizar tailwind.config
```

#### ✅ Tarefa 3.3: Lazy Components
**Tempo:** 2 horas

```bash
[ ] Identificar componentes below-the-fold
[ ] Aplicar client:visible onde apropriado
[ ] Testar FCP/TTI
```

**Total Semana 3:** 7 horas  
**Ganho Esperado:** Lighthouse 92 → 95+

---

## 📈 MÉTRICAS DE SUCESSO

### Antes (Estimado)
```
Performance: 60-70
├─ FCP: 2.5s
├─ LCP: 4.2s
├─ TBT: 600ms
└─ CLS: 0.15

Payload:
├─ JS: 200KB (168KB Supabase)
├─ CSS: 76KB
├─ Imagens: ~800KB
└─ Total: ~1.1MB
```

### Depois (Meta)
```
Performance: 95+
├─ FCP: 0.8s (-68%)
├─ LCP: 1.5s (-64%)
├─ TBT: 150ms (-75%)
└─ CLS: 0.01 (-93%)

Payload:
├─ JS: 50KB (-75%)
├─ CSS: 40KB (-47%)
├─ Imagens: ~200KB (-75%)
└─ Total: ~290MB (-74%)

TTFB: 50ms (SSG)
Cache Hit Rate: 85%+
```

---

## 🛠️ FERRAMENTAS DE MONITORAMENTO

### Durante Desenvolvimento
```bash
# Lighthouse CI
npm install -g @lhci/cli
lhci autorun --upload.target=temporary-public-storage

# Bundle Analyzer
npm run build -- --stats
npx vite-bundle-visualizer

# Web Vitals Real User Monitoring
npm install web-vitals
```

### Em Produção
- Vercel Analytics (já instalado)
- Chrome User Experience Report
- Speedcurve / Calibre para monitoramento contínuo

---

## 📚 RECURSOS E REFERÊNCIAS

### Documentação
- [Astro Performance](https://docs.astro.build/en/guides/performance/)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [Vercel ISR](https://vercel.com/docs/concepts/incremental-static-regeneration)

### Benchmarks
- [Web Vitals](https://web.dev/vitals/)
- [Lighthouse Scoring](https://web.dev/performance-scoring/)

---

## ✅ CHECKLIST FINAL

### Semana 1 (Prioridade 1)
- [ ] Remover Supabase do cliente
- [ ] Implementar paginação real
- [ ] Otimizar todas as imagens
- [ ] Configurar hybrid rendering
- [ ] Deploy e teste Lighthouse

### Semana 2 (Prioridade 2)
- [ ] Modularizar catalogo.astro
- [ ] Converter fonte para WOFF2
- [ ] Expandir critical CSS
- [ ] Implementar Web Worker
- [ ] Deploy e benchmark

### Semana 3 (Prioridade 3)
- [ ] Cache híbrido (Cache API + SWR)
- [ ] Purge CSS não usado
- [ ] Lazy components
- [ ] Monitoramento contínuo
- [ ] Documentação final

---

## 🎯 RESUMO EXECUTIVO

**Problemas Críticos:** 4  
**Problemas Médios:** 8  
**Problemas Baixos:** 3  

**Tempo Total Estimado:** 31 horas  
**Ganho Estimado de Performance:** +40% Lighthouse Score  
**Redução de Payload:** -74%  
**ROI:** Alto - Melhora significativa em SEO, conversão e experiência do usuário

---

**Próximo Passo:** Começar pela Prioridade 1, Tarefa 1.1 (Remover Supabase do cliente)

---

_Análise realizada em 28/10/2025 por especialista em performance web Astro + Supabase_
