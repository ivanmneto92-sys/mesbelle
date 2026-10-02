-- data_criacao usava CURRENT_DATE, calculado no fuso do servidor (UTC,
-- confirmado via current_setting('TimeZone')). Entre ~21h e 23h59 no horário
-- de Brasília (UTC-3) já é "amanhã" em UTC — um contrato criado nesse
-- intervalo recebia data_criacao de amanhã e sumia da lista de Contratos,
-- cujo filtro de período (ContratosTab) compara contra a data local do
-- navegador. Troca o default para calcular a data já no fuso da loja.
alter table public.contratos
  alter column data_criacao set default ((now() at time zone 'America/Sao_Paulo')::date);
