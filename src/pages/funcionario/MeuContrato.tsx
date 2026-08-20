import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { SEO } from "@/components/SEO";
import { FileSignature } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { useMeusLeads } from "@/hooks/useMeusLeads";
import { ContratosTab } from "@/components/comercial/ContratosTab";

const MeuContrato = () => {
  const [searchParams] = useSearchParams();
  const leadId = searchParams.get("leadId");
  const {
    contratos, negocios,
    addContratoFromNegocio, updateContratoStatus, assinarContrato, gerarLinkAssinatura,
  } = useMeusLeads();

  const negociosAprovados = negocios.filter((n) => n.statusNegociacao === "aprovado");
  const contratoDoLead = leadId ? contratos.find((c) => c.leadId === leadId) : null;
  const [autoOpenContratoId, setAutoOpenContratoId] = useState<string | null>(contratoDoLead?.id ?? null);

  return (
    <>
      <SEO title="Gerar Contrato — Més Belle" description="Crie o contrato e colete a assinatura da cliente." path="/meu-contrato" />
      <div className="space-y-6">
        <PageHeader icon={FileSignature} title="Gerar Contrato" description="Crie o contrato e colete a assinatura da cliente" />

        <ContratosTab
          contratos={contratos}
          negociosAprovados={negociosAprovados}
          onGerarContratoFromNegocio={addContratoFromNegocio}
          onUpdateStatus={updateContratoStatus}
          onAssinar={assinarContrato}
          onGerarLink={gerarLinkAssinatura}
          autoOpenContratoId={autoOpenContratoId}
          onAutoOpenHandled={() => setAutoOpenContratoId(null)}
        />
      </div>
    </>
  );
};

export default MeuContrato;
