GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.can_read_crm(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_write_crm(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_read_socios(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_own_funcionario(uuid, text) TO authenticated;