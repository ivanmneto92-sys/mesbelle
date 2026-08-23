-- Tabela nunca conectada ao frontend (nenhum hook/página lê ou escreve nela)
-- e sem nenhuma FK/função dependente. useEquipe.ts já calcula desempenho e
-- comissão dos vendedores diretamente de negocios.status_negociacao =
-- 'aprovado', tornando esta tabela redundante e órfã. Removendo para não
-- confundir futuras leituras do schema com uma fonte de dados morta.
drop table if exists public.vendas_funcionarios;
