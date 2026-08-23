ALTER TABLE public.agendamentos
  ADD COLUMN IF NOT EXISTS lead_id UUID REFERENCES public.leads(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_agendamentos_lead_id
  ON public.agendamentos (lead_id);
