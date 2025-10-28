# ⚠️ Erro de RLS Detectado

Para fazer a migração funcionar, você precisa:

## Opção 1: Usar Service Role Key (Recomendado)

1. Acesse: https://xaotzsgpepwtixzkuslx.supabase.co/project/xaotzsgpepwtixzkuslx/settings/api
2. Copie a "service_role" key (não é a anon key!)
3. Adicione ao arquivo `.env`:
   ```
   SUPABASE_SERVICE_KEY=eyJhbGciOi...sua-service-key-aqui
   ```
4. Rode novamente: `npm run migrate:all`

## Opção 2: Desabilitar RLS Temporariamente (Mais Rápido)

1. Acesse: https://xaotzsgpepwtixzkuslx.supabase.co/project/xaotzsgpepwtixzkuslx/storage/policies
2. No bucket "imagens", desabilite todas as policies
3. Rode: `npm run migrate:all`
4. **IMPORTANTE**: Reabilite as policies depois!

## Opção 3: Adicionar Policy de INSERT

Execute este SQL no Supabase:

```sql
-- Permitir INSERT para anon role (temporário)
CREATE POLICY "Allow anon insert during migration"
ON storage.objects FOR INSERT
TO anon
WITH CHECK (bucket_id = 'imagens');
```

Depois da migração, delete essa policy.

---

**Escolha a Opção 2 para testar rápido (apenas 16 produtos)**
