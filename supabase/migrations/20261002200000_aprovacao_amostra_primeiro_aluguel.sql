-- O frontend (DEFAULT_ETAPAS, ícones em ProducaoJornada, labels em
-- VestidoSituacaoAtual) já estava pronto pra etapa "Aprovação de Amostra"
-- antes de "Compra de Material" — só o trigger que gera a Produção
-- automática do Primeiro Aluguel (fn_negocio_primeiro_aluguel_gera_producao)
-- ainda criava as 7 etapas antigas, sem ela. Esta migração alinha o
-- trigger ao frontend e corrige as produções já criadas sem a etapa.

create or replace function public.fn_negocio_primeiro_aluguel_gera_producao()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_producao_id uuid;
  v_prazo date;
begin
  if NEW.status_negociacao = 'aprovado'
     and NEW.tipo_negocio = 'primeiro_aluguel'
     and (TG_OP = 'INSERT' or OLD.status_negociacao is distinct from 'aprovado')
     and not exists (select 1 from public.producoes where negocio_id = NEW.id) then

    v_prazo := case when NEW.data_evento ~ '^\d{4}-\d{2}-\d{2}$'
      then (NEW.data_evento::date - 3)
      else (current_date + 4) end; -- fallback defensivo, não deveria acontecer

    insert into public.producoes (
      titulo_vestido, cliente_nome, data_prazo, data_prova, status_geral,
      ref_imagens_urls, notas_tecnicas, negocio_id, vestido_id
    ) values (
      coalesce(NEW.vestido_nome, 'Vestido'), NEW.cliente_nome, v_prazo, v_prazo, 'em_producao',
      '{}', coalesce(NEW.descricao_primeiro_aluguel, ''), NEW.id, NEW.vestido_id_novo
    )
    returning id into v_producao_id;

    insert into public.etapas_producao (producao_id, nome_etapa, is_concluido, ordem)
    select v_producao_id, e.nome, false, e.ordem
    from (values
      ('Aprovação de Amostra', 0), ('Compra de Material', 1), ('Modelista', 2), ('Bordadeira', 3),
      ('Primeira Prova', 4), ('Ajustes', 5), ('Segunda Prova', 6), ('Entrega Final', 7)
    ) as e(nome, ordem);
  end if;
  return NEW;
end;
$$;

-- Backfill: produções de Primeiro Aluguel já criadas antes desta migração,
-- que ainda não têm "Aprovação de Amostra" — empurra o ordem das etapas
-- existentes +1 e insere a etapa faltante na frente.
do $$
declare
  v_producao record;
begin
  for v_producao in
    select p.id
    from public.producoes p
    where p.negocio_id in (select id from public.negocios where tipo_negocio = 'primeiro_aluguel')
      and not exists (
        select 1 from public.etapas_producao e
        where e.producao_id = p.id and e.nome_etapa = 'Aprovação de Amostra'
      )
  loop
    update public.etapas_producao
    set ordem = ordem + 1
    where producao_id = v_producao.id;

    insert into public.etapas_producao (producao_id, nome_etapa, is_concluido, ordem)
    values (v_producao.id, 'Aprovação de Amostra', false, 0);
  end loop;
end $$;
