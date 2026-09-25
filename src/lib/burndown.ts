import { DEFINICAO, MVP, addDays, builtAt, diffDays, escopoAt, moduloDe, planejadoAt, type Fatia } from "@/lib/burnup";

/**
 * Ciclo do burndown: do escopo fechado ao prazo do MVP. O acompanhamento foca em 10/11.
 * Conta só o delivery (quem chama filtra com `delivery()`): os 11 da fundação já foram feitos no discovery.
 */
export const CICLO = { de: DEFINICAO.ate, ate: MVP };
export const DIAS_CICLO = diffDays(CICLO.de, CICLO.ate);

const noEscopo = (f: Fatia, d: string) => f.entradaEscopo <= d && !(f.removida && f.removida <= d);

/** O que falta entregar: só desce quando um card é concluído. */
export const restanteAt = (fs: Fatia[], d: string) => escopoAt(fs, d) - builtAt(fs, d);

/**
 * Referência: o que os módulos ainda não fecharam. Desce em degraus, no fim de cada módulo.
 * Não chega a zero em 10/11: bloqueios, sem módulo, módulos sem estimativa e o que fecha depois do prazo ficam acima.
 */
export const planejadoRestanteAt = (fs: Fatia[], d: string) => escopoAt(fs, d) - planejadoAt(fs, d);

/** Tocados até o dia: iniciados, ou concluídos mesmo sem data de início. */
const tocadasAt = (fs: Fatia[], d: string) =>
  fs.filter((f) => noEscopo(f, d) && ((f.iniciada && f.iniciada <= d) || (f.concluida && f.concluida <= d))).length;

/** O que ainda não foi tocado: desce quando um card começa. */
export const naoIniciadoAt = (fs: Fatia[], d: string) => escopoAt(fs, d) - tocadasAt(fs, d);

export type PontoBurndown = {
  d: string;
  planejado: number;
  restante: number | null;
  naoIniciado: number | null;
  /** Faixa [planejado, restante] só onde o restante passou do planejado; nos outros dias, sem área. */
  desvio: [number, number] | null;
};

/** Pontos diários do ciclo. As séries reais param no dia de hoje; a referência vai até o fim do ciclo. */
export function buildBurndown(fs: Fatia[], today: string): PontoBurndown[] {
  const out: PontoBurndown[] = [];
  for (let d = CICLO.de; d <= CICLO.ate; d = addDays(d, 1)) {
    const planejado = planejadoRestanteAt(fs, d);
    const real = d <= today;
    const restante = real ? restanteAt(fs, d) : null;
    out.push({
      d,
      planejado,
      restante,
      naoIniciado: real ? naoIniciadoAt(fs, d) : null,
      desvio: restante !== null && restante > planejado ? [planejado, restante] : null,
    });
  }
  return out;
}

export type Indicadores = {
  total: number;
  restante: number;
  planejadoHoje: number;
  /** Restante menos a referência de hoje: positivo quando um módulo fechou com cards em aberto. */
  desvio: number;
  /** Por dia, para zerar o restante até 10/11; null no dia do prazo ou depois. Usado só nos cenários. */
  ritmoNecessario: number | null;
};

export function indicadores(fs: Fatia[], today: string): Indicadores {
  const restante = restanteAt(fs, today);
  const planejadoHoje = planejadoRestanteAt(fs, today);
  const diasAteMvp = diffDays(today, MVP);
  return {
    total: escopoAt(fs, today),
    restante,
    planejadoHoje,
    desvio: restante - planejadoHoje,
    ritmoNecessario: diasAteMvp > 0 ? restante / diasAteMvp : null,
  };
}

export type LinhaMarco = {
  d: string;
  /** Cards cujo módulo fecha nesta data. */
  vencem: number;
  acumulado: number;
  /** Dias de hoje até a data (negativo = já passou). */
  diasAte: number;
  /** Módulos que fecham na data, com a contagem de cards de cada. */
  conteudo: string;
  proximo: boolean;
};

/** Prazos do cronograma: o fim de cada módulo com cards em escopo. */
export function tabelaMarcos(fs: Fatia[], today: string): LinhaMarco[] {
  const vigentes = fs.filter((f) => noEscopo(f, today));
  const datas = [...new Set(vigentes.map((f) => f.marco).filter((m): m is string => m !== null))].sort();
  const proximo = datas.find((d) => d >= today);
  let acumulado = 0;
  return datas.map((d) => {
    const doMarco = vigentes.filter((f) => f.marco === d);
    const vencem = doMarco.length;
    acumulado += vencem;
    const porModulo = new Map<string, number>();
    doMarco.forEach((f) => porModulo.set(f.moduloId, (porModulo.get(f.moduloId) ?? 0) + 1));
    const conteudo = [...porModulo].map(([id, n]) => `${id} · ${moduloDe(id)?.nome ?? id} (${n})`).join(", ");
    return { d, vencem, acumulado, diasAte: diffDays(today, d), conteudo, proximo: d === proximo };
  });
}

export const proximoMarco = (linhas: LinhaMarco[]) => linhas.find((l) => l.proximo) ?? null;

export type Cenario = {
  nome: string;
  porDia: number;
  conclusao: string;
  /** Diferença para o prazo, em dias (negativo = antes). */
  folga: number;
  tom: "green" | "warn";
  leitura: string;
};

/**
 * Datas de conclusão a partir de hoje, para ritmos fixos. Calculadas, nunca fixas.
 * Sem linguagem de atraso: depois do prazo é "diferença para o prazo", informação para a conversa de alocação.
 */
export function cenarios(restante: number, today: string, ritmoNecessario: number | null): Cenario[] {
  const base: [string, number][] = [
    ["Ritmo exigido hoje", ritmoNecessario ?? 0],
    ["Um por dia útil", 5 / 7],
    ["Dois por dia útil", 10 / 7],
    ["Três por dia útil", 15 / 7],
  ];
  return base
    .filter(([, porDia]) => porDia > 0)
    .map(([nome, porDia]) => {
      // Arredonda o ritmo exigido antes de dividir: evita que 80 ÷ (80/46) vire 46,0000001 dias.
      const dias = restante <= 0 ? 0 : Math.ceil(Math.round((restante / porDia) * 1e6) / 1e6);
      const conclusao = addDays(today, dias);
      const folga = diffDays(MVP, conclusao);
      const tom = folga <= 0 ? "green" : "warn";
      const leitura =
        restante <= 0 ? "Escopo já concluído."
        : folga < 0 ? `Termina ${-folga} dia${folga === -1 ? "" : "s"} antes do prazo.`
        : folga === 0 ? "Termina no prazo, sem folga."
        : `Diferença para o prazo: ${folga} dia${folga === 1 ? "" : "s"}. Depende de alocação.`;
      return { nome, porDia, conclusao, folga, tom, leitura };
    });
}
