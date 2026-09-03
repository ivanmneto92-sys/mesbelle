import { useMemo } from "react";
import {
  format, eachDayOfInterval, startOfMonth, endOfMonth,
  startOfWeek, endOfWeek, parseISO, isSameMonth, isToday,
} from "date-fns";
import { Agendamento, TIPO_CONFIG } from "@/types/agenda";
import { cn } from "@/lib/utils";

interface Props {
  dataReferencia: Date;
  agendamentos: Agendamento[];
  onClickDia?: (data: Date) => void;
}

const DIAS_SEMANA = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

export function CalendarioMes({ dataReferencia, agendamentos, onClickDia }: Props) {
  const dias = eachDayOfInterval({
    start: startOfWeek(startOfMonth(dataReferencia), { weekStartsOn: 0 }),
    end: endOfWeek(endOfMonth(dataReferencia), { weekStartsOn: 0 }),
  });

  const porDia = useMemo(() => {
    const mapa: Record<string, Agendamento[]> = {};
    agendamentos.forEach((ag) => {
      const chave = format(parseISO(ag.dataHora), "yyyy-MM-dd");
      if (!mapa[chave]) mapa[chave] = [];
      mapa[chave].push(ag);
    });
    return mapa;
  }, [agendamentos]);

  return (
    <div className="overflow-auto max-h-[calc(100vh-220px)]">
      <div className="grid grid-cols-7 text-center border-b sticky top-0 z-10 bg-background">
        {DIAS_SEMANA.map((d) => (
          <div key={d} className="py-2 text-xs font-semibold text-muted-foreground uppercase">
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 border-l">
        {dias.map((dia) => {
          const chave = format(dia, "yyyy-MM-dd");
          const eventos = porDia[chave] ?? [];
          const doMes = isSameMonth(dia, dataReferencia);
          return (
            <div
              key={chave}
              onClick={() => onClickDia?.(dia)}
              className={cn(
                "min-h-[90px] border-r border-b p-1.5 cursor-pointer",
                "hover:bg-muted/50 transition-colors",
                !doMes && "bg-muted/30",
                isToday(dia) && "bg-primary/5",
              )}
            >
              <span
                className={cn(
                  "text-xs font-semibold",
                  !doMes && "text-muted-foreground/40",
                  isToday(dia) && "text-primary",
                  doMes && !isToday(dia) && "text-foreground",
                )}
              >
                {format(dia, "d")}
              </span>

              <div className="mt-1 flex flex-wrap gap-0.5">
                {eventos.slice(0, 3).map((ag) => (
                  <span
                    key={ag.id}
                    className="w-2 h-2 rounded-full inline-block"
                    style={{ backgroundColor: TIPO_CONFIG[ag.tipo].cor }}
                    title={`${TIPO_CONFIG[ag.tipo].label} — ${ag.clienteNome}`}
                  />
                ))}
                {eventos.length > 3 && (
                  <span className="text-[10px] text-muted-foreground leading-none mt-0.5">
                    +{eventos.length - 3}
                  </span>
                )}
              </div>

              <div className="mt-0.5 space-y-0.5 hidden sm:block">
                {eventos.slice(0, 2).map((ag) => (
                  <p
                    key={ag.id}
                    className="text-[10px] leading-tight truncate rounded px-1"
                    style={{
                      backgroundColor: `${TIPO_CONFIG[ag.tipo].cor}22`,
                      color: TIPO_CONFIG[ag.tipo].cor,
                    }}
                  >
                    {format(parseISO(ag.dataHora), "HH:mm")} {ag.clienteNome}
                  </p>
                ))}
                {eventos.length > 2 && (
                  <p className="text-[10px] text-muted-foreground">+{eventos.length - 2} mais</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
