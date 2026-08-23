-- A publicação supabase_realtime existia, mas nenhuma tabela jamais foi
-- adicionada a ela — toda subscription postgres_changes no app (inclusive
-- as já existentes no Dashboard) era um no-op silencioso, sem erro visível.
-- Isso fazia com que dados criados por um usuário (ex: um lead cadastrado
-- por uma funcionária) só aparecessem para quem já estava com a tela aberta
-- depois de um recarregamento manual da página.
ALTER PUBLICATION supabase_realtime ADD TABLE public.leads;
ALTER PUBLICATION supabase_realtime ADD TABLE public.medidas;
ALTER PUBLICATION supabase_realtime ADD TABLE public.contratos;
ALTER PUBLICATION supabase_realtime ADD TABLE public.negocios;
ALTER PUBLICATION supabase_realtime ADD TABLE public.alugueis_logistica;
ALTER PUBLICATION supabase_realtime ADD TABLE public.transacoes_financeiras;
ALTER PUBLICATION supabase_realtime ADD TABLE public.agendamentos;
