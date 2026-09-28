-- Permite que o negócio (e o contrato gerado a partir dele) reflita dados de
-- uma pessoa diferente do lead cadastrado — ex: contrato em nome de outra
-- pessoa. cliente_nome/cliente_cpf já existiam com esse propósito (podem
-- divergir do lead); faltavam telefone/e-mail equivalentes, então o
-- contrato sempre puxava o telefone/e-mail do lead original.
alter table public.negocios
  add column if not exists cliente_telefone text,
  add column if not exists cliente_email text;
