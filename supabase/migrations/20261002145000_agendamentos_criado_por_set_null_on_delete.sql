-- O resto das colunas que referenciam uma vendedora (leads.criado_por/
-- atendido_por, negocios.vendedor_id, contratos.vendedor_id,
-- agendamentos.funcionaria_id) já viram ON DELETE SET NULL, mas
-- agendamentos.criado_por ficou de fora dessa migração anterior — ao
-- excluir uma funcionária que tivesse criado algum agendamento (hoje,
-- praticamente todas, já que cada "Novo agendamento" gera um lead), o
-- Postgres bloqueava a exclusão da conta por violação de FK.
ALTER TABLE public.agendamentos DROP CONSTRAINT agendamentos_criado_por_fkey;
ALTER TABLE public.agendamentos
  ADD CONSTRAINT agendamentos_criado_por_fkey
  FOREIGN KEY (criado_por) REFERENCES auth.users(id) ON DELETE SET NULL;
