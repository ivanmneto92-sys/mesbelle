-- Pedido do usuário: funcionário (vendedor) nunca pode editar ou excluir um
-- item do Acervo. A exclusão já era restrita a admin; falta só a edição —
-- hoje "Vestidos update crm" libera para admin OU vendedor via can_write_crm.
-- Cadastro de peça nova (INSERT) continua liberado para vendedor, só editar
-- e excluir uma peça já existente ficam restritos a admin.
drop policy if exists "Vestidos update crm" on public.vestidos;
create policy "Vestidos update admin" on public.vestidos
  for update to authenticated using (public.has_role(auth.uid(), 'admin'));

-- Taxas (config_financeiro): já era admin-only em INSERT/UPDATE, sem policy
-- de DELETE (bloqueado por padrão do RLS) — confirmando que já está correto,
-- nenhuma mudança necessária aqui.
