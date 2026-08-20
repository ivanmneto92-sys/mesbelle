-- Portal isolado de funcionários: um vendedor só deve enxergar os
-- leads/negócios/contratos que ele mesmo criou/atende. As policies de
-- SELECT existentes ("Leads read crm", "Negocios read crm",
-- "Contratos read crm") liberavam leitura total para qualquer admin OU
-- vendedor via can_read_crm(); como policies do Postgres são combinadas
-- com OR, elas são substituídas aqui (DROP + CREATE com o mesmo nome) em
-- vez de receberem uma policy adicional, que não teria efeito nenhum.
--
-- Tolerância a NULL: registros sem dono (criado_por/atendido_por/vendedor_id
-- IS NULL — todo o histórico anterior a esta migração) continuam visíveis
-- a qualquer vendedor. Isolamento estrito se aplica apenas a partir de
-- agora, quando toda nova inserção passa a gravar o dono automaticamente.

DROP POLICY IF EXISTS "Leads read crm" ON public.leads;
CREATE POLICY "Leads read crm" ON public.leads
  FOR SELECT TO authenticated
  USING (
    has_role(auth.uid(), 'admin')
    OR (
      has_role(auth.uid(), 'vendedor') AND (
        criado_por = auth.uid()
        OR atendido_por = auth.uid()
        OR (criado_por IS NULL AND atendido_por IS NULL)
      )
    )
  );

DROP POLICY IF EXISTS "Negocios read crm" ON public.negocios;
CREATE POLICY "Negocios read crm" ON public.negocios
  FOR SELECT TO authenticated
  USING (
    has_role(auth.uid(), 'admin')
    OR (has_role(auth.uid(), 'vendedor') AND (vendedor_id = auth.uid() OR vendedor_id IS NULL))
  );

DROP POLICY IF EXISTS "Contratos read crm" ON public.contratos;
CREATE POLICY "Contratos read crm" ON public.contratos
  FOR SELECT TO authenticated
  USING (
    has_role(auth.uid(), 'admin')
    OR (has_role(auth.uid(), 'vendedor') AND (vendedor_id = auth.uid() OR vendedor_id IS NULL))
  );

-- Escrita: um vendedor só pode inserir leads em seu próprio nome
-- (criado_por = auth.uid()); admins seguem sem restrição.
DROP POLICY IF EXISTS "CRM write admins/vendedores" ON public.leads;
CREATE POLICY "CRM write admins/vendedores" ON public.leads
  FOR INSERT TO authenticated
  WITH CHECK (
    has_role(auth.uid(), 'admin')
    OR (has_role(auth.uid(), 'vendedor') AND criado_por = auth.uid())
  );
