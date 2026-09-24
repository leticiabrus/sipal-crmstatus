import { createFileRoute } from "@tanstack/react-router";
import { Card, PageHeader } from "@/components/AppNav";
import { SITUACOES, fmt, todayISO, useFatias, useUpdateFatia, type Fatia } from "@/lib/burnup";

export const Route = createFileRoute("/fatias")({
  head: () => ({
    meta: [
      { title: "Fatias — situação por épico" },
      { name: "description", content: "Tabela de fatias agrupada por épico, com situação e conclusão em um clique." },
      { property: "og:title", content: "Fatias — situação por épico" },
      { property: "og:description", content: "Tabela de fatias agrupada por épico." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: FatiasPage,
});

function FatiasPage() {
  const { data = [] } = useFatias();
  const upd = useUpdateFatia();
  const groups = new Map<string, Fatia[]>();
  data.forEach((f) => groups.set(f.epico, [...(groups.get(f.epico) ?? []), f]));

  const setSituacao = (f: Fatia, v: string) =>
    upd.mutate({
      id: f.id,
      patch: { situacao: v, concluida: v === "concluida" ? f.concluida ?? todayISO() : null },
    });

  return (
    <>
      <PageHeader title="Fatias do" accent="escopo" />
      <Card className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line text-left">
              {["Id", "Nome", "Peso", "Entrou", "Marco", "Situação", ""].map((h) => (
                <th key={h} className="label px-4 py-2.5 font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          {[...groups].map(([epico, fs]) => {
            const done = fs.filter((f) => f.concluida).length;
            return (
              <tbody key={epico}>
                <tr className="bg-surface-2">
                  <td colSpan={7} className="px-4 py-2 font-semibold">
                    {epico} <span className="ml-2 font-mono text-xs font-normal text-text-2">{done}/{fs.length}</span>
                  </td>
                </tr>
                {fs.map((f) => {
                  const isDone = !!f.concluida;
                  const s = SITUACOES.find((x) => x.v === (isDone ? "concluida" : f.situacao)) ?? SITUACOES[0];
                  return (
                    <tr key={f.id} className={`border-t border-line-soft ${f.removida ? "line-through opacity-40" : ""}`}>
                      <td className={`px-4 py-1.5 font-mono text-xs ${isDone ? "text-green" : "text-text-2"}`}>{f.id}</td>
                      <td className={`px-4 py-1.5 ${isDone ? "text-text-2" : ""}`}>{f.nome}</td>
                      <td className="px-4 py-1.5 font-mono text-xs">{f.peso}</td>
                      <td className="px-4 py-1.5 font-mono text-xs text-text-2">{fmt(f.entrou_escopo)}</td>
                      <td className="px-4 py-1.5 font-mono text-xs text-text-2">{fmt(f.marco)}</td>
                      <td className="px-4 py-1.5">
                        <select
                          value={s.v}
                          onChange={(e) => setSituacao(f, e.target.value)}
                          className="cursor-pointer rounded-full border-0 px-2.5 py-0.5 text-xs font-medium outline-none"
                          style={{ color: s.color, background: `color-mix(in srgb, ${s.color} 12%, transparent)` }}
                        >
                          {SITUACOES.map((o) => (
                            <option key={o.v} value={o.v} className="bg-surface-2 text-text">{o.label}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-1.5 text-right">
                        {isDone ? (
                          <span className="font-mono text-xs text-text-3">{fmt(f.concluida)}</span>
                        ) : (
                          <button
                            onClick={() => setSituacao(f, "concluida")}
                            className="rounded-lg bg-green px-2.5 py-1 text-xs font-semibold text-green-ink transition-colors duration-150 hover:bg-green-glow"
                          >
                            Concluir hoje
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            );
          })}
        </table>
      </Card>
    </>
  );
}
