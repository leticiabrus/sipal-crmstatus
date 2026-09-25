import { createFileRoute } from "@tanstack/react-router";
import { Card, PageHeader } from "@/components/AppNav";
import { ESTADOS, FATIAS, estadoDe, fmt, usePersisted, type Estado, type Fatia } from "@/lib/burnup";

export const Route = createFileRoute("/fatias")({
  head: () => ({
    meta: [
      { title: "Fatias — situação por épico" },
      { name: "description", content: "Tabela de fatias agrupada por épico, com o estado derivado das datas." },
      { property: "og:title", content: "Fatias — situação por épico" },
      { property: "og:description", content: "Tabela de fatias agrupada por épico." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: FatiasPage,
});

const ROW_BG: Partial<Record<Estado, string>> = {
  em_andamento: "color-mix(in srgb, var(--bu-warn) 6%, transparent)",
  concluida: "color-mix(in srgb, var(--bu-green) 6%, transparent)",
};

function FatiasPage() {
  const data = FATIAS;
  const [filtro, setFiltro] = usePersisted<Estado[]>("fatias-estados", []);
  const visiveis = filtro.length ? data.filter((f) => filtro.includes(estadoDe(f))) : data;
  const groups = new Map<string, Fatia[]>();
  visiveis.forEach((f) => groups.set(f.epico, [...(groups.get(f.epico) ?? []), f]));
  const toggle = (e: Estado) => setFiltro(filtro.includes(e) ? filtro.filter((x) => x !== e) : [...filtro, e]);

  return (
    <>
      <PageHeader
        title="Fatias do"
        accent="escopo"
        subtitle="Estado derivado das datas em src/data/fatias.ts. Iniciar é preencher iniciada; concluir é preencher concluida."
      />
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <span className="label mr-2">Estados</span>
        {ESTADOS.map((e) => {
          const on = filtro.includes(e.v);
          return (
            <button
              key={e.v}
              onClick={() => toggle(e.v)}
              className={`rounded-full border px-3 py-1 text-xs transition-colors duration-150 ${
                on ? "border-teal bg-teal/15 text-text" : "border-line text-text-2 hover:text-text"
              }`}
            >
              {e.label} <span className="ml-1 font-mono text-text-3">{data.filter((f) => estadoDe(f) === e.v).length}</span>
            </button>
          );
        })}
        {filtro.length > 0 && (
          <button onClick={() => setFiltro([])} className="px-2 text-xs text-text-3 hover:text-text-2">limpar</button>
        )}
      </div>
      <Card className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line text-left">
              {["Id", "Nome", "SP", "Entrou", "Marco", "Iniciada", "Situação", "Concluída"].map((h) => (
                <th key={h} className="label px-4 py-2.5 font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          {[...groups].map(([epico, fs]) => {
            const done = fs.filter((f) => f.concluida).length;
            return (
              <tbody key={epico}>
                <tr className="bg-surface-2">
                  <td colSpan={8} className="px-4 py-2 font-semibold">
                    {epico} <span className="ml-2 font-mono text-xs font-normal text-text-2">{done}/{fs.length}</span>
                  </td>
                </tr>
                {fs.map((f) => {
                  const estado = estadoDe(f);
                  const s = ESTADOS.find((x) => x.v === estado) ?? ESTADOS[0];
                  const isDone = estado === "concluida";
                  const removida = estado === "removida";
                  return (
                    <tr
                      key={f.id}
                      title={removida ? `Removida em ${fmt(f.removida)}` : undefined}
                      className={`border-t border-line-soft ${removida ? "line-through opacity-40" : ""}`}
                      style={{ background: ROW_BG[estado] }}
                    >
                      <td className={`px-4 py-1.5 font-mono text-xs ${isDone ? "text-green" : "text-text-2"}`}>{f.id}</td>
                      <td className={`px-4 py-1.5 ${isDone ? "text-text-2" : ""}`}>{f.nome}</td>
                      <td className="px-4 py-1.5 font-mono text-xs">{f.peso}</td>
                      <td className="px-4 py-1.5 font-mono text-xs text-text-2">{fmt(f.entradaEscopo)}</td>
                      <td className="px-4 py-1.5 font-mono text-xs text-text-2">{fmt(f.marco)}</td>
                      <td className="px-4 py-1.5 font-mono text-xs text-text-2">{fmt(f.iniciada)}</td>
                      <td className="px-4 py-1.5">
                        <span
                          className="rounded-full px-2.5 py-0.5 text-xs font-medium"
                          style={{ color: s.color, background: `color-mix(in srgb, ${s.color} 12%, transparent)` }}
                        >
                          {s.label}
                        </span>
                      </td>
                      <td className="px-4 py-1.5 font-mono text-xs text-text-3">{fmt(f.concluida)}</td>
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
