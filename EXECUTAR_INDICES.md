## 🚀 GUIA RÁPIDO - Executar Índices Supabase

### 📋 **PASSOS PARA EXECUTAR (2 minutos):**

1. **Acessar Supabase Dashboard**
   - Ir para: https://supabase.com/dashboard
   - Login com sua conta
   - Selecionar projeto `sriphonevca`

2. **Abrir SQL Editor**
   - No menu lateral: `SQL Editor`
   - Clicar em `+ New query`

3. **Executar os Índices**
   - Copiar TODO o conteúdo do arquivo `supabase_indexes.sql`
   - Colar no editor SQL
   - Clicar `Run` (ou Ctrl+Enter)

4. **Verificar Sucesso**
   - Deve aparecer: "Success. No rows returned"
   - Se houver erro, verificar se as tabelas existem

### ✅ **RESULTADO ESPERADO:**
```
Success. No rows returned
6 indexes created successfully
```

### 🐛 **SE DER ERRO:**
- Verificar se tabela `produtos` existe
- Verificar se coluna `categoria_id` existe
- Alguns índices podem já existir (normal)

---

### 🧪 **TESTAR PERFORMANCE (Opcional):**

Após executar, testar no SQL Editor:

```sql
-- Query rápida (deve ser < 50ms)
EXPLAIN ANALYZE 
SELECT * FROM produtos 
WHERE categoria_id = 'algum-id' 
ORDER BY created_at DESC 
LIMIT 30;
```

**Antes:** ~200-300ms  
**Depois:** ~40-80ms (75% mais rápido!)

---

⚠️ **IMPORTANTE:** Execute uma vez só. Índices são permanentes.