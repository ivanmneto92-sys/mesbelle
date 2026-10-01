-- Pedido do usuário: (1) criar categoria "Bolsa" no acervo (hoje só existia
-- Vestido/Acessório/Sapato/Conjunto/Outros — uma bolsa tinha que ser
-- cadastrada como Acessório, sem SKU próprio); (2) permitir até 10 fotos
-- por peça (hoje só uma foto, imagem_url).

-- categoria_peca já é TEXT livre (sem CHECK constraint) — só precisa
-- ensinar o gerador de SKU sobre o novo prefixo.
CREATE OR REPLACE FUNCTION gerar_sku_vestido()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
  prefixo TEXT;
  proximo  INTEGER;
BEGIN
  IF NEW.sku IS NOT NULL THEN RETURN NEW; END IF;
  prefixo := CASE NEW.categoria_peca
    WHEN 'vestido'    THEN 'VES'
    WHEN 'bolsa'      THEN 'BOL'
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

-- Galeria de fotos (até 10, limite aplicado na aplicação). imagem_url
-- continua existindo como "capa" — sempre a primeira de imagens_urls —
-- porque cards/listas mostram só uma thumbnail e não precisam carregar a
-- galeria inteira.
ALTER TABLE vestidos
  ADD COLUMN IF NOT EXISTS imagens_urls TEXT[] NOT NULL DEFAULT '{}';

-- Backfill: peças que já tinham uma foto única viram uma galeria de 1 foto.
UPDATE vestidos
   SET imagens_urls = ARRAY[imagem_url]
 WHERE imagem_url IS NOT NULL AND imagem_url <> ''
   AND (imagens_urls IS NULL OR array_length(imagens_urls, 1) IS NULL);
