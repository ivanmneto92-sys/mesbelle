-- Permite excluir um funcionário (auth.users) sem falhar por violação de FK:
-- leads/negócios/contratos referenciados por ele voltam a ficar sem dono
-- (NULL), o que já é tratado pela RLS NULL-tolerante como visível a
-- qualquer vendedor — mesmo comportamento de registros legados.
ALTER TABLE public.leads
  DROP CONSTRAINT IF EXISTS leads_criado_por_fkey,
  ADD CONSTRAINT leads_criado_por_fkey
    FOREIGN KEY (criado_por) REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE public.leads
  DROP CONSTRAINT IF EXISTS leads_atendido_por_fkey,
  ADD CONSTRAINT leads_atendido_por_fkey
    FOREIGN KEY (atendido_por) REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE public.negocios
  DROP CONSTRAINT IF EXISTS negocios_vendedor_id_fkey,
  ADD CONSTRAINT negocios_vendedor_id_fkey
    FOREIGN KEY (vendedor_id) REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE public.contratos
  DROP CONSTRAINT IF EXISTS contratos_vendedor_id_fkey,
  ADD CONSTRAINT contratos_vendedor_id_fkey
    FOREIGN KEY (vendedor_id) REFERENCES auth.users(id) ON DELETE SET NULL;
