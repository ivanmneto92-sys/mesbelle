import { useState, useMemo } from "react";
import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, Handshake, BarChart3, ScrollText } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { useLeads } from "@/hooks/useLeads";
import { useDateRange } from "@/hooks/useDateRange";
import { useComercialKpis } from "@/hooks/useComercialKpis";
import { NegociacoesTab } from "@/components/comercial/NegociacoesTab";
import { ContratosTab } from "@/components/comercial/ContratosTab";
import { MetricasTab } from "@/components/comercial/MetricasTab";
import { ComercialKpiStrip } from "@/components/comercial/ComercialKpiStrip";

const ComercialVendas = () => {
  const {
    leads, negocios, contratos,
    updateNegocio, aprovarFechamento,
    addContratoFromNegocio, updateContratoStatus, assinarContrato, gerarLinkAssinatura,
  } = useLeads();
  const { range, setRange } = useDateRange();

  const [activeTab, setActiveTab] = useState("negociacoes");
  const [autoOpenContratoId, setAutoOpenContratoId] = useState<string | null>(null);

  const negociosNoPeriodo = useMemo(
    () => negocios.filter((n) => n.criadoEm >= range.from && n.criadoEm <= range.to),
    [negocios, range]
  );
  const contratosNoPeriodo = useMemo(
    () => contratos.filter((c) => c.dataCriacao >= range.from && c.dataCriacao <= range.to),
    [contratos, range]
  );

  const negociosAprovados = negociosNoPeriodo.filter((n) => n.statusNegociacao === "aprovado");
  const kpis = useComercialKpis(leads, contratos, negocios, range);

  const handleSwitchToContratos = (contratoId?: string) => {
    setActiveTab("contratos");
    if (contratoId) setAutoOpenContratoId(contratoId);
  };

  return (
    <>
    <SEO title="Comercial e Vendas — Més Belle" description="Acompanhe negociações, contratos e métricas comerciais." path="/comercial" />
    <div className="space-y-6">
      <PageHeader
        icon={Handshake}
        title="Comercial"
        description="Negociações, contratos e performance"
        actions={
          <Button variant="outline" size="sm" onClick={() => setActiveTab("contratos")}>
            <FileText className="h-4 w-4 mr-1" /> Emitir Contrato
          </Button>
        }
      />

      <ComercialKpiStrip kpis={kpis} range={range} onRangeChange={setRange} />

      <div className="border-t border-border-subtle" />

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full sm:w-auto overflow-x-auto justify-start">
          <TabsTrigger value="negociacoes"><Handshake className="h-4 w-4 mr-1.5" />Negociações</TabsTrigger>
          <TabsTrigger value="contratos"><ScrollText className="h-4 w-4 mr-1.5" />Contratos</TabsTrigger>
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

        <TabsContent value="contratos" className="mt-4">
          <ContratosTab
            contratos={contratosNoPeriodo}
            negociosAprovados={negociosAprovados}
            onGerarContratoFromNegocio={addContratoFromNegocio}
            onUpdateStatus={updateContratoStatus}
            onAssinar={assinarContrato}
            onGerarLink={gerarLinkAssinatura}
            autoOpenContratoId={autoOpenContratoId}
            onAutoOpenHandled={() => setAutoOpenContratoId(null)}
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

export default ComercialVendas;
