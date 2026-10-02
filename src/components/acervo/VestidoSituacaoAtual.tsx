import { format, parseISO } from "date-fns";
import { Loader2, User, CalendarRange, CheckCircle2 } from "lucide-react";
import { SituacaoVestido } from "@/hooks/useVestidoSituacao";

interface Props {
  situacao: SituacaoVestido | null;
  loading: boolean;
}

const ETAPA_LABELS: Record<string, string> = {
  // Jornada do Aluguel normal
  "Envio à Costureira": "Na costureira",
  "Ajustes": "Em ajustes",
  "Pronto para a Loja": "Pronta, aguardando prova",
  "Agendar Prova": "Aguardando prova",
  "Retirada": "Aguardando retirada",
  "Devolução": "Aguardando devolução",
  "Envio à Lavanderia": "A caminho da lavanderia",
  "Na Lavanderia": "Na lavanderia",
  // Jornada do Primeiro Aluguel
  "Aprovação de Amostra": "Aguardando aprovação da amostra",
  "Compra de Material": "Comprando material",
  "Modelista": "Na modelista",
  "Bordadeira": "Na costureira/bordadeira",
  "Primeira Prova": "Aguardando primeira prova",
  "Segunda Prova": "Aguardando segunda prova",
  "Entrega Final": "Pronta para entrega",
};

export function VestidoSituacaoAtual({ situacao, loading }: Props) {
  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground py-3">
        <Loader2 className="h-4 w-4 animate-spin" /> Carregando situação atual...
      </div>
    );
  }

  if (!situacao || situacao.tipo === "disponivel") {
    return (
      <div className="rounded-lg border border-success/30 bg-success/5 px-3 py-2.5 flex items-center gap-2">
        <CheckCircle2 className="h-4 w-4 text-success shrink-0" />
        <p className="text-sm text-success font-medium">Disponível — nenhum aluguel em andamento</p>
      </div>
    );
  }

  const hoje = new Date().toISOString().slice(0, 10);
  const aindaNaoRetirada = situacao.dataRetirada ? situacao.dataRetirada > hoje : false;
  const etapaLabel = situacao.etapaAtual ? ETAPA_LABELS[situacao.etapaAtual] ?? situacao.etapaAtual : null;

  return (
    <div className="rounded-lg border border-warning/30 bg-warning/5 px-3 py-2.5 space-y-1.5">
      <p className="text-sm font-semibold text-warning">
        {aindaNaoRetirada ? "Reservada — retirada em breve" : "Alugada no momento"}
        {situacao.tipo === "primeiro_aluguel" && " (Primeiro Aluguel)"}
      </p>
      {situacao.clienteNome && (
        <p className="text-xs text-foreground flex items-center gap-1.5">
          <User className="h-3.5 w-3.5 text-muted-foreground shrink-0" /> {situacao.clienteNome}
        </p>
      )}
      {(situacao.dataRetirada || situacao.dataDevolucao) && (
        <p className="text-xs text-muted-foreground flex items-center gap-1.5">
          <CalendarRange className="h-3.5 w-3.5 shrink-0" />
          {situacao.dataRetirada && format(parseISO(situacao.dataRetirada), "dd/MM/yyyy")}
          {" → "}
          {situacao.dataDevolucao && format(parseISO(situacao.dataDevolucao), "dd/MM/yyyy")}
        </p>
      )}
      {etapaLabel && !situacao.jornadaConcluida && (
        <p className="text-xs font-medium text-primary">📍 {etapaLabel}</p>
      )}
    </div>
  );
}
