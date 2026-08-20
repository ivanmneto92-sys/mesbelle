-- Funcionário (vendedor) ganha acesso completo ao acervo: SELECT/INSERT/UPDATE
-- já eram liberados por can_write_crm() (admin OU vendedor); só faltava a
-- exclusão, que era restrita a admin. Substitui a policy (mesmo padrão já
-- usado no projeto: DROP + CREATE, nunca soma policies permissivas) para
-- alinhar com "Vestidos write crm" e permitir vendedor remover peças também.
DROP POLICY IF EXISTS "Vestidos delete admin" ON public.vestidos;
CREATE POLICY "Vestidos delete crm" ON public.vestidos
  FOR DELETE TO authenticated
  USING (public.can_write_crm(auth.uid()));
