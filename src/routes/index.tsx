import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import {
  Area, CartesianGrid, ComposedChart, Line, ReferenceDot, ReferenceLine,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { Card, PageHeader } from "@/components/AppNav";
import {
  END, MARCOS, START, buildSeries, builtAt, escopoAt, fmt, todayISO,
  useFatias, usePersisted, type Unit,
} from "@/lib/burnup";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Burnup — escopo, planejado e construído" },
      { name: "description", content: "Gráfico de burnup do projeto com escopo, planejado e construído ao longo do tempo." },
      { property: "og:title", content: "Burnup — escopo, planejado e construído" },
      { property: "og:description", content: "Gráfico de burnup do projeto com escopo, planejado e construído." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: BurnupPage,
});

function BurnupPage() {
  const { data = [], isLoading } = useFatias();
  const [unit, setUnit] = usePersisted<Unit>("bu-unit", "fatia");
  const [sel, setSel] = usePersisted<string[]>("bu-epicos", []);
  const today = todayISO();
  const epicos = useMemo(() => [...new Set(data.map((f) => f.epico))], [data]);
  const fs = sel.length ? data.filter((f) => sel.includes(f.epico)) : data;
  const series = useMemo(() => buildSeries(fs, unit, today), [fs, unit, today]);
  const capDay = today > END ? END : today;
  const built = builtAt(fs, capDay, unit);
  const escopo = escopoAt(fs, capDay, unit);
  const total = escopoAt(fs, END, unit);
  const pct = total ? Math.round((built / total) * 100) : 0;
  const last = series.find((p) => p.d === capDay);
  const toggle = (e: string) => setSel(sel.includes(e) ? sel.filter((x) => x !== e) : [...sel, e]);

  return (
    <>
      <PageHeader title="Burnup do" accent="projeto">
        <div className="flex rounded-lg border border-line bg-bg/60 p-1">
          {(["fatia", "peso"] as Unit[]).map((u) => (
            <button
              key={u}
              onClick={() => setUnit(u)}
              className={`rounded-md px-3 py-1.5 text-sm transition-colors duration-150 ${
                unit === u ? "bg-green font-semibold text-green-ink hover:bg-green-glow" : "text-text-2 hover:text-text"
              }`}
            >
              Por {u}
            </button>
          ))}
        </div>
      </PageHeader>

      <div className="mb-4 grid grid-cols-2 gap-4 md:grid-cols-4">
        <Stat label="Construído / total" value={`${built}/${total}`} />
        <Stat label="Percentual" value={`${pct}%`} accent />
        <Stat label="Em escopo hoje" value={String(escopo)} />
        <Stat label="Restante" value={String(total - built)} />
      </div>

      <Card className="mb-4 p-5">
        <div className="mb-3 flex items-center justify-between">
          <span className="label">Burnup · por {unit}</span>
          <div className="flex gap-4 text-xs text-text-2">
            <Legend color="var(--bu-cyan)" label="Escopo" />
            <Legend color="var(--bu-text-3)" label="Planejado" dashed />
            <Legend color="var(--bu-green)" label="Construído" />
          </div>
        </div>
        <div className="h-[420px]">
          {isLoading ? (
            <div className="grid h-full place-items-center font-mono text-sm text-text-3">carregando…</div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={series} margin={{ top: 24, right: 16, left: -8, bottom: 0 }}>
                <defs>
                  <linearGradient id="gBuilt" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--bu-green)" stopOpacity={0.18} />
                    <stop offset="100%" stopColor="var(--bu-green)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} stroke="var(--bu-border-soft)" />
                <XAxis
                  dataKey="d" type="category" tickFormatter={fmt} minTickGap={40}
                  tick={{ fill: "var(--bu-text-3)", fontSize: 11, fontFamily: "JetBrains Mono" }}
                  axisLine={{ stroke: "var(--bu-border)" }} tickLine={false}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fill: "var(--bu-text-3)", fontSize: 11, fontFamily: "JetBrains Mono" }}
                  axisLine={false} tickLine={false}
                />
                <Tooltip content={<ChartTip />} cursor={{ stroke: "var(--bu-border)" }} />
                {MARCOS.map((m) => (
                  <ReferenceLine key={m} x={m} stroke="var(--bu-border)" strokeDasharray="4 4"
                    label={{ value: fmt(m), position: "insideTopLeft", fill: "var(--bu-text-3)", fontSize: 10, fontFamily: "JetBrains Mono" }} />
                ))}
                {today >= START && today <= END && (
                  <ReferenceLine x={today} stroke="var(--bu-warn)"
                    label={{ value: `hoje ${fmt(today)}`, position: "top", fill: "var(--bu-warn)", fontSize: 11, fontFamily: "JetBrains Mono" }} />
                )}
                <Area dataKey="construido" type="monotone" stroke="none" fill="url(#gBuilt)" isAnimationActive={false} />
                <Line dataKey="escopo" type="stepAfter" stroke="var(--bu-cyan)" strokeWidth={2} dot={false} isAnimationActive={false} />
                <Line dataKey="planejado" type="monotone" stroke="var(--bu-text-3)" strokeWidth={2} strokeDasharray="6 4" dot={false} isAnimationActive={false} />
                <Line dataKey="construido" type="monotone" stroke="var(--bu-green)" strokeWidth={3} dot={false} isAnimationActive={false} />
                {last && last.construido !== null && (
                  <>
                    <ReferenceDot x={last.d} y={last.construido} r={9} fill="var(--bu-green)" fillOpacity={0.2} stroke="none" />
                    <ReferenceDot x={last.d} y={last.construido} r={4} fill="var(--bu-green-glow)" stroke="var(--bu-bg)" strokeWidth={2} />
                  </>
                )}
              </ComposedChart>
            </ResponsiveContainer>
          )}
        </div>
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
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <Card className="p-4">
      <div className="label">{label}</div>
      <div className={`mt-2 font-mono text-3xl font-semibold ${accent ? "text-green" : "text-text"}`}>{value}</div>
    </Card>
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
