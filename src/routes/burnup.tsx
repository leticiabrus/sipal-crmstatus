import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useRef } from "react";
import {
  Area, CartesianGrid, ComposedChart, Customized, Line, ReferenceDot, ReferenceLine,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { Card, PageHeader } from "@/components/AppNav";
import {
  BotaoTelaCheia, pontosDeMedicao, DicaTelaCheia, FaixaDiscovery, FaseBar, Legend, PrimeiraDobra, TD, TH,
  eixoY, rotulo, useControleTelaCheia, useTamanho, type Fase,
} from "@/components/painel";
import { AvancoPorModulo, CartoesResumo, NotaCurva, PrazoCard } from "@/components/resumo";
import {
  DEFINICAO, END, MARCOS, MODULOS, MVP, PILOTO, REVISAO, START,
  buildSeries, escopoAt, estadoDe, faixaTravada, fmt, planejadoAt, todayISO,
  usePersisted, FATIAS, type Fatia,
} from "@/lib/burnup";

export const Route = createFileRoute("/burnup")({
  head: () => ({
    meta: [
      { title: "Burnup MVP · CRM Ingá Pneus" },
      { name: "description", content: "Burnup do MVP do CRM Ingá Pneus: escopo, planejado pelos prazos, em andamento e concluído, com o prazo de 10/11." },
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
  // Filtro guardado de uma versão anterior pode citar módulo que não existe mais: vale só o que existe.
  const ativos = sel.filter((id) => MODULOS.some((m) => m.id === id));
  const fs = ativos.length ? data.filter((f) => ativos.includes(f.moduloId)) : data;
  const series = useMemo(() => buildSeries(fs, today), [fs, today]);
  const capDay = today > END ? END : today;
  const last = series.find((p) => p.d === capDay);
  const travadaHa = faixaTravada(fs, capDay);
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
  const fechadoTotal = escopoAt(data, DEFINICAO.ate);
  const entradas = [...new Set(vigentes.map((f) => f.entradaEscopo).filter((d) => d > DEFINICAO.ate))].sort();
  const planejadoTotal = planejadoAt(fs, END);
  const toggle = (e: string) => setSel(ativos.includes(e) ? ativos.filter((x) => x !== e) : [...ativos, e]);

  return (
    <>
      <PrimeiraDobra telaCheia={telaCheia}>
      <PageHeader
        title="Burnup MVP ·"
        accent="CRM Ingá Pneus"
        subtitle={`Escopo fechado em ${fmt(DEFINICAO.ate)} com ${fechadoTotal} cards${entradas.length ? `; ${vigentes.length - fechadoTotal} entraram depois, até ${fmt(entradas.at(-1)!)}, e o escopo está em ${vigentes.length}` : ""}. Situação informada pelo time na planilha de ${fmt(REVISAO)}; cada card tem o próprio prazo. Prazo do MVP em ${fmt(MVP)}; piloto de ${fmt(PILOTO.de)} a ${fmt(PILOTO.ate)}.`}
      />

      {/* Cartões respeitam o filtro de módulo. */}
      <CartoesResumo fatias={fs} />

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
                dataKey="d" type="category" tickFormatter={fmt} ticks={TICKS_X} interval={0}
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
              {/* Prazo de cada card: é onde a curva de planejado sobe. */}
              {MARCOS.filter((m) => m !== MVP && m <= END).map((m) => (
                <ReferenceLine key={m} x={m} stroke="var(--bu-border)" strokeDasharray="4 4" />
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
                  label={rotulo(`Planejado até ${fmt(END)} · ${planejadoTotal}`, "var(--bu-text-2)", { anchor: "end", dx: -8, dy: -10 })} />
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
        <NotaCurva />
      </Card>
      </PrimeiraDobra>
      <DicaTelaCheia visivel={dica} telaCheia={telaCheia} />

      {!telaCheia && (
      <>
      <FaixaDiscovery />
      <EmAndamentoAgora fatias={data} />
      <AvancoPorModulo fatias={data} />

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
        {MODULOS.filter((m) => data.some((f) => f.moduloId === m.id)).map((m) => {
          const on = ativos.includes(m.id);
          return (
            <button
              key={m.id}
              onClick={() => toggle(m.id)}
              className={`rounded-full border px-3 py-1 text-xs transition-colors duration-150 ${
                on ? "border-teal bg-teal/15 text-text" : "border-line text-text-2 hover:text-text"
              }`}
            >
              <span className="mr-1.5 inline-block h-2 w-2 rounded-full align-middle" style={{ background: m.cor }} aria-hidden />{m.nome}
            </button>
          );
        })}
        {ativos.length > 0 && (
          <button onClick={() => setSel([])} className="px-2 text-xs text-text-3 hover:text-text-2">limpar</button>
        )}
      </div>
      </>
      )}
    </>
  );
}

/** Só datas com significado: a primeira entrada no escopo, o fechamento e cada prazo. Hoje e 10/11 têm linha própria. */
const TICKS_X = ["2026-09-02", DEFINICAO.ate, ...MARCOS.filter((m) => m !== MVP && m <= END)];
// No fim da linha, no prazo do MVP: preso a um degrau do meio, o rótulo parecia a data final do plano.
const ROTULO_PLANEJADO = MVP;

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
const CRITICAS = new Set(["B01", "B05", "CMP-F1"]);

function EmAndamentoAgora({ fatias }: { fatias: Fatia[] }) {
  const voo = fatias.filter((f) => estadoDe(f) === "em_andamento").sort((a, b) => (a.marco ?? "9999").localeCompare(b.marco ?? "9999") || a.id.localeCompare(b.id));
  return (
    <Card className="mb-4 overflow-x-auto">
      <div className="px-5 pt-4"><span className="label">Em andamento agora · {voo.length}</span></div>
      <table className="mt-2 w-full text-sm">
        <thead>
          <tr className="border-b border-line text-left">
            {["Id", "Card", "Módulo", "Prazo", "Depende de"].map((h) => <th key={h} className={TH}>{h}</th>)}
          </tr>
        </thead>
        <tbody>
          {voo.map((f) => (
            <tr key={f.id} className="border-t border-line-soft"
              style={CRITICAS.has(f.id) ? { background: "color-mix(in srgb, var(--bu-danger) 8%, transparent)" } : undefined}>
              <td className={`${TD} font-mono text-xs text-warn`}>{f.id}</td>
              <td className={TD}>{f.nome}</td>
              <td className={`${TD} text-text-2`}>{f.moduloId}</td>
              <td className={`${TD} font-mono text-xs text-text-2`}><PrazoCard f={f} /></td>
              <td className={`${TD} text-text-2`}>{f.dependeDe ?? "—"}</td>
            </tr>
          ))}
          {!voo.length && (
            <tr><td colSpan={5} className={`${TD} py-3 text-text-3`}>Nenhum card em andamento.</td></tr>
          )}
        </tbody>
      </table>
    </Card>
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
