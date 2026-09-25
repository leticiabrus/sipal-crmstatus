import { createFileRoute } from "@tanstack/react-router";
import { Card, PageHeader } from "@/components/AppNav";
import { ESTIMADOS, builtAt, diffDays, estadoDe, fmt, n1, periodo, planejadoAt, todayISO, FATIAS } from "@/lib/burnup";

export const Route = createFileRoute("/marcos")({
  head: () => ({
    meta: [
      { title: "Prazos — planejado vs realizado" },
      { name: "description", content: "Comparação de planejado e realizado no fim de cada módulo, com ritmo semanal exigido." },
      { property: "og:title", content: "Prazos — planejado vs realizado" },
      { property: "og:description", content: "Planejado, realizado e ritmo exigido por fim de módulo." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: MarcosPage,
});

function MarcosPage() {
  const data = FATIAS;
  const today = todayISO();
  const builtNow = builtAt(data, today);

  return (
    <>
      <PageHeader title="Prazos e" accent="ritmo" />
      <p className="mb-3 text-sm text-text-2">
        Cada prazo é o fim de um módulo, comprimido na janela até 10/11 com base na alocação de dois desenvolvedores.
        Bloqueios em paralelo e cards sem módulo não têm data e ficam fora desta tabela.
      </p>
      <Card className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line text-left">
              {["Prazo", "Módulo", "Acumulado até o prazo", "Realizado", "Situação", "Cards por semana", "Em andamento"].map((h) => (
                <th key={h} className="label px-4 py-2.5 font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ESTIMADOS.map((m) => {
              const plan = planejadoAt(data, m.fim);
              const real = builtAt(data, m.fim < today ? m.fim : today);
              // Diferença só existe para prazo vencido: antes disso não há o que apurar.
              const vencido = m.fim < today;
              const diff = real - plan;
              const days = diffDays(today, m.fim);
              const ritmo = days > 0 ? Math.max(0, plan - builtNow) / (days / 7) : null;
              const doModulo = data.filter((f) => f.moduloId === m.id && !f.removida);
              const emVoo = doModulo.filter((f) => estadoDe(f) === "em_andamento").length;
              return (
                <tr key={m.id} className="border-t border-line-soft font-mono">
                  <td className="px-4 py-3">{fmt(m.fim)}/2026</td>
                  <td className="px-4 py-3 font-sans">
                    <span className="mr-2 font-mono text-xs text-text-2">{m.id}</span>{m.nome}
                    <span className="ml-2 font-mono text-xs text-text-3">{periodo(m.inicio, m.fim)}</span>
                  </td>
                  <td className="px-4 py-3">{n1(plan)}</td>
                  <td className="px-4 py-3">{real}</td>
                  <td className={`px-4 py-3 ${!vencido ? "text-text-3" : diff < 0 ? "text-warn" : "text-green"}`}>
                    {vencido ? `${diff > 0 ? "+" : ""}${n1(diff)}` : <>— <span className="font-sans text-xs">a vencer</span></>}
                  </td>
                  <td className="px-4 py-3 text-text-2">{ritmo === null ? "—" : `${n1(ritmo)} / sem`}</td>
                  <td className={`px-4 py-3 ${emVoo ? "text-warn" : "text-text-3"}`}>{emVoo} de {doModulo.length}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>
    </>
  );
}
