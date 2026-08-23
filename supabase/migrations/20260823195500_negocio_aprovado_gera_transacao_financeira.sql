-- Liga negocios -> transacoes_financeiras: uma venda aprovada (feita pelo
-- funcionário em /minha-venda ou fechada no funil comercial) não gerava
-- nenhum lançamento financeiro automático, deixando o Financeiro/DRE
-- dependente de lançamento manual do admin e sem rastreabilidade de quais
-- negócios já haviam sido lançados.

alter table public.transacoes_financeiras
  add column negocio_id uuid references public.negocios(id);

create unique index transacoes_financeiras_negocio_id_key
  on public.transacoes_financeiras (negocio_id)
  where negocio_id is not null;

create or replace function public.fn_negocio_aprovado_gera_transacao()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if NEW.status_negociacao = 'aprovado'
     and (TG_OP = 'INSERT' or OLD.status_negociacao is distinct from 'aprovado') then
    insert into public.transacoes_financeiras (
      tipo, data, descricao, categoria, valor, status, tipo_custo, lead_id, negocio_id, observacoes
    ) values (
      'entrada',
      coalesce(NEW.criado_em, current_date),
      'Venda - ' || NEW.cliente_nome || case when NEW.vestido_nome is not null and NEW.vestido_nome <> ''
                                              then ' (' || NEW.vestido_nome || ')' else '' end,
      'venda',
      greatest(NEW.valor_negociado - coalesce(NEW.desconto, 0), 0),
      'pago',
      null,
      NEW.cliente_id,
      NEW.id,
      'Gerado automaticamente ao aprovar o negócio ' || NEW.id::text
    )
    on conflict (negocio_id) where negocio_id is not null do nothing;
  end if;
  return NEW;
end;
$$;

revoke execute on function public.fn_negocio_aprovado_gera_transacao() from public, anon, authenticated;

create trigger trg_negocio_aprovado_gera_transacao
  after insert or update of status_negociacao on public.negocios
  for each row
  execute function public.fn_negocio_aprovado_gera_transacao();
