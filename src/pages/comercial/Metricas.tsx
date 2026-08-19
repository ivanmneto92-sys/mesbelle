import { useOutletContext } from "react-router-dom";
import { SEO } from "@/components/SEO";
import { MetricasTab } from "@/components/comercial/MetricasTab";
import type { ComercialOutletContext } from "@/pages/comercial/types";

const Metricas = () => {
  const { leads, contratos, negocios, range } = useOutletContext<ComercialOutletContext>();

  return (
    <>
      <SEO title="Métricas — Comercial — Més Belle" description="Funil de leads e ranking de vendedoras." path="/comercial/metricas" />
      <MetricasTab leads={leads} contratos={contratos} negocios={negocios} range={range} />
    </>
  );
};

export default Metricas;
