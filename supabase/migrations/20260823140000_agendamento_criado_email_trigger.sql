-- Substitui o Database Webhook proposto no prompt: o schema
-- `supabase_functions` (usado pela função supabase_functions.http_request
-- que o botão "Create webhook" do Dashboard cria por baixo dos panos) não
-- existe neste projeto — só é provisionado em projetos que já usaram a
-- feature de Webhooks pelo menos uma vez pelo Dashboard. Em vez disso,
-- este trigger usa net.http_post diretamente (mesma extensão pg_net já
-- habilitada para o cron do relatório diário), buscando a URL do projeto e
-- a service role key no Vault (populado manualmente — ver PR #26).
create or replace function public.fn_notificar_agendamento_criado()
returns trigger as $$
begin
  perform net.http_post(
    url := (select decrypted_secret from vault.decrypted_secrets where name = 'SUPABASE_URL') || '/functions/v1/notificar-agendamento',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'SUPABASE_SERVICE_ROLE_KEY')
    ),
    body := to_jsonb(new)
  );
  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists trg_agendamento_criado_email on public.agendamentos;
create trigger trg_agendamento_criado_email
after insert on public.agendamentos
for each row execute function public.fn_notificar_agendamento_criado();
