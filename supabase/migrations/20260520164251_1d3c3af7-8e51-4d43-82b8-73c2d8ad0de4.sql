-- Add fields for online signing
ALTER TABLE public.contratos
  ADD COLUMN IF NOT EXISTS email_cliente text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS signing_token uuid UNIQUE,
  ADD COLUMN IF NOT EXISTS token_expires_at timestamp with time zone,
  ADD COLUMN IF NOT EXISTS ip_assinatura text,
  ADD COLUMN IF NOT EXISTS user_agent_assinatura text;

CREATE INDEX IF NOT EXISTS idx_contratos_signing_token ON public.contratos(signing_token) WHERE signing_token IS NOT NULL;

-- Public read by token (no auth)
CREATE OR REPLACE FUNCTION public.get_contrato_by_token(_token uuid)
RETURNS TABLE (
  id uuid, numero text, nome_cliente text, cpf_cliente text,
  data_evento text, valor_total numeric, termos_texto text,
  status_assinatura text, assinatura_base64 text, data_assinatura timestamp with time zone,
  token_expires_at timestamp with time zone
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT c.id, c.numero, c.nome_cliente, c.cpf_cliente, c.data_evento, c.valor_total,
         c.termos_texto, c.status_assinatura, c.assinatura_base64, c.data_assinatura, c.token_expires_at
  FROM public.contratos c
  WHERE c.signing_token = _token
    AND (c.token_expires_at IS NULL OR c.token_expires_at > now())
  LIMIT 1
$$;

-- Public sign (no auth)
CREATE OR REPLACE FUNCTION public.assinar_contrato_publico(
  _token uuid,
  _assinatura text,
  _ip text,
  _user_agent text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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

  IF _assinatura IS NULL OR length(_assinatura) < 100 THEN
    RETURN jsonb_build_object('ok', false, 'error', 'assinatura_invalida');
  END IF;

  UPDATE public.contratos
  SET status_assinatura = 'assinado',
      assinatura_base64 = _assinatura,
      data_assinatura = now(),
      ip_assinatura = _ip,
      user_agent_assinatura = left(coalesce(_user_agent, ''), 500)
  WHERE id = _contrato_id;

  RETURN jsonb_build_object('ok', true, 'contrato_id', _contrato_id);
END;
$$;

-- Grant execute to anon (public access via link)
GRANT EXECUTE ON FUNCTION public.get_contrato_by_token(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.assinar_contrato_publico(uuid, text, text, text) TO anon, authenticated;