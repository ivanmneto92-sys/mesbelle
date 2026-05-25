CREATE OR REPLACE FUNCTION public.assinar_contrato_publico(_token uuid, _assinatura text, _ip text, _user_agent text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _contrato_id uuid;
  _status text;
BEGIN
  SELECT id, status_assinatura INTO _contrato_id, _status
  FROM public.contratos
  WHERE signing_token = _token
    AND (token_expires_at IS NULL OR token_expires_at > now())
  LIMIT 1;

  IF _contrato_id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'token_invalido_ou_expirado');
  END IF;

  IF _status = 'assinado' THEN
    RETURN jsonb_build_object('ok', false, 'error', 'ja_assinado');
  END IF;

  IF _status = 'cancelado' THEN
    RETURN jsonb_build_object('ok', false, 'error', 'cancelado');
  END IF;

  IF _assinatura IS NULL
     OR length(_assinatura) < 100
     OR length(_assinatura) > 2000000
     OR _assinatura !~ '^data:image/(png|jpeg|jpg|webp);base64,[A-Za-z0-9+/=]+$' THEN
    RETURN jsonb_build_object('ok', false, 'error', 'assinatura_invalida');
  END IF;

  UPDATE public.contratos
  SET status_assinatura = 'assinado',
      assinatura_base64 = _assinatura,
      data_assinatura = now(),
      ip_assinatura = left(coalesce(_ip, ''), 64),
      user_agent_assinatura = left(coalesce(_user_agent, ''), 500)
  WHERE id = _contrato_id;

  RETURN jsonb_build_object('ok', true, 'contrato_id', _contrato_id);
END;
$function$;