import { CalendarClock } from "lucide-react";
import { SEO } from "@/components/SEO";
import { PageHeader } from "@/components/layout/PageHeader";
import { GoogleCalendarEmbed } from "@/components/common/GoogleCalendarEmbed";

const calendarId = import.meta.env.VITE_GOOGLE_CALENDAR_ID ?? "";

const legendItems = [
  { dot: "bg-destructive", label: "Prova agendada" },
  { dot: "bg-success", label: "Saída de vestido" },
  { dot: "bg-warning", label: "Devolução prevista" },
];

const CalendarioAgenda = () => {
  return (
    <>
      <SEO title="Prova & Entregas — Més Belle" description="Provas agendadas e movimentação de vestidos." path="/agendamento/agenda" />
      <div className="space-y-6">
        <PageHeader
          icon={CalendarClock}
          title="Calendário de Provas & Entregas"
          description="Provas agendadas e movimentação de vestidos"
        />

        <div className="flex flex-wrap items-center gap-4 px-1">
          {legendItems.map((it) => (
            <span key={it.label} className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className={`h-2 w-2 rounded-full ${it.dot}`} />
              {it.label}
            </span>
          ))}
        </div>

        {calendarId ? (
          <GoogleCalendarEmbed calendarId={calendarId} height={650} />
        ) : (
          <div className="text-muted-foreground text-sm p-6 border border-border-subtle rounded-xl">
            Configure <code className="font-mono">VITE_GOOGLE_CALENDAR_ID</code> no <code className="font-mono">.env</code> para exibir o calendário.
          </div>
        )}
      </div>
    </>
  );
};

export default CalendarioAgenda;
