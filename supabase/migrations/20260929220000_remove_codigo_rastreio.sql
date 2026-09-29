-- Pedido do usuário: remover código de rastreio da Logística — o ateliê
-- entrega/retira as peças diretamente, não usa transportadora com rastreio.
alter table public.alugueis_logistica drop column if exists codigo_rastreio;
