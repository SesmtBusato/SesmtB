-- ==============================================================================
-- SCHEMA SUPABASE PARA O SISTEMA SESMT BUSATO
-- Projeto: olrtzxamixygmrftcczc
-- ==============================================================================

-- 1. TABELA DE EVENTOS / OCORRÊNCIAS
CREATE TABLE IF NOT EXISTS public.events (
  id TEXT PRIMARY KEY,
  item INTEGER UNIQUE NOT NULL,
  data TEXT NOT NULL,
  horario TEXT NOT NULL,
  dia_semana TEXT,
  descricao TEXT NOT NULL,
  local TEXT NOT NULL,
  area TEXT NOT NULL,
  equipamento TEXT,
  placa_tag TEXT,
  envolvido TEXT,
  letra_turno TEXT,
  estava_de_extra TEXT,
  encarregado TEXT,
  data_admissao TEXT,
  tempo_empresa TEXT,
  data_nascimento TEXT,
  idade TEXT,
  tipo_ocorrencia TEXT NOT NULL,
  reincidente TEXT,
  quando_ocorreu TEXT,
  descricao_dano TEXT,
  classificacao_real TEXT NOT NULL,
  classificacao_potencial TEXT NOT NULL,
  numero_cat TEXT,
  periodo_afastamento TEXT,
  prazo_analise TEXT,
  status TEXT NOT NULL DEFAULT 'Pendente',
  observacao TEXT,
  notificado_email BOOLEAN DEFAULT false,
  emails_notificados JSONB DEFAULT '[]'::jsonb,
  google_calendar_event_id TEXT,
  google_calendar_html_link TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. TABELA DE LOGS DE NOTIFICAÇÕES
CREATE TABLE IF NOT EXISTS public.notifications (
  id TEXT PRIMARY KEY,
  event_id TEXT REFERENCES public.events(id) ON DELETE SET NULL,
  item INTEGER,
  envolvido TEXT,
  encarregado TEXT,
  area TEXT,
  recipients JSONB DEFAULT '[]'::jsonb,
  subject TEXT NOT NULL,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  status TEXT DEFAULT 'Entregue',
  preview_text TEXT
);

-- 3. TABELA DE CONFIGURAÇÕES GERAIS
CREATE TABLE IF NOT EXISTS public.settings (
  id TEXT PRIMARY KEY DEFAULT 'app_settings',
  company_name TEXT DEFAULT 'BUSATO - Gestão e Monitoramento de Ocorrências',
  notification_emails JSONB DEFAULT '["alysonmish@gmail.com", "sesmt@busato.com.br", "operacoes@busato.com.br"]'::jsonb,
  auto_notify_on_create BOOLEAN DEFAULT true,
  google_calendar_enabled BOOLEAN DEFAULT true,
  public_form_enabled BOOLEAN DEFAULT true,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Inserir configuração padrão inicial
INSERT INTO public.settings (id, company_name, notification_emails, auto_notify_on_create, google_calendar_enabled, public_form_enabled)
VALUES (
  'app_settings',
  'BUSATO - Gestão e Monitoramento de Ocorrências',
  '["alysonmish@gmail.com", "sesmt@busato.com.br", "operacoes@busato.com.br"]'::jsonb,
  true,
  true,
  true
)
ON CONFLICT (id) DO NOTHING;

-- 4. POLÍTICAS DE ACESSO (RLS)
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- Liberar leitura e escrita com a chave da API (anon e service_role)
CREATE POLICY "Permitir leitura pública de events" ON public.events FOR SELECT USING (true);
CREATE POLICY "Permitir inserção de events" ON public.events FOR INSERT WITH CHECK (true);
CREATE POLICY "Permitir atualização de events" ON public.events FOR UPDATE USING (true);
CREATE POLICY "Permitir exclusão de events" ON public.events FOR DELETE USING (true);

CREATE POLICY "Permitir leitura de notifications" ON public.notifications FOR SELECT USING (true);
CREATE POLICY "Permitir inserção de notifications" ON public.notifications FOR INSERT WITH CHECK (true);

CREATE POLICY "Permitir leitura de settings" ON public.settings FOR SELECT USING (true);
CREATE POLICY "Permitir atualização de settings" ON public.settings FOR ALL USING (true);
