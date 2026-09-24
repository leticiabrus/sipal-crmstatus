import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type Fatia = {
  id: string;
  epico: string;
  nome: string;
  peso: number;
  entrou_escopo: string;
  concluida: string | null;
  marco: string;
  removida: string | null;
  situacao: string;
  responsavel: string | null;
};

export const START = "2026-08-28";
export const END = "2026-11-30";
export const MARCOS = ["2026-10-03", "2026-10-24", "2026-11-10"];

export const SITUACOES = [
  { v: "nao_iniciada", label: "Não iniciada", color: "var(--bu-text-2)" },
  { v: "em_andamento", label: "Em andamento", color: "var(--bu-blue)" },
  { v: "em_revisao", label: "Em revisão", color: "var(--bu-cyan)" },
  { v: "bloqueada", label: "Bloqueada", color: "var(--bu-danger)" },
  { v: "concluida", label: "Concluída", color: "var(--bu-green)" },
] as const;

export function todayISO() {
  const d = new Date();
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}
const DAY = 86400000;
const t = (iso: string) => Date.parse(iso + "T00:00:00Z");
export const addDays = (iso: string, n: number) => new Date(t(iso) + n * DAY).toISOString().slice(0, 10);
export const diffDays = (a: string, b: string) => Math.round((t(b) - t(a)) / DAY);
export const fmt = (iso: string | null) => (iso ? `${iso.slice(8, 10)}/${iso.slice(5, 7)}` : "—");

export function useFatias() {
  return useQuery({
    queryKey: ["fatias"],
    queryFn: async () => {
      const { data, error } = await supabase.from("fatias").select("*").order("id");
      if (error) throw error;
      return data as Fatia[];
    },
  });
}

export function useUpdateFatia() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Partial<Fatia> }) => {
      const { error } = await supabase.from("fatias").update(patch).eq("id", id);
      if (error) throw error;
    },
    onMutate: async ({ id, patch }) => {
      await qc.cancelQueries({ queryKey: ["fatias"] });
      const prev = qc.getQueryData<Fatia[]>(["fatias"]);
      qc.setQueryData<Fatia[]>(["fatias"], (old) => old?.map((f) => (f.id === id ? { ...f, ...patch } : f)));
      return { prev };
    },
    onError: (_e, _v, ctx) => ctx?.prev && qc.setQueryData(["fatias"], ctx.prev),
    onSettled: () => qc.invalidateQueries({ queryKey: ["fatias"] }),
  });
}

/** Persisted UI preference (localStorage), read after hydration. */
export function usePersisted<T>(key: string, initial: T) {
  const [v, setV] = useState<T>(initial);
  useEffect(() => {
    const raw = localStorage.getItem(key);
    if (raw) try { setV(JSON.parse(raw)); } catch { /* ignore */ }
  }, [key]);
  const set = (nv: T) => { setV(nv); localStorage.setItem(key, JSON.stringify(nv)); };
  return [v, set] as const;
}

export type Unit = "fatia" | "peso";
const w = (f: Fatia, u: Unit) => (u === "peso" ? f.peso : 1);
const active = (f: Fatia, d: string) => f.entrou_escopo <= d && !(f.removida && f.removida <= d);

export const escopoAt = (fs: Fatia[], d: string, u: Unit) =>
  fs.reduce((s, f) => s + (active(f, d) ? w(f, u) : 0), 0);
export const builtAt = (fs: Fatia[], d: string, u: Unit) =>
  fs.reduce((s, f) => s + (active(f, d) && f.concluida && f.concluida <= d ? w(f, u) : 0), 0);
export const plannedAt = (fs: Fatia[], d: string, u: Unit) =>
  fs.reduce((s, f) => {
    if (!active(f, d)) return s;
    const span = Math.max(1, diffDays(f.entrou_escopo, f.marco));
    const p = Math.min(1, Math.max(0, diffDays(f.entrou_escopo, d) / span));
    return s + p * w(f, u);
  }, 0);

export function buildSeries(fs: Fatia[], u: Unit, today: string) {
  const out: { d: string; escopo: number; planejado: number; construido: number | null }[] = [];
  for (let d = START; d <= END; d = addDays(d, 1)) {
    out.push({
      d,
      escopo: escopoAt(fs, d, u),
      planejado: Math.round(plannedAt(fs, d, u) * 10) / 10,
      construido: d <= today ? builtAt(fs, d, u) : null,
    });
  }
  return out;
}
