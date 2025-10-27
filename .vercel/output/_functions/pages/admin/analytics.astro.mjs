import { f as createComponent, k as renderComponent, r as renderTemplate, m as maybeRenderHead } from '../../chunks/astro/server_DLhSBo-F.mjs';
import { $ as $$AdminLayout } from '../../chunks/AdminLayout_Cw13ykxQ.mjs';
export { renderers } from '../../renderers.mjs';

const $$Analytics = createComponent(($$result, $$props, $$slots) => {
  return renderTemplate`${renderComponent($$result, "AdminLayout", $$AdminLayout, { "title": "Analytics", "description": "An\xE1lise de dados e estat\xEDsticas" }, { "default": ($$result2) => renderTemplate` ${maybeRenderHead()}<div class="flex flex-col"> <!-- Header --> <div class="flex min-h-[64px] items-center justify-between border-b border-[#2a2a2a] bg-[#0a0a0a] px-4 py-3 md:px-6"> <div class="min-w-0 flex-1"> <h1 class="truncate text-lg font-bold text-white md:text-xl">Analytics</h1> <p class="hidden text-sm text-[#a0a0a0] sm:block">Análise de dados e estatísticas</p> </div> </div> <!-- Content --> <div class="flex-1 p-6"> <div class="rounded-lg border border-[#2a2a2a] bg-[#0a0a0a] p-12 text-center"> <svg class="mx-auto h-12 w-12 text-[#a0a0a0]" fill="none" stroke="currentColor" viewBox="0 0 24 24"> <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path> </svg> <h3 class="mt-4 text-lg font-medium text-white">Analytics e Relatórios</h3> <p class="mt-2 text-sm text-[#a0a0a0]">
Funcionalidade em desenvolvimento. Em breve você terá acesso a relatórios detalhados e analytics.
</p> </div> </div> </div> ` })}`;
}, "/home/ceanbrjr/Dev/sriphone/src/pages/admin/analytics.astro", void 0);

const $$file = "/home/ceanbrjr/Dev/sriphone/src/pages/admin/analytics.astro";
const $$url = "/admin/analytics";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Analytics,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
