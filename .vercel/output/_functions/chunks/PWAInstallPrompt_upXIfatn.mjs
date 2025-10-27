import { e as createAstro, f as createComponent, k as renderComponent, l as renderScript, r as renderTemplate, o as renderSlot, n as renderHead, u as unescapeHTML, h as addAttribute, m as maybeRenderHead, p as Fragment } from './astro/server_DLhSBo-F.mjs';
/* empty css                            */
import 'clsx';

const $$Astro$2 = createAstro("https://sriphonevca.com.br");
const $$Index = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro$2, $$props, $$slots);
  Astro2.self = $$Index;
  const propsStr = JSON.stringify(Astro2.props);
  const paramsStr = JSON.stringify(Astro2.params);
  return renderTemplate`${renderComponent($$result, "vercel-analytics", "vercel-analytics", { "data-props": propsStr, "data-params": paramsStr, "data-pathname": Astro2.url.pathname })} ${renderScript($$result, "/home/ceanbrjr/Dev/sriphone/node_modules/@vercel/analytics/dist/astro/index.astro?astro&type=script&index=0&lang.ts")}`;
}, "/home/ceanbrjr/Dev/sriphone/node_modules/@vercel/analytics/dist/astro/index.astro", void 0);

var __freeze = Object.freeze;
var __defProp = Object.defineProperty;
var __template = (cooked, raw) => __freeze(__defProp(cooked, "raw", { value: __freeze(cooked.slice()) }));
var _a;
const $$Astro$1 = createAstro("https://sriphonevca.com.br");
const $$Layout = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro$1, $$props, $$slots);
  Astro2.self = $$Layout;
  const { title, description } = Astro2.props;
  const criticalCSS = `
/* Critical CSS inline - Performance otimizada */
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
body { background: #000; color: #fff; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; overflow-x: hidden; }
.header { position: fixed; top: 0; left: 0; right: 0; background: rgba(0, 0, 0, 0.95); backdrop-filter: blur(20px); z-index: 100; border-bottom: 1px solid #1a1a1a; }
.header-container { max-width: 1200px; margin: 0 auto; display: flex; align-items: center; justify-content: space-between; padding: 1rem; }
.logo { display: flex; align-items: center; gap: 0.75rem; text-decoration: none; font-weight: 700; color: #fff; }
.logo img { width: 32px; height: 32px; }
.hero { min-height: 100vh; display: flex; align-items: center; justify-content: center; background: linear-gradient(135deg, #000 0%, #1a1a1a 100%); position: relative; overflow: hidden; }
.hero-content { text-align: center; max-width: 800px; padding: 0 2rem; }
.hero h1 { font-size: clamp(2.5rem, 8vw, 4rem); font-weight: 900; margin-bottom: 1rem; background: linear-gradient(45deg, #fff, #ccc); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
.loading { display: flex; flex-direction: column; align-items: center; gap: 1rem; padding: 2rem; color: #666; }
.spinner { width: 40px; height: 40px; border: 3px solid #333; border-top: 3px solid #fff; border-radius: 50%; animation: spin 1s linear infinite; }
@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
@keyframes skeleton-loading { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
.image-skeleton { background: linear-gradient(90deg, #1a1a1a 0%, #2a2a2a 50%, #1a1a1a 100%); background-size: 200% 100%; animation: skeleton-loading 1.5s ease-in-out infinite; }
.container { max-width: 1200px; margin: 0 auto; padding: 0 1rem; }
.sr-only { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; border: 0; }
@media (max-width: 768px) { .hero h1 { font-size: 2.5rem; } .header-container { padding: 0.75rem 1rem; } }
`.trim();
  return renderTemplate(_a || (_a = __template(['<html lang="pt-br" data-astro-cid-sckkx6r4> <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover"><meta name="description"', '><link rel="icon" type="image/svg+xml" href="/favicon.svg"><meta name="generator"', '><!-- PWA Meta Tags --><meta name="mobile-web-app-capable" content="yes"><meta name="apple-mobile-web-app-capable" content="yes"><meta name="apple-mobile-web-app-status-bar-style" content="black-translucent"><meta name="apple-mobile-web-app-title" content="SriPhone"><meta name="application-name" content="SriPhone"><meta name="theme-color" content="#000000"><meta name="msapplication-TileColor" content="#000000"><meta name="msapplication-tap-highlight" content="no"><!-- PWA Manifest --><link rel="manifest" href="/manifest.json"><!-- Apple Touch Icons --><link rel="apple-touch-icon" href="/icons/apple-touch-icon.png"><link rel="apple-touch-icon" sizes="152x152" href="/icons/icon-152x152.png"><link rel="apple-touch-icon" sizes="180x180" href="/icons/apple-touch-icon.png"><link rel="apple-touch-icon" sizes="192x192" href="/icons/icon-192x192.png"><!-- Resource hints cr\xEDticos para performance --><link rel="preconnect" href="https://vercel-analytics.com" crossorigin><link rel="preconnect" href="https://supabase.co" crossorigin><link rel="dns-prefetch" href="https://fonts.googleapis.com"><!-- Prefetch rotas cr\xEDticas --><link rel="prefetch" href="/catalogo"><!-- Preload recursos cr\xEDticos --><link rel="preload" href="/fonts/inter-var.woff2" as="font" type="font/woff2" crossorigin><link rel="preload" href="/images/hero-bg.webp" as="image"><link rel="preload" href="/icons/logo.svg" as="image"><!-- Critical CSS Inline para eliminar render-blocking -->', "", "", `<!-- Scripts otimizados para reduzir TBT --><script type="module" src="/src/scripts/webVitals.js" defer><\/script><!-- Service Worker para cache agressivo e PWA --><script>
      if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
          navigator.serviceWorker.register('/sw.js')
            .then(reg => {
              reg.addEventListener('updatefound', () => {
                const newWorker = reg.installing;
                newWorker.addEventListener('statechange', () => {
                  if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                    if (confirm('Nova vers\xE3o dispon\xEDvel! Atualizar agora?')) {
                      newWorker.postMessage({ action: 'SKIP_WAITING' });
                      window.location.reload();
                    }
                  }
                });
              });
            })
            .catch(() => {}); // Silent fail
        });
      }
    <\/script><title>`, "</title>", "</head> <body data-astro-cid-sckkx6r4> ", ' <button id="layout-back-to-top" class="layout-back-to-top" aria-label="Voltar ao topo" data-astro-cid-sckkx6r4> <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" data-astro-cid-sckkx6r4> <path d="M12 19V5M12 5L5 12M12 5L19 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" data-astro-cid-sckkx6r4></path> </svg> </button> ', " </body></html>"])), addAttribute(description, "content"), addAttribute(Astro2.generator, "content"), criticalCSS && renderTemplate`<style>${unescapeHTML(criticalCSS)}</style>`, renderSlot($$result, $$slots["head"]), renderComponent($$result, "Analytics", $$Index, { "data-astro-cid-sckkx6r4": true }), title, renderHead(), renderSlot($$result, $$slots["default"]), renderScript($$result, "/home/ceanbrjr/Dev/sriphone/src/layouts/Layout.astro?astro&type=script&index=0&lang.ts"));
}, "/home/ceanbrjr/Dev/sriphone/src/layouts/Layout.astro", void 0);

const $$Astro = createAstro("https://sriphonevca.com.br");
const $$Header = createComponent(async ($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$Header;
  const currentPath = Astro2.url.pathname;
  const isCatalogPage = currentPath === "/catalogo" || currentPath === "/catalogo/" || currentPath.includes("/catalogo");
  return renderTemplate`${maybeRenderHead()}<header class="header" data-astro-cid-3ef6ksr2> <div class="container" data-astro-cid-3ef6ksr2> <a href="/" data-astro-cid-3ef6ksr2> <img src="/images/logo-fundo.webp" alt="Sr. IPHONE Logo" class="logo" fetchpriority="high" decoding="async" data-astro-cid-3ef6ksr2> </a> <nav class="nav" data-astro-cid-3ef6ksr2> ${!isCatalogPage && renderTemplate`<a href="/catalogo" data-astro-cid-3ef6ksr2>Catálogo</a>`} ${isCatalogPage && renderTemplate`${renderComponent($$result, "Fragment", Fragment, { "data-astro-cid-3ef6ksr2": true }, { "default": async ($$result2) => renderTemplate`  <button id="btn-auth-desktop" class="btn-auth btn-auth-desktop" data-astro-cid-3ef6ksr2> <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" data-astro-cid-3ef6ksr2> <path d="M15 3H19C19.5304 3 20.0391 3.21071 20.4142 3.58579C20.7893 3.96086 21 4.46957 21 5V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H15M10 17L15 12L10 7M15 12H3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" data-astro-cid-3ef6ksr2></path> </svg> <span data-astro-cid-3ef6ksr2>Admin</span> </button>  <div id="admin-actions-desktop" class="admin-actions-desktop" style="display: none;" data-astro-cid-3ef6ksr2> <button id="btn-criar-produto-desktop" class="btn-admin-action" data-astro-cid-3ef6ksr2> <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" data-astro-cid-3ef6ksr2> <path d="M12 5V19M5 12H19" stroke="currentColor" stroke-width="2" stroke-linecap="round" data-astro-cid-3ef6ksr2></path> </svg>
Novo Produto
</button> <button id="btn-gerir-categorias-desktop" class="btn-admin-action" data-astro-cid-3ef6ksr2> <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" data-astro-cid-3ef6ksr2> <path d="M3 7H21M3 12H21M3 17H21" stroke="currentColor" stroke-width="2" stroke-linecap="round" data-astro-cid-3ef6ksr2></path> </svg>
Categorias
</button> </div>  <button id="btn-menu-mobile" class="btn-menu-mobile" style="display: none;" data-astro-cid-3ef6ksr2> <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" data-astro-cid-3ef6ksr2> <path d="M3 12H21M3 6H21M3 18H21" stroke="currentColor" stroke-width="2" stroke-linecap="round" data-astro-cid-3ef6ksr2></path> </svg> </button>  <div id="dropdown-mobile" class="dropdown-mobile" data-astro-cid-3ef6ksr2> <button id="btn-criar-produto-mobile" class="dropdown-item" data-astro-cid-3ef6ksr2> <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" data-astro-cid-3ef6ksr2> <path d="M12 5V19M5 12H19" stroke="currentColor" stroke-width="2" stroke-linecap="round" data-astro-cid-3ef6ksr2></path> </svg>
Novo Produto
</button> <button id="btn-gerir-categorias-mobile" class="dropdown-item" data-astro-cid-3ef6ksr2> <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" data-astro-cid-3ef6ksr2> <path d="M3 7H21M3 12H21M3 17H21" stroke="currentColor" stroke-width="2" stroke-linecap="round" data-astro-cid-3ef6ksr2></path> </svg>
Categorias
</button> <button id="btn-sair-mobile" class="dropdown-item" data-astro-cid-3ef6ksr2> <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" data-astro-cid-3ef6ksr2> <path d="M9 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H9M16 17L21 12M21 12L16 7M21 12H9" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" data-astro-cid-3ef6ksr2></path> </svg>
Sair
</button> </div> ` })}`} </nav> </div> </header>  ${isCatalogPage && renderTemplate`${renderScript($$result, "/home/ceanbrjr/Dev/sriphone/src/components/Header.astro?astro&type=script&index=0&lang.ts")}`}`;
}, "/home/ceanbrjr/Dev/sriphone/src/components/Header.astro", void 0);

const $$Footer = createComponent(($$result, $$props, $$slots) => {
  const anoAtual = (/* @__PURE__ */ new Date()).getFullYear();
  return renderTemplate`${maybeRenderHead()}<footer class="footer" data-astro-cid-sz7xmlte> <div class="container" data-astro-cid-sz7xmlte> <p data-astro-cid-sz7xmlte>&copy; ${anoAtual} Sr. IPHONE. Todos os direitos reservados.</p> </div> </footer> `;
}, "/home/ceanbrjr/Dev/sriphone/src/components/Footer.astro", void 0);

const $$PWAInstallPrompt = createComponent(async ($$result, $$props, $$slots) => {
  return renderTemplate`${maybeRenderHead()}<div id="pwa-install-prompt" class="pwa-install-prompt hidden" data-astro-cid-d7bs4cmf> <div class="pwa-prompt-content" data-astro-cid-d7bs4cmf> <button id="pwa-prompt-close" class="pwa-prompt-close" aria-label="Fechar" data-astro-cid-d7bs4cmf> <svg width="24" height="24" viewBox="0 0 24 24" fill="none" data-astro-cid-d7bs4cmf> <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" data-astro-cid-d7bs4cmf></path> </svg> </button> <div class="pwa-prompt-icon" data-astro-cid-d7bs4cmf> <img src="/icons/icon-96x96.png" alt="SriPhone" width="64" height="64" data-astro-cid-d7bs4cmf> </div> <div class="pwa-prompt-text" data-astro-cid-d7bs4cmf> <h3 data-astro-cid-d7bs4cmf>Instale o App na Tela Inicial</h3> <p data-astro-cid-d7bs4cmf>Acesse rápido e use como aplicativo nativo!</p> </div> <button id="pwa-install-button" class="pwa-install-button" data-astro-cid-d7bs4cmf> <svg width="20" height="20" viewBox="0 0 24 24" fill="none" data-astro-cid-d7bs4cmf> <path d="M12 15V3m0 12l-4-4m4 4l4-4M2 17l.621 2.485A2 2 0 004.561 21h14.878a2 2 0 001.94-1.515L22 17" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" data-astro-cid-d7bs4cmf></path> </svg>
Instalar App
</button> <button id="pwa-manual-instructions" class="pwa-manual-link" data-astro-cid-d7bs4cmf>
Ver instruções manuais
</button> </div> </div> <!-- Modal com instruções manuais --> <div id="pwa-instructions-modal" class="pwa-modal hidden" data-astro-cid-d7bs4cmf> <div class="pwa-modal-overlay" data-astro-cid-d7bs4cmf></div> <div class="pwa-modal-content" data-astro-cid-d7bs4cmf> <button id="pwa-modal-close" class="pwa-prompt-close" aria-label="Fechar" data-astro-cid-d7bs4cmf> <svg width="24" height="24" viewBox="0 0 24 24" fill="none" data-astro-cid-d7bs4cmf> <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" data-astro-cid-d7bs4cmf></path> </svg> </button> <h2 data-astro-cid-d7bs4cmf>Como Instalar o App</h2> <div class="pwa-instructions" data-astro-cid-d7bs4cmf> <div class="pwa-instruction-section" data-astro-cid-d7bs4cmf> <h3 data-astro-cid-d7bs4cmf>📱 No iPhone (Safari)</h3> <ol data-astro-cid-d7bs4cmf> <li data-astro-cid-d7bs4cmf>Toque no botão <strong data-astro-cid-d7bs4cmf>Compartilhar</strong> (ícone de quadrado com seta)</li> <li data-astro-cid-d7bs4cmf>Role para baixo e toque em <strong data-astro-cid-d7bs4cmf>"Adicionar à Tela de Início"</strong></li> <li data-astro-cid-d7bs4cmf>Toque em <strong data-astro-cid-d7bs4cmf>"Adicionar"</strong> no canto superior direito</li> <li data-astro-cid-d7bs4cmf>O app aparecerá na sua tela inicial!</li> </ol> </div> <div class="pwa-instruction-section" data-astro-cid-d7bs4cmf> <h3 data-astro-cid-d7bs4cmf>📱 No Android (Chrome)</h3> <ol data-astro-cid-d7bs4cmf> <li data-astro-cid-d7bs4cmf>Toque no menu <strong data-astro-cid-d7bs4cmf>⋮</strong> (três pontos) no canto superior direito</li> <li data-astro-cid-d7bs4cmf>Selecione <strong data-astro-cid-d7bs4cmf>"Adicionar à tela inicial"</strong> ou <strong data-astro-cid-d7bs4cmf>"Instalar app"</strong></li> <li data-astro-cid-d7bs4cmf>Confirme tocando em <strong data-astro-cid-d7bs4cmf>"Adicionar"</strong> ou <strong data-astro-cid-d7bs4cmf>"Instalar"</strong></li> <li data-astro-cid-d7bs4cmf>O app aparecerá na sua tela inicial!</li> </ol> </div> <div class="pwa-instruction-section" data-astro-cid-d7bs4cmf> <h3 data-astro-cid-d7bs4cmf>💻 No Desktop (Chrome/Edge)</h3> <ol data-astro-cid-d7bs4cmf> <li data-astro-cid-d7bs4cmf>Clique no ícone <strong data-astro-cid-d7bs4cmf>⊕</strong> ou <strong data-astro-cid-d7bs4cmf>🖥️</strong> na barra de endereços</li> <li data-astro-cid-d7bs4cmf>Clique em <strong data-astro-cid-d7bs4cmf>"Instalar"</strong></li> <li data-astro-cid-d7bs4cmf>O app será instalado e aberto em uma janela separada!</li> </ol> </div> </div> <button id="pwa-modal-got-it" class="pwa-install-button" data-astro-cid-d7bs4cmf>
Entendi!
</button> </div> </div> ${renderScript($$result, "/home/ceanbrjr/Dev/sriphone/src/components/PWAInstallPrompt.astro?astro&type=script&index=0&lang.ts")} `;
}, "/home/ceanbrjr/Dev/sriphone/src/components/PWAInstallPrompt.astro", void 0);

export { $$Layout as $, $$Header as a, $$Footer as b, $$PWAInstallPrompt as c };
