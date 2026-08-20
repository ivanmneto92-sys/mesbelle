-- Portal isolado de funcionários: colunas de autoria/propriedade para
-- permitir que um vendedor veja apenas os próprios leads/negócios/contratos.
ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS criado_por UUID REFERENCES auth.users(id) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS atendido_por UUID REFERENCES auth.users(id) DEFAULT NULL;

ALTER TABLE public.negocios
  ADD COLUMN IF NOT EXISTS vendedor_id UUID REFERENCES auth.users(id) DEFAULT NULL;

ALTER TABLE public.contratos
  ADD COLUMN IF NOT EXISTS vendedor_id UUID REFERENCES auth.users(id) DEFAULT NULL;

CREATE INDEX IF NOT EXISTS idx_leads_criado_por ON public.leads(criado_por);
CREATE INDEX IF NOT EXISTS idx_leads_atendido_por ON public.leads(atendido_por);
CREATE INDEX IF NOT EXISTS idx_negocios_vendedor_id ON public.negocios(vendedor_id);
CREATE INDEX IF NOT EXISTS idx_contratos_vendedor_id ON public.contratos(vendedor_id);
