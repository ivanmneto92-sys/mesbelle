import { EtapaJornadaAluguel, JornadaAluguelItem } from "@/types/logistica";
import { Card, CardContent } from "@/components/ui/card";
import { format, subDays, parseISO } from "date-fns";
import { AluguelJornada } from "./AluguelJornada";

interface Props {
  item: JornadaAluguelItem;
  etapas: EtapaJornadaAluguel[];
  canManage: boolean;
  onToggleEtapa: (etapaId: string) => void;
}

export function AluguelCard({ item, etapas, canManage, onToggleEtapa }: Props) {
  const prazoCostureira = format(subDays(parseISO(item.dataRetirada), 14), "dd/MM/yyyy");

  return (
    <Card className="border-border/50">
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="font-semibold font-serif">{item.vestidoNome} — Cliente {item.clienteNome}</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Costureira até: {prazoCostureira} • Retirada: {format(parseISO(item.dataRetirada), "dd/MM/yyyy")} • Devolução: {format(parseISO(item.dataDevolucao), "dd/MM/yyyy")}
            </p>
          </div>
        </div>

        <AluguelJornada etapas={etapas} canManage={canManage} onToggleEtapa={onToggleEtapa} />
      </CardContent>
    </Card>
  );
}
