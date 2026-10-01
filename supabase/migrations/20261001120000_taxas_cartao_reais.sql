-- Pedido do usuário: integrar a tabela real de taxas de cartão (Débito e
-- 1x-18x, Visa/Master vs Elo) no financeiro — até agora o sistema usava só
-- 3 taxas fixas e genéricas em config_financeiro (débito, crédito à vista,
-- crédito parcelado), sem diferenciar bandeira nem o número exato de
-- parcelas.

CREATE TABLE IF NOT EXISTS public.taxas_cartao (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bandeira TEXT NOT NULL CHECK (bandeira IN ('visa_master', 'elo')),
  -- 0 = Débito; 1-18 = parcelas do crédito.
  parcelas INTEGER NOT NULL CHECK (parcelas BETWEEN 0 AND 18),
  taxa_percentual NUMERIC NOT NULL CHECK (taxa_percentual >= 0),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (bandeira, parcelas)
);

ALTER TABLE public.taxas_cartao ENABLE ROW LEVEL SECURITY;

-- Leitura liberada pra admin e vendedor (igual vestidos) — a vendedora
-- precisa ver a taxa/valor líquido ao escolher bandeira+parcelas na tela de
-- venda. Escrita só admin, igual config_financeiro.
CREATE POLICY "TaxasCartao read crm" ON public.taxas_cartao
  FOR SELECT USING (public.can_read_crm(auth.uid()));
CREATE POLICY "TaxasCartao insert admin" ON public.taxas_cartao
  FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "TaxasCartao update admin" ON public.taxas_cartao
  FOR UPDATE USING (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "TaxasCartao delete admin" ON public.taxas_cartao
  FOR DELETE USING (public.has_role(auth.uid(), 'admin'::app_role));

INSERT INTO public.taxas_cartao (bandeira, parcelas, taxa_percentual) VALUES
  ('visa_master', 0, 1.09), ('elo', 0, 1.60),
  ('visa_master', 1, 2.99), ('elo', 1, 3.92),
  ('visa_master', 2, 4.22), ('elo', 2, 5.22),
  ('visa_master', 3, 4.95), ('elo', 3, 5.95),
  ('visa_master', 4, 5.68), ('elo', 4, 6.68),
  ('visa_master', 5, 6.39), ('elo', 5, 7.39),
  ('visa_master', 6, 7.10), ('elo', 6, 8.10),
  ('visa_master', 7, 8.00), ('elo', 7, 9.31),
  ('visa_master', 8, 8.70), ('elo', 8, 10.01),
  ('visa_master', 9, 9.39), ('elo', 9, 10.70),
  ('visa_master', 10, 10.07), ('elo', 10, 11.38),
  ('visa_master', 11, 10.74), ('elo', 11, 12.05),
  ('visa_master', 12, 11.41), ('elo', 12, 12.72),
  ('visa_master', 13, 12.87), ('elo', 13, 13.87),
  ('visa_master', 14, 13.52), ('elo', 14, 14.52),
  ('visa_master', 15, 14.17), ('elo', 15, 15.17),
  ('visa_master', 16, 14.81), ('elo', 16, 15.81),
  ('visa_master', 17, 15.45), ('elo', 17, 16.45),
  ('visa_master', 18, 16.08), ('elo', 18, 17.08)
ON CONFLICT (bandeira, parcelas) DO UPDATE SET taxa_percentual = EXCLUDED.taxa_percentual, updated_at = now();

-- Qual bandeira foi usada no pagamento com cartão desta venda — só
-- preenchido quando metodo_pagamento é cartão (débito ou crédito).
ALTER TABLE public.negocios
  ADD COLUMN IF NOT EXISTS bandeira_cartao TEXT
    CHECK (bandeira_cartao IS NULL OR bandeira_cartao IN ('visa_master', 'elo'));

-- Trigger: a taxa de cartão passa a vir de taxas_cartao (bandeira + número
-- exato de parcelas) quando a venda informou bandeira_cartao. Sem bandeira
-- (vendas antigas ou lançamentos manuais), mantém o fallback nas 3 taxas
-- fixas de config_financeiro, igual antes.
CREATE OR REPLACE FUNCTION public.fn_negocio_aprovado_gera_transacao()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
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
$function$;
