-- Um telefone = um cadastro de cliente.
--
-- Antes, todo agendamento com cliente digitado à mão (sem escolher um lead
-- existente) criava um lead novo — a mesma cliente acabava com 2, 3, 5
-- cadastros (41 telefones repetidos em 192 leads em 19/11/2026). A cliente
-- pode ter quantos agendamentos quiser, mas o cadastro tem que ser único.
--
-- Esta migration:
--   1. cria normalizar_telefone() e a coluna gerada leads.telefone_normalizado;
--   2. faz backup (schema privado "backup", fora da API) e mescla os cadastros
--      duplicados existentes: vínculos (agendamentos, negócios, contratos,
--      financeiro, medidas) passam para o cadastro mantido, campos vazios são
--      completados com os dos duplicados e os outros nomes vão para as notas;
--   3. cria o índice único que impede novos duplicados;
--   4. faz criar_agendamento_com_lead reaproveitar o cadastro pelo telefone.

-- ── 1. Normalização ──────────────────────────────────────────────────────────
-- Só dígitos, sem zeros à esquerda, sem o 55 do Brasil e com o 9º dígito de
-- celular quando ele veio faltando (DDD + 8 dígitos começando em 6-9).
create or replace function public.normalizar_telefone(p_telefone text)
returns text
language plpgsql
immutable
set search_path = public
as $$
declare
  d text := regexp_replace(regexp_replace(coalesce(p_telefone, ''), '\D', '', 'g'), '^0+', '');
begin
  if length(d) in (12, 13) and d like '55%' then
    d := substr(d, 3);
  end if;
  if length(d) = 10 and substr(d, 3, 1) in ('6', '7', '8', '9') then
    d := substr(d, 1, 2) || '9' || substr(d, 3);
  end if;
  return d;
end;
$$;

alter table public.leads
  add column if not exists telefone_normalizado text
  generated always as (public.normalizar_telefone(telefone)) stored;

-- ── 2. Backup + mesclagem dos duplicados existentes ──────────────────────────
create schema if not exists backup;
revoke all on schema backup from public, anon, authenticated;

create table if not exists backup.leads_mesclagem (
  lead_id uuid not null,
  mantido_id uuid not null,
  papel text not null check (papel in ('removido', 'mantido_antes')),
  dados jsonb not null,
  mesclado_em timestamptz not null default now()
);
create table if not exists backup.medidas_mesclagem (
  lead_id uuid not null,
  mantido_id uuid not null,
  dados jsonb not null,
  mesclado_em timestamptz not null default now()
);

create temp table _merge_map on commit drop as
with ranked as (
  select l.id, l.telefone_normalizado as tel,
         row_number() over (
           partition by l.telefone_normalizado
           order by
             (exists (select 1 from public.negocios n where n.cliente_id = l.id)
               or exists (select 1 from public.contratos c where c.lead_id = l.id)) desc,
             ((l.email <> '')::int + (l.cpf <> '')::int + (l.endereco <> '')::int
               + (l.data_evento <> '')::int + (l.tipo_evento <> '')::int) desc,
             l.created_at asc
         ) as rn
  from public.leads l
  where l.telefone_normalizado <> ''
)
select r.id as lead_id, s.id as mantido_id
from ranked r
join ranked s on s.tel = r.tel and s.rn = 1
where r.rn > 1;

insert into backup.leads_mesclagem (lead_id, mantido_id, papel, dados)
select l.id, m.mantido_id, 'removido', to_jsonb(l)
from public.leads l join _merge_map m on m.lead_id = l.id;

insert into backup.leads_mesclagem (lead_id, mantido_id, papel, dados)
select l.id, l.id, 'mantido_antes', to_jsonb(l)
from public.leads l
where l.id in (select distinct mantido_id from _merge_map);

-- Completa o cadastro mantido com o que só existia nos duplicados.
with grupo as (
  select m.mantido_id, l.*
  from _merge_map m join public.leads l on l.id = m.lead_id
),
ordem_status(status, rank) as (
  values ('no_show', 0), ('cancelada', 0), ('novo_lead', 1), ('em_atendimento', 2),
         ('agendado', 3), ('reagendada', 3), ('prova_agendada', 4),
         ('compareceu_nao_alugou', 5), ('compareceu_alugou', 6)
)
update public.leads s set
  nome = (
    select x.nome from (
      select s.nome as nome union all select g.nome from grupo g where g.mantido_id = s.id
    ) x order by length(trim(x.nome)) desc limit 1
  ),
  email = case when s.email <> '' then s.email else coalesce((select g.email from grupo g where g.mantido_id = s.id and g.email <> '' order by g.created_at desc limit 1), '') end,
  cpf = case when s.cpf <> '' then s.cpf else coalesce((select g.cpf from grupo g where g.mantido_id = s.id and g.cpf <> '' order by g.created_at desc limit 1), '') end,
  endereco = case when s.endereco <> '' then s.endereco else coalesce((select g.endereco from grupo g where g.mantido_id = s.id and g.endereco <> '' order by g.created_at desc limit 1), '') end,
  tipo_evento = case when s.tipo_evento <> '' then s.tipo_evento else coalesce((select g.tipo_evento from grupo g where g.mantido_id = s.id and g.tipo_evento <> '' order by g.created_at desc limit 1), '') end,
  data_evento = case when s.data_evento <> '' then s.data_evento else coalesce((select g.data_evento from grupo g where g.mantido_id = s.id and g.data_evento <> '' order by g.created_at desc limit 1), '') end,
  vendedor_responsavel = case when s.vendedor_responsavel <> '' then s.vendedor_responsavel else coalesce((select g.vendedor_responsavel from grupo g where g.mantido_id = s.id and g.vendedor_responsavel <> '' order by g.created_at desc limit 1), '') end,
  prova_data = coalesce(s.prova_data, (select g.prova_data from grupo g where g.mantido_id = s.id and g.prova_data is not null order by g.created_at desc limit 1)),
  prova_hora = coalesce(s.prova_hora, (select g.prova_hora from grupo g where g.mantido_id = s.id and g.prova_hora is not null order by g.created_at desc limit 1)),
  enviado_comercial = s.enviado_comercial or exists (select 1 from grupo g where g.mantido_id = s.id and g.enviado_comercial),
  status_funil = (
    select x.status_funil from (
      select s.status_funil union all select g.status_funil from grupo g where g.mantido_id = s.id
    ) x left join ordem_status o on o.status = x.status_funil
    order by coalesce(o.rank, 0) desc limit 1
  ),
  notas_internas = trim(both E'\n' from concat_ws(E'\n',
    nullif(s.notas_internas, ''),
    (select string_agg(distinct g.notas_internas, E'\n') from grupo g where g.mantido_id = s.id and g.notas_internas <> ''),
    'Cadastros mesclados em ' || to_char(now() at time zone 'America/Sao_Paulo', 'DD/MM/YYYY')
      || ' (mesmo telefone). Também cadastrada como: '
      || (select string_agg(distinct x.nome, ', ') from (
            select s.nome union all select g.nome from grupo g where g.mantido_id = s.id
          ) x)
  ))
where s.id in (select distinct mantido_id from _merge_map);

-- Repassa todos os vínculos para o cadastro mantido.
update public.agendamentos a set lead_id = m.mantido_id from _merge_map m where a.lead_id = m.lead_id;
update public.negocios n set cliente_id = m.mantido_id from _merge_map m where n.cliente_id = m.lead_id;
update public.contratos c set lead_id = m.mantido_id from _merge_map m where c.lead_id = m.lead_id;
update public.transacoes_financeiras t set lead_id = m.mantido_id from _merge_map m where t.lead_id = m.lead_id;

insert into backup.medidas_mesclagem (lead_id, mantido_id, dados)
select md.lead_id, m.mantido_id, to_jsonb(md)
from public.medidas md join _merge_map m on m.lead_id = md.lead_id;

update public.medidas md set lead_id = m.mantido_id
from _merge_map m
where md.lead_id = m.lead_id
  and not exists (select 1 from public.medidas x where x.lead_id = m.mantido_id)
  and md.lead_id = (select m2.lead_id from _merge_map m2 join public.medidas y on y.lead_id = m2.lead_id
                    where m2.mantido_id = m.mantido_id order by y.updated_at desc nulls last limit 1);

delete from public.leads where id in (select lead_id from _merge_map);

-- ── 3. Trava: um telefone, um cadastro ───────────────────────────────────────
create unique index if not exists leads_telefone_normalizado_unico
  on public.leads (telefone_normalizado)
  where telefone_normalizado <> '';

-- Procura o cadastro pelo telefone ignorando a RLS de leads (o vendedor só
-- enxerga os próprios leads, mas o cadastro da cliente é único na loja).
-- Devolve só o id, para quem tem papel no CRM.
create or replace function public.buscar_lead_por_telefone(p_telefone text)
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select l.id
  from public.leads l
  where public.can_write_crm(auth.uid())
    and public.normalizar_telefone(p_telefone) <> ''
    and l.telefone_normalizado = public.normalizar_telefone(p_telefone)
  limit 1
$$;

revoke all on function public.buscar_lead_por_telefone(text) from public, anon;
grant execute on function public.buscar_lead_por_telefone(text) to authenticated;

-- ── 4. Agendamento reaproveita o cadastro existente ──────────────────────────
create or replace function public.criar_agendamento_com_lead(
  p_tipo text,
  p_data_hora timestamptz,
  p_duracao_minutos integer,
  p_cliente_nome text,
  p_cliente_email text,
  p_cliente_telefone text,
  p_negocio_id uuid,
  p_lead_id uuid,
  p_reserva_id uuid,
  p_vestido_id uuid,
  p_funcionaria_id uuid,
  p_observacoes text
)
returns public.agendamentos
language plpgsql
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_lead_id uuid := p_lead_id;
  v_agendamento public.agendamentos;
begin
  if v_lead_id is null then
    v_lead_id := public.buscar_lead_por_telefone(p_cliente_telefone);

    if v_lead_id is not null then
      -- Cadastro já existe: só completa o e-mail se ele ainda estiver vazio.
      if coalesce(trim(p_cliente_email), '') <> '' then
        update public.leads set email = trim(p_cliente_email)
        where id = v_lead_id and coalesce(email, '') = '';
      end if;
    else
      begin
        insert into public.leads (nome, telefone, email, status_funil, criado_por, atendido_por)
        values (p_cliente_nome, coalesce(p_cliente_telefone, ''), coalesce(p_cliente_email, ''), 'agendado', v_uid, v_uid)
        returning id into v_lead_id;
      exception when unique_violation then
        -- Outra pessoa cadastrou o mesmo telefone ao mesmo tempo.
        v_lead_id := public.buscar_lead_por_telefone(p_cliente_telefone);
      end;
    end if;
  end if;

  insert into public.agendamentos (
    tipo, data_hora, duracao_minutos, cliente_nome, cliente_email, cliente_telefone,
    negocio_id, lead_id, reserva_id, vestido_id, funcionaria_id, observacoes, criado_por
  ) values (
    p_tipo, p_data_hora, p_duracao_minutos, p_cliente_nome, p_cliente_email, p_cliente_telefone,
    p_negocio_id, v_lead_id, p_reserva_id, p_vestido_id, p_funcionaria_id, p_observacoes, v_uid
  )
  returning * into v_agendamento;

  return v_agendamento;
end;
$$;

revoke all on function public.criar_agendamento_com_lead(text, timestamptz, integer, text, text, text, uuid, uuid, uuid, uuid, uuid, text) from public, anon;
grant execute on function public.criar_agendamento_com_lead(text, timestamptz, integer, text, text, text, uuid, uuid, uuid, uuid, uuid, text) to authenticated;
