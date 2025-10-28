# Prompt para Copilot CLI - Simplificação e Correção das Operações CRUD

Analise o projeto Astro + Supabase e simplifique completamente a forma como produtos e categorias são criados, editados e deletados.

## 🎯 Objetivo
Reduzir complexidade e corrigir os bugs que começaram a ocorrer quando a API foi integrada:
- Erro: "Unexpected end of JSON input"
- Erro: "Unexpected token 'C', 'Conflict'... is not valid JSON"
- Erro HTTP 409 (Conflict)
- Operações que aparentam sucesso mas não persistem após reload

## 🧩 Tarefas
1. **Analisar os endpoints atuais** da API (`/api/admin/produtos` e `/api/admin/categorias`):
   - Verifique se o backend retorna `JSON válido` em todas as respostas (inclusive em erros).
   - Corrija respostas vazias (`res.json()` sem body).
   - Garanta status HTTP adequados:  
     - `201` para criação  
     - `200` para edição  
     - `204` para exclusão (sem corpo)  
     - `409` apenas com objeto JSON claro `{ error: "Conflict" }`
   - Certifique-se de que `Content-Type` está sempre sendo definido como `application/json`.

2. **Simplificar os métodos do front (requests.js ou services/api.js)**:
   - Criar uma função genérica `apiRequest(endpoint, method, data)` que:
     - Usa `fetch` com tratamento automático de erro JSON.
     - Faz parse seguro de `response.json()` apenas se houver corpo.
     - Retorna `{ success: boolean, data?: any, error?: string }`.

3. **Refatorar as operações**:
   - `criarCategoria(nome)`  
   - `editarCategoria(id, novosDados)`  
   - `deletarCategoria(id)`  
   - `criarProduto(dados)`  
   - `editarProduto(id, dados)`  
   - `deletarProduto(id)`
   - Todas devem usar a função `apiRequest()` centralizada.

4. **Verificações adicionais**
   - Certifique-se de que `try/catch` esteja presente em cada operação.
   - Ao detectar erro no servidor, mostre alertas claros no console e UI.
   - Valide dados antes de enviar (ex: nome vazio, produto sem categoria, etc.).
   - Verifique se o Supabase está com permissões RLS adequadas e chaves corretas.

5. **Resultado esperado**
   - Nenhum erro JSON.
   - Nenhum conflito ao criar itens com nomes repetidos (retornar aviso legível).
   - Criação, edição e exclusão funcionam em tempo real e persistem após reload.
   - Código mais curto, legível e confiável.

## ⚙️ Extras
- Analise se o Service Worker ou cache podem estar interferindo nos requests.
- Sugira melhorias de UX (feedback visual ao criar/editar/deletar).
- No final, gere um **relatório .md** com as alterações realizadas e justificativas técnicas.
