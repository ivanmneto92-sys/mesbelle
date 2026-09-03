-- Complementa o trigger de venda aprovada (20260823195500): além da entrada
-- de receita, agora também lança automaticamente as saídas de taxa de
-- cartão, comissão da vendedora e imposto (Simples Nacional), usando as
-- taxas já cadastradas em config_financeiro e o percentual_comissao do
-- vendedor em profiles — hoje essas taxas existiam no banco mas nenhum
-- código as lia; tudo dependia de lançamento manual no Financeiro.

-- O índice único antigo permitia só 1 transação por negócio no total; agora
-- cada negócio pode gerar até 4 linhas (venda, taxa_cartao, comissao,
-- imposto), uma por categoria.
drop index if exists public.transacoes_financeiras_negocio_id_key;
create unique index transacoes_financeiras_negocio_categoria_key
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
  v_percentual_comissao numeric;
  v_taxa_cartao_pct numeric;
  v_match text[];
  v_parcelas int;
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

      -- Taxa de cartão: só quando o método de pagamento é cartão (cobre os
      -- dois formatos usados hoje — "Cartão de Crédito"/"Cartão de Débito"
      -- do fluxo /minha-venda, e "Cartão Nx" do funil comercial). Parcelas
      -- vem da coluna negocios.parcelas, ou do "Nx" no texto quando a coluna
      -- não foi preenchida (funil comercial não usa a coluna parcelas).
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

      -- Comissão da vendedora: só quando o negócio tem vendedor_id e o
      -- perfil dele tem percentual_comissao > 0 configurado pelo admin.
      if NEW.vendedor_id is not null then
        select percentual_comissao into v_percentual_comissao
          from public.profiles where user_id = NEW.vendedor_id;

        if v_percentual_comissao is not null and v_percentual_comissao > 0 then
          insert into public.transacoes_financeiras (
            tipo, data, descricao, categoria, valor, status, tipo_custo, lead_id, negocio_id, observacoes
          ) values (
            'saida', coalesce(NEW.criado_em, current_date),
            'Comissão - ' || NEW.cliente_nome,
            'comissao', round(v_valor_liquido * v_percentual_comissao, 2), 'pago', 'variavel',
            NEW.cliente_id, NEW.id,
            'Gerado automaticamente (' || round(v_percentual_comissao * 100, 2) || '% sobre o valor líquido)'
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
