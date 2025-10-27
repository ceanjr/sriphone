import { e as createAstro, f as createComponent, m as maybeRenderHead, h as addAttribute, l as renderScript, r as renderTemplate, k as renderComponent } from '../../chunks/astro/server_DLhSBo-F.mjs';
import { $ as $$AdminLayout } from '../../chunks/AdminLayout_Cw13ykxQ.mjs';
import 'clsx';
import { s as supabase } from '../../chunks/supabase_uscxYbXR.mjs';
export { renderers } from '../../renderers.mjs';

const $$Astro = createAstro("https://sriphonevca.com.br");
const $$CategoryFormDialog = createComponent(async ($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$CategoryFormDialog;
  const { categoria } = Astro2.props;
  const isEdit = !!categoria;
  return renderTemplate`${maybeRenderHead()}<div id="category-dialog" class="fixed inset-0 z-50 hidden items-center justify-center bg-black/50 backdrop-blur-sm"> <div class="relative w-full max-w-md rounded-lg border border-[#2a2a2a] bg-[#0a0a0a] p-6 m-4"> <!-- Header --> <div class="mb-6 flex items-center justify-between"> <h2 class="text-xl font-bold text-white"> ${isEdit ? "Editar Categoria" : "Nova Categoria"} </h2> <button type="button" id="close-category-dialog" class="rounded-lg p-2 text-[#a0a0a0] transition hover:bg-[#1a1a1a] hover:text-white" aria-label="Fechar"> <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"> <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path> </svg> </button> </div> <!-- Form --> <form id="category-form" class="space-y-4"> <input type="hidden" id="category-id" name="id"${addAttribute(categoria?.id || "", "value")}> <!-- Nome --> <div> <label for="category-nome" class="block text-sm font-medium text-[#e0e0e0]">
Nome da Categoria *
</label> <input type="text" id="category-nome" name="nome" required${addAttribute(categoria?.nome || "", "value")} class="mt-1 block w-full rounded-lg border border-[#2a2a2a] bg-[#1a1a1a] px-3 py-2 text-white placeholder-[#a0a0a0] focus:border-white focus:outline-none focus:ring-1 focus:ring-white" placeholder="iPhone"> </div> <!-- Botões --> <div class="flex items-center justify-end gap-3 pt-4"> <button type="button" id="cancel-category-btn" class="rounded-lg border border-[#2a2a2a] bg-transparent px-4 py-2 text-sm font-medium text-white transition hover:bg-[#1a1a1a]">
Cancelar
</button> <button type="submit" id="submit-category-btn" class="rounded-lg bg-white px-4 py-2 text-sm font-medium text-black transition hover:bg-[#e0e0e0] disabled:opacity-50 disabled:cursor-not-allowed"> ${isEdit ? "Salvar" : "Criar Categoria"} </button> </div> </form> </div> </div> ${renderScript($$result, "/home/ceanbrjr/Dev/sriphone/src/components/admin/CategoryFormDialog.astro?astro&type=script&index=0&lang.ts")}`;
}, "/home/ceanbrjr/Dev/sriphone/src/components/admin/CategoryFormDialog.astro", void 0);

const $$Categorias = createComponent(async ($$result, $$props, $$slots) => {
  const { data: categorias, error } = await supabase.from("categorias").select("*").order("nome");
  const categoriasComContagem = await Promise.all(
    (categorias || []).map(async (cat) => {
      const { count } = await supabase.from("produtos").select("*", { count: "exact", head: true }).eq("categoria_id", cat.id);
      return { ...cat, produtos_count: count || 0 };
    })
  );
  return renderTemplate`${renderComponent($$result, "AdminLayout", $$AdminLayout, { "title": "Categorias", "description": "Gerenciar categorias de produtos" }, { "default": async ($$result2) => renderTemplate` ${maybeRenderHead()}<div class="flex flex-col"> <!-- Header --> <div class="flex min-h-[64px] items-center justify-between border-b border-[#2a2a2a] bg-[#0a0a0a] px-4 py-3 md:px-6"> <div class="min-w-0 flex-1"> <h1 class="truncate text-lg font-bold text-white md:text-xl">Categorias</h1> <p class="hidden text-sm text-[#a0a0a0] sm:block">Gerenciar categorias de produtos</p> </div> <button id="add-category-btn" class="rounded-lg bg-white px-4 py-2 text-sm font-medium text-black transition hover:bg-[#e0e0e0]"> <span class="hidden sm:inline">Nova Categoria</span> <span class="sm:hidden">Nova</span> </button> </div> <!-- Content --> <div class="flex-1 p-4 md:p-6"> ${!categoriasComContagem || categoriasComContagem.length === 0 ? renderTemplate`<div class="rounded-lg border border-[#2a2a2a] bg-[#0a0a0a] p-12 text-center"> <svg class="mx-auto h-12 w-12 text-[#a0a0a0]" fill="none" stroke="currentColor" viewBox="0 0 24 24"> <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"></path> </svg> <h3 class="mt-4 text-lg font-medium text-white">Nenhuma categoria cadastrada</h3> <p class="mt-2 text-sm text-[#a0a0a0]">
Comece criando sua primeira categoria.
</p> <button onclick="window.openCategoryDialog()" class="mt-4 rounded-lg bg-white px-4 py-2 text-sm font-medium text-black transition hover:bg-[#e0e0e0]">
Nova Categoria
</button> </div>` : renderTemplate`<div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3"> ${categoriasComContagem.map((categoria) => renderTemplate`<div class="rounded-lg border border-[#2a2a2a] bg-[#0a0a0a] p-6 transition hover:border-[#3a3a3a]"> <div class="flex items-start justify-between"> <div class="flex-1 min-w-0"> <h3 class="text-lg font-semibold text-white truncate">${categoria.nome}</h3> <p class="mt-1 text-sm text-[#a0a0a0]"> ${categoria.produtos_count} ${categoria.produtos_count === 1 ? "produto" : "produtos"} </p> </div> <div class="flex gap-2 ml-2"> <button class="rounded-lg bg-white/10 p-2 text-white transition hover:bg-white/20" data-action="edit"${addAttribute(JSON.stringify(categoria), "data-categoria")} title="Editar"> <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"> <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path> </svg> </button> <button class="rounded-lg bg-red-500/10 p-2 text-red-500 transition hover:bg-red-500/20" data-action="delete"${addAttribute(categoria.id, "data-id")}${addAttribute(categoria.nome, "data-nome")}${addAttribute(categoria.produtos_count, "data-count")} title="Deletar"> <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"> <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path> </svg> </button> </div> </div> </div>`)} </div>`} </div> </div>  ${renderComponent($$result2, "CategoryFormDialog", $$CategoryFormDialog, {})} ` })} ${renderScript($$result, "/home/ceanbrjr/Dev/sriphone/src/pages/admin/categorias.astro?astro&type=script&index=0&lang.ts")}`;
}, "/home/ceanbrjr/Dev/sriphone/src/pages/admin/categorias.astro", void 0);

const $$file = "/home/ceanbrjr/Dev/sriphone/src/pages/admin/categorias.astro";
const $$url = "/admin/categorias";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Categorias,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
