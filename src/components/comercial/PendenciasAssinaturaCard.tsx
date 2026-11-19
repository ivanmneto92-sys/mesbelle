import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, AlertTriangle, FileSignature } from "lucide-react";
import { usePendenciasAssinatura } from "@/hooks/usePendenciasAssinatura";
import { tempoRestante } from "@/lib/assinaturaVenda";

const fmtBRL = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 0 });

/**
 * Alerta de vendas que ainda dependem da assinatura do contrato. Só aparece
 * quando há pendência. Vermelho quando alguma reserva vence em menos de 12h
 * ou há venda antiga sem assinatura.
 */
export function PendenciasAssinaturaCard({ contratosUrl }: { contratosUrl: string }) {
  const { pendencias, total, valorTotal } = usePendenciasAssinatura();
  if (total === 0) return null;

  const urgente = pendencias.some((p) =>
    p.tipo === "legado" || (p.reservaExpiraEm && new Date(p.reservaExpiraEm).getTime() - Date.now() < 12 * 3_600_000),
  );

  return (
    <Card className={urgente ? "border-red-300 bg-red-50/60" : "border-amber-300 bg-amber-50/60"}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <CardTitle className="text-base font-serif flex items-center gap-2">
            {urgente ? <AlertTriangle className="h-4 w-4 text-red-600" /> : <Clock className="h-4 w-4 text-amber-600" />}
            {total} venda{total > 1 ? "s" : ""} aguardando assinatura · {fmtBRL(valorTotal)}
          </CardTitle>
          <Button asChild size="sm">
            <Link to={contratosUrl}><FileSignature className="h-4 w-4 mr-1" /> Coletar assinaturas</Link>
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          A venda só fecha (e só entra no financeiro e na comissão) com o contrato assinado. Sem assinatura em 48h, a peça é liberada.
        </p>
      </CardHeader>
      <CardContent className="pt-0">
        <ul className="divide-y divide-border/60 text-sm">
          {pendencias.slice(0, 6).map((p) => (
            <li key={p.negocioId} className="py-1.5 flex items-center justify-between gap-3">
              <span className="truncate">
                <strong>{p.clienteNome}</strong>
                {p.vestidoNome ? <span className="text-muted-foreground"> · {p.vestidoNome}</span> : null}
              </span>
              <span className={`text-xs whitespace-nowrap ${p.tipo === "legado" ? "text-red-700" : "text-amber-800"}`}>
                {p.tipo === "legado" ? "venda antiga sem assinatura" : tempoRestante(p.reservaExpiraEm)} · {fmtBRL(p.valor)}
              </span>
            </li>
          ))}
        </ul>
        {total > 6 && <p className="text-xs text-muted-foreground mt-1">+ {total - 6} outras</p>}
      </CardContent>
    </Card>
  );
}
