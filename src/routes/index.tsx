import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { Hourglass } from "lucide-react";
import {
  Area, CartesianGrid, ComposedChart, Customized, Line, ReferenceDot, ReferenceLine,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { Card, PageHeader } from "@/components/AppNav";
import { numeroSemanaAtual } from "@/lib/semanas";
import {
  BotaoTelaCheia, CartaoNumero, DESTAQUE, pontosDeMedicao, DicaTelaCheia, FaixaAlocacao, FaixaDiscovery, FaseBar, Legend, PrimeiraDobra, Stat, TD, TH,
  eixoY, rotulo, useControleTelaCheia, useTamanho, type Fase,
} from "@/components/painel";
import {
  DEFINICAO, END, ESTIMADOS, INICIO_DELIVERY, MARCOS, MODULOS, MVP, MVP_PRAZO, PILOTO, SEMANAS_ESTIMADAS, START, andamentoAt, delivery, rotuloJanela,
  buildSeries, builtAt, escopoAt, estadoDe, faixaTravada, fmt, moduloAtual, periodo, planejadoAt, situacaoGrupo, todayISO,
  usePersisted, FATIAS, type Fatia,
} from "@/lib/burnup";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Burnup MVP · CRM Ingá Pneus" },
      { name: "description", content: "Burnup do MVP do CRM Ingá Pneus: escopo, planejado por módulo, em andamento e concluído, com o prazo de 10/11." },
      { property: "og:title", content: "Burnup MVP · CRM Ingá Pneus" },
      { property: "og:description", content: "Escopo, planejado, em andamento e concluído do MVP do CRM Ingá Pneus." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: BurnupPage,
});

function BurnupPage() {
  const data = FATIAS;
  const [sel, setSel] = usePersisted<string[]>("bu-modulos", []);
  const today = todayISO();
  const { telaCheia, dica, alternar } = useControleTelaCheia();
  const refGrafico = useRef<HTMLDivElement>(null);
  const { h: alturaGrafico } = useTamanho(refGrafico);
  const fs = sel.length ? data.filter((f) => sel.includes(f.moduloId)) : data;
  const series = useMemo(() => buildSeries(fs, today), [fs, today]);
  const capDay = today > END ? END : today;
  const last = series.find((p) => p.d === capDay);
  const travadaHa = faixaTravada(fs, capDay);
  // Cartões contados em cards, respeitando o filtro de módulo.
  const nCards = escopoAt(fs, END);
  // Concluídos contam só o delivery: os 11 da fundação foram feitos no discovery técnico e aparecem no bloco de selos.
  const nDelivery = escopoAt(delivery(fs), END);
  const built = builtAt(fs, capDay);
  const pct = nDelivery ? Math.round((built / nDelivery) * 100) : 0;
  const atual = moduloAtual(today);
  const cardsDoAtual = data.filter((f) => f.moduloId === atual.id && !f.removida).length;
  const escopoFechado = escopoAt(fs, DEFINICAO.ate);
  // A faixa em andamento só existe a partir do primeiro início; antes disso não desenha nem a borda no zero.
  const primeiroInicio = fs.filter((f) => f.iniciada && !f.removida).map((f) => f.iniciada as string).sort()[0];
  const chartData = useMemo(
    () => series.map((p) => (!primeiroInicio || p.d < primeiroInicio ? { ...p, andamento: null } : p)),
    [series, primeiroInicio],
  );
  const y = eixoY(Math.max(...series.map((p) => p.escopo), 1), alturaGrafico);
  const planejadoRef = series.find((p) => p.d === ROTULO_PLANEJADO);
  const vooHoje = last?.andamento ?? 0;
  // Projetado à distância, traço fino some: 3px em tela cheia.
  const traco = telaCheia ? 3 : 2;
  // Subtítulo descreve o MVP inteiro, sem o filtro de módulo.
  const vigentes = data.filter((f) => !f.removida);
  const planejadoTotal = planejadoAt(fs, END);
  const toggle = (e: string) => setSel(sel.includes(e) ? sel.filter((x) => x !== e) : [...sel, e]);

  return (
    <>
      <PrimeiraDobra telaCheia={telaCheia}>
      <PageHeader
        title="Burnup MVP ·"
        accent="CRM Ingá Pneus"
        subtitle={`Escopo fechado em ${fmt(DEFINICAO.ate)} com ${vigentes.length} cards. Roadmap acordado em 24/09: ${ESTIMADOS.length} módulos estimados em ${SEMANAS_ESTIMADAS} semanas a partir de ${fmt(INICIO_DELIVERY)}, mais bloqueios em paralelo e cards a alocar. Prazo do MVP em ${fmt(MVP)}; piloto de ${fmt(PILOTO.de)} a ${fmt(PILOTO.ate)}.`}
      />

      <div className="mb-4 grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-5">
        <Stat label="Cards no escopo" value={String(nCards)} note={`${nDelivery} no delivery · ${nCards - nDelivery} de discovery`} />
        <Stat label="Em andamento" value={String(andamentoAt(fs, capDay))} tone="warn" note={`semana ${numeroSemanaAtual(today)}`} />
        <Stat label="Concluídos no delivery" value={`${built} de ${nDelivery}`} tone="green" note={`${pct}% do delivery`} />
        {/* Entre dois módulos, ou antes do primeiro, o atual é o próximo a começar. */}
        <Stat label="Módulo atual" value={atual.id} tone="cyan"
          note={today < atual.inicio ? `${atual.nome} · começa ${fmt(atual.inicio)}` : `${atual.nome} · ${periodo(atual.inicio, atual.fim)} · ${cardsDoAtual} cards`} />
        <ContagemMvp />
      </div>
      <FaixaAlocacao />

      <Card className="flex min-h-[420px] flex-1 flex-col p-5">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <span className="label">Burnup · cards</span>
          <div className="flex flex-wrap items-center gap-4 text-xs text-text-2">
            <Legend color="var(--bu-cyan)" label="Escopo" />
            <Legend color="var(--bu-text-3)" label="Planejado" dashed />
            <Legend color="var(--bu-green)" label="Concluído" />
            <Legend color="var(--bu-warn)" label="Em andamento" />
            <BotaoTelaCheia telaCheia={telaCheia} onClick={alternar} />
          </div>
        </div>
        {/* A área cresce com o cartão; o ResponsiveContainer mede a camada absoluta, que tem altura definida
            (um filho de flex não tem, e o 100% colapsaria). */}
        <div ref={refGrafico} className="relative min-h-0 flex-1">
          <div className="absolute inset-0">
          <ResponsiveContainer width="100%" height="100%">
            {/* Margem direita maior: o prazo do MVP é o último ponto do eixo e o rótulo dele precisa caber. */}
            <ComposedChart data={chartData} margin={{ top: 24, right: 52, left: 8, bottom: 22 }}>
              <defs>
                <linearGradient id="gBuilt" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--bu-green)" stopOpacity={0.22} />
                  <stop offset="100%" stopColor="var(--bu-green)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} stroke="var(--bu-border-soft)" />
              <XAxis
                dataKey="d" type="category" tickFormatter={fmt} ticks={telaCheia ? TICKS_X_AMPLO : TICKS_X} interval={0}
                tick={{ fill: "var(--bu-text-3)", fontSize: 11, fontFamily: "JetBrains Mono" }}
                axisLine={{ stroke: "var(--bu-border)" }} tickLine={false} tickMargin={6} height={30}
              />
              <YAxis
                allowDecimals={false} domain={[0, y.topo]} ticks={y.ticks}
                tick={{ fill: "var(--bu-text-3)", fontSize: 11, fontFamily: "JetBrains Mono" }}
                axisLine={false} tickLine={false}
                label={{ value: "cards", angle: -90, position: "insideLeft", offset: -2, fill: "var(--bu-text-3)", fontSize: 10, fontFamily: "JetBrains Mono", style: { textAnchor: "middle" } }}
              />
              <Tooltip content={<ChartTip />} cursor={{ stroke: "var(--bu-border)" }} />
              <ReferenceLine x={DEFINICAO.ate} stroke="var(--bu-cyan)" strokeOpacity={0.35} strokeDasharray="2 4" />
              <Customized component={<FaseBar fases={FASES} />} />
              {/* Fim de cada módulo: é onde a curva de planejado sobe. */}
              {MARCOS.filter((m) => m !== MVP && m <= END).map((m) => (
                <ReferenceLine key={m} x={m} stroke="var(--bu-border)" strokeDasharray="4 4"
                  label={{ value: ESTIMADOS.filter((x) => x.fim === m).map((x) => x.id).join(" "), position: "insideBottomLeft", offset: 6, fill: "var(--bu-text-3)", fontSize: 10, fontFamily: "JetBrains Mono" }} />
              ))}
              <ReferenceLine x={MVP} stroke="var(--bu-danger)" strokeWidth={2}
                label={{ value: "MVP PRONTO", position: "top", fill: "var(--bu-danger)", fontSize: 11, fontWeight: 600, fontFamily: "JetBrains Mono" }} />
              {today >= START && today <= END && (
                <ReferenceLine x={today} stroke="var(--bu-warn)"
                  label={{ value: `hoje ${fmt(today)}`, position: "top", fill: "var(--bu-warn)", fontSize: 11, fontFamily: "JetBrains Mono" }} />
              )}
              {/* Em andamento empilhado sobre o construído: a espessura da faixa é o trabalho em voo.
                  As áreas vêm antes das linhas para que escopo e planejado fiquem por cima. */}
              {/* Degraus: início e conclusão são eventos de um dia, a faixa começa e termina nas datas exatas. */}
              {/* Monotone: suaviza sem ondular, então nenhuma série sobe e desce sem motivo. Os círculos marcam a medição. */}
              <Area dataKey="construido" stackId="feito" type="monotone" stroke="var(--bu-green)" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" fill="url(#gBuilt)" isAnimationActive={false}
                dot={pontosDeMedicao(chartData.map((p) => p.construido), "var(--bu-green-glow)")} activeDot={false} />
              <Area dataKey="andamento" stackId="feito" type="monotone" stroke="var(--bu-warn)" strokeWidth={traco} strokeLinecap="round" strokeLinejoin="round" fill="var(--bu-warn)" fillOpacity={0.22} isAnimationActive={false}
                dot={pontosDeMedicao(chartData.map((p) => p.andamento), "var(--bu-warn)")} activeDot={false} />
              <Line dataKey="escopo" type="monotone" stroke="var(--bu-cyan)" strokeWidth={traco} strokeLinecap="round" strokeLinejoin="round" isAnimationActive={false}
                dot={pontosDeMedicao(chartData.map((p) => p.escopo), "var(--bu-cyan)")} activeDot={false} />
              <Line dataKey="planejado" type="monotone" stroke="var(--bu-text-3)" strokeWidth={traco} strokeDasharray="6 4" strokeLinecap="round" strokeLinejoin="round" isAnimationActive={false}
                dot={pontosDeMedicao(chartData.map((p) => p.planejado), "var(--bu-text-3)")} activeDot={false} />
              {/* Rótulos permanentes: o gráfico precisa ser legível numa captura, sem tooltip. */}
              {DEFINICAO.ate >= START && (
                <ReferenceDot x={DEFINICAO.ate} y={escopoFechado} r={0}
                  label={rotulo(`Escopo · ${escopoFechado}`, "var(--bu-cyan)", { dx: 8, dy: 16 })} />
              )}
              {planejadoRef && planejadoRef.planejado !== null && (
                <ReferenceDot x={planejadoRef.d} y={planejadoRef.planejado} r={0}
                  label={rotulo(`Planejado até ${fmt(END)} · ${planejadoTotal}`, "var(--bu-text-2)", { anchor: "start", dx: 6, dy: -8 })} />
              )}
              {/* Sem fragmentos: o recharts 2 ignora filhos dentro de <>...</>. */}
              {last && vooHoje > 0 && (
                <ReferenceDot x={last.d} y={(last.construido ?? 0) + vooHoje} r={0}
                  label={rotulo(`Em andamento · ${vooHoje}`, "var(--bu-warn)", { dx: 10, dy: 4 })} />
              )}
              {last && last.construido !== null && (
                <ReferenceDot x={START} y={last.construido} r={0}
                  label={rotulo(`Concluído · ${last.construido}`, "var(--bu-green)", { dx: 4, dy: -8 })} />
              )}
              {last && last.construido !== null && (
                <ReferenceDot x={last.d} y={last.construido} r={9} fill="var(--bu-green)" fillOpacity={0.2} stroke="none" />
              )}
            </ComposedChart>
          </ResponsiveContainer>
          </div>
        </div>
      </Card>
      </PrimeiraDobra>
      <DicaTelaCheia visivel={dica} telaCheia={telaCheia} />

      {!telaCheia && (
      <>
      <FaixaDiscovery />
      <EmAndamentoAgora fatias={data} />
      <EscopoPorModulo fatias={data} today={today} />

      <Card className="mb-4 p-5">
        <span className="label">Como ler a faixa em andamento</span>
        <div className="mt-3 grid gap-4 md:grid-cols-3">
          {LEITURAS.map(([titulo, texto]) => (
            <div key={titulo}>
              <div className="text-sm font-semibold text-text">{titulo}</div>
              <p className="mt-1 text-sm text-text-2">{texto}</p>
            </div>
          ))}
        </div>
        {travadaHa !== null && (
          <div className="mt-4 rounded-lg border border-warn/40 bg-warn/10 px-3 py-2 text-sm text-warn">
            A faixa em andamento cresce sem entregas há {travadaHa} dia{travadaHa > 1 ? "s" : ""}: trabalho entrando em andamento sem sair.
          </div>
        )}
      </Card>

      <div className="flex flex-wrap items-center gap-2">
        <span className="label mr-2">Módulos</span>
        {MODULOS.map((m) => {
          const on = sel.includes(m.id);
          return (
            <button
              key={m.id}
              onClick={() => toggle(m.id)}
              className={`rounded-full border px-3 py-1 text-xs transition-colors duration-150 ${
                on ? "border-teal bg-teal/15 text-text" : "border-line text-text-2 hover:text-text"
              }`}
            >
              <span className="font-mono">{m.id}</span> {m.nome}
            </button>
          );
        })}
        {sel.length > 0 && (
          <button onClick={() => setSel([])} className="px-2 text-xs text-text-3 hover:text-text-2">limpar</button>
        )}
      </div>
      </>
      )}
    </>
  );
}

/** Só datas com significado: a primeira entrada no escopo, o fechamento, o início do delivery e os fins de módulo. Hoje e 10/11 têm linha própria. */
const TICKS_X = ["2026-09-02", DEFINICAO.ate, INICIO_DELIVERY, "2026-10-09", "2026-10-16", "2026-11-06"];
/** Em tela cheia cabe mais: as datas de entrada no escopo entram. */
const TICKS_X_AMPLO = ["2026-09-02", "2026-09-08", "2026-09-11", "2026-09-15", DEFINICAO.ate, INICIO_DELIVERY, "2026-10-09", "2026-10-16", "2026-11-06"];
// No degrau de M2 (16/10) sobra altura entre o planejado e o escopo para o rótulo.
const ROTULO_PLANEJADO = "2026-10-16";

const FASES: Fase[] = [
  // A divisão cai em 17/09, onde a linha de escopo para de subir.
  { de: START, ate: DEFINICAO.ate, rotulo: "DISCOVERY", cor: "var(--bu-cyan)" },
  { de: DEFINICAO.ate, ate: END, rotulo: "DELIVERY", cor: "var(--bu-green)" },
];

const LEITURAS = [
  ["Faixa fina, verde subindo", "Fluxo saudável. O que começa termina."],
  ["Faixa engrossando, verde parada", "Trabalho entrando em andamento sem sair. Indica bloqueio, não lentidão."],
  ["Faixa larga e estável", "Trabalho demais aberto ao mesmo tempo. Vale fechar antes de abrir."],
] as const;

/** Cards no caminho crítico do piloto, destacados na tabela de em andamento. */
const CRITICAS = new Set(["B01", "B04", "B05", "D01", "D02", "D04"]);

function EmAndamentoAgora({ fatias }: { fatias: Fatia[] }) {
  const voo = fatias.filter((f) => estadoDe(f) === "em_andamento").sort((a, b) => (a.marco ?? "9999").localeCompare(b.marco ?? "9999") || a.id.localeCompare(b.id));
  return (
    <Card className="mb-4 overflow-x-auto">
      <div className="px-5 pt-4"><span className="label">Em andamento agora · {voo.length}</span></div>
      <table className="mt-2 w-full text-sm">
        <thead>
          <tr className="border-b border-line text-left">
            {["Id", "Card", "Módulo", "Frente", "Prazo", "Depende de"].map((h) => <th key={h} className={TH}>{h}</th>)}
          </tr>
        </thead>
        <tbody>
          {voo.map((f) => (
            <tr key={f.id} className="border-t border-line-soft"
              style={CRITICAS.has(f.id) ? { background: "color-mix(in srgb, var(--bu-danger) 8%, transparent)" } : undefined}>
              <td className={`${TD} font-mono text-xs text-warn`}>{f.id}</td>
              <td className={TD}>{f.nome}</td>
              <td className={`${TD} font-mono text-xs text-text-2`}>{f.moduloId}</td>
              <td className={`${TD} text-text-2`}>{f.epico}</td>
              <td className={`${TD} font-mono text-xs text-text-2`}>{fmt(f.marco)}</td>
              <td className={`${TD} text-text-2`}>{f.dependeDe ?? "—"}</td>
            </tr>
          ))}
          {!voo.length && (
            <tr><td colSpan={6} className={`${TD} py-3 text-text-3`}>Nenhum card em andamento.</td></tr>
          )}
        </tbody>
      </table>
    </Card>
  );
}

function EscopoPorModulo({ fatias, today }: { fatias: Fatia[]; today: string }) {
  const vigentes = fatias.filter((f) => !f.removida);
  const grupos = MODULOS.map((m) => {
    const fs = vigentes.filter((f) => f.moduloId === m.id);
    return {
      m,
      cards: fs.length,
      voo: fs.filter((f) => estadoDe(f) === "em_andamento").length,
      // Concluídos do delivery: os cards da fundação feitos no discovery ficam no bloco de selos.
      feitas: delivery(fs).filter((f) => f.concluida).length,
      situacao: situacaoGrupo(fs, fatias, today),
    };
  }).filter((g) => g.cards > 0);
  const soma = (k: "cards" | "voo" | "feitas") => grupos.reduce((s, g) => s + g[k], 0);
  const num = `${TD} font-mono text-xs`;
  return (
    <Card className="mb-4 overflow-x-auto">
      <div className="px-5 pt-4"><span className="label">Escopo por módulo</span></div>
      <table className="mt-2 w-full text-sm">
        <thead>
          <tr className="border-b border-line text-left">
            {["Módulo", "Cards", "Em andamento", "Concluídos no delivery", "Janela", "Situação"].map((h) => <th key={h} className={TH}>{h}</th>)}
          </tr>
        </thead>
        <tbody>
          {grupos.map(({ m, ...g }) => (
            <tr key={m.id} className="border-t border-line-soft">
              <td className={TD}><span className="mr-2 font-mono text-xs text-text-2">{m.id}</span>{m.nome}</td>
              <td className={num}>{g.cards}</td>
              <td className={`${num} ${g.voo ? "text-warn" : "text-text-3"}`}>{g.voo}</td>
              <td className={`${num} ${g.feitas ? "text-green" : "text-text-3"}`}>{g.feitas}</td>
              <td className={`${num} text-text-2`}>
                {m.inicio && m.fim ? periodo(m.inicio, m.fim) : m.id === "BL" ? "em paralelo" : m.id === "SM" ? "a alocar" : "a estimar"}
                {rotuloJanela(m) && <span className="ml-2 font-sans text-warn">{rotuloJanela(m)}</span>}
              </td>
              <td className={`${TD} text-text-2`}>{g.situacao}</td>
            </tr>
          ))}
          <tr className="border-t border-line font-semibold">
            <td className={TD}>Total</td>
            <td className={num}>{soma("cards")}</td>
            <td className={`${num} text-warn`}>{soma("voo")}</td>
            <td className={`${num} text-green`}>{soma("feitas")}</td>
            <td className={`${num} text-text-2`}>{periodo(INICIO_DELIVERY, ESTIMADOS.at(-1)!.fim)}</td>
            <td className={TD} />
          </tr>
        </tbody>
      </table>
    </Card>
  );
}

const dois = (n: number) => String(n).padStart(2, "0");

/**
 * Contagem regressiva até o prazo do MVP. Único cartão com borda colorida.
 * Só calcula no cliente: o servidor não conhece o relógio do navegador e a hidratação divergiria.
 */
function ContagemMvp() {
  const [agora, setAgora] = useState<number | null>(null);
  useEffect(() => {
    setAgora(Date.now());
    const id = setInterval(() => setAgora(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  const resta = agora === null ? null : Math.max(0, Math.floor((MVP_PRAZO - agora) / 1000));
  return (
    <CartaoNumero
      label="Prazo do MVP"
      icon={<Hourglass className="h-3.5 w-3.5 text-danger" aria-hidden />}
      note={`até ${fmt(MVP)}`}
      className={DESTAQUE}
    >
      {resta === 0 ? (
        <span className="whitespace-nowrap text-xl text-danger">PRAZO ATINGIDO</span>
      ) : resta === null ? (
        <span className="text-xl text-danger opacity-40">—</span>
      ) : (
        // Uma linha só: 20px, pares colados; em tela estreita o espaço entre pares encolhe antes de qualquer quebra.
        <span className="flex gap-x-2 whitespace-nowrap text-xl text-danger max-sm:gap-x-1 max-sm:text-base">
          <span>{Math.floor(resta / 86400)}d</span>
          <span>{dois(Math.floor(resta / 3600) % 24)}h</span>
          <span>{dois(Math.floor(resta / 60) % 60)}m</span>
          <span className="opacity-60">{dois(resta % 60)}s</span>
        </span>
      )}
    </CartaoNumero>
  );
}

type TipProps = { active?: boolean; label?: string; payload?: { dataKey: string; value: number | null }[] };
function ChartTip({ active, label, payload }: TipProps) {
  if (!active || !payload?.length) return null;
  const get = (k: string) => payload.find((p) => p.dataKey === k)?.value;
  const rows = [
    ["Escopo", get("escopo"), "var(--bu-cyan)"],
    ["Planejado", get("planejado"), "var(--bu-text-2)"],
    ["Concluído", get("construido"), "var(--bu-green)"],
    ["Em andamento", get("andamento"), "var(--bu-warn)"],
  ] as const;
  return (
    <div className="rounded-lg border border-line bg-surface-2 px-3 py-2 font-mono text-xs">
      <div className="mb-1 text-text-2">{label ? `${label.slice(8)}/${label.slice(5, 7)}/${label.slice(0, 4)}` : ""}</div>
      {rows.map(([n, v, c]) => (
        <div key={n} className="flex justify-between gap-6">
          <span style={{ color: c }}>{n}</span>
          <span className="text-text">{v ?? "—"}</span>
        </div>
      ))}
    </div>
  );
}
