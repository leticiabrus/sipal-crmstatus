import { createFileRoute } from "@tanstack/react-router";
import { Card, PageHeader } from "@/components/AppNav";
import { MARCOS, builtAt, diffDays, fmt, plannedAt, todayISO, useFatias, usePersisted, type Unit } from "@/lib/burnup";

export const Route = createFileRoute("/marcos")({
  head: () => ({
    meta: [
      { title: "Marcos — planejado vs realizado" },
      { name: "description", content: "Comparação de planejado e realizado em cada marco, com ritmo semanal exigido." },
      { property: "og:title", content: "Marcos — planejado vs realizado" },
      { property: "og:description", content: "Planejado, realizado e ritmo exigido por marco." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: MarcosPage,
});

const n1 = (v: number) => (Math.round(v * 10) / 10).toLocaleString("pt-BR");

function MarcosPage() {
  const { data = [] } = useFatias();
  const [unit] = usePersisted<Unit>("bu-unit", "fatia");
  const today = todayISO();
  const builtNow = builtAt(data, today, unit);

  return (
    <>
      <PageHeader title="Marcos e" accent="ritmo" />
      <p className="mb-3 text-sm text-text-2">Contando por <span className="font-mono text-text">{unit}</span>. Troque na tela de Burnup.</p>
      <Card className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line text-left">
              {["Marco", "Planejado acumulado", "Realizado", "Diferença", "Ritmo semanal exigido"].map((h) => (
                <th key={h} className="label px-4 py-2.5 font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {MARCOS.map((m) => {
              const plan = plannedAt(data, m, unit);
              const real = builtAt(data, m < today ? m : today, unit);
              const diff = real - plan;
              const days = diffDays(today, m);
              const ritmo = days > 0 ? Math.max(0, plan - builtNow) / (days / 7) : null;
              return (
                <tr key={m} className="border-t border-line-soft font-mono">
                  <td className="px-4 py-3">{fmt(m)}/2026</td>
                  <td className="px-4 py-3">{n1(plan)}</td>
                  <td className="px-4 py-3">{real}</td>
                  <td className={`px-4 py-3 ${diff < 0 ? "text-danger" : "text-green"}`}>{diff > 0 ? "+" : ""}{n1(diff)}</td>
                  <td className="px-4 py-3 text-text-2">{ritmo === null ? "—" : `${n1(ritmo)} / sem`}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>
    </>
  );
}
