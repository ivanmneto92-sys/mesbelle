
-- =========================
-- CRM TABLES
-- =========================

-- LEADS / CLIENTES
CREATE TABLE public.leads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  telefone TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  cpf TEXT NOT NULL DEFAULT '',
  endereco TEXT NOT NULL DEFAULT '',
  tipo_evento TEXT NOT NULL DEFAULT '',
  data_evento TEXT NOT NULL DEFAULT '',
  status_funil TEXT NOT NULL DEFAULT 'novo_lead',
  notas_internas TEXT NOT NULL DEFAULT '',
  vendedor_responsavel TEXT NOT NULL DEFAULT '',
  prova_data TEXT,
  prova_hora TEXT,
  enviado_comercial BOOLEAN NOT NULL DEFAULT false,
  criado_em DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- MEDIDAS
CREATE TABLE public.medidas (
  lead_id UUID NOT NULL PRIMARY KEY REFERENCES public.leads(id) ON DELETE CASCADE,
  busto TEXT NOT NULL DEFAULT '',
  cintura TEXT NOT NULL DEFAULT '',
  quadril TEXT NOT NULL DEFAULT '',
  altura TEXT NOT NULL DEFAULT '',
  salto TEXT,
  manequim TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- CONTRATOS
CREATE TABLE public.contratos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  numero TEXT NOT NULL,
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  negocio_id UUID,
  nome_cliente TEXT NOT NULL,
  cpf_cliente TEXT NOT NULL DEFAULT '',
  data_evento TEXT NOT NULL DEFAULT '',
  data_criacao DATE NOT NULL DEFAULT CURRENT_DATE,
  valor_total NUMERIC NOT NULL DEFAULT 0,
  status_assinatura TEXT NOT NULL DEFAULT 'pendente',
  termos_texto TEXT NOT NULL DEFAULT '',
  assinatura_base64 TEXT,
  data_assinatura TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- NEGOCIOS
CREATE TABLE public.negocios (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  cliente_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  cliente_nome TEXT NOT NULL,
  cliente_cpf TEXT NOT NULL DEFAULT '',
  vestido_nome TEXT,
  valor_negociado NUMERIC NOT NULL DEFAULT 0,
  desconto NUMERIC NOT NULL DEFAULT 0,
  metodo_pagamento TEXT NOT NULL DEFAULT '',
  status_negociacao TEXT NOT NULL DEFAULT 'aberto',
  data_evento TEXT NOT NULL DEFAULT '',
  criado_em DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =========================
-- INDEXES
-- =========================
CREATE INDEX idx_leads_status_funil ON public.leads(status_funil);
CREATE INDEX idx_contratos_lead_id ON public.contratos(lead_id);
CREATE INDEX idx_negocios_cliente_id ON public.negocios(cliente_id);
CREATE INDEX idx_negocios_status ON public.negocios(status_negociacao);

-- =========================
-- TRIGGERS for updated_at
-- =========================
CREATE TRIGGER trg_leads_updated_at BEFORE UPDATE ON public.leads
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_medidas_updated_at BEFORE UPDATE ON public.medidas
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_contratos_updated_at BEFORE UPDATE ON public.contratos
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_negocios_updated_at BEFORE UPDATE ON public.negocios
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================
-- RLS
-- =========================
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medidas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contratos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.negocios ENABLE ROW LEVEL SECURITY;

-- Helper: is admin OR vendedor (write-allowed roles)
CREATE OR REPLACE FUNCTION public.can_write_crm(_user_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT public.has_role(_user_id, 'admin') OR public.has_role(_user_id, 'vendedor')
$$;
REVOKE EXECUTE ON FUNCTION public.can_write_crm(uuid) FROM anon, authenticated, PUBLIC;

-- LEADS policies
CREATE POLICY "CRM read for authenticated" ON public.leads
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "CRM write admins/vendedores" ON public.leads
  FOR INSERT TO authenticated WITH CHECK (public.can_write_crm(auth.uid()));
CREATE POLICY "CRM update admins/vendedores" ON public.leads
  FOR UPDATE TO authenticated USING (public.can_write_crm(auth.uid()));
CREATE POLICY "CRM delete admins only" ON public.leads
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- MEDIDAS policies
CREATE POLICY "Medidas read for authenticated" ON public.medidas
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Medidas write admins/vendedores" ON public.medidas
  FOR INSERT TO authenticated WITH CHECK (public.can_write_crm(auth.uid()));
CREATE POLICY "Medidas update admins/vendedores" ON public.medidas
  FOR UPDATE TO authenticated USING (public.can_write_crm(auth.uid()));
CREATE POLICY "Medidas delete admins only" ON public.medidas
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- CONTRATOS policies
CREATE POLICY "Contratos read for authenticated" ON public.contratos
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Contratos write admins/vendedores" ON public.contratos
  FOR INSERT TO authenticated WITH CHECK (public.can_write_crm(auth.uid()));
CREATE POLICY "Contratos update admins/vendedores" ON public.contratos
  FOR UPDATE TO authenticated USING (public.can_write_crm(auth.uid()));
CREATE POLICY "Contratos delete admins only" ON public.contratos
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- NEGOCIOS policies
CREATE POLICY "Negocios read for authenticated" ON public.negocios
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Negocios write admins/vendedores" ON public.negocios
  FOR INSERT TO authenticated WITH CHECK (public.can_write_crm(auth.uid()));
CREATE POLICY "Negocios update admins/vendedores" ON public.negocios
  FOR UPDATE TO authenticated USING (public.can_write_crm(auth.uid()));
CREATE POLICY "Negocios delete admins only" ON public.negocios
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
