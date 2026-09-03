import { useState } from "react";
import { useLocation } from "react-router-dom";
import { SEO } from "@/components/SEO";
import { ScrollText } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { useLeads } from "@/hooks/useLeads";
import { useAcervo } from "@/hooks/useAcervo";
import { ContratosTab } from "@/components/comercial/ContratosTab";

const ComercialContratos = () => {
  const {
    leads, contratos,
    gerarContratoDireto, updateContratoStatus, assinarContrato, gerarLinkAssinatura,
  } = useLeads();
  const { vestidos } = useAcervo();
  const location = useLocation();
  const [autoOpenContratoId, setAutoOpenContratoId] = useState<string | null>(
    (location.state as { autoOpenContratoId?: string } | null)?.autoOpenContratoId ?? null
  );

  return (
    <>
      <SEO title="Contratos — Comercial — Més Belle" description="Emita, acompanhe e assine contratos de locação." path="/comercial/contratos" />
      <div className="space-y-6">
        <PageHeader icon={ScrollText} title="Contratos" description="Emissão, acompanhamento e assinatura de contratos" />
        <ContratosTab
          contratos={contratos}
          leads={leads}
          vestidos={vestidos}
          onGerarContratoDoLead={gerarContratoDireto}
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

export default ComercialContratos;
