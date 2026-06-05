import { describe, it, expect } from "vitest";
import { parseOFX, parseCSV, parseFinanceiroFile } from "@/lib/financeiroImport";

describe("parseOFX", () => {
  const validOfx = `<OFX>
<BANKTRANLIST>
<STMTTRN>
<TRNTYPE>CREDIT
<DTPOSTED>20260515
<TRNAMT>1500.00
<MEMO>Aluguel Vestido Marsala
</STMTTRN>
<STMTTRN>
<TRNTYPE>DEBIT
<DTPOSTED>20260516
<TRNAMT>-220.50
<NAME>Compra Material
</STMTTRN>
</BANKTRANLIST>
</OFX>`;

  it("extrai transações válidas com tipo e valor corretos", () => {
    const r = parseOFX(validOfx);
    expect(r.valid).toHaveLength(2);
    expect(r.invalid).toHaveLength(0);
    expect(r.totalDetected).toBe(2);
    expect(r.format).toBe("ofx");

    expect(r.valid[0]).toMatchObject({
      tipo: "entrada",
      data: "2026-05-15",
      descricao: "Aluguel Vestido Marsala",
      valor: 1500,
      status: "pago",
    });
    expect(r.valid[1]).toMatchObject({
      tipo: "saida",
      data: "2026-05-16",
      descricao: "Compra Material",
      valor: 220.5,
    });
  });

  it("marca como inválida transação sem TRNAMT", () => {
    const ofx = `<STMTTRN><DTPOSTED>20260515<MEMO>Sem valor</STMTTRN>`;
    const r = parseOFX(ofx);
    expect(r.valid).toHaveLength(0);
    expect(r.invalid).toHaveLength(1);
    expect(r.invalid[0].reason).toMatch(/TRNAMT/);
  });

  it("marca como inválida transação com valor zerado", () => {
    const ofx = `<STMTTRN><DTPOSTED>20260515<TRNAMT>0.00<MEMO>Zero</STMTTRN>`;
    const r = parseOFX(ofx);
    expect(r.invalid).toHaveLength(1);
    expect(r.invalid[0].reason).toMatch(/zerado/i);
  });

  it("marca como inválida transação com DTPOSTED ausente ou curto", () => {
    const ofx = `<STMTTRN><TRNAMT>100<MEMO>Sem data</STMTTRN>`;
    const r = parseOFX(ofx);
    expect(r.invalid).toHaveLength(1);
    expect(r.invalid[0].reason).toMatch(/DTPOSTED|data/i);
  });

  it("retorna resultado vazio para texto sem STMTTRN", () => {
    const r = parseOFX("<OFX></OFX>");
    expect(r.valid).toEqual([]);
    expect(r.invalid).toEqual([]);
    expect(r.totalDetected).toBe(0);
  });

  it("usa MEMO como descrição preferencial; cai para NAME; padrão 'Importado'", () => {
    const ofx = `<STMTTRN><DTPOSTED>20260101<TRNAMT>10</STMTTRN>`;
    const r = parseOFX(ofx);
    expect(r.valid[0].descricao).toBe("Importado");
  });
});

describe("parseCSV", () => {
  it("processa CSV com ponto-e-vírgula e cabeçalho", () => {
    const csv = `Data;Descrição;Valor
15/05/2026;Aluguel Vestido;1500,00
16/05/2026;Material Costura;-220,50`;
    const r = parseCSV(csv);
    expect(r.valid).toHaveLength(2);
    expect(r.invalid).toHaveLength(0);
    expect(r.totalDetected).toBe(2);
    expect(r.valid[0]).toMatchObject({ tipo: "entrada", data: "2026-05-15", valor: 1500 });
    expect(r.valid[1]).toMatchObject({ tipo: "saida", data: "2026-05-16", valor: 220.5 });
  });

  it("processa CSV com vírgula e sem cabeçalho", () => {
    const csv = `01/01/2026,Venda,500.00`;
    const r = parseCSV(csv);
    expect(r.valid).toHaveLength(1);
    expect(r.valid[0]).toMatchObject({ data: "2026-01-01", valor: 500 });
  });

  it("aceita datas no formato ISO aaaa-mm-dd", () => {
    const csv = `Data;Descricao;Valor
2026-03-10;Teste ISO;100,00`;
    const r = parseCSV(csv);
    expect(r.valid).toHaveLength(1);
    expect(r.valid[0].data).toBe("2026-03-10");
  });

  it("reporta linha inválida com colunas insuficientes", () => {
    const csv = `Data;Descricao;Valor
15/05/2026;SoDuasColunas`;
    const r = parseCSV(csv);
    expect(r.valid).toHaveLength(0);
    expect(r.invalid).toHaveLength(1);
    expect(r.invalid[0].line).toBe(1);
    expect(r.invalid[0].reason).toMatch(/3 colunas/);
  });

  it("reporta data inválida", () => {
    const csv = `Data;Descricao;Valor
abacaxi;Teste;100`;
    const r = parseCSV(csv);
    expect(r.invalid).toHaveLength(1);
    expect(r.invalid[0].reason).toMatch(/Data inválida/);
  });

  it("reporta valor inválido", () => {
    const csv = `Data;Descricao;Valor
15/05/2026;Teste;não-é-número`;
    const r = parseCSV(csv);
    expect(r.invalid).toHaveLength(1);
    expect(r.invalid[0].reason).toMatch(/Valor/);
  });

  it("reporta valor zerado", () => {
    const csv = `Data;Descricao;Valor
15/05/2026;Teste;0`;
    const r = parseCSV(csv);
    expect(r.invalid).toHaveLength(1);
    expect(r.invalid[0].reason).toMatch(/zerado/i);
  });

  it("mescla itens válidos e inválidos sem perder a contagem total", () => {
    const csv = `Data;Descricao;Valor
15/05/2026;OK;100,00
abc;Erro;50
16/05/2026;OK2;-30,00`;
    const r = parseCSV(csv);
    expect(r.totalDetected).toBe(3);
    expect(r.valid).toHaveLength(2);
    expect(r.invalid).toHaveLength(1);
    expect(r.invalid[0].line).toBe(2);
  });

  it("trata milhares no valor (1.500,00 → 1500)", () => {
    const csv = `Data;Descricao;Valor
01/01/2026;Grande;1.500,00`;
    const r = parseCSV(csv);
    expect(r.valid[0].valor).toBe(1500);
  });

  it("ignora linhas em branco", () => {
    const csv = `Data;Descricao;Valor

01/01/2026;OK;100

02/01/2026;OK2;200
`;
    const r = parseCSV(csv);
    expect(r.totalDetected).toBe(2);
    expect(r.valid).toHaveLength(2);
  });
});

describe("parseFinanceiroFile", () => {
  it("usa parser OFX para .ofx", () => {
    const r = parseFinanceiroFile("extrato.ofx", `<STMTTRN><DTPOSTED>20260101<TRNAMT>100<MEMO>x</STMTTRN>`);
    expect(r.format).toBe("ofx");
    expect(r.valid).toHaveLength(1);
  });

  it("usa parser OFX para .ofc", () => {
    const r = parseFinanceiroFile("extrato.OFC", `<STMTTRN><DTPOSTED>20260101<TRNAMT>100<MEMO>x</STMTTRN>`);
    expect(r.format).toBe("ofx");
  });

  it("usa parser CSV para qualquer outra extensão", () => {
    const r = parseFinanceiroFile("extrato.csv", `01/01/2026;Teste;100`);
    expect(r.format).toBe("csv");
    expect(r.valid).toHaveLength(1);
  });
});
