import { e as createAstro, f as createComponent, m as maybeRenderHead, l as renderScript, h as addAttribute, r as renderTemplate, n as renderHead, k as renderComponent, o as renderSlot } from './astro/server_DLhSBo-F.mjs';
import 'clsx';
/* empty css                             */

const $$Astro$2 = createAstro("https://sriphonevca.com.br");
const $$Sidebar = createComponent(async ($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro$2, $$props, $$slots);
  Astro2.self = $$Sidebar;
  const menuItems = [
    {
      title: "Dashboard",
      icon: "layout-dashboard",
      href: "/admin/dashboard"
    },
    {
      title: "Produtos",
      icon: "package",
      href: "/admin/produtos"
    },
    {
      title: "Categorias",
      icon: "folder-tree",
      href: "/admin/categorias"
    },
    {
      title: "Banners",
      icon: "image",
      href: "/admin/banners"
    },
    {
      title: "Analytics",
      icon: "bar-chart-3",
      href: "/admin/analytics"
    }
  ];
  const currentPath = Astro2.url.pathname;
  return renderTemplate`${maybeRenderHead()}<div class="flex h-full flex-col border-r border-[#2a2a2a] bg-[#0a0a0a]"> <!-- Logo --> <a href="/admin/dashboard" class="flex h-16 items-center gap-3 border-b border-[#2a2a2a] px-6 transition-opacity hover:opacity-80"> <div class="relative h-10 w-10 flex-shrink-0"> <img src="/images/logo-fundo.webp" alt="Sr. IPHONE Logo" class="h-full w-full object-contain" width="40" height="40"> </div> <div> <h1 class="text-lg font-bold text-white">Sr. IPHONE VCA</h1> <p class="text-xs text-[#a0a0a0]">Admin</p> </div> </a> <!-- Menu --> <nav class="flex-1 space-y-1 p-4"> ${menuItems.map((item) => {
    const isActive = currentPath === item.href || currentPath.startsWith(item.href + "/");
    return renderTemplate`<a${addAttribute(item.href, "href")}${addAttribute(`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${isActive ? "bg-white/10 text-white" : "text-[#a0a0a0] hover:bg-[#1a1a1a] hover:text-white"}`, "class")}> <!-- Icon placeholder - will use SVG inline --> <span class="h-5 w-5" aria-hidden="true"> ${item.icon === "layout-dashboard" && renderTemplate`<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"> <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path> </svg>`} ${item.icon === "package" && renderTemplate`<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"> <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path> </svg>`} ${item.icon === "folder-tree" && renderTemplate`<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"> <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"></path> </svg>`} ${item.icon === "image" && renderTemplate`<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"> <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path> </svg>`} ${item.icon === "bar-chart-3" && renderTemplate`<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"> <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path> </svg>`} </span> ${item.title} </a>`;
  })} <div class="my-2 border-t border-[#2a2a2a]"></div> <!-- Link para o Catálogo --> <a href="/catalogo" target="_blank" rel="noopener noreferrer" class="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-[#a0a0a0] transition-colors hover:bg-[#1a1a1a] hover:text-white"> <span class="h-5 w-5" aria-hidden="true"> <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"> <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path> </svg> </span>
Ver Catálogo
</a> </nav> <!-- Botão de Logout --> <div class="border-t border-[#2a2a2a] p-4"> <button id="logout-btn" class="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-[#a0a0a0] transition-colors hover:bg-[#1a1a1a] hover:text-white"> <span class="h-5 w-5" aria-hidden="true"> <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"> <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path> </svg> </span>
Sair
</button> </div> </div> ${renderScript($$result, "/home/ceanbrjr/Dev/sriphone/src/components/admin/Sidebar.astro?astro&type=script&index=0&lang.ts")}`;
}, "/home/ceanbrjr/Dev/sriphone/src/components/admin/Sidebar.astro", void 0);

const $$Astro$1 = createAstro("https://sriphonevca.com.br");
const $$MobileNav = createComponent(async ($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro$1, $$props, $$slots);
  Astro2.self = $$MobileNav;
  const menuItems = [
    { title: "Dashboard", icon: "layout-dashboard", href: "/admin/dashboard" },
    { title: "Produtos", icon: "package", href: "/admin/produtos" },
    { title: "Categorias", icon: "folder-tree", href: "/admin/categorias" },
    { title: "Banners", icon: "image", href: "/admin/banners" },
    { title: "Analytics", icon: "bar-chart-3", href: "/admin/analytics" }
  ];
  const currentPath = Astro2.url.pathname;
  return renderTemplate`${maybeRenderHead()}<header class="sticky top-0 z-50 border-b border-[#2a2a2a] bg-[#0a0a0a]/95 px-4 py-3 backdrop-blur lg:hidden"> <div class="flex items-center justify-between"> <div class="flex items-center gap-3"> <div class="relative h-10 w-10 overflow-hidden rounded-md border border-[#2a2a2a] bg-[#1a1a1a]"> <img src="/images/logo-fundo.webp" alt="Sr. IPHONE Logo" class="h-full w-full object-contain"> </div> <div class="leading-tight"> <p class="text-sm font-semibold text-white">Painel Admin</p> <span class="text-xs text-[#a0a0a0]">Gestão administrativa</span> </div> </div> <button type="button" id="mobile-menu-btn" class="inline-flex h-10 w-10 items-center justify-center rounded-md border border-[#2a2a2a] bg-[#0a0a0a] text-white transition hover:border-[#3a3a3a] hover:bg-[#1a1a1a]" aria-label="Abrir menu"> <svg id="menu-icon" class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"> <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path> </svg> <svg id="close-icon" class="hidden h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"> <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path> </svg> </button> </div> <!-- Menu Dropdown --> <div id="mobile-menu" class="hidden absolute left-3 right-3 top-full z-50 mt-3 overflow-hidden rounded-2xl border border-[#2a2a2a] bg-[#0a0a0a]/95 shadow-xl backdrop-blur"> <nav class="flex flex-col divide-y divide-[#2a2a2a]/80"> ${menuItems.map((item) => {
    const isActive = currentPath === item.href || currentPath.startsWith(item.href + "/");
    return renderTemplate`<a${addAttribute(item.href, "href")}${addAttribute(`flex items-center gap-3 px-4 py-3 text-sm font-medium transition ${isActive ? "text-white" : "text-[#a0a0a0] hover:text-white"}`, "class")}> <span${addAttribute(`flex h-9 w-9 items-center justify-center rounded-lg border ${isActive ? "border-white/50 bg-white/10 text-white" : "border-[#2a2a2a] bg-[#1a1a1a] text-[#a0a0a0]"}`, "class")}> <!-- Icon SVG placeholder --> <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"> <circle cx="12" cy="12" r="10" stroke-width="2"></circle> </svg> </span> <span>${item.title}</span> ${isActive && renderTemplate`<span class="ml-auto text-xs uppercase tracking-wider text-white/80">ativo</span>`} </a>`;
  })} <!-- Link Catálogo --> <a href="/catalogo" target="_blank" rel="noopener noreferrer" class="flex items-center gap-3 px-4 py-3 text-sm font-medium text-[#a0a0a0] transition hover:text-white"> <span class="flex h-9 w-9 items-center justify-center rounded-lg border border-[#2a2a2a] bg-[#1a1a1a] text-[#a0a0a0]"> <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"> <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path> </svg> </span> <span>Ver Catálogo</span> </a> </nav> <!-- Logout --> <div class="border-t border-[#2a2a2a]/80 bg-[#0a0a0a]/90 px-4 py-3"> <button id="mobile-logout-btn" class="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-[#e0e0e0] transition hover:bg-[#1a1a1a] hover:text-white"> <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"> <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path> </svg>
Sair da conta
</button> </div> </div> </header> <!-- Backdrop --> <button type="button" id="mobile-backdrop" class="fixed inset-0 z-40 hidden bg-black/40 lg:hidden" aria-label="Fechar menu"></button> ${renderScript($$result, "/home/ceanbrjr/Dev/sriphone/src/components/admin/MobileNav.astro?astro&type=script&index=0&lang.ts")}`;
}, "/home/ceanbrjr/Dev/sriphone/src/components/admin/MobileNav.astro", void 0);

const $$Toast = createComponent(($$result, $$props, $$slots) => {
  return renderTemplate`${maybeRenderHead()}<div id="toast-container" class="fixed top-4 right-4 z-[100] flex flex-col gap-2" aria-live="polite"></div> ${renderScript($$result, "/home/ceanbrjr/Dev/sriphone/src/components/admin/Toast.astro?astro&type=script&index=0&lang.ts")}`;
}, "/home/ceanbrjr/Dev/sriphone/src/components/admin/Toast.astro", void 0);

const $$Astro = createAstro("https://sriphonevca.com.br");
const $$AdminLayout = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$AdminLayout;
  const { title, description } = Astro2.props;
  return renderTemplate`<html lang="pt-BR"> <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><meta name="robots" content="noindex, nofollow"><title>${title} | Admin - Sr. IPHONE VCA</title>${description && renderTemplate`<meta name="description"${addAttribute(description, "content")}>`}<link rel="icon" type="image/x-icon" href="/favicon.ico">${renderHead()}</head> <body> <div class="flex min-h-screen flex-col bg-black lg:flex-row lg:overflow-hidden"> ${renderComponent($$result, "MobileNav", $$MobileNav, {})} <!-- Sidebar Desktop --> <aside class="hidden w-64 lg:block"> ${renderComponent($$result, "Sidebar", $$Sidebar, {})} </aside> <!-- Main Content --> <main class="flex-1 overflow-y-auto"> <div class="min-h-screen"> ${renderSlot($$result, $$slots["default"])} </div> </main> </div> <!-- Toast Notifications --> ${renderComponent($$result, "Toast", $$Toast, {})} </body></html>`;
}, "/home/ceanbrjr/Dev/sriphone/src/layouts/AdminLayout.astro", void 0);

export { $$AdminLayout as $ };
