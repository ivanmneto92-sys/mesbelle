import { useState } from "react";
import { useLocation, useSearchParams } from "react-router-dom";
import { SEO } from "@/components/SEO";
import { FileSignature } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { useMeusLeads } from "@/hooks/useMeusLeads";
import { ContratosTab } from "@/components/comercial/ContratosTab";

const MeuContrato = () => {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const {
    contratos, negocios,
    addContratoFromNegocio, assinarContrato, gerarLinkAssinatura, cancelarPreVenda,
  } = useMeusLeads();

  const negociosAprovados = negocios.filter((n) => n.statusNegociacao === "aprovado");
  // O contrato recém-criado vem pela URL/estado da navegação (logo depois de
  // "Confirmar aluguel"). Antes ele era procurado na lista de contratos no
  // primeiro render — quando ela ainda estava vazia — e nunca abria.
  const [autoOpenContratoId, setAutoOpenContratoId] = useState<string | null>(
    (location.state as { autoOpenContratoId?: string } | null)?.autoOpenContratoId
      ?? searchParams.get("contratoId"),
  );

  return (
    <>
      <SEO title="Contratos — Més Belle" description="Colete a assinatura da cliente para fechar a venda." path="/meu-contrato" />
      <div className="space-y-6">
        <PageHeader icon={FileSignature} title="Contratos" description="A venda só fecha com o contrato assinado — colete a assinatura no iPad ou envie o link" />

        <ContratosTab
          contratos={contratos}
          negocios={negocios}
          negociosAprovados={negociosAprovados}
          onGerarContratoFromNegocio={addContratoFromNegocio}
          onAssinar={assinarContrato}
          onGerarLink={gerarLinkAssinatura}
          onCancelarPreVenda={cancelarPreVenda}
          autoOpenContratoId={autoOpenContratoId}
          onAutoOpenHandled={() => setAutoOpenContratoId(null)}
        />
      </div>
    </>
  );
};

export default MeuContrato;
