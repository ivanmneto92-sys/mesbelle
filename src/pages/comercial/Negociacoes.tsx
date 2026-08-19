import { useOutletContext } from "react-router-dom";
import { SEO } from "@/components/SEO";
import { NegociacoesTab } from "@/components/comercial/NegociacoesTab";
import type { ComercialOutletContext } from "@/pages/comercial/types";

const Negociacoes = () => {
  const { negociosNoPeriodo, updateNegocio, aprovarFechamento, handleSwitchToContratos } =
    useOutletContext<ComercialOutletContext>();

  return (
    <>
      <SEO title="Negociações — Comercial — Més Belle" description="Acompanhe as negociações abertas e aprovadas." path="/comercial/negociacoes" />
      <NegociacoesTab
        negocios={negociosNoPeriodo}
        onUpdateNegocio={updateNegocio}
        onAprovarFechamento={aprovarFechamento}
        onSwitchToContratos={handleSwitchToContratos}
      />
    </>
  );
};

export default Negociacoes;
