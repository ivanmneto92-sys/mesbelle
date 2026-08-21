import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { ItemCarrinho, DadosPagamento, ResumoPedido } from "@/types/venda";
import type { Lead } from "@/types/comercial";

interface CriarVendaInput {
  lead: Lead;
  itens: ItemCarrinho[];
  pagamento: DadosPagamento;
  resumo: ResumoPedido;
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
 * negocios não tem colunas por item (sem tabela alugueis no schema) — a
 * venda inteira vira um único negócio, com vestido_nome resumindo as peças
 * e valor_negociado/desconto somando o carrinho. Cada peça vira uma reserva
 * em reservas_agenda (mesma tabela usada pela agenda do Acervo) para
 * bloquear a disponibilidade no período alugado.
 */
export function useCriarVenda() {
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ lead, itens, pagamento, resumo }: CriarVendaInput) => {
      const vestidoNome = itens.map((i) => i.nome).join(", ");

      const { data: negocio, error: negErr } = await supabase
        .from("negocios")
        .insert({
          cliente_id: lead.id,
          cliente_nome: lead.nome,
          cliente_cpf: lead.cpf,
          vestido_nome: vestidoNome,
          valor_negociado: resumo.subtotal,
          desconto: resumo.descontoItens + resumo.descontoGeral,
          metodo_pagamento: FORMA_LABELS[pagamento.forma],
          parcelas: pagamento.forma === "credito" ? pagamento.parcelas : 1,
          observacoes: pagamento.observacoes || null,
          status_negociacao: "aprovado",
          data_evento: lead.dataEvento || itens[0]?.dataRetirada || "",
          vendedor_id: user?.id ?? null,
        })
        .select("id")
        .single();

      if (negErr) throw new Error("Erro ao criar negócio: " + negErr.message);

      const reservas = itens.map((item) => ({
        vestido_id: item.vestidoId,
        data_inicio: item.dataRetirada,
        data_fim: item.dataDevolucao,
        status_reserva: "aluguel",
      }));

      const { error: resErr } = await supabase.from("reservas_agenda").insert(reservas);
      if (resErr) throw new Error("Erro ao reservar as peças: " + resErr.message);

      const vestidoIds = itens.map((i) => i.vestidoId);
      await supabase.from("vestidos").update({ status: "alugado" }).in("id", vestidoIds);

      await supabase.from("leads").update({ enviado_comercial: true }).eq("id", lead.id);

      return { negocioId: negocio.id as string };
    },

    onSuccess: () => {
      toast.success("Venda registrada com sucesso! 🎉");
    },

    onError: (e: Error) => {
      toast.error(e.message || "Erro ao registrar venda");
    },
  });
}
