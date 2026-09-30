-- Pedido do usuário: conferindo o Extrato de Comissão, percebeu que o
-- "ajuste de faixa" de uma venda que cruza para um % maior estava sendo
-- lançado inteiro dentro do cartão da venda QUE CAUSOU a virada de faixa —
-- mesmo quando esse dinheiro na verdade era a diferença devida a VENDAS
-- ANTERIORES daquele mês. Resultado: o cartão de uma venda antiga (ex:
-- R$1.100, que deveria terminar o mês valendo R$110 de comissão total,
-- 10%) só mostrava uma parte disso (R$100) — o resto (R$10) ficava
-- escondido, somado com a diferença de OUTRAS vendas, dentro do cartão da
-- venda seguinte.
--
-- Antes (20260929130000_comissao_retroativa.sql): 1 lançamento
-- "ajuste_comissao" por venda, com o total de todo o reajuste do mês,
-- preso ao id da venda que disparou o recálculo.
--
-- Agora: quando a faixa sobe, o reajuste é distribuído — um lançamento
-- "ajuste_comissao" por VENDA ANTERIOR realmente afetada, preso ao id
-- DELA (não da venda nova). Cada venda antiga pode receber mais de um
-- "ajuste_comissao" ao longo do mês (uma vez por cada faixa que ela
-- atravessa depois de fechada) — por isso a constraint de unicidade
-- (negocio_id, categoria) passa a excluir "ajuste_comissao".
--
-- A soma total paga continua idêntica à versão anterior (é a mesma conta,
-- só que dividida por venda em vez de concentrada numa só) — o que muda é
-- só a atribuição/visualização por venda no extrato.

drop index if exists public.transacoes_financeiras_negocio_categoria_key;

create unique index if not exists transacoes_financeiras_negocio_categoria_key
  on public.transacoes_financeiras (negocio_id, categoria)
  where negocio_id is not null and categoria <> 'ajuste_comissao';

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
  v_negocio_anterior record;
  v_ja_recebido numeric;
  v_devido_normal numeric;
  v_ajuste_individual numeric;
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
    on conflict (negocio_id, categoria) where negocio_id is not null and categoria <> 'ajuste_comissao' do nothing;

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
        on conflict (negocio_id, categoria) where negocio_id is not null and categoria <> 'ajuste_comissao' do nothing;
      end if;

      -- Comissão progressiva: faixa definida pelo faturamento líquido
      -- acumulado do vendedor no mês (negócios aprovados), incluindo esta
      -- venda.
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
        on conflict (negocio_id, categoria) where negocio_id is not null and categoria <> 'ajuste_comissao' do nothing;

        -- Ajuste retroativo, DISTRIBUÍDO por venda anterior deste mês: para
        -- cada uma, calcula o que ela já recebeu (comissao + ajustes
        -- anteriores presos a ELA) e lança, presa a ela, a diferença até o
        -- que valeria na faixa atual. Só lança quando positivo (faixa subiu
        -- desde a última vez que essa venda foi ajustada).
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
              tipo, data, descricao, categoria, valor, status, tipo_custo, lead_id, negocio_id, observacoes
            ) values (
              'saida', coalesce(NEW.criado_em, current_date),
              'Ajuste de comissão (mudança de faixa) - ' || v_negocio_anterior.cliente_nome,
              'ajuste_comissao', v_ajuste_individual, 'pago', 'variavel',
              v_negocio_anterior.cliente_id, v_negocio_anterior.negocio_id,
              'Gerado automaticamente: a venda de ' || NEW.cliente_nome
                || ' fez a faixa do mês subir para ' || round(v_percentual_comissao * 100, 2)
                || '% — reajuste desta venda (anterior) para o novo percentual'
            );
          end if;
        end loop;

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
          on conflict (negocio_id, categoria) where negocio_id is not null and categoria <> 'ajuste_comissao' do nothing;
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
        on conflict (negocio_id, categoria) where negocio_id is not null and categoria <> 'ajuste_comissao' do nothing;
      end if;
    end if;
  end if;
  return NEW;
end;
$$;
