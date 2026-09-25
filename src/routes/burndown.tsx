import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useRef } from "react";
import { Flag, TriangleAlert } from "lucide-react";
import {
  Area, CartesianGrid, ComposedChart, Customized, Line, ReferenceDot, ReferenceLine,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { Card, PageHeader } from "@/components/AppNav";
import {
  BotaoTelaCheia, DicaTelaCheia, pontosDeMedicao, FaixaAlocacao, FaseBar, Legend, PrimeiraDobra, Stat, TD, TH,
  dec, eixoY, rotulo, useControleTelaCheia, useTamanho, type Fase,
} from "@/components/painel";
import { ESTIMADOS, FATIAS, MARCOS, MVP, delivery, fmt, todayISO } from "@/lib/burnup";
import { CICLO, DIAS_CICLO, buildBurndown, cenarios, indicadores, proximoMarco, tabelaMarcos, type LinhaMarco } from "@/lib/burndown";

export const Route = createFileRoute("/burndown")({
  head: () => ({
    meta: [
      { title: "Burndown MVP · CRM Ingá Pneus" },
      { name: "description", content: "Burndown do MVP do CRM Ingá Pneus: o que falta entregar contra o que o fim de cada módulo prevê." },
      { property: "og:title", content: "Burndown MVP · CRM Ingá Pneus" },
      { property: "og:description", content: "Restante, a fazer e planejado por módulo do MVP do CRM Ingá Pneus." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: BurndownPage,
});

/** Só datas com significado no cronograma: o fechamento do escopo e os fins de módulo. Hoje e 10/11 têm linha própria. */
const TICKS_X = ["2026-09-17", "2026-09-28", "2026-10-09", "2026-10-16", "2026-11-06"];
const TICKS_X_AMPLO = ["2026-09-17", "2026-09-28", "2026-10-09", "2026-10-16", "2026-10-26", "2026-11-06"];
/** Só o delivery: os 70 cards a construir. */
const CARDS_DELIVERY = delivery(FATIAS);
const FASES: Fase[] = [{ de: CICLO.de, ate: CICLO.ate, rotulo: `DELIVERY · ${fmt(CICLO.de)} A ${fmt(CICLO.ate)}`, cor: "var(--bu-green)" }];
const MONO = { fill: "var(--bu-text-3)", fontSize: 11, fontFamily: "JetBrains Mono" };

function BurndownPage() {
  const today = todayISO();
  const { telaCheia, dica, alternar } = useControleTelaCheia();
  const refGrafico = useRef<HTMLDivElement>(null);
  const { h: alturaGrafico } = useTamanho(refGrafico);

  const serie = useMemo(() => buildBurndown(CARDS_DELIVERY, today), [today]);
  const ind = indicadores(CARDS_DELIVERY, today);
  const marcos = tabelaMarcos(CARDS_DELIVERY, today);
  const proximo = proximoMarco(marcos);
  const y = eixoY(ind.total, alturaGrafico);
  const hoje = serie.find((p) => p.d === today);
  // Em 10/11 a referência não chega a zero: fica acima o que não tem data de módulo ou fecha depois do prazo.
  const semData = serie.find((p) => p.d === CICLO.ate)?.planejado ?? 0;
  const nome = "cards de delivery";
  const traco = telaCheia ? 3 : 2;
  const noCiclo = today >= CICLO.de && today <= CICLO.ate;
  // Positivo quando um módulo chegou ao fim da janela com cards em aberto. Informação, não alarme: sem destaque vermelho.
  const comDesvio = ind.desvio > 0;

  return (
    <>
      <PrimeiraDobra telaCheia={telaCheia}>
        <PageHeader
          title="Burndown MVP ·"
          accent="CRM Ingá Pneus"
          subtitle={`O que falta entregar no delivery contra o que o fim de cada módulo prevê, de ${fmt(CICLO.de)} ao prazo do MVP em ${fmt(CICLO.ate)} (${DIAS_CICLO} dias). ${ind.total} cards de delivery; os 11 da fundação foram concluídos no discovery técnico. Em ${fmt(CICLO.ate)}, ${semData} ainda não têm fim de módulo dentro do prazo.`}
        />

        <div className="mb-4 grid grid-cols-2 gap-4 xl:grid-cols-4">
          <Stat label="Restante" value={String(ind.restante)} tone="cyan" note={`de ${ind.total} ${nome} no escopo`} />
          <Stat label="Planejado hoje" value={String(ind.planejadoHoje)} tone="muted" note="previsto pelos fins de módulo" />
          <Stat
            label="Situação em relação ao plano"
            value={`${comDesvio ? "+" : ""}${ind.desvio}`}
            tone={comDesvio ? "warn" : "green"}
            icon={comDesvio ? <TriangleAlert className="h-3.5 w-3.5 text-warn" aria-hidden /> : undefined}
            note={comDesvio ? `${nome} acima do planejado` : ind.desvio < 0 ? `${nome} adiante do planejado` : "restante igual ao planejado"}
          />
          <Stat
            label="Próximo prazo"
            value={proximo ? fmt(proximo.d) : "—"}
            tone="warn"
            icon={<Flag className="h-3.5 w-3.5 text-warn" aria-hidden />}
            note={proximo ? `${proximo.vencem} ${nome} vencem · ${emDias(proximo.diasAte)}` : "nenhum prazo à frente"}
          />
        </div>
        <FaixaAlocacao />

        <Card className="flex min-h-[420px] flex-1 flex-col p-5">
          <div className="mb-3 flex items-center justify-between gap-3">
            <span className="label">Burndown · cards</span>
            <BotaoTelaCheia telaCheia={telaCheia} onClick={alternar} />
          </div>
          {/* A área cresce com o cartão; o ResponsiveContainer mede a camada absoluta, que tem altura definida. */}
          <div ref={refGrafico} className="relative min-h-0 flex-1">
            <div className="absolute inset-0">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={serie} margin={{ top: 24, right: 48, left: 8, bottom: 22 }}>
                  <defs>
                    <linearGradient id="gNaoIniciado" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--bu-warn)" stopOpacity={0.2} />
                      <stop offset="100%" stopColor="var(--bu-warn)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} stroke="var(--bu-border-soft)" />
                  <XAxis
                    dataKey="d" type="category" tickFormatter={fmt} ticks={telaCheia ? TICKS_X_AMPLO : TICKS_X} interval={0}
                    tick={MONO} axisLine={{ stroke: "var(--bu-border)" }} tickLine={false} tickMargin={6} height={30}
                  />
                  <YAxis
                    allowDecimals={false} domain={[0, y.topo]} ticks={y.ticks} tick={MONO} axisLine={false} tickLine={false}
                    label={{ value: "cards", angle: -90, position: "insideLeft", offset: -2, fill: "var(--bu-text-3)", fontSize: 10, fontFamily: "JetBrains Mono", style: { textAnchor: "middle" } }}
                  />
                  <Tooltip content={<TipBurndown />} cursor={{ stroke: "var(--bu-border)" }} />
                  <Customized component={<FaseBar fases={FASES} />} />
                  {/* Fim de cada módulo: é onde a referência desce. */}
                  {MARCOS.filter((m) => m !== MVP && m <= CICLO.ate).map((m) => (
                    <ReferenceLine key={m} x={m} stroke="var(--bu-border)" strokeDasharray="4 4"
                      label={{ value: ESTIMADOS.filter((x) => x.fim === m).map((x) => x.id).join(" "), position: "insideBottomLeft", offset: 6, fill: "var(--bu-text-3)", fontSize: 10, fontFamily: "JetBrains Mono" }} />
                  ))}
                  <ReferenceLine x={MVP} stroke="var(--bu-danger)" strokeWidth={2}
                    label={{ value: `MVP · ${fmt(MVP)}`, position: "top", fill: "var(--bu-danger)", fontSize: 11, fontWeight: 600, fontFamily: "JetBrains Mono" }} />
                  {noCiclo && (
                    <ReferenceLine x={today} stroke="var(--bu-warn)"
                      label={{ value: `hoje ${fmt(today)}`, position: "top", fill: "var(--bu-warn)", fontSize: 11, fontFamily: "JetBrains Mono" }} />
                  )}
                  {/* Desvio: só onde o restante passou do planejado (série nula nos outros dias, então sem área). */}
                  {/* Monotone: suaviza sem ondular, então nenhuma série sobe e desce sem motivo. Os círculos marcam a medição. */}
                  <Area dataKey="desvio" type="monotone" stroke="none" fill="var(--bu-danger)" fillOpacity={0.18} isAnimationActive={false} />
                  <Area dataKey="naoIniciado" type="monotone" stroke="var(--bu-warn)" strokeWidth={traco} strokeLinecap="round" strokeLinejoin="round" fill="url(#gNaoIniciado)" isAnimationActive={false}
                    dot={pontosDeMedicao(serie.map((p) => p.naoIniciado), "var(--bu-warn)")} activeDot={false} />
                  <Line dataKey="planejado" type="monotone" stroke="var(--bu-text-3)" strokeWidth={traco} strokeDasharray="6 4" strokeLinecap="round" strokeLinejoin="round" isAnimationActive={false}
                    dot={pontosDeMedicao(serie.map((p) => p.planejado), "var(--bu-text-3)")} activeDot={false} />
                  <Line dataKey="restante" type="monotone" stroke="var(--bu-cyan)" strokeWidth={traco + 1} strokeLinecap="round" strokeLinejoin="round" isAnimationActive={false}
                    dot={pontosDeMedicao(serie.map((p) => p.restante), "var(--bu-cyan)")} activeDot={false} />
                  {/* Rótulos permanentes, legíveis numa captura. Sem fragmentos: o recharts 2 ignora filhos dentro de <>...</>. */}
                  <ReferenceDot x={CICLO.ate} y={semData} r={0} label={rotulo(`Planejado em ${fmt(CICLO.ate)} · ${semData}`, "var(--bu-text-2)", { anchor: "end", dx: -8, dy: 18 })} />
                  {hoje && hoje.restante !== null && (
                    <ReferenceDot x={today} y={hoje.restante} r={0}
                      label={rotulo(`Restante · ${hoje.restante}`, "var(--bu-cyan)", { dx: 10, dy: 16 })} />
                  )}
                  {hoje && hoje.naoIniciado !== null && (
                    <ReferenceDot x={today} y={hoje.naoIniciado} r={0}
                      label={rotulo(`A fazer · ${hoje.naoIniciado}`, "var(--bu-warn)", { dx: 10, dy: 14 })} />
                  )}
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-text-2">
            <Legend color="var(--bu-cyan)" label="Restante" />
            <Legend color="var(--bu-warn)" label="A fazer" />
            <Legend color="var(--bu-text-3)" label="Planejado" dashed />
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-2.5 w-4 rounded-sm" style={{ background: "color-mix(in srgb, var(--bu-danger) 30%, transparent)" }} />
              Acima do planejado
            </span>
          </div>
        </Card>
      </PrimeiraDobra>
      <DicaTelaCheia visivel={dica} telaCheia={telaCheia} />

      {!telaCheia && (
        <>
          <Card className="mb-4 p-5">
            <span className="label">Como ler</span>
            <div className="mt-3 grid gap-4 md:grid-cols-3">
              {LEITURAS.map(([titulo, texto]) => (
                <div key={titulo}>
                  <div className="text-sm font-semibold text-text">{titulo}</div>
                  <p className="mt-1 text-sm text-text-2">{texto}</p>
                </div>
              ))}
            </div>
          </Card>
          <TabelaMarcos linhas={marcos} nome={nome} />
          <OQueMove />
          <Cenarios restante={ind.restante} today={today} ritmoNecessario={ind.ritmoNecessario} />
        </>
      )}
    </>
  );
}

const LEITURAS = [
  ["Linha de restante", "Quanto falta entregar. Só desce quando um card é concluído."],
  ["Linha a fazer", "Quanto ainda não foi tocado. Desce quando um card começa. A distância entre as duas é o trabalho em andamento."],
  ["Área destacada", "Aparece só quando o restante fica acima do planejado: um módulo chegou ao fim da janela com cards em aberto."],
] as const;

const dataLonga = (iso: string) => `${fmt(iso)}/${iso.slice(0, 4)}`;

const emDias = (n: number) => (n === 0 ? "hoje" : n === 1 ? "em 1 dia" : n > 0 ? `em ${n} dias` : `há ${-n} dias`);

function TabelaMarcos({ linhas, nome }: { linhas: LinhaMarco[]; nome: string }) {
  const num = `${TD} font-mono text-xs`;
  return (
    <Card className="mb-4 overflow-x-auto">
      <div className="px-5 pt-4"><span className="label">Prazos do cronograma</span></div>
      <table className="mt-2 w-full text-sm">
        <thead>
          <tr className="border-b border-line text-left">
            {["Data", `Vencem (${nome})`, "Acumulado", "Dias até", "Conteúdo"].map((h) => <th key={h} className={TH}>{h}</th>)}
          </tr>
        </thead>
        <tbody>
          {linhas.map((l) => (
            <tr key={l.d} className={`border-t border-line-soft ${l.proximo ? "text-warn" : ""}`}
              style={l.proximo ? { background: "color-mix(in srgb, var(--bu-warn) 8%, transparent)" } : undefined}>
              <td className={num}>{dataLonga(l.d)}</td>
              <td className={num}>{l.vencem}</td>
              <td className={num}>{l.acumulado}</td>
              <td className={num}>{emDias(l.diasAte)}</td>
              <td className={`${TD} ${l.proximo ? "" : "text-text-2"}`}>{l.conteudo}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
}

const EVENTOS = [
  ["Card iniciado", "Desce a linha a fazer. A de restante não se move."],
  ["Card concluído", "Desce a linha de restante. Aproxima o restante do planejado, se estiver acima."],
  ["Card removido", "Desce as duas linhas, e o total do escopo."],
  ["Card acrescentado", "Sobe as duas linhas. É a limitação conhecida do burndown."],
] as const;

function OQueMove() {
  return (
    <Card className="mb-4 overflow-x-auto">
      <div className="px-5 pt-4"><span className="label">O que move cada linha</span></div>
      <table className="mt-2 w-full text-sm">
        <thead>
          <tr className="border-b border-line text-left">
            {["Evento", "Efeito"].map((h) => <th key={h} className={TH}>{h}</th>)}
          </tr>
        </thead>
        <tbody>
          {EVENTOS.map(([evento, efeito]) => (
            <tr key={evento} className="border-t border-line-soft">
              <td className={`${TD} whitespace-nowrap`}>{evento}</td>
              <td className={`${TD} text-text-2`}>{efeito}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
}

const COR_CENARIO = { green: "text-green", warn: "text-warn" } as const;

function Cenarios({ restante, today, ritmoNecessario }: { restante: number; today: string; ritmoNecessario: number | null }) {
  const linhas = cenarios(restante, today, ritmoNecessario);
  const num = `${TD} font-mono text-xs`;
  return (
    <Card className="mb-4 overflow-x-auto">
      <div className="px-5 pt-4"><span className="label">Projeção por cenário · a partir de {fmt(today)}</span></div>
      <table className="mt-2 w-full text-sm">
        <thead>
          <tr className="border-b border-line text-left">
            {["Cenário", "Cards por dia", "Conclusão", "Leitura"].map((h) => <th key={h} className={TH}>{h}</th>)}
          </tr>
        </thead>
        <tbody>
          {linhas.map((c) => (
            <tr key={c.nome} className="border-t border-line-soft">
              <td className={TD}>{c.nome}</td>
              <td className={num}>{dec(c.porDia)}</td>
              <td className={`${num} ${COR_CENARIO[c.tom]}`}>{dataLonga(c.conclusao)}</td>
              <td className={`${TD} text-text-2`}>{c.leitura}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
}

type TipProps = { active?: boolean; label?: string; payload?: { dataKey: string; value: number | number[] | null }[] };
function TipBurndown({ active, label, payload }: TipProps) {
  if (!active || !payload?.length) return null;
  const get = (k: string) => {
    const v = payload.find((p) => p.dataKey === k)?.value;
    return Array.isArray(v) ? null : v;
  };
  const rows = [
    ["Planejado", get("planejado"), "var(--bu-text-2)"],
    ["Restante", get("restante"), "var(--bu-cyan)"],
    ["A fazer", get("naoIniciado"), "var(--bu-warn)"],
  ] as const;
  return (
    <div className="rounded-lg border border-line bg-surface-2 px-3 py-2 font-mono text-xs">
      <div className="mb-1 text-text-2">{label ? dataLonga(label) : ""}</div>
      {rows.map(([n, v, c]) => (
        <div key={n} className="flex justify-between gap-6">
          <span style={{ color: c }}>{n}</span>
          <span className="text-text">{v ?? "—"}</span>
        </div>
      ))}
    </div>
  );
}
