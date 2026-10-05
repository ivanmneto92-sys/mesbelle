-- Hoje a transação de "Comissão de Vendedora" no Financeiro não mostra qual
-- vendedora recebeu — a descrição guarda o nome da CLIENTE (ex: "Comissão -
-- Jerusa Simões de Andrada"), não da vendedora. Esta migração guarda o nome
-- da vendedora em transacoes_financeiras.vendedor_nome (copiado de
-- profiles.nome no momento da venda, não é FK — segue o mesmo padrão de
-- cliente_nome, que também é uma cópia) para o Financeiro poder exibir
-- "Comissão (Nome da Vendedora)" em vez do rótulo genérico.

alter table public.transacoes_financeiras
  add column if not exists vendedor_nome text;

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
begin
  if NEW.status_negociacao = 'aprovado'
     and (TG_OP = 'INSERT' or OLD.status_negociacao is distinct from 'aprovado') then

    v_valor_liquido := greatest(NEW.valor_negociado - coalesce(NEW.desconto, 0), 0);

    insert into public.transacoes_financeiras (
      tipo, data, descricao, categoria, valor, status, tipo_custo, lead_id, negocio_id, observacoes
    ) values (
      'entrada',
      coalesce(NEW.criado_em, current_date),
      'Venda - ' || NEW.cliente_nome || case when NEW.vestido_nome is not null and NEW.vestido_nome <> ''
                                              then ' (' || NEW.vestido_nome || ')' else '' end,
      'venda',
      v_valor_liquido,
      'pago',
      null,
      NEW.cliente_id,
      NEW.id,
      'Gerado automaticamente ao aprovar o negócio ' || NEW.id::text
    )
    on conflict (negocio_id, categoria) where negocio_id is not null and categoria <> 'ajuste_comissao' do nothing;

    if v_valor_liquido > 0 then
      select * into v_config from public.config_financeiro where id = 1;

      if NEW.metodo_pagamento is not null and NEW.metodo_pagamento ilike '%cart%' then
        if NEW.metodo_pagamento ilike '%débito%' or NEW.metodo_pagamento ilike '%debito%' then
          v_parcelas_lookup := 0;
        else
          v_match := regexp_match(NEW.metodo_pagamento, '(\d+)\s*[xX]');
          if v_match is not null then
            v_parcelas := v_match[1]::int;
          else
            v_parcelas := coalesce(NEW.parcelas, 1);
          end if;
          v_parcelas_lookup := least(v_parcelas, 18);
        end if;

        v_taxa_cartao_pct := null;
        if NEW.bandeira_cartao is not null then
          select taxa_percentual into v_taxa_cartao_pct
            from public.taxas_cartao
           where bandeira = NEW.bandeira_cartao and parcelas = v_parcelas_lookup;
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
            'saida', coalesce(NEW.criado_em, current_date),
            'Taxa de cartão - ' || NEW.cliente_nome,
            'taxa_cartao', round(v_valor_liquido * v_taxa_cartao_pct / 100, 2), 'pago', 'variavel',
            NEW.cliente_id, NEW.id,
            'Gerado automaticamente (' || v_taxa_cartao_pct || '% sobre ' || NEW.metodo_pagamento
              || case when NEW.bandeira_cartao is not null
                   then ' — ' || (case when NEW.bandeira_cartao = 'visa_master' then 'Visa/Master' else 'Elo' end)
                     || ' ' || case when v_parcelas_lookup = 0 then 'débito' else v_parcelas_lookup || 'x' end
                   else '' end
              || ')'
          )
          on conflict (negocio_id, categoria) where negocio_id is not null and categoria <> 'ajuste_comissao' do nothing;
        end if;
      end if;

      if NEW.vendedor_id is not null then
        select nome into v_vendedor_nome from public.profiles where user_id = NEW.vendedor_id;

        select coalesce(sum(greatest(n.valor_negociado - coalesce(n.desconto, 0), 0)), 0)
          into v_faturamento_mes_com_esta
          from public.negocios n
          where n.vendedor_id = NEW.vendedor_id
            and n.status_negociacao = 'aprovado'
            and date_trunc('month', n.criado_em) = date_trunc('month', coalesce(NEW.criado_em, now()));

        v_faturamento_mes_antes := v_faturamento_mes_com_esta - v_valor_liquido;
        v_percentual_comissao := public.fn_faixa_comissao(v_faturamento_mes_com_esta);

        v_comissao_esta_venda := round(v_valor_liquido * v_percentual_comissao, 2);

        insert into public.transacoes_financeiras (
          tipo, data, descricao, categoria, valor, status, tipo_custo, lead_id, negocio_id, observacoes, vendedor_nome
        ) values (
          'saida', coalesce(NEW.criado_em, current_date),
          'Comissão - ' || NEW.cliente_nome,
          'comissao', v_comissao_esta_venda, 'pago', 'variavel',
          NEW.cliente_id, NEW.id,
          'Gerado automaticamente (' || round(v_percentual_comissao * 100, 2) || '% — faixa por faturamento do mês: '
            || to_char(v_faturamento_mes_com_esta, 'FM999G999G990D00') || ')',
          v_vendedor_nome
        )
        on conflict (negocio_id, categoria) where negocio_id is not null and categoria <> 'ajuste_comissao' do nothing;

        for v_negocio_anterior in
          select n.id as negocio_id, n.cliente_id, n.cliente_nome,
                 greatest(n.valor_negociado - coalesce(n.desconto, 0), 0) as valor_liq
          from public.negocios n
          where n.vendedor_id = NEW.vendedor_id
            and n.status_negociacao = 'aprovado'
            and date_trunc('month', n.criado_em) = date_trunc('month', coalesce(NEW.criado_em, now()))
            and n.id <> NEW.id
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
              'saida', coalesce(NEW.criado_em, current_date),
              'Ajuste de comissão (mudança de faixa) - ' || v_negocio_anterior.cliente_nome,
              'ajuste_comissao', v_ajuste_individual, 'pago', 'variavel',
              v_negocio_anterior.cliente_id, v_negocio_anterior.negocio_id,
              'Gerado automaticamente: a venda de ' || NEW.cliente_nome
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
            'saida', coalesce(NEW.criado_em, current_date),
            'Bônus de faturamento (R$40.000+ no mês) - ' || NEW.cliente_nome,
            'bonus_comissao', 1000, 'pago', 'variavel',
            NEW.cliente_id, NEW.id,
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
          'saida', coalesce(NEW.criado_em, current_date),
          'Imposto (Simples Nacional) - ' || NEW.cliente_nome,
          'imposto', round(v_valor_liquido * v_config.simples_nacional / 100, 2), 'pago', 'variavel',
          NEW.cliente_id, NEW.id,
          'Gerado automaticamente (' || v_config.simples_nacional || '% sobre o valor líquido)'
        )
        on conflict (negocio_id, categoria) where negocio_id is not null and categoria <> 'ajuste_comissao' do nothing;
      end if;
    end if;
  end if;
  return NEW;
end;
$$;

-- Backfill: linhas de comissão/ajuste/bônus já criadas antes desta migração,
-- preenchendo vendedor_nome a partir do negócio ligado a cada uma.
update public.transacoes_financeiras tf
set vendedor_nome = p.nome
from public.negocios n
join public.profiles p on p.user_id = n.vendedor_id
where tf.negocio_id = n.id
  and tf.categoria in ('comissao', 'ajuste_comissao', 'bonus_comissao')
  and tf.vendedor_nome is null;
