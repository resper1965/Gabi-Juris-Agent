-- =============================================================================
-- SCHEMA DO SUPABASE PARA GABI GATEWAY
-- =============================================================================

-- =============================================================================
-- TABELA DE USUÁRIOS
-- =============================================================================

CREATE TABLE IF NOT EXISTS supabase_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin', 'moderator')),
  is_active BOOLEAN DEFAULT true,
  last_login TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================================================
-- TABELA DE SESSÕES
-- =============================================================================

CREATE TABLE IF NOT EXISTS supabase_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES supabase_users(id) ON DELETE CASCADE,
  token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  ip_address INET,
  user_agent TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================================================
-- TABELA DE CONEXÕES OAUTH
-- =============================================================================

CREATE TABLE IF NOT EXISTS supabase_oauth_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES supabase_users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL CHECK (provider IN ('google', 'microsoft')),
  provider_user_id TEXT NOT NULL,
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  expires_at TIMESTAMP WITH TIME ZONE,
  scope TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, provider)
);

-- =============================================================================
-- TABELA DE DOCUMENTOS AUTORIZADOS
-- =============================================================================

CREATE TABLE IF NOT EXISTS supabase_authorized_docs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES supabase_users(id) ON DELETE CASCADE,
  oauth_connection_id UUID REFERENCES supabase_oauth_connections(id) ON DELETE CASCADE,
  provider TEXT NOT NULL CHECK (provider IN ('google', 'microsoft')),
  doc_id TEXT NOT NULL,
  doc_name TEXT NOT NULL,
  doc_type TEXT,
  doc_url TEXT,
  doc_size BIGINT,
  last_modified TIMESTAMP WITH TIME ZONE,
  is_indexed BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, provider, doc_id)
);

-- =============================================================================
-- TABELA DE DOCUMENTOS INDEXADOS
-- =============================================================================

CREATE TABLE IF NOT EXISTS supabase_docs_indexed (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doc_id TEXT NOT NULL,
  origin TEXT NOT NULL CHECK (origin IN ('google', 'sharepoint', 'manual')),
  filename TEXT NOT NULL,
  lang TEXT NOT NULL DEFAULT 'pt',
  content_hash TEXT NOT NULL,
  last_modified TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_indexed TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  vector_id TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'indexed', 'error')),
  user_id UUID REFERENCES supabase_users(id) ON DELETE CASCADE,
  knowledge_bases TEXT[] DEFAULT ARRAY['default'],
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(doc_id, user_id)
);

-- =============================================================================
-- TABELA DE JOBS DE INDEXAÇÃO
-- =============================================================================

CREATE TABLE IF NOT EXISTS document_indexing_jobs (
  id TEXT PRIMARY KEY,
  document_id TEXT NOT NULL,
  user_id UUID REFERENCES supabase_users(id) ON DELETE CASCADE,
  origin TEXT NOT NULL CHECK (origin IN ('google', 'sharepoint', 'manual')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high')),
  metadata JSONB,
  error TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- =============================================================================
-- TABELA DE LOGS DE REINDEXAÇÃO
-- =============================================================================

CREATE TABLE IF NOT EXISTS reindex_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES supabase_users(id) ON DELETE CASCADE,
  document_id TEXT NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('reindex', 'update', 'delete')),
  origin TEXT NOT NULL CHECK (origin IN ('google', 'sharepoint', 'manual')),
  status TEXT NOT NULL CHECK (status IN ('success', 'error')),
  details JSONB,
  ip_address INET,
  user_agent TEXT,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================================================
-- TABELA DE POLÍTICAS DE PRIVACIDADE
-- =============================================================================

CREATE TABLE IF NOT EXISTS supabase_privacy_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  version TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  effective_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================================================
-- TABELA DE CONSENTIMENTOS
-- =============================================================================

CREATE TABLE IF NOT EXISTS supabase_consents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES supabase_users(id) ON DELETE CASCADE,
  policy_id UUID REFERENCES supabase_privacy_policies(id),
  consent_type TEXT NOT NULL CHECK (consent_type IN ('data_processing', 'third_party', 'marketing')),
  is_accepted BOOLEAN NOT NULL,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================================================
-- TABELA DE LOGS DO SISTEMA
-- =============================================================================

CREATE TABLE IF NOT EXISTS supabase_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  level TEXT NOT NULL CHECK (level IN ('debug', 'info', 'warn', 'error')),
  message TEXT NOT NULL,
  context JSONB,
  user_id UUID REFERENCES supabase_users(id) ON DELETE SET NULL,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================================================
-- ÍNDICES PARA PERFORMANCE
-- =============================================================================

-- Índices para usuários
CREATE INDEX IF NOT EXISTS idx_users_email ON supabase_users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON supabase_users(role);
CREATE INDEX IF NOT EXISTS idx_users_active ON supabase_users(is_active);

-- Índices para sessões
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON supabase_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_token ON supabase_sessions(token);
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON supabase_sessions(expires_at);

-- Índices para conexões OAuth
CREATE INDEX IF NOT EXISTS idx_oauth_user_id ON supabase_oauth_connections(user_id);
CREATE INDEX IF NOT EXISTS idx_oauth_provider ON supabase_oauth_connections(provider);
CREATE INDEX IF NOT EXISTS idx_oauth_active ON supabase_oauth_connections(is_active);

-- Índices para documentos autorizados
CREATE INDEX IF NOT EXISTS idx_auth_docs_user_id ON supabase_authorized_docs(user_id);
CREATE INDEX IF NOT EXISTS idx_auth_docs_provider ON supabase_authorized_docs(provider);
CREATE INDEX IF NOT EXISTS idx_auth_docs_indexed ON supabase_authorized_docs(is_indexed);

-- Índices para documentos indexados
CREATE INDEX IF NOT EXISTS idx_docs_indexed_user_id ON supabase_docs_indexed(user_id);
CREATE INDEX IF NOT EXISTS idx_docs_indexed_origin ON supabase_docs_indexed(origin);
CREATE INDEX IF NOT EXISTS idx_docs_indexed_status ON supabase_docs_indexed(status);
CREATE INDEX IF NOT EXISTS idx_docs_indexed_last_indexed ON supabase_docs_indexed(last_indexed);
CREATE INDEX IF NOT EXISTS idx_docs_indexed_content_hash ON supabase_docs_indexed(content_hash);

-- Índices para jobs de indexação
CREATE INDEX IF NOT EXISTS idx_indexing_jobs_user_id ON document_indexing_jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_indexing_jobs_status ON document_indexing_jobs(status);
CREATE INDEX IF NOT EXISTS idx_indexing_jobs_priority ON document_indexing_jobs(priority);
CREATE INDEX IF NOT EXISTS idx_indexing_jobs_created_at ON document_indexing_jobs(created_at);

-- Índices para logs de reindexação
CREATE INDEX IF NOT EXISTS idx_reindex_logs_user_id ON reindex_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_reindex_logs_document_id ON reindex_logs(document_id);
CREATE INDEX IF NOT EXISTS idx_reindex_logs_action ON reindex_logs(action);
CREATE INDEX IF NOT EXISTS idx_reindex_logs_timestamp ON reindex_logs(timestamp);

-- Índices para logs do sistema
CREATE INDEX IF NOT EXISTS idx_logs_level ON supabase_logs(level);
CREATE INDEX IF NOT EXISTS idx_logs_user_id ON supabase_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_logs_created_at ON supabase_logs(created_at);

-- =============================================================================
-- FUNÇÕES E TRIGGERS
-- =============================================================================

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para atualizar updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON supabase_users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_oauth_connections_updated_at BEFORE UPDATE ON supabase_oauth_connections
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_authorized_docs_updated_at BEFORE UPDATE ON supabase_authorized_docs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_docs_indexed_updated_at BEFORE UPDATE ON supabase_docs_indexed
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_indexing_jobs_updated_at BEFORE UPDATE ON document_indexing_jobs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- POLÍTICAS RLS (ROW LEVEL SECURITY)
-- =============================================================================

-- Habilitar RLS em todas as tabelas
ALTER TABLE supabase_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE supabase_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE supabase_oauth_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE supabase_authorized_docs ENABLE ROW LEVEL SECURITY;
ALTER TABLE supabase_docs_indexed ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_indexing_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE reindex_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE supabase_consents ENABLE ROW LEVEL SECURITY;
ALTER TABLE supabase_logs ENABLE ROW LEVEL SECURITY;

-- Políticas para usuários (apenas admins podem ver todos)
CREATE POLICY "Users can view own profile" ON supabase_users
  FOR SELECT USING (auth.uid() = id OR auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Users can update own profile" ON supabase_users
  FOR UPDATE USING (auth.uid() = id);

-- Políticas para sessões
CREATE POLICY "Users can view own sessions" ON supabase_sessions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own sessions" ON supabase_sessions
  FOR ALL USING (auth.uid() = user_id);

-- Políticas para conexões OAuth
CREATE POLICY "Users can view own OAuth connections" ON supabase_oauth_connections
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own OAuth connections" ON supabase_oauth_connections
  FOR ALL USING (auth.uid() = user_id);

-- Políticas para documentos autorizados
CREATE POLICY "Users can view own authorized docs" ON supabase_authorized_docs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own authorized docs" ON supabase_authorized_docs
  FOR ALL USING (auth.uid() = user_id);

-- Políticas para documentos indexados
CREATE POLICY "Users can view own indexed docs" ON supabase_docs_indexed
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own indexed docs" ON supabase_docs_indexed
  FOR ALL USING (auth.uid() = user_id);

-- Políticas para jobs de indexação
CREATE POLICY "Users can view own indexing jobs" ON document_indexing_jobs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own indexing jobs" ON document_indexing_jobs
  FOR ALL USING (auth.uid() = user_id);

-- Políticas para logs de reindexação
CREATE POLICY "Users can view own reindex logs" ON reindex_logs
  FOR SELECT USING (auth.uid() = user_id);

-- Políticas para consentimentos
CREATE POLICY "Users can view own consents" ON supabase_consents
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own consents" ON supabase_consents
  FOR ALL USING (auth.uid() = user_id);

-- Políticas para logs do sistema (apenas admins)
CREATE POLICY "Admins can view system logs" ON supabase_logs
  FOR SELECT USING (auth.jwt() ->> 'role' = 'admin');

-- =============================================================================
-- DADOS INICIAIS
-- =============================================================================

-- Inserir política de privacidade padrão
INSERT INTO supabase_privacy_policies (version, title, content, is_active) VALUES (
  '1.0',
  'Política de Privacidade - Gabi Gateway',
  'Esta política descreve como coletamos, usamos e protegemos suas informações pessoais...',
  true
) ON CONFLICT DO NOTHING;

-- Inserir usuário admin padrão (senha deve ser alterada)
INSERT INTO supabase_users (email, full_name, role) VALUES (
  'admin@gabi.com',
  'Administrador Gabi',
  'admin'
) ON CONFLICT (email) DO NOTHING; 