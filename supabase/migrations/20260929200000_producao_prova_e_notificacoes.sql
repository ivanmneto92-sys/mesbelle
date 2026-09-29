-- Pedido do usuário: (1) toda vez que uma etapa da Produção for clicada
-- (concluída ou reaberta), salvar a data do clique como prova; (2) mandar
-- e-mail pros admins + vendedora responsável nos pontos-chave do fluxo do
-- Primeiro Aluguel:
--   1   - Envio pra Costureira   → Modelista concluída (1ª vez)
--   2   - Agendar Prova          → Bordadeira concluída (1ª vez)
--   3.1 - Retirada                → Segunda Prova concluída (1ª vez)
--   3.2 - Ajuste novo             → "Volta à Modelista" (Modelista reaberta)
--   3.2.1 - Agendar Prova         → Bordadeira concluída (após ajuste)
--   3.2.2 - Retirada              → Segunda Prova concluída (após ajuste)

-- ===== 1) Data do clique como prova =====
alter table public.etapas_producao
  add column if not exists updated_at timestamptz not null default now();

drop trigger if exists trg_etapas_updated on public.etapas_producao;
create trigger trg_etapas_updated
  before update on public.etapas_producao
  for each row execute function public.update_updated_at_column();

-- ===== 2) Notificações por e-mail =====
-- Flag persistida na produção para distinguir a 1ª rodada (Envio pra
-- Costureira / Agendar Prova / Retirada) da rodada de ajuste
-- (3.2.1 / 3.2.2) — setada quando a Modelista é reaberta.
alter table public.producoes
  add column if not exists ajuste_solicitado boolean not null default false;

create or replace function public.fn_notificar_producao_etapa()
returns trigger as $$
begin
  if NEW.is_concluido is distinct from OLD.is_concluido then
    perform net.http_post(
      url := (select decrypted_secret from vault.decrypted_secrets where name = 'SUPABASE_URL') || '/functions/v1/notificar-producao',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'SUPABASE_SERVICE_ROLE_KEY')
      ),
      body := jsonb_build_object('record', to_jsonb(NEW), 'old_record', to_jsonb(OLD))
    );
  end if;
  return NEW;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists trg_etapas_notificar on public.etapas_producao;
create trigger trg_etapas_notificar
  after update of is_concluido on public.etapas_producao
  for each row execute function public.fn_notificar_producao_etapa();
