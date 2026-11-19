import { AlertTriangle, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ClienteExistente } from "@/hooks/useVerificarCliente";

const ROTULO: Record<ClienteExistente["campo"], string> = {
  telefone: "telefone",
  email: "e-mail",
  cpf: "CPF",
  telefone_parecido: "número (com outro DDD)",
};

interface Props {
  existentes: ClienteExistente[];
  /** Abre o cadastro existente (quando quem está logado pode vê-lo). */
  onAbrir?: (leadId: string) => void;
  /** Texto do botão — ex.: "Usar este cadastro" no agendamento. */
  rotuloAcao?: string;
}

/**
 * Aviso mostrado enquanto a pessoa digita: o telefone/e-mail/CPF já pertence
 * a outra cliente. Vermelho quando bloqueia (dado igual), amarelo quando é só
 * parecido (mesmo número com DDD diferente).
 */
export function AvisoClienteExistente({ existentes, onAbrir, rotuloAcao = "Abrir cadastro" }: Props) {
  if (existentes.length === 0) return null;

  // Um aviso por cliente, juntando os campos que bateram.
  const porCliente = new Map<string, { nome: string; visivel: boolean; campos: ClienteExistente["campo"][] }>();
  for (const e of existentes) {
    const atual = porCliente.get(e.leadId) ?? { nome: e.nome, visivel: e.visivel, campos: [] };
    if (!atual.campos.includes(e.campo)) atual.campos.push(e.campo);
    porCliente.set(e.leadId, atual);
  }

  return (
    <div className="space-y-2">
      {[...porCliente.entries()].map(([leadId, c]) => {
        const soParecido = c.campos.every((x) => x === "telefone_parecido");
        return (
          <div
            key={leadId}
            className={`rounded-md border p-3 text-sm flex flex-wrap items-center justify-between gap-2 ${
              soParecido ? "border-amber-300 bg-amber-50 text-amber-900" : "border-red-300 bg-red-50 text-red-900"
            }`}
          >
            <span className="flex items-start gap-1.5">
              {soParecido ? <Info className="h-4 w-4 mt-0.5 shrink-0" /> : <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />}
              <span>
                {soParecido ? "Mesmo número, com outro DDD, de " : "Esse "}
                {!soParecido && <>{c.campos.filter((x) => x !== "telefone_parecido").map((x) => ROTULO[x]).join(" e ")} já é de </>}
                <strong>{c.nome}</strong>.{" "}
                {soParecido
                  ? "Confira se não é a mesma cliente."
                  : c.visivel
                    ? "Use o cadastro dela em vez de criar outro."
                    : "Ela é atendida por outra vendedora — fale com um admin."}
              </span>
            </span>
            {onAbrir && c.visivel && (
              <Button type="button" size="sm" variant="outline" onClick={() => onAbrir(leadId)}>
                {rotuloAcao}
              </Button>
            )}
          </div>
        );
      })}
    </div>
  );
}
