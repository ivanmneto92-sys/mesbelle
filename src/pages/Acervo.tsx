import { useState } from "react";
import { SEO } from "@/components/SEO";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Plus, ShoppingBag, LayoutGrid, Scissors } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { useAcervo } from "@/hooks/useAcervo";
import { useDateRange } from "@/hooks/useDateRange";
import { DateRangePicker } from "@/components/common/DateRangePicker";
import { CatalogoTab } from "@/components/acervo/CatalogoTab";
import { ProducaoTab } from "@/components/acervo/ProducaoTab";
import { NovoVestidoSheet } from "@/components/acervo/NovoVestidoSheet";

const Acervo = () => {
  const [showNovo, setShowNovo] = useState(false);
  const { range, setRange } = useDateRange();
  const {
    vestidos, addVestido, updateVestido, deleteVestido,
    reservas, addReserva, getReservasForVestido,
    producoes, addProducao, updateProducao,
    toggleEtapa, getEtapasForProducao,
  } = useAcervo(range);

  return (
    <>
    <SEO title="Acervo e Produção — Més Belle" description="Catálogo de vestidos e controle de produção do ateliê Més Belle." path="/acervo" />
    <div className="space-y-6">
      <PageHeader
        icon={ShoppingBag}
        title="Acervo & Produção"
        description="Inventário, reservas e linha de produção"
        actions={
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <DateRangePicker value={range} onChange={setRange} />
            <Button size="sm" onClick={() => setShowNovo(true)}>
              <Plus className="h-4 w-4 mr-1" /> Novo Vestido
            </Button>
          </div>
        }
      />

      <Tabs defaultValue="catalogo">
        <TabsList className="w-full sm:w-auto overflow-x-auto justify-start">
          <TabsTrigger value="catalogo"><LayoutGrid className="h-4 w-4 mr-1.5" />Catálogo</TabsTrigger>
          <TabsTrigger value="producao"><Scissors className="h-4 w-4 mr-1.5" />Produção</TabsTrigger>
        </TabsList>

        <TabsContent value="catalogo" className="mt-4">
          <CatalogoTab
            vestidos={vestidos}
            reservas={reservas}
            onUpdate={updateVestido}
            onDelete={deleteVestido}
            onAddReserva={addReserva}
            getReservas={getReservasForVestido}
          />
        </TabsContent>

        <TabsContent value="producao" className="mt-4">
          <ProducaoTab
            producoes={producoes}
            getEtapas={getEtapasForProducao}
            onToggleEtapa={toggleEtapa}
            onAddProducao={addProducao}
            onUpdateProducao={updateProducao}
          />
        </TabsContent>
      </Tabs>

      <NovoVestidoSheet
        open={showNovo}
        onClose={() => setShowNovo(false)}
        onSave={addVestido}
      />
    </div>
    </>
  );
};

export default Acervo;
