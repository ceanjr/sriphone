#product-dialog.hidden,
#category-dialog.hidden,
#login-dialog.hidden {
  display: none !important;
}
```
O `!important` impede que JavaScript mude o estado

### 5. **Falta de Consistência nas Funções Globais**
- `LoginDialog` usa tanto `window.openLoginDialog` quanto `window.abrirModalLogin`
- `ProductFormDialog` e `CategoryFormDialog` não registram funções alternativas

---

## Prompt para Claude Code:
```
Corrija os problemas dos modais que não estão sendo exibidos corretamente:

**PROBLEMA 1: CSS Conflitante**
- Remova todo CSS inline que força `display: none !important` dos modais
- Remova os seletores CSS que usam `!important` para esconder modais
- Use apenas Tailwind classes para controlar visibilidade

**PROBLEMA 2: Estado Inicial Consistente**
- Remova o script inline que tenta adicionar classe `hidden` (linha ~158-170 do catalogo.astro)
- Os modais já têm `class="...hidden..."` no HTML, não precisa duplicar
- Mantenha apenas: `class="fixed inset-0 z-50 hidden items-center justify-center bg-black/50 backdrop-blur-sm"`

**PROBLEMA 3: Registro de Funções Globais**
Em cada componente de modal (ProductFormDialog.astro, CategoryFormDialog.astro, LoginDialog.astro):

1. Defina as funções IMEDIATAMENTE no início do script (não dentro de event listeners):
```typescript
// No topo do <script>, logo após imports
const dialog = document.getElementById('product-dialog'); // ou category/login

const openDialogFn = (data?: any) => {
  if (!dialog) return;
  
  // Preencher form se houver dados
  if (data) {
    // ... código de preenchimento ...
  }
  
  dialog.classList.remove('hidden');
  dialog.classList.add('flex');
};

// Registrar IMEDIATAMENTE
window.openProductDialog = openDialogFn; // ou openCategoryDialog/openLoginDialog
window.abrirFormProduto = openDialogFn; // ou abrirGerirCategorias/abrirModalLogin

console.log('✅ [NomeDoModal] carregado');
```

2. Para fechar modal:
```typescript
const closeDialog = () => {
  dialog?.classList.add('hidden');
  dialog?.classList.remove('flex');
  form?.reset();
};
```

**PROBLEMA 4: Simplificar catalogo.astro**
Remova COMPLETAMENTE o bloco de scripts inline (linhas ~150-195):
- Delete o `<style is:inline>` que força modais ocultos
- Delete o primeiro `<script is:inline>` que adiciona classe hidden
- Delete o segundo `<script is:inline>` com as funções globais placeholders

As funções globais serão definidas diretamente pelos componentes.

**PROBLEMA 5: TypeScript Declarations**
Em cada modal, adicione no final do script:
```typescript
declare global {
  interface Window {
    openProductDialog: (produto?: any) => void;
    abrirFormProduto: () => void;
    // ... outras funções específicas do modal
  }
}
```

**ARQUIVOS A MODIFICAR:**
1. `src/pages/catalogo.astro` - remover CSS e scripts inline conflitantes
2. `src/components/admin/ProductFormDialog.astro` - mover registro de funções para o topo
3. `src/components/admin/CategoryFormDialog.astro` - mover registro de funções para o topo
4. `src/components/admin/LoginDialog.astro` - já está correto, manter como referência

**TESTE:**
Após as correções, teste no console do browser:
```javascript
window.abrirFormProduto(); // Deve abrir ProductFormDialog
window.abrirGerirCategorias(); // Deve abrir CategoryFormDialog
window.abrirModalLogin(); // Deve abrir LoginDialog
```

Todos devem funcionar sem erros de "função não definida".