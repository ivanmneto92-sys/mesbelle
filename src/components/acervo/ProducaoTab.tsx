import { useState } from "react";
import { Producao, EtapaProducao } from "@/types/acervo";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon, Plus } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { ProducaoCard } from "./ProducaoCard";
import { DetalhesTecnicosSheet } from "./DetalhesTecnicosSheet";

interface Props {
  producoes: Producao[];
  getEtapas: (producaoId: string) => EtapaProducao[];
  onToggleEtapa: (etapaId: string) => void;
  onAddProducao: (p: Omit<Producao, "id">) => void;
  onUpdateProducao: (id: string, patch: Partial<Producao>) => void;
}

export function ProducaoTab({ producoes, getEtapas, onToggleEtapa, onAddProducao, onUpdateProducao }: Props) {
  const [showNew, setShowNew] = useState(false);
  const [detalhesProducao, setDetalhesProducao] = useState<Producao | null>(null);

  // new form
  const [titulo, setTitulo] = useState("");
  const [cliente, setCliente] = useState("");
  const [dataPrazo, setDataPrazo] = useState<Date>();
  const [dataProva, setDataProva] = useState<Date>();

  const handleAdd = () => {
    if (!titulo.trim() || !cliente.trim() || !dataPrazo || !dataProva) return;
    onAddProducao({
      tituloVestido: titulo,
      clienteNome: cliente,
      dataPrazo: format(dataPrazo, "yyyy-MM-dd"),
      dataProva: format(dataProva, "yyyy-MM-dd"),
      statusGeral: "em_producao",
      refImagensUrls: [],
      notasTecnicas: "",
    });
    setTitulo(""); setCliente(""); setDataPrazo(undefined); setDataProva(undefined);
    setShowNew(false);
  };

  const handleUploadRef = (producaoId: string, url: string) => {
    const prod = producoes.find(p => p.id === producaoId);
    if (prod) {
      onUpdateProducao(producaoId, { refImagensUrls: [...prod.refImagensUrls, url] });
    }
  };

  return (
    <>
      <Card className="border-border/50">
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <CardTitle className="font-serif text-lg">Produção — Primeiro Aluguel</CardTitle>
          <Button size="sm" onClick={() => setShowNew(true)}>
            <Plus className="h-4 w-4 mr-1" /> Nova Produção
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {producoes.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">Nenhuma produção cadastrada.</p>
          ) : (
            producoes.map((p) => (
              <ProducaoCard
                key={p.id}
                producao={p}
                etapas={getEtapas(p.id)}
                onToggleEtapa={onToggleEtapa}
                onUploadRef={handleUploadRef}
                onOpenDetalhes={() => setDetalhesProducao(p)}
              />
            ))
          )}
        </CardContent>
      </Card>

      {/* New production dialog */}
      <Dialog open={showNew} onOpenChange={setShowNew}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-serif">Nova Produção</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div>
              <Label>Título do Vestido</Label>
              <Input value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Ex: Vestido Sereia Pedraria" className="mt-1" />
            </div>
            <div>
              <Label>Nome da Cliente</Label>
              <Input value={cliente} onChange={(e) => setCliente(e.target.value)} placeholder="Ex: Maria Silva" className="mt-1" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Data Prazo</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={cn("w-full mt-1 justify-start text-left", !dataPrazo && "text-muted-foreground")}>
                      <CalendarIcon className="h-4 w-4 mr-2" />
                      {dataPrazo ? format(dataPrazo, "dd/MM/yyyy") : "Selecionar"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={dataPrazo} onSelect={setDataPrazo} className="p-3 pointer-events-auto" />
                  </PopoverContent>
                </Popover>
              </div>
              <div>
                <Label>Data Prova</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={cn("w-full mt-1 justify-start text-left", !dataProva && "text-muted-foreground")}>
                      <CalendarIcon className="h-4 w-4 mr-2" />
                      {dataProva ? format(dataProva, "dd/MM/yyyy") : "Selecionar"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={dataProva} onSelect={setDataProva} className="p-3 pointer-events-auto" />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
            <Button onClick={handleAdd} className="w-full" disabled={!titulo.trim() || !cliente.trim() || !dataPrazo || !dataProva}>
              Criar Produção
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Technical details sheet */}
      {detalhesProducao && (
        <DetalhesTecnicosSheet
          open={!!detalhesProducao}
          onClose={() => setDetalhesProducao(null)}
          producao={detalhesProducao}
          onSave={(notas) => { onUpdateProducao(detalhesProducao.id, { notasTecnicas: notas }); setDetalhesProducao(null); }}
        />
      )}
    </>
  );
}
