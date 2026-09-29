import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Truck, FileText, Scissors, Shirt } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { useAuth } from "@/contexts/AuthContext";
import { useLogistica } from "@/hooks/useLogistica";
import { useAcervo } from "@/hooks/useAcervo";
import { useJornadaAluguel } from "@/hooks/useJornadaAluguel";
import { useDateRange } from "@/hooks/useDateRange";
import { DateRangePicker } from "@/components/common/DateRangePicker";
import LogisticaDetalhesSheet from "@/components/logistica/LogisticaDetalhesSheet";
import TermoRetiradaModal from "@/components/logistica/TermoRetiradaModal";
import { LogisticaKanban } from "@/components/logistica/LogisticaKanban";
import { ProducaoTab } from "@/components/acervo/ProducaoTab";
import { AluguelTab } from "@/components/logistica/AluguelTab";
import { useState } from "react";
import type { AluguelLogistica } from "@/types/logistica";

const OperacionalLogistica = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const { range, setRange } = useDateRange();
  const { items, updateStatus, assinarTermo } = useLogistica(range);
  const { producoes, addProducao, updateProducao, toggleEtapa: toggleEtapaProducao, getEtapasForProducao } = useAcervo();
  const { itens: itensAluguel, toggleEtapa: toggleEtapaAluguel, getEtapasForReserva } = useJornadaAluguel();
  const [detailItem, setDetailItem] = useState<AluguelLogistica | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [termoOpen, setTermoOpen] = useState(false);

  const openDetails = (item: AluguelLogistica) => {
    setDetailItem(item);
    setSheetOpen(true);
  };

  return (
    <>
    <SEO title="Logística — Més Belle" description="Envios, retiradas, devoluções e o mapa do aluguel dos vestidos." path="/operacional/logistica" />
    <div className="space-y-6">
      <PageHeader
        icon={Truck}
        title="Logística"
        description="Entregas, retiradas, devoluções e o mapa do aluguel"
        actions={
          isAdmin ? (
            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              <DateRangePicker value={range} onChange={setRange} />
              <Button size="sm" onClick={() => setTermoOpen(true)}>
                <FileText className="h-4 w-4 mr-1" /> Gerar Termo de Retirada
              </Button>
            </div>
          ) : undefined
        }
      />

      <Tabs defaultValue="envios">
        <TabsList className="w-full sm:w-auto overflow-x-auto justify-start">
          <TabsTrigger value="envios"><Truck className="h-4 w-4 mr-1.5" />Envios & Retiradas</TabsTrigger>
          <TabsTrigger value="primeiro-aluguel"><Scissors className="h-4 w-4 mr-1.5" />Primeiro Aluguel</TabsTrigger>
          <TabsTrigger value="aluguel"><Shirt className="h-4 w-4 mr-1.5" />Aluguel</TabsTrigger>
        </TabsList>

        <TabsContent value="envios" className="mt-4">
          <LogisticaKanban
            items={items}
            canManage={isAdmin}
            onStatusChange={updateStatus}
            onItemClick={openDetails}
          />
        </TabsContent>

        <TabsContent value="primeiro-aluguel" className="mt-4">
          <ProducaoTab
            producoes={producoes}
            getEtapas={getEtapasForProducao}
            canManage={isAdmin}
            onToggleEtapa={toggleEtapaProducao}
            onAddProducao={addProducao}
            onUpdateProducao={updateProducao}
          />
        </TabsContent>

        <TabsContent value="aluguel" className="mt-4">
          <AluguelTab
            itens={itensAluguel}
            getEtapas={getEtapasForReserva}
            canManage={isAdmin}
            onToggleEtapa={toggleEtapaAluguel}
          />
        </TabsContent>
      </Tabs>

      <LogisticaDetalhesSheet
        item={detailItem}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        onUpdateStatus={updateStatus}
        canManage={isAdmin}
      />

      {isAdmin && (
        <TermoRetiradaModal items={items} open={termoOpen} onOpenChange={setTermoOpen} onAssinar={assinarTermo} />
      )}
    </div>
    </>
  );
};

export default OperacionalLogistica;
