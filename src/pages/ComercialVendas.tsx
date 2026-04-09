import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, PlusCircle } from "lucide-react";
import { useLeads } from "@/hooks/useLeads";
import { NegociacoesTab } from "@/components/comercial/NegociacoesTab";
import { ContratosTab } from "@/components/comercial/ContratosTab";
import { MetricasTab } from "@/components/comercial/MetricasTab";

const ComercialVendas = () => {
  const {
    leads, negocios, contratos,
    updateNegocio, aprovarFechamento,
    addContratoFromNegocio, updateContratoStatus, assinarContrato,
  } = useLeads();

  const [activeTab, setActiveTab] = useState("negociacoes");

  const negociosAprovados = negocios.filter((n) => n.statusNegociacao === "aprovado");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold font-serif">Comercial</h1>
          <p className="text-muted-foreground text-sm">Vendas e contratos</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setActiveTab("contratos")}>
            <FileText className="h-4 w-4 mr-1" /> Emitir Contrato
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="negociacoes">Negociações Abertas</TabsTrigger>
          <TabsTrigger value="contratos">Contratos</TabsTrigger>
          <TabsTrigger value="metricas">Performance & Métricas</TabsTrigger>
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
  );
};

export default ComercialVendas;
