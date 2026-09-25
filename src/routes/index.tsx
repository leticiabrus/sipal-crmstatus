import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { Hourglass, Maximize2, Minimize2 } from "lucide-react";
import {
  Area, CartesianGrid, ComposedChart, Customized, Line, ReferenceArea, ReferenceDot, ReferenceLine,
  ResponsiveContainer, Tooltip, XAxis, YAxis, type LabelProps,
} from "recharts";
import { Card, PageHeader } from "@/components/AppNav";
import {
  DEFINICAO, END, MARCOS, MVP, MVP_PRAZO, PILOTO, START, andamentoAt, buildSeries, builtAt, escopoAt, estadoDe, faixaTravada,
  fmt, semanaDe, situacaoEpico, todayISO, usePersisted, useTelaCheia, FATIAS, UNIDADE, type Fatia, type Unit,
} from "@/lib/burnup";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Burnup MVP · CRM Ingá Pneus" },
      { name: "description", content: "Burnup do MVP do CRM Ingá Pneus: escopo, planejado, em andamento e construído até o prazo de 10/11." },
      { property: "og:title", content: "Burnup MVP · CRM Ingá Pneus" },
      { property: "og:description", content: "Escopo, planejado, em andamento e construído do MVP do CRM Ingá Pneus." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: BurnupPage,
});

function BurnupPage() {
  const data = FATIAS;
  const [unit, setUnit] = usePersisted<Unit>("bu-unit", "fatia");
  const [sel, setSel] = usePersisted<string[]>("bu-epicos", []);
  const today = todayISO();
  const telaCheia = useTelaCheia();
  const refGrafico = useRef<HTMLDivElement>(null);
  const { h: alturaGrafico } = useTamanho(refGrafico);
  const rolou = useRolou();
  // Em F11 o navegador só sai pelo próprio F11: o botão apenas lembra a tecla.
  const [pedidosF11, setPedidosF11] = useState(0);
  const pedirF11 = () => setPedidosF11((n) => n + 1);
  const dica = useDicaTemporaria(telaCheia, 3000, pedidosF11);
  const epicos = useMemo(() => [...new Set(data.map((f) => f.epico))], [data]);
  const fs = sel.length ? data.filter((f) => sel.includes(f.epico)) : data;
  const series = useMemo(() => buildSeries(fs, unit, today), [fs, unit, today]);
  const capDay = today > END ? END : today;
  const last = series.find((p) => p.d === capDay);
  const travadaHa = faixaTravada(fs, unit, capDay);
  // Cartões em fatias (story points têm cartão próprio), respeitando o filtro de épico.
  const nFatias = escopoAt(fs, END, "fatia");
  const nEpicos = new Set(fs.filter((f) => !f.removida).map((f) => f.epico)).size;
  const built = builtAt(fs, capDay, "fatia");
  const pct = nFatias ? Math.round((built / nFatias) * 100) : 0;
  const escopoFechado = escopoAt(fs, DEFINICAO.ate, unit);
  // A faixa em andamento só existe a partir do primeiro início; antes disso não desenha nem a borda no zero.
  const primeiroInicio = fs.filter((f) => f.iniciada && !f.removida).map((f) => f.iniciada as string).sort()[0];
  const chartData = useMemo(
    () => series.map((p) => (!primeiroInicio || p.d < primeiroInicio ? { ...p, andamento: null } : p)),
    [series, primeiroInicio],
  );
  const escopoMax = Math.max(...series.map((p) => p.escopo), 1);
  // Com o gráfico alto, o passo cai pela metade e a grade fica mais densa; o topo continua no total do escopo.
  const passoBase = escopoMax <= 100 ? 20 : 50;
  const passoY = alturaGrafico >= 520 ? passoBase / 2 : passoBase;
  const topoY = Math.ceil(escopoMax / passoY) * passoY;
  const planejadoRef = series.find((p) => p.d === ROTULO_PLANEJADO);
  const vooHoje = last?.andamento ?? 0;
  // Projetado à distância, traço fino some: 3px em tela cheia.
  const traco = telaCheia ? 3 : 2;
  // Subtítulo descreve o MVP inteiro, sem o filtro de épico.
  const vigentes = data.filter((f) => !f.removida);
  const alternador = (
    <div className="flex rounded-lg border border-line bg-bg/60 p-1">
      {(["fatia", "peso"] as Unit[]).map((u) => (
        <button
          key={u}
          onClick={() => setUnit(u)}
          className={`rounded-md px-3 py-1.5 text-sm transition-colors duration-150 ${
            unit === u ? "bg-green font-semibold text-green-ink hover:bg-green-glow" : "text-text-2 hover:text-text"
          }`}
        >
          Por {UNIDADE[u].nome}
        </button>
      ))}
    </div>
  );
  const toggle = (e: string) => setSel(sel.includes(e) ? sel.filter((x) => x !== e) : [...sel, e]);

  return (
    <>
      {/* Primeira dobra: cabeçalho, cartões e gráfico ocupam a janela; o detalhamento vem na rolagem. */}
      <section
        className="relative flex flex-col pb-8"
        style={{ minHeight: telaCheia ? "100dvh" : "calc(100dvh - 49px)" }}
      >
      <PageHeader
        title="Burnup MVP ·"
        accent="CRM Ingá Pneus"
        subtitle={`Escopo definido entre ${fmt(DEFINICAO.de)} e ${fmt(DEFINICAO.ate)}, com ${vigentes.length} fatias em ${new Set(vigentes.map((f) => f.epico)).size} épicos. Desenvolvimento concluído até ${fmt(MVP)}; piloto de ${fmt(PILOTO.de)} a ${fmt(PILOTO.ate)}.`}
      >
        {alternador}
      </PageHeader>

      <div className="mb-4 grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-5">
        <Stat label="Fatias no escopo" value={String(nFatias)} note={`em ${nEpicos} épicos`} />
        <Stat label="Story points" value={String(escopoAt(fs, END, "peso"))} note="esforço relativo" />
        <Stat label="Em andamento" value={String(andamentoAt(fs, capDay, "fatia"))} tone="warn" note={`semana ${semanaDe(capDay)}`} />
        <Stat label="Construído" value={String(built)} accent note={`${pct}% do escopo`} />
        <ContagemMvp />
      </div>

      <Card className="flex min-h-[420px] flex-1 flex-col p-5">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <span className="label">Burnup · por {UNIDADE[unit].nome}</span>
          <div className="flex flex-wrap items-center gap-4 text-xs text-text-2">
            <Legend color="var(--bu-cyan)" label="Escopo" />
            <Legend color="var(--bu-text-3)" label="Planejado" dashed />
            <Legend color="var(--bu-green)" label="Construído" />
            <Legend color="var(--bu-warn)" label="Em andamento" />
            <button
              onClick={() => (telaCheia === "f11" ? pedirF11() : alternarTelaCheia())}
              title={telaCheia ? "Sair da tela cheia" : "Tela cheia"}
              aria-label={telaCheia ? "Sair da tela cheia" : "Tela cheia"}
              className="rounded-md border border-line p-1.5 text-text-2 transition-colors duration-150 hover:text-text"
            >
              {telaCheia ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
            </button>
          </div>
        </div>
        {/* A área cresce com o cartão; o ResponsiveContainer mede a camada absoluta, que tem altura definida
            (um filho de flex não tem, e o 100% colapsaria). */}
        <div ref={refGrafico} className="relative min-h-0 flex-1">
          <div className="absolute inset-0">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 24, right: 16, left: 8, bottom: 22 }}>
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
                allowDecimals={false} domain={[0, topoY]}
                ticks={Array.from({ length: Math.floor(topoY / passoY) + 1 }, (_, i) => i * passoY)}
                tick={{ fill: "var(--bu-text-3)", fontSize: 11, fontFamily: "JetBrains Mono" }}
                axisLine={false} tickLine={false}
                label={{ value: UNIDADE[unit].eixo, angle: -90, position: "insideLeft", offset: -2, fill: "var(--bu-text-3)", fontSize: 10, fontFamily: "JetBrains Mono", style: { textAnchor: "middle" } }}
              />
              <Tooltip content={<ChartTip />} cursor={{ stroke: "var(--bu-border)" }} />
              <ReferenceArea x1={PILOTO.de} x2={PILOTO.ate} fill="var(--bu-green)" fillOpacity={0.08} stroke="none"
                label={{ value: "Piloto", position: "insideBottom", fill: "var(--bu-green)", fontSize: 10, fontFamily: "JetBrains Mono" }} />
              <ReferenceLine x={DEFINICAO.ate} stroke="var(--bu-cyan)" strokeOpacity={0.35} strokeDasharray="2 4" />
              <Customized component={FaseBar} />
              {MARCOS.filter((m) => m !== MVP).map((m) => (
                <ReferenceLine key={m} x={m} stroke="var(--bu-border)" strokeDasharray="4 4"
                  label={{ value: fmt(m), position: "insideTopLeft", fill: "var(--bu-text-3)", fontSize: 10, fontFamily: "JetBrains Mono" }} />
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
              <Area dataKey="construido" stackId="feito" type="stepAfter" stroke="var(--bu-green)" strokeWidth={3} fill="url(#gBuilt)" isAnimationActive={false} />
              <Area dataKey="andamento" stackId="feito" type="stepAfter" stroke="var(--bu-warn)" strokeWidth={traco} fill="var(--bu-warn)" fillOpacity={0.22} isAnimationActive={false} />
              <Line dataKey="escopo" type="stepAfter" stroke="var(--bu-cyan)" strokeWidth={traco} dot={false} isAnimationActive={false} />
              <Line dataKey="planejado" type="monotone" stroke="var(--bu-text-3)" strokeWidth={traco} strokeDasharray="6 4" dot={false} isAnimationActive={false} />
              {/* Rótulos permanentes: o gráfico precisa ser legível numa captura, sem tooltip. */}
              {DEFINICAO.ate >= START && (
                <ReferenceDot x={DEFINICAO.ate} y={escopoFechado} r={3} fill="var(--bu-cyan)" stroke="var(--bu-bg)" strokeWidth={2}
                  label={rotulo(`Escopo · ${escopoFechado}`, "var(--bu-cyan)", { dx: 8, dy: 16 })} />
              )}
              {planejadoRef && planejadoRef.planejado !== null && (
                <ReferenceDot x={planejadoRef.d} y={planejadoRef.planejado} r={0}
                  label={rotulo(`Planejado · ${escopoAt(fs, END, unit)}`, "var(--bu-text-2)", { anchor: "end", dx: -4, dy: -8 })} />
              )}
              {/* Sem fragmentos: o recharts 2 ignora filhos dentro de <>...</>. */}
              {last && vooHoje > 0 && (
                <ReferenceDot x={last.d} y={(last.construido ?? 0) + vooHoje} r={4} fill="var(--bu-warn)" stroke="var(--bu-bg)" strokeWidth={2}
                  label={rotulo(`Em andamento · ${vooHoje}`, "var(--bu-warn)", { dx: 10, dy: 4 })} />
              )}
              {last && last.construido !== null && (
                <ReferenceDot x={START} y={last.construido} r={0}
                  label={rotulo(`Construído · ${last.construido}`, "var(--bu-green)", { dx: 4, dy: -8 })} />
              )}
              {last && last.construido !== null && (
                <ReferenceDot x={last.d} y={last.construido} r={9} fill="var(--bu-green)" fillOpacity={0.2} stroke="none" />
              )}
              {last && last.construido !== null && (
                <ReferenceDot x={last.d} y={last.construido} r={4} fill="var(--bu-green-glow)" stroke="var(--bu-bg)" strokeWidth={2} />
              )}
            </ComposedChart>
          </ResponsiveContainer>
          </div>
        </div>
      </Card>
      {!rolou && !telaCheia && (
        <div className="pointer-events-none absolute inset-x-0 bottom-2 text-center font-mono text-[11px] text-text-3">
          ↓ role para ver o detalhamento
        </div>
      )}
      </section>
      {dica && (
        <div className="pointer-events-none fixed left-1/2 top-4 z-50 -translate-x-1/2 rounded-md border border-line bg-surface-2/90 px-3 py-1.5 font-mono text-[11px] text-text-2">
          {telaCheia === "f11" ? "F11 para sair" : "ESC para sair"}
        </div>
      )}

      {!telaCheia && (
      <>
      <EmAndamentoAgora fatias={data} />
      <EscopoPorEpico fatias={data} today={today} />

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
            A faixa em andamento cresce sem entregas há {travadaHa} dia{travadaHa > 1 ? "s" : ""}: trabalho entrando em voo sem sair.
          </div>
        )}
      </Card>

      <div className="flex flex-wrap items-center gap-2">
        <span className="label mr-2">Épicos</span>
        {epicos.map((e) => {
          const on = sel.includes(e);
          return (
            <button
              key={e}
              onClick={() => toggle(e)}
              className={`rounded-full border px-3 py-1 text-xs transition-colors duration-150 ${
                on ? "border-teal bg-teal/15 text-text" : "border-line text-text-2 hover:text-text"
              }`}
            >
              {e}
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

type EixoX = { scale: ((v: string) => number | undefined) & { bandwidth?: () => number } };
type CustomizedProps = { xAxisMap?: Record<string, EixoX>; offset?: { top: number; height: number } };

/** Só datas com significado no cronograma; hoje e 10/11 têm linha própria. */
const TICKS_X = ["2026-08-28", "2026-09-26", "2026-10-03", "2026-10-10", "2026-10-17", "2026-11-27"];
/** Em tela cheia cabe mais: 30/09 e 24/10 entram. */
const TICKS_X_AMPLO = ["2026-08-28", "2026-09-26", "2026-09-30", "2026-10-03", "2026-10-10", "2026-10-17", "2026-10-24", "2026-11-27"];
// Em 17/10 o planejado já encosta no escopo; em 10/10 sobra altura para o rótulo acima da curva.
const ROTULO_PLANEJADO = "2026-10-10";

/** Rótulo fixo de série, ancorado num ReferenceDot (o viewBox do ponto é o próprio ponto quando r = 0). */
function rotulo(texto: string, cor: string, { anchor = "start", dx = 0, dy = 0 }: { anchor?: "start" | "middle" | "end"; dx?: number; dy?: number }) {
  return {
    content: (props: LabelProps) => {
      const viewBox = props.viewBox as { x?: number; y?: number; width?: number; height?: number } | undefined;
      const x = (viewBox?.x ?? 0) + (viewBox?.width ?? 0) / 2, y = (viewBox?.y ?? 0) + (viewBox?.height ?? 0) / 2;
      return (
        <text x={x + dx} y={y + dy} textAnchor={anchor} fill={cor} fontSize={11} fontWeight={600} fontFamily="JetBrains Mono">
          {texto}
        </text>
      );
    },
  };
}

const FASES = [
  { de: DEFINICAO.de, ate: DEFINICAO.ate, rotulo: "DISCOVERY", cor: "var(--bu-cyan)" },
  { de: DEFINICAO.ate, ate: END, rotulo: "DELIVERY", cor: "var(--bu-green)" },
];

/** Faixa de fase abaixo das datas do eixo X, fora da área de plotagem. */
function FaseBar({ xAxisMap, offset }: CustomizedProps) {
  const axis = xAxisMap && Object.values(xAxisMap)[0];
  if (!axis || !offset) return null;
  const half = (axis.scale.bandwidth?.() ?? 0) / 2;
  const y = offset.top + offset.height + 30; // abaixo da altura do eixo X (30px)
  return (
    <g>
      {FASES.map((f) => {
        const s1 = axis.scale(f.de), s2 = axis.scale(f.ate);
        if (s1 === undefined || s2 === undefined) return null;
        const x1 = s1 + half + 1, x2 = s2 + half - 1;
        return (
          <g key={f.rotulo}>
            <rect x={x1} y={y} width={Math.max(0, x2 - x1)} height={18} rx={3} fill={f.cor} fillOpacity={0.18} />
            <text x={(x1 + x2) / 2} y={y + 12.5} textAnchor="middle" fill={f.cor} fontSize={9} letterSpacing={1} fontFamily="JetBrains Mono">
              {f.rotulo}
            </text>
          </g>
        );
      })}
    </g>
  );
}

/** Entra e sai da tela cheia pela Fullscreen API. Em F11, o navegador só sai pelo próprio F11. */
function alternarTelaCheia() {
  if (document.fullscreenElement) void document.exitFullscreen();
  else void document.documentElement.requestFullscreen?.();
}

/** Tamanho atual de um elemento: ajusta a densidade da grade à altura do gráfico. */
function useTamanho(ref: React.RefObject<HTMLElement | null>) {
  const [t, setT] = useState({ w: 0, h: 0 });
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ler = () => setT({ w: Math.floor(el.clientWidth), h: Math.floor(el.clientHeight) });
    ler();
    const ro = new ResizeObserver(ler);
    ro.observe(el);
    return () => ro.disconnect();
  }, [ref]);
  return t;
}

/** Verdadeiro depois que a página rolou: o indicador de conteúdo abaixo some. */
function useRolou() {
  const [rolou, setRolou] = useState(false);
  useEffect(() => {
    const ler = () => setRolou(window.scrollY > 8);
    ler();
    window.addEventListener("scroll", ler, { passive: true });
    return () => window.removeEventListener("scroll", ler);
  }, []);
  return rolou;
}

/** Mostra a dica por alguns segundos sempre que a tela cheia é ativada. */
function useDicaTemporaria(ativo: unknown, ms: number, gatilho = 0) {
  const [visivel, setVisivel] = useState(false);
  useEffect(() => {
    if (!ativo) { setVisivel(false); return; }
    setVisivel(true);
    const id = setTimeout(() => setVisivel(false), ms);
    return () => clearTimeout(id);
  }, [ativo, ms, gatilho]);
  return visivel;
}

const LEITURAS = [
  ["Faixa fina, verde subindo", "Fluxo saudável. O que começa termina."],
  ["Faixa engrossando, verde parada", "Trabalho entrando em voo sem sair. Indica bloqueio, não lentidão."],
  ["Faixa larga e estável", "Trabalho demais aberto ao mesmo tempo. Vale fechar antes de abrir."],
] as const;

/** Fatias em voo no caminho crítico do piloto, destacadas na tabela de em andamento. */
const CRITICAS = new Set(["B01", "B04", "B05", "D01", "D02", "D04"]);

const TH = "label px-4 py-2.5 font-medium";
const TD = "px-4 py-1.5";

function EmAndamentoAgora({ fatias }: { fatias: Fatia[] }) {
  const voo = fatias.filter((f) => estadoDe(f) === "em_andamento").sort((a, b) => a.marco.localeCompare(b.marco) || a.id.localeCompare(b.id));
  return (
    <Card className="mb-4 overflow-x-auto">
      <div className="px-5 pt-4"><span className="label">Em andamento agora · {voo.length}</span></div>
      <table className="mt-2 w-full text-sm">
        <thead>
          <tr className="border-b border-line text-left">
            {["Id", "Card", "Épico", "SP", "Prazo", "Depende de"].map((h) => <th key={h} className={TH}>{h}</th>)}
          </tr>
        </thead>
        <tbody>
          {voo.map((f) => (
            <tr key={f.id} className="border-t border-line-soft"
              style={CRITICAS.has(f.id) ? { background: "color-mix(in srgb, var(--bu-danger) 8%, transparent)" } : undefined}>
              <td className={`${TD} font-mono text-xs text-warn`}>{f.id}</td>
              <td className={TD}>{f.nome}</td>
              <td className={`${TD} text-text-2`}>{f.epico}</td>
              <td className={`${TD} font-mono text-xs`}>{f.peso}</td>
              <td className={`${TD} font-mono text-xs text-text-2`}>{fmt(f.marco)}</td>
              <td className={`${TD} text-text-2`}>{f.dependeDe ?? "—"}</td>
            </tr>
          ))}
          {!voo.length && (
            <tr><td colSpan={6} className={`${TD} py-3 text-text-3`}>Nenhuma fatia em andamento.</td></tr>
          )}
        </tbody>
      </table>
    </Card>
  );
}

function EscopoPorEpico({ fatias, today }: { fatias: Fatia[]; today: string }) {
  const vigentes = fatias.filter((f) => !f.removida);
  const grupos = [...new Set(vigentes.map((f) => f.epico))].map((epico) => {
    const fs = vigentes.filter((f) => f.epico === epico);
    return {
      epico,
      fatias: fs.length,
      peso: fs.reduce((s, f) => s + f.peso, 0),
      voo: fs.filter((f) => estadoDe(f) === "em_andamento").length,
      feitas: fs.filter((f) => f.concluida).length,
      prazo: fs.map((f) => f.marco).sort().at(-1) ?? "",
      situacao: situacaoEpico(fs, fatias, today),
    };
  }).sort((a, b) => a.prazo.localeCompare(b.prazo) || a.epico.localeCompare(b.epico));
  const soma = (k: "fatias" | "peso" | "voo" | "feitas") => grupos.reduce((s, g) => s + g[k], 0);
  const num = `${TD} font-mono text-xs`;
  return (
    <Card className="mb-4 overflow-x-auto">
      <div className="px-5 pt-4"><span className="label">Escopo por épico</span></div>
      <table className="mt-2 w-full text-sm">
        <thead>
          <tr className="border-b border-line text-left">
            {["Épico", "Fatias", "SP", "Em andamento", "Construído", "Prazo", "Situação"].map((h) => <th key={h} className={TH}>{h}</th>)}
          </tr>
        </thead>
        <tbody>
          {grupos.map((g) => (
            <tr key={g.epico} className="border-t border-line-soft">
              <td className={TD}>{g.epico}</td>
              <td className={num}>{g.fatias}</td>
              <td className={num}>{g.peso}</td>
              <td className={`${num} ${g.voo ? "text-warn" : "text-text-3"}`}>{g.voo}</td>
              <td className={`${num} ${g.feitas ? "text-green" : "text-text-3"}`}>{g.feitas}</td>
              <td className={`${num} text-text-2`}>{fmt(g.prazo)}</td>
              <td className={`${TD} text-text-2`}>{g.situacao}</td>
            </tr>
          ))}
          <tr className="border-t border-line font-semibold">
            <td className={TD}>Total</td>
            <td className={num}>{soma("fatias")}</td>
            <td className={num}>{soma("peso")}</td>
            <td className={`${num} text-warn`}>{soma("voo")}</td>
            <td className={`${num} text-green`}>{soma("feitas")}</td>
            <td className={`${num} text-text-2`}>{fmt(grupos.map((g) => g.prazo).sort().at(-1) ?? null)}</td>
            <td className={TD} />
          </tr>
        </tbody>
      </table>
    </Card>
  );
}

const dois = (n: number) => String(n).padStart(2, "0");

/**
 * Casca comum dos cartões de número. Rótulo, valor e descrição têm altura fixa,
 * então cada faixa cai na mesma linha horizontal em todos os cartões, qualquer que seja o conteúdo.
 */
function CartaoNumero({ label, icon, note, className = "", children }: {
  label: string; icon?: React.ReactNode; note?: string | undefined; className?: string; children: React.ReactNode;
}) {
  return (
    <div className={`flex h-full min-h-[120px] flex-col justify-between rounded-xl border p-4 ${className}`}>
      <div className="label flex h-4 items-center gap-1.5">{icon}{label}</div>
      <div className="flex h-10 items-center font-mono font-semibold">{children}</div>
      <div className="h-4 truncate font-mono text-xs text-text-3">{note}</div>
    </div>
  );
}

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
      className="border-danger bg-danger/5 shadow-[0_0_20px_rgba(244,63,94,.12)]"
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

function Stat({ label, value, accent, tone, note }: {
  label: string; value: string; accent?: boolean; tone?: "warn"; note?: string | undefined;
}) {
  const color = tone === "warn" ? "text-warn" : accent ? "text-green" : "text-text";
  return (
    <CartaoNumero label={label} note={note} className="border-line bg-surface">
      <span className={`text-3xl ${color}`}>{value}</span>
    </CartaoNumero>
  );
}

function Legend({ color, label, dashed }: { color: string; label: string; dashed?: boolean }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className="inline-block w-4" style={{ borderTop: `2px ${dashed ? "dashed" : "solid"} ${color}` }} />
      {label}
    </span>
  );
}

type TipProps = { active?: boolean; label?: string; payload?: { dataKey: string; value: number | null }[] };
function ChartTip({ active, label, payload }: TipProps) {
  if (!active || !payload?.length) return null;
  const get = (k: string) => payload.find((p) => p.dataKey === k)?.value;
  const rows = [
    ["Escopo", get("escopo"), "var(--bu-cyan)"],
    ["Planejado", get("planejado"), "var(--bu-text-2)"],
    ["Construído", get("construido"), "var(--bu-green)"],
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
