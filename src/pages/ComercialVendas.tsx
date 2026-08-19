import { useNavigate, Outlet } from "react-router-dom";
import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { FileText, Handshake } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { useLeads } from "@/hooks/useLeads";
import { useDateRange } from "@/hooks/useDateRange";
import { useComercialKpis } from "@/hooks/useComercialKpis";
import { ComercialKpiStrip } from "@/components/comercial/ComercialKpiStrip";
import type { ComercialOutletContext } from "@/pages/comercial/types";

const ComercialVendas = () => {
  const {
    leads, negocios, contratos,
    updateNegocio, aprovarFechamento,
    addContratoFromNegocio, updateContratoStatus, assinarContrato, gerarLinkAssinatura,
  } = useLeads();
  const { range, setRange } = useDateRange();
  const navigate = useNavigate();

  const negociosNoPeriodo = negocios.filter((n) => n.criadoEm >= range.from && n.criadoEm <= range.to);
  const contratosNoPeriodo = contratos.filter((c) => c.dataCriacao >= range.from && c.dataCriacao <= range.to);
  const negociosAprovados = negociosNoPeriodo.filter((n) => n.statusNegociacao === "aprovado");
  const kpis = useComercialKpis(leads, contratos, negocios, range);

  const handleSwitchToContratos = (contratoId?: string) => {
    navigate("/comercial/contratos", { state: contratoId ? { autoOpenContratoId: contratoId } : undefined });
  };

  const outletContext: ComercialOutletContext = {
    leads, negocios, contratos,
    negociosNoPeriodo, contratosNoPeriodo, negociosAprovados,
    range,
    updateNegocio, aprovarFechamento,
    addContratoFromNegocio, updateContratoStatus, assinarContrato, gerarLinkAssinatura,
    handleSwitchToContratos,
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
            <Button variant="outline" size="sm" onClick={() => navigate("/comercial/contratos")}>
              <FileText className="h-4 w-4 mr-1" /> Emitir Contrato
            </Button>
          }
        />

        <ComercialKpiStrip kpis={kpis} range={range} onRangeChange={setRange} />

        <div className="border-t border-border-subtle" />

        <Outlet context={outletContext} />
      </div>
    </>
  );
};

export default ComercialVendas;
