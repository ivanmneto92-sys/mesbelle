import {
  PackageOpen, Scissors, Gem, Shirt, Ruler, Sparkles, Gift,
  CircleDot, Undo2, Store, Check, PartyPopper,
} from "lucide-react";
import { EtapaProducao } from "@/types/acervo";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

interface Props {
  etapas: EtapaProducao[];
  canManage: boolean;
  onToggleEtapa: (etapaId: string) => void;
}

const ETAPA_ICONS: Record<string, typeof PackageOpen> = {
  "Compra de Material": PackageOpen,
  "Modelista": Scissors,
  "Bordadeira": Gem,
  "Primeira Prova": Shirt,
  "Ajustes": Ruler,
  "Segunda Prova": Sparkles,
  "Entrega Final": Gift,
};

// Índice (0-based) da etapa "Segunda Prova" — é onde mostramos o ciclo
// opcional de novo ajuste, sem transformá-lo numa etapa obrigatória da
// jornada principal.
const INDICE_SEGUNDA_PROVA = 5;

function iconePara(nomeEtapa: string) {
  return ETAPA_ICONS[nomeEtapa] ?? CircleDot;
}

type EstadoEtapa = "concluida" | "atual" | "pendente";

function estadoDaEtapa(etapas: EtapaProducao[], index: number): EstadoEtapa {
  if (etapas[index].isConcluido) return "concluida";
  const anteriorConcluida = index === 0 || etapas[index - 1].isConcluido;
  return anteriorConcluida ? "atual" : "pendente";
}

const CARD_CLASSES: Record<EstadoEtapa, string> = {
  concluida: "bg-success/5 border-success/30",
  atual: "bg-primary/5 border-primary/40",
  pendente: "bg-muted/30 border-border",
};

const BADGE_CLASSES: Record<EstadoEtapa, string> = {
  concluida: "bg-success text-success-foreground",
  atual: "bg-primary text-primary-foreground",
  pendente: "bg-muted-foreground/30 text-background",
};

const ICON_CIRCLE_CLASSES: Record<EstadoEtapa, string> = {
  concluida: "bg-success/15 text-success",
  atual: "bg-primary/15 text-primary",
  pendente: "bg-muted-foreground/10 text-muted-foreground/50",
};

const LABEL_CLASSES: Record<EstadoEtapa, string> = {
  concluida: "text-foreground",
  atual: "text-foreground font-medium",
  pendente: "text-muted-foreground/60",
};

function Selo({ numero, estado }: { numero: number; estado: EstadoEtapa }) {
  return (
    <div
      className={cn(
        "absolute -top-2 -left-2 h-6 w-6 rounded-full flex items-center justify-center text-[11px] font-semibold border-2 border-background shadow-sm",
        BADGE_CLASSES[estado],
      )}
    >
      {numero}
    </div>
  );
}

function Cartao({
  etapa, numero, estado, canManage, onClick,
}: {
  etapa: EtapaProducao; numero: number; estado: EstadoEtapa; canManage: boolean; onClick: () => void;
}) {
  const Icon = iconePara(etapa.nomeEtapa);
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!canManage}
      className={cn(
        "relative w-24 shrink-0 rounded-2xl border p-3 flex flex-col items-center text-center gap-2 transition-colors",
        CARD_CLASSES[estado],
        canManage ? "cursor-pointer hover:bg-primary/10" : "cursor-default",
      )}
    >
      <Selo numero={numero} estado={estado} />
      <div className={cn("h-11 w-11 rounded-full flex items-center justify-center", ICON_CIRCLE_CLASSES[estado])}>
        {estado === "concluida" ? <Check className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
      </div>
      <span className={cn("text-[11px] leading-tight", LABEL_CLASSES[estado])}>{etapa.nomeEtapa}</span>
      {estado === "concluida" && etapa.updatedAt && (
        <span className="text-[9px] text-muted-foreground/70 tabular-nums">
          {format(new Date(etapa.updatedAt), "dd/MM HH:mm")}
        </span>
      )}
    </button>
  );
}

function Conector({ ativo }: { ativo: boolean }) {
  return (
    <div className="flex-1 flex items-center justify-center min-w-[12px] pt-9">
      <span className={cn("h-1.5 w-1.5 rounded-full", ativo ? "bg-success/60" : "bg-border")} />
    </div>
  );
}

function NovoAjusteCallout({
  modelistaEtapa, canManage, onToggleEtapa,
}: {
  modelistaEtapa: EtapaProducao | undefined; canManage: boolean; onToggleEtapa: (etapaId: string) => void;
}) {
  const modelistaReaberta = modelistaEtapa && !modelistaEtapa.isConcluido;
  const podeReabrir = canManage && !!modelistaEtapa && !modelistaReaberta;

  return (
    <div className="mt-3 rounded-lg border border-dashed border-muted-foreground/25 bg-muted/20 p-3 w-48">
      <span className="text-[9px] font-semibold uppercase tracking-wide text-muted-foreground/70 bg-muted-foreground/10 rounded-full px-2 py-0.5">
        Opcional
      </span>
      <p className="text-xs font-medium leading-snug mt-1.5">Precisou de um novo ajuste?</p>

      {podeReabrir ? (
        <button
          type="button"
          onClick={() => onToggleEtapa(modelistaEtapa!.id)}
          className="flex items-center gap-1.5 mt-1.5 text-[11px] text-primary hover:underline cursor-pointer"
        >
          <Undo2 className="h-3 w-3 shrink-0" />
          <span>Volta à Modelista</span>
        </button>
      ) : (
        <div className={cn("flex items-center gap-1.5 mt-1.5 text-[11px]", modelistaReaberta ? "text-primary" : "text-muted-foreground")}>
          <Undo2 className="h-3 w-3 shrink-0" />
          <span>{modelistaReaberta ? "Voltou para a Modelista" : "Volta à Modelista"}</span>
        </div>
      )}

      <div className="flex items-center gap-1.5 mt-1 text-[11px] text-muted-foreground">
        <Store className="h-3 w-3 shrink-0" />
        <span>Retorno à loja para a entrega</span>
      </div>
    </div>
  );
}

export function ProducaoJornada({ etapas, canManage, onToggleEtapa }: Props) {
  if (etapas.length === 0) return null;

  const concluidas = etapas.filter((e) => e.isConcluido).length;
  const ultimaEtapaConcluida = etapas[etapas.length - 1]?.isConcluido;
  const modelistaEtapa = etapas.find((e) => e.nomeEtapa === "Modelista");

  const handleClick = (etapaId: string) => {
    if (canManage) onToggleEtapa(etapaId);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">
          Jornada do Primeiro Aluguel
        </p>
        <span className="text-xs text-muted-foreground tabular-nums">
          {concluidas}/{etapas.length} etapas concluídas
        </span>
      </div>

      {/* Desktop / tablet — cartões numerados em linha, com pontinhos entre eles */}
      <div className="hidden md:flex items-start overflow-x-auto pb-1">
        {etapas.flatMap((etapa, i) => {
          const estado = estadoDaEtapa(etapas, i);
          const nodes: React.ReactNode[] = [];
          if (i > 0) nodes.push(<Conector key={`c-${etapa.id}`} ativo={etapas[i - 1].isConcluido} />);
          nodes.push(
            <div key={etapa.id} className="flex flex-col items-center pt-2">
              <Cartao etapa={etapa} numero={i + 1} estado={estado} canManage={canManage} onClick={() => handleClick(etapa.id)} />
              {i === INDICE_SEGUNDA_PROVA && (
                <NovoAjusteCallout modelistaEtapa={modelistaEtapa} canManage={canManage} onToggleEtapa={onToggleEtapa} />
              )}
            </div>,
          );
          return nodes;
        })}
      </div>

      {/* Mobile — cartões empilhados verticalmente */}
      <div className="md:hidden flex flex-col items-center">
        {etapas.map((etapa, i) => {
          const estado = estadoDaEtapa(etapas, i);
          return (
            <div key={etapa.id} className="flex flex-col items-center w-full">
              {i > 0 && (
                <div className="h-4 flex items-center">
                  <span className={cn("h-1.5 w-1.5 rounded-full", etapas[i - 1].isConcluido ? "bg-success/60" : "bg-border")} />
                </div>
              )}
              <Cartao etapa={etapa} numero={i + 1} estado={estado} canManage={canManage} onClick={() => handleClick(etapa.id)} />
              {i === INDICE_SEGUNDA_PROVA && (
                <NovoAjusteCallout modelistaEtapa={modelistaEtapa} canManage={canManage} onToggleEtapa={onToggleEtapa} />
              )}
            </div>
          );
        })}
      </div>

      {ultimaEtapaConcluida && (
        <div className="mt-5 flex items-center justify-center gap-2 rounded-xl bg-success/10 border border-success/20 py-3">
          <PartyPopper className="h-4 w-4 text-success" />
          <p className="text-sm font-serif font-semibold text-success">Seu vestido está pronto</p>
          <span className="text-xs text-muted-foreground">— Entrega Final</span>
        </div>
      )}
    </div>
  );
}
