import { useMemo, useState } from "react";
import { addDays, addWeeks, addMonths, subDays, subWeeks, subMonths, format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Plus, CalendarDays, CalendarRange, LayoutGrid } from "lucide-react";
import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CalendarioDia } from "@/components/agenda/CalendarioDia";
import { CalendarioSemana } from "@/components/agenda/CalendarioSemana";
import { CalendarioMes } from "@/components/agenda/CalendarioMes";
import { KanbanAgendamentos } from "@/components/agenda/KanbanAgendamentos";
import { NovoAgendamentoDialog } from "@/components/agenda/NovoAgendamentoDialog";
import { useAgendaDia, useAgendaSemana, useAgendaMes, useAgendaKanban } from "@/hooks/useAgenda";
import { useFuncionarios } from "@/hooks/useFuncionarios";
import { Agendamento, TIPO_CONFIG } from "@/types/agenda";

type ViewMode = "dia" | "semana" | "mes";
type Modo = "calendario" | "kanban";

export default function Agenda() {
  const [modo, setModo] = useState<Modo>("calendario");
  const [view, setView] = useState<ViewMode>("semana");
  const [dataReferencia, setDataReferencia] = useState(new Date());
  const [filtroFuncionaria, setFiltroFuncionaria] = useState<string | null>(null);
  const [dialogAberto, setDialogAberto] = useState(false);
  const [dataHoraSelecionada, setDataHoraSelecionada] = useState<Date | undefined>();
  const [agendamentoEditar, setAgendamentoEditar] = useState<Agendamento | undefined>();

  const { funcionarios } = useFuncionarios();
  const nomesFuncionarias = useMemo(
    () => Object.fromEntries(funcionarios.map((f) => [f.id, f.nome])),
    [funcionarios],
  );

  const { data: agDia } = useAgendaDia(dataReferencia, filtroFuncionaria);
  const { data: agSemana } = useAgendaSemana(dataReferencia, filtroFuncionaria);
  const { data: agMes } = useAgendaMes(dataReferencia, filtroFuncionaria);
  const agendamentosBrutos = view === "dia" ? agDia : view === "semana" ? agSemana : agMes;

  const agendamentos = useMemo(
    () =>
      (agendamentosBrutos ?? []).map((ag) => ({
        ...ag,
        funcionariaNome: ag.funcionariaId ? nomesFuncionarias[ag.funcionariaId] ?? null : null,
      })),
    [agendamentosBrutos, nomesFuncionarias],
  );

  // Kanban do admin não navega por período nem filtra por funcionária — mostra
  // todos os agendamentos de todos os clientes, independente de quem cadastrou
  // ou está responsável (a RLS de admin já dá acesso total).
  const { data: agKanban } = useAgendaKanban();

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
      <SEO title="Agenda — Comercial — Més Belle" description="Calendário de visitas, provas, retiradas e devoluções." path="/comercial/calendario" />
      <div className="flex flex-col h-full">
        <div className="flex flex-wrap items-center gap-3 p-4 border-b bg-background">
          <div className="flex items-center gap-1 border rounded-md p-0.5 mr-3">
            <Button
              size="sm"
              variant={modo === "calendario" ? "secondary" : "ghost"}
              onClick={() => setModo("calendario")}
              className="text-xs h-7 px-3"
            >
              <CalendarRange className="h-3.5 w-3.5 mr-1" />
              Calendário
            </Button>
            <Button
              size="sm"
              variant={modo === "kanban" ? "secondary" : "ghost"}
              onClick={() => setModo("kanban")}
              className="text-xs h-7 px-3"
            >
              <LayoutGrid className="h-3.5 w-3.5 mr-1" />
              Kanban
            </Button>
          </div>

          {modo === "calendario" && (
            <>
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

              <Select
                value={filtroFuncionaria ?? "todas"}
                onValueChange={(v) => setFiltroFuncionaria(v === "todas" ? null : v)}
              >
                <SelectTrigger className="w-44 h-8 text-xs">
                  <SelectValue placeholder="Todas as funcionárias" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todas">Todas as funcionárias</SelectItem>
                  {funcionarios.map((f) => (
                    <SelectItem key={f.id} value={f.id}>{f.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="hidden lg:flex items-center gap-2 ml-auto">
                {Object.entries(TIPO_CONFIG).map(([key, cfg]) => (
                  <span key={key} className="flex items-center gap-1 text-xs text-muted-foreground">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: cfg.cor }} />
                    {cfg.label}
                  </span>
                ))}
              </div>
            </>
          )}

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
          {modo === "kanban" ? (
            <div className="p-4 overflow-auto h-full">
              <KanbanAgendamentos agendamentos={agKanban ?? []} />
            </div>
          ) : (
            <>
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
            </>
          )}
        </div>

        <NovoAgendamentoDialog
          aberto={dialogAberto}
          onFechar={() => setDialogAberto(false)}
          dataHoraInicial={dataHoraSelecionada}
          agendamentoEditar={agendamentoEditar}
          funcionarias={funcionarios.map((f) => ({ id: f.id, nome: f.nome }))}
          onSalvo={(data) => { setDataReferencia(data); setView("dia"); }}
        />
      </div>
    </>
  );
}
