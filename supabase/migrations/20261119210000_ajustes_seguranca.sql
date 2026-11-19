-- Ajustes apontados pelo Security Advisor do Supabase (19/11/2026):
--  * _diag_ddl_test2: tabela de teste vazia, sem RLS, exposta pela API;
--  * funções sem search_path fixo;
--  * funções de trigger que podiam ser chamadas pela API (anon/authenticated)
--    — trigger não precisa de permissão de EXECUTE para disparar.
drop table if exists public._diag_ddl_test2;

alter function public.gerar_sku_vestido() set search_path = public;
alter function public.fn_faixa_comissao(numeric) set search_path = public;

revoke all on function public.fn_notificar_agendamento_criado() from public, anon, authenticated;
revoke all on function public.fn_notificar_producao_etapa() from public, anon, authenticated;
revoke all on function public.fn_negocio_primeiro_aluguel_gera_producao() from public, anon, authenticated;
revoke all on function public.fn_reserva_aluguel_gera_jornada() from public, anon, authenticated;
