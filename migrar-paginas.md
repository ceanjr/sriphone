Quero que você faça uma refatoração completa no meu projeto Astro + Supabase (catálogo Sr. iPhone), migrando todos os modais de administração para páginas dedicadas com o mesmo estilo visual do site.

---

### 🎯 Objetivo
Migrar completamente os modais atuais para páginas exclusivas (rotas próprias) e remover o código modal antigo.  
O layout e a estilização devem seguir o padrão geral do site (layout, header, footer, tipografia e cores).

---

### 🧩 Contexto
Atualmente, os modais estão definidos assim:

- `src/components/admin/LoginDialog.astro`
- `src/components/admin/ProductFormDialog.astro`
- `src/components/admin/CategoryFormDialog.astro`

Cada um possui um CSS separado:
- `src/styles/login-dialog.css`
- `src/styles/formulario-produto.css`
- `src/styles/gerir-categorias.css`

Eles são abertos via funções globais (`openLoginDialog`, `abrirFormProduto`, `abrirGerirCategorias`) e são injetados dentro de `catalogo.astro`.

Esses modais estão causando problemas de UX e complexidade desnecessária.  
Quero substituí-los por **páginas exclusivas** com URLs como:

- `/admin/login`
- `/admin/produtos/novo`
- `/admin/categorias`

---

### 🧱 Tarefas que você deve executar

1. **Criar novas páginas Astro:**
   - `src/pages/admin/login.astro`
   - `src/pages/admin/produtos/novo.astro`
   - `src/pages/admin/categorias.astro`

   Cada uma deve:
   - Usar o componente `Layout.astro` global.
   - Manter o mesmo visual e estrutura do site (header, footer, fontes, cores, espaçamento).
   - Ter um título claro (ex: “Entrar no Painel”, “Adicionar Produto”, “Gerir Categorias”).
   - Ter formulários funcionais (reaproveitar o conteúdo dos modais).
   - Ter redirecionamento e validações preservadas.

2. **Migrar a lógica dos modais:**
   - Mover todo o HTML e JS dos modais para as novas páginas.
   - Reaproveitar o mesmo comportamento de envio (`fetch` para `/api/admin/...`).
   - Remover tudo relacionado a `window.openLoginDialog`, `window.abrirFormProduto`, `window.abrirGerirCategorias`.

3. **Atualizar os botões de navegação:**
   - No `Header.astro` e em qualquer parte onde existam botões de admin, criar redirecionamentos via `<a href="/admin/login">` ou `window.location.href = '/admin/login'`.
   - Substituir o antigo botão que abria o modal por links para as novas páginas:
     - Botão **Admin** → `/admin/login`
     - Botão **Novo Produto** → `/admin/produtos/novo`
     - Botão **Gerir Categorias** → `/admin/categorias`

4. **Remover código obsoleto:**
   - Excluir os três arquivos `.astro` de modal e seus `.css` correspondentes.
   - Remover qualquer referência a esses componentes em `catalogo.astro`.
   - Limpar imports de `admin.css` se só serviam aos modais.
   - Remover funções globais (`openLoginDialog`, `abrirFormProduto`, etc.) e suas chamadas no JS.

5. **Ajustar o roteamento e navegação:**
   - Verifique se as novas páginas estão acessíveis diretamente (sem autenticação obrigatória para abrir).
   - Certifique-se de que os links/rotas funcionam tanto no desktop quanto no mobile.
   - Se houver Service Worker ativo, limpe o cache automaticamente (`window.clearAllCache?.()`).

6. **Padronizar o design:**
   - Utilize a mesma tipografia e esquema de cores dos outros componentes do site (`Inter`, `Halenoir`, etc.).
   - Adote os espaçamentos, bordas e sombras padronizados (seguindo os cards e formulários existentes).
   - O formulário deve ser centralizado verticalmente e responsivo.

7. **Testar funcionalidade:**
   - Verifique que:
     - `/admin/login` abre e autentica corretamente.
     - `/admin/produtos/novo` permite criar produto.
     - `/admin/categorias` permite criar/editar categorias.
     - Todos os botões de navegação levam à página correta.
     - Nenhum modal antigo é renderizado.

---

### ✅ Resultado esperado
Após a refatoração:
- Todos os modais foram removidos do código.
- Cada funcionalidade agora possui uma página exclusiva.
- Todos os botões de admin redirecionam corretamente para as novas rotas.
- O design permanece consistente com o restante do site.
- Nenhum erro de referência a `window.openLoginDialog` ou classes `.modal-*` deve existir.

No final, gere um pequeno relatório no console com:
- Quais arquivos foram criados.
- Quais componentes antigos foram removidos.
- E a confirmação de que todos os botões redirecionam corretamente para as novas páginas.

---

**Resumo prático:**
Transforme os modais (`LoginDialog`, `ProductFormDialog`, `CategoryFormDialog`) em **páginas exclusivas**,  
ajuste os botões para **redirecionarem via link**,  
remova o código antigo de modal completamente,  
e mantenha **o estilo e a experiência visual do site**.
