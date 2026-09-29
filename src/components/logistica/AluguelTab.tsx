import { EtapaJornadaAluguel, JornadaAluguelItem } from "@/types/logistica";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { AluguelCard } from "./AluguelCard";

type AlertaAluguel = "atrasada" | "nao_iniciada" | null;

function alertaDoAluguel(item: JornadaAluguelItem, etapas: EtapaJornadaAluguel[]): AlertaAluguel {
  if (etapas.length === 0) return null;
  const concluida = etapas.every((e) => e.isConcluido);
  if (concluida) return null;
  const hoje = format(new Date(), "yyyy-MM-dd");
  const retiradaEtapa = etapas.find((e) => e.nomeEtapa === "Retirada");
  const devolucaoEtapa = etapas.find((e) => e.nomeEtapa === "Devolução");
  const retiradaAtrasada = item.dataRetirada < hoje && retiradaEtapa && !retiradaEtapa.isConcluido;
  const devolucaoAtrasada = item.dataDevolucao < hoje && devolucaoEtapa && !devolucaoEtapa.isConcluido;
  if (retiradaAtrasada || devolucaoAtrasada) return "atrasada";
  if (etapas.every((e) => !e.isConcluido)) return "nao_iniciada";
  return null;
}

interface Props {
  itens: JornadaAluguelItem[];
  getEtapas: (reservaId: string) => EtapaJornadaAluguel[];
  canManage: boolean;
  onToggleEtapa: (etapaId: string) => void;
}

export function AluguelTab({ itens, getEtapas, canManage, onToggleEtapa }: Props) {
  const alertas = itens.map((item) => alertaDoAluguel(item, getEtapas(item.reservaId)));
  const qtdAtrasadas = alertas.filter((a) => a === "atrasada").length;
  const qtdNaoIniciadas = alertas.filter((a) => a === "nao_iniciada").length;

  return (
    <>
      {(qtdAtrasadas > 0 || qtdNaoIniciadas > 0) && (
        <Card className="border-destructive/30 bg-destructive/5 mb-4">
          <CardContent className="p-4 flex items-center gap-2 text-sm text-destructive">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <p>
              {qtdAtrasadas > 0 && (
                <>{qtdAtrasadas} aluguel{qtdAtrasadas > 1 ? "éis" : ""} atrasado{qtdAtrasadas > 1 ? "s" : ""}</>
              )}
              {qtdAtrasadas > 0 && qtdNaoIniciadas > 0 && " e "}
              {qtdNaoIniciadas > 0 && (
                <>{qtdNaoIniciadas} sem começar</>
              )}
              {" "}— confira abaixo.
            </p>
          </CardContent>
        </Card>
      )}

      <Card className="border-border/50">
        <CardHeader className="pb-4">
          <CardTitle className="font-serif text-lg">Mapa do Aluguel</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {itens.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">Nenhum aluguel em andamento no momento.</p>
          ) : (
            itens.map((item, i) => (
              <div key={item.reservaId} className="relative">
                {alertas[i] && (
                  <Badge
                    variant="outline"
                    className={cn(
                      "absolute -top-2 right-4 z-[1] text-xs",
                      alertas[i] === "atrasada"
                        ? "bg-destructive text-destructive-foreground border-destructive"
                        : "bg-yellow-500 text-white border-yellow-500",
                    )}
                  >
                    <AlertTriangle className="h-3 w-3 mr-1" />
                    {alertas[i] === "atrasada" ? "Atrasado" : "Sem começar"}
                  </Badge>
                )}
                <AluguelCard
                  item={item}
                  etapas={getEtapas(item.reservaId)}
                  canManage={canManage}
                  onToggleEtapa={onToggleEtapa}
                />
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </>
  );
}
