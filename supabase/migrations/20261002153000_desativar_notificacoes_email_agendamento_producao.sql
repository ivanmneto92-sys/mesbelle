-- Desativa os e-mails automáticos de "novo agendamento" e "mudança de etapa
-- de produção". A loja só quer receber por e-mail: Relatório Diário e
-- Contrato (cliente + mesbelle). Os triggers ficam desativados (não
-- removidos) para poder reativar facilmente se precisar no futuro.
alter table public.agendamentos disable trigger trg_agendamento_criado_email;
alter table public.etapas_producao disable trigger trg_etapas_notificar;
