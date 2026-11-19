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
  return !!error && (error.code === "23505" || /leads_telefone_normalizado_unico/.test(error.message ?? ""));
}
