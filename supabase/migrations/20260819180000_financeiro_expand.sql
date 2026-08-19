-- Adiciona classificação de custo fixo/variável e vínculo opcional com cliente nas transações financeiras
ALTER TABLE transacoes_financeiras
  ADD COLUMN IF NOT EXISTS tipo_custo TEXT DEFAULT NULL,
  -- 'fixo' | 'variavel' | NULL (para receitas)
  ADD COLUMN IF NOT EXISTS lead_id UUID REFERENCES leads(id) ON DELETE SET NULL DEFAULT NULL,
  -- vínculo opcional com um lead (para rastrear pagamentos por cliente)
  ADD COLUMN IF NOT EXISTS observacoes TEXT DEFAULT NULL;

-- categoria já existe na tabela (text, default 'Outros') — não recriada.

CREATE INDEX IF NOT EXISTS idx_transacoes_lead_id ON transacoes_financeiras(lead_id);
CREATE INDEX IF NOT EXISTS idx_transacoes_data ON transacoes_financeiras(data);
