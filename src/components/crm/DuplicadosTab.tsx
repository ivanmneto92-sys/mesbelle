import { useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Merge, UserX } from "lucide-react";
import type { Lead } from "@/types/comercial";
import { useDuplicados } from "@/hooks/useDuplicados";
import { MesclarLeadsDialog } from "./MesclarLeadsDialog";

interface Props {
  leads: Lead[];
  onLeadClick: (lead: Lead) => void;
}

/**
 * Possíveis cadastros duplicados para o admin revisar. Telefone, e-mail e CPF
 * iguais já são bloqueados pelo banco; aqui aparecem os casos que dependem de
 * olho humano — mesmo nome (geralmente um deles sem telefone) e mesmo número
 * com DDD diferente.
 */
export function DuplicadosTab({ leads, onLeadClick }: Props) {
  const { pares, vinculos, carregando, mesclar, marcarNaoDuplicado } = useDuplicados();
  const [par, setPar] = useState<{ a: Lead; b: Lead } | null>(null);
  const leadPorId = useMemo(() => new Map(leads.map((l) => [l.id, l])), [leads]);

  const paresComDados = pares
    .map((p) => ({ ...p, a: leadPorId.get(p.leadA), b: leadPorId.get(p.leadB) }))
    .filter((p): p is typeof p & { a: Lead; b: Lead } => !!p.a && !!p.b);

  if (carregando) return <p className="text-sm text-muted-foreground py-8 text-center">Procurando duplicados…</p>;

  if (paresComDados.length === 0) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-sm text-muted-foreground flex flex-col items-center gap-2">
          <CheckCircle2 className="h-8 w-8 text-success" />
          Nenhum possível duplicado. Telefone, e-mail e CPF repetidos já são bloqueados automaticamente.
        </CardContent>
      </Card>
    );
  }

  const linha = (l: Lead) => {
    const v = vinculos[l.id];
    return (
      <button type="button" onClick={() => onLeadClick(l)} className="text-left rounded-md border p-2 hover:bg-muted/50 min-w-0">
        <p className="font-medium truncate">{l.nome}</p>
        <p className="text-xs text-muted-foreground truncate">
          {l.telefone || "sem telefone"}{l.email ? ` · ${l.email}` : ""}{l.cpf ? ` · CPF ${l.cpf}` : ""}
        </p>
        <p className="text-[11px] text-muted-foreground">
          {v ? `${v.agendamentos} agend. · ${v.vendas} venda(s)` : ""} · criado em {l.criadoEm?.slice(0, 10).split("-").reverse().join("/")}
        </p>
      </button>
    );
  };

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        {paresComDados.length} par(es) para revisar. Se forem a mesma cliente, mescle; se forem pessoas diferentes, marque “Não é duplicado” para tirar da lista.
      </p>
      {paresComDados.map((p) => (
        <Card key={`${p.leadA}-${p.leadB}`}>
          <CardContent className="p-3 space-y-2">
            <Badge variant="outline" className="text-xs">{p.motivo}</Badge>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {linha(p.a)}
              {linha(p.b)}
            </div>
            <div className="flex flex-wrap gap-2 justify-end">
              <Button size="sm" variant="ghost" onClick={() => marcarNaoDuplicado(p.leadA, p.leadB)}>
                <UserX className="h-4 w-4 mr-1" /> Não é duplicado
              </Button>
              <Button size="sm" onClick={() => setPar({ a: p.a, b: p.b })}>
                <Merge className="h-4 w-4 mr-1" /> Mesclar
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}

      <MesclarLeadsDialog
        open={!!par}
        onOpenChange={(o) => !o && setPar(null)}
        leadA={par?.a ?? null}
        leadB={par?.b ?? null}
        vinculos={vinculos}
        onMesclar={mesclar}
      />
    </div>
  );
}
