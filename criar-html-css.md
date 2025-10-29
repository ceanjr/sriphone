# Prompt: Implementar apenas o HTML dos modais (sem alterar scripts)

Implemente APENAS o HTML dos seguintes componentes de modal do projeto Astro:
- LoginDialog.astro
- ProductFormDialog.astro
- CategoryFormDialog.astro

## ⚙️ Regras principais
- NÃO modifique nem remova nenhum script, import, função, ou lógica existente dentro dos arquivos.
- NÃO altere a estrutura das props Astro (`export interface Props`, `Astro.props`, etc.).
- Apenas adicione a **marcação HTML** e **classes TailwindCSS** necessárias para estruturar os modais.
- Utilize os **padrões visuais do projeto**, conforme já aplicados em outros componentes (ex: botões, inputs, espaçamentos, cores, bordas e sombras).

## 🧩 Estrutura esperada de cada modal

### 1. LoginDialog.astro
- Modal centralizado com fundo semitransparente (overlay escuro com blur).
- Card de login com:
  - Título “Entrar no Painel”.
  - Campos de email e senha.
  - Botão primário “Entrar”.
  - Link secundário “Esqueci minha senha” (texto pequeno e discreto).
  - Fechamento via botão (ícone de “X” no canto superior direito).
- Responsivo: largura máxima ~400px, centralizado verticalmente.

### 2. ProductFormDialog.astro
- Modal grande (~max-w-2xl) com rolagem interna suave.
- Header com título dinâmico (“Adicionar Produto” ou “Editar Produto”) e botão “X”.
- Formulário com campos:
  - Nome do produto
  - Categoria (select)
  - Preço
  - Descrição
  - Upload de imagem (exibir preview se existir)
- Rodapé com botões:
  - “Cancelar” (outline / secundário)
  - “Salvar” (primário)
- Deve seguir o mesmo padrão de espaçamento e fonte do dashboard.

### 3. CategoryFormDialog.astro
- Modal médio (~max-w-md).
- Header com título (“Nova Categoria” ou “Editar Categoria”) e botão “X”.
- Campo único:
  - Nome da categoria (input)
- Rodapé com:
  - “Cancelar” (outline / secundário)
  - “Salvar” (primário)

## 🎨 Estilização (Tailwind padrão do projeto)
- Utilize as mesmas classes usadas nos outros formulários e botões do painel administrativo.
- Preferir:
  - `bg-zinc-900` / `bg-white` (modo escuro/claro, se aplicável)
  - `rounded-2xl`, `shadow-xl`, `p-6`, `gap-4`
  - Transições suaves (`transition-all`, `duration-200`)
  - Overlay: `fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50`
- Inputs com `border`, `rounded-md`, `focus:ring`, `focus:ring-offset-1`, `focus:ring-amber-500` (ou cor primária do tema)

## 🧱 Extras
- Preserve os nomes dos componentes e mantenha a indentação limpa.
- Cada modal deve estar semanticamente correto (`<form>`, `<header>`, `<footer>`, etc.).
- Não importar nada novo — apenas estruturar o HTML já previsto pelos scripts.
- Verifique se todas as props existentes são usadas no HTML (`{title}`, `{isOpen}`, `{onClose}`, etc.).

## ✅ Resultado esperado
- Cada modal deve estar funcional visualmente e semanticamente completo.
- Scripts originais continuam intactos.
- O Gemini deve gerar apenas o HTML e as classes Tailwind adequadas dentro dos arquivos.

Ao terminar, exibir uma prévia resumida de como ficou a hierarquia de cada modal (HTML outline).
