CREATE TABLE public.permissoes_config (
  id smallint PRIMARY KEY DEFAULT 1,
  vendedor jsonb NOT NULL,
  socio jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT permissoes_singleton CHECK (id = 1)
);

ALTER TABLE public.permissoes_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Permissoes read auth"
  ON public.permissoes_config FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "Permissoes insert admin"
  ON public.permissoes_config FOR INSERT
  TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Permissoes update admin"
  ON public.permissoes_config FOR UPDATE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_permissoes_config_updated_at
  BEFORE UPDATE ON public.permissoes_config
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.permissoes_config (id, vendedor, socio) VALUES (
  1,
  '{"dashboard":true,"crm":true,"comercial":true,"acervo":true,"logistica":true,"financeiro":false,"equipe":false,"socios":false,"comissoes":true,"rankingEquipe":false,"distribuicaoLucros":false}'::jsonb,
  '{"dashboard":true,"crm":false,"comercial":false,"acervo":false,"logistica":false,"financeiro":true,"equipe":false,"socios":true,"comissoes":false,"rankingEquipe":false,"distribuicaoLucros":true}'::jsonb
);

ALTER PUBLICATION supabase_realtime ADD TABLE public.permissoes_config;
ALTER TABLE public.permissoes_config REPLICA IDENTITY FULL;