-- Corrigir RLS da tabela funcionarios: UPDATE e INSERT somente admin
DROP POLICY IF EXISTS "Funcionarios update crm" ON public.funcionarios;
DROP POLICY IF EXISTS "Funcionarios write crm" ON public.funcionarios;

CREATE POLICY "Funcionarios update admin"
  ON public.funcionarios
  FOR UPDATE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Funcionarios write admin"
  ON public.funcionarios
  FOR INSERT
  TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Corrigir RLS da tabela permissoes_config: SELECT somente admin
DROP POLICY IF EXISTS "Permissoes read auth" ON public.permissoes_config;

CREATE POLICY "Permissoes read admin"
  ON public.permissoes_config
  FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));