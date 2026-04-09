import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useAcervo } from "@/hooks/useAcervo";
import { CatalogoTab } from "@/components/acervo/CatalogoTab";
import { ProducaoTab } from "@/components/acervo/ProducaoTab";
import { NovoVestidoSheet } from "@/components/acervo/NovoVestidoSheet";

const Acervo = () => {
  const [showNovo, setShowNovo] = useState(false);
  const {
    vestidos, addVestido, updateVestido, deleteVestido,
    reservas, addReserva, getReservasForVestido,
    producoes, addProducao, updateProducao,
    toggleEtapa, getEtapasForProducao,
  } = useAcervo();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-serif">Acervo & Produção</h1>
          <p className="text-muted-foreground text-sm">Gestão de inventário e ateliê</p>
        </div>
        <Button size="sm" onClick={() => setShowNovo(true)}>
          <Plus className="h-4 w-4 mr-1" /> Novo Vestido
        </Button>
      </div>

      <Tabs defaultValue="catalogo">
        <TabsList>
          <TabsTrigger value="catalogo">Catálogo</TabsTrigger>
          <TabsTrigger value="producao">Produção</TabsTrigger>
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
  );
};

export default Acervo;
