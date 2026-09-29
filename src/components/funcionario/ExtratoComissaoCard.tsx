import { Percent, TrendingUp, Gift } from "lucide-react";
import { GrupoComissao, CategoriaComissao } from "@/hooks/useExtratoComissao";
import { formatBRL } from "@/lib/formatters";
import { cn } from "@/lib/utils";

const ITEM_ESTILO: Record<CategoriaComissao, { icon: typeof Percent; cor: string; bg: string }> = {
  comissao: { icon: Percent, cor: "text-primary", bg: "bg-primary/10" },
  ajuste_comissao: { icon: TrendingUp, cor: "text-warning", bg: "bg-warning/15" },
  bonus_comissao: { icon: Gift, cor: "text-success", bg: "bg-success/15" },
};

function explicacao(categoria: CategoriaComissao, valor: number, valorVenda: number | null): string {
  if (categoria === "comissao") {
    if (valorVenda && valorVenda > 0) {
      const pct = (valor / valorVenda) * 100;
      return `${pct.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}% de comissão sobre esta venda`;
    }
    return "Comissão desta venda";
  }
  if (categoria === "ajuste_comissao") {
    return "Sua faixa de comissão subiu neste mês — diferença aplicada retroativamente a esta venda";
  }
  return "Bônus por bater R$ 40.000 em vendas no mês 🎉";
}

const ITEM_LABEL: Record<CategoriaComissao, string> = {
  comissao: "Comissão da venda",
  ajuste_comissao: "Ajuste de faixa",
  bonus_comissao: "Bônus de faturamento",
};

interface Props {
  grupo: GrupoComissao;
}

export function ExtratoComissaoCard({ grupo }: Props) {
  const titulo = grupo.vestidoNome || grupo.clienteNome || "Venda";
  const temMultiplosItens = grupo.itens.length > 1;

  return (
    <div className="rounded-xl border p-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold">{titulo}</p>
          <p className="text-xs text-muted-foreground">
            {grupo.clienteNome && grupo.vestidoNome ? grupo.clienteNome + " • " : ""}
            {new Date(grupo.data + "T00:00:00").toLocaleDateString("pt-BR")}
          </p>
        </div>
        <p className="text-base font-bold tabular-nums text-success whitespace-nowrap">
          + {formatBRL(grupo.total)}
        </p>
      </div>

      <div className={cn("space-y-2", temMultiplosItens && "pt-1 border-t")}>
        {grupo.itens.map((item) => {
          const estilo = ITEM_ESTILO[item.categoria];
          const Icon = estilo.icon;
          return (
            <div key={item.id} className="flex items-start gap-2.5">
              <div className={cn("h-6 w-6 rounded-full flex items-center justify-center shrink-0 mt-0.5", estilo.bg)}>
                <Icon className={cn("h-3.5 w-3.5", estilo.cor)} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-medium">{ITEM_LABEL[item.categoria]}</span>
                  <span className={cn("text-xs font-semibold tabular-nums shrink-0", estilo.cor)}>
                    + {formatBRL(item.valor)}
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground leading-tight mt-0.5">
                  {explicacao(item.categoria, item.valor, grupo.valorVenda)}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
