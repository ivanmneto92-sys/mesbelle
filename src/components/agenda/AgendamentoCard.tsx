import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Clock, User, Package } from "lucide-react";
import { Agendamento, TIPO_CONFIG } from "@/types/agenda";
import { cn } from "@/lib/utils";

interface Props {
  agendamento: Agendamento;
  onClick?: (ag: Agendamento) => void;
  compacto?: boolean; // para a view de semana/mês
}

export function AgendamentoCard({ agendamento, onClick, compacto = false }: Props) {
  const config = TIPO_CONFIG[agendamento.tipo];

  return (
    <div
      onClick={() => onClick?.(agendamento)}
      className={cn(
        "rounded-md border-l-4 bg-background shadow-sm cursor-pointer",
        "hover:shadow-md transition-shadow select-none",
        compacto ? "px-2 py-1" : "px-3 py-2",
      )}
      style={{ borderLeftColor: config.cor }}
    >
      <span
        className={cn(
          "inline-block text-xs font-semibold rounded px-1.5 py-0.5 mb-1",
          config.corBg,
          config.corTexto,
        )}
      >
        {config.label}
      </span>

      <p className={cn("font-medium text-foreground leading-tight", compacto ? "text-xs" : "text-sm")}>
        {agendamento.clienteNome}
      </p>

      {!compacto && (
        <div className="mt-1 space-y-0.5 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            <span>
              {format(new Date(agendamento.dataHora), "HH:mm", { locale: ptBR })}
              {" — "}
              {agendamento.duracaoMinutos}min
            </span>
          </div>

          {agendamento.vestidoNome && (
            <div className="flex items-center gap-1">
              <Package className="h-3 w-3" />
              <span className="truncate max-w-[180px]">{agendamento.vestidoNome}</span>
            </div>
          )}

          {agendamento.funcionariaNome && (
            <div className="flex items-center gap-1">
              <User className="h-3 w-3" />
              <span>{agendamento.funcionariaNome}</span>
            </div>
          )}

          {agendamento.observacoes && (
            <p className="text-muted-foreground/70 italic truncate">{agendamento.observacoes}</p>
          )}
        </div>
      )}
    </div>
  );
}
