import { useMemo, useState } from "react";
import { DayPicker } from "react-day-picker";
import { ptBR } from "date-fns/locale";
import { format } from "date-fns";
import { ChevronLeft, ChevronRight, CalendarCheck, Phone } from "lucide-react";
import { SEO } from "@/components/SEO";
import { PageHeader } from "@/components/layout/PageHeader";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useLeads } from "@/hooks/useLeads";
import type { Lead } from "@/types/comercial";

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

const CalendarioVisitas = () => {
  const { leads } = useLeads();
  const [month, setMonth] = useState(new Date());
  const [sheetDate, setSheetDate] = useState<Date | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  const leadsComProva = useMemo(() => leads.filter((l) => l.provaData), [leads]);

  const diasAgendados = useMemo(
    () => leadsComProva.map((l) => new Date(l.provaData! + "T00:00:00")),
    [leadsComProva]
  );

  const leadsDoDia = useMemo(() => {
    if (!sheetDate) return [] as Lead[];
    const key = format(sheetDate, "yyyy-MM-dd");
    return leadsComProva.filter((l) => l.provaData === key);
  }, [sheetDate, leadsComProva]);

  const handleDayClick = (day: Date) => {
    setSheetDate(day);
    setSheetOpen(true);
  };

  return (
    <>
      <SEO title="Calendário de Visitas — Més Belle" description="Visão mensal das visitas e provas agendadas." path="/agendamento/visitas" />
      <div className="space-y-6">
        <PageHeader
          icon={CalendarCheck}
          title="Calendário de Visitas"
          description="Visão mensal dos clientes com visita ou prova agendada"
        />

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
            modifiers={{ agendado: diasAgendados }}
            modifiersClassNames={{ agendado: "bg-primary/20 text-primary font-semibold rounded-full" }}
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
              {leadsDoDia.length === 0 ? "Nenhuma visita agendada neste dia." : `${leadsDoDia.length} visita${leadsDoDia.length > 1 ? "s" : ""} agendada${leadsDoDia.length > 1 ? "s" : ""}`}
            </SheetDescription>
          </SheetHeader>
          <div className="mt-4 space-y-2">
            {leadsDoDia.map((l) => (
              <div key={l.id} className="rounded-xl border border-border-subtle p-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold">{l.nome}</p>
                  {l.provaHora && <Badge variant="outline" className="text-xs">{l.provaHora}</Badge>}
                </div>
                <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><Phone className="h-3 w-3" /> {l.telefone}</span>
                  <span>{l.tipoEvento}</span>
                </div>
              </div>
            ))}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
};

export default CalendarioVisitas;
