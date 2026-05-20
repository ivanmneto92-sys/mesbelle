
-- Helper functions
CREATE OR REPLACE FUNCTION public.can_read_crm(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.has_role(_user_id, 'admin') OR public.has_role(_user_id, 'vendedor')
$$;

CREATE OR REPLACE FUNCTION public.can_read_socios(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.has_role(_user_id, 'admin') OR public.has_role(_user_id, 'socio')
$$;

CREATE OR REPLACE FUNCTION public.is_own_funcionario(_user_id uuid, _funcionario_email text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT _funcionario_email IS NOT NULL
     AND _funcionario_email = (SELECT email FROM auth.users WHERE id = _user_id)
$$;

-- CRM
DROP POLICY IF EXISTS "CRM read for authenticated" ON public.leads;
CREATE POLICY "Leads read crm" ON public.leads FOR SELECT TO authenticated USING (public.can_read_crm(auth.uid()));

DROP POLICY IF EXISTS "Medidas read for authenticated" ON public.medidas;
CREATE POLICY "Medidas read crm" ON public.medidas FOR SELECT TO authenticated USING (public.can_read_crm(auth.uid()));

DROP POLICY IF EXISTS "Contratos read for authenticated" ON public.contratos;
CREATE POLICY "Contratos read crm" ON public.contratos FOR SELECT TO authenticated USING (public.can_read_crm(auth.uid()));

DROP POLICY IF EXISTS "Negocios read for authenticated" ON public.negocios;
CREATE POLICY "Negocios read crm" ON public.negocios FOR SELECT TO authenticated USING (public.can_read_crm(auth.uid()));

-- Equipe
DROP POLICY IF EXISTS "Funcionarios read auth" ON public.funcionarios;
CREATE POLICY "Funcionarios read admin or self" ON public.funcionarios FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.is_own_funcionario(auth.uid(), email));

DROP POLICY IF EXISTS "Vendas read auth" ON public.vendas_funcionarios;
CREATE POLICY "Vendas read crm" ON public.vendas_funcionarios FOR SELECT TO authenticated USING (public.can_read_crm(auth.uid()));

DROP POLICY IF EXISTS "Avaliacoes read auth" ON public.avaliacoes_clientes;
CREATE POLICY "Avaliacoes read crm" ON public.avaliacoes_clientes FOR SELECT TO authenticated USING (public.can_read_crm(auth.uid()));

-- Acervo / Logística
DROP POLICY IF EXISTS "Vestidos read auth" ON public.vestidos;
CREATE POLICY "Vestidos read crm" ON public.vestidos FOR SELECT TO authenticated USING (public.can_read_crm(auth.uid()));

DROP POLICY IF EXISTS "Reservas read auth" ON public.reservas_agenda;
CREATE POLICY "Reservas read crm" ON public.reservas_agenda FOR SELECT TO authenticated USING (public.can_read_crm(auth.uid()));

DROP POLICY IF EXISTS "Producoes read auth" ON public.producoes;
CREATE POLICY "Producoes read crm" ON public.producoes FOR SELECT TO authenticated USING (public.can_read_crm(auth.uid()));

DROP POLICY IF EXISTS "Etapas read auth" ON public.etapas_producao;
CREATE POLICY "Etapas read crm" ON public.etapas_producao FOR SELECT TO authenticated USING (public.can_read_crm(auth.uid()));

DROP POLICY IF EXISTS "Alugueis read auth" ON public.alugueis_logistica;
CREATE POLICY "Alugueis read crm" ON public.alugueis_logistica FOR SELECT TO authenticated USING (public.can_read_crm(auth.uid()));

-- Financeiro
DROP POLICY IF EXISTS "Transacoes read auth" ON public.transacoes_financeiras;
CREATE POLICY "Transacoes read admin" ON public.transacoes_financeiras FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "ConfigFin read auth" ON public.config_financeiro;
CREATE POLICY "ConfigFin read admin" ON public.config_financeiro FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Sócios
DROP POLICY IF EXISTS "Ativos read auth" ON public.ativos_patrimonio;
CREATE POLICY "Ativos read socios" ON public.ativos_patrimonio FOR SELECT TO authenticated USING (public.can_read_socios(auth.uid()));

DROP POLICY IF EXISTS "Socios read auth" ON public.socios_empresa;
CREATE POLICY "Socios read socios" ON public.socios_empresa FOR SELECT TO authenticated USING (public.can_read_socios(auth.uid()));

DROP POLICY IF EXISTS "ConfigSoc read auth" ON public.config_socios;
CREATE POLICY "ConfigSoc read socios" ON public.config_socios FOR SELECT TO authenticated USING (public.can_read_socios(auth.uid()));
