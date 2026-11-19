-- A venda só fecha com o contrato assinado.
--
-- Antes, "Confirmar aluguel" gravava o negócio já como "aprovado" e isso
-- disparava tudo na hora (financeiro, comissão, Produção, Logística, peça
-- alugada) — o contrato era um anexo que podia nunca ser assinado (em
-- 19/11/2026 nenhum contrato tinha sido assinado).
--
-- Fluxo novo:
--   Confirmar aluguel  → criar_pre_venda(): negócio "aguardando_assinatura",
--                        pré-reserva da peça por 48h e contrato com link.
--                        Nada vai para financeiro/comissão/Produção/Logística.
--   Cliente assina     → (no iPad: assinar_contrato_presencial; pelo link:
--                        assinar_contrato_publico) → trigger no contrato chama
--                        fechar_venda(), que numa única transação aprova o
--                        negócio (dispara financeiro/comissão/Produção),
--                        confirma a reserva (gera retirada/devolução e jornada),
--                        cria a entrega na Logística e marca a peça.
--   48h sem assinatura → expirar_pre_vendas() (cron de hora em hora) libera a
--                        peça e cancela o contrato.
--   Exceção            → aprovar_venda_sem_assinatura(): só admin, com motivo.
--
-- A trava que impede aprovar um negócio sem contrato assinado está na
-- migration seguinte (20261119190100), aplicada junto com as telas novas.

-- ── Negócios ─────────────────────────────────────────────────────────────────
alter table public.negocios
  add column if not exists aprovado_em timestamptz,
  add column if not exists reserva_expira_em timestamptz,
  add column if not exists aprovado_sem_assinatura_motivo text,
  add column if not exists aprovado_sem_assinatura_por uuid references auth.users(id) on delete set null;

-- Vendas já aprovadas: a data de fechamento é a de criação (regra antiga).
update public.negocios
   set aprovado_em = created_at
 where status_negociacao = 'aprovado' and aprovado_em is null;

alter table public.negocios drop constraint if exists negocios_status_negociacao_check;
alter table public.negocios add constraint negocios_status_negociacao_check
  check (status_negociacao in ('aberto', 'aguardando_assinatura', 'aprovado', 'cancelado', 'expirado'));

create index if not exists negocios_aguardando_assinatura_idx
  on public.negocios (reserva_expira_em)
  where status_negociacao = 'aguardando_assinatura';

-- Data em que a venda conta (financeiro e faixa de comissão): a assinatura.
create or replace function public.data_venda_negocio(p_aprovado_em timestamptz, p_criado_em date)
returns date
language sql
stable
set search_path = public
as $$
  select coalesce((p_aprovado_em at time zone 'America/Sao_Paulo')::date, p_criado_em, (now() at time zone 'America/Sao_Paulo')::date)
$$;

-- ── Contratos ────────────────────────────────────────────────────────────────
alter table public.contratos
  add column if not exists lembrete_enviado_em timestamptz;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'contratos_numero_key') then
    alter table public.contratos add constraint contratos_numero_key unique (numero);
  end if;
end $$;

-- Número sequencial por mês, contado sobre TODOS os contratos (antes era
-- contado no navegador e a RLS escondia os contratos de outras vendedoras,
-- o que podia repetir número).
create or replace function public.gerar_numero_contrato()
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_prefixo text := 'MB-' || to_char(now() at time zone 'America/Sao_Paulo', 'YYMM') || '-';
  v_seq int;
begin
  if auth.uid() is not null and not public.can_write_crm(auth.uid()) then
    raise exception 'Sem permissão' using errcode = '42501';
  end if;
  perform pg_advisory_xact_lock(hashtext('mesbelle_numero_contrato'));
  select coalesce(max(nullif(regexp_replace(substr(numero, length(v_prefixo) + 1), '\D', '', 'g'), '')::int), 0) + 1
    into v_seq
    from public.contratos
   where numero like v_prefixo || '%';
  return v_prefixo || lpad(v_seq::text, 3, '0');
end;
$$;
revoke all on function public.gerar_numero_contrato() from public, anon;
grant execute on function public.gerar_numero_contrato() to authenticated;

-- Regras do contrato:
--  * só vira "assinado" com a assinatura registrada (não dá mais para marcar
--    na mão);
--  * depois de assinado, termos/valor/assinatura não mudam (só admin);
--  * se termos ou valor mudarem antes da assinatura, o link antigo morre;
--  * contrato cancelado não tem link.
create or replace function public.fn_contratos_regras_assinatura()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if tg_op = 'UPDATE' and old.status_assinatura = 'assinado' then
    if new.status_assinatura is distinct from old.status_assinatura
       or new.assinatura_base64 is distinct from old.assinatura_base64
       or new.termos_texto is distinct from old.termos_texto
       or new.valor_total is distinct from old.valor_total then
      if not public.has_role(auth.uid(), 'admin') then
        raise exception 'Contrato já assinado não pode ser alterado';
      end if;
    end if;
  end if;

  if new.status_assinatura = 'assinado'
     and (tg_op = 'INSERT' or old.status_assinatura is distinct from 'assinado') then
    if new.assinatura_base64 is null or length(new.assinatura_base64) < 100 then
      raise exception 'O contrato só pode ser marcado como assinado com a assinatura da cliente';
    end if;
    new.data_assinatura := coalesce(new.data_assinatura, now());
  end if;

  if tg_op = 'UPDATE' and old.status_assinatura <> 'assinado'
     and (new.termos_texto is distinct from old.termos_texto or new.valor_total is distinct from old.valor_total) then
    new.signing_token := null;
    new.token_expires_at := null;
  end if;

  if new.status_assinatura = 'cancelado' then
    new.signing_token := null;
    new.token_expires_at := null;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_contratos_regras_assinatura on public.contratos;
create trigger trg_contratos_regras_assinatura
  before insert or update on public.contratos
  for each row execute function public.fn_contratos_regras_assinatura();

-- ── Reservas: pré-reserva ────────────────────────────────────────────────────
-- "pre_reserva" bloqueia a peça (a checagem de disponibilidade considera
-- qualquer reserva), mas não gera retirada/devolução nem jornada — isso só
-- acontece quando ela vira "aluguel", na assinatura.
create or replace function public.fn_criar_agendamentos_da_reserva()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_cliente_nome  text;
  v_cliente_email text;
  v_cliente_tel   text;
  v_lead_id       uuid;
begin
  if new.status_reserva = 'aluguel'
     and (tg_op = 'INSERT' or old.status_reserva is distinct from 'aluguel')
     and not exists (select 1 from public.agendamentos a where a.reserva_id = new.id) then
    select n.cliente_nome, coalesce(nullif(n.cliente_email, ''), l.email), coalesce(nullif(n.cliente_telefone, ''), l.telefone), n.cliente_id
      into v_cliente_nome, v_cliente_email, v_cliente_tel, v_lead_id
      from public.negocios n
      left join public.leads l on l.id = n.cliente_id
     where n.id = new.negocio_id
     limit 1;

    v_cliente_nome := coalesce(v_cliente_nome, 'Cliente');

    insert into public.agendamentos (
      tipo, data_hora, duracao_minutos, cliente_nome, cliente_email, cliente_telefone,
      negocio_id, reserva_id, vestido_id, lead_id, funcionaria_id, criado_por
    ) values (
      'retirada', (new.data_inicio::date + time '09:00:00') at time zone 'America/Sao_Paulo', 60,
      v_cliente_nome, v_cliente_email, v_cliente_tel,
      new.negocio_id, new.id, new.vestido_id, v_lead_id, null, null
    );

    insert into public.agendamentos (
      tipo, data_hora, duracao_minutos, cliente_nome, cliente_email, cliente_telefone,
      negocio_id, reserva_id, vestido_id, lead_id, funcionaria_id, criado_por
    ) values (
      'devolucao', (new.data_fim::date + time '18:00:00') at time zone 'America/Sao_Paulo', 60,
      v_cliente_nome, v_cliente_email, v_cliente_tel,
      new.negocio_id, new.id, new.vestido_id, v_lead_id, null, null
    );
  end if;
  return new;
end;
$$;

drop trigger if exists trg_reserva_cria_agendamentos on public.reservas_agenda;
create trigger trg_reserva_cria_agendamentos
  after insert or update of status_reserva on public.reservas_agenda
  for each row execute function public.fn_criar_agendamentos_da_reserva();

drop trigger if exists trg_reserva_aluguel_gera_jornada on public.reservas_agenda;
create trigger trg_reserva_aluguel_gera_jornada
  after insert or update of status_reserva on public.reservas_agenda
  for each row execute function public.fn_reserva_aluguel_gera_jornada();

-- ── Financeiro/comissão pela data da assinatura ──────────────────────────────
-- Mesma regra de antes; muda só a data: a venda (e a faixa de comissão do
-- mês) conta no dia em que foi fechada (aprovado_em), não no dia em que a
-- vendedora começou a montá-la.
create or replace function public.fn_negocio_aprovado_gera_transacao()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_valor_liquido numeric;
  v_config record;
  v_taxa_cartao_pct numeric;
  v_match text[];
  v_parcelas int;
  v_parcelas_lookup int;
  v_faturamento_mes_com_esta numeric;
  v_faturamento_mes_antes numeric;
  v_percentual_comissao numeric;
  v_comissao_esta_venda numeric;
  v_negocio_anterior record;
  v_ja_recebido numeric;
  v_devido_normal numeric;
  v_ajuste_individual numeric;
  v_vendedor_nome text;
  v_data_venda date;
begin
  if new.status_negociacao = 'aprovado'
     and (tg_op = 'INSERT' or old.status_negociacao is distinct from 'aprovado') then

    v_valor_liquido := greatest(new.valor_negociado - coalesce(new.desconto, 0), 0);
    v_data_venda := public.data_venda_negocio(new.aprovado_em, new.criado_em);

    insert into public.transacoes_financeiras (
      tipo, data, descricao, categoria, valor, status, tipo_custo, lead_id, negocio_id, observacoes
    ) values (
      'entrada',
      v_data_venda,
      'Venda - ' || new.cliente_nome || case when new.vestido_nome is not null and new.vestido_nome <> ''
                                              then ' (' || new.vestido_nome || ')' else '' end,
      'venda',
      v_valor_liquido,
      'pago',
      null,
      new.cliente_id,
      new.id,
      'Gerado automaticamente ao fechar a venda ' || new.id::text
    )
    on conflict (negocio_id, categoria) where negocio_id is not null and categoria <> 'ajuste_comissao' do nothing;

    if v_valor_liquido > 0 then
      select * into v_config from public.config_financeiro where id = 1;

      if new.metodo_pagamento is not null and new.metodo_pagamento ilike '%cart%' then
        if new.metodo_pagamento ilike '%débito%' or new.metodo_pagamento ilike '%debito%' then
          v_parcelas_lookup := 0;
        else
          v_match := regexp_match(new.metodo_pagamento, '(\d+)\s*[xX]');
          if v_match is not null then
            v_parcelas := v_match[1]::int;
          else
            v_parcelas := coalesce(new.parcelas, 1);
          end if;
          v_parcelas_lookup := least(v_parcelas, 18);
        end if;

        v_taxa_cartao_pct := null;
        if new.bandeira_cartao is not null then
          select taxa_percentual into v_taxa_cartao_pct
            from public.taxas_cartao
           where bandeira = new.bandeira_cartao and parcelas = v_parcelas_lookup;
        end if;

        if v_taxa_cartao_pct is null and v_config is not null then
          if v_parcelas_lookup = 0 then
            v_taxa_cartao_pct := v_config.debito;
          else
            v_taxa_cartao_pct := case when v_parcelas_lookup > 1 then v_config.credito_parcelado else v_config.credito_vista end;
          end if;
        end if;

        if v_taxa_cartao_pct is not null then
          insert into public.transacoes_financeiras (
            tipo, data, descricao, categoria, valor, status, tipo_custo, lead_id, negocio_id, observacoes
          ) values (
            'saida', v_data_venda,
            'Taxa de cartão - ' || new.cliente_nome,
            'taxa_cartao', round(v_valor_liquido * v_taxa_cartao_pct / 100, 2), 'pago', 'variavel',
            new.cliente_id, new.id,
            'Gerado automaticamente (' || v_taxa_cartao_pct || '% sobre ' || new.metodo_pagamento
              || case when new.bandeira_cartao is not null
                   then ' — ' || (case when new.bandeira_cartao = 'visa_master' then 'Visa/Master' else 'Elo' end)
                     || ' ' || case when v_parcelas_lookup = 0 then 'débito' else v_parcelas_lookup || 'x' end
                   else '' end
              || ')'
          )
          on conflict (negocio_id, categoria) where negocio_id is not null and categoria <> 'ajuste_comissao' do nothing;
        end if;
      end if;

      if new.vendedor_id is not null then
        select nome into v_vendedor_nome from public.profiles where user_id = new.vendedor_id;

        select coalesce(sum(greatest(n.valor_negociado - coalesce(n.desconto, 0), 0)), 0)
          into v_faturamento_mes_com_esta
          from public.negocios n
          where n.vendedor_id = new.vendedor_id
            and n.status_negociacao = 'aprovado'
            and date_trunc('month', public.data_venda_negocio(n.aprovado_em, n.criado_em)) = date_trunc('month', v_data_venda);

        v_faturamento_mes_antes := v_faturamento_mes_com_esta - v_valor_liquido;
        v_percentual_comissao := public.fn_faixa_comissao(v_faturamento_mes_com_esta);

        v_comissao_esta_venda := round(v_valor_liquido * v_percentual_comissao, 2);

        insert into public.transacoes_financeiras (
          tipo, data, descricao, categoria, valor, status, tipo_custo, lead_id, negocio_id, observacoes, vendedor_nome
        ) values (
          'saida', v_data_venda,
          'Comissão - ' || new.cliente_nome,
          'comissao', v_comissao_esta_venda, 'pago', 'variavel',
          new.cliente_id, new.id,
          'Gerado automaticamente (' || round(v_percentual_comissao * 100, 2) || '% — faixa por faturamento do mês: '
            || to_char(v_faturamento_mes_com_esta, 'FM999G999G990D00') || ')',
          v_vendedor_nome
        )
        on conflict (negocio_id, categoria) where negocio_id is not null and categoria <> 'ajuste_comissao' do nothing;

        for v_negocio_anterior in
          select n.id as negocio_id, n.cliente_id, n.cliente_nome,
                 greatest(n.valor_negociado - coalesce(n.desconto, 0), 0) as valor_liq
          from public.negocios n
          where n.vendedor_id = new.vendedor_id
            and n.status_negociacao = 'aprovado'
            and date_trunc('month', public.data_venda_negocio(n.aprovado_em, n.criado_em)) = date_trunc('month', v_data_venda)
            and n.id <> new.id
        loop
          select coalesce(sum(tf.valor), 0) into v_ja_recebido
            from public.transacoes_financeiras tf
            where tf.negocio_id = v_negocio_anterior.negocio_id
              and tf.categoria in ('comissao', 'ajuste_comissao');

          v_devido_normal := round(v_negocio_anterior.valor_liq * v_percentual_comissao, 2);
          v_ajuste_individual := v_devido_normal - v_ja_recebido;

          if v_ajuste_individual > 0.001 then
            insert into public.transacoes_financeiras (
              tipo, data, descricao, categoria, valor, status, tipo_custo, lead_id, negocio_id, observacoes, vendedor_nome
            ) values (
              'saida', v_data_venda,
              'Ajuste de comissão (mudança de faixa) - ' || v_negocio_anterior.cliente_nome,
              'ajuste_comissao', v_ajuste_individual, 'pago', 'variavel',
              v_negocio_anterior.cliente_id, v_negocio_anterior.negocio_id,
              'Gerado automaticamente: a venda de ' || new.cliente_nome
                || ' fez a faixa do mês subir para ' || round(v_percentual_comissao * 100, 2)
                || '% — reajuste desta venda (anterior) para o novo percentual',
              v_vendedor_nome
            );
          end if;
        end loop;

        if v_faturamento_mes_antes < 40000 and v_faturamento_mes_com_esta >= 40000 then
          insert into public.transacoes_financeiras (
            tipo, data, descricao, categoria, valor, status, tipo_custo, lead_id, negocio_id, observacoes, vendedor_nome
          ) values (
            'saida', v_data_venda,
            'Bônus de faturamento (R$40.000+ no mês) - ' || new.cliente_nome,
            'bonus_comissao', 1000, 'pago', 'variavel',
            new.cliente_id, new.id,
            'Gerado automaticamente ao cruzar R$40.000 de faturamento no mês',
            v_vendedor_nome
          )
          on conflict (negocio_id, categoria) where negocio_id is not null and categoria <> 'ajuste_comissao' do nothing;
        end if;
      end if;

      if v_config is not null and v_config.simples_nacional > 0 then
        insert into public.transacoes_financeiras (
          tipo, data, descricao, categoria, valor, status, tipo_custo, lead_id, negocio_id, observacoes
        ) values (
          'saida', v_data_venda,
          'Imposto (Simples Nacional) - ' || new.cliente_nome,
          'imposto', round(v_valor_liquido * v_config.simples_nacional / 100, 2), 'pago', 'variavel',
          new.cliente_id, new.id,
          'Gerado automaticamente (' || v_config.simples_nacional || '% sobre o valor líquido)'
        )
        on conflict (negocio_id, categoria) where negocio_id is not null and categoria <> 'ajuste_comissao' do nothing;
      end if;
    end if;
  end if;
  return new;
end;
$$;

-- ── Fechamento da venda ──────────────────────────────────────────────────────
create or replace function public.fechar_venda(p_negocio_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_n public.negocios;
begin
  select * into v_n from public.negocios where id = p_negocio_id for update;
  if not found then
    return;
  end if;
  if v_n.status_negociacao = 'aprovado' then
    return; -- já fechada (inclui vendas antigas, aprovadas antes desta regra)
  end if;
  if v_n.status_negociacao not in ('aguardando_assinatura', 'aberto') then
    raise exception 'Esta venda está "%" e não pode mais ser fechada. Gere uma nova venda.', v_n.status_negociacao;
  end if;

  -- 1. Aprova o negócio → triggers de financeiro/comissão e de Produção.
  update public.negocios
     set status_negociacao = 'aprovado', aprovado_em = now(), reserva_expira_em = null
   where id = p_negocio_id;

  -- 2. Pré-reserva vira reserva → triggers de retirada/devolução e jornada.
  update public.reservas_agenda
     set status_reserva = 'aluguel'
   where negocio_id = p_negocio_id and status_reserva = 'pre_reserva';

  -- 3. Peça do acervo marcada como alugada (no Primeiro Aluguel ela segue em
  --    produção até a Entrega Final).
  if coalesce(v_n.tipo_negocio, 'aluguel') <> 'primeiro_aluguel' then
    update public.vestidos set status = 'alugado'
     where id in (select vestido_id from public.reservas_agenda where negocio_id = p_negocio_id);
  end if;

  -- 4. Entrega na Logística, uma por peça.
  insert into public.alugueis_logistica (vestido_nome, cliente_nome, cliente_telefone, endereco_entrega, data_saida, data_retorno)
  select coalesce(v.nome, v_n.vestido_nome, 'Vestido'), v_n.cliente_nome,
         coalesce(nullif(v_n.cliente_telefone, ''), l.telefone, ''), coalesce(l.endereco, ''),
         r.data_inicio, r.data_fim
    from public.reservas_agenda r
    left join public.vestidos v on v.id = r.vestido_id
    left join public.leads l on l.id = v_n.cliente_id
   where r.negocio_id = p_negocio_id;

  -- 5. Cliente avança no funil.
  update public.leads
     set enviado_comercial = true, status_funil = 'compareceu_alugou'
   where id = v_n.cliente_id;
end;
$$;
revoke all on function public.fechar_venda(uuid) from public, anon, authenticated;

create or replace function public.fn_contrato_assinado_fecha_venda()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status_assinatura = 'assinado'
     and old.status_assinatura is distinct from 'assinado'
     and new.negocio_id is not null then
    perform public.fechar_venda(new.negocio_id);
  end if;
  return new;
end;
$$;
revoke all on function public.fn_contrato_assinado_fecha_venda() from public, anon, authenticated;

drop trigger if exists trg_contrato_assinado_fecha_venda on public.contratos;
create trigger trg_contrato_assinado_fecha_venda
  after update of status_assinatura on public.contratos
  for each row execute function public.fn_contrato_assinado_fecha_venda();

-- ── Pré-venda (Confirmar aluguel) ────────────────────────────────────────────
-- Tudo numa transação: se qualquer peça estiver indisponível, nada é gravado
-- (antes eram vários inserts no navegador, e o "desfazer" falhava em
-- silêncio para vendedoras, que não podem apagar negócios).
--
-- p_dados = {
--   lead_id, tipo_negocio: 'aluguel' | 'primeiro_aluguel', confirmar_duplicidade,
--   locataria: { nome, cpf, telefone, email },
--   pagamento: { metodo, parcelas, bandeira, observacoes },
--   negocios: [{ vestido_nome, valor_negociado, desconto, data_evento, vestido_id_novo,
--                valor_contrato, data_evento_contrato, termos_texto,
--                reservas: [{ vestido_id, vestido_nome, data_inicio, data_fim }] }]
-- }
create or replace function public.criar_pre_venda(p_dados jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_lead public.leads;
  v_tipo text := coalesce(nullif(p_dados->>'tipo_negocio', ''), 'aluguel');
  v_loc jsonb := coalesce(p_dados->'locataria', '{}'::jsonb);
  v_pag jsonb := coalesce(p_dados->'pagamento', '{}'::jsonb);
  v_expira timestamptz := now() + interval '48 hours';
  v_neg jsonb;
  v_res jsonb;
  v_negocio_id uuid;
  v_contrato_id uuid;
  v_token uuid;
  v_numero text;
  v_out jsonb := '[]'::jsonb;
  v_conflito text;
  v_email text;
begin
  if v_uid is null or not public.can_write_crm(v_uid) then
    raise exception 'Sem permissão para registrar vendas' using errcode = '42501';
  end if;

  select * into v_lead from public.leads where id = nullif(p_dados->>'lead_id', '')::uuid;
  if not found then
    raise exception 'Cliente não encontrada';
  end if;
  if v_tipo not in ('aluguel', 'primeiro_aluguel') then
    raise exception 'Tipo de venda inválido';
  end if;
  if coalesce(trim(v_loc->>'nome'), '') = '' or coalesce(trim(v_loc->>'cpf'), '') = '' then
    raise exception 'Nome e CPF da locatária são obrigatórios para o contrato';
  end if;
  if jsonb_array_length(coalesce(p_dados->'negocios', '[]'::jsonb)) = 0 then
    raise exception 'Nenhuma peça na venda';
  end if;

  -- Evita a mesma venda registrada duas vezes (já aconteceu em 02/10/2026).
  if not coalesce((p_dados->>'confirmar_duplicidade')::boolean, false) then
    select string_agg(distinct coalesce(nullif(n.vestido_nome, ''), 'venda') || ' — '
             || case n.status_negociacao when 'aprovado' then 'fechada' else 'aguardando assinatura' end, '; ')
      into v_conflito
      from public.negocios n
     where n.cliente_id = v_lead.id
       and n.status_negociacao in ('aguardando_assinatura', 'aprovado')
       and n.created_at > now() - interval '7 days';
    if v_conflito is not null then
      raise exception 'DUPLICIDADE: esta cliente já tem venda registrada nos últimos 7 dias (%).', v_conflito;
    end if;
  end if;

  v_email := coalesce(nullif(trim(v_loc->>'email'), ''), nullif(v_lead.email, ''), '');

  for v_neg in select * from jsonb_array_elements(p_dados->'negocios') loop
    if coalesce((v_neg->>'valor_contrato')::numeric, 0) <= 0 then
      raise exception 'Valor da venda inválido';
    end if;
    if coalesce(v_neg->>'termos_texto', '') = '' then
      raise exception 'Texto do contrato ausente';
    end if;

    insert into public.negocios (
      cliente_id, cliente_nome, cliente_cpf, cliente_telefone, cliente_email, vestido_nome,
      valor_negociado, desconto, metodo_pagamento, parcelas, bandeira_cartao, observacoes,
      status_negociacao, data_evento, vendedor_id, tipo_negocio, vestido_id_novo,
      descricao_primeiro_aluguel, reserva_expira_em
    ) values (
      v_lead.id, trim(v_loc->>'nome'), trim(v_loc->>'cpf'),
      nullif(trim(v_loc->>'telefone'), ''), nullif(trim(v_loc->>'email'), ''),
      nullif(v_neg->>'vestido_nome', ''),
      coalesce((v_neg->>'valor_negociado')::numeric, 0), coalesce((v_neg->>'desconto')::numeric, 0),
      coalesce(v_pag->>'metodo', ''), coalesce((v_pag->>'parcelas')::int, 1),
      nullif(v_pag->>'bandeira', ''), nullif(v_pag->>'observacoes', ''),
      'aguardando_assinatura', coalesce(v_neg->>'data_evento', ''), v_uid, v_tipo,
      nullif(v_neg->>'vestido_id_novo', '')::uuid, null, v_expira
    )
    returning id into v_negocio_id;

    for v_res in select * from jsonb_array_elements(coalesce(v_neg->'reservas', '[]'::jsonb)) loop
      if coalesce(v_res->>'data_inicio', '') = '' or coalesce(v_res->>'data_fim', '') = '' then
        raise exception 'Informe as datas de retirada e devolução de %', coalesce(v_res->>'vestido_nome', 'todas as peças');
      end if;
      perform pg_advisory_xact_lock(hashtext('mesbelle_reserva_' || (v_res->>'vestido_id')));
      if exists (
        select 1 from public.reservas_agenda r
         where r.vestido_id = (v_res->>'vestido_id')::uuid
           and r.data_inicio < (v_res->>'data_fim')::date
           and r.data_fim > (v_res->>'data_inicio')::date
      ) then
        raise exception 'A peça % já está reservada nesse período', coalesce(v_res->>'vestido_nome', '');
      end if;
      insert into public.reservas_agenda (vestido_id, data_inicio, data_fim, status_reserva, negocio_id)
      values ((v_res->>'vestido_id')::uuid, (v_res->>'data_inicio')::date, (v_res->>'data_fim')::date, 'pre_reserva', v_negocio_id);
    end loop;

    v_numero := public.gerar_numero_contrato();
    v_token := gen_random_uuid();
    insert into public.contratos (
      numero, lead_id, negocio_id, nome_cliente, cpf_cliente, email_cliente, data_evento,
      valor_total, status_assinatura, termos_texto, vendedor_id, signing_token, token_expires_at
    ) values (
      v_numero, v_lead.id, v_negocio_id, trim(v_loc->>'nome'), trim(v_loc->>'cpf'), v_email,
      coalesce(nullif(v_neg->>'data_evento_contrato', ''), v_neg->>'data_evento', ''),
      (v_neg->>'valor_contrato')::numeric, 'pendente', v_neg->>'termos_texto', v_uid, v_token, v_expira
    )
    returning id into v_contrato_id;

    v_out := v_out || jsonb_build_object(
      'negocio_id', v_negocio_id, 'contrato_id', v_contrato_id,
      'numero', v_numero, 'signing_token', v_token
    );
  end loop;

  return jsonb_build_object('expira_em', v_expira, 'vendas', v_out);
end;
$$;
revoke all on function public.criar_pre_venda(jsonb) from public, anon;
grant execute on function public.criar_pre_venda(jsonb) to authenticated;

-- ── Assinatura presencial (iPad na loja) ─────────────────────────────────────
create or replace function public.assinar_contrato_presencial(p_contrato_id uuid, p_assinatura text, p_user_agent text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_status text;
begin
  if auth.uid() is null or not public.can_write_crm(auth.uid()) then
    return jsonb_build_object('ok', false, 'error', 'sem_permissao');
  end if;

  select status_assinatura into v_status from public.contratos where id = p_contrato_id for update;
  if v_status is null then
    return jsonb_build_object('ok', false, 'error', 'nao_encontrado');
  end if;
  if v_status = 'assinado' then
    return jsonb_build_object('ok', false, 'error', 'ja_assinado');
  end if;
  if v_status = 'cancelado' then
    return jsonb_build_object('ok', false, 'error', 'cancelado');
  end if;
  if p_assinatura is null
     or length(p_assinatura) < 100
     or length(p_assinatura) > 2000000
     or p_assinatura !~ '^data:image/(png|jpeg|jpg|webp);base64,[A-Za-z0-9+/=]+$' then
    return jsonb_build_object('ok', false, 'error', 'assinatura_invalida');
  end if;

  update public.contratos
     set status_assinatura = 'assinado',
         assinatura_base64 = p_assinatura,
         data_assinatura = now(),
         ip_assinatura = left(coalesce(public._client_ip_from_request(), ''), 64),
         user_agent_assinatura = left(coalesce(current_setting('request.headers', true)::json->>'user-agent', p_user_agent, ''), 500)
   where id = p_contrato_id;

  return jsonb_build_object('ok', true, 'contrato_id', p_contrato_id);
end;
$$;
revoke all on function public.assinar_contrato_presencial(uuid, text, text) from public, anon;
grant execute on function public.assinar_contrato_presencial(uuid, text, text) to authenticated;

-- ── Cancelar / expirar pré-venda ─────────────────────────────────────────────
create or replace function public._encerrar_pre_venda(p_negocio_id uuid, p_status text, p_motivo text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_n public.negocios;
begin
  select * into v_n from public.negocios where id = p_negocio_id for update;
  if not found or v_n.status_negociacao <> 'aguardando_assinatura' then
    return;
  end if;

  update public.negocios
     set status_negociacao = p_status,
         reserva_expira_em = null,
         observacoes = trim(both E'\n' from concat_ws(E'\n', observacoes,
           '[' || to_char(now() at time zone 'America/Sao_Paulo', 'DD/MM/YYYY HH24:MI') || '] '
           || case p_status when 'expirado' then 'Expirada' else 'Cancelada' end
           || coalesce(': ' || nullif(trim(p_motivo), ''), '')))
   where id = p_negocio_id;

  delete from public.reservas_agenda where negocio_id = p_negocio_id and status_reserva = 'pre_reserva';

  update public.contratos set status_assinatura = 'cancelado'
   where negocio_id = p_negocio_id and status_assinatura = 'pendente';

  -- Primeiro Aluguel: a peça sob medida criada para esta venda não existe
  -- mais se a venda não fechou.
  if v_n.tipo_negocio = 'primeiro_aluguel' and v_n.vestido_id_novo is not null
     and not exists (select 1 from public.negocios n
                      where n.vestido_id_novo = v_n.vestido_id_novo and n.id <> p_negocio_id
                        and n.status_negociacao in ('aguardando_assinatura', 'aprovado'))
     and not exists (select 1 from public.producoes p where p.vestido_id = v_n.vestido_id_novo)
     and not exists (select 1 from public.reservas_agenda r where r.vestido_id = v_n.vestido_id_novo) then
    update public.negocios set vestido_id_novo = null where vestido_id_novo = v_n.vestido_id_novo;
    delete from public.vestidos where id = v_n.vestido_id_novo;
  end if;
end;
$$;
revoke all on function public._encerrar_pre_venda(uuid, text, text) from public, anon, authenticated;

create or replace function public.cancelar_pre_venda(p_negocio_id uuid, p_motivo text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_vendedor uuid;
  v_status text;
begin
  select vendedor_id, status_negociacao into v_vendedor, v_status from public.negocios where id = p_negocio_id;
  if v_status is null then
    raise exception 'Venda não encontrada';
  end if;
  if not (public.has_role(auth.uid(), 'admin') or (public.can_write_crm(auth.uid()) and v_vendedor = auth.uid())) then
    raise exception 'Só quem registrou a venda (ou um admin) pode cancelá-la' using errcode = '42501';
  end if;
  if v_status <> 'aguardando_assinatura' then
    raise exception 'Só dá para cancelar vendas que ainda aguardam assinatura';
  end if;
  perform public._encerrar_pre_venda(p_negocio_id, 'cancelado', p_motivo);
end;
$$;
revoke all on function public.cancelar_pre_venda(uuid, text) from public, anon;
grant execute on function public.cancelar_pre_venda(uuid, text) to authenticated;

-- Chamada pela Edge Function pre-vendas-rotina (cron de hora em hora).
create or replace function public.expirar_pre_vendas()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_n record;
  v_out jsonb := '[]'::jsonb;
begin
  for v_n in
    select n.id, n.cliente_nome, n.vestido_nome, n.vendedor_id,
           greatest(n.valor_negociado - coalesce(n.desconto, 0), 0) as valor
      from public.negocios n
     where n.status_negociacao = 'aguardando_assinatura'
       and n.reserva_expira_em is not null
       and n.reserva_expira_em < now()
     for update skip locked
  loop
    perform public._encerrar_pre_venda(v_n.id, 'expirado', 'prazo de 48h para assinatura venceu');
    v_out := v_out || jsonb_build_object(
      'negocio_id', v_n.id, 'cliente_nome', v_n.cliente_nome, 'vestido_nome', v_n.vestido_nome,
      'vendedor_id', v_n.vendedor_id, 'valor', v_n.valor);
  end loop;
  return v_out;
end;
$$;
revoke all on function public.expirar_pre_vendas() from public, anon, authenticated;
grant execute on function public.expirar_pre_vendas() to service_role;

-- ── Exceção: admin fecha sem assinatura, com motivo registrado ───────────────
create or replace function public.aprovar_venda_sem_assinatura(p_negocio_id uuid, p_motivo text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.has_role(auth.uid(), 'admin') then
    raise exception 'Só um admin pode fechar uma venda sem assinatura' using errcode = '42501';
  end if;
  if length(trim(coalesce(p_motivo, ''))) < 10 then
    raise exception 'Explique o motivo (mínimo 10 caracteres)';
  end if;

  update public.negocios
     set aprovado_sem_assinatura_motivo = trim(p_motivo),
         aprovado_sem_assinatura_por = auth.uid()
   where id = p_negocio_id and status_negociacao in ('aguardando_assinatura', 'aberto');
  if not found then
    raise exception 'Venda não encontrada ou não está aguardando assinatura';
  end if;

  perform public.fechar_venda(p_negocio_id);
end;
$$;
revoke all on function public.aprovar_venda_sem_assinatura(uuid, text) from public, anon;
grant execute on function public.aprovar_venda_sem_assinatura(uuid, text) to authenticated;

-- ── Página pública: contrato assinado continua acessível ─────────────────────
-- O e-mail de confirmação manda a cliente de volta para /assinar/:token para
-- baixar o PDF "a qualquer momento" — antes, depois de 7 dias o link morria.
create or replace function public.get_contrato_by_token(_token uuid)
returns table(id uuid, numero text, nome_cliente text, cpf_cliente text, data_evento text, valor_total numeric,
              termos_texto text, status_assinatura text, assinatura_base64 text,
              data_assinatura timestamptz, token_expires_at timestamptz)
language sql
stable
security definer
set search_path = public
as $$
  select c.id, c.numero, c.nome_cliente, c.cpf_cliente, c.data_evento, c.valor_total,
         c.termos_texto, c.status_assinatura, c.assinatura_base64, c.data_assinatura, c.token_expires_at
    from public.contratos c
   where c.signing_token = _token
     and (c.status_assinatura = 'assinado' or c.token_expires_at is null or c.token_expires_at > now())
   limit 1
$$;

-- Funções de trigger não precisam ser chamáveis pela API.
revoke all on function public.fn_criar_agendamentos_da_reserva() from public, anon, authenticated;
revoke all on function public.fn_contratos_regras_assinatura() from public, anon, authenticated;
