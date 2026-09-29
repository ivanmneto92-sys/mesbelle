-- Pedido do usuário: o Termo de Retirada hoje só existe no admin e não tem
-- assinatura nenhuma (só imprime). O funcionário é quem normalmente colhe a
-- assinatura da cliente na retirada — precisa da mesma tela, com assinatura
-- digital salva (igual ao contrato: base64 + data + IP + user agent).

alter table public.alugueis_logistica
  add column if not exists assinatura_base64 text,
  add column if not exists data_assinatura timestamptz,
  add column if not exists ip_assinatura text,
  add column if not exists user_agent_assinatura text;
