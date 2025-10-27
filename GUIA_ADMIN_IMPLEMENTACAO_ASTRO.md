# 📋 Guia de Implementação: Área Administrativa para Astro

Este documento adapta o guia de área administrativa para ser implementado no projeto **sriphone** usando **Astro**.

---

## 🎯 Diferenças Principais: Next.js → Astro

| Aspecto | Next.js (Original) | Astro (Adaptado) |
|---------|-------------------|------------------|
| Framework | Next.js 15 + React | Astro 5 + componentes Astro |
| Roteamento | App Router (`/app`) | File-based (`/src/pages`) |
| Server Actions | `'use server'` | API Routes (`/src/pages/api`) |
| Client Components | `'use client'` | `<script>` tags ou islands |
| Layouts | `layout.tsx` | `Layout.astro` |
| Styling | Tailwind + CSS-in-JS | Tailwind + scoped styles |

---

## 📁 Estrutura de Diretórios Adaptada

```
src/
├── pages/
│   ├── index.astro                    # Home (redireciona para catálogo)
│   ├── catalogo.astro                 # Catálogo público
│   │
│   ├── admin/
│   │   ├── index.astro                # Redireciona para dashboard
│   │   ├── login.astro                # Página de login
│   │   ├── dashboard.astro            # Dashboard principal
│   │   ├── produtos.astro             # Gerenciar produtos
│   │   ├── categorias.astro           # Gerenciar categorias
│   │   ├── banners.astro              # Gerenciar banners
│   │   └── analytics.astro            # Página de analytics
│   │
│   └── api/
│       └── admin/
│           ├── produtos/
│           │   ├── index.ts           # GET, POST
│           │   └── [id].ts            # PUT, DELETE
│           ├── categorias/
│           │   ├── index.ts
│           │   └── [id].ts
│           ├── banners/
│           │   ├── index.ts
│           │   └── [id].ts
│           ├── upload.ts              # Upload de imagens
│           └── auth/
│               ├── login.ts
│               └── logout.ts
│
├── layouts/
│   ├── BaseLayout.astro               # Layout base do site
│   └── AdminLayout.astro              # Layout da área admin
│
├── components/
│   ├── admin/
│   │   ├── Sidebar.astro              # Sidebar desktop
│   │   ├── MobileNav.astro            # Navegação mobile
│   │   ├── Header.astro               # Header das páginas
│   │   ├── ProdutosTable.astro        # Tabela de produtos
│   │   ├── ProductFormDialog.astro    # Dialog de criação/edição
│   │   ├── ConfirmDialog.astro        # Dialog de confirmação
│   │   └── StatsCard.astro            # Card de estatísticas
│   │
│   └── ui/
│       ├── Button.astro               # Componente de botão
│       ├── Card.astro                 # Componente de card
│       ├── Input.astro                # Componente de input
│       ├── Select.astro               # Componente de select
│       └── ...                        # Outros componentes UI
│
├── lib/
│   ├── supabase.ts                    # Cliente Supabase
│   ├── auth.ts                        # Funções de autenticação
│   └── utils.ts                       # Utilitários
│
└── styles/
    └── global.css                     # Estilos globais
```

---

## 🎨 Configuração do Tailwind CSS

### 1. Instalar Tailwind

```bash
npm install -D tailwindcss @astrojs/tailwind
npx tailwindcss init
```

### 2. Adicionar ao `astro.config.mjs`

```js
import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import vercel from '@astrojs/vercel/static';

export default defineConfig({
  integrations: [tailwind()],
  output: 'static',
  adapter: vercel(),
  site: 'https://sriphonevca.com.br',
});
```

### 3. Configurar `tailwind.config.mjs`

```js
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      colors: {
        brand: {
          white: '#ffffff',
          black: '#000000',
          gray: '#e0e0e0',
          'dark-bg': '#030303',
        },
        admin: {
          bg: '#000000',
          'bg-secondary': '#0a0a0a',
          card: '#1a1a1a',
          border: '#2a2a2a',
        },
      },
    },
  },
  plugins: [],
}
```

### 4. Estilos Globais (`src/styles/admin.css`)

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    /* Cores da Marca SriPhone VCA */
    --cor-primaria: #ffffff;      /* Branco - texto principal */
    --cor-secundaria: #000000;    /* Preto - fundo */
    --cor-texto: #e0e0e0;         /* Cinza claro para texto */
    --cor-fundo-escuro: #030303;  /* Preto mais profundo */
    --cor-destaque: #ffffff;      /* Branco para destaques */

    /* Cores de Fundo Admin */
    --bg-primary: #000000;
    --bg-secondary: #0a0a0a;
    --bg-card: #1a1a1a;

    /* Cores de Texto */
    --text-primary: #ffffff;
    --text-secondary: #e0e0e0;
    --text-muted: #a0a0a0;

    /* Cores de Borda */
    --border-primary: #2a2a2a;
    --border-secondary: #1a1a1a;

    /* Cores de Estado */
    --color-success: #22c55e;
    --color-error: #ef4444;
    --color-warning: #f59e0b;
    --color-info: #60a5fa;
  }

  body {
    @apply bg-black text-white;
  }
}
```

---

## 🧩 Componentes Principais

### 1. Layout Admin (`src/layouts/AdminLayout.astro`)

```astro
---
import Sidebar from '../components/admin/Sidebar.astro';
import MobileNav from '../components/admin/MobileNav.astro';
import '../styles/global.css';

interface Props {
  title: string;
  description?: string;
}

const { title, description } = Astro.props;
---

<!DOCTYPE html>
<html lang="pt-BR">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="robots" content="noindex, nofollow" />
    <title>{title} | Admin - SriPhone</title>
    {description && <meta name="description" content={description} />}
    <link rel="icon" type="image/x-icon" href="/favicon.ico" />
  </head>
  <body>
    <div class="flex min-h-screen flex-col bg-black lg:flex-row lg:overflow-hidden">
      <MobileNav />
      
      <!-- Sidebar Desktop -->
      <aside class="hidden w-64 lg:block">
        <Sidebar />
      </aside>

      <!-- Main Content -->
      <main class="flex-1 overflow-y-auto">
        <div class="min-h-screen">
          <slot />
        </div>
      </main>
    </div>

    <!-- Scripts globais do admin -->
    <script>
      // Verificar autenticação ao carregar
      import { checkAuth } from '../lib/auth';
      
      document.addEventListener('DOMContentLoaded', async () => {
        const isAuthenticated = await checkAuth();
        if (!isAuthenticated && !window.location.pathname.includes('/login')) {
          window.location.href = '/admin/login';
        }
      });
    </script>
  </body>
</html>
```

---

### 2. Sidebar (`src/components/admin/Sidebar.astro`)

```astro
---
const menuItems = [
  {
    title: 'Dashboard',
    icon: 'layout-dashboard',
    href: '/admin/dashboard',
  },
  {
    title: 'Produtos',
    icon: 'package',
    href: '/admin/produtos',
  },
  {
    title: 'Categorias',
    icon: 'folder-tree',
    href: '/admin/categorias',
  },
  {
    title: 'Banners',
    icon: 'image',
    href: '/admin/banners',
  },
  {
    title: 'Analytics',
    icon: 'bar-chart-3',
    href: '/admin/analytics',
  },
];

const currentPath = Astro.url.pathname;
---

<div class="flex h-full flex-col border-r border-[#2a2a2a] bg-[#0a0a0a]">
  <!-- Logo -->
  <a
    href="/admin/dashboard"
    class="flex h-16 items-center gap-3 border-b border-[#2a2a2a] px-6 transition-opacity hover:opacity-80"
  >
    <div class="relative h-10 w-10 flex-shrink-0">
      <img
        src="/images/logo-fundo.webp"
        alt="Sr. IPHONE Logo"
        class="h-full w-full object-contain"
        width="40"
        height="40"
      />
    </div>
    <div>
      <h1 class="text-lg font-bold text-white">Sr. IPHONE VCA</h1>
      <p class="text-xs text-[#a0a0a0]">Admin</p>
    </div>
  </a>

  <!-- Menu -->
  <nav class="flex-1 space-y-1 p-4">
    {menuItems.map((item) => {
      const isActive = currentPath === item.href || currentPath.startsWith(item.href + '/');
      return (
        <a
          href={item.href}
          class={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
            isActive
              ? 'bg-white/10 text-white'
              : 'text-[#a0a0a0] hover:bg-[#1a1a1a] hover:text-white'
          }`}
        >
          <lucide-icon name={item.icon} class="h-5 w-5" />
          {item.title}
        </a>
      );
    })}

    <div class="my-2 border-t border-[#2a2a2a]"></div>

    <!-- Link para o Catálogo -->
    <a
      href="/catalogo"
      target="_blank"
      rel="noopener noreferrer"
      class="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-[#a0a0a0] transition-colors hover:bg-[#1a1a1a] hover:text-white"
    >
      <lucide-icon name="external-link" class="h-5 w-5" />
      Ver Catálogo
    </a>
  </nav>

  <!-- Botão de Logout -->
  <div class="border-t border-[#2a2a2a] p-4">
    <button
      id="logout-btn"
      class="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-[#a0a0a0] transition-colors hover:bg-[#1a1a1a] hover:text-white"
    >
      <lucide-icon name="log-out" class="h-5 w-5" />
      Sair
    </button>
  </div>
</div>

<script>
  // Importar lucide-react para ícones (ou usar SVG inline)
  import { logout } from '../../lib/auth';

  document.getElementById('logout-btn')?.addEventListener('click', async () => {
    if (confirm('Tem certeza que deseja sair?')) {
      await logout();
      window.location.href = '/admin/login';
    }
  });
</script>

<!-- Alternativa: usar ícones SVG inline ao invés de lucide-react -->
```

---

### 3. Mobile Nav (`src/components/admin/MobileNav.astro`)

```astro
---
const menuItems = [
  { title: 'Dashboard', icon: 'layout-dashboard', href: '/admin/dashboard' },
  { title: 'Produtos', icon: 'package', href: '/admin/produtos' },
  { title: 'Categorias', icon: 'folder-tree', href: '/admin/categorias' },
  { title: 'Banners', icon: 'image', href: '/admin/banners' },
  { title: 'Analytics', icon: 'bar-chart-3', href: '/admin/analytics' },
];

const currentPath = Astro.url.pathname;
---

<header class="sticky top-0 z-50 border-b border-[#2a2a2a] bg-[#0a0a0a]/95 px-4 py-3 backdrop-blur lg:hidden">
  <div class="flex items-center justify-between">
    <div class="flex items-center gap-3">
      <div class="relative h-10 w-10 overflow-hidden rounded-md border border-[#2a2a2a] bg-[#1a1a1a]">
        <img src="/images/logo-fundo.webp" alt="Sr. IPHONE Logo" class="h-full w-full object-contain" />
      </div>
      <div class="leading-tight">
        <p class="text-sm font-semibold text-white">Painel Admin</p>
        <span class="text-xs text-[#a0a0a0]">Gestão administrativa</span>
      </div>
    </div>

    <button
      type="button"
      id="mobile-menu-btn"
      class="inline-flex h-10 w-10 items-center justify-center rounded-md border border-[#2a2a2a] bg-[#0a0a0a] text-white transition hover:border-[#3a3a3a] hover:bg-[#1a1a1a]"
      aria-label="Abrir menu"
    >
      <svg id="menu-icon" class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
      </svg>
      <svg id="close-icon" class="hidden h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
      </svg>
    </button>
  </div>

  <!-- Menu Dropdown -->
  <div id="mobile-menu" class="hidden absolute left-3 right-3 top-full z-50 mt-3 overflow-hidden rounded-2xl border border-[#2a2a2a] bg-[#0a0a0a]/95 shadow-xl backdrop-blur">
    <nav class="flex flex-col divide-y divide-[#2a2a2a]/80">
      {menuItems.map((item) => {
        const isActive = currentPath === item.href || currentPath.startsWith(item.href + '/');
        return (
          <a
            href={item.href}
            class={`flex items-center gap-3 px-4 py-3 text-sm font-medium transition ${
              isActive ? 'text-white' : 'text-[#a0a0a0] hover:text-white'
            }`}
          >
            <span
              class={`flex h-9 w-9 items-center justify-center rounded-lg border ${
                isActive
                  ? 'border-white/50 bg-white/10 text-white'
                  : 'border-[#2a2a2a] bg-[#1a1a1a] text-[#a0a0a0]'
              }`}
            >
              <!-- Ícone SVG aqui -->
            </span>
            <span>{item.title}</span>
            {isActive && <span class="ml-auto text-xs uppercase tracking-wider text-white/80">ativo</span>}
          </a>
        );
      })}

      <!-- Link Catálogo -->
      <a
        href="/catalogo"
        target="_blank"
        rel="noopener noreferrer"
        class="flex items-center gap-3 px-4 py-3 text-sm font-medium text-[#a0a0a0] transition hover:text-white"
      >
        <span class="flex h-9 w-9 items-center justify-center rounded-lg border border-[#2a2a2a] bg-[#1a1a1a] text-[#a0a0a0]">
          <!-- Ícone external-link -->
        </span>
        <span>Ver Catálogo</span>
      </a>
    </nav>

    <!-- Logout -->
    <div class="border-t border-[#2a2a2a]/80 bg-[#0a0a0a]/90 px-4 py-3">
      <button
        id="mobile-logout-btn"
        class="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-[#e0e0e0] transition hover:bg-[#1a1a1a] hover:text-white"
      >
        <!-- Ícone log-out -->
        Sair da conta
      </button>
    </div>
  </div>
</header>

<!-- Backdrop -->
<button
  type="button"
  id="mobile-backdrop"
  class="fixed inset-0 z-40 hidden bg-black/40 lg:hidden"
  aria-label="Fechar menu"
></button>

<script>
  import { logout } from '../../lib/auth';

  const menuBtn = document.getElementById('mobile-menu-btn');
  const mobileMenu = document.getElementById('mobile-menu');
  const backdrop = document.getElementById('mobile-backdrop');
  const menuIcon = document.getElementById('menu-icon');
  const closeIcon = document.getElementById('close-icon');
  const logoutBtn = document.getElementById('mobile-logout-btn');

  function toggleMenu() {
    const isOpen = !mobileMenu?.classList.contains('hidden');
    
    if (isOpen) {
      mobileMenu?.classList.add('hidden');
      backdrop?.classList.add('hidden');
      menuIcon?.classList.remove('hidden');
      closeIcon?.classList.add('hidden');
    } else {
      mobileMenu?.classList.remove('hidden');
      backdrop?.classList.remove('hidden');
      menuIcon?.classList.add('hidden');
      closeIcon?.classList.remove('hidden');
    }
  }

  menuBtn?.addEventListener('click', toggleMenu);
  backdrop?.addEventListener('click', toggleMenu);
  
  logoutBtn?.addEventListener('click', async () => {
    if (confirm('Tem certeza que deseja sair?')) {
      await logout();
      window.location.href = '/admin/login';
    }
  });
</script>
```

---

### 4. Dashboard Page (`src/pages/admin/dashboard.astro`)

```astro
---
import AdminLayout from '../../layouts/AdminLayout.astro';
import StatsCard from '../../components/admin/StatsCard.astro';
import { getSupabaseClient } from '../../lib/supabase';

// Buscar estatísticas
const supabase = getSupabaseClient();

const { data: produtos } = await supabase
  .from('produtos')
  .select('id, ativo, visualizacoes_total');

const totalProdutos = produtos?.length || 0;
const produtosAtivos = produtos?.filter(p => p.ativo).length || 0;
const produtosInativos = totalProdutos - produtosAtivos;
const totalVisualizacoes = produtos?.reduce((acc, p) => acc + (p.visualizacoes_total || 0), 0) || 0;

// Top 5 produtos mais visualizados
const { data: topProdutos } = await supabase
  .from('produtos')
  .select('id, nome, visualizacoes_total, foto_principal')
  .order('visualizacoes_total', { ascending: false })
  .limit(5);
---

<AdminLayout title="Dashboard" description="Visão geral do catálogo de produtos">
  <div class="flex flex-col">
    <!-- Header -->
    <div class="flex min-h-[64px] items-center justify-between border-b border-[#2a2a2a] bg-[#0a0a0a] px-4 py-3 md:px-6">
      <div class="min-w-0 flex-1">
        <h1 class="truncate text-lg font-bold text-white md:text-xl">Dashboard</h1>
        <p class="hidden text-sm text-[#a0a0a0] sm:block">Visão geral do catálogo de produtos</p>
      </div>
    </div>

    <!-- Content -->
    <div class="flex-1 space-y-4 p-6">
      <!-- Cards de Estatísticas -->
      <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total de Produtos"
          value={totalProdutos}
          description={`${produtosAtivos} ativos, ${produtosInativos} inativos`}
          icon="package"
        />
        
        <StatsCard
          title="Produtos Ativos"
          value={produtosAtivos}
          description="Visíveis no catálogo"
          icon="eye"
        />
        
        <StatsCard
          title="Produtos Inativos"
          value={produtosInativos}
          description="Não visíveis"
          icon="eye-off"
        />
        
        <StatsCard
          title="Total de Visualizações"
          value={totalVisualizacoes}
          description="De todos os produtos"
          icon="bar-chart-3"
        />
      </div>

      <!-- Top Produtos -->
      <div class="rounded-lg border border-[#2a2a2a] bg-[#0a0a0a] p-6">
        <h2 class="mb-4 text-lg font-semibold text-white">Produtos Mais Visualizados</h2>
        <div class="space-y-3">
          {topProdutos?.map((produto, index) => (
            <div class="flex items-center gap-4 rounded-lg border border-[#2a2a2a] bg-[#1a1a1a] p-3">
              <span class="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white font-bold">
                {index + 1}
              </span>
              {produto.foto_principal && (
                <img
                  src={produto.foto_principal}
                  alt={produto.nome}
                  class="h-12 w-12 rounded-md object-cover"
                />
              )}
              <div class="flex-1">
                <p class="text-sm font-medium text-white">{produto.nome}</p>
                <p class="text-xs text-[#a0a0a0]">{produto.visualizacoes_total} visualizações</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <!-- Ações Rápidas -->
      <div class="grid gap-4 md:grid-cols-3">
        <a
          href="/admin/produtos"
          class="flex items-center gap-4 rounded-lg border border-[#2a2a2a] bg-[#0a0a0a] p-6 transition hover:bg-[#1a1a1a]"
        >
          <div class="flex h-12 w-12 items-center justify-center rounded-full bg-white/10">
            <!-- Ícone package -->
          </div>
          <div>
            <h3 class="font-semibold text-white">Gerenciar Produtos</h3>
            <p class="text-xs text-[#a0a0a0]">Adicionar, editar ou remover</p>
          </div>
        </a>

        <a
          href="/admin/categorias"
          class="flex items-center gap-4 rounded-lg border border-[#2a2a2a] bg-[#0a0a0a] p-6 transition hover:bg-[#1a1a1a]"
        >
          <div class="flex h-12 w-12 items-center justify-center rounded-full bg-white/10">
            <!-- Ícone folder-tree -->
          </div>
          <div>
            <h3 class="font-semibold text-white">Gerenciar Categorias</h3>
            <p class="text-xs text-[#a0a0a0]">Organizar produtos</p>
          </div>
        </a>

        <a
          href="/admin/banners"
          class="flex items-center gap-4 rounded-lg border border-[#2a2a2a] bg-[#0a0a0a] p-6 transition hover:bg-[#1a1a1a]"
        >
          <div class="flex h-12 w-12 items-center justify-center rounded-full bg-white/10">
            <!-- Ícone image -->
          </div>
          <div>
            <h3 class="font-semibold text-white">Gerenciar Banners</h3>
            <p class="text-xs text-[#a0a0a0]">Atualizar destaque</p>
          </div>
        </a>
      </div>
    </div>
  </div>
</AdminLayout>
```

---

## 🔌 API Routes (Server-side)

### Exemplo: CRUD de Produtos (`src/pages/api/admin/produtos/index.ts`)

```typescript
import type { APIRoute } from 'astro';
import { getSupabaseClient } from '../../../../lib/supabase';
import { verifyAuth } from '../../../../lib/auth';

// GET - Listar todos os produtos
export const GET: APIRoute = async ({ request, cookies }) => {
  try {
    const isAuth = await verifyAuth(cookies);
    if (!isAuth) {
      return new Response(JSON.stringify({ error: 'Não autenticado' }), {
        status: 401,
      });
    }

    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('produtos')
      .select('*, categoria:categoria_id(id, nome)')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return new Response(JSON.stringify({ produtos: data }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
    });
  }
};

// POST - Criar novo produto
export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    const isAuth = await verifyAuth(cookies);
    if (!isAuth) {
      return new Response(JSON.stringify({ error: 'Não autenticado' }), {
        status: 401,
      });
    }

    const body = await request.json();
    const supabase = getSupabaseClient();
    
    const { data, error } = await supabase
      .from('produtos')
      .insert([body])
      .select()
      .single();

    if (error) throw error;

    return new Response(JSON.stringify({ produto: data }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
    });
  }
};
```

### Exemplo: Update/Delete (`src/pages/api/admin/produtos/[id].ts`)

```typescript
import type { APIRoute } from 'astro';
import { getSupabaseClient } from '../../../../lib/supabase';
import { verifyAuth } from '../../../../lib/auth';

// PUT - Atualizar produto
export const PUT: APIRoute = async ({ params, request, cookies }) => {
  try {
    const isAuth = await verifyAuth(cookies);
    if (!isAuth) {
      return new Response(JSON.stringify({ error: 'Não autenticado' }), {
        status: 401,
      });
    }

    const { id } = params;
    const body = await request.json();
    const supabase = getSupabaseClient();
    
    const { data, error } = await supabase
      .from('produtos')
      .update(body)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return new Response(JSON.stringify({ produto: data }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
    });
  }
};

// DELETE - Deletar produto
export const DELETE: APIRoute = async ({ params, cookies }) => {
  try {
    const isAuth = await verifyAuth(cookies);
    if (!isAuth) {
      return new Response(JSON.stringify({ error: 'Não autenticado' }), {
        status: 401,
      });
    }

    const { id } = params;
    const supabase = getSupabaseClient();
    
    const { error } = await supabase
      .from('produtos')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
    });
  }
};
```

---

## 🔐 Autenticação

### `src/lib/auth.ts`

```typescript
import type { AstroCookies } from 'astro';
import { getSupabaseClient } from './supabase';

export async function verifyAuth(cookies: AstroCookies): Promise<boolean> {
  const token = cookies.get('sb-access-token')?.value;
  
  if (!token) return false;

  try {
    const supabase = getSupabaseClient();
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    return !error && !!user;
  } catch {
    return false;
  }
}

export async function login(email: string, password: string) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw error;
  return data;
}

export async function logout() {
  const supabase = getSupabaseClient();
  await supabase.auth.signOut();
}

export async function checkAuth(): Promise<boolean> {
  try {
    const supabase = getSupabaseClient();
    const { data: { session } } = await supabase.auth.getSession();
    return !!session;
  } catch {
    return false;
  }
}
```

### Middleware (proteção de rotas)

Astro não tem middleware nativo da mesma forma que Next.js, então você pode:

**Opção 1: Client-side check (no layout)**
```astro
<script>
  import { checkAuth } from '../lib/auth';
  
  if (!await checkAuth()) {
    window.location.href = '/admin/login';
  }
</script>
```

**Opção 2: Server-side check (em cada página)**
```astro
---
import { verifyAuth } from '../../lib/auth';

const isAuth = await verifyAuth(Astro.cookies);
if (!isAuth) {
  return Astro.redirect('/admin/login');
}
---
```

---

## 📦 Dependências Necessárias

```bash
# Tailwind CSS
npm install -D tailwindcss @astrojs/tailwind

# Supabase (já instalado)
# @supabase/supabase-js

# Opcional: para ícones
npm install lucide-static
# ou usar SVG inline

# Opcional: para formulários
npm install react react-dom
npm install -D @astrojs/react
```

---

## ✅ Checklist de Implementação

### 1. Setup Inicial
- [x] Projeto Astro já criado
- [x] Adicionar integração Tailwind (via PostCSS)
- [x] Configurar estilos globais
- [x] Configurar variáveis CSS de tema

### 2. Estrutura Base
- [x] Criar `/src/pages/admin/`
- [x] Criar `/src/components/admin/`
- [x] Criar `/src/layouts/AdminLayout.astro`
- [x] Criar `/src/lib/auth.ts`

### 3. Layout e Navegação
- [x] Implementar `AdminLayout.astro`
- [x] Criar componente `Sidebar.astro`
- [x] Criar componente `MobileNav.astro`

### 4. Páginas Admin
- [x] `dashboard.astro`
- [x] `produtos.astro`
- [x] `categorias.astro`
- [x] `banners.astro`
- [x] `analytics.astro`
- [x] `login.astro`

### 5. API Routes
- [x] `/api/admin/produtos/index.ts`
- [x] `/api/admin/produtos/[id].ts`
- [x] `/api/admin/categorias/index.ts`
- [x] `/api/admin/categorias/[id].ts`
- [x] `/api/admin/auth/login.ts`
- [x] `/api/admin/auth/logout.ts`

### 6. Componentes UI
- [x] StatsCard.astro
- [x] Button (usando inline nos componentes)
- [x] Card (usando inline nos componentes)
- [x] Input (usando inline nos componentes)
- [x] Select (usando inline nos componentes)
- [x] Dialog (funcionalidade básica implementada)

### 7. Funcionalidades
- [x] Autenticação/Login (completo com API)
- [x] CRUD de produtos (API routes + UI completa com formulário)
- [x] CRUD de categorias (API routes + UI completa com formulário)
- [x] Upload de imagens (implementado com validação)
- [x] Dashboard com estatísticas
- [x] Sistema de notificações (Toast)
- [x] Formulários modais para produtos e categorias
- [x] Validação de dados
- [x] Loading states

### 8. Testes
- [ ] Testar responsividade (próximo passo)
- [ ] Testar navegação (próximo passo)
- [ ] Testar autenticação (próximo passo)
- [ ] Testar CRUD completo (próximo passo)

---

## 🎉 Status da Implementação - ATUALIZADO

### ✅ Concluído
1. **Estrutura completa** - Todos os diretórios e arquivos base criados
2. **Layout Admin** - AdminLayout, Sidebar e MobileNav funcionais
3. **Páginas Admin** - Todas as 6 páginas criadas (dashboard, produtos, categorias, banners, analytics, login)
4. **API Routes** - 7 endpoints REST completos:
   - Produtos (GET, POST, PUT, DELETE)
   - Categorias (GET, POST, PUT, DELETE)
   - Autenticação (login, logout)
   - Upload de imagens (POST, DELETE)
5. **Componentes** - StatsCard, Toast, ProductFormDialog, CategoryFormDialog
6. **Upload de Imagens** - Sistema completo com:
   - Validação de tipo (JPEG, PNG, WebP)
   - Validação de tamanho (máx 5MB)
   - Preview de imagem
   - Upload para Supabase Storage
   - Remoção de imagens
7. **Sistema de Notificações** - Toast com 4 tipos (success, error, warning, info)
8. **Formulários Completos**:
   - Formulário de produto com todos os campos
   - Formulário de categoria
   - Validação client-side
   - Estados de loading
   - Tratamento de erros
9. **UX Melhorada**:
   - Estados vazios com mensagens amigáveis
   - Confirmação antes de deletar
   - Feedback visual em todas ações
   - Responsividade mobile-first
10. **Build** - Projeto compilando com sucesso em modo server

### ⚙️ Configurações Importantes
- **Modo**: `output: "server"` (necessário para API routes)
- **Adapter**: `@astrojs/vercel`
- **Tailwind**: Configurado via PostCSS
- **Autenticação**: Sistema completo com Supabase Auth
- **Storage**: Supabase Storage para imagens

### 📦 Funcionalidades Implementadas

#### 1. Sistema de Upload de Imagens
```typescript
// Endpoint: POST /api/admin/upload
- Validação de tipo de arquivo
- Validação de tamanho (5MB max)
- Nome único com timestamp
- Upload para Supabase Storage
- Retorna URL pública
```

#### 2. Sistema de Notificações (Toast)
```javascript
// Uso:
window.showToast('Mensagem', 'success/error/warning/info', duração)
- Auto-dismiss após tempo configurável
- Animações suaves
- Múltiplos toasts simultâneos
- Botão de fechar manual
```

#### 3. Formulário de Produtos
- Nome, código, preço, bateria
- Condição (Novo/Seminovo)
- Categoria (select)
- Descrição (textarea)
- Upload de foto principal com preview
- Checkbox ativo/inativo
- Modo criação e edição no mesmo dialog

#### 4. Formulário de Categorias
- Nome da categoria
- Modo criação e edição
- Validação simples

### 🔄 Próximos Passos
1. ✅ Testar o sistema completo
2. Adicionar mais campos aos produtos (múltiplas imagens)
3. Implementar paginação
4. Adicionar filtros e busca
5. Implementar área de banners
6. Adicionar analytics real
7. Melhorar validação de formulários
8. Adicionar testes automatizados

---

## 🎯 Diferenças Importantes

### 1. **Islands Architecture**
Astro usa "islands" para JavaScript interativo. Para componentes que precisam de interatividade:

```astro
---
// Código server-side aqui
---

<div>
  <!-- HTML estático -->
</div>

<script>
  // JavaScript client-side aqui
  // Executa no navegador
</script>
```

### 2. **Sem React por Padrão**
O guia original usa React. No Astro, você pode:
- Usar componentes `.astro` nativos
- Adicionar React islands quando necessário
- Usar vanilla JavaScript

### 3. **API Routes ao invés de Server Actions**
- Next.js: `'use server'`
- Astro: `/src/pages/api/*.ts`

### 4. **Imagens**
- Next.js: `<Image>` do Next
- Astro: `<img>` nativo ou `@astrojs/image`

---

## 📝 Notas Finais

Este guia adapta a estrutura original do Next.js para Astro, mantendo:
- ✅ Mesmo design system
- ✅ Mesma estrutura visual
- ✅ Mesmas funcionalidades
- ✅ Responsividade idêntica

**Principais adaptações:**
- Componentes `.astro` ao invés de `.tsx`
- API Routes ao invés de Server Actions
- Client scripts ao invés de `'use client'`
- SSG/SSR híbrido do Astro

**Próximos passos:**
1. Começar pelo layout base
2. Implementar autenticação
3. Criar páginas uma por uma
4. Adicionar interatividade com scripts
5. Testar e iterar

---

**Adaptado para:** Astro 5  
**Projeto:** SriPhone VCA - Área Administrativa  
**Data:** Outubro 2024
