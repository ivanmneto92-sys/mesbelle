CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- O job em si é criado aqui, mas fica inerte até os secrets SUPABASE_URL e
-- SUPABASE_SERVICE_ROLE_KEY existirem no Vault (vault.create_secret) — não
-- podemos gravar a service role key num arquivo de migração versionado no
-- git, então essa etapa fica documentada como passo manual (ver PR).
SELECT cron.schedule(
  'relatorio-diario-7h-brasilia',
  '0 10 * * *', -- 10h UTC = 7h em America/Sao_Paulo
  $$
  SELECT net.http_post(
    url     := (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'SUPABASE_URL') || '/functions/v1/relatorio-diario',
    headers := jsonb_build_object(
      'Content-Type',  'application/json',
      'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'SUPABASE_SERVICE_ROLE_KEY')
    ),
    body    := '{}'::jsonb
  )
  $$
);
