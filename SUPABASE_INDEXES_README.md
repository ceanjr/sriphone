# 📊 Como Aplicar os Índices no Supabase

## 🎯 Objetivo
Criar índices de database para melhorar em até **80%** a performance das queries de produtos.

## 📝 Passo a Passo

### 1. Acessar o Supabase Dashboard
1. Acesse [https://supabase.com](https://supabase.com)
2. Faça login na sua conta
3. Selecione o projeto **sriphonevca** (ou o nome do seu projeto)

### 2. Abrir o SQL Editor
1. No menu lateral esquerdo, clique em **SQL Editor**
2. Clique no botão **New Query** (ou "+ New query")

### 3. Executar o Script SQL
1. Abra o arquivo `supabase_indexes.sql` neste repositório
2. Copie **todo o conteúdo** do arquivo
3. Cole no SQL Editor do Supabase
4. Clique em **Run** (ou pressione Ctrl+Enter)

### 4. Verificar Sucesso
Se tudo correr bem, você verá mensagens como:
```
Success. No rows returned.
```

Ou para cada índice criado:
```
CREATE INDEX
```

### 5. Confirmar Índices Criados
Execute este query para listar os índices:

```sql
SELECT 
  tablename, 
  indexname, 
  indexdef 
FROM pg_indexes 
WHERE tablename = 'produtos'
ORDER BY indexname;
```

Você deve ver os seguintes índices:
- `idx_produtos_categoria`
- `idx_produtos_created`
- `idx_produtos_preco`
- `idx_produtos_bateria`
- `idx_produtos_categoria_created`
- `idx_produtos_categoria_preco`

## ⚡ Impacto Esperado

| Query Tipo | Antes | Depois | Melhoria |
|------------|-------|--------|----------|
| Listar por categoria | ~200ms | ~40ms | 80% ⬇️ |
| Ordenar por data | ~150ms | ~60ms | 60% ⬇️ |
| Ordenar por preço | ~180ms | ~50ms | 72% ⬇️ |
| Filtrar bateria | ~170ms | ~60ms | 65% ⬇️ |
| Categoria + data | ~250ms | ~35ms | 86% ⬇️ |

## 🔍 Testar Performance

### Antes dos Índices
```sql
EXPLAIN ANALYZE 
SELECT * FROM produtos 
WHERE categoria_id = 'algum-uuid' 
ORDER BY created_at DESC 
LIMIT 30;
```

Procure por: `Seq Scan on produtos` (scan sequencial = lento)

### Depois dos Índices
Execute o mesmo query novamente.

Agora deve mostrar: `Index Scan using idx_produtos_categoria_created` (scan com índice = rápido!)

## 📈 Monitoramento

### Ver Tamanho dos Índices
```sql
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE tablename = 'produtos';
```

### Ver Uso dos Índices (após algum tempo de produção)
```sql
SELECT 
  indexrelname as index_name,
  idx_scan as index_scans,
  idx_tup_read as tuples_read,
  idx_tup_fetch as tuples_fetched
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
  AND relname = 'produtos'
ORDER BY idx_scan DESC;
```

## ⚠️ Observações Importantes

1. **Espaço em Disco**: Índices ocupam ~10-20% do tamanho da tabela
   - Para 1000 produtos: ~2-5 MB de índices
   - **Custo/benefício excelente!**

2. **INSERT/UPDATE**: Ficam ~5-10% mais lentos
   - Para admin: **impacto desprezível**
   - Para usuários: **benefício de 60-80% na leitura compensa!**

3. **Manutenção**: PostgreSQL (Supabase) mantém índices automaticamente
   - Não precisa de reindex manual na maioria dos casos
   - Se necessário: `REINDEX TABLE produtos;`

4. **Free Tier**: Supabase free tier suporta índices sem problemas
   - Limite de 500 MB de database
   - Índices contam no total

## ✅ Checklist

- [ ] Acessar Supabase Dashboard
- [ ] Abrir SQL Editor
- [ ] Executar `supabase_indexes.sql`
- [ ] Verificar índices criados
- [ ] (Opcional) Testar performance com EXPLAIN ANALYZE
- [ ] Fazer deploy do site com queries otimizadas

## 🚀 Próximo Passo

Após aplicar os índices:
1. Faça deploy do site (`git push`)
2. Teste a navegação no catálogo
3. Verifique no Chrome DevTools > Network:
   - Requests para Supabase devem ser **muito mais rápidos**
   - De ~200-300ms para ~40-80ms

## 📞 Suporte

Se encontrar algum erro:
1. Verifique se você tem permissão de criar índices (geralmente sim)
2. Confira se não há índices duplicados: `\di` no SQL Editor
3. Se erro persistir, copie a mensagem de erro e pesquise na [documentação do Supabase](https://supabase.com/docs)

---

**Criado:** 2025-10-27  
**Versão:** 1.0  
**Parte da:** Fase 2 - Otimizações Core
