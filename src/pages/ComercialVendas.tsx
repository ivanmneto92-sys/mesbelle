import { useState } from "react";
import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, Handshake, BarChart3, ScrollText } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { useLeads } from "@/hooks/useLeads";
import { NegociacoesTab } from "@/components/comercial/NegociacoesTab";
import { ContratosTab } from "@/components/comercial/ContratosTab";
import { MetricasTab } from "@/components/comercial/MetricasTab";

const ComercialVendas = () => {
  const {
    leads, negocios, contratos,
    updateNegocio, aprovarFechamento,
    addContratoFromNegocio, updateContratoStatus, assinarContrato, gerarLinkAssinatura,
  } = useLeads();

  const [activeTab, setActiveTab] = useState("negociacoes");

  const negociosAprovados = negocios.filter((n) => n.statusNegociacao === "aprovado");

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

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full sm:w-auto overflow-x-auto justify-start">
          <TabsTrigger value="negociacoes"><Handshake className="h-4 w-4 mr-1.5" />Negociações</TabsTrigger>
          <TabsTrigger value="contratos"><ScrollText className="h-4 w-4 mr-1.5" />Contratos</TabsTrigger>
          <TabsTrigger value="metricas"><BarChart3 className="h-4 w-4 mr-1.5" />Métricas</TabsTrigger>
        </TabsList>

        <TabsContent value="negociacoes" className="mt-4">
          <NegociacoesTab
            negocios={negocios}
            onUpdateNegocio={updateNegocio}
            onAprovarFechamento={aprovarFechamento}
            onSwitchToContratos={() => setActiveTab("contratos")}
          />
        </TabsContent>

        <TabsContent value="contratos" className="mt-4">
          <ContratosTab
            contratos={contratos}
            negociosAprovados={negociosAprovados}
            onGerarContratoFromNegocio={addContratoFromNegocio}
            onUpdateStatus={updateContratoStatus}
            onAssinar={assinarContrato}
          />
        </TabsContent>

        <TabsContent value="metricas" className="mt-4">
          <MetricasTab leads={leads} contratos={contratos} negocios={negocios} />
        </TabsContent>
      </Tabs>
    </div>
    </>
  );
};

export default ComercialVendas;
