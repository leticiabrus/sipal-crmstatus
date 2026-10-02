import { useEffect, useState } from "react";
import { CARDS, DISCOVERY, FATIAS, MODULOS, REVISAO, type Card, type Fatia, type Modulo, type Situacao } from "@/data/fatias";

export { CARDS, DISCOVERY, FATIAS, MODULOS, REVISAO, type Card, type Fatia, type Modulo, type Situacao };

/** Período em que o escopo do MVP foi definido. Depois disso, o que entra aparece como degrau na linha de escopo. */
export const DEFINICAO = { de: "2026-08-24", ate: "2026-09-17" };
/** Prazo de conclusão do desenvolvimento. */
export const MVP = "2026-11-10";
/** Instante do prazo: 10/11/2026 às 23h59 em Brasília (UTC−3, sem horário de verão). */
export const MVP_PRAZO = Date.parse("2026-11-10T23:59:00-03:00");

export const moduloDe = (id: string) => MODULOS.find((m) => m.id === id);
/** Prazos do cronograma: as datas de prazo dos cards, em ordem. */
export const MARCOS = [...new Set(FATIAS.map((f) => f.marco).filter((m): m is string => m !== null))].sort();

/**
 * Eixo dos gráficos: do início de setembro, para a linha de escopo mostrar os degraus até 17/09,
 * ao prazo do MVP.
 */
export const START = "2026-09-01";
export const END = MVP;
/** Janela do piloto, do MVP pronto ao fim de novembro: depois do eixo. */
export const PILOTO = { de: MVP, ate: "2026-11-27" };

/** Situação na tela, vinda da planilha. Parcial tem selo próprio e conta com o a fazer nas contagens. */
export const ESTADOS = [
  { v: "nao_iniciada", label: "A fazer", color: "var(--bu-text-2)" },
  { v: "em_andamento", label: "Em andamento", color: "var(--bu-warn)" },
  { v: "parcial", label: "Parcial", color: "var(--bu-warn)" },
  { v: "concluida", label: "Concluído", color: "var(--bu-green)" },
  { v: "removida", label: "Removido", color: "var(--bu-text-3)" },
] as const;
export type Estado = (typeof ESTADOS)[number]["v"];
const DA_SITUACAO: Record<Situacao, Estado> = { concluido: "concluida", andamento: "em_andamento", parcial: "parcial", a_fazer: "nao_iniciada" };
export const estadoDe = (f: Fatia): Estado => (f.removida ? "removida" : DA_SITUACAO[f.situacao]);

/** Selo de situação. Parcial se distingue de em andamento pela borda tracejada, na mesma cor. */
export const seloEstado = (e: Estado) => {
  const s = ESTADOS.find((x) => x.v === e) ?? ESTADOS[0];
  return {
    label: s.label,
    style: e === "parcial"
      ? { color: s.color, border: `1px dashed ${s.color}`, background: "transparent" }
      : { color: s.color, background: `color-mix(in srgb, ${s.color} 12%, transparent)` },
  };
};

/** Bloqueio com terceiros: discovery com o produto, em aberto, e com o prazo replanejado. */
export const ehBloqueio = (f: Fatia) =>
  f.fase === "discovery" && f.area === "produto" && f.situacao !== "concluido" && f.prazoOriginal !== null && !f.removida;

/** Contagem dos cartões: a fazer soma os sem início e os parciais. */
export function contagem(fs: Fatia[]) {
  const vigentes = fs.filter((f) => !f.removida);
  const de = (s: Situacao) => vigentes.filter((f) => f.situacao === s).length;
  const concluidos = de("concluido");
  return {
    total: vigentes.length,
    concluidos,
    emAndamento: de("andamento"),
    semInicio: de("a_fazer"),
    parciais: de("parcial"),
    aFazer: de("a_fazer") + de("parcial"),
    bloqueios: vigentes.filter(ehBloqueio).length,
    pct: vigentes.length ? Math.round((concluidos / vigentes.length) * 100) : 0,
  };
}

/** Uma linha por prazo, mais a dos sem prazo, com as contagens e o avanço. */
export function tabelaPrazos(fs: Fatia[]) {
  const vigentes = fs.filter((f) => !f.removida);
  const datas: (string | null)[] = [...new Set(vigentes.map((f) => f.marco).filter((m): m is string => m !== null))].sort();
  if (vigentes.some((f) => f.marco === null)) datas.push(null);
  return datas.map((d) => {
    const doPrazo = vigentes.filter((f) => f.marco === d);
    const c = contagem(doPrazo);
    return { d, ...c, soBloqueios: doPrazo.length > 0 && doPrazo.every(ehBloqueio) };
  });
}

/** Avanço por módulo, do mais adiantado ao menos. */
export function avancoPorModulo(fs: Fatia[]) {
  return MODULOS.map((m) => ({ m, ...contagem(fs.filter((f) => f.moduloId === m.id)) }))
    .filter((l) => l.total > 0)
    .sort((a, b) => b.concluidos / b.total - a.concluidos / a.total || b.total - a.total || a.m.ordem - b.m.ordem);
}

export function todayISO() {
  const d = new Date();
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}
const DAY = 86400000;
const t = (iso: string) => Date.parse(iso + "T00:00:00Z");
export const addDays = (iso: string, n: number) => new Date(t(iso) + n * DAY).toISOString().slice(0, 10);
export const diffDays = (a: string, b: string) => Math.round((t(b) - t(a)) / DAY);
export const fmt = (iso: string | null) => (iso ? `${iso.slice(8, 10)}/${iso.slice(5, 7)}` : "—");
/** "28/09 a 09/10" ou "12 a 16/10". */
export const periodo = (de: string, ate: string) =>
  de === ate ? fmt(de) : de.slice(5, 7) === ate.slice(5, 7) ? `${de.slice(8)} a ${fmt(ate)}` : `${fmt(de)} a ${fmt(ate)}`;
/** Número em pt-BR com uma casa (11,5). */
export const n1 = (v: number) => (Math.round(v * 10) / 10).toLocaleString("pt-BR");

const POR_EXTENSO = ["Nenhum", "Um", "Dois", "Três", "Quatro", "Cinco", "Seis", "Sete", "Oito", "Nove", "Dez"];
/** "Sete", "Dois"; acima de dez, o número. */
export const porExtenso = (n: number) => POR_EXTENSO[n] ?? String(n);

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

const active = (f: Fatia, d: string) => f.entradaEscopo <= d && !(f.removida && f.removida <= d);

// A unidade é o card: cada série conta todos os cards do escopo, discovery e delivery.
export const escopoAt = (fs: Fatia[], d: string) => fs.filter((f) => active(f, d)).length;
export const builtAt = (fs: Fatia[], d: string) =>
  fs.filter((f) => active(f, d) && f.concluida && f.concluida <= d).length;
/**
 * Planejado: cards cujo prazo chegou até d. Escalonado de propósito, sem interpolação:
 * o card só "deveria estar pronto" no prazo dele. Os sem prazo ficam fora da curva e entram só no escopo.
 */
export const planejadoAt = (fs: Fatia[], d: string) =>
  fs.filter((f) => active(f, d) && f.marco !== null && f.marco <= d).length;

/** Em andamento: iniciados até d menos concluídos até d. Ao contrário das outras séries, sobe e desce. */
export const andamentoAt = (fs: Fatia[], d: string) =>
  fs.filter((f) => active(f, d) && f.iniciada && f.iniciada <= d && !(f.concluida && f.concluida <= d)).length;

export function buildSeries(fs: Fatia[], today: string) {
  const out: {
    d: string; escopo: number; planejado: number | null; construido: number | null; andamento: number | null;
  }[] = [];
  for (let d = START; d <= END; d = addDays(d, 1)) {
    out.push({
      d,
      escopo: escopoAt(fs, d),
      // Sem ponto antes do fechamento do escopo: a curva nasce em 17/09, com valor zero.
      planejado: d < DEFINICAO.ate ? null : planejadoAt(fs, d),
      construido: d <= today ? builtAt(fs, d) : null,
      andamento: d <= today ? andamentoAt(fs, d) : null,
    });
  }
  return out;
}

/**
 * Faixa em andamento cresceu nos últimos 7 dias com o concluído parado.
 * Devolve há quantos dias a situação ocorre (desde que a faixa passou a crescer
 * após a última conclusão), ou null se não ocorre.
 */
export function faixaTravada(fs: Fatia[], today: string) {
  const d7 = addDays(today, -7);
  if (!(andamentoAt(fs, today) > andamentoAt(fs, d7) && builtAt(fs, today) === builtAt(fs, d7))) return null;
  let base = today;
  while (base > START && builtAt(fs, addDays(base, -1)) === builtAt(fs, today)) base = addDays(base, -1);
  const wip0 = andamentoAt(fs, base);
  let inicio = base;
  while (inicio < today && andamentoAt(fs, inicio) <= wip0) inicio = addDays(inicio, 1);
  return Math.max(1, diffDays(inicio, today));
}
