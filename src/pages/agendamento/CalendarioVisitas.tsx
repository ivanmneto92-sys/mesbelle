import { CalendarCheck } from "lucide-react";
import { SEO } from "@/components/SEO";
import { PageHeader } from "@/components/layout/PageHeader";
import { GoogleCalendarEmbed } from "@/components/common/GoogleCalendarEmbed";

const calendarId = import.meta.env.VITE_GOOGLE_CALENDAR_ID ?? "";

const CalendarioVisitas = () => {
  return (
    <>
      <SEO title="Calendário de Visitas — Més Belle" description="Visão mensal das visitas e provas agendadas." path="/agendamento/visitas" />
      <div className="space-y-6">
        <PageHeader
          icon={CalendarCheck}
          title="Calendário de Visitas"
          description="Visão mensal dos clientes com visita ou prova agendada"
        />

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

export default CalendarioVisitas;
