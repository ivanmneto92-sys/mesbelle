import { describe, it, expect } from "vitest";
import { statusVendaDoContrato, tempoRestante } from "./assinaturaVenda";
import type { Contrato, Negocio } from "@/types/comercial";

const contrato = (statusAssinatura: Contrato["statusAssinatura"]): Contrato => ({
  id: "c", numero: "MB-1", leadId: "l", negocioId: "n", nomeCliente: "A", cpfCliente: "1",
  dataEvento: "2027-01-01", dataCriacao: "2026-11-19", valorTotal: 100, statusAssinatura, termosTexto: "t",
});
const negocio = (statusNegociacao: Negocio["statusNegociacao"], extra: Partial<Negocio> = {}): Negocio => ({
  id: "n", clienteId: "l", clienteNome: "A", clienteCpf: "1", valorNegociado: 100, desconto: 0,
  metodoPagamento: "PIX", statusNegociacao, dataEvento: "2027-01-01", criadoEm: "2026-11-19", ...extra,
});

describe("statusVendaDoContrato", () => {
  it("pré-venda pendente aguarda assinatura", () => {
    expect(statusVendaDoContrato(contrato("pendente"), negocio("aguardando_assinatura"))).toBe("aguardando");
  });
  it("venda antiga aprovada sem assinatura é legado", () => {
    expect(statusVendaDoContrato(contrato("pendente"), negocio("aprovado"))).toBe("legado");
  });
  it("exceção do admin (com motivo) não é pendência", () => {
    expect(statusVendaDoContrato(contrato("pendente"), negocio("aprovado", { aprovadoSemAssinaturaMotivo: "cliente viajou" }))).toBe("ok");
  });
  it("expirada/cancelada é encerrada", () => {
    expect(statusVendaDoContrato(contrato("cancelado"), negocio("expirado"))).toBe("encerrada");
  });
  it("assinado é ok", () => {
    expect(statusVendaDoContrato(contrato("assinado"), negocio("aprovado"))).toBe("ok");
  });
});

describe("tempoRestante", () => {
  const agora = new Date("2026-11-19T12:00:00Z");
  it("formata horas e dias", () => {
    expect(tempoRestante("2026-11-19T17:00:00Z", agora)).toBe("expira em 5h");
    expect(tempoRestante("2026-11-21T03:00:00Z", agora)).toBe("expira em 1d 15h");
    expect(tempoRestante("2026-11-19T11:00:00Z", agora)).toBe("prazo vencido");
  });
});

import { dataVenda } from "./assinaturaVenda";
describe("dataVenda", () => {
  it("usa a data da assinatura no fuso de Brasília", () => {
    expect(dataVenda({ aprovadoEm: "2026-12-01T02:30:00Z", criadoEm: "2026-11-29" })).toBe("2026-11-30");
  });
  it("cai para a data de criação em vendas antigas", () => {
    expect(dataVenda({ aprovadoEm: null, criadoEm: "2026-10-02" })).toBe("2026-10-02");
  });
});
