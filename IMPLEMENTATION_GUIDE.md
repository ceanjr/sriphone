# 💻 GUIA PRÁTICO DE IMPLEMENTAÇÃO - Performance Sr. IPHONE

Este documento contém **código pronto para copiar e colar** para implementar as otimizações do PERFORMANCE_PLAN.md

---

## 🔴 PRIORIDADE 1: REMOVER SUPABASE DO CLIENTE

### 1. Criar API Route para Produtos

**Criar arquivo:** `src/pages/api/produtos.ts`

```typescript
// src/pages/api/produtos.ts
import type { APIRoute } from 'astro'
import { productService } from '../../lib/supabase'

export const GET: APIRoute = async ({ request }) => {
  try {
    const url = new URL(request.url)
    const cursor = url.searchParams.get('cursor')
    const limit = parseInt(url.searchParams.get('limit') || '30')
    const categoria = url.searchParams.get('categoria')
    
    // Paginação cursor-based
    let result
    if (categoria && categoria !== 'todos') {
      result = await productService.getByCategory(categoria, cursor, limit)
    } else {
      result = await productService.getPaginated(cursor, limit)
    }
    
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300'
      }
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}
```

### 2. Atualizar Supabase Service

**Editar:** `src/lib/supabase.ts`

```typescript
// Adicionar ao productService em src/lib/supabase.ts

// SUBSTITUIR getAll() por getPaginated()
async getPaginated(cursor?: string, limit: number = 30) {
  let query = supabase
    .from('produtos')
    .select(`
      id, codigo, nome, descricao, preco, condicao, bateria,
      categoria_id, imagens, created_at,
      categoria:categorias(id, nome)
    `)
    .order('created_at', { ascending: false })
    .limit(limit)
  
  // Cursor-based pagination (mais eficiente que offset)
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

// Adicionar método por categoria
async getByCategory(categoriaId: string, cursor?: string, limit: number = 30) {
  let query = supabase
    .from('produtos')
    .select(`
      id, codigo, nome, descricao, preco, condicao, bateria,
      categoria_id, imagens, created_at,
      categoria:categorias(id, nome)
    `)
    .eq('categoria_id', categoriaId)
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
```

### 3. Atualizar Catálogo para Usar API

**Editar:** `src/pages/catalogo.astro`

```astro
---
// src/pages/catalogo.astro

// NO SERVIDOR (não muda)
import { categoryService } from '../lib/supabase'
import { productService } from '../lib/supabase'

// Buscar dados iniciais no servidor
const produtosIniciais = await productService.getPaginated(undefined, 30)
const categorias = await categoryService.getAll()
---

<!-- Passar dados para o cliente via JSON -->
<script type="application/json" id="initial-data">
  {JSON.stringify({
    produtos: produtosIniciais.produtos,
    nextCursor: produtosIniciais.nextCursor,
    categorias: categorias
  })}
</script>

<script>
  // ==================== NO CLIENTE ====================
  // REMOVER: import { productService } from '../lib/supabase'
  
  // Carregar dados iniciais do JSON inline
  const initialDataEl = document.getElementById('initial-data')
  const initialData = JSON.parse(initialDataEl?.textContent || '{}')
  
  const state = {
    produtos: initialData.produtos || [],
    categorias: initialData.categorias || [],
    nextCursor: initialData.nextCursor,
    categoriaAtiva: 'todos',
    // ... resto do estado
  }
  
  // ==================== API Functions ====================
  const api = {
    // SUBSTITUIR carregarDados()
    async carregarDados() {
      try {
        render.loading(true)
        
        // Usar dados iniciais (já carregados)
        if (state.produtos.length > 0) {
          render.categorias()
          render.produtos()
          render.loading(false)
          return
        }
        
        // Se não tiver dados, buscar da API
        const response = await fetch('/api/produtos?limit=30')
        const { produtos, nextCursor } = await response.json()
        
        state.produtos = produtos
        state.nextCursor = nextCursor
        
        render.categorias()
        render.produtos()
      } catch (error) {
        console.error('Erro ao carregar dados:', error)
      } finally {
        render.loading(false)
      }
    },
    
    // SUBSTITUIR carregarMaisProdutos()
    async carregarMaisProdutos() {
      if (state.paginacao.carregando || !state.nextCursor) return
      
      try {
        state.paginacao.carregando = true
        elementos.loadingMore.style.display = 'flex'
        
        const params = new URLSearchParams({
          cursor: state.nextCursor,
          limit: '30'
        })
        
        if (state.categoriaAtiva !== 'todos') {
          params.set('categoria', state.categoriaAtiva)
        }
        
        const response = await fetch(`/api/produtos?${params}`)
        const { produtos, nextCursor } = await response.json()
        
        // Adicionar novos produtos
        state.produtos.push(...produtos)
        state.nextCursor = nextCursor
        
        render.produtos()
      } catch (error) {
        console.error('Erro ao carregar mais produtos:', error)
      } finally {
        state.paginacao.carregando = false
        elementos.loadingMore.style.display = 'none'
      }
    },
    
    // Filtrar por categoria
    async filtrarPorCategoria(categoriaId: string) {
      try {
        render.loading(true)
        
        const params = new URLSearchParams({ limit: '30' })
        if (categoriaId !== 'todos') {
          params.set('categoria', categoriaId)
        }
        
        const response = await fetch(`/api/produtos?${params}`)
        const { produtos, nextCursor } = await response.json()
        
        state.produtos = produtos
        state.nextCursor = nextCursor
        state.categoriaAtiva = categoriaId
        
        render.produtos()
      } catch (error) {
        console.error('Erro ao filtrar:', error)
      } finally {
        render.loading(false)
      }
    }
  }
</script>
```

---

## 🔴 PRIORIDADE 2: HYBRID RENDERING

### 1. Atualizar Astro Config

**Editar:** `astro.config.mjs`

```javascript
// astro.config.mjs
import { defineConfig } from 'astro/config'
import vercel from '@astrojs/vercel'

export default defineConfig({
  site: 'https://sriphonevca.com.br',
  output: 'hybrid', // ✅ MUDAR de 'server' para 'hybrid'
  
  adapter: vercel({
    // Configurar ISR (Incremental Static Regeneration)
    isr: {
      expiration: 600, // Revalidar a cada 10 minutos
      exclude: ['/api/*', '/admin/*'] // Rotas que NÃO devem usar ISR
    },
    // Edge Functions para rotas específicas
    edgeMiddleware: true
  }),
  
  // ... resto da config
})
```

### 2. Configurar Páginas para SSG

**Editar:** `src/pages/catalogo.astro`

```astro
---
// src/pages/catalogo.astro

// ✅ ADICIONAR no topo (após imports)
export const prerender = true

// Dados serão buscados no BUILD e cacheados
import { categoryService, productService } from '../lib/supabase'

const produtosIniciais = await productService.getPaginated(undefined, 30)
const categorias = await categoryService.getAll()
---

<!-- resto do código -->
```

**Editar:** `src/pages/produto/[id].astro`

```astro
---
// src/pages/produto/[id].astro

// ✅ ADICIONAR: Static Site Generation
export const prerender = true

import { productService } from '../../lib/supabase'

// Gerar todas as páginas de produto no build
export async function getStaticPaths() {
  const produtosData = await productService.getAll()
  
  return produtosData.map(produto => ({
    params: { id: produto.id },
    props: { produto }
  }))
}

// Receber produto via props (já buscado no build)
const { produto } = Astro.props

// Se o produto não existir, redirecionar
if (!produto) {
  return Astro.redirect('/catalogo')
}

// ... resto do código
---
```

### 3. Verificar Deploy

**Criar:** `.github/workflows/lighthouse-ci.yml` (opcional, mas recomendado)

```yaml
name: Lighthouse CI
on: [push]

jobs:
  lighthouse:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build
        run: npm run build
      
      - name: Run Lighthouse CI
        run: |
          npm install -g @lhci/cli
          lhci autorun --upload.target=temporary-public-storage
```

---

## 🔴 PRIORIDADE 3: OTIMIZAR IMAGENS

### 1. Atualizar Template de Produto

**Editar:** `src/pages/catalogo.astro` - seção `templates.produtoCard()`

```typescript
// Dentro do <script> de catalogo.astro
import { optimizeSupabaseImage, generateResponsiveSrcSet, generateSizes } from '../lib/imageOptimizer'

const templates = {
  produtoCard(produto) {
    const precoFormatado = utils.formatarPreco(produto.preco)
    const bateriaWidth = utils.calcularLarguraBateria(produto.bateria)
    const bateriaColorClass = getBateriaColor(produto.bateria)
    const imagemPrincipal = produto.imagens?.[0]
    const temBateria = produto.bateria && produto.bateria > 0
    
    // ✅ OTIMIZAR IMAGEM
    const optimizedSrc = imagemPrincipal 
      ? optimizeSupabaseImage(imagemPrincipal, { width: 400, quality: 80 })
      : '/placeholder.jpg'
    
    const srcset = imagemPrincipal
      ? generateResponsiveSrcSet(imagemPrincipal, [400, 600, 800])
      : ''
    
    const sizes = generateSizes('product')
    
    // ... badges ...
    
    return `
      <a href="/produto/${produto.id}" class="produto-card" data-produto-id="${produto.id}">
        <!-- botão editar -->
        <div class="produto-image">
          ${imagemPrincipal ? `
            <img 
              src="${optimizedSrc}"
              srcset="${srcset}"
              sizes="${sizes}"
              alt="${utils.escapeHtml(produto.nome)}" 
              loading="lazy" 
              decoding="async"
              fetchpriority="low"
              width="400" 
              height="400"
              style="aspect-ratio: 1; object-fit: cover; background: linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 100%);"
            />
          ` : `
            <div class="image-placeholder">
              <!-- SVG placeholder -->
            </div>
          `}
          ${badges}
        </div>
        <!-- resto do card -->
      </a>
    `
  }
}
```

### 2. Otimizar Hero

**Editar:** `src/components/Hero.astro`

```astro
---
// src/components/Hero.astro
---

<section class="hero">
  <!-- ✅ Adicionar width/height explícitos -->
  <img
    src="/images/Barbudo.webp"
    width="50"
    height="50"
    class="hero-img"
    alt="Sr. IPHONE Logo"
    fetchpriority="high"
    decoding="sync"
    loading="eager"
  />
  <h1>Seu iPhone, com <strong>Classe e Confiança</strong></h1>
  <!-- resto do hero -->
</section>
```

**Adicionar preload no Layout:**

```astro
---
// src/layouts/Layout.astro (no <head>)
---

<head>
  <!-- ... outros meta tags ... -->
  
  <!-- ✅ Preload hero image -->
  <link 
    rel="preload" 
    href="/images/Barbudo.webp" 
    as="image" 
    type="image/webp"
    fetchpriority="high"
  />
  
  <!-- ... resto do head ... -->
</head>
```

### 3. Otimizar Página de Produto

**Editar:** `src/pages/produto/[id].astro`

```astro
---
import { optimizeSupabaseImage } from '../../lib/imageOptimizer'

// ... código de busca do produto ...

// ✅ Otimizar imagens do produto
const imagensOtimizadas = produto.imagens?.map(img => ({
  original: img,
  thumbnail: optimizeSupabaseImage(img, { width: 150, quality: 70 }),
  medium: optimizeSupabaseImage(img, { width: 800, quality: 85 }),
  large: optimizeSupabaseImage(img, { width: 1200, quality: 90 })
})) || []
---

<main class="produto-page">
  <div class="produto-galeria">
    <div class="main-image-container">
      <img 
        id="main-image"
        src={imagensOtimizadas[0]?.medium || '/placeholder.jpg'}
        srcset={`
          ${imagensOtimizadas[0]?.medium} 800w,
          ${imagensOtimizadas[0]?.large} 1200w
        `}
        sizes="(max-width: 768px) 100vw, 800px"
        alt={produto.nome}
        width="800"
        height="800"
        loading="eager"
        fetchpriority="high"
        class="main-image"
      />
    </div>

    {imagensOtimizadas.length > 1 && (
      <div class="thumbnails-container">
        <div class="thumbnails-track">
          {imagensOtimizadas.map((img, index) => (
            <button 
              class={`thumbnail ${index === 0 ? 'active' : ''}`}
              data-image={img.medium}
              data-image-large={img.large}
              aria-label={`Ver imagem ${index + 1}`}
            >
              <img 
                src={img.thumbnail} 
                alt={`${produto.nome} - Imagem ${index + 1}`}
                width="150"
                height="150"
                loading="lazy"
              />
            </button>
          ))}
        </div>
      </div>
    )}
  </div>
  <!-- resto da página -->
</main>
```

---

## 🟡 MÉDIO: CONVERTER FONTE PARA WOFF2

### 1. Instalar Ferramentas

```bash
# No terminal
npm install -D @fontsource/fontsource
npm install -g ttf2woff2
```

### 2. Converter Fonte

```bash
# Converter OTF para WOFF2
cd public/fonts
ttf2woff2 Halenoir-Bold.otf

# Ou usar online: https://cloudconvert.com/otf-to-woff2
```

### 3. Criar Subset (opcional, mas recomendado)

```bash
# Instalar glyphhanger
npm install -g glyphhanger

# Criar subset apenas com caracteres usados
glyphhanger --subset=Halenoir-Bold.otf \
  --formats=woff2 \
  --whitelist="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789 ÁÉÍÓÚáéíóúÂÊÔâêôÃÕãõÇç.,:;!?-()[]"
```

### 4. Atualizar CSS

**Editar:** `src/styles/global.css`

```css
/* src/styles/global.css */

@font-face {
  font-family: 'Halenoir';
  /* ✅ WOFF2 primeiro (mais leve) */
  src: url('/fonts/Halenoir-Bold.woff2') format('woff2'),
       url('/fonts/Halenoir-Bold.otf') format('opentype'); /* fallback */
  font-weight: 700;
  font-style: normal;
  font-display: swap;
  /* ✅ Subset Unicode range */
  unicode-range: U+0020-007F, U+00C0-00FF; /* Latin + Acentos */
}

/* Se tiver versão regular, adicionar também */
@font-face {
  font-family: 'Halenoir';
  src: url('/fonts/Halenoir-Regular.woff2') format('woff2');
  font-weight: 400;
  font-style: normal;
  font-display: swap;
  unicode-range: U+0020-007F, U+00C0-00FF;
}
```

### 5. Preload no Layout

**Editar:** `src/layouts/Layout.astro`

```astro
<head>
  <!-- ✅ Preload WOFF2 -->
  <link 
    rel="preload" 
    href="/fonts/Halenoir-Bold.woff2" 
    as="font" 
    type="font/woff2" 
    crossorigin
  />
</head>
```

---

## 🟡 MÉDIO: CRITICAL CSS EXPANDIDO

### 1. Expandir Critical CSS

**Editar:** `src/layouts/Layout.astro`

```astro
---
const criticalCSS = `
/* Critical CSS inline - Performance otimizada */

/* EXISTENTE (manter) */
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
body { background: #000; color: #fff; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }

/* ADICIONAR: Skeleton Screens */
.skeleton {
  background: linear-gradient(90deg, #1a1a1a 0%, #2a2a2a 50%, #1a1a1a 100%);
  background-size: 200% 100%;
  animation: skeleton-pulse 1.5s ease-in-out infinite;
}

@keyframes skeleton-pulse {
  0%, 100% { background-position: 200% 0; }
  50% { background-position: -200% 0; }
}

/* Product skeleton */
.product-skeleton {
  aspect-ratio: 1;
  border-radius: 16px;
  overflow: hidden;
}

.product-skeleton-title {
  height: 24px;
  width: 70%;
  margin: 1rem 0 0.5rem;
  border-radius: 4px;
}

.product-skeleton-desc {
  height: 16px;
  width: 90%;
  margin-bottom: 0.5rem;
  border-radius: 4px;
}

.product-skeleton-price {
  height: 32px;
  width: 40%;
  margin-top: 1rem;
  border-radius: 4px;
}

/* Loading state */
.loading-products .produto-card {
  pointer-events: none;
  opacity: 0.6;
}

/* Above the fold optimization */
.hero, .seminovos { min-height: auto; }

/* Prevent layout shift */
img[width][height] { aspect-ratio: attr(width) / attr(height); }

/* Performance hints */
.will-change-transform { will-change: transform; }
.gpu-accelerated { transform: translateZ(0); backface-visibility: hidden; }
`
---

<style is:inline set:html={criticalCSS} />
```

### 2. Defer CSS Não Crítico

```astro
<!-- NO <head> do Layout.astro -->

<!-- ✅ Defer CSS de páginas específicas -->
<link 
  rel="preload" 
  href="/styles/catalogo.css" 
  as="style" 
  onload="this.onload=null;this.rel='stylesheet'"
>
<noscript>
  <link rel="stylesheet" href="/styles/catalogo.css">
</noscript>
```

---

## 🟡 MÉDIO: CACHE HÍBRIDO

### 1. Criar ProductCache Class

**Criar arquivo:** `src/lib/cache/productCache.ts`

```typescript
// src/lib/cache/productCache.ts

export class ProductCache {
  private static CACHE_NAME = 'sriphone-api-v1'
  private static TTL = 10 * 60 * 1000 // 10 minutos
  
  /**
   * Buscar do cache (Cache API primeiro, sessionStorage como fallback)
   */
  static async get<T>(key: string): Promise<T | null> {
    // 1. Tentar Cache API (mais rápido e persistente)
    try {
      if ('caches' in window) {
        const cache = await caches.open(this.CACHE_NAME)
        const response = await cache.match(key)
        
        if (response) {
          const data = await response.json()
          const age = Date.now() - data.timestamp
          
          if (age < this.TTL) {
            console.log(`✅ Cache HIT (Cache API): ${key}`)
            return data.value as T
          } else {
            // Expirado, deletar
            await cache.delete(key)
          }
        }
      }
    } catch (error) {
      console.warn('Cache API failed:', error)
    }
    
    // 2. Fallback para sessionStorage
    try {
      const stored = sessionStorage.getItem(key)
      if (stored) {
        const { value, timestamp } = JSON.parse(stored)
        const age = Date.now() - timestamp
        
        if (age < this.TTL) {
          console.log(`✅ Cache HIT (sessionStorage): ${key}`)
          return value as T
        } else {
          sessionStorage.removeItem(key)
        }
      }
    } catch (error) {
      console.warn('sessionStorage failed:', error)
    }
    
    console.log(`❌ Cache MISS: ${key}`)
    return null
  }
  
  /**
   * Salvar no cache (ambos Cache API e sessionStorage)
   */
  static async set(key: string, value: any): Promise<void> {
    const data = {
      value,
      timestamp: Date.now()
    }
    
    // 1. Cache API
    try {
      if ('caches' in window) {
        const cache = await caches.open(this.CACHE_NAME)
        const response = new Response(JSON.stringify(data), {
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': `max-age=${this.TTL / 1000}`
          }
        })
        await cache.put(key, response)
        console.log(`💾 Cached (Cache API): ${key}`)
      }
    } catch (error) {
      console.warn('Cache API set failed:', error)
    }
    
    // 2. sessionStorage backup
    try {
      sessionStorage.setItem(key, JSON.stringify(data))
      console.log(`💾 Cached (sessionStorage): ${key}`)
    } catch (error) {
      console.warn('sessionStorage set failed:', error)
    }
  }
  
  /**
   * Deletar do cache
   */
  static async delete(key: string): Promise<void> {
    try {
      if ('caches' in window) {
        const cache = await caches.open(this.CACHE_NAME)
        await cache.delete(key)
      }
      sessionStorage.removeItem(key)
      console.log(`🗑️ Cache deleted: ${key}`)
    } catch (error) {
      console.warn('Cache delete failed:', error)
    }
  }
  
  /**
   * Limpar todo o cache
   */
  static async clear(): Promise<void> {
    try {
      if ('caches' in window) {
        await caches.delete(this.CACHE_NAME)
      }
      sessionStorage.clear()
      console.log('🗑️ Cache cleared')
    } catch (error) {
      console.warn('Cache clear failed:', error)
    }
  }
}
```

### 2. Usar no Catálogo

**Editar:** `src/pages/catalogo.astro`

```typescript
// No <script> de catalogo.astro
import { ProductCache } from '../lib/cache/productCache'

const api = {
  async carregarDados() {
    try {
      render.loading(true)
      
      // ✅ Tentar buscar do cache
      const cacheKey = '/api/produtos?limit=30'
      const cached = await ProductCache.get(cacheKey)
      
      if (cached) {
        state.produtos = cached.produtos
        state.nextCursor = cached.nextCursor
        render.categorias()
        render.produtos()
        render.loading(false)
        
        // Revalidar em background (SWR - Stale While Revalidate)
        this.revalidarEmBackground(cacheKey)
        return
      }
      
      // Cache miss - buscar da API
      const response = await fetch(cacheKey)
      const data = await response.json()
      
      state.produtos = data.produtos
      state.nextCursor = data.nextCursor
      
      // ✅ Salvar no cache
      await ProductCache.set(cacheKey, data)
      
      render.categorias()
      render.produtos()
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
    } finally {
      render.loading(false)
    }
  },
  
  // Revalidar cache em background
  async revalidarEmBackground(cacheKey: string) {
    try {
      const response = await fetch(cacheKey)
      const data = await response.json()
      
      // Atualizar cache silenciosamente
      await ProductCache.set(cacheKey, data)
      console.log('🔄 Cache revalidado em background')
    } catch (error) {
      console.warn('Falha ao revalidar cache:', error)
    }
  }
}
```

---

## 📊 COMO TESTAR

### 1. Lighthouse Local

```bash
# Build do projeto
npm run build

# Servir localmente
npx serve dist -p 3000

# Rodar Lighthouse
npx lighthouse http://localhost:3000 --view --preset=desktop
npx lighthouse http://localhost:3000 --view --preset=mobile
```

### 2. Bundle Analysis

```bash
# Analisar tamanho do bundle
npm run build -- --stats

# Visualizar com bundle analyzer
npx vite-bundle-visualizer
```

### 3. Comparar Antes/Depois

```bash
# Criar baseline
git checkout main
npm run build
npx lighthouse http://localhost:3000 --output=json --output-path=./lighthouse-before.json

# Testar mudanças
git checkout feature/performance
npm run build
npx lighthouse http://localhost:3000 --output=json --output-path=./lighthouse-after.json

# Comparar
npx lighthouse-ci compare lighthouse-before.json lighthouse-after.json
```

---

## ✅ VERIFICAÇÃO FINAL

### Checklist Pós-Implementação

```bash
# 1. Build sem erros
npm run build
# ✅ Deve completar sem erros

# 2. Lighthouse Score
npx lighthouse http://localhost:3000
# ✅ Performance > 90
# ✅ Accessibility > 90
# ✅ Best Practices > 90

# 3. Bundle size
du -sh dist
# ✅ Deve ser < 1MB

# 4. Payload inicial
# Abrir DevTools → Network → Disable cache → Reload
# ✅ JS < 100KB
# ✅ CSS < 50KB
# ✅ Images < 300KB (primeiras 6)

# 5. Web Vitals
# Abrir DevTools → Lighthouse → View Trace
# ✅ FCP < 1.8s
# ✅ LCP < 2.5s
# ✅ TBT < 200ms
# ✅ CLS < 0.1
```

---

**📝 Nota:** Sempre commitar cada otimização separadamente para facilitar rollback se necessário!

---

_Última atualização: 28/10/2025_
