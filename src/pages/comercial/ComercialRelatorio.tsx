import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, Handshake, BarChart3 } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { useLeads } from "@/hooks/useLeads";
import { useDateRange } from "@/hooks/useDateRange";
import { useComercialKpis } from "@/hooks/useComercialKpis";
import { ComercialKpiStrip } from "@/components/comercial/ComercialKpiStrip";
import { NegociacoesTab } from "@/components/comercial/NegociacoesTab";
import { MetricasTab } from "@/components/comercial/MetricasTab";

const ComercialRelatorio = () => {
  const { leads, negocios, contratos, updateNegocio, aprovarFechamento } = useLeads();
  const { range, setRange } = useDateRange();
  const navigate = useNavigate();
  const [tab, setTab] = useState("negociacoes");

  const negociosNoPeriodo = negocios.filter((n) => n.criadoEm >= range.from && n.criadoEm <= range.to);
  const kpis = useComercialKpis(leads, contratos, negocios, range);

  const handleSwitchToContratos = (contratoId?: string) => {
    navigate("/comercial/contratos", { state: contratoId ? { autoOpenContratoId: contratoId } : undefined });
  };

  return (
    <>
      <SEO title="Relatório Comercial — Més Belle" description="Negociações e performance comercial." path="/comercial/relatorio" />
      <div className="space-y-6">
        <PageHeader
          icon={Handshake}
          title="Relatório Comercial"
          description="Negociações e performance"
          actions={
            <Button variant="outline" size="sm" onClick={() => navigate("/comercial/contratos")}>
              <FileText className="h-4 w-4 mr-1" /> Emitir Contrato
            </Button>
          }
        />

        <ComercialKpiStrip kpis={kpis} range={range} onRangeChange={setRange} />

        <div className="border-t border-border-subtle" />

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="w-full sm:w-auto overflow-x-auto justify-start">
            <TabsTrigger value="negociacoes"><Handshake className="h-4 w-4 mr-1.5" />Negociações</TabsTrigger>
            <TabsTrigger value="metricas"><BarChart3 className="h-4 w-4 mr-1.5" />Métricas</TabsTrigger>
          </TabsList>

          <TabsContent value="negociacoes" className="mt-4">
            <NegociacoesTab
              negocios={negociosNoPeriodo}
              onUpdateNegocio={updateNegocio}
              onAprovarFechamento={aprovarFechamento}
              onSwitchToContratos={handleSwitchToContratos}
            />
          </TabsContent>

          <TabsContent value="metricas" className="mt-4">
            <MetricasTab leads={leads} contratos={contratos} negocios={negocios} range={range} />
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
};

export default ComercialRelatorio;
