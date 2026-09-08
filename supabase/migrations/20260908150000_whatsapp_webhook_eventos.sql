-- Suporte ao webhook do WhatsApp Cloud API (supabase/functions/whatsapp-webhook):
-- guarda o id de cada mensagem já processada (wamid) para nunca duplicar um
-- lead quando a Meta reentrega o mesmo evento (comportamento normal da
-- entrega at-least-once dela).
create table if not exists public.whatsapp_webhook_eventos (
  wamid text primary key,
  recebido_em timestamptz not null default now()
);

alter table public.whatsapp_webhook_eventos enable row level security;
-- Sem policies: só a service role (usada pela edge function) acessa.
