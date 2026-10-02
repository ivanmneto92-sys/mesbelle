-- Antes, criar um agendamento com cliente digitado na mão (sem lead
-- existente) era 2 inserts separados feitos pelo client (leads, depois
-- agendamentos). Se o segundo falhasse, o lead já criado ficava órfão —
-- e um retry manual do usuário duplicava o lead a cada tentativa. Esta
-- função faz os dois inserts numa única transação: se o insert em
-- agendamentos falhar, o insert em leads é revertido também.
-- SECURITY INVOKER (padrão) para que a RLS de leads/agendamentos continue
-- valendo normalmente, avaliada com o auth.uid() real do chamador — por
-- isso usamos auth.uid() diretamente abaixo em vez de confiar em qualquer
-- parâmetro do client para "quem criou".
create or replace function public.criar_agendamento_com_lead(
  p_tipo text,
  p_data_hora timestamptz,
  p_duracao_minutos integer,
  p_cliente_nome text,
  p_cliente_email text,
  p_cliente_telefone text,
  p_negocio_id uuid,
  p_lead_id uuid,
  p_reserva_id uuid,
  p_vestido_id uuid,
  p_funcionaria_id uuid,
  p_observacoes text
)
returns public.agendamentos
language plpgsql
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_lead_id uuid := p_lead_id;
  v_agendamento public.agendamentos;
begin
  if v_lead_id is null then
    insert into public.leads (nome, telefone, email, status_funil, criado_por, atendido_por)
    values (p_cliente_nome, coalesce(p_cliente_telefone, ''), coalesce(p_cliente_email, ''), 'agendado', v_uid, v_uid)
    returning id into v_lead_id;
  end if;

  insert into public.agendamentos (
    tipo, data_hora, duracao_minutos, cliente_nome, cliente_email, cliente_telefone,
    negocio_id, lead_id, reserva_id, vestido_id, funcionaria_id, observacoes, criado_por
  ) values (
    p_tipo, p_data_hora, p_duracao_minutos, p_cliente_nome, p_cliente_email, p_cliente_telefone,
    p_negocio_id, v_lead_id, p_reserva_id, p_vestido_id, p_funcionaria_id, p_observacoes, v_uid
  )
  returning * into v_agendamento;

  return v_agendamento;
end;
$$;

revoke all on function public.criar_agendamento_com_lead(text, timestamptz, integer, text, text, text, uuid, uuid, uuid, uuid, uuid, text) from public, anon;
grant execute on function public.criar_agendamento_com_lead(text, timestamptz, integer, text, text, text, uuid, uuid, uuid, uuid, uuid, text) to authenticated;
