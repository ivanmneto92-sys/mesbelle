// Mesma regra de public.normalizar_telefone() no banco — é ela que garante
// que um telefone só tem um cadastro de cliente (índice único em
// leads.telefone_normalizado). Manter as duas em sincronia.
export function normalizarTelefone(telefone: string | null | undefined): string {
  let d = (telefone ?? "").replace(/\D/g, "").replace(/^0+/, "");
  if ((d.length === 12 || d.length === 13) && d.startsWith("55")) d = d.slice(2);
  if (d.length === 10 && "6789".includes(d[2])) d = d.slice(0, 2) + "9" + d.slice(2);
  return d;
}

export function mesmoTelefone(a: string | null | undefined, b: string | null | undefined): boolean {
  const na = normalizarTelefone(a);
  return na !== "" && na === normalizarTelefone(b);
}

// Postgres devolve 23505 (unique_violation) quando o telefone já tem cadastro.
export function erroTelefoneDuplicado(error: { code?: string; message?: string } | null | undefined): boolean {
  return campoDuplicado(error) === "telefone";
}

export type CampoUnico = "telefone" | "email" | "cpf";

/** Qual dado único (telefone, e-mail, CPF) bateu com outro cadastro, a partir do erro do banco. */
export function campoDuplicado(error: { code?: string; message?: string; details?: string } | null | undefined): CampoUnico | null {
  if (!error) return null;
  const texto = `${error.message ?? ""} ${error.details ?? ""}`;
  if (/leads_email_normalizado_unico|email_normalizado/.test(texto)) return "email";
  if (/leads_cpf_normalizado_unico|cpf_normalizado/.test(texto)) return "cpf";
  if (/leads_telefone_normalizado_unico|telefone_normalizado/.test(texto)) return "telefone";
  return error.code === "23505" ? "telefone" : null;
}

export const ROTULO_CAMPO: Record<CampoUnico, string> = { telefone: "telefone", email: "e-mail", cpf: "CPF" };

export function mensagemDuplicado(campo: CampoUnico): string {
  return `Já existe uma cliente cadastrada com esse ${ROTULO_CAMPO[campo]} — um ${ROTULO_CAMPO[campo]} só pode ter um cadastro. Procure a cliente na Base de Clientes.`;
}
