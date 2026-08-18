import { useMemo, useState } from "react";
import { DayPicker } from "react-day-picker";
import { ptBR } from "date-fns/locale";
import { format } from "date-fns";
import { ChevronLeft, ChevronRight, CalendarClock, Scissors, Send, PackageCheck } from "lucide-react";
import { SEO } from "@/components/SEO";
import { PageHeader } from "@/components/layout/PageHeader";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useLeads } from "@/hooks/useLeads";
import { useLogistica } from "@/hooks/useLogistica";

const dayPickerClassNames = {
  months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
  month: "space-y-4",
  caption: "flex justify-center pt-1 relative items-center",
  caption_label: "text-sm font-medium",
  nav: "space-x-1 flex items-center",
  nav_button: cn(buttonVariants({ variant: "outline" }), "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100"),
  nav_button_previous: "absolute left-1",
  nav_button_next: "absolute right-1",
  table: "w-full border-collapse space-y-1",
  head_row: "flex",
  head_cell: "text-muted-foreground rounded-md w-9 font-normal text-[0.8rem]",
  row: "flex w-full mt-2",
  cell: "h-9 w-9 text-center text-sm p-0 relative focus-within:relative focus-within:z-20",
  day: cn(buttonVariants({ variant: "ghost" }), "h-9 w-9 p-0 font-normal"),
  day_today: "bg-accent text-accent-foreground",
  day_outside: "text-muted-foreground opacity-40",
  day_disabled: "text-muted-foreground opacity-50",
  day_hidden: "invisible",
};

const legendItems = [
  { dot: "bg-primary", label: "Prova agendada" },
  { dot: "bg-success", label: "Saída de vestido" },
  { dot: "bg-warning", label: "Devolução prevista" },
];

const CalendarioAgenda = () => {
  const { leads } = useLeads();
  const { items: logistica } = useLogistica();
  const [month, setMonth] = useState(new Date());
  const [sheetDate, setSheetDate] = useState<Date | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  const leadsComProva = useMemo(() => leads.filter((l) => l.provaData), [leads]);

  const diasProvas = useMemo(() => leadsComProva.map((l) => new Date(l.provaData! + "T00:00:00")), [leadsComProva]);
  const diasSaidas = useMemo(() => logistica.filter((l) => l.dataSaida).map((l) => new Date(l.dataSaida + "T00:00:00")), [logistica]);
  const diasRetornos = useMemo(() => logistica.filter((l) => l.dataRetorno).map((l) => new Date(l.dataRetorno + "T00:00:00")), [logistica]);

  const eventosDoDia = useMemo(() => {
    if (!sheetDate) return { provas: [], saidas: [], retornos: [] };
    const key = format(sheetDate, "yyyy-MM-dd");
    return {
      provas: leadsComProva.filter((l) => l.provaData === key),
      saidas: logistica.filter((l) => l.dataSaida === key),
      retornos: logistica.filter((l) => l.dataRetorno === key),
    };
  }, [sheetDate, leadsComProva, logistica]);

  const handleDayClick = (day: Date) => {
    setSheetDate(day);
    setSheetOpen(true);
  };

  const totalEventosDoDia = eventosDoDia.provas.length + eventosDoDia.saidas.length + eventosDoDia.retornos.length;

  return (
    <>
      <SEO title="Prova & Entregas — Més Belle" description="Calendário unificado de provas, saídas e devoluções." path="/agendamento/agenda" />
      <div className="space-y-6">
        <PageHeader
          icon={CalendarClock}
          title="Prova & Entregas"
          description="Calendário unificado de provas, saídas e devoluções de vestidos"
        />

        <div className="flex flex-wrap items-center gap-4 px-1">
          {legendItems.map((it) => (
            <span key={it.label} className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className={`h-2 w-2 rounded-full ${it.dot}`} />
              {it.label}
            </span>
          ))}
        </div>

        <div className="rounded-2xl border border-border-subtle bg-card p-4 flex justify-center">
          <DayPicker
            mode="single"
            locale={ptBR}
            month={month}
            onMonthChange={setMonth}
            showOutsideDays
            className="p-3"
            classNames={dayPickerClassNames}
            components={{
              IconLeft: () => <ChevronLeft className="h-4 w-4" />,
              IconRight: () => <ChevronRight className="h-4 w-4" />,
            }}
            modifiers={{ prova: diasProvas, saida: diasSaidas, retorno: diasRetornos }}
            modifiersClassNames={{
              prova: "ring-2 ring-primary ring-offset-1 ring-offset-card",
              saida: "bg-success/20 text-success font-semibold",
              retorno: "bg-warning/20 text-warning font-semibold",
            }}
            onDayClick={handleDayClick}
          />
        </div>
      </div>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle className="font-serif">
              {sheetDate ? format(sheetDate, "d 'de' MMMM 'de' yyyy", { locale: ptBR }) : ""}
            </SheetTitle>
            <SheetDescription>
              {totalEventosDoDia === 0 ? "Nenhum evento neste dia." : `${totalEventosDoDia} evento${totalEventosDoDia > 1 ? "s" : ""} neste dia`}
            </SheetDescription>
          </SheetHeader>

          <div className="mt-4 space-y-5">
            {eventosDoDia.provas.length > 0 && (
              <div>
                <p className="label-eyebrow flex items-center gap-1.5 mb-2"><Scissors className="h-3 w-3" /> Provas</p>
                <div className="space-y-2">
                  {eventosDoDia.provas.map((l) => (
                    <div key={l.id} className="rounded-xl border border-border-subtle p-3">
                      <p className="text-sm font-semibold">{l.nome}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{l.provaHora ? `às ${l.provaHora} — ` : ""}{l.tipoEvento}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {eventosDoDia.saidas.length > 0 && (
              <div>
                <p className="label-eyebrow flex items-center gap-1.5 mb-2"><Send className="h-3 w-3" /> Saídas</p>
                <div className="space-y-2">
                  {eventosDoDia.saidas.map((l) => (
                    <div key={l.id} className="rounded-xl border border-border-subtle p-3">
                      <p className="text-sm font-semibold">{l.clienteNome}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{l.vestidoNome}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {eventosDoDia.retornos.length > 0 && (
              <div>
                <p className="label-eyebrow flex items-center gap-1.5 mb-2"><PackageCheck className="h-3 w-3" /> Devoluções</p>
                <div className="space-y-2">
                  {eventosDoDia.retornos.map((l) => (
                    <div key={l.id} className="rounded-xl border border-border-subtle p-3">
                      <p className="text-sm font-semibold">{l.clienteNome}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{l.vestidoNome}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
};

export default CalendarioAgenda;
