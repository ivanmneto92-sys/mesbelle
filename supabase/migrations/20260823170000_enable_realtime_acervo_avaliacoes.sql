-- Continuação da migração 20260823160000: vestidos, reservas_agenda,
-- producoes e etapas_producao (Acervo/Produção) e avaliacoes_clientes
-- (Equipe) também ganharam subscriptions realtime no front-end, mas ainda
-- não estavam na publicação supabase_realtime.
ALTER PUBLICATION supabase_realtime ADD TABLE public.vestidos;
ALTER PUBLICATION supabase_realtime ADD TABLE public.reservas_agenda;
ALTER PUBLICATION supabase_realtime ADD TABLE public.producoes;
ALTER PUBLICATION supabase_realtime ADD TABLE public.etapas_producao;
ALTER PUBLICATION supabase_realtime ADD TABLE public.avaliacoes_clientes;
