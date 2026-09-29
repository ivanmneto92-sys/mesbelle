-- Pedido do usuário: funcionário (vendedor) não pode modificar NADA do
-- Acervo — só visualizar. A migration 20260928220000 já tinha travado o
-- UPDATE para admin-only, mas INSERT ("Nova Peça") e DELETE continuavam
-- liberados via can_write_crm (admin OU vendedor), então um vendedor ainda
-- conseguia cadastrar ou excluir peças. Trava os dois, mesmo padrão já
-- usado em "Vestidos update admin".
drop policy if exists "Vestidos write crm" on public.vestidos;
create policy "Vestidos insert admin" on public.vestidos
  for insert to authenticated with check (public.has_role(auth.uid(), 'admin'));

drop policy if exists "Vestidos delete crm" on public.vestidos;
create policy "Vestidos delete admin" on public.vestidos
  for delete to authenticated using (public.has_role(auth.uid(), 'admin'));

-- Leitura (can_read_crm = admin OU vendedor) continua igual — o funcionário
-- precisa ver o Acervo, só não pode alterá-lo.
