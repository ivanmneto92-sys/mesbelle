import {
  PackageOpen, Scissors, Gem, Shirt, Ruler, Sparkles, PartyPopper,
  CircleDot, Undo2, Store, Check,
} from "lucide-react";
import { EtapaProducao } from "@/types/acervo";
import { cn } from "@/lib/utils";

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
  "Entrega Final": PartyPopper,
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

const CIRCLE_CLASSES: Record<EstadoEtapa, string> = {
  concluida: "bg-success/15 border-success text-success",
  atual: "bg-primary/10 border-primary text-primary ring-4 ring-primary/10",
  pendente: "bg-muted border-border text-muted-foreground/40",
};

const LABEL_CLASSES: Record<EstadoEtapa, string> = {
  concluida: "text-foreground",
  atual: "text-foreground font-medium",
  pendente: "text-muted-foreground/60",
};

function NovoAjusteCallout() {
  return (
    <div className="mt-3 rounded-lg border border-dashed border-muted-foreground/25 bg-muted/20 p-3 max-w-[220px] mx-auto md:mx-0">
      <div className="flex items-center gap-1.5 mb-1.5">
        <span className="text-[9px] font-semibold uppercase tracking-wide text-muted-foreground/70 bg-muted-foreground/10 rounded-full px-2 py-0.5">
          Opcional
        </span>
      </div>
      <p className="text-xs font-medium leading-snug">Precisou de um novo ajuste?</p>
      <div className="flex items-center gap-1.5 mt-1.5 text-[11px] text-muted-foreground">
        <Undo2 className="h-3 w-3 shrink-0" />
        <span>Volta à Modelista</span>
      </div>
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

      {/* Desktop / tablet — linha horizontal */}
      <div className="hidden md:block relative">
        <div className="absolute top-6 left-0 right-0 h-px bg-border" />
        <div
          className="absolute top-6 left-0 h-px bg-success transition-all duration-500"
          style={{ width: `${(concluidas / etapas.length) * 100}%` }}
        />
        <div className="relative flex">
          {etapas.map((etapa, i) => {
            const estado = estadoDaEtapa(etapas, i);
            const Icon = iconePara(etapa.nomeEtapa);
            return (
              <div key={etapa.id} className="flex-1 flex flex-col items-center text-center px-1">
                <button
                  type="button"
                  onClick={() => handleClick(etapa.id)}
                  disabled={!canManage}
                  className={cn(
                    "h-12 w-12 rounded-full border-2 flex items-center justify-center transition-colors shrink-0",
                    CIRCLE_CLASSES[estado],
                    canManage && "cursor-pointer hover:brightness-95",
                    !canManage && "cursor-default",
                  )}
                  title={etapa.nomeEtapa}
                >
                  {estado === "concluida" ? <Check className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
                </button>
                <span className="text-[10px] text-muted-foreground mt-1.5 tabular-nums">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className={cn("text-xs mt-0.5 leading-tight", LABEL_CLASSES[estado])}>
                  {etapa.nomeEtapa}
                </span>
                {i === INDICE_SEGUNDA_PROVA && <NovoAjusteCallout />}
              </div>
            );
          })}
        </div>
      </div>

      {/* Mobile — linha vertical */}
      <div className="md:hidden relative pl-6">
        <div className="absolute left-[1.375rem] top-6 bottom-6 w-px bg-border" />
        {etapas.map((etapa, i) => {
          const estado = estadoDaEtapa(etapas, i);
          const Icon = iconePara(etapa.nomeEtapa);
          return (
            <div key={etapa.id} className="relative flex items-start gap-3 pb-5 last:pb-0">
              <button
                type="button"
                onClick={() => handleClick(etapa.id)}
                disabled={!canManage}
                className={cn(
                  "relative z-10 h-11 w-11 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors",
                  CIRCLE_CLASSES[estado],
                  canManage ? "cursor-pointer hover:brightness-95" : "cursor-default",
                )}
              >
                {estado === "concluida" ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
              </button>
              <div className="pt-2">
                <span className="text-[10px] text-muted-foreground tabular-nums block">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className={cn("text-sm leading-tight", LABEL_CLASSES[estado])}>{etapa.nomeEtapa}</span>
                {i === INDICE_SEGUNDA_PROVA && <NovoAjusteCallout />}
              </div>
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
