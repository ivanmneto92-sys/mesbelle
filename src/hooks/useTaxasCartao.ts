import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { BandeiraCartao } from "@/types/venda";

// parcelas: 0 = Débito; 1-18 = parcelas do crédito.
export type TaxaCartaoMap = Record<string, number>; // chave: `${bandeira}:${parcelas}`

const chave = (bandeira: BandeiraCartao, parcelas: number) => `${bandeira}:${parcelas}`;

/**
 * Tabela real de taxas de cartão (Débito + 1x-18x, Visa/Master vs Elo) —
 * usada na tela de venda pra calcular, em tempo real, quanto a loja recebe
 * líquido conforme a vendedora escolhe bandeira e parcelas. A mesma taxa é
 * aplicada pela trigger fn_negocio_aprovado_gera_transacao ao gerar o
 * lançamento de "taxa_cartao" no Financeiro.
 */
export function useTaxasCartao() {
  const [taxas, setTaxas] = useState<TaxaCartaoMap>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      const { data } = await supabase.from("taxas_cartao").select("bandeira, parcelas, taxa_percentual");
      if (!active) return;
      if (data) {
        const map: TaxaCartaoMap = {};
        for (const row of data as { bandeira: string; parcelas: number; taxa_percentual: number }[]) {
          map[chave(row.bandeira as BandeiraCartao, row.parcelas)] = Number(row.taxa_percentual);
        }
        setTaxas(map);
      }
      setLoading(false);
    })();
    return () => { active = false; };
  }, []);

  const getTaxa = (bandeira: BandeiraCartao | null, parcelas: number): number | null => {
    if (!bandeira) return null;
    const pct = taxas[chave(bandeira, parcelas)];
    return pct === undefined ? null : pct;
  };

  return { taxas, getTaxa, loading };
}
