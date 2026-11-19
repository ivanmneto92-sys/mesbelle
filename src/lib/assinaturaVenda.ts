import type { Contrato, Negocio } from "@/types/comercial";

/**
 * Situação da venda vista a partir do contrato:
 *  - "aguardando": venda em pré-venda, peça reservada, esperando a cliente assinar;
 *  - "legado": venda fechada antes da regra "só fecha com contrato assinado"
 *    e o contrato ainda não foi assinado (precisa coletar a assinatura);
 *  - "encerrada": pré-venda cancelada ou expirada;
 *  - "ok": contrato assinado (ou sem venda vinculada).
 */
export type StatusVendaContrato = "aguardando" | "legado" | "encerrada" | "ok";

export function statusVendaDoContrato(contrato: Contrato, negocio?: Negocio): StatusVendaContrato {
  if (contrato.statusAssinatura === "assinado") return "ok";
  if (!negocio) return "ok";
  if (negocio.statusNegociacao === "aguardando_assinatura" && contrato.statusAssinatura === "pendente") return "aguardando";
  if (negocio.statusNegociacao === "aprovado" && contrato.statusAssinatura === "pendente" && !negocio.aprovadoSemAssinaturaMotivo) return "legado";
  if (negocio.statusNegociacao === "cancelado" || negocio.statusNegociacao === "expirado") return "encerrada";
  return "ok";
}

/** "expira em 5h", "expira em 1d 3h", "expirada". */
export function tempoRestante(expiraEm?: string | null, agora: Date = new Date()): string {
  if (!expiraEm) return "sem prazo";
  const ms = new Date(expiraEm).getTime() - agora.getTime();
  if (ms <= 0) return "prazo vencido";
  const horas = Math.floor(ms / 3_600_000);
  if (horas < 1) return `expira em ${Math.max(1, Math.round(ms / 60_000))} min`;
  if (horas < 24) return `expira em ${horas}h`;
  return `expira em ${Math.floor(horas / 24)}d ${horas % 24}h`;
}

/**
 * Dia (YYYY-MM-DD, fuso de Brasília) em que a venda conta: o dia em que ela
 * fechou (assinatura → aprovado_em). Vendas antigas sem aprovado_em usam a
 * data de criação. É a mesma regra de data_venda_negocio() no banco, usada
 * pelo financeiro e pela faixa de comissão.
 */
export function dataVenda(n: { aprovadoEm?: string | null; criadoEm: string }): string {
  if (n.aprovadoEm) {
    return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(new Date(n.aprovadoEm));
  }
  return n.criadoEm.slice(0, 10);
}
