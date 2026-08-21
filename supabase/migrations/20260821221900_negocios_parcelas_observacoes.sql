ALTER TABLE public.negocios
  ADD COLUMN IF NOT EXISTS parcelas integer NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS observacoes text;
