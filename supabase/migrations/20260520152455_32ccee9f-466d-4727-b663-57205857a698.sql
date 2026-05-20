
-- ============ Funcionários / Equipe ============
CREATE TABLE public.funcionarios (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  cargo TEXT NOT NULL DEFAULT '',
  tipo_contrato TEXT NOT NULL DEFAULT 'CLT',
  percentual_comissao NUMERIC NOT NULL DEFAULT 0,
  ativo BOOLEAN NOT NULL DEFAULT true,
  telefone TEXT,
  email TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.funcionarios ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Funcionarios read auth" ON public.funcionarios FOR SELECT TO authenticated USING (true);
CREATE POLICY "Funcionarios write crm" ON public.funcionarios FOR INSERT TO authenticated WITH CHECK (public.can_write_crm(auth.uid()));
CREATE POLICY "Funcionarios update crm" ON public.funcionarios FOR UPDATE TO authenticated USING (public.can_write_crm(auth.uid()));
CREATE POLICY "Funcionarios delete admin" ON public.funcionarios FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.vendas_funcionarios (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  funcionario_id UUID NOT NULL,
  mes TEXT NOT NULL,
  quantidade INTEGER NOT NULL DEFAULT 0,
  valor_total NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (funcionario_id, mes)
);
ALTER TABLE public.vendas_funcionarios ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Vendas read auth" ON public.vendas_funcionarios FOR SELECT TO authenticated USING (true);
CREATE POLICY "Vendas write crm" ON public.vendas_funcionarios FOR INSERT TO authenticated WITH CHECK (public.can_write_crm(auth.uid()));
CREATE POLICY "Vendas update crm" ON public.vendas_funcionarios FOR UPDATE TO authenticated USING (public.can_write_crm(auth.uid()));
CREATE POLICY "Vendas delete admin" ON public.vendas_funcionarios FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.avaliacoes_clientes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  funcionario_id UUID NOT NULL,
  data DATE NOT NULL,
  nota INTEGER NOT NULL,
  comentario TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.avaliacoes_clientes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Avaliacoes read auth" ON public.avaliacoes_clientes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Avaliacoes write crm" ON public.avaliacoes_clientes FOR INSERT TO authenticated WITH CHECK (public.can_write_crm(auth.uid()));
CREATE POLICY "Avaliacoes update crm" ON public.avaliacoes_clientes FOR UPDATE TO authenticated USING (public.can_write_crm(auth.uid()));
CREATE POLICY "Avaliacoes delete admin" ON public.avaliacoes_clientes FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- ============ Financeiro ============
CREATE TABLE public.transacoes_financeiras (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tipo TEXT NOT NULL,
  data DATE NOT NULL,
  descricao TEXT NOT NULL DEFAULT '',
  categoria TEXT NOT NULL DEFAULT 'Outros',
  valor NUMERIC NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pago',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.transacoes_financeiras ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Transacoes read auth" ON public.transacoes_financeiras FOR SELECT TO authenticated USING (true);
CREATE POLICY "Transacoes write admin" ON public.transacoes_financeiras FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Transacoes update admin" ON public.transacoes_financeiras FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Transacoes delete admin" ON public.transacoes_financeiras FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.config_financeiro (
  id INTEGER PRIMARY KEY DEFAULT 1,
  simples_nacional NUMERIC NOT NULL DEFAULT 6,
  iss NUMERIC NOT NULL DEFAULT 5,
  debito NUMERIC NOT NULL DEFAULT 1.5,
  credito_vista NUMERIC NOT NULL DEFAULT 3.2,
  credito_parcelado NUMERIC NOT NULL DEFAULT 4.8,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT singleton CHECK (id = 1)
);
ALTER TABLE public.config_financeiro ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ConfigFin read auth" ON public.config_financeiro FOR SELECT TO authenticated USING (true);
CREATE POLICY "ConfigFin write admin" ON public.config_financeiro FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "ConfigFin update admin" ON public.config_financeiro FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- ============ Acervo ============
CREATE TABLE public.vestidos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  cor TEXT NOT NULL DEFAULT '',
  tamanho TEXT NOT NULL DEFAULT '',
  comprimento TEXT NOT NULL DEFAULT '',
  preco_aluguel NUMERIC NOT NULL DEFAULT 0,
  preco_venda NUMERIC NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'disponivel',
  is_consignado BOOLEAN NOT NULL DEFAULT false,
  imagem_url TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.vestidos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Vestidos read auth" ON public.vestidos FOR SELECT TO authenticated USING (true);
CREATE POLICY "Vestidos write crm" ON public.vestidos FOR INSERT TO authenticated WITH CHECK (public.can_write_crm(auth.uid()));
CREATE POLICY "Vestidos update crm" ON public.vestidos FOR UPDATE TO authenticated USING (public.can_write_crm(auth.uid()));
CREATE POLICY "Vestidos delete admin" ON public.vestidos FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.reservas_agenda (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  vestido_id UUID NOT NULL,
  data_inicio DATE NOT NULL,
  data_fim DATE NOT NULL,
  status_reserva TEXT NOT NULL DEFAULT 'aluguel',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.reservas_agenda ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Reservas read auth" ON public.reservas_agenda FOR SELECT TO authenticated USING (true);
CREATE POLICY "Reservas write crm" ON public.reservas_agenda FOR INSERT TO authenticated WITH CHECK (public.can_write_crm(auth.uid()));
CREATE POLICY "Reservas update crm" ON public.reservas_agenda FOR UPDATE TO authenticated USING (public.can_write_crm(auth.uid()));
CREATE POLICY "Reservas delete admin" ON public.reservas_agenda FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.producoes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  titulo_vestido TEXT NOT NULL DEFAULT '',
  cliente_nome TEXT NOT NULL DEFAULT '',
  data_prazo DATE,
  data_prova DATE,
  status_geral TEXT NOT NULL DEFAULT 'em_producao',
  ref_imagens_urls TEXT[] NOT NULL DEFAULT '{}',
  notas_tecnicas TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.producoes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Producoes read auth" ON public.producoes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Producoes write crm" ON public.producoes FOR INSERT TO authenticated WITH CHECK (public.can_write_crm(auth.uid()));
CREATE POLICY "Producoes update crm" ON public.producoes FOR UPDATE TO authenticated USING (public.can_write_crm(auth.uid()));
CREATE POLICY "Producoes delete admin" ON public.producoes FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.etapas_producao (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  producao_id UUID NOT NULL,
  nome_etapa TEXT NOT NULL,
  is_concluido BOOLEAN NOT NULL DEFAULT false,
  ordem INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.etapas_producao ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Etapas read auth" ON public.etapas_producao FOR SELECT TO authenticated USING (true);
CREATE POLICY "Etapas write crm" ON public.etapas_producao FOR INSERT TO authenticated WITH CHECK (public.can_write_crm(auth.uid()));
CREATE POLICY "Etapas update crm" ON public.etapas_producao FOR UPDATE TO authenticated USING (public.can_write_crm(auth.uid()));
CREATE POLICY "Etapas delete admin" ON public.etapas_producao FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- ============ Logística ============
CREATE TABLE public.alugueis_logistica (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  vestido_nome TEXT NOT NULL DEFAULT '',
  cliente_nome TEXT NOT NULL DEFAULT '',
  cliente_telefone TEXT NOT NULL DEFAULT '',
  endereco_entrega TEXT NOT NULL DEFAULT '',
  data_saida DATE NOT NULL,
  data_retorno DATE NOT NULL,
  status_logistica TEXT NOT NULL DEFAULT 'para_enviar',
  codigo_rastreio TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.alugueis_logistica ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Alugueis read auth" ON public.alugueis_logistica FOR SELECT TO authenticated USING (true);
CREATE POLICY "Alugueis write crm" ON public.alugueis_logistica FOR INSERT TO authenticated WITH CHECK (public.can_write_crm(auth.uid()));
CREATE POLICY "Alugueis update crm" ON public.alugueis_logistica FOR UPDATE TO authenticated USING (public.can_write_crm(auth.uid()));
CREATE POLICY "Alugueis delete admin" ON public.alugueis_logistica FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- ============ Sócios / Patrimônio ============
CREATE TABLE public.ativos_patrimonio (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  categoria TEXT NOT NULL DEFAULT 'Vestido',
  data_compra DATE NOT NULL,
  valor_original NUMERIC NOT NULL DEFAULT 0,
  percentual_desagio NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.ativos_patrimonio ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Ativos read auth" ON public.ativos_patrimonio FOR SELECT TO authenticated USING (true);
CREATE POLICY "Ativos write admin" ON public.ativos_patrimonio FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Ativos update admin" ON public.ativos_patrimonio FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Ativos delete admin" ON public.ativos_patrimonio FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.socios_empresa (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  percentual_participacao NUMERIC NOT NULL DEFAULT 0,
  ativo BOOLEAN NOT NULL DEFAULT true,
  data_expiracao DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.socios_empresa ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Socios read auth" ON public.socios_empresa FOR SELECT TO authenticated USING (true);
CREATE POLICY "Socios write admin" ON public.socios_empresa FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Socios update admin" ON public.socios_empresa FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Socios delete admin" ON public.socios_empresa FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.config_socios (
  id INTEGER PRIMARY KEY DEFAULT 1,
  multiplicador NUMERIC NOT NULL DEFAULT 3.5,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT singleton_socios CHECK (id = 1)
);
ALTER TABLE public.config_socios ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ConfigSoc read auth" ON public.config_socios FOR SELECT TO authenticated USING (true);
CREATE POLICY "ConfigSoc write admin" ON public.config_socios FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "ConfigSoc update admin" ON public.config_socios FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- triggers updated_at
CREATE TRIGGER trg_funcionarios_updated BEFORE UPDATE ON public.funcionarios FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_vestidos_updated BEFORE UPDATE ON public.vestidos FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_producoes_updated BEFORE UPDATE ON public.producoes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_alugueis_updated BEFORE UPDATE ON public.alugueis_logistica FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_socios_updated BEFORE UPDATE ON public.socios_empresa FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_configfin_updated BEFORE UPDATE ON public.config_financeiro FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_configsoc_updated BEFORE UPDATE ON public.config_socios FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- seed singletons
INSERT INTO public.config_financeiro (id) VALUES (1) ON CONFLICT (id) DO NOTHING;
INSERT INTO public.config_socios (id) VALUES (1) ON CONFLICT (id) DO NOTHING;
