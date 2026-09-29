-- Pedido do usuário: o portal do vendedor (Minha Métricas / Meu Painel)
-- precisa mostrar o extrato de comissão dele (normal + ajuste retroativo +
-- bônus) e quanto tem a receber. transacoes_financeiras hoje é 100%
-- admin-only (nem SELECT o vendedor tinha) — sem RLS liberando, o vendedor
-- não consegue ler nem os próprios lançamentos de comissão.
--
-- Libera SELECT só para as 3 categorias de comissão (comissao,
-- ajuste_comissao, bonus_comissao) e só para linhas ligadas a negócios do
-- próprio vendedor — nunca taxa_cartao/imposto/venda ou comissão de outra
-- pessoa, que continuam admin-only.
create policy "Transacoes read propria comissao vendedor" on public.transacoes_financeiras
  for select to authenticated
  using (
    has_role(auth.uid(), 'vendedor'::app_role)
    and categoria in ('comissao', 'ajuste_comissao', 'bonus_comissao')
    and negocio_id in (select id from public.negocios where vendedor_id = auth.uid())
  );
