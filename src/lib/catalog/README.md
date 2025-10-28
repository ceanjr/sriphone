# 📦 Módulo Catalog

Módulo modular e otimizado para o catálogo de produtos.

## 📁 Estrutura

```
lib/catalog/
├── core/           # Estado e configuração
│   ├── state.ts    # Gerenciamento de estado
│   └── config.ts   # Configurações do catálogo
│
├── logic/          # Lógica de negócio
│   ├── filters.ts  # Filtros de produtos
│   ├── sorting.ts  # Ordenação
│   ├── grouping.ts # Agrupamento por categoria
│   └── index.ts    # Exportações
│
├── services/       # Serviços externos
│   ├── api.ts      # Integração com Supabase
│   └── cache.ts    # Cache local
│
├── render/         # Renderização
│   ├── templates.ts # Templates HTML
│   └── renderer.ts  # Funções de render
│
├── ui/             # Interface e eventos
│   ├── handlers.ts # Handlers de eventos
│   └── events.ts   # Sistema de eventos
│
├── performance/    # Otimizações
│   ├── imageLoader.ts # Lazy loading de imagens
│   └── metrics.ts     # Web Vitals
│
└── utils.ts        # Utilitários gerais
```

## 🚀 Uso

### Importação centralizada
```typescript
import { initState, filtrarProdutos, renderer } from '@/lib/catalog';
```

### Importação específica
```typescript
import { initState } from '@/lib/catalog/core/state';
import { filtrarProdutos } from '@/lib/catalog/logic';
```

## ✨ Features

- ✅ **Estado Centralizado**: Gerenciamento único do estado
- ✅ **Lógica Pura**: Funções sem efeitos colaterais
- ✅ **Cache Inteligente**: SessionStorage para performance
- ✅ **Lazy Loading**: Imagens carregadas sob demanda
- ✅ **Web Vitals**: Métricas de performance
- ✅ **Eventos**: Sistema de pub/sub
- ✅ **TypeScript**: Totalmente tipado

## 📊 Performance

- Carregamento inicial otimizado
- Code splitting automático
- Prefetch de imagens prioritárias
- Skeleton loading states
- Debounce em inputs

## 🎯 Responsabilidades

Cada módulo tem uma única responsabilidade:

- **core**: Estado e configuração
- **logic**: Regras de negócio
- **services**: Comunicação externa
- **render**: Apresentação visual
- **ui**: Interação do usuário
- **performance**: Otimizações
