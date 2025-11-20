-- Tabela para rastrear visualizações do site (usuários não autenticados)
-- Execute este SQL no Supabase SQL Editor

CREATE TABLE IF NOT EXISTS site_views (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT NOT NULL,
  user_agent TEXT,
  ip_address TEXT,
  referer TEXT,
  page_url TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_site_views_session_id ON site_views(session_id);
CREATE INDEX IF NOT EXISTS idx_site_views_created_at ON site_views(created_at);
-- Nota: índice de mês não é necessário, o índice em created_at já otimiza queries com filtro de data

-- Comentários
COMMENT ON TABLE site_views IS 'Rastreia visualizações de usuários não autenticados';
COMMENT ON COLUMN site_views.session_id IS 'ID único da sessão do usuário (cookie/fingerprint)';
COMMENT ON COLUMN site_views.created_at IS 'Data e hora da visualização (UTC)';

-- Habilitar Row Level Security (RLS)
ALTER TABLE site_views ENABLE ROW LEVEL SECURITY;

-- Política: Permitir INSERT anônimo (para registrar visualizações)
CREATE POLICY "Permitir insert anônimo" ON site_views
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Política: Permitir SELECT apenas para usuários autenticados (admin)
CREATE POLICY "Permitir select para autenticados" ON site_views
  FOR SELECT
  TO authenticated
  USING (true);

-- Verificar se funcionou
SELECT
  'Tabela criada com sucesso!' as status,
  COUNT(*) as total_views
FROM site_views;
