import { MVP, addDays, fmt, type Fatia } from "@/lib/burnup";

/**
 * Status report semanal. Nada é armazenado: cada semana é o resultado das mesmas regras
 * avaliadas numa data de corte diferente, então uma correção retroativa refaz o histórico.
 */

export type Situacao = "encerrada" | "em_curso" | "futura" | "entrega";

export type Semana = {
  n: number;
  de: string;
  ate: string;
  situacao: Situacao;
  /** Encerrada: último dia. Em curso: hoje. Futura: último dia, como previsão. */
  corte: string;
};

const DIA = (iso: string) => new Date(`${iso}T12:00:00Z`).getUTCDay();

/** Primeira segunda-feira do acompanhamento: a semana em que o discovery técnico fechou as decisões de fundação. */
export const INICIO_SEMANAS = "2026-09-15";

/**
 * Semanas do acompanhamento, de segunda a sexta, de 15/09 até a semana anterior ao prazo;
 * a última é o dia de entrega do MVP (10/11). O horizonte do painel termina no prazo.
 */
export function semanasDoDelivery(today: string): Semana[] {
  const out: Semana[] = [];
  for (let ini = INICIO_SEMANAS, n = 1; ini < MVP; ini = addDays(ini, 7), n++) {
    const fim = addDays(ini, 4);
    const situacao: Situacao = fim < today ? "encerrada" : ini > today ? "futura" : "em_curso";
    out.push({ n, de: ini, ate: fim, situacao, corte: situacao === "em_curso" ? today : fim });
  }
  out.push({ n: out.length + 1, de: MVP, ate: MVP, situacao: MVP < today ? "encerrada" : "entrega", corte: MVP });
  return out;
}

/** Semana em curso; fora do calendário (fim de semana entre duas), a última encerrada. */
export function semanaAtual(semanas: Semana[]) {
  return semanas.find((s) => s.situacao === "em_curso") ?? semanas.filter((s) => s.situacao === "encerrada").at(-1) ?? semanas[0]!;
}

/** "22 a 26/09", "29/09 a 03/10" ou "10/11". */
export function periodo(s: { de: string; ate: string }) {
  if (s.de === s.ate) return fmt(s.de);
  return s.de.slice(5, 7) === s.ate.slice(5, 7) ? `${s.de.slice(8)} a ${fmt(s.ate)}` : `${fmt(s.de)} a ${fmt(s.ate)}`;
}

const noEscopo = (f: Fatia, d: string) => f.entradaEscopo <= d && !(f.removida && f.removida <= d);

/** Estado do projeto numa data de corte, pelos registros reais. */
export function snapshotEm(fatias: Fatia[], corte: string) {
  const vigentes = fatias.filter((f) => noEscopo(f, corte));
  return {
    concluidas: vigentes.filter((f) => f.concluida && f.concluida <= corte),
    emAndamento: vigentes.filter((f) => f.iniciada && f.iniciada <= corte && (!f.concluida || f.concluida > corte)),
    proximas: vigentes.filter((f) => (!f.iniciada || f.iniciada > corte) && !(f.concluida && f.concluida <= corte)),
  };
}

/**
 * Semana futura: não há registro do que ainda não aconteceu, então o previsto vem do plano.
 * Conta como concluído o que tem prazo até o corte; segue em andamento o que já começou e vence depois.
 */
export function snapshotPrevisto(fatias: Fatia[], corte: string, today: string) {
  const real = snapshotEm(fatias, today);
  const vigentes = fatias.filter((f) => noEscopo(f, corte));
  const concluidas = vigentes.filter((f) => (f.concluida && f.concluida <= today) || (f.marco !== null && f.marco <= corte));
  const feitas = new Set(concluidas.map((f) => f.id));
  const emAndamento = real.emAndamento.filter((f) => !feitas.has(f.id));
  const andando = new Set(emAndamento.map((f) => f.id));
  return { concluidas, emAndamento, proximas: vigentes.filter((f) => !feitas.has(f.id) && !andando.has(f.id)) };
}

export type Snapshot = ReturnType<typeof snapshotEm>;

export const estadoDaSemana = (s: Semana, fatias: Fatia[], today: string): Snapshot =>
  s.situacao === "futura" || s.situacao === "entrega" ? snapshotPrevisto(fatias, s.corte, today) : snapshotEm(fatias, s.corte);

// Sem prazo (bloqueios, sem módulo, módulo sem estimativa) vai para o fim.
const porPrazo = (a: Fatia, b: Fatia) => (a.marco ?? "9999").localeCompare(b.marco ?? "9999") || a.id.localeCompare(b.id);

/** As três colunas da área principal. */
export function colunasDaSemana(s: Semana, semanas: Semana[], fatias: Fatia[], today: string) {
  const estado = estadoDaSemana(s, fatias, today);
  const previsto = s.situacao === "futura" || s.situacao === "entrega";
  const naSemana = (d: string | null) => !!d && d >= s.de && d <= s.ate;
  const concluidas = previsto
    ? estado.concluidas.filter((f) => naSemana(f.marco) && !(f.concluida && f.concluida <= today))
    : estado.concluidas.filter((f) => naSemana(f.concluida));
  const seguinte = semanas.find((x) => x.n === s.n + 1);
  const feitas = new Set(estado.concluidas.map((f) => f.id));
  const proximas = seguinte
    ? fatias.filter((f) => noEscopo(f, s.corte) && f.marco !== null && f.marco >= seguinte.de && f.marco <= seguinte.ate && !feitas.has(f.id))
    : [];
  return {
    previsto,
    concluidas: concluidas.sort(porPrazo),
    emAndamento: [...estado.emAndamento].sort(porPrazo),
    proximas: proximas.sort(porPrazo),
    seguinte: seguinte ?? null,
  };
}

export type Contagem = { concluidas: number; emAndamento: number; aFazer: number; total: number };
export const contar = (e: Snapshot): Contagem => ({
  concluidas: e.concluidas.length,
  emAndamento: e.emAndamento.length,
  aFazer: e.proximas.length,
  total: e.concluidas.length + e.emAndamento.length + e.proximas.length,
});

/** Diferença para a semana anterior; null na primeira. */
export function variacao(s: Semana, semanas: Semana[], fatias: Fatia[], today: string) {
  const anterior = semanas.find((x) => x.n === s.n - 1);
  if (!anterior) return null;
  const a = contar(estadoDaSemana(anterior, fatias, today)), b = contar(estadoDaSemana(s, fatias, today));
  return { concluidas: b.concluidas - a.concluidas, emAndamento: b.emAndamento - a.emAndamento, aFazer: b.aFazer - a.aFazer };
}

const plural = (n: number, um: string, varios: string) => `${n} ${n === 1 ? um : varios}`;

/** Frase de resumo do cabeçalho da semana. */
export function resumoDaSemana(s: Semana, semanas: Semana[], fatias: Fatia[], today: string) {
  const c = contar(estadoDaSemana(s, fatias, today));
  const col = colunasDaSemana(s, semanas, fatias, today);
  const prox = col.seguinte ? `${plural(col.proximas.length, "card vence", "cards vencem")} na semana seguinte.` : "";
  if (s.situacao === "entrega") return `Dia da entrega do MVP. Previsto: ${plural(c.concluidas, "card concluído", "cards concluídos")} de ${c.total}.`;
  if (s.situacao === "futura")
    return `Previsto pelo plano: ${plural(col.concluidas.length, "card vence", "cards vencem")} nesta semana, ${c.concluidas} de ${c.total} concluídos ao fim dela. ${prox}`.trim();
  const quando = s.situacao === "em_curso" ? "até hoje" : "na semana";
  const fecho = s.situacao === "em_curso" ? "Hoje" : `No fechamento (${fmt(s.corte)})`;
  return `${plural(col.concluidas.length, "card concluído", "cards concluídos")} ${quando}. ${fecho}, ${c.emAndamento} em andamento e ${c.aFazer} a fazer. ${prox}`.trim();
}

/** Número da semana em curso, para os outros painéis. */
export const numeroSemanaAtual = (today: string) => semanaAtual(semanasDoDelivery(today)).n;

