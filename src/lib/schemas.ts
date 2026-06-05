import { z } from "zod";

// ---------- Helpers ----------
const nonEmpty = (label: string, max = 200) =>
  z.string().trim().min(1, `${label} é obrigatório`).max(max, `${label} muito longo (máx. ${max})`);

const optionalStr = (max = 500) =>
  z.string().trim().max(max, `Texto muito longo (máx. ${max})`).optional().or(z.literal(""));

const emailOpt = z
  .string()
  .trim()
  .max(255, "E-mail muito longo")
  .email("E-mail inválido")
  .or(z.literal(""))
  .optional();

const emailReq = z.string().trim().min(1, "E-mail é obrigatório").max(255, "E-mail muito longo").email("E-mail inválido");

// Telefone BR — aceita formatos comuns (com/sem máscara), 10-15 dígitos
const telefoneSchema = z
  .string()
  .trim()
  .min(8, "Telefone muito curto")
  .max(20, "Telefone muito longo")
  .regex(/^[\d()+\-.\s]+$/, "Telefone contém caracteres inválidos");

// CPF — apenas valida formato (11 dígitos com ou sem máscara). Validação completa de DV pode ser adicionada se preciso.
const cpfOpt = z
  .string()
  .trim()
  .regex(/^(\d{3}\.\d{3}\.\d{3}-\d{2}|\d{11})?$/, "CPF inválido")
  .max(14)
  .optional()
  .or(z.literal(""));

// Data ISO YYYY-MM-DD (string) opcional
const dateISOOpt = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Data inválida")
  .optional()
  .or(z.literal(""));

const dateISOReq = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data inválida");

// Valor monetário positivo
const valorPositivo = z
  .number({ invalid_type_error: "Valor inválido" })
  .finite("Valor inválido")
  .gt(0, "Valor deve ser maior que zero")
  .max(99_999_999.99, "Valor excede o máximo permitido");

// Percentual 0-100
const percentual = z
  .number({ invalid_type_error: "Percentual inválido" })
  .min(0, "Mínimo 0%")
  .max(100, "Máximo 100%");

// ---------- Lead (CRM) ----------
export const leadSchema = z.object({
  nome: nonEmpty("Nome", 120),
  telefone: telefoneSchema,
  email: emailOpt,
  cpf: cpfOpt,
  endereco: optionalStr(300),
  tipoEvento: optionalStr(50),
  dataEvento: dateISOOpt,
  notasInternas: optionalStr(2000),
  vendedorResponsavel: optionalStr(120),
});
export type LeadInput = z.infer<typeof leadSchema>;

// ---------- Vestido (Acervo) ----------
export const vestidoSchema = z.object({
  nome: nonEmpty("Nome do vestido", 120),
  cor: optionalStr(50),
  tamanho: nonEmpty("Tamanho", 10),
  comprimento: nonEmpty("Comprimento", 20),
  isConsignado: z.boolean(),
  precoAluguel: z.number().min(0, "Preço inválido").max(9_999_999),
  precoVenda: z.number().min(0, "Preço inválido").max(9_999_999),
  imagemUrl: z.string().max(2_000_000, "Imagem muito grande").optional().or(z.literal("")),
});
export type VestidoInput = z.infer<typeof vestidoSchema>;

// ---------- Transação financeira ----------
export const transacaoSchema = z.object({
  tipo: z.enum(["entrada", "saida"], { errorMap: () => ({ message: "Tipo inválido" }) }),
  data: dateISOReq,
  descricao: nonEmpty("Descrição", 200),
  categoria: nonEmpty("Categoria", 60),
  valor: valorPositivo,
  status: z.enum(["pago", "pendente", "cancelado"]).default("pago"),
});
export type TransacaoInput = z.infer<typeof transacaoSchema>;

export const transacaoArraySchema = z
  .array(transacaoSchema)
  .min(1, "Nenhuma transação para importar")
  .max(2000, "Importação excede o limite de 2.000 lançamentos");

// ---------- Funcionário (Equipe) ----------
export const novoFuncionarioSchema = z.object({
  nome: nonEmpty("Nome", 120),
  email: emailReq,
  role: z.enum(["vendedor", "socio"], { errorMap: () => ({ message: "Cargo inválido" }) }),
  cargo: optionalStr(60),
  tipo_contrato: z.enum(["CLT", "PJ", "Freelancer", "Estágio"]).default("CLT"),
  percentual_comissao: percentual,
  telefone: telefoneSchema.optional().or(z.literal("")),
});
export type NovoFuncionarioInput = z.infer<typeof novoFuncionarioSchema>;

export const comissaoSchema = z.object({
  percentual: percentual,
});

// ---------- Contrato ----------
export const contratoSchema = z.object({
  nomeCliente: nonEmpty("Nome do cliente", 120),
  cpfCliente: z
    .string()
    .trim()
    .regex(/^(\d{3}\.\d{3}\.\d{3}-\d{2}|\d{11})$/, "CPF inválido"),
  dataEvento: dateISOReq,
  valorTotal: valorPositivo,
  termosTexto: nonEmpty("Termos do contrato", 50_000),
});
export type ContratoInput = z.infer<typeof contratoSchema>;

// ---------- Util: formata erros Zod para toast ----------
export function firstZodError(err: z.ZodError): string {
  return err.issues[0]?.message ?? "Dados inválidos";
}
