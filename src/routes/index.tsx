import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useRef } from "react";
import {
  Area, CartesianGrid, ComposedChart, Customized, Line, ReferenceDot, ReferenceLine,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { Card, PageHeader } from "@/components/AppNav";
import {
  BotaoTelaCheia, DicaTelaCheia, FaixaAlocacao, FaseBar, Legend, PrimeiraDobra, Stat, TD, TH,
  eixoY, pontosDeMedicao, rotulo, useControleTelaCheia, useTamanho, type Fase,
} from "@/components/painel";
import { DEFINICAO, END, ESTIMADOS, FATIAS, MARCOS, MVP, START, delivery, fmt, todayISO } from "@/lib/burnup";
import { buildFluxo, entradasDepoisDoFechamento, type PontoFluxo } from "@/lib/fluxo";
import { periodo, semanasDoDelivery } from "@/lib/semanas";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Fluxo acumulado · CRM Ingá Pneus" },
      { name: "description", content: "Burnup e burndown do MVP do CRM Ingá Pneus num gráfico só: concluído, em andamento e a fazer empilhados até o escopo." },
      { property: "og:title", content: "Fluxo acumulado · CRM Ingá Pneus" },
      { property: "og:description", content: "O que foi concluído, o que está em andamento e o que falta, dia a dia, contra o planejado." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: FluxoPage,
});

/** A mesma base do burndown e do planejado: só o delivery. */
const CARDS_DELIVERY = delivery(FATIAS);
const TICKS_X = ["2026-09-02", DEFINICAO.ate, "2026-09-28", "2026-10-09", "2026-10-16", "2026-11-06"];
const TICKS_X_AMPLO = ["2026-09-02", "2026-09-08", "2026-09-11", DEFINICAO.ate, "2026-09-21", "2026-09-28", "2026-10-09", "2026-10-16", "2026-10-30", "2026-11-06"];
const FASES: Fase[] = [
  { de: START, ate: DEFINICAO.ate, rotulo: "DISCOVERY", cor: "var(--bu-cyan)" },
  { de: DEFINICAO.ate, ate: END, rotulo: "DELIVERY", cor: "var(--bu-green)" },
];
const MONO = { fill: "var(--bu-text-3)", fontSize: 11, fontFamily: "JetBrains Mono" };
const COR = { concluido: "var(--bu-green)", andamento: "var(--bu-warn)", aFazer: "var(--bu-text-3)", escopo: "var(--bu-cyan)", planejado: "var(--bu-text-2)" };

function FluxoPage() {
  const today = todayISO();
  const { telaCheia, dica, alternar } = useControleTelaCheia();
  const refGrafico = useRef<HTMLDivElement>(null);
  const { h: alturaGrafico } = useTamanho(refGrafico);

  const serie = useMemo(() => buildFluxo(CARDS_DELIVERY, today), [today]);
  const corte = today > END ? END : today;
  const hoje = serie.find((p) => p.d === corte) ?? serie.at(-1)!;
  const concluido = hoje.concluido ?? 0, andamento = hoje.andamento ?? 0, aFazer = hoje.aFazer ?? 0;
  const falta = andamento + aFazer;
  const pct = hoje.escopo ? Math.round((concluido / hoje.escopo) * 100) : 0;
  const planejadoFinal = serie.at(-1)!.planejado ?? 0;
  const entradas = entradasDepoisDoFechamento(serie);
  const y = eixoY(Math.max(...serie.map((p) => p.escopo), 1), alturaGrafico);
  const traco = telaCheia ? 3 : 2;
  const noEixo = today >= START && today <= END;

  return (
    <>
      <PrimeiraDobra telaCheia={telaCheia}>
        <PageHeader
          title="Fluxo acumulado ·"
          accent="CRM Ingá Pneus"
          subtitle={`Burnup e burndown num gráfico só. As três faixas somam o escopo do dia: concluído embaixo, em andamento no meio, a fazer em cima; em andamento e a fazer juntos são o que falta. ${hoje.escopo} cards de delivery; os de discovery ficam fora. Prazo do MVP em ${fmt(MVP)}.`}
        />

        <div className="mb-4 grid grid-cols-2 gap-4 xl:grid-cols-4">
          <Stat label="Concluído" value={`${concluido} de ${hoje.escopo}`} tone="green" note={`${pct}% do delivery`} />
          <Stat label="Em andamento" value={String(andamento)} tone="warn" note="começaram e não concluíram" />
          <Stat label="A fazer" value={String(aFazer)} tone="muted" note="ainda não começaram" />
          <Stat label="Falta entregar" value={String(falta)} tone="cyan"
            note={`${100 - pct}% do delivery`} />
        </div>
        <FaixaAlocacao />

        <Card className="flex min-h-[420px] flex-1 flex-col p-5">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <span className="label">Fluxo acumulado · cards</span>
            <div className="flex flex-wrap items-center gap-4 text-xs text-text-2">
              <Faixa color={COR.concluido} label="Concluído" />
              <Faixa color={COR.andamento} label="Em andamento" />
              <Faixa color={COR.aFazer} label="A fazer" />
              <Legend color={COR.escopo} label="Escopo" />
              <Legend color={COR.planejado} label="Planejado" dashed />
              <BotaoTelaCheia telaCheia={telaCheia} onClick={alternar} />
            </div>
          </div>
          {/* A área cresce com o cartão; o ResponsiveContainer mede a camada absoluta, que tem altura definida. */}
          <div ref={refGrafico} className="relative min-h-0 flex-1">
            <div className="absolute inset-0">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={serie} margin={{ top: 24, right: 52, left: 8, bottom: 22 }}>
                  <CartesianGrid vertical={false} stroke="var(--bu-border-soft)" />
                  <XAxis
                    dataKey="d" type="category" tickFormatter={fmt} ticks={telaCheia ? TICKS_X_AMPLO : TICKS_X} interval={0}
                    tick={MONO} axisLine={{ stroke: "var(--bu-border)" }} tickLine={false} tickMargin={6} height={30}
                  />
                  <YAxis
                    allowDecimals={false} domain={[0, y.topo]} ticks={y.ticks} tick={MONO} axisLine={false} tickLine={false}
                    label={{ value: "cards", angle: -90, position: "insideLeft", offset: -2, fill: "var(--bu-text-3)", fontSize: 10, fontFamily: "JetBrains Mono", style: { textAnchor: "middle" } }}
                  />
                  <Tooltip content={<TipFluxo />} cursor={{ stroke: "var(--bu-border)" }} />
                  <ReferenceLine x={DEFINICAO.ate} stroke="var(--bu-cyan)" strokeOpacity={0.35} strokeDasharray="2 4" />
                  <Customized component={<FaseBar fases={FASES} />} />
                  {/* Fim de cada módulo: é onde o planejado sobe. */}
                  {MARCOS.filter((m) => m !== MVP && m <= END).map((m) => (
                    <ReferenceLine key={m} x={m} stroke="var(--bu-border)" strokeDasharray="4 4"
                      label={{ value: ESTIMADOS.filter((x) => x.fim === m).map((x) => x.id).join(" "), position: "insideBottomLeft", offset: 6, fill: "var(--bu-text-3)", fontSize: 10, fontFamily: "JetBrains Mono" }} />
                  ))}
                  <ReferenceLine x={MVP} stroke="var(--bu-danger)" strokeWidth={2}
                    label={{ value: "MVP PRONTO", position: "top", fill: "var(--bu-danger)", fontSize: 11, fontWeight: 600, fontFamily: "JetBrains Mono" }} />
                  {noEixo && (
                    <ReferenceLine x={today} stroke="var(--bu-warn)"
                      label={{ value: `hoje ${fmt(today)}`, position: "top", fill: "var(--bu-warn)", fontSize: 11, fontFamily: "JetBrains Mono" }} />
                  )}
                  {/* Empilhadas na ordem do fluxo: a primeira fica embaixo. Linhas depois das áreas, para ficarem por cima. */}
                  {/* Monotone: suaviza sem ondular, então nenhuma faixa sobe e desce sem motivo. */}
                  <Area dataKey="concluido" stackId="fluxo" type="monotone" stroke={COR.concluido} strokeWidth={traco} fill={COR.concluido} fillOpacity={0.35} isAnimationActive={false} activeDot={false} />
                  <Area dataKey="andamento" stackId="fluxo" type="monotone" stroke={COR.andamento} strokeWidth={1} fill={COR.andamento} fillOpacity={0.3} isAnimationActive={false} activeDot={false} />
                  <Area dataKey="aFazer" stackId="fluxo" type="monotone" stroke="none" fill={COR.aFazer} fillOpacity={0.18} isAnimationActive={false} activeDot={false} />
                  <Line dataKey="escopo" type="monotone" stroke={COR.escopo} strokeWidth={traco} strokeLinecap="round" strokeLinejoin="round" isAnimationActive={false}
                    dot={pontosDeMedicao(serie.map((p) => p.escopo), COR.escopo)} activeDot={false} />
                  <Line dataKey="planejado" type="monotone" stroke={COR.planejado} strokeWidth={traco} strokeDasharray="6 4" strokeLinecap="round" strokeLinejoin="round" isAnimationActive={false}
                    dot={pontosDeMedicao(serie.map((p) => p.planejado), "var(--bu-text-3)")} activeDot={false} />
                  {/* Rótulos permanentes, legíveis numa captura. Sem fragmentos: o recharts 2 ignora filhos dentro de <>...</>. */}
                  {entradas.map((e) => (
                    <ReferenceDot key={e.d} x={e.d} y={e.escopo} r={0}
                      label={rotulo(`escopo +${e.entrou}`, COR.escopo, { anchor: "end", dx: -6, dy: -8 })} />
                  ))}
                  {noEixo && concluido > 0 && (
                    <ReferenceDot x={corte} y={concluido / 2} r={0} label={rotulo(`Concluído · ${concluido}`, COR.concluido, { dx: 10, dy: 4 })} />
                  )}
                  {noEixo && andamento > 0 && (
                    <ReferenceDot x={corte} y={concluido + andamento / 2} r={0} label={rotulo(`Em andamento · ${andamento}`, COR.andamento, { dx: 10, dy: 4 })} />
                  )}
                  {noEixo && aFazer > 0 && (
                    <ReferenceDot x={corte} y={concluido + andamento + aFazer / 2} r={0} label={rotulo(`A fazer · ${aFazer}`, "var(--bu-text-2)", { dx: 10, dy: 4 })} />
                  )}
                  <ReferenceDot x={MVP} y={planejadoFinal} r={0}
                    label={rotulo(`Planejado até ${fmt(MVP)} · ${planejadoFinal}`, COR.planejado, { anchor: "end", dx: -8, dy: -10 })} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
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
          <PorSemana serie={serie} today={today} />
        </>
      )}
    </>
  );
}

const LEITURAS = [
  ["Faixa verde subindo", "É o burnup: o que foi concluído. Quanto mais perto do topo, menos falta."],
  ["Laranja e cinza juntas", "É o burndown: o que falta entregar. A faixa laranja é o que já começou; a cinza, o que ainda não foi tocado."],
  ["Faixa laranja engrossando", "Trabalho entrando em andamento sem sair. Indica bloqueio, não lentidão. Degraus no topo são entradas no escopo."],
] as const;

function Faixa({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className="inline-block h-2.5 w-4 rounded-sm" style={{ background: `color-mix(in srgb, ${color} 45%, transparent)` }} />
      {label}
    </span>
  );
}

/** Uma linha por semana já começada, com o estado no fechamento (ou hoje, na semana em curso). */
function PorSemana({ serie, today }: { serie: PontoFluxo[]; today: string }) {
  const porDia = new Map(serie.map((p) => [p.d, p]));
  const linhas = semanasDoDelivery(today)
    .filter((s) => s.situacao === "encerrada" || s.situacao === "em_curso")
    .map((s) => ({ s, p: porDia.get(s.corte) }))
    .filter((l): l is { s: typeof l.s; p: PontoFluxo } => !!l.p && l.p.concluido !== null);
  const num = `${TD} font-mono text-xs`;
  return (
    <Card className="mb-4 overflow-x-auto">
      <div className="px-5 pt-4"><span className="label">Por semana · no fechamento</span></div>
      <table className="mt-2 w-full text-sm">
        <thead>
          <tr className="border-b border-line text-left">
            {["Semana", "Escopo", "Concluído", "Concluídos na semana", "Em andamento", "A fazer", "Falta"].map((h) => <th key={h} className={TH}>{h}</th>)}
          </tr>
        </thead>
        <tbody>
          {linhas.map(({ s, p }, i) => {
            const antes = i > 0 ? linhas[i - 1]!.p.concluido! : 0;
            return (
              <tr key={s.n} className="border-t border-line-soft">
                <td className={TD}>
                  Semana {s.n} <span className="ml-1 font-mono text-xs text-text-3">{periodo(s)}{s.situacao === "em_curso" ? " · em curso" : ""}</span>
                </td>
                <td className={num}>{p.escopo}</td>
                <td className={`${num} text-green`}>{p.concluido}</td>
                <td className={`${num} ${p.concluido! - antes ? "text-green" : "text-text-3"}`}>+{p.concluido! - antes}</td>
                <td className={`${num} text-warn`}>{p.andamento}</td>
                <td className={`${num} text-text-2`}>{p.aFazer}</td>
                <td className={`${num} text-cyan`}>{p.andamento! + p.aFazer!}</td>
              </tr>
            );
          })}
          {!linhas.length && (
            <tr><td colSpan={7} className={`${TD} py-3 text-text-3`}>Nenhuma semana começou ainda.</td></tr>
          )}
        </tbody>
      </table>
    </Card>
  );
}

type TipProps = { active?: boolean; label?: string; payload?: { dataKey: string; value: number | null }[] };
function TipFluxo({ active, label, payload }: TipProps) {
  if (!active || !payload?.length) return null;
  const get = (k: string) => payload.find((p) => p.dataKey === k)?.value ?? null;
  const andamento = get("andamento"), aFazer = get("aFazer");
  const rows = [
    ["Escopo", get("escopo"), COR.escopo],
    ["Planejado", get("planejado"), COR.planejado],
    ["Concluído", get("concluido"), COR.concluido],
    ["Em andamento", andamento, COR.andamento],
    ["A fazer", aFazer, "var(--bu-text-2)"],
    ["Falta", andamento !== null && aFazer !== null ? andamento + aFazer : null, COR.escopo],
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
