-- Tabela para guardar o vínculo entre registros do MesBelle e eventos do Google Calendar
CREATE TABLE IF NOT EXISTS public.google_calendar_events (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo          text NOT NULL,  -- 'prova' | 'saida' | 'retorno'
  referencia_id text NOT NULL,  -- lead.id ou alugueis_logistica.id
  google_event_id text NOT NULL,
  created_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tipo, referencia_id)
);

ALTER TABLE public.google_calendar_events ENABLE ROW LEVEL SECURITY;

-- Esta tabela só é acessada pela Edge Function google-calendar, que usa a
-- service_role key (bypassa RLS). Nenhuma policy é criada para anon/authenticated
-- de propósito: usuários normais não devem ler/escrever aqui diretamente.
