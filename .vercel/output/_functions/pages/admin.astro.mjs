import { e as createAstro, f as createComponent } from '../chunks/astro/server_DLhSBo-F.mjs';
import 'clsx';
export { renderers } from '../renderers.mjs';

const $$Astro = createAstro("https://sriphonevca.com.br");
const $$Index = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$Index;
  return Astro2.redirect("/admin/dashboard");
}, "/home/ceanbrjr/Dev/sriphone/src/pages/admin/index.astro", void 0);

const $$file = "/home/ceanbrjr/Dev/sriphone/src/pages/admin/index.astro";
const $$url = "/admin";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
	__proto__: null,
	default: $$Index,
	file: $$file,
	url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
