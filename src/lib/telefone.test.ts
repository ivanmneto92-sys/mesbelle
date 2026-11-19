import { describe, it, expect } from "vitest";
import { normalizarTelefone, mesmoTelefone, erroTelefoneDuplicado, campoDuplicado } from "./telefone";

describe("normalizarTelefone", () => {
  it("remove máscara, espaços e o 55 do Brasil", () => {
    expect(normalizarTelefone("(31) 99541-2686")).toBe("31995412686");
    expect(normalizarTelefone("+55 31 99541-2686")).toBe("31995412686");
    expect(normalizarTelefone("031 99541 2686")).toBe("31995412686");
  });
  it("completa o 9º dígito de celular quando falta", () => {
    expect(normalizarTelefone("3199011919")).toBe("31999011919");
    expect(normalizarTelefone("(31) 9974-1225")).toBe("31999741225");
  });
  it("não mexe em telefone fixo", () => {
    expect(normalizarTelefone("3132221111")).toBe("3132221111");
  });
  it("vazio continua vazio", () => {
    expect(normalizarTelefone("")).toBe("");
    expect(normalizarTelefone(null)).toBe("");
  });
});

describe("mesmoTelefone", () => {
  it("compara formatos diferentes do mesmo número", () => {
    expect(mesmoTelefone("31 9 71518486", "31971518486")).toBe(true);
    expect(mesmoTelefone("", "")).toBe(false);
  });
});

describe("erroTelefoneDuplicado", () => {
  it("reconhece unique_violation", () => {
    expect(erroTelefoneDuplicado({ code: "23505" })).toBe(true);
    expect(erroTelefoneDuplicado({ code: "42501" })).toBe(false);
    expect(erroTelefoneDuplicado(null)).toBe(false);
  });
});

describe("campoDuplicado", () => {
  it("identifica o campo pelo índice que barrou", () => {
    expect(campoDuplicado({ code: "23505", message: 'duplicate key value violates unique constraint "leads_email_normalizado_unico"' })).toBe("email");
    expect(campoDuplicado({ code: "23505", message: 'duplicate key value violates unique constraint "leads_cpf_normalizado_unico"' })).toBe("cpf");
    expect(campoDuplicado({ code: "23505", message: 'duplicate key value violates unique constraint "leads_telefone_normalizado_unico"' })).toBe("telefone");
    expect(campoDuplicado({ code: "42501", message: "permission denied" })).toBeNull();
  });
});
