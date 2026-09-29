-- Pedido do usuário: o menu de Produção passa a ser visível para o
-- funcionário (vendedor), mas só o admin pode mexer nele — mesmo padrão já
-- aplicado ao Acervo. Hoje producoes/etapas_producao liberavam INSERT e
-- UPDATE via can_write_crm (admin OU vendedor); trava os dois para
-- admin-only. DELETE já era admin-only, e a leitura (can_read_crm, admin OU
-- vendedor) continua igual — o funcionário só passa a enxergar a tela.
drop policy if exists "Producoes write crm" on public.producoes;
create policy "Producoes insert admin" on public.producoes
  for insert to authenticated with check (public.has_role(auth.uid(), 'admin'));

drop policy if exists "Producoes update crm" on public.producoes;
create policy "Producoes update admin" on public.producoes
  for update to authenticated using (public.has_role(auth.uid(), 'admin'));

drop policy if exists "Etapas write crm" on public.etapas_producao;
create policy "Etapas insert admin" on public.etapas_producao
  for insert to authenticated with check (public.has_role(auth.uid(), 'admin'));

drop policy if exists "Etapas update crm" on public.etapas_producao;
create policy "Etapas update admin" on public.etapas_producao
  for update to authenticated using (public.has_role(auth.uid(), 'admin'));
