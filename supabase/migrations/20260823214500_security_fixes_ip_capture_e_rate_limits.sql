-- Auditoria de segurança: corrige 3 achados nas funções públicas SECURITY
-- DEFINER (assinar_contrato_publico, submeter_avaliacao_publica) e adiciona
-- rate limit ao fluxo de redefinição de senha.

-- Helper: IP real do cliente, lido da GUC request.headers que o PostgREST
-- popula por requisição. cf-connecting-ip é definido pelo Cloudflare (que
-- fica na frente do Supabase) com base na conexão TCP real — não pode ser
-- forjado pelo chamador, diferente de x-forwarded-for (que é anexável).
-- Confirmado empiricamente antes desta migration via chamada HTTP real.
create or replace function public._client_ip_from_request()
returns text
language sql
stable
set search_path = public
as $$
  select nullif(
    coalesce(
      current_setting('request.headers', true)::json->>'cf-connecting-ip',
      split_part(current_setting('request.headers', true)::json->>'x-forwarded-for', ',', 1)
    ),
    ''
  );
$$;

revoke all on function public._client_ip_from_request() from public, anon, authenticated;

-- assinar_contrato_publico: para de confiar no _ip/_user_agent enviados
-- pelo client (totalmente falsificáveis) e passa a capturar a partir dos
-- headers reais da requisição. Parâmetros mantidos na assinatura por
-- compatibilidade com o frontend atual, mas ignorados.
create or replace function public.assinar_contrato_publico(_token uuid, _assinatura text, _ip text, _user_agent text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
DECLARE
  _contrato_id uuid;
  _status text;
  _ip_real text;
  _ua_real text;
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

  _ip_real := coalesce(public._client_ip_from_request(), _ip);
  _ua_real := coalesce(current_setting('request.headers', true)::json->>'user-agent', _user_agent);

  UPDATE public.contratos
  SET status_assinatura = 'assinado',
      assinatura_base64 = _assinatura,
      data_assinatura = now(),
      ip_assinatura = left(coalesce(_ip_real, ''), 64),
      user_agent_assinatura = left(coalesce(_ua_real, ''), 500)
  WHERE id = _contrato_id;

  RETURN jsonb_build_object('ok', true, 'contrato_id', _contrato_id);
END;
$$;

-- submeter_avaliacao_publica: rate limit de 1 avaliação por IP por
-- funcionário por dia, via hash do IP (não guardamos IP cru de cliente
-- final por minimização de dados). digest() vem da extensão pgcrypto,
-- instalada no schema `extensions` neste projeto.
alter table public.avaliacoes_clientes add column if not exists ip_hash text;

create unique index if not exists avaliacoes_clientes_func_ip_dia_key
  on public.avaliacoes_clientes (coalesce(funcionario_id, '00000000-0000-0000-0000-000000000000'::uuid), ip_hash, data)
  where ip_hash is not null;

create or replace function public.submeter_avaliacao_publica(_funcionario_id uuid, _nota integer, _comentario text)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
DECLARE
  _id uuid;
  _ip_hash text;
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

  _ip_hash := encode(digest(coalesce(public._client_ip_from_request(), ''), 'sha256'), 'hex');

  BEGIN
    INSERT INTO public.avaliacoes_clientes (funcionario_id, data, nota, comentario, ip_hash)
    VALUES (
      COALESCE(_funcionario_id, '00000000-0000-0000-0000-000000000000'::uuid),
      CURRENT_DATE,
      _nota,
      NULLIF(trim(_comentario), ''),
      _ip_hash
    )
    RETURNING id INTO _id;
  EXCEPTION WHEN unique_violation THEN
    RETURN jsonb_build_object('ok', false, 'error', 'ja_avaliado_hoje');
  END;

  RETURN jsonb_build_object('ok', true, 'id', _id);
END;
$$;

-- Rate limit de pedidos de redefinição de senha (checado pela edge function
-- solicitar-redefinicao-senha via service role; sem policies = bloqueado
-- para anon/authenticated por padrão do RLS).
create table if not exists public.password_reset_attempts (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  criado_em timestamptz not null default now()
);
alter table public.password_reset_attempts enable row level security;
create index if not exists password_reset_attempts_email_criado_em_idx
  on public.password_reset_attempts (email, criado_em);
