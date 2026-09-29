-- Pedido do usuário: a comissão progressiva por faixa (20260929120000) não
-- deve valer só "daqui pra frente" — quando o vendedor sobe de faixa no meio
-- do mês, as vendas JÁ aprovadas nesse mês também precisam ser reajustadas
-- para o percentual novo, pagando a diferença. Ex: vendeu R$1.000 (5% =
-- R$50), depois no mês bateu R$10.000 (7,5%) — a essa altura ele deveria ter
-- recebido 7,5% sobre os R$10.000 (R$750), então falta lançar R$700 de
-- ajuste (750 - 50 já pago). Se depois no mesmo mês bater R$20.000 (10%),
-- lança mais a diferença entre 10% do acumulado e o que já foi pago.
--
-- Implementado como um segundo lançamento ("ajuste_comissao"), separado do
-- lançamento normal de comissão da venda, para ficar rastreável no
-- Financeiro: dá pra ver a comissão normal de cada venda E o ajuste
-- retroativo causado por ela, sem misturar os dois.
--
-- Matemática: cada venda soma um lançamento "comissao" (valor da venda ×
-- faixa atual) + um "ajuste_comissao" (faturamento ANTERIOR a esta venda ×
-- faixa atual, menos tudo que já foi lançado em comissao/ajuste_comissao
-- para esse vendedor neste mês). A soma dos dois sempre fecha exatamente
-- com faturamento_acumulado × faixa_atual — sem recálculo negativo, porque
-- faixa(x) é não-decrescente em x.

create unique index if not exists transacoes_financeiras_negocio_categoria_key
  on public.transacoes_financeiras (negocio_id, categoria)
  where negocio_id is not null;

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
  v_comissao_esta_venda numeric;
  v_comissao_ja_lancada numeric;
  v_devida_sobre_anterior numeric;
  v_ajuste numeric;
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

      -- Comissão progressiva RETROATIVA: faixa definida pelo faturamento
      -- líquido acumulado do vendedor no mês (negócios aprovados),
      -- incluindo esta venda.
      if NEW.vendedor_id is not null then
        select coalesce(sum(greatest(n.valor_negociado - coalesce(n.desconto, 0), 0)), 0)
          into v_faturamento_mes_com_esta
          from public.negocios n
          where n.vendedor_id = NEW.vendedor_id
            and n.status_negociacao = 'aprovado'
            and date_trunc('month', n.criado_em) = date_trunc('month', coalesce(NEW.criado_em, now()));

        v_faturamento_mes_antes := v_faturamento_mes_com_esta - v_valor_liquido;
        v_percentual_comissao := public.fn_faixa_comissao(v_faturamento_mes_com_esta);

        -- Comissão normal desta venda, na faixa atual.
        v_comissao_esta_venda := round(v_valor_liquido * v_percentual_comissao, 2);

        insert into public.transacoes_financeiras (
          tipo, data, descricao, categoria, valor, status, tipo_custo, lead_id, negocio_id, observacoes
        ) values (
          'saida', coalesce(NEW.criado_em, current_date),
          'Comissão - ' || NEW.cliente_nome,
          'comissao', v_comissao_esta_venda, 'pago', 'variavel',
          NEW.cliente_id, NEW.id,
          'Gerado automaticamente (' || round(v_percentual_comissao * 100, 2) || '% — faixa por faturamento do mês: '
            || to_char(v_faturamento_mes_com_esta, 'FM999G999G990D00') || ')'
        )
        on conflict (negocio_id, categoria) where negocio_id is not null do nothing;

        -- Ajuste retroativo: quanto as vendas ANTERIORES deste mês valeriam
        -- na faixa atual, menos o que já foi lançado (comissao + ajuste) —
        -- só lança quando positivo (subiu de faixa desde a última venda).
        select coalesce(sum(tf.valor), 0) into v_comissao_ja_lancada
          from public.transacoes_financeiras tf
          join public.negocios n on n.id = tf.negocio_id
          where n.vendedor_id = NEW.vendedor_id
            and n.status_negociacao = 'aprovado'
            and date_trunc('month', n.criado_em) = date_trunc('month', coalesce(NEW.criado_em, now()))
            and tf.categoria in ('comissao', 'ajuste_comissao')
            and tf.negocio_id <> NEW.id;

        v_devida_sobre_anterior := round(v_faturamento_mes_antes * v_percentual_comissao, 2);
        v_ajuste := v_devida_sobre_anterior - v_comissao_ja_lancada;

        if v_ajuste > 0 then
          insert into public.transacoes_financeiras (
            tipo, data, descricao, categoria, valor, status, tipo_custo, lead_id, negocio_id, observacoes
          ) values (
            'saida', coalesce(NEW.criado_em, current_date),
            'Ajuste de comissão (mudança de faixa) - ' || NEW.cliente_nome,
            'ajuste_comissao', v_ajuste, 'pago', 'variavel',
            NEW.cliente_id, NEW.id,
            'Gerado automaticamente: reajuste das vendas anteriores deste mês para ' || round(v_percentual_comissao * 100, 2) || '%'
          )
          on conflict (negocio_id, categoria) where negocio_id is not null do nothing;
        end if;

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
