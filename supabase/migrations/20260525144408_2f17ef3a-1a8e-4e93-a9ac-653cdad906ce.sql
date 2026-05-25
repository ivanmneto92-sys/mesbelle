-- 1. Remove permissoes_config from realtime publication to avoid broadcasting
--    sensitive config changes to every authenticated subscriber.
ALTER PUBLICATION supabase_realtime DROP TABLE public.permissoes_config;

-- 2. Lock down internal SECURITY DEFINER helpers so they cannot be invoked
--    directly via the PostgREST API by anon or authenticated roles.
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.can_read_crm(uuid) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.can_write_crm(uuid) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.can_read_socios(uuid) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.is_own_funcionario(uuid, text) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated, public;

-- 3. Ensure the intentionally public RPCs remain callable.
GRANT EXECUTE ON FUNCTION public.get_contrato_by_token(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.assinar_contrato_publico(uuid, text, text, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.submeter_avaliacao_publica(uuid, integer, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.listar_vendedores_publico() TO anon, authenticated;