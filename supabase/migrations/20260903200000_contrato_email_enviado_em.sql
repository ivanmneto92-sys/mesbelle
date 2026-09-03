-- Marca quando o e-mail automático do contrato assinado foi enviado ao
-- cliente, para a edge function enviar-contrato-cliente não reenviar em
-- caso de retry/clique duplo na página pública de assinatura.
alter table public.contratos add column if not exists email_enviado_em timestamptz;
