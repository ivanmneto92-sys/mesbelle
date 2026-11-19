import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";
import { toast } from "sonner";
import { ItemCarrinho, DadosPagamento, ResumoPedido } from "@/types/venda";
import type { Lead } from "@/types/comercial";
import { gerarTermosContrato } from "@/lib/contratoTemplate";

export interface LocatariaOverride {
  nome: string;
  cpf: string;
  telefone: string;
  email: string;
}

export type TipoNegocio = "aluguel" | "primeiro_aluguel";

interface CriarVendaInput {
  lead: Lead;
  locataria: LocatariaOverride;
  itens: ItemCarrinho[];
  pagamento: DadosPagamento;
  resumo: ResumoPedido;
  tipoNegocio: TipoNegocio;
  confirmarDuplicidade?: boolean;
}

const FORMA_LABELS: Record<DadosPagamento["forma"], string> = {
  pix: "PIX",
  dinheiro: "Dinheiro",
  credito: "Cartão de Crédito",
  debito: "Cartão de Débito",
  boleto: "Boleto",
  misto: "Misto (PIX + Cartão)",
};

/**
 * "Confirmar aluguel" NÃO fecha mais a venda: cria uma pré-venda
 * (criar_pre_venda no banco, numa única transação) — negócio
 * "aguardando_assinatura", pré-reserva da(s) peça(s) por 48h e o contrato
 * com link de assinatura. Financeiro, comissão, Produção, Logística e o
 * status da peça só acontecem quando a cliente assina (fechar_venda()).
 *
 * Aluguel normal: a venda inteira vira um negócio (vestido_nome resume as
 * peças) com uma pré-reserva por peça. Primeiro Aluguel: cada peça sob
 * medida vira o seu próprio negócio/contrato, para cada uma ganhar a sua
 * Produção quando fechar.
 */
export class DuplicidadeVendaError extends Error {}

export interface ResultadoPreVenda {
  negocioId: string;
  contratoIds: string[];
  expiraEm: string;
}

export function useCriarVenda() {
  return useMutation({
    mutationFn: async ({ lead, locataria, itens, pagamento, resumo, tipoNegocio, confirmarDuplicidade }: CriarVendaInput): Promise<ResultadoPreVenda> => {
      const ehPrimeiroAluguel = tipoNegocio === "primeiro_aluguel";
      const formaLabel = FORMA_LABELS[pagamento.forma];

      const termos = (produtoDescricao: string, valorLocacao: number, desconto: number, dataEvento: string) =>
        gerarTermosContrato({
          nomeLocataria: locataria.nome,
          cpf: locataria.cpf,
          celular: locataria.telefone || lead.telefone,
          email: locataria.email || lead.email,
          produtoDescricao,
          valorLocacao,
          formaPagamento: formaLabel,
          observacoesPagamento: desconto > 0
            ? `Desconto aplicado: ${desconto.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}`
            : undefined,
          dataEvento: dataEvento || undefined,
        });

      const reserva = (item: ItemCarrinho) => ({
        vestido_id: item.vestidoId,
        vestido_nome: item.nome,
        data_inicio: item.dataRetirada,
        data_fim: item.dataDevolucao,
      });

      const negocios = ehPrimeiroAluguel
        ? itens.map((item) => {
            const valor = item.valorOriginal - item.desconto;
            // data_evento = retirada da peça: é dela que sai o prazo da Produção.
            const dataEvento = item.dataRetirada || "";
            return {
              vestido_nome: item.nome,
              valor_negociado: item.valorOriginal,
              desconto: item.desconto,
              data_evento: dataEvento,
              data_evento_contrato: lead.dataEvento || dataEvento,
              vestido_id_novo: item.vestidoId,
              valor_contrato: valor,
              termos_texto: termos(item.nome, valor, item.desconto, lead.dataEvento || dataEvento),
              reservas: [reserva(item)],
            };
          })
        : (() => {
            const vestidoNome = itens.map((i) => i.nome).join(", ");
            const desconto = resumo.descontoItens + resumo.descontoGeral;
            const dataEvento = lead.dataEvento || itens[0]?.dataRetirada || "";
            return [{
              vestido_nome: vestidoNome,
              valor_negociado: resumo.subtotal,
              desconto,
              data_evento: dataEvento,
              data_evento_contrato: dataEvento,
              vestido_id_novo: null,
              valor_contrato: resumo.total,
              termos_texto: termos(vestidoNome, resumo.total, desconto, dataEvento),
              reservas: itens.map(reserva),
            }];
          })();

      const { data, error } = await supabase.rpc("criar_pre_venda", {
        p_dados: {
          lead_id: lead.id,
          tipo_negocio: tipoNegocio,
          confirmar_duplicidade: !!confirmarDuplicidade,
          locataria: { ...locataria },
          pagamento: {
            metodo: formaLabel,
            parcelas: pagamento.forma === "credito" ? pagamento.parcelas : 1,
            bandeira: pagamento.forma === "credito" || pagamento.forma === "debito" ? pagamento.bandeira : null,
            observacoes: pagamento.observacoes || null,
          },
          negocios,
        } as unknown as Json,
      });

      if (error) {
        if (error.message.startsWith("DUPLICIDADE:")) {
          throw new DuplicidadeVendaError(error.message.replace(/^DUPLICIDADE:\s*/, ""));
        }
        throw new Error(error.message);
      }

      const resultado = data as { expira_em: string; vendas: Array<{ negocio_id: string; contrato_id: string }> };
      return {
        negocioId: resultado.vendas[0]?.negocio_id,
        contratoIds: resultado.vendas.map((v) => v.contrato_id),
        expiraEm: resultado.expira_em,
      };
    },

    onSuccess: (data) => {
      const ate = new Date(data.expiraEm).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
      toast.success(`Aluguel registrado — falta a assinatura da cliente. A peça fica reservada até ${ate}.`);
    },

    onError: (e: Error) => {
      if (e instanceof DuplicidadeVendaError) return; // a tela pergunta se é para seguir mesmo assim
      toast.error(e.message || "Erro ao registrar aluguel");
    },
  });
}
