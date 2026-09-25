import { useEffect, useState } from "react";
import { CARDS, DISCOVERY, FATIAS, MODULOS, type Card, type Fatia, type Modulo } from "@/data/fatias";

export { CARDS, DISCOVERY, FATIAS, MODULOS, type Card, type Fatia, type Modulo };

/** Período em que o escopo do MVP foi definido; depois de 17/09 nada entra. */
export const DEFINICAO = { de: "2026-08-24", ate: "2026-09-17" };
/** Prazo de conclusão do desenvolvimento. */
export const MVP = "2026-11-10";
/** Instante do prazo: 10/11/2026 às 23h59 em Brasília (UTC−3, sem horário de verão). */
export const MVP_PRAZO = Date.parse("2026-11-10T23:59:00-03:00");

export const moduloDe = (id: string) => MODULOS.find((m) => m.id === id);
/** Módulos com estimativa e datas: os que formam o cronograma sequencial. */
export const ESTIMADOS = MODULOS.filter((m): m is Modulo & { semanas: number; inicio: string; fim: string } =>
  m.semanas !== null && m.inicio !== null && m.fim !== null);
export const SEMANAS_ESTIMADAS = ESTIMADOS.reduce((s, m) => s + m.semanas, 0);
export const INICIO_DELIVERY = ESTIMADOS.map((m) => m.inicio).sort()[0]!;
/** Fim do último módulo com estimativa. */
export const FIM_SEQUENCIAL = ESTIMADOS.map((m) => m.fim).sort().at(-1)!;
/** Prazos do cronograma: o fim de cada módulo. */
export const MARCOS = [...new Set(ESTIMADOS.map((m) => m.fim))].sort();

/**
 * Eixo dos gráficos: do início de setembro, para a linha de escopo mostrar os degraus até 17/09,
 * ao prazo do MVP. O acompanhamento foca em 10/11; o que cai depois fica marcado como a redistribuir.
 */
export const START = "2026-09-01";
export const END = MVP;
/** Janela do piloto, do MVP pronto ao fim de novembro: depois do eixo. */
export const PILOTO = { de: MVP, ate: "2026-11-27" };

/**
 * Situação da janela do módulo em relação ao prazo, em linguagem neutra.
 * Começa depois de 10/11: a redistribuir entre os dois desenvolvedores. Começa antes e termina depois: fora da janela atual.
 */
export const rotuloJanela = (m: Modulo) =>
  m.inicio && m.inicio > MVP ? "após 10/11 · a redistribuir" : m.fim && m.fim > MVP ? "fora da janela atual" : null;

/** Delivery: os 70 cards a construir. Os 11 da fundação foram feitos no discovery técnico e ficam fora das curvas de concluído e planejado. */
export const delivery = (fs: Fatia[]) => fs.filter((f) => f.fase === "delivery");

/** Estado derivado das datas, na ordem de precedência: removido > concluído > em andamento > a fazer. */
export const ESTADOS = [
  { v: "nao_iniciada", label: "A fazer", color: "var(--bu-text-2)" },
  { v: "em_andamento", label: "Em andamento", color: "var(--bu-warn)" },
  { v: "concluida", label: "Concluído", color: "var(--bu-green)" },
  { v: "removida", label: "Removido", color: "var(--bu-text-3)" },
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
export const fmt = (iso: string | null) => (iso ? `${iso.slice(8, 10)}/${iso.slice(5, 7)}` : "—");
/** "28/09 a 09/10" ou "12 a 16/10". */
export const periodo = (de: string, ate: string) =>
  de === ate ? fmt(de) : de.slice(5, 7) === ate.slice(5, 7) ? `${de.slice(8)} a ${fmt(ate)}` : `${fmt(de)} a ${fmt(ate)}`;
/** Número em pt-BR com uma casa (11,5). */
export const n1 = (v: number) => (Math.round(v * 10) / 10).toLocaleString("pt-BR");

/**
 * Módulo atual: o que tem hoje dentro da janela. Entre dois módulos, ou antes do primeiro,
 * é o próximo a começar; depois do último, o último.
 */
export function moduloAtual(hoje: string) {
  return ESTIMADOS.find((m) => m.inicio <= hoje && hoje <= m.fim)
    ?? ESTIMADOS.find((m) => m.inicio > hoje)
    ?? ESTIMADOS.at(-1)!;
}

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

// A unidade é o card: cada série conta cards. O escopo conta todos; concluído e planejado, só o delivery.
export const escopoAt = (fs: Fatia[], d: string) => fs.filter((f) => active(f, d)).length;
export const builtAt = (fs: Fatia[], d: string) =>
  fs.filter((f) => f.fase === "delivery" && active(f, d) && f.concluida && f.concluida <= d).length;
/**
 * Planejado: cards cujo módulo terminou até d. Escalonado de propósito, sem interpolação:
 * o card só "deveria estar pronto" quando o módulo dele fecha. Bloqueios, sem módulo e módulos
 * sem estimativa não têm data, então ficam fora da curva e entram só no escopo.
 */
export const planejadoAt = (fs: Fatia[], d: string) =>
  fs.filter((f) => f.fase === "delivery" && active(f, d) && f.marco !== null && f.marco <= d).length;

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

const NUM = ["zero", "um", "dois", "três", "quatro", "cinco", "seis", "sete", "oito", "nove", "dez"];
const numero = (n: number) => NUM[n] ?? String(n);
const quando = (dias: number) => (dias === 0 ? "hoje" : dias === 1 ? "amanhã" : `em ${numero(dias)} dias`);
const juntar = (xs: string[], prep: string) => xs.map((x) => `${prep} ${x}`).join(" e ");

/** Cards não concluídos que, direta ou indiretamente, seguram f, fora do próprio módulo. */
function bloqueadores(f: Fatia, porId: Map<string, Fatia>, visto = new Set<string>()): string[] {
  const refs = (f.dependeDe ?? "").match(/\b[A-Z]+(?:-[A-Z])?\d+\b/g) ?? [];
  return refs.flatMap((id) => {
    const dep = porId.get(id);
    if (!dep || dep.concluida || dep.removida || visto.has(id)) return [];
    visto.add(id);
    return dep.moduloId === f.moduloId ? bloqueadores(dep, porId, visto) : [id];
  });
}

/**
 * Texto curto do estado de um grupo de cards, derivado das datas e dependências.
 * Sem linguagem de atraso: o que passou do fim do módulo aparece como "fora da janela atual".
 */
export function situacaoGrupo(doGrupo: Fatia[], todas: Fatia[], hoje: string) {
  const fs = doGrupo.filter((f) => !f.removida);
  if (!fs.length) return "—";
  const abertas = fs.filter((f) => !f.concluida);
  if (!abertas.length) return "Concluído";
  const porId = new Map(todas.map((f) => [f.id, f]));
  const uniq = (xs: string[]) => [...new Set(xs)].sort();
  const voo = fs.filter((f) => estadoDe(f) === "em_andamento");
  const travas = voo.map((f) => bloqueadores(f, porId));
  if (voo.length && travas.every((t) => t.length)) return `Travado ${juntar(uniq(travas.flat()), "pelo")}`;
  const feitos = fs.length - abertas.length;
  const partes: string[] = [];
  if (!voo.length && !feitos) {
    const deps = uniq(abertas.flatMap((f) => bloqueadores(f, porId)));
    partes.push(deps.length ? `A fazer, depende ${juntar(deps, "do")}` : "A fazer");
  } else {
    partes.push(
      voo.length === fs.length ? "Todos em andamento"
      : voo.length ? `${voo.length} em andamento de ${fs.length}`
      : `${feitos} de ${fs.length} concluídos`,
    );
  }
  const foraDaJanela = abertas.filter((f) => f.marco !== null && f.marco < hoje).length;
  if (foraDaJanela) partes.push(`${foraDaJanela} fora da janela atual`);
  const proximo = abertas.map((f) => f.marco).filter((m): m is string => m !== null && m >= hoje).sort()[0];
  if (proximo && diffDays(hoje, proximo) <= 7) partes.push(`fim da janela ${quando(diffDays(hoje, proximo))}`);
  return partes.join(", ");
}
