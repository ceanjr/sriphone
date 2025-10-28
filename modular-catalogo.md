# 🧩 Plano de Modularização — Catálogo Astro + Supabase

## 🎯 Objetivo
Melhorar a performance, a manutenibilidade e a escalabilidade do catálogo usando uma arquitetura modular leve.  
Baseado em 80% da estrutura proposta anteriormente, reduzindo a profundidade de `lib/catalog` para simplificar a curva de manutenção.

---

## 📁 Estrutura Recomendada
```bash
src/
├── components/
│   ├── catalog/
│   │   ├── CatalogHero.astro
│   │   ├── SearchBar.astro
│   │   ├── CategoryFilters.astro
│   │   ├── AdvancedFilters.astro
│   │   ├── ViewModeSwitcher.astro
│   │   ├── ProductGrid.astro
│   │   ├── ProductCard.astro
│   │   ├── ProductCardSkeleton.astro
│   │   ├── CategorySection.astro
│   │   ├── EmptyState.astro
│   │   ├── LoadingSpinner.astro
│   │   └── InfiniteScrollSentinel.astro
│   │
│   ├── modals/
│   │   ├── LoginModal.astro
│   │   ├── EditProductModal.astro
│   │   └── CategoryManagerModal.astro
│   │
│   └── shared/
│       ├── Toast.astro
│       └── ProgressiveImage.astro
│
├── lib/
│   ├── catalog/
│   │   ├── core/          # Estado, config e tipos
│   │   ├── services/      # API, cache e prefetch
│   │   ├── logic/         # Filtros, ordenação, agrupamento
│   │   ├── render/        # Templates e renderização
│   │   ├── ui/            # Handlers, eventos e animações
│   │   └── performance/   # Lazy load e métricas
│   │
│   ├── utils/             # Funções genéricas
│   ├── supabase/          # Integração Supabase
│   └── hooks/             # Hooks utilitários (debounce, observer)
│
├── scripts/
│   ├── catalog/
│   │   ├── init.ts        # Orquestrador principal
│   │   ├── admin.ts       # Scripts de administração
│   │   └── analytics.ts   # Web analytics
│   │
│   └── workers/
│       └── imageProcessor.worker.ts
│
└── styles/
    ├── catalog/
    │   ├── variables.css
    │   ├── grid.css
    │   ├── card.css
    │   └── animations.css
    └── utils/
        └── mixins.css
```

---

## ✅ Checklist de Implementação

### 1️⃣ **Separar o Estado e Configuração**
- [x] Criar `lib/catalog/core/state.ts` e `lib/catalog/core/config.ts`.
- [x] Definir `CatalogState` com produtos, categorias e filtros.
- [ ] Implementar funções `getState()` e `updateState()`.

### 2️⃣ **Isolar a Lógica de Negócio**
- [ ] Mover `filtrarProdutos`, `ordenarProdutos` e `agruparPorCategoria` para `lib/catalog/logic`.
- [ ] Garantir que todas retornem dados puros, sem manipular DOM.

### 3️⃣ **Organizar as Requisições e Cache**
- [x] Criar `lib/catalog/services/api.ts` e `cache.ts`.
- [x] Implementar pré-carregamento de produtos e cache local (sessionStorage).
- [x] Adicionar controle de erros e fallback.

### 4️⃣ **Dividir Renderização e Templates**
- [x] Mover `produtoCard` e `categoriaSecao` para `lib/catalog/render/templates.ts`.
- [x] Criar `renderer.ts` com funções `renderProdutos()` e `renderCategorias()`.
- [ ] Adicionar suporte a *lazy-loading* e placeholders (ProductCardSkeleton).

### 5️⃣ **Gerenciar UI e Eventos**
- [x] Criar `lib/catalog/ui/handlers.ts` e `lib/catalog/ui/events.ts`.
- [x] Centralizar listeners de filtros, busca, visualização e login.
- [x] Aplicar debounce de 300 ms no input de busca.

### 6️⃣ **Camada de Performance**
- [x] Criar `lib/catalog/performance/imageLoader.ts` e `metrics.ts`.
- [x] Usar IntersectionObserver para carregar imagens sob demanda.
- [ ] Implementar coleta opcional de Web Vitals.

### 7️⃣ **Componentização Visual**
- [ ] Criar componentes menores (`SearchBar`, `ViewModeSwitcher`, `EmptyState`, etc).
- [ ] Cada componente deve ter responsabilidade única.
- [ ] `ProductCard` deve usar `ProgressiveImage` com fade-in.

### 8️⃣ **Inicialização e Orquestração**
- [ ] Criar `scripts/catalog/init.ts` para centralizar inicialização.
- [ ] Importar `state`, `handlers` e `render` para bootstrap da página.
- [ ] Adicionar `client:load` em `catalogo.astro` apenas nesse script.

### 9️⃣ **CSS Modular**
- [ ] Criar `styles/catalog/variables.css` com tokens reutilizáveis.
- [ ] Isolar animações e grid em arquivos próprios.
- [ ] Garantir compatibilidade com temas claro/escuro.

### 🔟 **Otimizações Finais**
- [ ] Habilitar `Astro.split = true` e partial hydration.
- [ ] Implementar `prefetch` das primeiras imagens.
- [ ] Analisar bundle com `npm run astro build --analyze`.

---

## 🚀 **Resultado Esperado**
✅ Carregamento 40–60% mais rápido no mobile.  
✅ Código modular, escalável e fácil de manter.  
✅ Reutilização entre os catálogos *Sr. iPhone* e *Léo iPhone*.  
✅ Base pronta para features futuras (virtual scroll, admin realtime).

