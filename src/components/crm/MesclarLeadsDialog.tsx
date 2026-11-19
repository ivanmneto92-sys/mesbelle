import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Merge } from "lucide-react";
import type { Lead } from "@/types/comercial";
import type { VinculosLead } from "@/hooks/useDuplicados";

type Lado = "a" | "b";

// Campos que dá para escolher de qual cadastro vem. Notas dos dois são
// sempre juntadas; agendamentos, vendas, contratos e medidas vão todos para
// o cadastro mantido.
const CAMPOS: { chave: keyof Lead; coluna: string; rotulo: string }[] = [
  { chave: "nome", coluna: "nome", rotulo: "Nome" },
  { chave: "telefone", coluna: "telefone", rotulo: "Telefone" },
  { chave: "email", coluna: "email", rotulo: "E-mail" },
  { chave: "cpf", coluna: "cpf", rotulo: "CPF" },
  { chave: "endereco", coluna: "endereco", rotulo: "Endereço" },
  { chave: "tipoEvento", coluna: "tipo_evento", rotulo: "Tipo de evento" },
  { chave: "dataEvento", coluna: "data_evento", rotulo: "Data do evento" },
];

const pesoVinculos = (v?: VinculosLead) => (v ? v.vendas * 100 + v.contratos * 10 + v.agendamentos : 0);

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  leadA: Lead | null;
  leadB: Lead | null;
  vinculos: Record<string, VinculosLead>;
  onMesclar: (manterId: string, removerId: string, dados: Record<string, string>) => Promise<boolean>;
}

export function MesclarLeadsDialog({ open, onOpenChange, leadA, leadB, vinculos, onMesclar }: Props) {
  const [manter, setManter] = useState<Lado>("a");
  const [escolhas, setEscolhas] = useState<Record<string, Lado>>({});
  const [salvando, setSalvando] = useState(false);

  // Padrão: mantém o cadastro com mais vínculos (vendas > contratos >
  // agendamentos) e, campo a campo, o valor dele — ou o do outro quando o
  // dele está vazio.
  useEffect(() => {
    if (!leadA || !leadB) return;
    const lado: Lado = pesoVinculos(vinculos[leadB.id]) > pesoVinculos(vinculos[leadA.id]) ? "b" : "a";
    setManter(lado);
    const principal = lado === "a" ? leadA : leadB;
    const inicial: Record<string, Lado> = {};
    for (const c of CAMPOS) {
      const vazio = !String(principal[c.chave] ?? "").trim();
      inicial[c.coluna] = vazio ? (lado === "a" ? "b" : "a") : lado;
    }
    setEscolhas(inicial);
  }, [leadA, leadB, vinculos]);

  const dados = useMemo(() => {
    const out: Record<string, string> = {};
    if (!leadA || !leadB) return out;
    for (const c of CAMPOS) {
      const origem = escolhas[c.coluna] === "b" ? leadB : leadA;
      out[c.coluna] = String(origem[c.chave] ?? "");
    }
    return out;
  }, [escolhas, leadA, leadB]);

  if (!leadA || !leadB) return null;
  const leads: Record<Lado, Lead> = { a: leadA, b: leadB };
  const outro: Lado = manter === "a" ? "b" : "a";

  const confirmar = async () => {
    setSalvando(true);
    const ok = await onMesclar(leads[manter].id, leads[outro].id, dados);
    setSalvando(false);
    if (ok) onOpenChange(false);
  };

  const resumoVinculos = (id: string) => {
    const v = vinculos[id] ?? { agendamentos: 0, vendas: 0, contratos: 0 };
    return `${v.agendamentos} agend. · ${v.vendas} venda(s) · ${v.contratos} contrato(s)`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-serif flex items-center gap-2"><Merge className="h-5 w-5" /> Mesclar cadastros</DialogTitle>
          <DialogDescription>
            Escolha qual cadastro fica e, em cada linha, qual informação manter. Tudo do outro cadastro
            (agendamentos, vendas, contratos, medidas e notas) passa para o que fica, e ele é removido.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-[120px_1fr_1fr] gap-2 text-sm items-stretch">
          <div />
          {(["a", "b"] as Lado[]).map((lado) => (
            <button
              key={lado}
              type="button"
              onClick={() => setManter(lado)}
              className={`rounded-lg border p-2 text-left transition-colors ${manter === lado ? "border-primary bg-primary/5" : "hover:bg-muted/50"}`}
            >
              <div className="flex items-center justify-between gap-1">
                <span className="font-medium truncate">{leads[lado].nome}</span>
                {manter === lado ? <Badge className="text-[10px]">Fica</Badge> : <Badge variant="outline" className="text-[10px]">Sai</Badge>}
              </div>
              <p className="text-[11px] text-muted-foreground mt-0.5">{resumoVinculos(leads[lado].id)}</p>
              <p className="text-[11px] text-muted-foreground">Criado em {leads[lado].criadoEm?.slice(0, 10).split("-").reverse().join("/")}</p>
            </button>
          ))}

          {CAMPOS.map((c) => (
            <div key={c.coluna} className="contents">
              <div className="text-xs text-muted-foreground self-center">{c.rotulo}</div>
              {(["a", "b"] as Lado[]).map((lado) => {
                const valor = String(leads[lado][c.chave] ?? "");
                const escolhido = escolhas[c.coluna] === lado;
                return (
                  <button
                    key={lado}
                    type="button"
                    onClick={() => setEscolhas((e) => ({ ...e, [c.coluna]: lado }))}
                    className={`rounded-md border px-2 py-1.5 text-left min-h-[34px] break-words transition-colors ${
                      escolhido ? "border-primary bg-primary/10 font-medium" : "text-muted-foreground hover:bg-muted/50"
                    }`}
                  >
                    {valor || <span className="italic opacity-60">vazio</span>}
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        <p className="text-xs text-muted-foreground">
          O cadastro <strong>{leads[outro].nome}</strong> será removido. Uma cópia fica guardada no backup.
        </p>
        <Button onClick={confirmar} disabled={salvando || !dados.nome?.trim()} className="w-full">
          {salvando ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Merge className="h-4 w-4 mr-2" />}
          Mesclar em “{dados.nome || leads[manter].nome}”
        </Button>
      </DialogContent>
    </Dialog>
  );
}
