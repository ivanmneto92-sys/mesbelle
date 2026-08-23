import { useState } from "react";
import { addDays, addWeeks, addMonths, subDays, subWeeks, subMonths, format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Plus, CalendarDays, CalendarRange, LayoutGrid } from "lucide-react";
import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { CalendarioDia } from "@/components/agenda/CalendarioDia";
import { CalendarioSemana } from "@/components/agenda/CalendarioSemana";
import { CalendarioMes } from "@/components/agenda/CalendarioMes";
import { NovoAgendamentoDialog } from "@/components/agenda/NovoAgendamentoDialog";
import { useAgendaDia, useAgendaSemana, useAgendaMes } from "@/hooks/useAgenda";
import { useAuth } from "@/contexts/AuthContext";
import { Agendamento, TIPO_CONFIG } from "@/types/agenda";

type ViewMode = "dia" | "semana" | "mes";

const MinhaAgenda = () => {
  const { user } = useAuth();
  const [view, setView] = useState<ViewMode>("semana");
  const [dataReferencia, setDataReferencia] = useState(new Date());
  const [dialogAberto, setDialogAberto] = useState(false);
  const [dataHoraSelecionada, setDataHoraSelecionada] = useState<Date | undefined>();
  const [agendamentoEditar, setAgendamentoEditar] = useState<Agendamento | undefined>();

  const { data: agDia } = useAgendaDia(dataReferencia, user?.id);
  const { data: agSemana } = useAgendaSemana(dataReferencia, user?.id);
  const { data: agMes } = useAgendaMes(dataReferencia, user?.id);
  const agendamentos = (view === "dia" ? agDia : view === "semana" ? agSemana : agMes) ?? [];

  const navAnterior = () => {
    setDataReferencia((prev) =>
      view === "dia" ? subDays(prev, 1) : view === "semana" ? subWeeks(prev, 1) : subMonths(prev, 1),
    );
  };
  const navProximo = () => {
    setDataReferencia((prev) =>
      view === "dia" ? addDays(prev, 1) : view === "semana" ? addWeeks(prev, 1) : addMonths(prev, 1),
    );
  };

  const labelPeriodo =
    view === "dia"
      ? format(dataReferencia, "d 'de' MMMM 'de' yyyy", { locale: ptBR })
      : view === "semana"
        ? `Semana de ${format(dataReferencia, "d/MM", { locale: ptBR })}`
        : format(dataReferencia, "MMMM 'de' yyyy", { locale: ptBR });

  const handleClickHorario = (data: Date) => {
    setDataHoraSelecionada(data);
    setAgendamentoEditar(undefined);
    setDialogAberto(true);
  };

  const handleClickAgendamento = (ag: Agendamento) => {
    setAgendamentoEditar(ag);
    setDataHoraSelecionada(undefined);
    setDialogAberto(true);
  };

  return (
    <>
      <SEO title="Minha Agenda — Més Belle" description="Calendário dos seus atendimentos, provas, retiradas e devoluções." path="/minha-agenda" />
      <div className="flex flex-col h-full">
        <div className="flex flex-wrap items-center gap-3 p-4 border-b bg-background">
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" onClick={navAnterior}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium min-w-[180px] text-center capitalize">
              {labelPeriodo}
            </span>
            <Button variant="ghost" size="icon" onClick={navProximo}>
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setDataReferencia(new Date())} className="text-xs">
              Hoje
            </Button>
          </div>

          <div className="flex items-center gap-1 border rounded-md p-0.5">
            {(["dia", "semana", "mes"] as ViewMode[]).map((v) => (
              <Button
                key={v}
                variant={view === v ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setView(v)}
                className="capitalize text-xs h-7 px-2"
              >
                {v === "dia" ? <CalendarDays className="h-3.5 w-3.5 mr-1" /> :
                  v === "semana" ? <CalendarRange className="h-3.5 w-3.5 mr-1" /> :
                    <LayoutGrid className="h-3.5 w-3.5 mr-1" />}
                {v}
              </Button>
            ))}
          </div>

          <div className="hidden lg:flex items-center gap-2 ml-auto">
            {Object.entries(TIPO_CONFIG).map(([key, cfg]) => (
              <span key={key} className="flex items-center gap-1 text-xs text-muted-foreground">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: cfg.cor }} />
                {cfg.label}
              </span>
            ))}
          </div>

          <Button
            size="sm"
            className="ml-auto lg:ml-0"
            onClick={() => {
              setDataHoraSelecionada(new Date());
              setAgendamentoEditar(undefined);
              setDialogAberto(true);
            }}
          >
            <Plus className="h-4 w-4 mr-1" />
            Novo agendamento
          </Button>
        </div>

        <div className="flex-1 overflow-hidden">
          {view === "dia" && (
            <CalendarioDia
              data={dataReferencia}
              agendamentos={agendamentos}
              onClickAgendamento={handleClickAgendamento}
              onClickHorario={handleClickHorario}
            />
          )}
          {view === "semana" && (
            <CalendarioSemana
              dataReferencia={dataReferencia}
              agendamentos={agendamentos}
              onClickDia={(data) => { setDataReferencia(data); setView("dia"); }}
              onClickAgendamento={handleClickAgendamento}
            />
          )}
          {view === "mes" && (
            <CalendarioMes
              dataReferencia={dataReferencia}
              agendamentos={agendamentos}
              onClickDia={(data) => { setDataReferencia(data); setView("dia"); }}
            />
          )}
        </div>

        <NovoAgendamentoDialog
          aberto={dialogAberto}
          onFechar={() => setDialogAberto(false)}
          dataHoraInicial={dataHoraSelecionada}
          agendamentoEditar={agendamentoEditar}
          funcionariaIdFixo={user?.id}
        />
      </div>
    </>
  );
};

export default MinhaAgenda;
