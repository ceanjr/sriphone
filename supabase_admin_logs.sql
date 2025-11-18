-- =====================================================
-- TABELA DE LOGS ADMINISTRATIVOS
-- Armazena logs de ações administrativas por 48 horas
-- =====================================================

-- Criar tabela de logs
CREATE TABLE IF NOT EXISTS admin_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  action VARCHAR(50) NOT NULL, -- 'upload_image', 'remove_image', 'add_product', etc.
  entity_type VARCHAR(50), -- 'product', 'category', 'image'
  entity_id VARCHAR(255), -- ID do produto/categoria
  user_email VARCHAR(255), -- Email do usuário que fez a ação
  details JSONB, -- Detalhes adicionais (nome do arquivo, tamanho, erro, etc.)
  status VARCHAR(20) DEFAULT 'success', -- 'success', 'error'
  error_message TEXT, -- Mensagem de erro se houver
  ip_address VARCHAR(45), -- IP do usuário para debug
  user_agent TEXT -- User agent para debug de compatibilidade
);

-- Index para buscar logs recentes com performance
CREATE INDEX IF NOT EXISTS idx_admin_logs_created_at ON admin_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_logs_action ON admin_logs(action);
CREATE INDEX IF NOT EXISTS idx_admin_logs_status ON admin_logs(status);

-- Comentários para documentação
COMMENT ON TABLE admin_logs IS 'Logs de ações administrativas - mantidos por 48 horas';
COMMENT ON COLUMN admin_logs.action IS 'Tipo de ação: upload_image, remove_image, add_product, update_product, delete_product, add_category, update_category, delete_category';
COMMENT ON COLUMN admin_logs.status IS 'Status da operação: success ou error';
COMMENT ON COLUMN admin_logs.details IS 'Detalhes em JSON: { fileName, fileSize, mimeType, errorDetails, productName, etc }';

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

ALTER TABLE admin_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Admins podem ver todos os logs
DROP POLICY IF EXISTS "Admins podem ver todos os logs" ON admin_logs;
CREATE POLICY "Admins podem ver todos os logs"
  ON admin_logs
  FOR SELECT
  TO authenticated
  USING (
    auth.jwt() ->> 'email' IN (
      SELECT email FROM auth.users WHERE id = auth.uid()
    )
  );

-- Policy: Admins podem inserir logs
DROP POLICY IF EXISTS "Admins podem inserir logs" ON admin_logs;
CREATE POLICY "Admins podem inserir logs"
  ON admin_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- =====================================================
-- FUNÇÃO PARA LIMPAR LOGS ANTIGOS (> 48 horas)
-- =====================================================

-- Função para deletar logs com mais de 48 horas
CREATE OR REPLACE FUNCTION delete_old_admin_logs()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM admin_logs
  WHERE created_at < NOW() - INTERVAL '48 hours';
END;
$$;

-- Comentário na função
COMMENT ON FUNCTION delete_old_admin_logs() IS 'Deleta logs administrativos com mais de 48 horas';

-- =====================================================
-- NOTA: Para executar a limpeza automática, você pode:
-- 1. Usar Supabase Edge Functions com cron
-- 2. Executar manualmente: SELECT delete_old_admin_logs();
-- 3. Criar um trigger temporal (requer extensão pg_cron)
-- =====================================================
