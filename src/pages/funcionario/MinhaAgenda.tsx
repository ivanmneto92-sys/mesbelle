import { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { addDays, addWeeks, addMonths, subDays, subWeeks, subMonths, format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Plus, CalendarDays, CalendarRange, LayoutGrid, Search } from "lucide-react";
import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CalendarioDia } from "@/components/agenda/CalendarioDia";
import { CalendarioSemana } from "@/components/agenda/CalendarioSemana";
import { CalendarioMes } from "@/components/agenda/CalendarioMes";
import { KanbanAgendamentos } from "@/components/agenda/KanbanAgendamentos";
import { NovoAgendamentoDialog } from "@/components/agenda/NovoAgendamentoDialog";
import { useAgendaDia, useAgendaSemana, useAgendaMes, useAgendaKanban } from "@/hooks/useAgenda";
import { useAuth } from "@/contexts/AuthContext";
import { Agendamento, TIPO_CONFIG } from "@/types/agenda";

type ViewMode = "dia" | "semana" | "mes";
type Modo = "calendario" | "kanban";

const MinhaAgenda = () => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [modo, setModo] = useState<Modo>("calendario");
  const [view, setView] = useState<ViewMode>("semana");
  const [dataReferencia, setDataReferencia] = useState(new Date());
  const [dialogAberto, setDialogAberto] = useState(false);
  const [buscaKanban, setBuscaKanban] = useState("");
  const [dataHoraSelecionada, setDataHoraSelecionada] = useState<Date | undefined>();
  const [agendamentoEditar, setAgendamentoEditar] = useState<Agendamento | undefined>();

  // Atalho "Novo Agendamento" do Meu Painel (/minha-agenda?novo=1) — abre o
  // dialog direto, sem exigir um segundo clique depois de navegar até aqui.
  useEffect(() => {
    if (searchParams.get("novo") === "1") {
      setDataHoraSelecionada(new Date());
      setAgendamentoEditar(undefined);
      setDialogAberto(true);
      setSearchParams((prev) => { prev.delete("novo"); return prev; }, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const { data: agDia } = useAgendaDia(dataReferencia, user?.id);
  const { data: agSemana } = useAgendaSemana(dataReferencia, user?.id);
  const { data: agMes } = useAgendaMes(dataReferencia, user?.id);
  const agendamentos = (view === "dia" ? agDia : view === "semana" ? agSemana : agMes) ?? [];

  // Kanban não navega por período nem filtra por funcionária — mostra todos os
  // agendamentos acessíveis (a RLS já decide o que cada papel pode ver), numa
  // janela ampla fixa (90 dias atrás até 90 dias à frente).
  const { data: agKanban } = useAgendaKanban();

  // Busca por nome do lead (ignora acento/caixa) ou pelos últimos dígitos do
  // telefone cadastrado — útil quando o Kanban acumula muitos cartões.
  const agKanbanFiltrado = useMemo(() => {
    const termo = buscaKanban.trim().toLowerCase();
    if (!termo) return agKanban ?? [];
    const apenasDigitos = /^\d+$/.test(termo);
    const normalizar = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
    return (agKanban ?? []).filter((ag) => {
      if (apenasDigitos) {
        const telefone = (ag.clienteTelefone ?? "").replace(/\D/g, "");
        return telefone.includes(termo);
      }
      return normalizar(ag.clienteNome).includes(normalizar(termo));
    });
  }, [agKanban, buscaKanban]);

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

          {modo === "kanban" && (
            <div className="relative w-56">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                value={buscaKanban}
                onChange={(e) => setBuscaKanban(e.target.value)}
                placeholder="Buscar por nome ou telefone"
                className="h-8 pl-8 text-xs"
              />
            </div>
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
              <KanbanAgendamentos agendamentos={agKanbanFiltrado} />
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
          funcionariaIdFixo={user?.id}
          onSalvo={(data) => { setDataReferencia(data); setView("dia"); }}
        />
      </div>
    </>
  );
};

export default MinhaAgenda;
