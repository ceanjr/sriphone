-- ============================================
-- POLÍTICAS RLS PARA ADMIN
-- ============================================
-- Execute este SQL no Supabase SQL Editor
-- URL: https://supabase.com/dashboard/project/xaotzsgpepwtixzkuslx/sql

-- ============================================
-- 1. TABELA CATEGORIAS
-- ============================================

-- Remover políticas antigas (se existirem)
DROP POLICY IF EXISTS "Allow authenticated users to read categorias" ON categorias;
DROP POLICY IF EXISTS "Allow authenticated users to insert categorias" ON categorias;
DROP POLICY IF EXISTS "Allow authenticated users to update categorias" ON categorias;
DROP POLICY IF EXISTS "Allow authenticated users to delete categorias" ON categorias;

-- Habilitar RLS
ALTER TABLE categorias ENABLE ROW LEVEL SECURITY;

-- Políticas para usuários autenticados
CREATE POLICY "Allow authenticated users to read categorias"
ON categorias FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Allow authenticated users to insert categorias"
ON categorias FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update categorias"
ON categorias FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow authenticated users to delete categorias"
ON categorias FOR DELETE
TO authenticated
USING (true);

-- ============================================
-- 2. TABELA PRODUTOS
-- ============================================

-- Remover políticas antigas (se existirem)
DROP POLICY IF EXISTS "Allow authenticated users to read produtos" ON produtos;
DROP POLICY IF EXISTS "Allow authenticated users to insert produtos" ON produtos;
DROP POLICY IF EXISTS "Allow authenticated users to update produtos" ON produtos;
DROP POLICY IF EXISTS "Allow authenticated users to delete produtos" ON produtos;
DROP POLICY IF EXISTS "Allow public read access to produtos" ON produtos;

-- Habilitar RLS
ALTER TABLE produtos ENABLE ROW LEVEL SECURITY;

-- Leitura pública (catálogo)
CREATE POLICY "Allow public read access to produtos"
ON produtos FOR SELECT
TO anon, authenticated
USING (true);

-- Operações admin (apenas autenticados)
CREATE POLICY "Allow authenticated users to insert produtos"
ON produtos FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update produtos"
ON produtos FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow authenticated users to delete produtos"
ON produtos FOR DELETE
TO authenticated
USING (true);

-- ============================================
-- 3. STORAGE BUCKET "imagens"
-- ============================================

-- Remover políticas antigas (se existirem)
DROP POLICY IF EXISTS "Allow public read access to imagens" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated insert to imagens" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated update to imagens" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated delete to imagens" ON storage.objects;

-- Leitura pública
CREATE POLICY "Allow public read access to imagens"
ON storage.objects FOR SELECT
TO anon, authenticated
USING (bucket_id = 'imagens');

-- Upload (apenas autenticados)
CREATE POLICY "Allow authenticated insert to imagens"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'imagens');

-- Update (apenas autenticados)
CREATE POLICY "Allow authenticated update to imagens"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'imagens')
WITH CHECK (bucket_id = 'imagens');

-- Delete (apenas autenticados)
CREATE POLICY "Allow authenticated delete to imagens"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'imagens');

-- ============================================
-- VERIFICAÇÃO
-- ============================================

-- Verificar políticas criadas
SELECT schemaname, tablename, policyname, roles, cmd 
FROM pg_policies 
WHERE tablename IN ('categorias', 'produtos')
ORDER BY tablename, policyname;

-- Verificar políticas de storage (se disponível)
-- SELECT * FROM storage.policies WHERE bucket_id = 'imagens' ORDER BY name;
