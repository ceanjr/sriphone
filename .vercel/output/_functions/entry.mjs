import { renderers } from './renderers.mjs';
import { c as createExports, s as serverEntrypointModule } from './chunks/_@astrojs-ssr-adapter_CVzwFfv9.mjs';
import { manifest } from './manifest_Dl8R2oej.mjs';

const serverIslandMap = new Map();;

const _page0 = () => import('./pages/_image.astro.mjs');
const _page1 = () => import('./pages/admin/analytics.astro.mjs');
const _page2 = () => import('./pages/admin/banners.astro.mjs');
const _page3 = () => import('./pages/admin/categorias.astro.mjs');
const _page4 = () => import('./pages/admin/dashboard.astro.mjs');
const _page5 = () => import('./pages/admin/login.astro.mjs');
const _page6 = () => import('./pages/admin/produtos.astro.mjs');
const _page7 = () => import('./pages/admin.astro.mjs');
const _page8 = () => import('./pages/api/admin/auth/login.astro.mjs');
const _page9 = () => import('./pages/api/admin/auth/logout.astro.mjs');
const _page10 = () => import('./pages/api/admin/categorias/_id_.astro.mjs');
const _page11 = () => import('./pages/api/admin/categorias.astro.mjs');
const _page12 = () => import('./pages/api/admin/produtos/_id_.astro.mjs');
const _page13 = () => import('./pages/api/admin/produtos.astro.mjs');
const _page14 = () => import('./pages/api/admin/upload.astro.mjs');
const _page15 = () => import('./pages/catalogo.astro.mjs');
const _page16 = () => import('./pages/index.astro.mjs');
const pageMap = new Map([
    ["node_modules/astro/dist/assets/endpoint/generic.js", _page0],
    ["src/pages/admin/analytics.astro", _page1],
    ["src/pages/admin/banners.astro", _page2],
    ["src/pages/admin/categorias.astro", _page3],
    ["src/pages/admin/dashboard.astro", _page4],
    ["src/pages/admin/login.astro", _page5],
    ["src/pages/admin/produtos.astro", _page6],
    ["src/pages/admin/index.astro", _page7],
    ["src/pages/api/admin/auth/login.ts", _page8],
    ["src/pages/api/admin/auth/logout.ts", _page9],
    ["src/pages/api/admin/categorias/[id].ts", _page10],
    ["src/pages/api/admin/categorias/index.ts", _page11],
    ["src/pages/api/admin/produtos/[id].ts", _page12],
    ["src/pages/api/admin/produtos/index.ts", _page13],
    ["src/pages/api/admin/upload.ts", _page14],
    ["src/pages/catalogo.astro", _page15],
    ["src/pages/index.astro", _page16]
]);

const _manifest = Object.assign(manifest, {
    pageMap,
    serverIslandMap,
    renderers,
    actions: () => import('./noop-entrypoint.mjs'),
    middleware: () => import('./_noop-middleware.mjs')
});
const _args = {
    "middlewareSecret": "a4083069-b429-4aa7-acf6-3be7cdd093e2",
    "skewProtection": false
};
const _exports = createExports(_manifest, _args);
const __astrojsSsrVirtualEntry = _exports.default;
const _start = 'start';
if (Object.prototype.hasOwnProperty.call(serverEntrypointModule, _start)) ;

export { __astrojsSsrVirtualEntry as default, pageMap };
