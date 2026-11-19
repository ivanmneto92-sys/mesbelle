-- Cadastro de clientes sem duplicidade.
--
-- Telefone já é único (20261119180000). Esta migration:
--   1. trava também e-mail e CPF (um e-mail / um CPF = um cadastro);
--   2. verificar_cliente_existente(): usada pelas telas enquanto a pessoa
--      digita, para avisar "esse telefone/e-mail/CPF já é da cliente X";
--   3. listar_possiveis_duplicados(): o que as travas não pegam — mesmo nome
--      (normalmente um dos cadastros sem telefone) e mesmo número com DDD
--      diferente. Fica para o admin revisar na aba "Duplicados" do CRM;
--   4. mesclar_leads(): junta dois cadastros escolhendo os dados de cada
--      campo, sem perder agendamentos, vendas, contratos ou medidas (com
--      backup no schema "backup");
--   5. leads_nao_duplicados: pares que o admin marcou como pessoas
--      diferentes (somem da lista).

-- ── Normalização ─────────────────────────────────────────────────────────────
create or replace function public.normalizar_email(p_email text)
returns text language sql immutable set search_path = public as $$
  select lower(trim(coalesce(p_email, '')))
$$;

create or replace function public.normalizar_cpf(p_cpf text)
returns text language sql immutable set search_path = public as $$
  select regexp_replace(coalesce(p_cpf, ''), '\D', '', 'g')
$$;

-- Sem acento, minúsculo, espaços simples: "Geovana  Magalhães" = "geovana magalhaes".
create or replace function public.normalizar_nome(p_nome text)
returns text language sql immutable set search_path = public as $$
  select lower(regexp_replace(
    translate(trim(coalesce(p_nome, '')),
      'ÁÀÂÃÄÉÈÊËÍÌÎÏÓÒÔÕÖÚÙÛÜÇÑáàâãäéèêëíìîïóòôõöúùûüçñ',
      'AAAAAEEEEIIIIOOOOOUUUUCNaaaaaeeeeiiiiooooouuuucn'),
    '\s+', ' ', 'g'))
$$;

alter table public.leads
  add column if not exists email_normalizado text generated always as (public.normalizar_email(email)) stored,
  add column if not exists cpf_normalizado text generated always as (public.normalizar_cpf(cpf)) stored;

create unique index if not exists leads_email_normalizado_unico
  on public.leads (email_normalizado) where email_normalizado <> '';
create unique index if not exists leads_cpf_normalizado_unico
  on public.leads (cpf_normalizado) where cpf_normalizado <> '';

-- ── Verificação enquanto digita ──────────────────────────────────────────────
-- SECURITY DEFINER porque a vendedora só enxerga os próprios leads, mas o
-- cadastro tem que ser único na loja inteira. Devolve só nome e o campo que
-- bateu; "visivel" diz se quem pergunta consegue abrir aquele cadastro.
-- "telefone_parecido" (mesmo número, DDD diferente) é só aviso, não trava.
create or replace function public.verificar_cliente_existente(
  p_telefone text, p_email text, p_cpf text, p_ignorar_id uuid default null
)
returns table(lead_id uuid, nome text, campo text, valor text, visivel boolean)
language sql
stable
security definer
set search_path = public
as $$
  with alvo as (
    select public.normalizar_telefone(p_telefone) as tel,
           public.normalizar_email(p_email) as email,
           public.normalizar_cpf(p_cpf) as cpf
  )
  select l.id, l.nome, c.campo, c.valor,
         (public.has_role(auth.uid(), 'admin')
           or l.criado_por = auth.uid() or l.atendido_por = auth.uid()
           or (l.criado_por is null and l.atendido_por is null)) as visivel
    from public.leads l
    cross join alvo a
    cross join lateral (values
      ('telefone', l.telefone, a.tel <> '' and l.telefone_normalizado = a.tel),
      ('email', l.email, a.email <> '' and l.email_normalizado = a.email),
      ('cpf', l.cpf, a.cpf <> '' and l.cpf_normalizado = a.cpf),
      ('telefone_parecido', l.telefone,
        length(a.tel) >= 10 and length(l.telefone_normalizado) >= 10
        and right(l.telefone_normalizado, 9) = right(a.tel, 9)
        and l.telefone_normalizado <> a.tel)
    ) as c(campo, valor, bate)
   where c.bate
     and public.can_write_crm(auth.uid())
     and (p_ignorar_id is null or l.id <> p_ignorar_id)
   order by case c.campo when 'telefone' then 0 when 'cpf' then 1 when 'email' then 2 else 3 end
   limit 10
$$;
revoke all on function public.verificar_cliente_existente(text, text, text, uuid) from public, anon;
grant execute on function public.verificar_cliente_existente(text, text, text, uuid) to authenticated;

-- ── Pares marcados como "não é duplicado" ────────────────────────────────────
create table if not exists public.leads_nao_duplicados (
  lead_a uuid not null references public.leads(id) on delete cascade,
  lead_b uuid not null references public.leads(id) on delete cascade,
  marcado_por uuid references auth.users(id) on delete set null default auth.uid(),
  marcado_em timestamptz not null default now(),
  primary key (lead_a, lead_b),
  check (lead_a < lead_b)
);
alter table public.leads_nao_duplicados enable row level security;
drop policy if exists "Nao duplicados admin" on public.leads_nao_duplicados;
create policy "Nao duplicados admin" on public.leads_nao_duplicados
  for all to authenticated
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

-- ── Possíveis duplicados (revisão do admin) ──────────────────────────────────
create or replace function public.listar_possiveis_duplicados()
returns table(lead_a uuid, lead_b uuid, motivo text)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not public.has_role(auth.uid(), 'admin') then
    raise exception 'Só admin' using errcode = '42501';
  end if;

  return query
  with base as (
    select l.id, public.normalizar_nome(l.nome) as nn, l.telefone_normalizado as tel
      from public.leads l
  ),
  pares as (
    select a.id as a_id, b.id as b_id, 'Mesmo nome'::text as motivo
      from base a join base b on a.nn = b.nn and a.id < b.id
     where length(a.nn) >= 3
    union all
    select a.id, b.id, 'Mesmo número com DDD diferente'
      from base a join base b
        on length(a.tel) >= 10 and length(b.tel) >= 10
       and right(a.tel, 9) = right(b.tel, 9) and a.tel <> b.tel and a.id < b.id
  )
  select p.a_id, p.b_id, string_agg(distinct p.motivo, ' · ')
    from pares p
   where not exists (
     select 1 from public.leads_nao_duplicados d where d.lead_a = p.a_id and d.lead_b = p.b_id
   )
   group by p.a_id, p.b_id;
end;
$$;
revoke all on function public.listar_possiveis_duplicados() from public, anon;
grant execute on function public.listar_possiveis_duplicados() to authenticated;

-- ── Mesclagem ────────────────────────────────────────────────────────────────
-- p_manter fica; p_remover é apagado depois de repassar todos os vínculos.
-- p_dados traz o valor escolhido para cada campo (só as chaves presentes são
-- aplicadas): nome, telefone, email, cpf, endereco, tipo_evento, data_evento,
-- vendedor_responsavel. Notas dos dois são juntadas.
create or replace function public.mesclar_leads(p_manter uuid, p_remover uuid, p_dados jsonb default '{}'::jsonb)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_m public.leads;
  v_r public.leads;
  v_rank_m int;
  v_rank_r int;
  v_status text;
begin
  if not public.has_role(auth.uid(), 'admin') then
    raise exception 'Só um admin pode mesclar cadastros' using errcode = '42501';
  end if;
  if p_manter = p_remover then
    raise exception 'Escolha dois cadastros diferentes';
  end if;

  select * into v_m from public.leads where id = p_manter for update;
  if not found then raise exception 'Cadastro a manter não encontrado'; end if;
  select * into v_r from public.leads where id = p_remover for update;
  if not found then raise exception 'Cadastro a remover não encontrado'; end if;

  if p_dados ? 'nome' and coalesce(trim(p_dados->>'nome'), '') = '' then
    raise exception 'O nome não pode ficar vazio';
  end if;

  insert into backup.leads_mesclagem (lead_id, mantido_id, papel, dados) values
    (v_r.id, v_m.id, 'removido', to_jsonb(v_r)),
    (v_m.id, v_m.id, 'mantido_antes', to_jsonb(v_m));

  -- Vínculos passam para o cadastro mantido.
  update public.agendamentos set lead_id = p_manter where lead_id = p_remover;
  update public.negocios set cliente_id = p_manter where cliente_id = p_remover;
  update public.contratos set lead_id = p_manter where lead_id = p_remover;
  update public.transacoes_financeiras set lead_id = p_manter where lead_id = p_remover;

  insert into backup.medidas_mesclagem (lead_id, mantido_id, dados)
  select md.lead_id, p_manter, to_jsonb(md) from public.medidas md where md.lead_id = p_remover;
  if not exists (select 1 from public.medidas where lead_id = p_manter) then
    update public.medidas set lead_id = p_manter where lead_id = p_remover;
  end if;

  -- Status do funil: fica o mais avançado dos dois.
  select coalesce(max(o.rank) filter (where o.status = v_m.status_funil), 0),
         coalesce(max(o.rank) filter (where o.status = v_r.status_funil), 0)
    into v_rank_m, v_rank_r
    from (values ('no_show', 0), ('cancelada', 0), ('novo_lead', 1), ('em_atendimento', 2),
                 ('agendado', 3), ('reagendada', 3), ('prova_agendada', 4),
                 ('compareceu_nao_alugou', 5), ('compareceu_alugou', 6)) as o(status, rank);
  v_status := case when v_rank_r > v_rank_m then v_r.status_funil else v_m.status_funil end;

  -- Apaga o duplicado antes de atualizar o mantido, para que o telefone /
  -- e-mail / CPF dele possam ir para o mantido sem bater no índice único.
  delete from public.leads where id = p_remover;

  update public.leads set
    nome = case when p_dados ? 'nome' then trim(p_dados->>'nome') else v_m.nome end,
    telefone = case when p_dados ? 'telefone' then coalesce(trim(p_dados->>'telefone'), '') else v_m.telefone end,
    email = case when p_dados ? 'email' then coalesce(trim(p_dados->>'email'), '') else v_m.email end,
    cpf = case when p_dados ? 'cpf' then coalesce(trim(p_dados->>'cpf'), '') else v_m.cpf end,
    endereco = case when p_dados ? 'endereco' then coalesce(p_dados->>'endereco', '') else v_m.endereco end,
    tipo_evento = case when p_dados ? 'tipo_evento' then coalesce(p_dados->>'tipo_evento', '') else v_m.tipo_evento end,
    data_evento = case when p_dados ? 'data_evento' then coalesce(p_dados->>'data_evento', '') else v_m.data_evento end,
    vendedor_responsavel = case when p_dados ? 'vendedor_responsavel' then coalesce(p_dados->>'vendedor_responsavel', '') else v_m.vendedor_responsavel end,
    prova_data = coalesce(v_m.prova_data, v_r.prova_data),
    prova_hora = coalesce(v_m.prova_hora, v_r.prova_hora),
    enviado_comercial = v_m.enviado_comercial or v_r.enviado_comercial,
    status_funil = v_status,
    criado_por = coalesce(v_m.criado_por, v_r.criado_por),
    atendido_por = coalesce(v_m.atendido_por, v_r.atendido_por),
    notas_internas = trim(both E'\n' from concat_ws(E'\n',
      nullif(v_m.notas_internas, ''),
      nullif(v_r.notas_internas, ''),
      'Mesclado em ' || to_char(now() at time zone 'America/Sao_Paulo', 'DD/MM/YYYY')
        || ' com o cadastro "' || v_r.nome || '"'
        || case when v_r.telefone <> '' then ' (' || v_r.telefone || ')' else '' end || '.'))
  where id = p_manter;

  return p_manter;
end;
$$;
revoke all on function public.mesclar_leads(uuid, uuid, jsonb) from public, anon;
grant execute on function public.mesclar_leads(uuid, uuid, jsonb) to authenticated;
