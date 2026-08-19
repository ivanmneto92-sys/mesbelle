import { useState } from "react";
import { useOutletContext, useLocation } from "react-router-dom";
import { SEO } from "@/components/SEO";
import { ContratosTab } from "@/components/comercial/ContratosTab";
import type { ComercialOutletContext } from "@/pages/comercial/types";

const Contratos = () => {
  const {
    contratosNoPeriodo, negociosAprovados,
    addContratoFromNegocio, updateContratoStatus, assinarContrato, gerarLinkAssinatura,
  } = useOutletContext<ComercialOutletContext>();
  const location = useLocation();
  const [autoOpenContratoId, setAutoOpenContratoId] = useState<string | null>(
    (location.state as { autoOpenContratoId?: string } | null)?.autoOpenContratoId ?? null
  );

  return (
    <>
      <SEO title="Contratos — Comercial — Més Belle" description="Emita, acompanhe e assine contratos de locação." path="/comercial/contratos" />
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
    </>
  );
};

export default Contratos;
