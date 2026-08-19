import { SEO } from "@/components/SEO";
import { Scissors } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { useAcervo } from "@/hooks/useAcervo";
import { ProducaoTab } from "@/components/acervo/ProducaoTab";

const OperacionalProducao = () => {
  const { producoes, addProducao, updateProducao, toggleEtapa, getEtapasForProducao } = useAcervo();

  return (
    <>
      <SEO title="Produção — Més Belle" description="Linha de produção e etapas de confecção das peças." path="/operacional/producao" />
      <div className="space-y-6">
        <PageHeader icon={Scissors} title="Produção" description="Linha de produção e etapas de confecção" />

        <ProducaoTab
          producoes={producoes}
          getEtapas={getEtapasForProducao}
          onToggleEtapa={toggleEtapa}
          onAddProducao={addProducao}
          onUpdateProducao={updateProducao}
        />
      </div>
    </>
  );
};

export default OperacionalProducao;
