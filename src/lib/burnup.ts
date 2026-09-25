import { useEffect, useState } from "react";
import { FATIAS, type Fatia } from "@/data/fatias";

export { FATIAS, type Fatia };

export const START = "2026-08-24";
export const END = "2026-11-27";
/** Período em que o escopo do MVP foi definido; depois de 17/09 nada entra. */
export const DEFINICAO = { de: "2026-08-24", ate: "2026-09-17" };
/** Prazo de conclusão do desenvolvimento. */
export const MVP = "2026-11-10";
/** Instante do prazo: 10/11/2026 às 23h59 em Brasília (UTC−3, sem horário de verão). */
export const MVP_PRAZO = Date.parse("2026-11-10T23:59:00-03:00");
export const MARCOS = ["2026-09-26", "2026-10-03", "2026-10-10", "2026-10-17", MVP];
/** Janela do piloto, do MVP pronto ao fim do período. */
export const PILOTO = { de: MVP, ate: END };

/** Estado derivado das datas, na ordem de precedência: removida > concluída > em andamento > não iniciada. */
export const ESTADOS = [
  { v: "nao_iniciada", label: "Não iniciada", color: "var(--bu-text-2)" },
  { v: "em_andamento", label: "Em andamento", color: "var(--bu-warn)" },
  { v: "concluida", label: "Concluída", color: "var(--bu-green)" },
  { v: "removida", label: "Removida", color: "var(--bu-text-3)" },
] as const;
export type Estado = (typeof ESTADOS)[number]["v"];
export const estadoDe = (f: Fatia): Estado =>
  f.removida ? "removida" : f.concluida ? "concluida" : f.iniciada ? "em_andamento" : "nao_iniciada";

export function todayISO() {
  const d = new Date();
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}
const DAY = 86400000;
const t = (iso: string) => Date.parse(iso + "T00:00:00Z");
export const addDays = (iso: string, n: number) => new Date(t(iso) + n * DAY).toISOString().slice(0, 10);
export const diffDays = (a: string, b: string) => Math.round((t(b) - t(a)) / DAY);
/** Semana do cronograma do dev (S2 = 20/09 a 26/09). */
export const semanaDe = (d: string) => 2 + Math.floor(diffDays("2026-09-20", d) / 7);
export const fmt = (iso: string | null) => (iso ? `${iso.slice(8, 10)}/${iso.slice(5, 7)}` : "—");

/**
 * Tela cheia, pelo botão (Fullscreen API) ou pelo F11 do navegador.
 * O F11 não dispara `fullscreenchange`; nele vale a media query `display-mode: fullscreen`.
 */
export type TelaCheia = "api" | "f11" | null;
export function useTelaCheia(): TelaCheia {
  const [modo, setModo] = useState<TelaCheia>(null);
  useEffect(() => {
    const mq = window.matchMedia("(display-mode: fullscreen)");
    const ler = () => setModo(document.fullscreenElement ? "api" : mq.matches ? "f11" : null);
    ler();
    document.addEventListener("fullscreenchange", ler);
    mq.addEventListener("change", ler);
    window.addEventListener("resize", ler);
    return () => {
      document.removeEventListener("fullscreenchange", ler);
      mq.removeEventListener("change", ler);
      window.removeEventListener("resize", ler);
    };
  }, []);
  return modo;
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
/** Rótulos de tela: o campo continua `peso`, mas na interface é story point. */
export const UNIDADE: Record<Unit, { nome: string; eixo: string }> = {
  fatia: { nome: "fatia", eixo: "fatias de entrega" },
  peso: { nome: "story point", eixo: "story points" },
};
const w = (f: Fatia, u: Unit) => (u === "peso" ? f.peso : 1);
const active = (f: Fatia, d: string) => f.entradaEscopo <= d && !(f.removida && f.removida <= d);

export const escopoAt = (fs: Fatia[], d: string, u: Unit) =>
  fs.reduce((s, f) => s + (active(f, d) ? w(f, u) : 0), 0);
export const builtAt = (fs: Fatia[], d: string, u: Unit) =>
  fs.reduce((s, f) => s + (active(f, d) && f.concluida && f.concluida <= d ? w(f, u) : 0), 0);
/** O planejamento só existe com o escopo fechado: antes de 17/09 não havia o que planejar. */
const inicioPlano = (f: Fatia) => (f.entradaEscopo > DEFINICAO.ate ? f.entradaEscopo : DEFINICAO.ate);
export const plannedAt = (fs: Fatia[], d: string, u: Unit) =>
  fs.reduce((s, f) => {
    if (!active(f, d)) return s;
    const ini = inicioPlano(f);
    const span = Math.max(1, diffDays(ini, f.marco));
    const p = Math.min(1, Math.max(0, diffDays(ini, d) / span));
    return s + p * w(f, u);
  }, 0);

/** Em voo: iniciadas até d menos concluídas até d. Ao contrário das outras séries, sobe e desce. */
export const andamentoAt = (fs: Fatia[], d: string, u: Unit) =>
  fs.reduce((s, f) => {
    if (!active(f, d) || !f.iniciada || f.iniciada > d) return s;
    return f.concluida && f.concluida <= d ? s : s + w(f, u);
  }, 0);

export function buildSeries(fs: Fatia[], u: Unit, today: string) {
  const out: {
    d: string; escopo: number; planejado: number | null; construido: number | null; andamento: number | null;
  }[] = [];
  for (let d = START; d <= END; d = addDays(d, 1)) {
    out.push({
      d,
      escopo: escopoAt(fs, d, u),
      // Sem ponto antes do fechamento do escopo: a curva nasce em 17/09, com valor zero.
      planejado: d < DEFINICAO.ate ? null : Math.round(plannedAt(fs, d, u) * 10) / 10,
      construido: d <= today ? builtAt(fs, d, u) : null,
      andamento: d <= today ? andamentoAt(fs, d, u) : null,
    });
  }
  return out;
}

/**
 * Faixa em voo cresceu nos últimos 7 dias com o construído parado.
 * Devolve há quantos dias a situação ocorre (desde que a faixa passou a crescer
 * após a última entrega), ou null se não ocorre.
 */
export function faixaTravada(fs: Fatia[], u: Unit, today: string) {
  const d7 = addDays(today, -7);
  if (!(andamentoAt(fs, today, u) > andamentoAt(fs, d7, u) && builtAt(fs, today, u) === builtAt(fs, d7, u))) return null;
  let base = today;
  while (base > START && builtAt(fs, addDays(base, -1), u) === builtAt(fs, today, u)) base = addDays(base, -1);
  const wip0 = andamentoAt(fs, base, u);
  let inicio = base;
  while (inicio < today && andamentoAt(fs, inicio, u) <= wip0) inicio = addDays(inicio, 1);
  return Math.max(1, diffDays(inicio, today));
}

const NUM = ["zero", "um", "dois", "três", "quatro", "cinco", "seis", "sete", "oito", "nove", "dez"];
const numero = (n: number, fem = false) =>
  fem && n === 1 ? "uma" : fem && n === 2 ? "duas" : (NUM[n] ?? String(n));
const quando = (dias: number) => (dias === 0 ? "hoje" : dias === 1 ? "amanhã" : `em ${numero(dias)} dias`);
const juntar = (xs: string[], prep: string) => xs.map((x) => `${prep} ${x}`).join(" e ");

/** Fatias não concluídas que, direta ou indiretamente, seguram f, fora do próprio épico. */
function bloqueadores(f: Fatia, porId: Map<string, Fatia>, visto = new Set<string>()): string[] {
  const refs = (f.dependeDe ?? "").match(/\b[A-Z]+(?:-[A-Z])?\d+\b/g) ?? [];
  return refs.flatMap((id) => {
    const dep = porId.get(id);
    if (!dep || dep.concluida || dep.removida || visto.has(id)) return [];
    visto.add(id);
    return dep.epico === f.epico ? bloqueadores(dep, porId, visto) : [id];
  });
}

/** Texto curto do estado de um épico, derivado das datas e dependências das suas fatias. */
export function situacaoEpico(doEpico: Fatia[], todas: Fatia[], hoje: string) {
  const fs = doEpico.filter((f) => !f.removida);
  if (!fs.length) return "—";
  const abertas = fs.filter((f) => !f.concluida);
  if (!abertas.length) return "Concluído";
  const porId = new Map(todas.map((f) => [f.id, f]));
  const uniq = (xs: string[]) => [...new Set(xs)].sort();
  const voo = fs.filter((f) => estadoDe(f) === "em_andamento");
  const travas = voo.map((f) => bloqueadores(f, porId));
  if (voo.length && travas.every((t) => t.length)) return `Travada ${juntar(uniq(travas.flat()), "pelo")}`;
  if (!voo.length && abertas.length === fs.length) {
    const deps = uniq(abertas.flatMap((f) => bloqueadores(f, porId)));
    return deps.length ? `Não iniciado, depende ${juntar(deps, "do")}` : "Não iniciado";
  }
  const partes = [
    voo.length === fs.length ? "Todos em voo"
    : voo.length ? `${voo.length} em voo de ${fs.length}`
    : `${fs.length - abertas.length} de ${fs.length} construídas`,
  ];
  const vencidas = abertas.filter((f) => f.marco < hoje).length;
  if (vencidas) partes.push(`${numero(vencidas, true)} vencida${vencidas > 1 ? "s" : ""}`);
  const proximo = abertas.map((f) => f.marco).filter((m) => m >= hoje).sort()[0];
  if (proximo && diffDays(hoje, proximo) <= 7) {
    const n = abertas.filter((f) => f.marco === proximo).length;
    partes.push(`${numero(n, true)} vence${n > 1 ? "m" : ""} ${quando(diffDays(hoje, proximo))}`);
  }
  return partes.join(", ");
}
