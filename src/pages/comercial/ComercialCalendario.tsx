import { useMemo, useState } from "react";
import { SEO } from "@/components/SEO";
import { CalendarDays, Phone } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useAgendamentos } from "@/hooks/useAgendamentos";
import { CrmFunnelStatus } from "@/types/comercial";

type FiltroCalendario = "agendados" | "compareceram" | "canceladas";

const FILTRO_STATUSES: Record<FiltroCalendario, CrmFunnelStatus[]> = {
  agendados: ["agendado"],
  compareceram: ["compareceu_alugou", "compareceu_nao_alugou"],
  canceladas: ["cancelada", "reagendada"],
};

const parseLocalDate = (s: string) => {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
};
const toKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

const ComercialCalendario = () => {
  const { agendamentos } = useAgendamentos();
  const [filtros, setFiltros] = useState<FiltroCalendario[]>(["agendados", "compareceram", "canceladas"]);
  const [selectedDay, setSelectedDay] = useState<Date>(new Date());

  const statusesAtivos = useMemo(
    () => filtros.flatMap((f) => FILTRO_STATUSES[f]),
    [filtros]
  );

  const visiveis = useMemo(
    () => agendamentos.filter((l) => l.provaData && statusesAtivos.includes(l.statusFunil)),
    [agendamentos, statusesAtivos]
  );

  const diasComAgendamento = useMemo(
    () => visiveis.map((l) => parseLocalDate(l.provaData!)),
    [visiveis]
  );

  const doDia = useMemo(() => {
    const key = toKey(selectedDay);
    return visiveis.filter((l) => l.provaData === key);
  }, [visiveis, selectedDay]);

  const statusColors: Record<string, string> = {
    agendado: "bg-info/20 text-info border-info/30",
    compareceu_alugou: "bg-success/20 text-success border-success/30",
    compareceu_nao_alugou: "bg-warning/20 text-warning border-warning/30",
    reagendada: "bg-accent/20 text-accent-foreground border-accent-foreground/30",
    cancelada: "bg-destructive/20 text-destructive border-destructive/30",
  };

  return (
    <>
      <SEO title="Calendário — Comercial — Més Belle" description="Visão de calendário dos agendamentos comerciais." path="/comercial/calendario" />
      <div className="space-y-6">
        <PageHeader icon={CalendarDays} title="Calendário" description="Visualize os agendamentos comerciais por dia" />

        <ToggleGroup
          type="multiple"
          value={filtros}
          onValueChange={(v) => v.length > 0 && setFiltros(v as FiltroCalendario[])}
          className="flex-wrap justify-start"
        >
          <ToggleGroupItem value="agendados" className="text-xs">Agendados</ToggleGroupItem>
          <ToggleGroupItem value="compareceram" className="text-xs">Compareceram</ToggleGroupItem>
          <ToggleGroupItem value="canceladas" className="text-xs">Canceladas/Reagendadas</ToggleGroupItem>
        </ToggleGroup>

        <div className="grid gap-4 md:grid-cols-[auto_1fr]">
          <Card className="shadow-sm w-fit">
            <CardContent className="p-2">
              <Calendar
                mode="single"
                selected={selectedDay}
                onSelect={(d) => d && setSelectedDay(d)}
                modifiers={{ hasAgendamento: diasComAgendamento }}
                modifiersClassNames={{ hasAgendamento: "font-bold underline decoration-2 decoration-primary" }}
              />
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardContent className="p-4">
              <p className="text-sm font-medium mb-3">
                {selectedDay.toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })}
              </p>
              {doDia.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">Nenhum agendamento neste dia.</p>
              ) : (
                <div className="space-y-2">
                  {doDia.map((l) => (
                    <div key={l.id} className="flex items-center justify-between rounded-lg border border-border-subtle p-3">
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{l.nome}</p>
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Phone className="h-3 w-3" /> {l.telefone}
                          {l.provaHora ? ` · ${l.provaHora}` : ""}
                        </span>
                      </div>
                      <Badge className={`${statusColors[l.statusFunil] ?? ""} border text-xs shrink-0`}>
                        {l.statusFunil}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
};

export default ComercialCalendario;
