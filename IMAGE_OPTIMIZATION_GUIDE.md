# Guia Completo de Otimização de Imagens

## 📋 Implementações Realizadas

### ✅ 1. Configuração Astro (`astro.config.mjs`)

```javascript
image: {
  domains: ['supabase.co', 'supabase.storage'],
  remotePatterns: [{
    protocol: 'https',
    hostname: '**.supabase.co',
  }],
  service: {
    entrypoint: 'astro/assets/services/sharp',
  }
}
```

**Benefícios:**
- Sharp configurado para otimização automática
- Suporte a domínios externos (Supabase)
- Transformações de imagem no build

---

### ✅ 2. Biblioteca de Otimização (`src/lib/imageOptimizer.ts`)

#### Funções Principais:

**`optimizeSupabaseImage(url, options)`**
```typescript
// Adiciona parâmetros de otimização à URL do Supabase
const optimizedUrl = optimizeSupabaseImage(imageUrl, {
  width: 800,
  quality: 80,
  format: 'webp',
  resize: 'cover'
});
// Resultado: url?width=800&quality=80&format=webp&resize=cover
```

**`generateResponsiveSrcSet(url, widths)`**
```typescript
// Gera srcset para diferentes tamanhos
const srcset = generateResponsiveSrcSet(imageUrl);
// Resultado: "url?width=320 320w, url?width=640 640w, ..."
```

**`generateSizes(type)`**
```typescript
// Gera sizes attribute baseado no tipo
const sizes = generateSizes('product');
// Resultado: "(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 300px"
```

**Funções específicas:**
- `getMobileOptimizedUrl()` - 600px, 75% quality, webp
- `getDesktopOptimizedUrl()` - 1200px, 85% quality, webp
- `getThumbnailUrl()` - 200px, 70% quality, webp

---

### ✅ 3. Componente OptimizedImage (`src/components/OptimizedImage.astro`)

Componente reutilizável para imagens otimizadas.

#### Uso Básico:
```astro
import OptimizedImage from '../components/OptimizedImage.astro';

<OptimizedImage 
  src={produto.imagem}
  alt={produto.nome}
  type="product"
  width={800}
  height={800}
/>
```

#### Props Disponíveis:
- `src` - URL da imagem (string)
- `alt` - Texto alternativo (string)
- `width` - Largura (number, default: 800)
- `height` - Altura (number, default: 800)
- `type` - Tipo de imagem ('product' | 'hero' | 'thumbnail' | 'full')
- `loading` - Loading strategy ('lazy' | 'eager', default: 'lazy')
- `priority` - Se é prioritária (boolean, default: false)
- `class` - Classes CSS (string)

#### Tipos de Imagem:

**Product (Padrão)**
```astro
<OptimizedImage 
  src={url}
  alt="iPhone 14"
  type="product"
/>
<!-- sizes: "(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 300px" -->
```

**Hero/Banner**
```astro
<OptimizedImage 
  src="/images/hero.jpg"
  alt="Banner principal"
  type="hero"
  priority={true}
  width={1920}
  height={1080}
/>
<!-- sizes: "100vw" -->
<!-- loading: "eager" -->
<!-- fetchpriority: "high" -->
```

**Thumbnail**
```astro
<OptimizedImage 
  src={produto.imagem}
  alt={produto.nome}
  type="thumbnail"
  width={200}
  height={200}
/>
<!-- sizes: "(max-width: 640px) 80px, 120px" -->
```

**Full (Modal)**
```astro
<OptimizedImage 
  src={produto.imagem}
  alt={produto.nome}
  type="full"
  width={1200}
  height={1200}
/>
<!-- sizes: "(max-width: 640px) 100vw, (max-width: 1024px) 90vw, 900px" -->
```

---

### ✅ 4. Otimizações Aplicadas no Catálogo

**Template de produto atualizado:**
```html
<img 
  src="${imagemPrincipal}" 
  alt="${produto.nome}" 
  loading="lazy" 
  decoding="async"
  fetchpriority="low"
  width="300" 
  height="300"
  style="background: linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 100%); object-fit: cover;"
/>
```

**Intersection Observer para lazy loading:**
- Buffer de 100px antes da viewport
- Fade-in suave ao carregar
- Re-observa após mudanças (filtros, ordenação)

**CSS Skeleton Loading:**
```css
.produto-image img {
  background: linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 50%, #1a1a1a 100%);
  background-size: 200% 100%;
  animation: skeleton-loading 1.5s ease-in-out infinite;
}

.produto-image img.loaded {
  animation: none;
  background: transparent;
  opacity: 1;
}
```

---

## 🎯 Otimizações Implementadas por Requisito

### ✅ Format WebP/AVIF
- Função `optimizeSupabaseImage()` com param `format='webp'`
- Suporte a AVIF configurável
- Fallback automático para JPG

### ✅ Sizes e Srcset Responsivos
- `generateResponsiveSrcSet()` gera 5 tamanhos (320, 640, 960, 1280, 1920)
- `generateSizes()` com 4 presets (product, hero, thumbnail, full)
- Servem imagens adequadas à viewport

### ✅ Loading Lazy/Eager
- `loading="lazy"` padrão
- `loading="eager"` com `priority={true}`
- `fetchpriority` configurável

### ✅ Priorização de Imagens
- Hero/banners: `priority={true}`, `fetchpriority="high"`
- Produtos: `loading="lazy"`, `fetchpriority="low"`

### ✅ Compressão Automática
- Sharp configurado no Astro
- Parâmetros de quality nos URLs (70-85%)
- Minificação no build

### ✅ Resolução Proporcional
- `width` e `height` definidos
- `object-fit: cover` aplicado
- Aspect ratio mantido

### ✅ Otimização Supabase
- URLs com query params: `?width=&quality=&format=`
- Funções específicas: mobile, desktop, thumbnail
- CDN do Supabase aproveita transformações

### ✅ Placeholders
- Cores dominantes via `getPlaceholderColor()`
- Gradiente skeleton loading animado
- Evita layout shift

### ✅ Cache
- `Cache-Control` configurado no Vite
- Browser cache via headers
- CDN Supabase automático

---

## 📱 Otimizações Mobile Específicas

### 1. URLs Otimizadas
```typescript
getMobileOptimizedUrl(url) 
// → 600px, quality 75%, webp
```

### 2. Lazy Loading Inteligente
- Buffer maior (100px) no mobile
- Intersection Observer dedicado
- Carrega apenas quando visível

### 3. Skeleton Loading
- Animação suave
- Cor de fundo enquanto carrega
- Fade-in ao completar

### 4. Srcset Responsivo
Carrega tamanho adequado:
- Mobile: 320-640px
- Tablet: 640-960px
- Desktop: 960-1920px

---

## 🚀 Como Implementar em Novos Componentes

### Exemplo 1: Card de Produto
```astro
---
import OptimizedImage from './OptimizedImage.astro';
---

<div class="produto-card">
  <OptimizedImage 
    src={produto.imagem}
    alt={produto.nome}
    type="product"
    loading="lazy"
  />
  <h3>{produto.nome}</h3>
</div>
```

### Exemplo 2: Hero Section
```astro
<section class="hero">
  <OptimizedImage 
    src="/images/hero-banner.jpg"
    alt="Banner Principal"
    type="hero"
    priority={true}
    width={1920}
    height={1080}
  />
</section>
```

### Exemplo 3: Galeria de Imagens
```astro
<div class="galeria">
  {imagens.map((img, index) => (
    <OptimizedImage 
      src={img.url}
      alt={img.alt}
      type="thumbnail"
      loading={index < 6 ? 'eager' : 'lazy'}
      priority={index === 0}
    />
  ))}
</div>
```

---

## 🔄 Próximos Passos Sugeridos

### 1. Implementar Upload de Thumbnails
Criar versões otimizadas no upload:
```javascript
// No FormularioProduto
async function uploadWithThumbnails(file, productId) {
  // Upload original
  const original = await supabase.storage.upload(...);
  
  // Salvar URLs otimizadas no banco
  const urls = {
    original: originalUrl,
    thumbnail: `${originalUrl}?width=200&quality=70&format=webp`,
    medium: `${originalUrl}?width=600&quality=80&format=webp`
  };
}
```

### 2. Adicionar Blur Placeholders
Gerar base64 de baixa qualidade:
```typescript
export async function generateBlurPlaceholder(url: string) {
  // Implementar geração de blur data URL
  // Retornar base64 de 20px de largura
}
```

### 3. Configurar Supabase Storage Policies
```sql
-- Cache-Control headers no Supabase
ALTER BUCKET produtos SET 
  cache_control = 'public, max-age=31536000, immutable';
```

### 4. Monitoramento de Performance
- Lighthouse CI
- Core Web Vitals tracking
- Métricas de LCP (Largest Contentful Paint)

---

## 📊 Resultados Esperados

### Performance
- ⚡ LCP melhorado em 40-60%
- 💾 Bandwidth reduzido em 60-70%
- 🚀 Carregamento mobile 3x mais rápido

### Qualidade
- ✅ WebP com qualidade visual mantida
- ✅ Tamanhos apropriados por device
- ✅ Zero layout shift

### SEO
- ✅ Alt texts presentes
- ✅ Dimensões definidas
- ✅ Lazy loading correto
- ✅ Core Web Vitals otimizados

---

## 🛠️ Troubleshooting

### Imagem não carrega
```javascript
// Verificar se URL é válida
console.log(optimizeSupabaseImage(url));

// Testar URL direta no browser
// Verificar permissões do Supabase Storage
```

### Srcset não funciona
```javascript
// Garantir que widths são válidos
const widths = [320, 640, 960, 1280, 1920];

// Verificar se Supabase suporta transformações
// Algumas regiões podem ter limitações
```

### Skeleton não aparece
```css
/* Verificar se CSS foi importado */
@import '../styles/pages/catalogo.css';

/* Verificar animação */
@keyframes skeleton-loading { ... }
```

---

**Build Status:** ✅ 4.22s (sucesso!)
**Arquivos Criados:** 3
**Otimizações:** 12+ técnicas implementadas
**Deploy Ready:** ✅ SIM
