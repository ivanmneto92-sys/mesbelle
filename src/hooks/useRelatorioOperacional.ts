import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { DateRange } from "@/hooks/useDateRange";
import { CategoriaPeca, VestidoStatus } from "@/types/acervo";

export interface VestidoStats {
  id: string;
  nome: string;
  sku: string | null;
  statusPeca: VestidoStatus;
  categoriaPeca: CategoriaPeca;
  qtdLocacoes: number;
  receitaTotal: number;
  ticketMedio: number;
}

export interface AluguelAtivo {
  id: string;
  vestidoNome: string;
  vestidoSku: string | null;
  clienteNome: string;
  dataSaida: string;
  dataDevolucao: string | null;
  diasRestantes: number; // negativo = atrasado
  status: string;
}

type VestidoRow = { id: string; nome: string; sku: string | null; status: string; categoria_peca: string };
type AluguelRow = {
  id: string; vestido_nome: string; cliente_nome: string;
  data_saida: string; data_retorno: string; status_logistica: string;
};
type NegocioRow = { vestido_nome: string | null; valor_negociado: number; desconto: number; criado_em: string };

export function useRelatorioOperacional(range: DateRange) {
  const { data: vestidos = [], isLoading: loadingVestidos } = useQuery({
    queryKey: ["vestidos_relatorio"],
    queryFn: async () => {
      const { data, error } = await supabase.from("vestidos").select("id, nome, sku, status, categoria_peca");
      if (error) throw error;
      return (data ?? []) as VestidoRow[];
    },
  });

  // alugueis_logistica não tem coluna de valor nem FK para vestidos/leads — usada
  // apenas para o lado operacional (situação de entrega/devolução), casando por nome.
  const { data: alugueisAtivos = [], isLoading: loadingAlugueis } = useQuery({
    queryKey: ["alugueis_ativos_operacional"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("alugueis_logistica")
        .select("id, vestido_nome, cliente_nome, data_saida, data_retorno, status_logistica")
        .neq("status_logistica", "devolvido")
        .order("data_retorno", { ascending: true });
      if (error) throw error;
      return (data ?? []) as AluguelRow[];
    },
  });

  // negocios tem cliente_id/valor reais — usada como fonte de receita/ranking,
  // casando por vestido_nome (não há FK entre negocios e vestidos).
  const { data: negociosPeriodo = [], isLoading: loadingNegocios } = useQuery({
    queryKey: ["negocios_relatorio_operacional", range.from, range.to],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("negocios")
        .select("vestido_nome, valor_negociado, desconto, criado_em")
        .gte("criado_em", range.from)
        .lte("criado_em", range.to);
      if (error) throw error;
      return (data ?? []) as NegocioRow[];
    },
  });

  const isLoading = loadingVestidos || loadingAlugueis || loadingNegocios;

  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  const totalPecas = vestidos.length;
  const disponiveis = vestidos.filter((v) => v.status === "disponivel").length;
  const alugadas = vestidos.filter((v) => v.status === "alugado").length;
  const emManutencao = vestidos.filter((v) => v.status === "manutencao" || v.status === "ajuste").length;
  const emProducao = vestidos.filter((v) => v.status === "producao").length;
  const inativas = vestidos.filter((v) => v.status === "inativo").length;
  const taxaOcupacao = totalPecas > 0 ? (alugadas / totalPecas) * 100 : 0;

  const alugueisAtivosFormatados: AluguelAtivo[] = alugueisAtivos.map((a) => {
    const devData = a.data_retorno ? new Date(a.data_retorno + "T00:00:00") : null;
    const diasRestantes = devData ? Math.round((devData.getTime() - hoje.getTime()) / 86400000) : 0;
    const vestido = vestidos.find((v) => v.nome === a.vestido_nome);
    return {
      id: a.id,
      vestidoNome: a.vestido_nome || "—",
      vestidoSku: vestido?.sku ?? null,
      clienteNome: a.cliente_nome || "—",
      dataSaida: a.data_saida || "",
      dataDevolucao: a.data_retorno || null,
      diasRestantes,
      status: a.status_logistica || "—",
    };
  });

  const atrasados = alugueisAtivosFormatados.filter((a) => a.diasRestantes < 0);
  const vencendoLogo = alugueisAtivosFormatados.filter((a) => a.diasRestantes >= 0 && a.diasRestantes <= 3);
  const emDia = alugueisAtivosFormatados.filter((a) => a.diasRestantes > 3);

  const statsMap = new Map<string, VestidoStats>();
  vestidos.forEach((v) => {
    statsMap.set(v.nome, {
      id: v.id,
      nome: v.nome,
      sku: v.sku,
      statusPeca: v.status as VestidoStatus,
      categoriaPeca: v.categoria_peca as CategoriaPeca,
      qtdLocacoes: 0,
      receitaTotal: 0,
      ticketMedio: 0,
    });
  });

  negociosPeriodo.forEach((n) => {
    if (!n.vestido_nome) return;
    const s = statsMap.get(n.vestido_nome);
    if (!s) return;
    s.qtdLocacoes++;
    s.receitaTotal += Number(n.valor_negociado ?? 0) - Number(n.desconto ?? 0);
  });
  statsMap.forEach((s) => { s.ticketMedio = s.qtdLocacoes > 0 ? s.receitaTotal / s.qtdLocacoes : 0; });

  const ranking = [...statsMap.values()].sort((a, b) => b.qtdLocacoes - a.qtdLocacoes);
  const rankingReceita = [...statsMap.values()].sort((a, b) => b.receitaTotal - a.receitaTotal);
  const paradas = [...statsMap.values()]
    .filter((v) => v.qtdLocacoes === 0 && v.statusPeca !== "inativo")
    .sort((a, b) => a.nome.localeCompare(b.nome));

  const receitaPeriodo = negociosPeriodo.reduce((s, n) => s + (Number(n.valor_negociado ?? 0) - Number(n.desconto ?? 0)), 0);
  const ticketMedioPeriodo = negociosPeriodo.length > 0 ? receitaPeriodo / negociosPeriodo.length : 0;

  const porCategoria = vestidos.reduce((acc: Record<string, number>, v) => {
    const cat = v.categoria_peca || "outros";
    acc[cat] = (acc[cat] ?? 0) + 1;
    return acc;
  }, {});

  return {
    isLoading,
    totalPecas, disponiveis, alugadas, emManutencao, emProducao, inativas,
    taxaOcupacao,
    alugueisAtivos: alugueisAtivosFormatados,
    atrasados, vencendoLogo, emDia,
    ranking, rankingReceita, paradas,
    receitaPeriodo, ticketMedioPeriodo,
    totalLocacoesPeriodo: negociosPeriodo.length,
    porCategoria,
  };
}
