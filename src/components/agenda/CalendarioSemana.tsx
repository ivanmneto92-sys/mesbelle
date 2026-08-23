import { useMemo } from "react";
import { format, eachDayOfInterval, startOfWeek, endOfWeek, parseISO, isToday } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Agendamento, TIPO_CONFIG } from "@/types/agenda";
import { cn } from "@/lib/utils";

interface Props {
  dataReferencia: Date;
  agendamentos: Agendamento[];
  onClickDia?: (data: Date) => void;
  onClickAgendamento?: (ag: Agendamento) => void;
}

const HORAS = Array.from({ length: 16 }, (_, i) => i + 7);

export function CalendarioSemana({ dataReferencia, agendamentos, onClickDia, onClickAgendamento }: Props) {
  const dias = eachDayOfInterval({
    start: startOfWeek(dataReferencia, { weekStartsOn: 0 }),
    end: endOfWeek(dataReferencia, { weekStartsOn: 0 }),
  });

  const porDiaHora = useMemo(() => {
    const mapa: Record<string, Agendamento[]> = {};
    agendamentos.forEach((ag) => {
      const dt = parseISO(ag.dataHora);
      const chave = `${format(dt, "yyyy-MM-dd")}-${dt.getHours()}`;
      if (!mapa[chave]) mapa[chave] = [];
      mapa[chave].push(ag);
    });
    return mapa;
  }, [agendamentos]);

  return (
    <div className="overflow-auto max-h-[calc(100vh-220px)]">
      <div className="grid grid-cols-8 border-b sticky top-0 z-10 bg-background">
        <div className="w-14" />
        {dias.map((dia) => (
          <div
            key={dia.toISOString()}
            className={cn(
              "py-2 px-1 text-center cursor-pointer hover:bg-muted/50 border-l",
              isToday(dia) && "bg-primary/5",
            )}
            onClick={() => onClickDia?.(dia)}
          >
            <p className="text-xs text-muted-foreground uppercase">
              {format(dia, "EEE", { locale: ptBR })}
            </p>
            <p className={cn("text-sm font-semibold", isToday(dia) ? "text-primary" : "text-foreground")}>
              {format(dia, "d")}
            </p>
          </div>
        ))}
      </div>

      {HORAS.map((hora) => (
        <div key={hora} className="grid grid-cols-8 border-b min-h-[64px]">
          <div className="w-14 pt-1 px-1 text-right shrink-0">
            <span className="text-xs text-muted-foreground">{String(hora).padStart(2, "0")}h</span>
          </div>
          {dias.map((dia) => {
            const chave = `${format(dia, "yyyy-MM-dd")}-${hora}`;
            const eventos = porDiaHora[chave] ?? [];
            return (
              <div
                key={dia.toISOString()}
                className={cn(
                  "border-l px-1 py-1 space-y-1 cursor-pointer hover:bg-muted/50",
                  isToday(dia) && "bg-primary/5",
                )}
                onClick={() => {
                  if (eventos.length === 0) {
                    const d = new Date(dia);
                    d.setHours(hora, 0, 0, 0);
                    onClickDia?.(d);
                  }
                }}
              >
                {eventos.map((ag) => (
                  <div
                    key={ag.id}
                    onClick={(e) => { e.stopPropagation(); onClickAgendamento?.(ag); }}
                    className="rounded text-xs px-1.5 py-0.5 truncate font-medium cursor-pointer"
                    style={{
                      backgroundColor: `${TIPO_CONFIG[ag.tipo].cor}22`,
                      borderLeft: `3px solid ${TIPO_CONFIG[ag.tipo].cor}`,
                      color: TIPO_CONFIG[ag.tipo].cor,
                    }}
                  >
                    {format(parseISO(ag.dataHora), "HH:mm")} {ag.clienteNome}
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
