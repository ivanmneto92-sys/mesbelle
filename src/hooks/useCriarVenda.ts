import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { ItemCarrinho, DadosPagamento, ResumoPedido } from "@/types/venda";
import type { Lead } from "@/types/comercial";

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
  // Só para "primeiro_aluguel" — vai para o contrato e para a Produção
  // gerada automaticamente (trigger fn_negocio_primeiro_aluguel_gera_producao).
  descricaoPrimeiroAluguel?: string;
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
// Se uma etapa depois do negócio falhar, desfaz o que já foi gravado — sem
// isto um negócio "aprovado" (que já dispara comissão/imposto no financeiro)
// podia sobrar no banco sem peça reservada nem entrega agendada.
async function limparNegocioOrfao(negocioId: string) {
  await supabase.from("transacoes_financeiras").delete().eq("negocio_id", negocioId);
  await supabase.from("reservas_agenda").delete().eq("negocio_id", negocioId);
  await supabase.from("negocios").delete().eq("id", negocioId);
}

export function useCriarVenda() {
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ lead, locataria, itens, pagamento, resumo, tipoNegocio, descricaoPrimeiroAluguel }: CriarVendaInput) => {
      const vestidoNome = itens.map((i) => i.nome).join(", ");
      const ehPrimeiroAluguel = tipoNegocio === "primeiro_aluguel";

      const { data: negocio, error: negErr } = await supabase
        .from("negocios")
        .insert({
          cliente_id: lead.id,
          cliente_nome: locataria.nome,
          cliente_cpf: locataria.cpf,
          cliente_telefone: locataria.telefone || null,
          cliente_email: locataria.email || null,
          vestido_nome: vestidoNome,
          valor_negociado: resumo.subtotal,
          desconto: resumo.descontoItens + resumo.descontoGeral,
          metodo_pagamento: FORMA_LABELS[pagamento.forma],
          parcelas: pagamento.forma === "credito" ? pagamento.parcelas : 1,
          bandeira_cartao: pagamento.forma === "credito" || pagamento.forma === "debito" ? pagamento.bandeira : null,
          observacoes: pagamento.observacoes || null,
          status_negociacao: "aprovado",
          // Primeiro Aluguel: usa a data de retirada da peça (não o evento do
          // lead) — é essa coluna que o trigger de Produção lê pra calcular o
          // prazo (retirada - 72h).
          data_evento: ehPrimeiroAluguel
            ? (itens[0]?.dataRetirada || "")
            : (lead.dataEvento || itens[0]?.dataRetirada || ""),
          vendedor_id: user?.id ?? null,
          tipo_negocio: tipoNegocio,
          vestido_id_novo: ehPrimeiroAluguel ? (itens[0]?.vestidoId ?? null) : null,
          descricao_primeiro_aluguel: ehPrimeiroAluguel ? (descricaoPrimeiroAluguel || null) : null,
        })
        .select("id")
        .single();

      if (negErr) throw new Error("Erro ao criar negócio: " + negErr.message);

      const reservas = itens.map((item) => ({
        vestido_id: item.vestidoId,
        data_inicio: item.dataRetirada,
        data_fim: item.dataDevolucao,
        status_reserva: "aluguel",
        negocio_id: negocio.id,
      }));

      const { error: resErr } = await supabase.from("reservas_agenda").insert(reservas);
      if (resErr) {
        await limparNegocioOrfao(negocio.id);
        throw new Error("Erro ao reservar as peças: " + resErr.message);
      }

      // Alimenta a tela de Logística (Operacional → Logística) — sem isto a
      // tabela alugueis_logistica nunca recebia uma linha sequer, e a tela
      // ficava sempre vazia mesmo com vendas reais acontecendo.
      const entregas = itens.map((item) => ({
        vestido_nome: item.nome,
        cliente_nome: locataria.nome,
        cliente_telefone: locataria.telefone || lead.telefone,
        endereco_entrega: lead.endereco,
        data_saida: item.dataRetirada,
        data_retorno: item.dataDevolucao,
      }));
      const { error: logErr } = await supabase.from("alugueis_logistica").insert(entregas);
      if (logErr) {
        await limparNegocioOrfao(negocio.id);
        throw new Error("Erro ao criar a entrega na Logística: " + logErr.message);
      }

      // A venda em si já está garantida a partir daqui (negócio + reserva +
      // entrega gravados) — as duas atualizações abaixo são complementares;
      // se falharem, avisamos mas não desfazemos a venda, só a peça pode
      // ficar com o status desatualizado até alguém corrigir manualmente.
      let avisoSecundario: string | null = null;

      if (!ehPrimeiroAluguel) {
        const vestidoIds = itens.map((i) => i.vestidoId);
        const { error: vestidoErr } = await supabase.from("vestidos").update({ status: "alugado" }).in("id", vestidoIds);
        if (vestidoErr) avisoSecundario = "Venda registrada, mas não consegui marcar a peça como alugada — confira o status dela no Acervo.";
      }

      const { error: leadErr } = await supabase.from("leads").update({ enviado_comercial: true }).eq("id", lead.id);
      if (leadErr && !avisoSecundario) avisoSecundario = "Venda registrada, mas não consegui atualizar o status do lead — confira em Leads.";

      return { negocioId: negocio.id as string, avisoSecundario };
    },

    onSuccess: (data) => {
      toast.success("Aluguel registrado com sucesso! 🎉");
      if (data.avisoSecundario) toast.warning(data.avisoSecundario);
    },

    onError: (e: Error) => {
      toast.error(e.message || "Erro ao registrar aluguel");
    },
  });
}
