import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Send, Truck, User, AlertTriangle, FileText, Scissors, Shirt } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { useAuth } from "@/contexts/AuthContext";
import { useLogistica } from "@/hooks/useLogistica";
import { useAcervo } from "@/hooks/useAcervo";
import { useJornadaAluguel } from "@/hooks/useJornadaAluguel";
import { useDateRange } from "@/hooks/useDateRange";
import { DateRangePicker } from "@/components/common/DateRangePicker";
import { StatusLogistica } from "@/types/logistica";
import LogisticaDetalhesSheet from "@/components/logistica/LogisticaDetalhesSheet";
import TermoRetiradaModal from "@/components/logistica/TermoRetiradaModal";
import { ProducaoTab } from "@/components/acervo/ProducaoTab";
import { AluguelTab } from "@/components/logistica/AluguelTab";
import { useState } from "react";
import type { AluguelLogistica } from "@/types/logistica";

const groups: { status: StatusLogistica; title: string; icon: React.ElementType; color: string; badge: string }[] = [
  { status: "para_enviar", title: "Para Enviar", icon: Send, color: "text-info", badge: "bg-info/20 text-info" },
  { status: "em_transito", title: "Em Trânsito", icon: Truck, color: "text-warning", badge: "bg-warning/20 text-warning" },
  { status: "com_cliente", title: "Com Cliente", icon: User, color: "text-success", badge: "bg-success/20 text-success" },
  { status: "atrasado", title: "Atrasado", icon: AlertTriangle, color: "text-destructive", badge: "bg-destructive/20 text-destructive" },
];

function getDiasAtraso(dataRetorno: string): number {
  const today = new Date();
  const retorno = new Date(dataRetorno);
  const diff = Math.floor((today.getTime() - retorno.getTime()) / 86400000);
  return Math.max(0, diff);
}

const OperacionalLogistica = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const { range, setRange } = useDateRange();
  const { items, updateStatus, updateRastreio, assinarTermo, getByStatus } = useLogistica(range);
  const { producoes, addProducao, updateProducao, toggleEtapa: toggleEtapaProducao, getEtapasForProducao } = useAcervo();
  const { itens: itensAluguel, toggleEtapa: toggleEtapaAluguel, getEtapasForReserva } = useJornadaAluguel();
  const [detailItem, setDetailItem] = useState<AluguelLogistica | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [termoOpen, setTermoOpen] = useState(false);

  const formatDate = (d: string) => {
    const [y, m, day] = d.split("-");
    return `${day}/${m}/${y}`;
  };

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

        <TabsContent value="envios" className="mt-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {groups.map((g) => {
              const groupItems = getByStatus(g.status);
              const isAtrasado = g.status === "atrasado";
              return (
                <Card key={g.status} className="shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base font-serif flex items-center gap-2">
                      <g.icon className={`h-4 w-4 ${g.color}`} />
                      {g.title}
                      <Badge className={`${g.badge} border-0 ml-auto`}>{groupItems.length}</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {groupItems.length === 0 && (
                        <p className="text-xs text-muted-foreground text-center py-4">Nenhum item</p>
                      )}
                      {groupItems.map((item) => {
                        const diasAtraso = isAtrasado ? getDiasAtraso(item.dataRetorno) : 0;
                        return (
                          <div key={item.id} className="flex items-center justify-between p-3 rounded-lg border">
                            <div>
                              <p className={`text-sm font-medium ${isAtrasado ? "text-destructive" : ""}`}>
                                {item.vestidoNome}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {item.clienteNome} • {formatDate(item.dataSaida)}
                              </p>
                              {isAtrasado && diasAtraso > 0 && (
                                <p className="text-xs text-destructive font-medium mt-0.5">
                                  ⚠ {diasAtraso} dia{diasAtraso > 1 ? "s" : ""} de atraso
                                </p>
                              )}
                            </div>
                            <Button variant="outline" size="sm" onClick={() => openDetails(item)}>Detalhes</Button>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
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
        onUpdateRastreio={updateRastreio}
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
