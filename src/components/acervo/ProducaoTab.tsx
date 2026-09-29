import { useState } from "react";
import { Producao, EtapaProducao } from "@/types/acervo";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { CalendarIcon, Plus, AlertTriangle } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { ProducaoCard } from "./ProducaoCard";
import { DetalhesTecnicosSheet } from "./DetalhesTecnicosSheet";

type AlertaProducao = "atrasada" | "nao_iniciada" | null;

function alertaDaProducao(p: Producao, etapas: EtapaProducao[]): AlertaProducao {
  if (etapas.length === 0) return null;
  const concluida = etapas.every((e) => e.isConcluido);
  if (concluida) return null;
  const hoje = format(new Date(), "yyyy-MM-dd");
  if (p.dataPrazo < hoje) return "atrasada";
  if (etapas.every((e) => !e.isConcluido)) return "nao_iniciada";
  return null;
}

interface Props {
  producoes: Producao[];
  getEtapas: (producaoId: string) => EtapaProducao[];
  canManage: boolean;
  onToggleEtapa: (etapaId: string) => void;
  onAddProducao: (p: Omit<Producao, "id">) => void;
  onUpdateProducao: (id: string, patch: Partial<Producao>) => void;
}

export function ProducaoTab({ producoes, getEtapas, canManage, onToggleEtapa, onAddProducao, onUpdateProducao }: Props) {
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

  const alertas = producoes.map((p) => alertaDaProducao(p, getEtapas(p.id)));
  const qtdAtrasadas = alertas.filter((a) => a === "atrasada").length;
  const qtdNaoIniciadas = alertas.filter((a) => a === "nao_iniciada").length;

  return (
    <>
      {(qtdAtrasadas > 0 || qtdNaoIniciadas > 0) && (
        <Card className="border-destructive/30 bg-destructive/5 mb-4">
          <CardContent className="p-4 flex items-center gap-2 text-sm text-destructive">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <p>
              {qtdAtrasadas > 0 && (
                <>{qtdAtrasadas} produção{qtdAtrasadas > 1 ? "ões" : ""} atrasada{qtdAtrasadas > 1 ? "s" : ""}</>
              )}
              {qtdAtrasadas > 0 && qtdNaoIniciadas > 0 && " e "}
              {qtdNaoIniciadas > 0 && (
                <>{qtdNaoIniciadas} sem começar</>
              )}
              {" "}— confira abaixo.
            </p>
          </CardContent>
        </Card>
      )}

      <Card className="border-border/50">
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <CardTitle className="font-serif text-lg">Produção — Primeiro Aluguel</CardTitle>
          {canManage && (
            <Button size="sm" onClick={() => setShowNew(true)}>
              <Plus className="h-4 w-4 mr-1" /> Nova Produção
            </Button>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          {producoes.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">Nenhuma produção cadastrada.</p>
          ) : (
            producoes.map((p, i) => (
              <div key={p.id} className="relative">
                {alertas[i] && (
                  <Badge
                    variant="outline"
                    className={cn(
                      "absolute -top-2 right-4 z-[1] text-xs",
                      alertas[i] === "atrasada"
                        ? "bg-destructive text-destructive-foreground border-destructive"
                        : "bg-yellow-500 text-white border-yellow-500",
                    )}
                  >
                    <AlertTriangle className="h-3 w-3 mr-1" />
                    {alertas[i] === "atrasada" ? "Atrasada" : "Sem começar"}
                  </Badge>
                )}
                <ProducaoCard
                  producao={p}
                  etapas={getEtapas(p.id)}
                  canManage={canManage}
                  onToggleEtapa={onToggleEtapa}
                  onUploadRef={handleUploadRef}
                  onOpenDetalhes={() => setDetalhesProducao(p)}
                />
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* New production dialog */}
      {canManage && (
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
      )}

      {/* Technical details sheet */}
      {detalhesProducao && (
        <DetalhesTecnicosSheet
          open={!!detalhesProducao}
          onClose={() => setDetalhesProducao(null)}
          producao={detalhesProducao}
          canManage={canManage}
          onSave={(notas) => { onUpdateProducao(detalhesProducao.id, { notasTecnicas: notas }); setDetalhesProducao(null); }}
        />
      )}
    </>
  );
}
