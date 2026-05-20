import { useState, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Vestido, ReservaAgenda, Producao, EtapaProducao, DEFAULT_ETAPAS,
  VestidoStatus, ReservaStatus, ProducaoStatus,
} from "@/types/acervo";

// Legacy keys kept for cleanup in AuthContext
export const ACERVO_STORAGE_KEYS = ["mesbelle_vestidos", "mesbelle_reservas", "mesbelle_producoes", "mesbelle_etapas"];

type VestidoRow = {
  id: string; nome: string; cor: string; tamanho: string; comprimento: string;
  preco_aluguel: number; preco_venda: number; status: string;
  is_consignado: boolean; imagem_url: string;
};
const rowToVestido = (r: VestidoRow): Vestido => ({
  id: r.id, nome: r.nome, cor: r.cor, tamanho: r.tamanho, comprimento: r.comprimento,
  precoAluguel: Number(r.preco_aluguel), precoVenda: Number(r.preco_venda),
  status: r.status as VestidoStatus, isConsignado: r.is_consignado, imagemUrl: r.imagem_url,
});
const vestidoToRow = (v: Partial<Vestido>): Record<string, unknown> => {
  const o: Record<string, unknown> = {};
  if (v.nome !== undefined) o.nome = v.nome;
  if (v.cor !== undefined) o.cor = v.cor;
  if (v.tamanho !== undefined) o.tamanho = v.tamanho;
  if (v.comprimento !== undefined) o.comprimento = v.comprimento;
  if (v.precoAluguel !== undefined) o.preco_aluguel = v.precoAluguel;
  if (v.precoVenda !== undefined) o.preco_venda = v.precoVenda;
  if (v.status !== undefined) o.status = v.status;
  if (v.isConsignado !== undefined) o.is_consignado = v.isConsignado;
  if (v.imagemUrl !== undefined) o.imagem_url = v.imagemUrl;
  return o;
};

type ReservaRow = { id: string; vestido_id: string; data_inicio: string; data_fim: string; status_reserva: string };
const rowToReserva = (r: ReservaRow): ReservaAgenda => ({
  id: r.id, vestidoId: r.vestido_id, dataInicio: r.data_inicio, dataFim: r.data_fim,
  statusReserva: r.status_reserva as ReservaStatus,
});

type ProducaoRow = {
  id: string; titulo_vestido: string; cliente_nome: string;
  data_prazo: string | null; data_prova: string | null;
  status_geral: string; ref_imagens_urls: string[]; notas_tecnicas: string;
};
const rowToProducao = (r: ProducaoRow): Producao => ({
  id: r.id, tituloVestido: r.titulo_vestido, clienteNome: r.cliente_nome,
  dataPrazo: r.data_prazo ?? "", dataProva: r.data_prova ?? "",
  statusGeral: r.status_geral as ProducaoStatus,
  refImagensUrls: r.ref_imagens_urls ?? [], notasTecnicas: r.notas_tecnicas,
});
const producaoToRow = (p: Partial<Producao>): Record<string, unknown> => {
  const o: Record<string, unknown> = {};
  if (p.tituloVestido !== undefined) o.titulo_vestido = p.tituloVestido;
  if (p.clienteNome !== undefined) o.cliente_nome = p.clienteNome;
  if (p.dataPrazo !== undefined) o.data_prazo = p.dataPrazo || null;
  if (p.dataProva !== undefined) o.data_prova = p.dataProva || null;
  if (p.statusGeral !== undefined) o.status_geral = p.statusGeral;
  if (p.refImagensUrls !== undefined) o.ref_imagens_urls = p.refImagensUrls;
  if (p.notasTecnicas !== undefined) o.notas_tecnicas = p.notasTecnicas;
  return o;
};

type EtapaRow = { id: string; producao_id: string; nome_etapa: string; is_concluido: boolean; ordem: number };
const rowToEtapa = (r: EtapaRow): EtapaProducao => ({
  id: r.id, producaoId: r.producao_id, nomeEtapa: r.nome_etapa, isConcluido: r.is_concluido,
});

export function useAcervo() {
  const [vestidos, setVestidos] = useState<Vestido[]>([]);
  const [reservas, setReservas] = useState<ReservaAgenda[]>([]);
  const [producoes, setProducoes] = useState<Producao[]>([]);
  const [etapas, setEtapas] = useState<EtapaProducao[]>([]);

  useEffect(() => {
    let active = true;
    (async () => {
      const [vRes, rRes, pRes, eRes] = await Promise.all([
        supabase.from("vestidos").select("*").order("nome"),
        supabase.from("reservas_agenda").select("*"),
        supabase.from("producoes").select("*").order("created_at", { ascending: false }),
        supabase.from("etapas_producao").select("*").order("ordem"),
      ]);
      if (!active) return;
      if (vRes.data) setVestidos((vRes.data as VestidoRow[]).map(rowToVestido));
      if (rRes.data) setReservas((rRes.data as ReservaRow[]).map(rowToReserva));
      if (pRes.data) setProducoes((pRes.data as ProducaoRow[]).map(rowToProducao));
      if (eRes.data) setEtapas((eRes.data as EtapaRow[]).map(rowToEtapa));
    })();
    return () => { active = false; };
  }, []);

  // --- Vestidos ---
  const addVestido = useCallback(async (v: Omit<Vestido, "id">) => {
    const { data } = await supabase.from("vestidos").insert(vestidoToRow(v) as { nome: string }).select().single();
    if (data) setVestidos(prev => [...prev, rowToVestido(data as VestidoRow)]);
  }, []);

  const updateVestido = useCallback(async (id: string, patch: Partial<Vestido>) => {
    setVestidos(prev => prev.map(v => v.id === id ? { ...v, ...patch } : v));
    await supabase.from("vestidos").update(vestidoToRow(patch)).eq("id", id);
  }, []);

  const deleteVestido = useCallback(async (id: string) => {
    setVestidos(prev => prev.filter(v => v.id !== id));
    await supabase.from("vestidos").delete().eq("id", id);
  }, []);

  // --- Reservas ---
  const addReserva = useCallback(async (r: Omit<ReservaAgenda, "id">) => {
    const { data } = await supabase.from("reservas_agenda").insert({
      vestido_id: r.vestidoId, data_inicio: r.dataInicio, data_fim: r.dataFim, status_reserva: r.statusReserva,
    }).select().single();
    if (data) setReservas(prev => [...prev, rowToReserva(data as ReservaRow)]);
  }, []);

  const getReservasForVestido = useCallback((vestidoId: string) =>
    reservas.filter(r => r.vestidoId === vestidoId), [reservas]);

  // --- Producoes ---
  const addProducao = useCallback(async (p: Omit<Producao, "id">) => {
    const { data } = await supabase.from("producoes").insert(producaoToRow(p)).select().single();
    if (!data) return;
    const newProd = rowToProducao(data as ProducaoRow);
    setProducoes(prev => [newProd, ...prev]);
    const etapaRows = DEFAULT_ETAPAS.map((nome, ordem) => ({
      producao_id: newProd.id, nome_etapa: nome, is_concluido: false, ordem,
    }));
    const { data: eData } = await supabase.from("etapas_producao").insert(etapaRows).select();
    if (eData) setEtapas(prev => [...prev, ...(eData as EtapaRow[]).map(rowToEtapa)]);
  }, []);

  const updateProducao = useCallback(async (id: string, patch: Partial<Producao>) => {
    setProducoes(prev => prev.map(p => p.id === id ? { ...p, ...patch } : p));
    await supabase.from("producoes").update(producaoToRow(patch)).eq("id", id);
  }, []);

  // --- Etapas ---
  const toggleEtapa = useCallback(async (etapaId: string) => {
    const current = etapas.find(e => e.id === etapaId);
    if (!current) return;
    const next = !current.isConcluido;
    setEtapas(prev => prev.map(e => e.id === etapaId ? { ...e, isConcluido: next } : e));
    await supabase.from("etapas_producao").update({ is_concluido: next }).eq("id", etapaId);
  }, [etapas]);

  const getEtapasForProducao = useCallback((producaoId: string) =>
    etapas.filter(e => e.producaoId === producaoId), [etapas]);

  return {
    vestidos, addVestido, updateVestido, deleteVestido,
    reservas, addReserva, getReservasForVestido,
    producoes, addProducao, updateProducao,
    etapas, toggleEtapa, getEtapasForProducao,
  };
}
