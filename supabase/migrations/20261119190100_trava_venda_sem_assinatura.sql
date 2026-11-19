-- Trava: um negócio só vira "aprovado" (venda fechada) com o contrato
-- assinado — ou por um admin, com motivo registrado
-- (aprovar_venda_sem_assinatura).
--
-- ATENÇÃO: aplicar só depois que as telas novas (criar_pre_venda) estiverem
-- no ar. A versão antiga de "Confirmar aluguel" grava o negócio direto como
-- "aprovado" e passaria a falhar.
create or replace function public.fn_negocio_exige_assinatura()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.status_negociacao = 'aprovado'
     and (tg_op = 'INSERT' or old.status_negociacao is distinct from 'aprovado') then
    if exists (
      select 1 from public.contratos c
       where c.negocio_id = new.id and c.status_assinatura = 'assinado'
    ) then
      return new;
    end if;
    if new.aprovado_sem_assinatura_motivo is not null
       and public.has_role(coalesce(new.aprovado_sem_assinatura_por, auth.uid()), 'admin') then
      return new;
    end if;
    raise exception 'A venda só pode ser fechada com o contrato assinado pela cliente.'
      using hint = 'Peça a assinatura no iPad ou envie o link de assinatura.';
  end if;
  return new;
end;
$$;
revoke all on function public.fn_negocio_exige_assinatura() from public, anon, authenticated;

drop trigger if exists trg_negocio_exige_assinatura on public.negocios;
create trigger trg_negocio_exige_assinatura
  before insert or update of status_negociacao on public.negocios
  for each row execute function public.fn_negocio_exige_assinatura();
