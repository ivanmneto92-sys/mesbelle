import { useState, useCallback } from "react";
import {
  startOfMonth, endOfMonth, subMonths,
  startOfWeek, endOfWeek, subWeeks,
  subDays, format,
} from "date-fns";

export interface DateRange {
  from: string; // YYYY-MM-DD
  to: string;   // YYYY-MM-DD
}

export type DatePresetKey =
  | "hoje" | "ontem" | "hoje_ontem"
  | "ultimos_7" | "ultimos_14" | "ultimos_28" | "ultimos_30"
  | "esta_semana" | "semana_passada"
  | "este_mes" | "mes_passado"
  | "maximo";

export const DATE_PRESETS: { key: DatePresetKey; label: string }[] = [
  { key: "hoje", label: "Hoje" },
  { key: "ontem", label: "Ontem" },
  { key: "hoje_ontem", label: "Hoje e ontem" },
  { key: "ultimos_7", label: "Últimos 7 dias" },
  { key: "ultimos_14", label: "Últimos 14 dias" },
  { key: "ultimos_28", label: "Últimos 28 dias" },
  { key: "ultimos_30", label: "Últimos 30 dias" },
  { key: "esta_semana", label: "Esta semana" },
  { key: "semana_passada", label: "Semana passada" },
  { key: "este_mes", label: "Este mês" },
  { key: "mes_passado", label: "Mês passado" },
  { key: "maximo", label: "Máximo" },
];

const fmt = (d: Date) => format(d, "yyyy-MM-dd");

export function getPreset(preset: DatePresetKey): DateRange {
  const today = new Date();

  switch (preset) {
    case "hoje":
      return { from: fmt(today), to: fmt(today) };
    case "ontem": {
      const y = subDays(today, 1);
      return { from: fmt(y), to: fmt(y) };
    }
    case "hoje_ontem":
      return { from: fmt(subDays(today, 1)), to: fmt(today) };
    case "ultimos_7":
      return { from: fmt(subDays(today, 6)), to: fmt(today) };
    case "ultimos_14":
      return { from: fmt(subDays(today, 13)), to: fmt(today) };
    case "ultimos_28":
      return { from: fmt(subDays(today, 27)), to: fmt(today) };
    case "ultimos_30":
      return { from: fmt(subDays(today, 29)), to: fmt(today) };
    case "esta_semana":
      return { from: fmt(startOfWeek(today)), to: fmt(endOfWeek(today)) };
    case "semana_passada": {
      const lastWeek = subWeeks(today, 1);
      return { from: fmt(startOfWeek(lastWeek)), to: fmt(endOfWeek(lastWeek)) };
    }
    case "este_mes":
      return { from: fmt(startOfMonth(today)), to: fmt(endOfMonth(today)) };
    case "mes_passado": {
      const lastMonth = subMonths(today, 1);
      return { from: fmt(startOfMonth(lastMonth)), to: fmt(endOfMonth(lastMonth)) };
    }
    case "maximo":
      return { from: "2000-01-01", to: fmt(today) };
    default:
      return { from: fmt(startOfMonth(today)), to: fmt(endOfMonth(today)) };
  }
}

export function useDateRange(initial?: DateRange) {
  const [range, setRange] = useState<DateRange>(initial ?? getPreset("este_mes"));
  const setPreset = useCallback((preset: DatePresetKey) => setRange(getPreset(preset)), []);
  return { range, setRange, setPreset };
}
