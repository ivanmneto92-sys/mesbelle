ALTER TABLE public.agendamentos ENABLE ROW LEVEL SECURITY;

-- Admin: acesso total. Reaproveita o helper has_role() já usado no resto do
-- schema em vez de repetir a subquery em user_roles.
CREATE POLICY "admin_agendamentos_all"
  ON public.agendamentos
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Funcionário (vendedor): lê todos os agendamentos, para ver o calendário
-- completo e saber quando um horário está ocupado.
CREATE POLICY "funcionario_agendamentos_select"
  ON public.agendamentos
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'vendedor'));

CREATE POLICY "funcionario_agendamentos_insert"
  ON public.agendamentos
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'vendedor')
    AND criado_por = auth.uid()
  );

CREATE POLICY "funcionario_agendamentos_update"
  ON public.agendamentos
  FOR UPDATE
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'vendedor')
    AND (funcionaria_id = auth.uid() OR criado_por = auth.uid())
  )
  WITH CHECK (public.has_role(auth.uid(), 'vendedor'));

CREATE POLICY "funcionario_agendamentos_delete"
  ON public.agendamentos
  FOR DELETE
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'vendedor')
    AND (funcionaria_id = auth.uid() OR criado_por = auth.uid())
  );
