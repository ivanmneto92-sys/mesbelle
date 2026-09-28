import { useState } from "react";
import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Plus, LayoutGrid } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { useAuth } from "@/contexts/AuthContext";
import { useAcervo } from "@/hooks/useAcervo";
import { CatalogoTab } from "@/components/acervo/CatalogoTab";
import { NovoVestidoSheet } from "@/components/acervo/NovoVestidoSheet";

const OperacionalAcervo = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const [showNovo, setShowNovo] = useState(false);
  const {
    vestidos, addVestido, updateVestido, deleteVestido,
    reservas, addReserva, getReservasForVestido,
  } = useAcervo();

  return (
    <>
      <SEO title="Acervo — Més Belle" description="Catálogo de peças, SKU e disponibilidade do ateliê." path="/operacional/acervo" />
      <div className="space-y-6">
        <PageHeader
          icon={LayoutGrid}
          title="Acervo"
          description="Gestão de peças, SKU e disponibilidade"
          actions={
            <Button size="sm" onClick={() => setShowNovo(true)}>
              <Plus className="h-4 w-4 mr-1" /> Nova Peça
            </Button>
          }
        />

        <CatalogoTab
          vestidos={vestidos}
          reservas={reservas}
          canManage={isAdmin}
          onUpdate={updateVestido}
          onDelete={deleteVestido}
          onAddReserva={addReserva}
          getReservas={getReservasForVestido}
        />

        <NovoVestidoSheet
          open={showNovo}
          onClose={() => setShowNovo(false)}
          onSave={addVestido}
        />
      </div>
    </>
  );
};

export default OperacionalAcervo;
