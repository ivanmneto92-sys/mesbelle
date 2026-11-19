-- Rotina de hora em hora das vendas aguardando assinatura (Edge Function
-- pre-vendas-rotina): expira as pré-vendas sem assinatura há 48h e manda o
-- lembrete de 24h para a cliente. Minuto 7 para não coincidir com outros jobs.
--
-- Também reagenda o relatório diário com timeout de 30s: com o padrão de 5s
-- do pg_net, o job registrava "Timeout" todo dia, embora a função terminasse
-- normalmente (~8s) — alarme falso no histórico.
select cron.schedule(
  'pre-vendas-rotina-hora',
  '7 * * * *',
  $$
  select net.http_post(
    url     := (select decrypted_secret from vault.decrypted_secrets where name = 'SUPABASE_URL') || '/functions/v1/pre-vendas-rotina',
    headers := jsonb_build_object(
      'Content-Type',  'application/json',
      'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'SUPABASE_SERVICE_ROLE_KEY')
    ),
    body    := '{}'::jsonb,
    timeout_milliseconds := 30000
  )
  $$
);

select cron.schedule(
  'relatorio-diario-7h-brasilia',
  '0 10 * * *',
  $$
  select net.http_post(
    url     := (select decrypted_secret from vault.decrypted_secrets where name = 'SUPABASE_URL') || '/functions/v1/relatorio-diario',
    headers := jsonb_build_object(
      'Content-Type',  'application/json',
      'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'SUPABASE_SERVICE_ROLE_KEY')
    ),
    body    := '{}'::jsonb,
    timeout_milliseconds := 30000
  )
  $$
);
