import { useMemo } from "react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Agendamento } from "@/types/agenda";
import { AgendamentoCard } from "./AgendamentoCard";

interface Props {
  data: Date;
  agendamentos: Agendamento[];
  onClickAgendamento?: (ag: Agendamento) => void;
  onClickHorario?: (hora: Date) => void;
}

const HORAS = Array.from({ length: 16 }, (_, i) => i + 7); // 07 a 22

export function CalendarioDia({ data, agendamentos, onClickAgendamento, onClickHorario }: Props) {
  const porHora = useMemo(() => {
    const mapa: Record<number, Agendamento[]> = {};
    HORAS.forEach((h) => (mapa[h] = []));
    agendamentos.forEach((ag) => {
      const hora = parseISO(ag.dataHora).getHours();
      if (hora >= 7 && hora <= 22) {
        mapa[hora].push(ag);
      }
    });
    return mapa;
  }, [agendamentos]);

  return (
    <div className="overflow-y-auto max-h-[calc(100vh-220px)]">
      <div className="sticky top-0 z-10 bg-background border-b px-4 py-2">
        <p className="text-sm font-semibold text-foreground capitalize">
          {format(data, "EEEE, d 'de' MMMM 'de' yyyy", { locale: ptBR })}
        </p>
      </div>

      <div className="divide-y">
        {HORAS.map((hora) => {
          const eventos = porHora[hora] ?? [];
          const horarioDate = new Date(data);
          horarioDate.setHours(hora, 0, 0, 0);
          return (
            <div key={hora} className="flex min-h-[72px]">
              <div className="w-16 shrink-0 pt-2 px-2 text-right">
                <span className="text-xs text-muted-foreground font-medium">
                  {String(hora).padStart(2, "0")}:00
                </span>
              </div>
              <div
                className="flex-1 px-2 py-1.5 space-y-1.5 cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => eventos.length === 0 && onClickHorario?.(horarioDate)}
              >
                {eventos.length === 0 ? (
                  <div className="h-full min-h-[56px]" />
                ) : (
                  <>
                    {eventos.length >= 3 && (
                      <p className="text-xs text-amber-600 font-medium mb-1">
                        {eventos.length} agendamentos simultâneos
                      </p>
                    )}
                    {eventos.map((ag) => (
                      <AgendamentoCard key={ag.id} agendamento={ag} onClick={onClickAgendamento} />
                    ))}
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
