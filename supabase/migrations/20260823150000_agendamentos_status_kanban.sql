ALTER TABLE public.agendamentos
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'agendado'
  CHECK (status IN (
    'agendado',
    'compareceu_alugou',
    'compareceu_nao_alugou',
    'reagendada',
    'cancelada'
  ));

CREATE INDEX IF NOT EXISTS idx_agendamentos_status
  ON public.agendamentos (status);
