-- Pedido do usuário: fluxo de "Primeiro Aluguel" (vestido feito do zero,
-- ainda não existe no Acervo) dentro da tela de Novo Aluguel (ex-Nova
-- Venda). Quando a venda é desse tipo:
--   1. Uma peça nova é criada no Acervo com status "producao" (ainda não
--      pode ser reservada por outra venda enquanto está sendo feita).
--   2. O negócio guarda o tipo e o vínculo com essa peça nova.
--   3. Ao aprovar o negócio, uma Produção é gerada automaticamente, com
--      prazo = data de retirada menos 72h (3 dias).
--   4. Quando a etapa "Entrega Final" dessa produção é concluída, a peça
--      vira "alugado" (já está com a cliente) — no ciclo normal, quando for
--      devolvida, alguém marca "disponível" como qualquer outra peça.
--
-- vendedor não tem (e continua sem ter) permissão de INSERT direto em
-- vestidos/producoes (RLS admin-only, migrations anteriores) — por isso o
-- passo 1 usa uma function security definer com seu próprio checkpoint de
-- role, em vez de abrir a tabela.

alter table public.negocios
  add column if not exists tipo_negocio text not null default 'aluguel',
  add column if not exists vestido_id_novo uuid references public.vestidos(id),
  add column if not exists descricao_primeiro_aluguel text;

alter table public.producoes
  add column if not exists negocio_id uuid references public.negocios(id),
  add column if not exists vestido_id uuid references public.vestidos(id);

create unique index if not exists producoes_negocio_id_key on public.producoes (negocio_id) where negocio_id is not null;

-- 1) Cria a peça nova do Primeiro Aluguel (status "producao"), sem abrir
-- INSERT geral em vestidos para vendedor.
create or replace function public.fn_criar_vestido_primeiro_aluguel(
  p_nome text, p_categoria text, p_cor text, p_tamanho text, p_comprimento text,
  p_preco_aluguel numeric, p_descricao text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
begin
  if not (public.has_role(auth.uid(), 'admin') or public.has_role(auth.uid(), 'vendedor')) then
    raise exception 'Sem permissão para criar peça de Primeiro Aluguel';
  end if;
  if coalesce(trim(p_nome), '') = '' or p_preco_aluguel is null or p_preco_aluguel <= 0 then
    raise exception 'Nome e preço da peça são obrigatórios';
  end if;

  insert into public.vestidos (
    nome, categoria_peca, cor, tamanho, comprimento, preco_aluguel, preco_venda,
    status, is_consignado, imagem_url, descricao
  ) values (
    trim(p_nome), coalesce(nullif(p_categoria, ''), 'vestido'), coalesce(p_cor, ''),
    coalesce(p_tamanho, ''), coalesce(p_comprimento, ''), p_preco_aluguel, 0,
    'producao', false, '/placeholder.svg', p_descricao
  )
  returning id into v_id;

  return v_id;
end;
$$;
revoke execute on function public.fn_criar_vestido_primeiro_aluguel(text, text, text, text, text, numeric, text) from public, anon;
grant execute on function public.fn_criar_vestido_primeiro_aluguel(text, text, text, text, text, numeric, text) to authenticated;

-- 2) Ao aprovar um negócio de Primeiro Aluguel, gera a Produção + as 7
-- etapas padrão automaticamente. Prazo = data_evento (data de retirada,
-- já gravada nessa coluna pelo fluxo de Novo Aluguel) menos 3 dias.
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
      ('Compra de Material', 0), ('Modelista', 1), ('Bordadeira', 2),
      ('Primeira Prova', 3), ('Ajustes', 4), ('Segunda Prova', 5), ('Entrega Final', 6)
    ) as e(nome, ordem);
  end if;
  return NEW;
end;
$$;
revoke execute on function public.fn_negocio_primeiro_aluguel_gera_producao() from public, anon, authenticated;

drop trigger if exists trg_negocio_primeiro_aluguel_gera_producao on public.negocios;
create trigger trg_negocio_primeiro_aluguel_gera_producao
  after insert or update of status_negociacao on public.negocios
  for each row
  execute function public.fn_negocio_primeiro_aluguel_gera_producao();

-- 3) Quando "Entrega Final" é concluída numa produção ligada a uma peça
-- nova, a peça deixa de estar "producao" e passa a "alugado" (já está com
-- a cliente que fechou o Primeiro Aluguel).
create or replace function public.fn_entrega_final_libera_vestido()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_vestido_id uuid;
begin
  if NEW.nome_etapa = 'Entrega Final' and NEW.is_concluido = true
     and (TG_OP = 'INSERT' or OLD.is_concluido is distinct from true) then
    select p.vestido_id into v_vestido_id from public.producoes p where p.id = NEW.producao_id;
    if v_vestido_id is not null then
      update public.vestidos set status = 'alugado' where id = v_vestido_id and status = 'producao';
    end if;
  end if;
  return NEW;
end;
$$;
revoke execute on function public.fn_entrega_final_libera_vestido() from public, anon, authenticated;

drop trigger if exists trg_entrega_final_libera_vestido on public.etapas_producao;
create trigger trg_entrega_final_libera_vestido
  after insert or update of is_concluido on public.etapas_producao
  for each row
  execute function public.fn_entrega_final_libera_vestido();
