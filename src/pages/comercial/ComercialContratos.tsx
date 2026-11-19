import { useState } from "react";
import { useLocation } from "react-router-dom";
import { SEO } from "@/components/SEO";
import { ScrollText } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { useLeads } from "@/hooks/useLeads";
import { useAcervo } from "@/hooks/useAcervo";
import { useAuth } from "@/contexts/AuthContext";
import { ContratosTab } from "@/components/comercial/ContratosTab";

const ComercialContratos = () => {
  const {
    leads, contratos, negocios,
    gerarContratoDireto, assinarContrato, gerarLinkAssinatura,
    cancelarPreVenda, aprovarSemAssinatura,
  } = useLeads();
  const { vestidos } = useAcervo();
  const { user } = useAuth();
  const location = useLocation();
  const [autoOpenContratoId, setAutoOpenContratoId] = useState<string | null>(
    (location.state as { autoOpenContratoId?: string } | null)?.autoOpenContratoId ?? null
  );

  return (
    <>
      <SEO title="Contratos — Comercial — Més Belle" description="Emita, acompanhe e assine contratos de locação." path="/comercial/contratos" />
      <div className="space-y-6">
        <PageHeader icon={ScrollText} title="Contratos" description="A venda só fecha com o contrato assinado — colete a assinatura no iPad ou envie o link" />
        <ContratosTab
          contratos={contratos}
          negocios={negocios}
          leads={leads}
          vestidos={vestidos}
          isAdmin={user?.role === "admin"}
          onGerarContratoDoLead={gerarContratoDireto}
          onAssinar={assinarContrato}
          onGerarLink={gerarLinkAssinatura}
          onCancelarPreVenda={cancelarPreVenda}
          onAprovarSemAssinatura={aprovarSemAssinatura}
          autoOpenContratoId={autoOpenContratoId}
          onAutoOpenHandled={() => setAutoOpenContratoId(null)}
        />
      </div>
    </>
  );
};

export default ComercialContratos;
