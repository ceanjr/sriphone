import { f as createComponent, n as renderHead, l as renderScript, r as renderTemplate } from '../../chunks/astro/server_DLhSBo-F.mjs';
import 'clsx';
/* empty css                                        */
export { renderers } from '../../renderers.mjs';

const $$Login = createComponent(async ($$result, $$props, $$slots) => {
  return renderTemplate`<html lang="pt-BR"> <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><meta name="robots" content="noindex, nofollow"><title>Login | Admin - Sr. IPHONE VCA</title><link rel="icon" type="image/x-icon" href="/favicon.ico">${renderHead()}</head> <body class="bg-black"> <div class="flex min-h-screen items-center justify-center p-4"> <div class="w-full max-w-md"> <!-- Logo --> <div class="mb-8 text-center"> <img src="/images/logo-fundo.webp" alt="Sr. IPHONE VCA" class="mx-auto h-20 w-20 object-contain"> <h1 class="mt-4 text-2xl font-bold text-white">Admin - Sr. IPHONE VCA</h1> <p class="mt-2 text-sm text-[#a0a0a0]">Área administrativa do catálogo</p> </div> <!-- Login Form --> <div class="rounded-lg border border-[#2a2a2a] bg-[#0a0a0a] p-6"> <h2 class="mb-6 text-lg font-semibold text-white">Entrar no Painel</h2> <form id="login-form" class="space-y-4"> <div> <label for="email" class="block text-sm font-medium text-[#e0e0e0]">
Email
</label> <input type="email" id="email" name="email" required class="mt-1 block w-full rounded-lg border border-[#2a2a2a] bg-[#1a1a1a] px-3 py-2 text-white placeholder-[#a0a0a0] focus:border-white focus:outline-none focus:ring-1 focus:ring-white" placeholder="seu@email.com"> </div> <div> <label for="password" class="block text-sm font-medium text-[#e0e0e0]">
Senha
</label> <input type="password" id="password" name="password" required class="mt-1 block w-full rounded-lg border border-[#2a2a2a] bg-[#1a1a1a] px-3 py-2 text-white placeholder-[#a0a0a0] focus:border-white focus:outline-none focus:ring-1 focus:ring-white" placeholder="••••••••"> </div> <div id="error-message" class="hidden rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-500"></div> <button type="submit" id="submit-btn" class="w-full rounded-lg bg-white px-4 py-2 text-sm font-medium text-black transition hover:bg-[#e0e0e0] focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-black disabled:opacity-50 disabled:cursor-not-allowed">
Entrar
</button> </form> </div> <p class="mt-4 text-center text-xs text-[#a0a0a0]">
© 2024 Sr. IPHONE VCA. Todos os direitos reservados.
</p> </div> </div> ${renderScript($$result, "/home/ceanbrjr/Dev/sriphone/src/pages/admin/login.astro?astro&type=script&index=0&lang.ts")} </body> </html>`;
}, "/home/ceanbrjr/Dev/sriphone/src/pages/admin/login.astro", void 0);

const $$file = "/home/ceanbrjr/Dev/sriphone/src/pages/admin/login.astro";
const $$url = "/admin/login";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Login,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
