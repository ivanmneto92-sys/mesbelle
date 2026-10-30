-- Linha única com o status da conexão do bot de WhatsApp (Baileys, rodando
-- fora do app, numa VPS) — o bot escreve aqui com a service role key
-- (contorna RLS), e o app só lê, pra mostrar o QR code na tela do CRM e
-- saber se já está conectado.
create table public.whatsapp_conexao (
  id smallint primary key default 1,
  status text not null default 'desconectado', -- 'desconectado' | 'aguardando_qr' | 'conectado'
  qr text,
  numero_conectado text,
  atualizado_em timestamptz not null default now(),
  constraint whatsapp_conexao_singleton check (id = 1)
);

insert into public.whatsapp_conexao (id, status) values (1, 'desconectado');

alter table public.whatsapp_conexao enable row level security;

-- Só admin vê — quem enxerga o QR code consegue assumir a conta de
-- WhatsApp conectada. Sem política de insert/update/delete para
-- "authenticated" de propósito: só a service role key (o bot) escreve.
create policy "Whatsapp conexao read admin"
  on public.whatsapp_conexao for select
  to authenticated
  using (has_role(auth.uid(), 'admin'::app_role));

alter publication supabase_realtime add table public.whatsapp_conexao;
