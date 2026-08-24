import { useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertCircle, ArrowDown, ArrowUp, ArrowUpDown, Image as ImageIcon, Trophy, Video } from "lucide-react";
import { useMetaMediaInsights, type MetaMediaAsset } from "@/hooks/useMetaMediaInsights";
import type { DateRange } from "@/hooks/useDateRange";
import { formatBRL } from "@/lib/formatters";

function formatNum(v: number): string {
  return new Intl.NumberFormat("pt-BR").format(Math.round(v));
}

// Limiar mínimo de volume para classificar uma mídia como "vencedora" dentro
// do mesmo anúncio — nunca elege vencedora uma mídia com pouquíssimo dado
// (ex: "1 resultado, R$2 gasto"), mesmo que ela tenha o melhor custo/resultado.
const MIN_RESULTADOS_VENCEDOR = 3;
const MIN_GASTO_VENCEDOR = 20;

type SortKey = "spend" | "resultadoQtd" | "custoPorResultado" | "ctr" | "purchaseValue" | "roas";

function useVencedores(assets: MetaMediaAsset[]): Set<string> {
  return useMemo(() => {
    const porAd = new Map<string, MetaMediaAsset[]>();
    for (const a of assets) {
      const lista = porAd.get(a.adId) ?? [];
      lista.push(a);
      porAd.set(a.adId, lista);
    }
    const vencedores = new Set<string>();
    for (const lista of porAd.values()) {
      if (lista.length < 2) continue; // só faz sentido comparar quando há mais de uma mídia no mesmo anúncio
      const elegiveis = lista.filter((a) => a.resultadoQtd >= MIN_RESULTADOS_VENCEDOR && a.spend >= MIN_GASTO_VENCEDOR);
      if (elegiveis.length === 0) continue;
      const melhor = elegiveis.reduce((acc, cur) => {
        const custoAcc = acc.custoPorResultado ?? Infinity;
        const custoCur = cur.custoPorResultado ?? Infinity;
        return custoCur < custoAcc ? cur : acc;
      });
      vencedores.add(melhor.assetKey);
    }
    return vencedores;
  }, [assets]);
}

function MediaPreview({ asset }: { asset: MetaMediaAsset }) {
  if (asset.thumbnailUrl) {
    return (
      <a
        href={asset.mediaUrl || asset.thumbnailUrl}
        target="_blank"
        rel="noreferrer"
        className="relative block h-12 w-12 shrink-0 rounded-lg overflow-hidden border bg-muted"
        title="Abrir mídia original"
      >
        <img src={asset.thumbnailUrl} alt={asset.assetName ?? "Mídia do anúncio"} className="h-full w-full object-cover" loading="lazy" />
        {asset.mediaType === "VIDEO" && (
          <span className="absolute inset-0 flex items-center justify-center bg-black/25">
            <Video className="h-4 w-4 text-white drop-shadow" />
          </span>
        )}
      </a>
    );
  }
  return (
    <div className="h-12 w-12 shrink-0 rounded-lg border bg-muted flex items-center justify-center text-muted-foreground">
      {asset.mediaType === "VIDEO" ? <Video className="h-5 w-5" /> : <ImageIcon className="h-5 w-5" />}
    </div>
  );
}

function SortHeader({ label, sortKey, active, dir, onClick }: { label: string; sortKey: SortKey; active: boolean; dir: "asc" | "desc"; onClick: (k: SortKey) => void }) {
  return (
    <TableHead className="text-right cursor-pointer select-none" onClick={() => onClick(sortKey)}>
      <span className="inline-flex items-center gap-1 justify-end w-full">
        {label}
        {active ? dir === "asc" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" /> : <ArrowUpDown className="h-3 w-3 opacity-30" />}
      </span>
    </TableHead>
  );
}

export function MetaMediaSection({ range }: { range: DateRange }) {
  const { data, isLoading, isError, error } = useMetaMediaInsights(range);
  const [campanhaId, setCampanhaId] = useState<string>("todas");
  const [conjuntoId, setConjuntoId] = useState<string>("todos");
  const [anuncioId, setAnuncioId] = useState<string>("todos");
  const [sort, setSort] = useState<{ key: SortKey; dir: "asc" | "desc" }>({ key: "spend", dir: "desc" });

  const assets = data?.granularity === "MEDIA" ? data.assets : [];
  const vencedores = useVencedores(assets);

  const campanhas = useMemo(() => {
    const map = new Map<string, string>();
    assets.forEach((a) => map.set(a.campaignId, a.campaignName ?? a.campaignId));
    return Array.from(map, ([id, nome]) => ({ id, nome }));
  }, [assets]);

  const conjuntos = useMemo(() => {
    const map = new Map<string, string>();
    assets.filter((a) => campanhaId === "todas" || a.campaignId === campanhaId).forEach((a) => map.set(a.adsetId, a.adsetName ?? a.adsetId));
    return Array.from(map, ([id, nome]) => ({ id, nome }));
  }, [assets, campanhaId]);

  const anuncios = useMemo(() => {
    const map = new Map<string, string>();
    assets
      .filter((a) => (campanhaId === "todas" || a.campaignId === campanhaId) && (conjuntoId === "todos" || a.adsetId === conjuntoId))
      .forEach((a) => map.set(a.adId, a.adName ?? a.adId));
    return Array.from(map, ([id, nome]) => ({ id, nome }));
  }, [assets, campanhaId, conjuntoId]);

  const filtrados = useMemo(() => {
    const base = assets.filter(
      (a) =>
        (campanhaId === "todas" || a.campaignId === campanhaId) &&
        (conjuntoId === "todos" || a.adsetId === conjuntoId) &&
        (anuncioId === "todos" || a.adId === anuncioId),
    );
    const sorted = [...base].sort((a, b) => {
      const va = a[sort.key] ?? -Infinity;
      const vb = b[sort.key] ?? -Infinity;
      return sort.dir === "asc" ? va - vb : vb - va;
    });
    return sorted;
  }, [assets, campanhaId, conjuntoId, anuncioId, sort]);

  const handleSort = (key: SortKey) => {
    setSort((prev) => (prev.key === key ? { key, dir: prev.dir === "asc" ? "desc" : "asc" } : { key, dir: "desc" }));
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-6 w-64" />
        <Skeleton className="h-64 rounded-2xl" />
      </div>
    );
  }

  if (isError) {
    return (
      <Card className="card-editorial">
        <CardContent className="py-10 flex flex-col items-center text-center gap-3">
          <AlertCircle className="h-6 w-6 text-destructive" />
          <p className="text-sm text-muted-foreground">{(error as Error)?.message}</p>
        </CardContent>
      </Card>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-1">
        <h2 className="font-display text-lg">Performance por Mídia</h2>
        <p className="text-sm text-muted-foreground text-pretty">
          Resultado de cada imagem/vídeo individual dentro dos anúncios — inclusive quando a Meta consolida vários criativos
          em um único anúncio (Advantage+ / Flexible Media).
        </p>
      </div>

      {data.granularity === "AD" && (
        <Card className="card-editorial">
          <CardContent className="py-6 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
            <p className="text-sm text-muted-foreground text-pretty">
              A Meta não retornou dados no nível de mídia individual para este período nesta conta (nenhum breakdown de
              asset com dados disponíveis). Mostrando o resultado consolidado por anúncio abaixo — nenhum número foi
              estimado ou distribuído artificialmente entre mídias.
            </p>
          </CardContent>
        </Card>
      )}

      {data.granularity === "MEDIA" && (
        <>
          <div className="flex flex-wrap items-center gap-2">
            <Select value={campanhaId} onValueChange={(v) => { setCampanhaId(v); setConjuntoId("todos"); setAnuncioId("todos"); }}>
              <SelectTrigger className="w-full sm:w-56"><SelectValue placeholder="Campanha" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas as campanhas</SelectItem>
                {campanhas.map((c) => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={conjuntoId} onValueChange={(v) => { setConjuntoId(v); setAnuncioId("todos"); }}>
              <SelectTrigger className="w-full sm:w-56"><SelectValue placeholder="Conjunto" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os conjuntos</SelectItem>
                {conjuntos.map((c) => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={anuncioId} onValueChange={setAnuncioId}>
              <SelectTrigger className="w-full sm:w-56"><SelectValue placeholder="Anúncio" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os anúncios</SelectItem>
                {anuncios.map((a) => <SelectItem key={a.id} value={a.id}>{a.nome}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <Card className="card-editorial">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Mídia</TableHead>
                      <TableHead>Anúncio</TableHead>
                      <SortHeader label="Gasto" sortKey="spend" active={sort.key === "spend"} dir={sort.dir} onClick={handleSort} />
                      <SortHeader label="Resultados" sortKey="resultadoQtd" active={sort.key === "resultadoQtd"} dir={sort.dir} onClick={handleSort} />
                      <SortHeader label="Custo/Resultado" sortKey="custoPorResultado" active={sort.key === "custoPorResultado"} dir={sort.dir} onClick={handleSort} />
                      <SortHeader label="CTR" sortKey="ctr" active={sort.key === "ctr"} dir={sort.dir} onClick={handleSort} />
                      <SortHeader label="Receita" sortKey="purchaseValue" active={sort.key === "purchaseValue"} dir={sort.dir} onClick={handleSort} />
                      <SortHeader label="ROAS" sortKey="roas" active={sort.key === "roas"} dir={sort.dir} onClick={handleSort} />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtrados.map((a) => (
                      <TableRow key={a.assetKey}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <MediaPreview asset={a} />
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className="text-sm font-medium truncate max-w-[160px]" title={a.assetName ?? a.assetKey}>
                                  {a.assetName ?? "Sem nome"}
                                </span>
                                {vencedores.has(a.assetKey) && (
                                  <Badge variant="default" className="gap-1"><Trophy className="h-3 w-3" /> Vencedora</Badge>
                                )}
                              </div>
                              <span className="text-xs text-muted-foreground">{a.mediaType === "VIDEO" ? "Vídeo" : a.mediaType === "IMAGE" ? "Imagem" : "—"}</span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate" title={a.adName}>{a.adName ?? a.adId}</TableCell>
                        <TableCell className="text-right tabular-nums">{formatBRL(a.spend)}</TableCell>
                        <TableCell className="text-right tabular-nums font-medium">{formatNum(a.resultadoQtd)}</TableCell>
                        <TableCell className="text-right tabular-nums">{a.custoPorResultado != null ? formatBRL(a.custoPorResultado) : "—"}</TableCell>
                        <TableCell className="text-right tabular-nums">{a.ctr.toFixed(2)}%</TableCell>
                        <TableCell className="text-right tabular-nums">{a.purchaseValue > 0 ? formatBRL(a.purchaseValue) : "—"}</TableCell>
                        <TableCell className="text-right tabular-nums">{a.roas != null ? `${a.roas.toFixed(2)}x` : "—"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              {filtrados.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-8">Nenhuma mídia com dados nesse filtro/período</p>
              )}
            </CardContent>
          </Card>

          <p className="text-xs text-muted-foreground text-pretty">
            Breakdowns testados nesta conta: {data.breakdownsTestados.join(", ")} · usados: {data.breakdownsUsados.join(", ") || "nenhum"}.
            "Vencedora" exige pelo menos {MIN_RESULTADOS_VENCEDOR} resultados e {formatBRL(MIN_GASTO_VENCEDOR)} de gasto na mídia, para não classificar
            amostras pequenas demais.
          </p>
        </>
      )}
    </div>
  );
}
