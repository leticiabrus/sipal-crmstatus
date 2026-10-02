import { DEFINICAO, END, START, addDays, builtAt, escopoAt, planejadoAt, type Fatia } from "@/lib/burnup";

/**
 * Fluxo acumulado: burnup e burndown no mesmo gráfico. As três faixas empilhadas somam o escopo do dia:
 * concluído embaixo (a subida é o burnup), em andamento no meio, a fazer em cima (as duas juntas são o
 * restante do burndown). Conta todos os cards do escopo, a mesma base do planejado.
 */

const noEscopo = (f: Fatia, d: string) => f.entradaEscopo <= d && !(f.removida && f.removida <= d);

/** Em andamento: começou até d e não concluiu até d. */
export const emAndamentoAt = (fs: Fatia[], d: string) =>
  fs.filter((f) => noEscopo(f, d) && f.iniciada && f.iniciada <= d && !(f.concluida && f.concluida <= d)).length;

export type PontoFluxo = {
  d: string;
  escopo: number;
  planejado: number | null;
  concluido: number | null;
  andamento: number | null;
  aFazer: number | null;
};

/** Pontos diários de START ao prazo. As faixas param hoje; escopo e planejado seguem até o fim. */
export function buildFluxo(fs: Fatia[], today: string): PontoFluxo[] {
  const out: PontoFluxo[] = [];
  for (let d = START; d <= END; d = addDays(d, 1)) {
    const escopo = escopoAt(fs, d);
    const real = d <= today;
    const concluido = real ? builtAt(fs, d) : null;
    const andamento = real ? emAndamentoAt(fs, d) : null;
    out.push({
      d,
      escopo,
      planejado: d < DEFINICAO.ate ? null : planejadoAt(fs, d),
      concluido,
      andamento,
      aFazer: real ? escopo - concluido! - andamento! : null,
    });
  }
  return out;
}

/** Dias depois do fechamento do escopo em que ele cresceu, com quanto entrou: viram anotação no gráfico. */
export function entradasDepoisDoFechamento(serie: PontoFluxo[]) {
  return serie.flatMap((p, i) =>
    i > 0 && p.d > DEFINICAO.ate && p.escopo > serie[i - 1]!.escopo ? [{ d: p.d, escopo: p.escopo, entrou: p.escopo - serie[i - 1]!.escopo }] : []);
}
