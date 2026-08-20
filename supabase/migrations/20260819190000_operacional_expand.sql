-- Adiciona SKU, categoria e metadados operacionais em vestidos.
-- status_peca não é criado: a tabela já tem uma coluna `status` (default 'disponivel')
-- com a mesma finalidade — reutilizada em vez de duplicada.
-- valor_locacao_padrao não é criado: `preco_aluguel` já cobre esse valor.
ALTER TABLE vestidos
  ADD COLUMN IF NOT EXISTS sku TEXT UNIQUE DEFAULT NULL,
  -- Formato: MB-VES-0001 | MB-ACE-0001 | MB-SAP-0001 | MB-CON-0001 | MB-OUT-0001
  ADD COLUMN IF NOT EXISTS categoria_peca TEXT NOT NULL DEFAULT 'vestido',
  -- 'vestido' | 'acessorio' | 'sapato' | 'conjunto' | 'outros'
  ADD COLUMN IF NOT EXISTS descricao TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS qtd_total_locacoes INTEGER NOT NULL DEFAULT 0;
  -- denormalização para queries rápidas; não há trigger de incremento automático
  -- pois não existe hoje um vínculo FK entre alugueis_logistica e vestidos.

CREATE INDEX IF NOT EXISTS idx_vestidos_sku        ON vestidos(sku);
CREATE INDEX IF NOT EXISTS idx_vestidos_status     ON vestidos(status);
CREATE INDEX IF NOT EXISTS idx_vestidos_categoria  ON vestidos(categoria_peca);

-- SKU automático via trigger (fallback; a aplicação também pode gerar)
CREATE OR REPLACE FUNCTION gerar_sku_vestido()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
  prefixo TEXT;
  proximo  INTEGER;
BEGIN
  IF NEW.sku IS NOT NULL THEN RETURN NEW; END IF;
  prefixo := CASE NEW.categoria_peca
    WHEN 'vestido'    THEN 'VES'
    WHEN 'acessorio'  THEN 'ACE'
    WHEN 'sapato'     THEN 'SAP'
    WHEN 'conjunto'   THEN 'CON'
    ELSE 'OUT'
  END;
  SELECT COALESCE(MAX(CAST(SPLIT_PART(sku, '-', 3) AS INTEGER)), 0) + 1
    INTO proximo
    FROM vestidos
   WHERE sku LIKE 'MB-' || prefixo || '-%';
  NEW.sku := 'MB-' || prefixo || '-' || LPAD(proximo::TEXT, 4, '0');
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sku_vestido ON vestidos;
CREATE TRIGGER trg_sku_vestido
  BEFORE INSERT ON vestidos
  FOR EACH ROW EXECUTE FUNCTION gerar_sku_vestido();
