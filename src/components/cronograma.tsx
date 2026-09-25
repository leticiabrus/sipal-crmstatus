// Cronograma (Gantt) dos cards e o painel de detalhe, comum à lista e ao cronograma.
// Dois níveis: a barra do módulo, larga, com a janela acordada; e dentro dela as barras dos cards.
// Só leitura: as barras saem das datas registradas; alterar data é pelo arquivo de dados.
import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronRight, X } from "lucide-react";
import {
  END, ESTADOS, INICIO_DELIVERY, MARCOS, MODULOS, MVP, PILOTO, START, addDays, diffDays, estadoDe, fmt, moduloDe, n1, periodo, rotuloJanela,
  type Fatia, type Modulo,
} from "@/lib/burnup";
import { useTamanho } from "@/components/painel";

/** Tipo de trabalho, não período: discovery segue correndo em paralelo ao delivery enquanto houver terceiro a destravar. */
export const FASE: Record<Fatia["fase"], { rotulo: string; classe: string; dica: string }> = {
  discovery: { rotulo: "Discovery", classe: "bg-cyan/12 text-cyan", dica: "Descoberta, definição e destravamento. Não produz código." },
  delivery: { rotulo: "Delivery", classe: "bg-green/12 text-green", dica: "Construção. Produz código ou configuração que vai para produção." },
};

/** Com quem o card está. Produto em laranja: está esperando alguém decidir, e isso não aparece em outro indicador. */
export const AREA: Record<Fatia["area"], { rotulo: string; classe: string; dica: string }> = {
  produto: { rotulo: "Produto", classe: "bg-warn/12 text-warn", dica: "Depende de decisão, definição, negociação ou refinamento antes de virar código." },
  desenvolvimento: { rotulo: "Desenvolvimento", classe: "bg-blue/15 text-blue", dica: "Especificado e pronto para ser construído." },
};

/** Acima disso, a densidade do módulo aparece em destaque: informação para a conversa de alocação. */
export const DENSIDADE_ALTA = 8;
/** Cards por semana do módulo; null sem estimativa. */
export const densidade = (m: Modulo, cards: number) => (m.semanas ? cards / m.semanas : null);

/** Grupos sem data não têm barra: o rótulo diz por quê. */
export const SEM_DATA: Record<string, { rotulo: string; cor: string }> = {
  M7: { rotulo: "a estimar", cor: "text-text-2" },
  BL: { rotulo: "em paralelo · fora da contagem de semanas", cor: "text-text-2" },
  SM: { rotulo: "a alocar", cor: "text-warn" },
};

const EIXO = { de: START, ate: END };
const TOTAL = diffDays(EIXO.de, EIXO.ate);
/** Linhas verticais: o fim de cada módulo dentro do eixo e o prazo do MVP. */
const MARCOS_EIXO = [...new Set([...MARCOS, MVP])].filter((m) => m <= END).sort();
/** A janela do piloto começa no prazo, que é o fim do eixo: só aparece se o eixo passar dele. */
const PILOTO_NO_EIXO = PILOTO.de < END;
const ALTURA_GRUPO = 34;
const ALTURA_LINHA = 26;
const COLUNA_NOME = 280;

const pct = (d: string) => Math.min(100, Math.max(0, (diffDays(EIXO.de, d) / TOTAL) * 100));
const dentro = (d: string) => d >= EIXO.de && d <= EIXO.ate;

export type SituacaoCrono = "concluida" | "em_andamento" | "fora_janela" | "a_fazer";
/** Sem linguagem de atraso: iniciado e com a janela do módulo já fechada é "fora da janela atual". */
const SITUACAO: Record<SituacaoCrono, { rotulo: string; cor: string }> = {
  concluida: { rotulo: "Concluído", cor: "var(--bu-green)" },
  em_andamento: { rotulo: "Em andamento", cor: "var(--bu-warn)" },
  fora_janela: { rotulo: "Fora da janela atual", cor: "var(--bu-danger)" },
  a_fazer: { rotulo: "A fazer", cor: "var(--bu-text-3)" },
};

export function situacaoCrono(f: Fatia, hoje: string): SituacaoCrono {
  if (f.concluida) return "concluida";
  if (f.iniciada) return f.marco !== null && f.marco < hoje ? "fora_janela" : "em_andamento";
  return "a_fazer";
}

/**
 * Trecho da barra do card. A fazer não tem data própria: ocupa a janela do módulo, como estimativa
 * (desenhada tracejada), sem gravar data nenhuma no dado. Sem módulo datado, não há barra.
 */
function barra(f: Fatia, s: SituacaoCrono, hoje: string): { de: string; ate: string } | null {
  if (s === "concluida") return { de: f.iniciada ?? f.concluida!, ate: f.concluida! };
  if (s === "a_fazer") {
    const inicio = moduloDe(f.moduloId)?.inicio;
    // Módulo que só começa depois do fim do eixo não tem trecho visível.
    return inicio && f.marco && inicio <= END ? { de: inicio, ate: f.marco } : null;
  }
  return { de: f.iniciada!, ate: hoje > f.iniciada! ? hoje : f.iniciada! };
}

const REF = /\b[A-Z]+(?:-[A-Z])?\d+\b/g;
/** Separa em `dependeDe` o que é identificador de outro card (vira linha) do que é área externa (vira selo). */
export function dependencias(f: Fatia, ids: Set<string>) {
  const texto = f.dependeDe ?? "";
  const refs = (texto.match(REF) ?? []).filter((id) => ids.has(id));
  const externo = refs
    .reduce((t, id) => t.replace(id, ""), texto)
    .replace(/^(?:\s|,|\be\b)+|(?:\s|,|\be\b)+$/g, "")
    .trim();
  return { refs, externo: externo || null };
}

/**
 * Observação da planilha para leitura: tira o que já aparece em outro campo (frente) e o que
 * pertence ao modelo antigo (peso, semana planejada).
 */
export const observacaoVisivel = (o: string | null) =>
  (o ?? "").split("|").map((x) => x.trim()).filter((x) => x && !/^(épico|peso|sem\.)\b/i.test(x)).join(" · ") || null;

const MESES = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];
const diaDaSemana = (iso: string) => new Date(`${iso}T12:00:00Z`).getUTCDay();

function faixasDeMes() {
  const out: { rotulo: string; de: string; ate: string }[] = [];
  for (let d = EIXO.de; d <= EIXO.ate; ) {
    const fimMes = addDays(`${d.slice(0, 8)}01`, 40).slice(0, 8) + "01";
    const ate = addDays(fimMes, -1) < EIXO.ate ? addDays(fimMes, -1) : EIXO.ate;
    out.push({ rotulo: MESES[Number(d.slice(5, 7)) - 1]!, de: d, ate });
    d = fimMes;
  }
  return out;
}

function segundas() {
  let d = EIXO.de;
  while (diaDaSemana(d) !== 1) d = addDays(d, 1);
  const out: string[] = [];
  for (; d <= EIXO.ate; d = addDays(d, 7)) out.push(d);
  return out;
}

type Dica = { f: Fatia; x: number; y: number };

export function Cronograma({ fatias, todas, hoje, onSelect }: {
  /** Cards visíveis depois dos filtros. */
  fatias: Fatia[];
  /** Todos os cards: identificam as dependências mesmo quando a outra ponta está filtrada, e dão a densidade do módulo. */
  todas: Fatia[];
  hoje: string;
  onSelect: (f: Fatia) => void;
}) {
  const [fechados, setFechados] = useState<Set<string>>(() => new Set());
  // Ocultas por padrão: trabalho que começou antes de a dependência terminar faz a linha voltar e amontoar setas.
  const [conexoes, setConexoes] = useState(false);
  const [dica, setDica] = useState<Dica | null>(null);
  const refEixo = useRef<HTMLDivElement>(null);
  const { w } = useTamanho(refEixo);
  const ids = useMemo(() => new Set(todas.map((f) => f.id)), [todas]);
  const meses = useMemo(faixasDeMes, []);
  const semanas = useMemo(segundas, []);

  const grupos = useMemo(() => MODULOS.map((m) => {
    const fs = fatias.filter((f) => !f.removida && f.moduloId === m.id);
    const itens = [...fs].sort((a, b) => a.id.localeCompare(b.id, "pt-BR", { numeric: true })).map((f) => {
      const s = situacaoCrono(f, hoje);
      return { f, s, b: barra(f, s, hoje), dep: dependencias(f, ids) };
    });
    const doModulo = todas.filter((f) => !f.removida && f.moduloId === m.id).length;
    return { m, itens, feitas: fs.filter((f) => f.concluida).length, doModulo, dens: densidade(m, doModulo) };
  }).filter((g) => g.itens.length > 0), [fatias, todas, hoje, ids]);

  // Posição vertical de cada linha visível, para as conexões de dependência.
  const { centros, alturaCorpo } = useMemo(() => {
    const centros = new Map<string, number>();
    let y = 0;
    for (const g of grupos) {
      y += ALTURA_GRUPO;
      if (fechados.has(g.m.id)) continue;
      for (const i of g.itens) { centros.set(i.f.id, y + ALTURA_LINHA / 2); y += ALTURA_LINHA; }
    }
    return { centros, alturaCorpo: y };
  }, [grupos, fechados]);

  const itensPorId = new Map(grupos.flatMap((g) => g.itens).map((i) => [i.f.id, i]));
  const px = (d: string) => (pct(d) / 100) * w;
  const linhas = conexoes && w > 0
    ? [...itensPorId.values()].flatMap((alvo) => alvo.dep.refs.flatMap((id) => {
        const origem = itensPorId.get(id);
        const y1 = centros.get(id), y2 = centros.get(alvo.f.id);
        if (!origem?.b || !alvo.b || y1 === undefined || y2 === undefined) return [];
        const x1 = px(origem.b.ate), x2 = px(alvo.b.de) - 2;
        return [{ chave: `${id}>${alvo.f.id}`, d: `M${x1} ${y1} H${x1 + 6} V${y2} H${x2}` }];
      }))
    : [];

  const alternar = (id: string) =>
    setFechados((s) => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  const hojeNoEixo = dentro(hoje);
  const total = grupos.reduce((s, g) => s + g.itens.length, 0);

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <span className="label">Cronograma · {total} cards</span>
        <div className="flex items-center gap-4 text-xs text-text-2">
          <button onClick={() => setFechados(new Set())} className="hover:text-text">expandir tudo</button>
          <button onClick={() => setFechados(new Set(grupos.map((g) => g.m.id)))} className="hover:text-text">recolher tudo</button>
          <label className="flex cursor-pointer items-center gap-2">
            <input type="checkbox" checked={conexoes} onChange={(e) => setConexoes(e.target.checked)} className="accent-[var(--bu-teal)]" />
            dependências
          </label>
        </div>
      </div>

      <div className="max-h-[75vh] overflow-auto rounded-xl border border-line bg-surface select-none">
        <div className="relative" style={{ minWidth: COLUNA_NOME + 900 }}>
          {/* Eixo: fixo ao rolar na vertical; a coluna de nomes fica fixa ao rolar na horizontal. */}
          <div className="sticky top-0 z-30 grid border-b border-line bg-surface" style={{ gridTemplateColumns: `${COLUNA_NOME}px 1fr` }}>
            <div className="sticky left-0 z-10 flex items-end border-r border-line-soft bg-surface px-4 pb-2">
              <span className="label">Módulo · card</span>
            </div>
            <div className="relative h-[60px]">
              {meses.map((m, i) => (
                <div key={m.de} className={`absolute top-0 flex h-5 items-center px-2 text-[11px] font-medium capitalize text-text-2 ${i ? "border-l border-line" : ""}`}
                  style={{ left: `${pct(m.de)}%`, width: `${pct(m.ate) - pct(m.de)}%` }}>
                  {m.rotulo}
                </div>
              ))}
              {semanas.map((s) => (
                <span key={s} className="absolute top-5 flex h-[18px] -translate-x-1/2 items-center font-mono text-[10px] text-text-3" style={{ left: `${pct(s)}%` }}>
                  {fmt(s)}
                </span>
              ))}
              <div className="absolute inset-x-0 top-[38px] h-[22px] border-t border-line-soft">
                {PILOTO_NO_EIXO && <span className="absolute top-1 -translate-x-1/2 font-mono text-[10px] text-green" style={{ left: `${(pct(PILOTO.de) + pct(PILOTO.ate)) / 2}%` }}>piloto</span>}
                {MARCOS_EIXO.map((m) => (
                  // No fim do eixo o rótulo encosta à esquerda da linha, para não ser cortado.
                  <span key={m} className={`absolute top-1 ${pct(m) > 97 ? "-translate-x-full pr-1" : "-translate-x-1/2"} font-mono text-[10px] ${m === MVP ? "font-semibold text-danger" : "text-text-3"}`}
                    style={{ left: `${pct(m)}%` }}>
                    {m === MVP ? "MVP" : MODULOS.filter((x) => x.fim === m).map((x) => x.id).join(" ")}
                  </span>
                ))}
              </div>
              {/* Na faixa dos meses, dentro do eixo: embaixo cobria a primeira linha. */}
              {hojeNoEixo && (
                <span className="absolute top-0.5 z-10 -translate-x-1/2 rounded-sm bg-warn px-1 font-mono text-[10px] font-semibold leading-4 text-bg"
                  style={{ left: `${pct(hoje)}%` }}>
                  hoje {fmt(hoje)}
                </span>
              )}
            </div>
          </div>

          <div className="relative">
            {/* Camada de fundo: piloto, fins de módulo, MVP e hoje atravessam todas as linhas. */}
            <div ref={refEixo} className="pointer-events-none absolute inset-y-0 right-0" style={{ left: COLUNA_NOME }}>
              {PILOTO_NO_EIXO && <div className="absolute inset-y-0 bg-green/8" style={{ left: `${pct(PILOTO.de)}%`, right: `${100 - pct(PILOTO.ate)}%` }} />}
              {MARCOS_EIXO.map((m) => (
                <div key={m} className={`absolute inset-y-0 ${m === MVP ? "w-px bg-danger" : "border-l border-dashed border-line"}`} style={{ left: `${pct(m)}%` }} />
              ))}
              {hojeNoEixo && <div className="absolute inset-y-0 w-px bg-warn" style={{ left: `${pct(hoje)}%` }} />}
            </div>

            {grupos.map(({ m, itens, feitas, doModulo, dens }, gi) => {
              const aberto = !fechados.has(m.id);
              return (
                <div key={m.id}>
                  <div className={`relative grid bg-surface-2/60 ${gi ? "border-t border-line" : ""}`} style={{ gridTemplateColumns: `${COLUNA_NOME}px 1fr`, height: ALTURA_GRUPO }}>
                    <button onClick={() => alternar(m.id)} aria-expanded={aberto}
                      className="sticky left-0 z-10 flex min-w-0 items-center gap-2 border-r border-line-soft bg-surface-2 px-3 text-left">
                      <ChevronRight className={`h-3.5 w-3.5 shrink-0 text-text-3 ${aberto ? "rotate-90" : ""}`} aria-hidden />
                      <span className="w-6 shrink-0 font-mono text-xs text-text-2">{m.id}</span>
                      <span className={`truncate text-sm font-semibold ${m.id === "SM" ? "text-warn" : ""}`}>{m.nome}</span>
                      <span className="ml-auto font-mono text-xs text-text-2">{feitas}/{itens.length}</span>
                    </button>
                    <div className="relative">
                      <BarraModulo m={m} cards={doModulo} dens={dens} />
                    </div>
                  </div>
                  {aberto && itens.map(({ f, s, b, dep }) => (
                    <div key={f.id} className="group relative grid cursor-pointer border-t border-line-soft hover:bg-surface-2/40"
                      style={{ gridTemplateColumns: `${COLUNA_NOME}px 1fr`, height: ALTURA_LINHA }}
                      onClick={() => onSelect(f)}
                      onMouseMove={(e) => setDica({ f, x: e.clientX, y: e.clientY })}
                      onMouseLeave={() => setDica(null)}>
                      <div className="sticky left-0 z-10 flex min-w-0 items-center gap-2 border-r border-line-soft bg-surface pl-9 pr-4 group-hover:bg-surface-2">
                        <span className="w-12 shrink-0 font-mono text-xs" style={{ color: s === "a_fazer" ? "var(--bu-text-2)" : SITUACAO[s].cor }}>{f.id}</span>
                        <span className="truncate text-sm">{f.nome}</span>
                      </div>
                      <div className="relative">
                        {b && dep.externo && (
                          // No início da barra; quando a barra começa colada ao início do eixo, não cabe à esquerda e vai para depois do prazo.
                          <span className="absolute top-1/2 -translate-y-1/2 whitespace-nowrap rounded-full border border-line bg-surface-2 px-1.5 text-[10px] leading-4 text-text-2"
                            style={pct(b.de) > 12
                              ? { right: `calc(${100 - pct(b.de)}% + 6px)` }
                              : { left: `calc(${Math.max(pct(b.ate), f.marco ? pct(f.marco) : 0)}% + 8px)` }}>
                            {dep.externo}
                          </span>
                        )}
                        {b ? (
                          <Barra s={s} de={b.de} ate={b.ate} />
                        ) : (
                          <span className={`absolute top-1/2 -translate-y-1/2 font-mono text-[10px] ${f.marco ? "text-warn" : "text-text-3"}`}
                            style={{ left: `calc(${pct(INICIO_DELIVERY)}% + 4px)` }}>
                            {f.marco ? "após 10/11 · a redistribuir" : "sem data de módulo"}
                          </span>
                        )}
                        {f.marco && f.marco <= END && (
                          <div className="absolute top-1 h-[18px] w-0.5 -translate-x-1/2 rounded-full" style={{ left: `${pct(f.marco)}%`, background: corPrazo(f.marco, f, hoje) }} />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              );
            })}

            {linhas.length > 0 && (
              <svg className="pointer-events-none absolute top-0 z-[5]" style={{ left: COLUNA_NOME }} width={w} height={alturaCorpo} aria-hidden>
                <defs>
                  <marker id="seta-dep" viewBox="0 0 6 6" refX="5" refY="3" markerWidth="6" markerHeight="6" orient="auto">
                    <path d="M0 0L6 3L0 6z" fill="var(--bu-text-3)" />
                  </marker>
                </defs>
                {linhas.map((l) => <path key={l.chave} d={l.d} fill="none" stroke="var(--bu-text-3)" strokeWidth={1} markerEnd="url(#seta-dep)" />)}
              </svg>
            )}

            {!total && <p className="px-4 py-6 text-center text-sm text-text-3">Nenhum card com esses filtros.</p>}
          </div>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-text-2">
        <span className="flex items-center gap-1.5"><span className="h-3 w-5 rounded-sm border border-text-3/60 bg-text-2/15" />Janela do módulo</span>
        {/* Só quando algum módulo cai depois do prazo; com as janelas comprimidas até 10/11, nenhum cai. */}
        {MODULOS.some((m) => rotuloJanela(m)) && (
          <span className="flex items-center gap-1.5"><span className="h-3 w-5 rounded-sm border border-warn/60 bg-warn/10" />Fora da janela atual ou a redistribuir</span>
        )}
        <span className="h-3 w-px bg-line" />
        <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-green" />Concluído</span>
        <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-warn" />Em andamento</span>
        <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full border border-dashed border-text-3" />A fazer</span>
        <span className="h-3 w-px bg-line" />
        <span className="flex items-center gap-1.5"><span className="h-3 w-0.5 rounded-full bg-text-3" />Fim do módulo</span>
        <span className="flex items-center gap-1.5"><span className="h-3 w-px bg-danger" />MVP</span>
        <span className="flex items-center gap-1.5"><span className="h-3 w-px bg-warn" />Hoje</span>
        <span className="text-text-3">Card a fazer ocupa a janela do módulo: não tem data própria.</span>
      </div>

      {dica && <DicaEntrega {...dica} hoje={hoje} ids={ids} />}
    </div>
  );
}

/**
 * Barra larga do módulo, do início ao fim planejado. Depois de 10/11 fica em --warn, com o rótulo neutro
 * "fora da janela atual": a distribuição entre os dois desenvolvedores ainda não está nas estimativas.
 */
function BarraModulo({ m, cards, dens }: { m: Modulo; cards: number; dens: number | null }) {
  if (!m.inicio || !m.fim) {
    const sem = SEM_DATA[m.id] ?? { rotulo: "sem data", cor: "text-text-2" };
    return (
      <>
        <div className="absolute top-1/2 h-4 -translate-y-1/2 rounded-sm border border-dashed border-text-3/70" style={{ left: `${pct(INICIO_DELIVERY)}%`, right: "1%" }} />
        <span className={`absolute top-1/2 -translate-y-1/2 bg-surface-2 px-1.5 font-mono text-[10px] ${sem.cor}`} style={{ left: `calc(${pct(INICIO_DELIVERY)}% + 8px)` }}>
          {sem.rotulo} · {cards} card{cards === 1 ? "" : "s"}
        </span>
      </>
    );
  }
  // Começa depois do fim do eixo (M5, M6): sem barra, só a marcação em --warn.
  if (m.inicio > END) {
    return (
      <span className="absolute top-1/2 -translate-y-1/2 rounded-sm border border-dashed border-warn/60 bg-warn/10 px-1.5 font-mono text-[10px] text-warn"
        style={{ right: "1%" }} title={`${m.id} · ${m.nome} · ${periodo(m.inicio, m.fim)}`}>
        após 10/11 · a redistribuir · {m.semanas} sem · {periodo(m.inicio, m.fim)} · {cards} card{cards === 1 ? "" : "s"}
      </span>
    );
  }
  const fora = rotuloJanela(m) !== null;
  const esq = pct(m.inicio), dir = pct(addDays(m.fim, 1));
  // Perto do fim do eixo, o texto que vem depois da barra passa para antes dela.
  const depois = dir < 78;
  return (
    <>
      <div className={`absolute top-1/2 flex h-4 -translate-y-1/2 items-center overflow-hidden rounded-sm border px-1.5 font-mono text-[10px] ${fora ? "border-warn/60 bg-warn/10 text-warn" : "border-text-3/60 bg-text-2/15 text-text"}`}
        style={{ left: `${esq}%`, width: `${dir - esq}%` }} title={`${m.id} · ${m.nome} · ${periodo(m.inicio, m.fim)}`}>
        <span className="whitespace-nowrap">{m.semanas} sem</span>
      </div>
      <span className="absolute top-1/2 -translate-y-1/2 whitespace-nowrap font-mono text-[10px] text-text-3"
        style={depois ? { left: `calc(${dir}% + 6px)` } : { right: `calc(${100 - esq}% + 6px)` }}>
        {periodo(m.inicio, m.fim)} · <span className={dens !== null && dens > DENSIDADE_ALTA ? "text-warn" : ""}>{dens === null ? "—" : n1(dens)} cards/sem</span>
        {fora && <span className="text-warn"> · {rotuloJanela(m)}</span>}
      </span>
    </>
  );
}

/** Fim do módulo futuro em cinza; já passado, verde se o card foi concluído e vermelho se não. */
const corPrazo = (marco: string, f: Fatia, hoje: string) =>
  marco >= hoje ? "var(--bu-text-3)" : f.concluida ? "var(--bu-green)" : "var(--bu-danger)";

/** Concluído fecha nas duas pontas; em andamento se dissolve à direita, porque o trabalho continua. */
function Barra({ s, de, ate }: { s: SituacaoCrono; de: string; ate: string }) {
  const posicao = { left: `${pct(de)}%`, width: `max(4px, ${pct(ate) - pct(de)}%)` };
  const base = "absolute top-1/2 h-3 -translate-y-1/2";
  if (s === "a_fazer") return <div className={`${base} rounded-sm border border-dashed border-text-3`} style={posicao} />;
  if (s === "concluida") return <div className={`${base} rounded-sm bg-green`} style={posicao} />;
  const cor = SITUACAO[s].cor;
  return <div className={`${base} rounded-l-sm`} style={{ ...posicao, background: `linear-gradient(90deg, ${cor} calc(100% - 12px), transparent)` }} />;
}

function DicaEntrega({ f, x, y, hoje, ids }: Dica & { hoje: string; ids: Set<string> }) {
  const s = situacaoCrono(f, hoje);
  // Perto da borda direita, a dica abre para a esquerda do cursor.
  const esquerda = typeof window !== "undefined" && x > window.innerWidth - 300;
  const { refs, externo } = dependencias(f, ids);
  return (
    <div className="pointer-events-none fixed z-50 w-[280px] rounded-lg border border-line bg-surface-2 px-3 py-2 text-xs"
      style={{ top: y + 14, left: esquerda ? x - 294 : x + 14 }}>
      <div className="font-mono text-text-2">{f.id}</div>
      <div className="mt-0.5 text-sm text-text">{f.nome}</div>
      <div className="mt-2 grid grid-cols-[auto_1fr] gap-x-4 gap-y-0.5 font-mono">
        <span className="text-text-3">situação</span><span style={{ color: SITUACAO[s].cor }}>{SITUACAO[s].rotulo}</span>
        <span className="text-text-3">módulo</span><span className="text-text">{f.moduloId}</span>
        <span className="text-text-3">prazo</span><span className="text-text">{f.marco ? `${fmt(f.marco)} · fim do módulo` : "sem data"}</span>
        <span className="text-text-3">critérios</span><span className="text-text">{f.criteriosAceite}</span>
        <span className="text-text-3">depende de</span><span className="text-text">{[...refs, externo].filter(Boolean).join(", ") || "—"}</span>
      </div>
    </div>
  );
}

/** Detalhe do card, aberto pela lista e pelo cronograma. Fecha com ESC ou clicando fora. */
export function PainelEntrega({ f, hoje, onClose }: { f: Fatia; hoje: string; onClose: () => void }) {
  useEffect(() => {
    const tecla = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", tecla);
    return () => window.removeEventListener("keydown", tecla);
  }, [onClose]);
  const estado = ESTADOS.find((x) => x.v === estadoDe(f)) ?? ESTADOS[0];
  const s = situacaoCrono(f, hoje);
  const fora = !f.removida && s === "fora_janela";
  const m = moduloDe(f.moduloId);
  const obs = observacaoVisivel(f.observacao);
  const campos: [string, string][] = [
    ["Módulo", m ? `${m.id} · ${m.nome}` : f.moduloId],
    ["Frente", f.epico],
    ["Critérios de aceite", String(f.criteriosAceite)],
    ["Entrou no escopo", fmt(f.entradaEscopo)],
    ["Iniciado", fmt(f.iniciada)],
    ["Prazo", f.marco ? `${fmt(f.marco)} · fim do módulo` : "sem data de módulo"],
    ["Concluído", fmt(f.concluida)],
    ["Depende de", f.dependeDe ?? "—"],
    ...(f.removida ? [["Removido", fmt(f.removida)] as [string, string]] : []),
  ];
  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label={`Card ${f.id}`}>
      <div className="absolute inset-0 bg-bg/60" onClick={onClose} />
      <aside className="absolute inset-y-0 right-0 w-[380px] max-w-full overflow-y-auto border-l border-line bg-surface p-5">
        <div className="flex items-center justify-between">
          <span className="font-mono text-xs text-text-2">{f.id}</span>
          <button onClick={onClose} aria-label="Fechar" className="rounded-md border border-line p-1.5 text-text-2 transition-colors duration-150 hover:text-text">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
        <h2 className="mt-2 text-xl font-semibold leading-snug">{f.nome}</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          <span className="rounded-full px-2.5 py-0.5 text-xs font-medium"
            style={{ color: fora ? "var(--bu-danger)" : estado.color, background: `color-mix(in srgb, ${fora ? "var(--bu-danger)" : estado.color} 12%, transparent)` }}>
            {fora ? "Fora da janela atual" : estado.label}
          </span>
          <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${FASE[f.fase].classe}`} title={FASE[f.fase].dica}>{FASE[f.fase].rotulo}</span>
          <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${AREA[f.area].classe}`} title={AREA[f.area].dica}>{AREA[f.area].rotulo}</span>
        </div>
        <dl className="mt-5 border-t border-line">
          {campos.map(([k, v]) => (
            <div key={k} className="flex items-baseline justify-between gap-4 border-b border-line-soft py-2">
              <dt className="label shrink-0">{k}</dt>
              <dd className={`text-right text-sm ${/^[\d—]/.test(v) ? "font-mono text-xs" : ""}`}>{v}</dd>
            </div>
          ))}
        </dl>
        {obs && (
          <div className="mt-4">
            <div className="label">Observação</div>
            <p className="mt-1 text-sm text-text-2">{obs}</p>
          </div>
        )}
        {f.origem && <p className="mt-4 text-xs text-text-3">Origem: {f.origem}</p>}
        <p className="mt-2 text-xs text-text-3">Para alterar datas, edite o card em src/data/fatias.ts.</p>
      </aside>
    </div>
  );
}
