-- Função pública para receber avaliações de clientes via QR Code (sem auth)
CREATE OR REPLACE FUNCTION public.submeter_avaliacao_publica(
  _funcionario_id uuid,
  _nota integer,
  _comentario text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _id uuid;
BEGIN
  IF _nota IS NULL OR _nota < 1 OR _nota > 5 THEN
    RETURN jsonb_build_object('ok', false, 'error', 'nota_invalida');
  END IF;

  IF _comentario IS NOT NULL AND length(_comentario) > 500 THEN
    RETURN jsonb_build_object('ok', false, 'error', 'comentario_muito_longo');
  END IF;

  IF _funcionario_id IS NOT NULL THEN
    IF NOT EXISTS (SELECT 1 FROM public.funcionarios WHERE id = _funcionario_id AND ativo = true) THEN
      RETURN jsonb_build_object('ok', false, 'error', 'funcionario_invalido');
    END IF;
  END IF;

  INSERT INTO public.avaliacoes_clientes (funcionario_id, data, nota, comentario)
  VALUES (
    COALESCE(_funcionario_id, '00000000-0000-0000-0000-000000000000'::uuid),
    CURRENT_DATE,
    _nota,
    NULLIF(trim(_comentario), '')
  )
  RETURNING id INTO _id;

  RETURN jsonb_build_object('ok', true, 'id', _id);
END;
$$;

-- Permite chamada anônima da RPC (a função valida internamente)
GRANT EXECUTE ON FUNCTION public.submeter_avaliacao_publica(uuid, integer, text) TO anon, authenticated;

-- Função pública para listar vendedores ativos (apenas id e nome) para o seletor do formulário
CREATE OR REPLACE FUNCTION public.listar_vendedores_publico()
RETURNS TABLE(id uuid, nome text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id, nome FROM public.funcionarios
  WHERE ativo = true AND (cargo = 'Vendedora' OR cargo = 'Atendente')
  ORDER BY nome;
$$;

GRANT EXECUTE ON FUNCTION public.listar_vendedores_publico() TO anon, authenticated;

-- Permite funcionario_id ser nulo (avaliação geral, sem vendedor específico)
ALTER TABLE public.avaliacoes_clientes ALTER COLUMN funcionario_id DROP NOT NULL;