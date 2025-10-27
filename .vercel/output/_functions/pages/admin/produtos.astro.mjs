import { e as createAstro, f as createComponent, m as maybeRenderHead, h as addAttribute, l as renderScript, r as renderTemplate, k as renderComponent } from '../../chunks/astro/server_DLhSBo-F.mjs';
import { $ as $$AdminLayout } from '../../chunks/AdminLayout_Cw13ykxQ.mjs';
import 'clsx';
import { s as supabase } from '../../chunks/supabase_uscxYbXR.mjs';
export { renderers } from '../../renderers.mjs';

const $$Astro = createAstro("https://sriphonevca.com.br");
const $$ProductFormDialog = createComponent(async ($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$ProductFormDialog;
  const { produto, categorias } = Astro2.props;
  const isEdit = !!produto;
  return renderTemplate`${maybeRenderHead()}<div id="product-dialog" class="fixed inset-0 z-50 hidden items-center justify-center bg-black/50 backdrop-blur-sm"> <div class="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-lg border border-[#2a2a2a] bg-[#0a0a0a] p-6 m-4"> <!-- Header --> <div class="mb-6 flex items-center justify-between"> <h2 class="text-xl font-bold text-white"> ${isEdit ? "Editar Produto" : "Adicionar Produto"} </h2> <button type="button" id="close-dialog-btn" class="rounded-lg p-2 text-[#a0a0a0] transition hover:bg-[#1a1a1a] hover:text-white" aria-label="Fechar"> <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"> <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path> </svg> </button> </div> <!-- Form --> <form id="product-form" class="space-y-4"> <input type="hidden" id="product-id" name="id"${addAttribute(produto?.id || "", "value")}> <!-- Nome --> <div> <label for="nome" class="block text-sm font-medium text-[#e0e0e0]">
Nome do Produto *
</label> <input type="text" id="nome" name="nome" required${addAttribute(produto?.nome || "", "value")} class="mt-1 block w-full rounded-lg border border-[#2a2a2a] bg-[#1a1a1a] px-3 py-2 text-white placeholder-[#a0a0a0] focus:border-white focus:outline-none focus:ring-1 focus:ring-white" placeholder="iPhone 13 Pro Max"> </div> <!-- Código --> <div> <label for="codigo" class="block text-sm font-medium text-[#e0e0e0]">
Código *
</label> <input type="text" id="codigo" name="codigo" required${addAttribute(produto?.codigo || "", "value")} class="mt-1 block w-full rounded-lg border border-[#2a2a2a] bg-[#1a1a1a] px-3 py-2 text-white placeholder-[#a0a0a0] focus:border-white focus:outline-none focus:ring-1 focus:ring-white" placeholder="IPH13PM128"> </div> <!-- Grid de 2 colunas --> <div class="grid gap-4 md:grid-cols-2"> <!-- Preço --> <div> <label for="preco" class="block text-sm font-medium text-[#e0e0e0]">
Preço (R$) *
</label> <input type="number" id="preco" name="preco" required step="0.01" min="0"${addAttribute(produto?.preco || "", "value")} class="mt-1 block w-full rounded-lg border border-[#2a2a2a] bg-[#1a1a1a] px-3 py-2 text-white placeholder-[#a0a0a0] focus:border-white focus:outline-none focus:ring-1 focus:ring-white" placeholder="4999.99"> </div> <!-- Bateria --> <div> <label for="bateria" class="block text-sm font-medium text-[#e0e0e0]">
Bateria (%)
</label> <input type="number" id="bateria" name="bateria" min="0" max="100"${addAttribute(produto?.bateria || "", "value")} class="mt-1 block w-full rounded-lg border border-[#2a2a2a] bg-[#1a1a1a] px-3 py-2 text-white placeholder-[#a0a0a0] focus:border-white focus:outline-none focus:ring-1 focus:ring-white" placeholder="85"> </div> </div> <!-- Grid de 2 colunas --> <div class="grid gap-4 md:grid-cols-2"> <!-- Condição --> <div> <label for="condicao" class="block text-sm font-medium text-[#e0e0e0]">
Condição *
</label> <select id="condicao" name="condicao" required class="mt-1 block w-full rounded-lg border border-[#2a2a2a] bg-[#1a1a1a] px-3 py-2 text-white focus:border-white focus:outline-none focus:ring-1 focus:ring-white"> <option value="Novo"${addAttribute(produto?.condicao === "Novo", "selected")}>Novo</option> <option value="Seminovo"${addAttribute(produto?.condicao === "Seminovo", "selected")}>Seminovo</option> </select> </div> <!-- Categoria --> <div> <label for="categoria_id" class="block text-sm font-medium text-[#e0e0e0]">
Categoria *
</label> <select id="categoria_id" name="categoria_id" required class="mt-1 block w-full rounded-lg border border-[#2a2a2a] bg-[#1a1a1a] px-3 py-2 text-white focus:border-white focus:outline-none focus:ring-1 focus:ring-white"> <option value="">Selecione...</option> ${categorias.map((cat) => renderTemplate`<option${addAttribute(cat.id, "value")}${addAttribute(produto?.categoria_id === cat.id, "selected")}> ${cat.nome} </option>`)} </select> </div> </div> <!-- Descrição --> <div> <label for="descricao" class="block text-sm font-medium text-[#e0e0e0]">
Descrição
</label> <textarea id="descricao" name="descricao" rows="3"${addAttribute(produto?.descricao || "", "value")} class="mt-1 block w-full rounded-lg border border-[#2a2a2a] bg-[#1a1a1a] px-3 py-2 text-white placeholder-[#a0a0a0] focus:border-white focus:outline-none focus:ring-1 focus:ring-white" placeholder="Descrição detalhada do produto..."></textarea> </div> <!-- Upload de Imagem --> <div> <label class="block text-sm font-medium text-[#e0e0e0] mb-2">
Foto Principal
</label> <div class="flex items-center gap-4"> ${produto?.foto_principal && renderTemplate`<img id="preview-image"${addAttribute(produto.foto_principal, "src")} alt="Preview" class="h-20 w-20 rounded-lg object-cover border border-[#2a2a2a]">`} <div class="flex-1"> <input type="file" id="foto-upload" accept="image/jpeg,image/jpg,image/png,image/webp" class="hidden"> <input type="hidden" id="foto_principal" name="foto_principal"${addAttribute(produto?.foto_principal || "", "value")}> <button type="button" id="upload-btn" class="rounded-lg border border-[#2a2a2a] bg-[#1a1a1a] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#2a2a2a]">
Escolher Arquivo
</button> <p class="mt-1 text-xs text-[#a0a0a0]">
JPG, PNG ou WebP. Máximo 5MB.
</p> </div> </div> </div> <!-- Status Ativo --> <div class="flex items-center gap-3"> <input type="checkbox" id="ativo" name="ativo"${addAttribute(produto?.ativo !== false, "checked")} class="h-4 w-4 rounded border-[#2a2a2a] bg-[#1a1a1a] text-white focus:ring-2 focus:ring-white focus:ring-offset-0"> <label for="ativo" class="text-sm font-medium text-[#e0e0e0]">
Produto ativo (visível no catálogo)
</label> </div> <!-- Botões --> <div class="flex items-center justify-end gap-3 pt-4 border-t border-[#2a2a2a]"> <button type="button" id="cancel-btn" class="rounded-lg border border-[#2a2a2a] bg-transparent px-4 py-2 text-sm font-medium text-white transition hover:bg-[#1a1a1a]">
Cancelar
</button> <button type="submit" id="submit-btn" class="rounded-lg bg-white px-4 py-2 text-sm font-medium text-black transition hover:bg-[#e0e0e0] disabled:opacity-50 disabled:cursor-not-allowed"> ${isEdit ? "Salvar Altera\xE7\xF5es" : "Adicionar Produto"} </button> </div> </form> </div> </div> ${renderScript($$result, "/home/ceanbrjr/Dev/sriphone/src/components/admin/ProductFormDialog.astro?astro&type=script&index=0&lang.ts")}`;
}, "/home/ceanbrjr/Dev/sriphone/src/components/admin/ProductFormDialog.astro", void 0);

const $$Produtos = createComponent(async ($$result, $$props, $$slots) => {
  const { data: produtos, error } = await supabase.from("produtos").select("*, categoria:categoria_id(id, nome)").order("created_at", { ascending: false });
  const { data: categorias } = await supabase.from("categorias").select("*").order("nome");
  return renderTemplate`${renderComponent($$result, "AdminLayout", $$AdminLayout, { "title": "Produtos", "description": "Gerenciar produtos do cat\xE1logo" }, { "default": async ($$result2) => renderTemplate` ${maybeRenderHead()}<div class="flex flex-col"> <!-- Header --> <div class="flex min-h-[64px] items-center justify-between border-b border-[#2a2a2a] bg-[#0a0a0a] px-4 py-3 md:px-6"> <div class="min-w-0 flex-1"> <h1 class="truncate text-lg font-bold text-white md:text-xl">Produtos</h1> <p class="hidden text-sm text-[#a0a0a0] sm:block">Gerenciar produtos do catálogo</p> </div> <button id="add-product-btn" class="rounded-lg bg-white px-4 py-2 text-sm font-medium text-black transition hover:bg-[#e0e0e0]"> <span class="hidden sm:inline">Adicionar Produto</span> <span class="sm:hidden">Adicionar</span> </button> </div> <!-- Content --> <div class="flex-1 p-4 md:p-6"> ${!produtos || produtos.length === 0 ? renderTemplate`<div class="rounded-lg border border-[#2a2a2a] bg-[#0a0a0a] p-12 text-center"> <svg class="mx-auto h-12 w-12 text-[#a0a0a0]" fill="none" stroke="currentColor" viewBox="0 0 24 24"> <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path> </svg> <h3 class="mt-4 text-lg font-medium text-white">Nenhum produto cadastrado</h3> <p class="mt-2 text-sm text-[#a0a0a0]">
Comece adicionando seu primeiro produto.
</p> <button onclick="window.openProductDialog()" class="mt-4 rounded-lg bg-white px-4 py-2 text-sm font-medium text-black transition hover:bg-[#e0e0e0]">
Adicionar Produto
</button> </div>` : renderTemplate`<div class="overflow-x-auto rounded-lg border border-[#2a2a2a] bg-[#0a0a0a]"> <table class="w-full"> <thead class="border-b border-[#2a2a2a] bg-[#0a0a0a]"> <tr> <th class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-[#a0a0a0] md:px-6">
Produto
</th> <th class="hidden px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-[#a0a0a0] md:table-cell">
Categoria
</th> <th class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-[#a0a0a0] md:px-6">
Preço
</th> <th class="hidden px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-[#a0a0a0] sm:table-cell">
Status
</th> <th class="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-[#a0a0a0] md:px-6">
Ações
</th> </tr> </thead> <tbody class="divide-y divide-[#2a2a2a]"> ${produtos.map((produto) => renderTemplate`<tr class="hover:bg-[#1a1a1a] transition"> <td class="px-4 py-4 md:px-6"> <div class="flex items-center gap-3"> ${produto.foto_principal && renderTemplate`<img${addAttribute(produto.foto_principal, "src")}${addAttribute(produto.nome, "alt")} class="h-10 w-10 flex-shrink-0 rounded-md object-cover">`} <div class="min-w-0"> <p class="text-sm font-medium text-white truncate">${produto.nome}</p> <p class="text-xs text-[#a0a0a0]">${produto.codigo}</p> </div> </div> </td> <td class="hidden px-6 py-4 md:table-cell"> <span class="text-sm text-white">${produto.categoria?.nome || "Sem categoria"}</span> </td> <td class="px-4 py-4 md:px-6"> <span class="text-sm font-medium text-white"> ${new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(produto.preco)} </span> </td> <td class="hidden px-6 py-4 sm:table-cell"> <span${addAttribute(`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${produto.ativo ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"}`, "class")}> ${produto.ativo ? "Ativo" : "Inativo"} </span> </td> <td class="px-4 py-4 md:px-6"> <div class="flex items-center justify-end gap-2"> <button class="rounded-lg bg-white/10 p-2 text-white transition hover:bg-white/20" data-action="edit"${addAttribute(JSON.stringify(produto), "data-produto")} title="Editar"> <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"> <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path> </svg> </button> <button class="rounded-lg bg-red-500/10 p-2 text-red-500 transition hover:bg-red-500/20" data-action="delete"${addAttribute(produto.id, "data-id")}${addAttribute(produto.nome, "data-nome")} title="Deletar"> <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"> <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path> </svg> </button> </div> </td> </tr>`)} </tbody> </table> </div>`} </div> </div>  ${renderComponent($$result2, "ProductFormDialog", $$ProductFormDialog, { "categorias": categorias || [] })} ` })} ${renderScript($$result, "/home/ceanbrjr/Dev/sriphone/src/pages/admin/produtos.astro?astro&type=script&index=0&lang.ts")}`;
}, "/home/ceanbrjr/Dev/sriphone/src/pages/admin/produtos.astro", void 0);

const $$file = "/home/ceanbrjr/Dev/sriphone/src/pages/admin/produtos.astro";
const $$url = "/admin/produtos";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Produtos,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
