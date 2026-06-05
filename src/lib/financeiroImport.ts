import { Transacao, TipoTransacao, CategoriaTransacao, StatusTransacao } from "@/types/financeiro";
import { transacaoSchema } from "@/lib/schemas";

export type ParsedItem = Omit<Transacao, "id">;

export interface ImportFailure {
  /** 1-based line number within the source file (1 = primeira linha de dados, não o cabeçalho do CSV) */
  line: number;
  /** Conteúdo bruto que falhou (truncado para até 200 chars) */
  raw: string;
  /** Motivo legível em PT-BR */
  reason: string;
}

export interface ImportResult {
  valid: ParsedItem[];
  invalid: ImportFailure[];
  /** Total de candidatos detectados (válidos + inválidos) */
  totalDetected: number;
  format: "ofx" | "csv";
}

const MAX_RAW = 200;
const truncate = (s: string) => (s.length > MAX_RAW ? s.slice(0, MAX_RAW) + "…" : s);

function validate(candidate: ParsedItem, line: number, raw: string): { ok: true; data: ParsedItem } | { ok: false; failure: ImportFailure } {
  const parsed = transacaoSchema.safeParse(candidate);
  if (parsed.success) return { ok: true, data: parsed.data as ParsedItem };
  return {
    ok: false,
    failure: { line, raw: truncate(raw), reason: parsed.error.issues[0]?.message ?? "Dados inválidos" },
  };
}

// ----------------- OFX -----------------
export function parseOFX(text: string): ImportResult {
  const valid: ParsedItem[] = [];
  const invalid: ImportFailure[] = [];
  const regex = /<STMTTRN>([\s\S]*?)<\/STMTTRN>/gi;
  let match: RegExpExecArray | null;
  let idx = 0;

  while ((match = regex.exec(text)) !== null) {
    idx += 1;
    const block = match[1];
    const get = (tag: string) => {
      const m = new RegExp(`<${tag}>([^<\\n]+)`, "i").exec(block);
      return m ? m[1].trim() : "";
    };

    const rawAmount = get("TRNAMT");
    const amount = parseFloat(rawAmount);
    const rawDate = get("DTPOSTED");

    if (!rawAmount || Number.isNaN(amount)) {
      invalid.push({ line: idx, raw: truncate(block), reason: "Valor (TRNAMT) ausente ou inválido" });
      continue;
    }
    if (amount === 0) {
      invalid.push({ line: idx, raw: truncate(block), reason: "Valor zerado" });
      continue;
    }
    if (rawDate.length < 8 || !/^\d{8}/.test(rawDate)) {
      invalid.push({ line: idx, raw: truncate(block), reason: "Data (DTPOSTED) ausente ou inválida" });
      continue;
    }

    const dateStr = `${rawDate.slice(0, 4)}-${rawDate.slice(4, 6)}-${rawDate.slice(6, 8)}`;
    const candidate: ParsedItem = {
      tipo: amount >= 0 ? "entrada" : "saida",
      data: dateStr,
      descricao: get("MEMO") || get("NAME") || "Importado",
      categoria: "Outros" as CategoriaTransacao,
      valor: Math.abs(amount),
      status: "pago" as StatusTransacao,
    };

    const v = validate(candidate, idx, block);
    if (v.ok) valid.push(v.data);
    else if (!v.ok) invalid.push(v.failure);
  }

  return { valid, invalid, totalDetected: idx, format: "ofx" };
}

// ----------------- CSV -----------------
/**
 * Aceita CSVs no formato:  Data;Descrição;Valor   (separador ; ou , - delimitador detectado por linha)
 * Datas aceitas: dd/mm/aaaa, dd-mm-aaaa, aaaa-mm-dd
 */
export function parseCSV(text: string): ImportResult {
  const valid: ParsedItem[] = [];
  const invalid: ImportFailure[] = [];

  const allLines = text.replace(/\r/g, "").split("\n").map((l) => l.trim()).filter(Boolean);
  if (allLines.length === 0) return { valid, invalid, totalDetected: 0, format: "csv" };

  // Detecta cabeçalho heurístico: primeira linha sem números nas duas primeiras "colunas"
  const looksHeader = (line: string) => /data|descri|valor|hist|^date|amount/i.test(line);
  const dataLines = looksHeader(allLines[0]) ? allLines.slice(1) : allLines;

  dataLines.forEach((line, i) => {
    const lineNo = i + 1;
    // detecta delimitador
    const delim = line.includes(";") ? ";" : ",";
    const parts = line.split(delim).map((p) => p.trim());

    if (parts.length < 3) {
      invalid.push({ line: lineNo, raw: truncate(line), reason: `Esperadas 3 colunas (data, descrição, valor); encontradas ${parts.length}` });
      return;
    }

    const [rawData, rawDesc, ...rest] = parts;
    const rawValor = rest[rest.length - 1] ?? "";

    // Data
    let dataISO = "";
    if (/^\d{4}-\d{2}-\d{2}$/.test(rawData)) {
      dataISO = rawData;
    } else if (/^\d{2}[/-]\d{2}[/-]\d{4}$/.test(rawData)) {
      const [d, m, y] = rawData.split(/[/-]/);
      dataISO = `${y}-${m}-${d}`;
    } else {
      invalid.push({ line: lineNo, raw: truncate(line), reason: `Data inválida: "${rawData}"` });
      return;
    }
    const dataDate = new Date(`${dataISO}T00:00:00`);
    if (Number.isNaN(dataDate.getTime())) {
      invalid.push({ line: lineNo, raw: truncate(line), reason: `Data inexistente: "${rawData}"` });
      return;
    }

    // Valor
    const cleaned = rawValor.replace(/[^\d.,-]/g, "").replace(/\.(?=\d{3}(\D|$))/g, "").replace(",", ".");
    const valor = parseFloat(cleaned);
    if (Number.isNaN(valor)) {
      invalid.push({ line: lineNo, raw: truncate(line), reason: `Valor inválido: "${rawValor}"` });
      return;
    }
    if (valor === 0) {
      invalid.push({ line: lineNo, raw: truncate(line), reason: "Valor zerado" });
      return;
    }

    // Descrição
    const descricao = rawDesc || "Importado";

    const candidate: ParsedItem = {
      tipo: (valor >= 0 ? "entrada" : "saida") as TipoTransacao,
      data: dataISO,
      descricao,
      categoria: "Outros" as CategoriaTransacao,
      valor: Math.abs(valor),
      status: "pago" as StatusTransacao,
    };

    const v = validate(candidate, lineNo, line);
    if (v.ok) valid.push(v.data);
    else if (!v.ok) invalid.push(v.failure);
  });

  return { valid, invalid, totalDetected: dataLines.length, format: "csv" };
}

export function parseFinanceiroFile(filename: string, text: string): ImportResult {
  const lower = filename.toLowerCase();
  if (lower.endsWith(".ofx") || lower.endsWith(".ofc")) return parseOFX(text);
  return parseCSV(text);
}
