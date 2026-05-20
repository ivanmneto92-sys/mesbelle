
REVOKE EXECUTE ON FUNCTION public.can_read_crm(uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.can_read_socios(uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.is_own_funcionario(uuid, text) FROM PUBLIC, anon, authenticated;
