import { useMemo, useState } from "react";
import { Lead } from "@/types/comercial";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, ChevronLeft, ChevronRight } from "lucide-react";
import { format, addDays, startOfWeek, isSameDay, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

interface AgendaProvasTabProps {
  leads: Lead[];
  onLeadClick: (lead: Lead) => void;
}

export function AgendaProvasTab({ leads, onLeadClick }: AgendaProvasTabProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<"semana" | "dia">("semana");

  const leadsComProva = useMemo(() =>
    leads.filter((l) => l.provaData), [leads]);

  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const getLeadsForDay = (day: Date) =>
    leadsComProva.filter((l) => l.provaData && isSameDay(parseISO(l.provaData), day));

  const navigate = (dir: number) => {
    setCurrentDate((prev) => addDays(prev, view === "semana" ? dir * 7 : dir));
  };

  const hours = Array.from({ length: 11 }, (_, i) => i + 8); // 8h–18h

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => navigate(-1)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm font-medium min-w-[200px] text-center">
            {view === "semana"
              ? `${format(weekDays[0], "dd MMM", { locale: ptBR })} — ${format(weekDays[6], "dd MMM yyyy", { locale: ptBR })}`
              : format(currentDate, "EEEE, dd 'de' MMMM", { locale: ptBR })}
          </span>
          <Button variant="outline" size="icon" onClick={() => navigate(1)}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex gap-1">
          <Button size="sm" variant={view === "semana" ? "default" : "outline"} onClick={() => setView("semana")}>
            Semana
          </Button>
          <Button size="sm" variant={view === "dia" ? "default" : "outline"} onClick={() => setView("dia")}>
            Dia
          </Button>
        </div>
      </div>

      {view === "semana" ? (
        <div className="grid grid-cols-7 gap-2">
          {weekDays.map((day) => {
            const dayLeads = getLeadsForDay(day);
            const isToday = isSameDay(day, new Date());
            return (
              <Card key={day.toISOString()} className={`min-h-[200px] ${isToday ? "ring-2 ring-primary/30" : ""}`}>
                <CardHeader className="p-3 pb-1">
                  <CardTitle className="text-xs font-medium flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    <span className={isToday ? "text-primary font-bold" : "text-muted-foreground"}>
                      {format(day, "EEE dd", { locale: ptBR })}
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-2 space-y-1.5">
                  {dayLeads.map((lead) => (
                    <button
                      key={lead.id}
                      onClick={() => onLeadClick(lead)}
                      className="w-full text-left p-2 rounded-md bg-primary/10 hover:bg-primary/20 transition-colors"
                    >
                      <p className="text-xs font-semibold truncate">{lead.nome}</p>
                      <div className="flex items-center gap-1 text-[10px] text-muted-foreground mt-0.5">
                        <Clock className="h-2.5 w-2.5" />
                        {lead.provaHora || "Horário a definir"}
                      </div>
                    </button>
                  ))}
                  {dayLeads.length === 0 && (
                    <p className="text-[10px] text-muted-foreground/40 text-center py-4">—</p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            {hours.map((hour) => {
              const dayLeads = getLeadsForDay(currentDate).filter(
                (l) => l.provaHora && parseInt(l.provaHora.split(":")[0]) === hour
              );
              return (
                <div key={hour} className="flex border-b last:border-b-0 min-h-[60px]">
                  <div className="w-16 shrink-0 p-2 text-xs text-muted-foreground font-medium border-r flex items-start justify-center pt-3">
                    {String(hour).padStart(2, "0")}:00
                  </div>
                  <div className="flex-1 p-2 space-y-1">
                    {dayLeads.map((lead) => (
                      <button
                        key={lead.id}
                        onClick={() => onLeadClick(lead)}
                        className="w-full text-left p-2 rounded-md bg-primary/10 hover:bg-primary/20 transition-colors flex items-center gap-2"
                      >
                        <Badge className="bg-primary/20 text-primary text-[10px]">{lead.provaHora}</Badge>
                        <span className="text-sm font-medium">{lead.nome}</span>
                        <Badge variant="outline" className="text-[10px] ml-auto">{lead.tipoEvento}</Badge>
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {leadsComProva.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <Calendar className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p className="text-sm">Nenhuma prova agendada</p>
        </div>
      )}
    </div>
  );
}
