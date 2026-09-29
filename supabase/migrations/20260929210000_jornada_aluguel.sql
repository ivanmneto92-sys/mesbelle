-- Pedido do usuário: mapa visual do Aluguel normal (peça já existe no
-- Acervo) — diferente da Jornada de Produção (que é só para o Primeiro
-- Aluguel, vestido feito do zero). Fica dentro da tela de Logística, como
-- mais uma aba, junto com "Primeiro Aluguel" (a Produção já existente).
--
-- Fluxo (uma jornada por reserva — o mesmo vestido pode ter várias reservas
-- ao longo do tempo, cada uma com sua própria linha do tempo):
--   1 - Envio à Costureira   (alvo: data_inicio - 14 dias, ou imediato se
--                             a reserva foi feita com menos de 14 dias)
--   2 - Ajustes              (conforme a pessoa que alugou)
--   3 - Pronto para a Loja
--   4 - Agendar Prova        → ponto de decisão:
--         deu certo  → Retirada (alvo: data_inicio, peça pronta 72h antes)
--         deu errado → reabre "Ajustes" (mesmo padrão do "Volta à
--                       Modelista" da Produção) → Pronto p/ Loja → Agendar
--                       Prova de novo → Retirada
--   5 - Retirada
--   6 - Devolução            (alvo: data_fim, conforme contrato)
--   7 - Envio à Lavanderia
--   8 - Na Lavanderia
--   9 - Disponível na Loja

create table public.jornada_aluguel (
  id uuid not null default gen_random_uuid() primary key,
  reserva_id uuid not null references public.reservas_agenda(id) on delete cascade,
  nome_etapa text not null,
  is_concluido boolean not null default false,
  ordem integer not null default 0,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists idx_jornada_aluguel_reserva on public.jornada_aluguel (reserva_id);

alter table public.jornada_aluguel enable row level security;

-- Leitura: admin + vendedor (mesma regra de negocios/reservas_agenda).
create policy "Jornada aluguel read crm" on public.jornada_aluguel
  for select to authenticated using (public.can_read_crm(auth.uid()));

-- Escrita: só admin — igual ao padrão já aplicado em producoes/etapas_producao.
create policy "Jornada aluguel insert admin" on public.jornada_aluguel
  for insert to authenticated with check (public.has_role(auth.uid(), 'admin'));
create policy "Jornada aluguel update admin" on public.jornada_aluguel
  for update to authenticated using (public.has_role(auth.uid(), 'admin'));
create policy "Jornada aluguel delete admin" on public.jornada_aluguel
  for delete to authenticated using (public.has_role(auth.uid(), 'admin'));

drop trigger if exists trg_jornada_aluguel_updated on public.jornada_aluguel;
create trigger trg_jornada_aluguel_updated
  before update on public.jornada_aluguel
  for each row execute function public.update_updated_at_column();

-- Cria as 9 etapas automaticamente quando uma reserva de Aluguel normal
-- (não Primeiro Aluguel) é criada — mesmo gatilho usado por
-- fn_negocio_primeiro_aluguel_gera_producao, mas na tabela de reservas.
create or replace function public.fn_reserva_aluguel_gera_jornada()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_tipo_negocio text;
begin
  if NEW.status_reserva = 'aluguel' and NEW.negocio_id is not null
     and not exists (select 1 from public.jornada_aluguel where reserva_id = NEW.id) then

    select tipo_negocio into v_tipo_negocio from public.negocios where id = NEW.negocio_id;

    if coalesce(v_tipo_negocio, 'aluguel') = 'aluguel' then
      insert into public.jornada_aluguel (reserva_id, nome_etapa, is_concluido, ordem)
      select NEW.id, e.nome, false, e.ordem
      from (values
        ('Envio à Costureira', 0), ('Ajustes', 1), ('Pronto para a Loja', 2),
        ('Agendar Prova', 3), ('Retirada', 4), ('Devolução', 5),
        ('Envio à Lavanderia', 6), ('Na Lavanderia', 7), ('Disponível na Loja', 8)
      ) as e(nome, ordem);
    end if;
  end if;
  return NEW;
end;
$$;
revoke execute on function public.fn_reserva_aluguel_gera_jornada() from public, anon, authenticated;

drop trigger if exists trg_reserva_aluguel_gera_jornada on public.reservas_agenda;
create trigger trg_reserva_aluguel_gera_jornada
  after insert on public.reservas_agenda
  for each row
  execute function public.fn_reserva_aluguel_gera_jornada();
