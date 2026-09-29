-- Pedido do usuário: comissão padrão da equipe passa a ser progressiva por
-- faturamento (líquido, negócios aprovados) acumulado no MÊS de cada
-- vendedor, em vez do percentual_comissao fixo cadastrado manualmente por
-- funcionário em profiles (que a UI de Equipe usava até agora):
--   R$0 a R$9.999,99        -> 5%
--   R$10.000 a R$19.999,99  -> 7,5%
--   R$20.000+               -> 10%
--   bônus fixo de R$1.000 ao ultrapassar R$40.000 faturado no mês
--
-- A faixa é definida pelo faturamento acumulado do vendedor NO MOMENTO em
-- que cada venda é aprovada (incluindo a própria venda), e esse percentual
-- se aplica sobre o valor cheio dela — sem recálculo retroativo das vendas
-- já comissionadas quando o funcionário sobe de faixa depois. O bônus de
-- R$1.000 é lançado uma única vez por mês, na venda que faz o acumulado
-- cruzar de baixo de R$40.000 para R$40.000 ou mais.
--
-- profiles.percentual_comissao deixa de ser lido aqui (a tabela de faixas é
-- fixa e interna); a coluna continua existindo só por compatibilidade,
-- sem uso.

create or replace function public.fn_faixa_comissao(v_faturamento_mes numeric)
returns numeric
language sql
immutable
as $$
  select case
    when v_faturamento_mes >= 20000 then 0.10
    when v_faturamento_mes >= 10000 then 0.075
    else 0.05
  end;
$$;

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
  v_faturamento_mes_com_esta numeric;
  v_faturamento_mes_antes numeric;
  v_percentual_comissao numeric;
begin
  if NEW.status_negociacao = 'aprovado'
     and (TG_OP = 'INSERT' or OLD.status_negociacao is distinct from 'aprovado') then

    v_valor_liquido := greatest(NEW.valor_negociado - coalesce(NEW.desconto, 0), 0);

    -- Receita da venda (já existia)
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
    on conflict (negocio_id, categoria) where negocio_id is not null do nothing;

    if v_valor_liquido > 0 then
      select * into v_config from public.config_financeiro where id = 1;

      -- Taxa de cartão: só quando o método de pagamento é cartão.
      if v_config is not null and NEW.metodo_pagamento is not null and NEW.metodo_pagamento ilike '%cart%' then
        if NEW.metodo_pagamento ilike '%débito%' or NEW.metodo_pagamento ilike '%debito%' then
          v_taxa_cartao_pct := v_config.debito;
        else
          v_match := regexp_match(NEW.metodo_pagamento, '(\d+)\s*[xX]');
          if v_match is not null then
            v_parcelas := v_match[1]::int;
          else
            v_parcelas := coalesce(NEW.parcelas, 1);
          end if;
          v_taxa_cartao_pct := case when v_parcelas > 1 then v_config.credito_parcelado else v_config.credito_vista end;
        end if;

        insert into public.transacoes_financeiras (
          tipo, data, descricao, categoria, valor, status, tipo_custo, lead_id, negocio_id, observacoes
        ) values (
          'saida', coalesce(NEW.criado_em, current_date),
          'Taxa de cartão - ' || NEW.cliente_nome,
          'taxa_cartao', round(v_valor_liquido * v_taxa_cartao_pct / 100, 2), 'pago', 'variavel',
          NEW.cliente_id, NEW.id,
          'Gerado automaticamente (' || v_taxa_cartao_pct || '% sobre ' || NEW.metodo_pagamento || ')'
        )
        on conflict (negocio_id, categoria) where negocio_id is not null do nothing;
      end if;

      -- Comissão progressiva: faixa definida pelo faturamento líquido
      -- acumulado do vendedor no mês (negócios aprovados), incluindo esta
      -- venda, aplicada sobre o valor cheio desta venda.
      if NEW.vendedor_id is not null then
        select coalesce(sum(greatest(n.valor_negociado - coalesce(n.desconto, 0), 0)), 0)
          into v_faturamento_mes_com_esta
          from public.negocios n
          where n.vendedor_id = NEW.vendedor_id
            and n.status_negociacao = 'aprovado'
            and date_trunc('month', n.criado_em) = date_trunc('month', coalesce(NEW.criado_em, now()));

        v_faturamento_mes_antes := v_faturamento_mes_com_esta - v_valor_liquido;
        v_percentual_comissao := public.fn_faixa_comissao(v_faturamento_mes_com_esta);

        insert into public.transacoes_financeiras (
          tipo, data, descricao, categoria, valor, status, tipo_custo, lead_id, negocio_id, observacoes
        ) values (
          'saida', coalesce(NEW.criado_em, current_date),
          'Comissão - ' || NEW.cliente_nome,
          'comissao', round(v_valor_liquido * v_percentual_comissao, 2), 'pago', 'variavel',
          NEW.cliente_id, NEW.id,
          'Gerado automaticamente (' || round(v_percentual_comissao * 100, 2) || '% — faixa por faturamento do mês: '
            || to_char(v_faturamento_mes_com_esta, 'FM999G999G990D00') || ')'
        )
        on conflict (negocio_id, categoria) where negocio_id is not null do nothing;

        -- Bônus de R$1.000: uma vez por mês, na venda que faz o acumulado
        -- cruzar de baixo de R$40.000 para R$40.000 ou mais.
        if v_faturamento_mes_antes < 40000 and v_faturamento_mes_com_esta >= 40000 then
          insert into public.transacoes_financeiras (
            tipo, data, descricao, categoria, valor, status, tipo_custo, lead_id, negocio_id, observacoes
          ) values (
            'saida', coalesce(NEW.criado_em, current_date),
            'Bônus de faturamento (R$40.000+ no mês) - ' || NEW.cliente_nome,
            'bonus_comissao', 1000, 'pago', 'variavel',
            NEW.cliente_id, NEW.id,
            'Gerado automaticamente ao cruzar R$40.000 de faturamento no mês'
          )
          on conflict (negocio_id, categoria) where negocio_id is not null do nothing;
        end if;
      end if;

      -- Imposto (Simples Nacional) sobre o valor líquido da venda.
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
        on conflict (negocio_id, categoria) where negocio_id is not null do nothing;
      end if;
    end if;
  end if;
  return NEW;
end;
$$;
