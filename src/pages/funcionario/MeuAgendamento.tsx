import { useState } from "react";
import { SEO } from "@/components/SEO";
import { CalendarCheck2, Kanban } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import ComercialAgendamento from "@/pages/comercial/ComercialAgendamento";
import ComercialKanban from "@/pages/comercial/ComercialKanban";

type Aba = "form" | "kanban";

const MeuAgendamento = () => {
  const [aba, setAba] = useState<Aba>("form");

  return (
    <>
      <SEO title="Agendamento — Més Belle" description="Seus agendamentos de visitas, provas e entregas." path="/meu-agendamento" />
      <div className="space-y-6">
        <PageHeader icon={CalendarCheck2} title="Agendamento" description="Seus agendamentos de visitas, provas e entregas" />

        <div className="flex gap-2 flex-wrap">
          <Button variant={aba === "form" ? "default" : "outline"} size="sm" onClick={() => setAba("form")}>
            <CalendarCheck2 className="h-4 w-4 mr-1.5" /> Agendamentos
          </Button>
          <Button variant={aba === "kanban" ? "default" : "outline"} size="sm" onClick={() => setAba("kanban")}>
            <Kanban className="h-4 w-4 mr-1.5" /> Kanban
          </Button>
        </div>

        {aba === "form" && <ComercialAgendamento />}
        {aba === "kanban" && <ComercialKanban />}
      </div>
    </>
  );
};

export default MeuAgendamento;
