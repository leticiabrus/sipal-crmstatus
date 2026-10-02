import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import { Card, PageHeader } from "@/components/AppNav";
import { AREA, Cronograma, FASE, PainelEntrega } from "@/components/cronograma";
import { FaixaDiscovery } from "@/components/painel";
import { AvancoPorModulo, PrazoCard, Selo } from "@/components/resumo";
import { ESTADOS, FATIAS, MODULOS, REVISAO, estadoDe, fmt, todayISO, usePersisted, type Estado, type Fatia } from "@/lib/burnup";

export const Route = createFileRoute("/fatias")({
  head: () => ({
    meta: [
      { title: "Entregas — cards por módulo" },
      { name: "description", content: "Cards agrupados por módulo, com a situação informada pelo time, em cronograma ou lista, e o avanço de cada módulo." },
      { property: "og:title", content: "Entregas — cards por módulo" },
      { property: "og:description", content: "Cards agrupados por módulo, com a situação informada pelo time." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: FatiasPage,
});

const ROW_BG: Partial<Record<Estado, string>> = {
  em_andamento: "color-mix(in srgb, var(--bu-warn) 6%, transparent)",
  parcial: "color-mix(in srgb, var(--bu-warn) 4%, transparent)",
  concluida: "color-mix(in srgb, var(--bu-green) 6%, transparent)",
};

type Visao = "lista" | "cronograma";
type Fase = Fatia["fase"];
type Area = Fatia["area"];

function FatiasPage() {
  const data = FATIAS;
  const hoje = todayISO();
  // O cronograma é o padrão a cada visita; os filtros ficam guardados e valem nas duas visões.
  const [visao, setVisao] = useState<Visao>("cronograma");
  const [estados, setEstados] = usePersisted<Estado[]>("fatias-estados", []);
  const [modulosSalvos, setModulos] = usePersisted<string[]>("fatias-modulos", []);
  // Filtro guardado de uma versão anterior pode citar módulo que não existe mais: vale só o que existe.
  const modulos = modulosSalvos.filter((id) => MODULOS.some((m) => m.id === id));
  const [fases, setFases] = usePersisted<Fase[]>("fatias-fases", []);
  const [areas, setAreas] = usePersisted<Area[]>("fatias-areas", []);
  const [aberta, setAberta] = useState<Fatia | null>(null);

  const visiveis = data.filter((f) =>
    (!estados.length || estados.includes(estadoDe(f))) &&
    (!modulos.length || modulos.includes(f.moduloId)) &&
    (!fases.length || fases.includes(f.fase)) &&
    (!areas.length || areas.includes(f.area)));
  // Grupos na ordem dos módulos.
  const grupos = MODULOS.map((m) => ({ m, fs: visiveis.filter((f) => f.moduloId === m.id) })).filter((g) => g.fs.length > 0);
  const conta = (p: (f: Fatia) => boolean) => data.filter(p).length;
  const algumFiltro = estados.length + modulos.length + fases.length + areas.length > 0;

  return (
    <>
      <PageHeader
        title="Entregas do"
        accent="escopo"
        subtitle={`Cards agrupados por módulo. A situação de cada card é a informada pelo time na planilha de ${fmt(REVISAO)}, e cada card tem o próprio prazo.`}
      >
        <div className="flex rounded-lg border border-line bg-bg/60 p-1">
          {(["cronograma", "lista"] as Visao[]).map((v) => (
            <button
              key={v}
              onClick={() => setVisao(v)}
              className={`rounded-md px-3 py-1.5 text-sm transition-colors duration-150 ${
                visao === v ? "bg-green font-semibold text-green-ink hover:bg-green-glow" : "text-text-2 hover:text-text"
              }`}
            >
              {v === "lista" ? "Lista" : "Cronograma"}
            </button>
          ))}
        </div>
      </PageHeader>

      {/* Uma linha só: cada filtro é um menu; o botão mostra quantas opções estão marcadas. */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <span className="label mr-1">Filtros</span>
        <Filtro rotulo="Módulos" sel={modulos} onChange={setModulos}
          opcoes={MODULOS.map((m) => ({ v: m.id, label: m.nome, n: conta((f) => f.moduloId === m.id) })).filter((o) => o.n > 0)} />
        <Filtro rotulo="Situação" sel={estados} onChange={setEstados}
          opcoes={ESTADOS.map((e) => ({ v: e.v, label: e.label, n: conta((f) => estadoDe(f) === e.v) })).filter((o) => o.n > 0)} />
        <Filtro rotulo="Fase" sel={fases} onChange={setFases}
          opcoes={(Object.keys(FASE) as Fase[]).map((v) => ({ v, label: FASE[v].rotulo, n: conta((f) => f.fase === v) }))} />
        <Filtro rotulo="Responsável" sel={areas} onChange={setAreas}
          opcoes={(Object.keys(AREA) as Area[]).map((v) => ({ v, label: AREA[v].rotulo, n: conta((f) => f.area === v) }))} />
        {algumFiltro && (
          <>
            <span className="font-mono text-xs text-text-3">{visiveis.length} de {data.length}</span>
            <button onClick={() => { setEstados([]); setModulos([]); setFases([]); setAreas([]); }}
              className="px-2 text-xs text-text-3 hover:text-text-2">limpar filtros</button>
          </>
        )}
      </div>

      <FaixaDiscovery />

      {visao === "cronograma" ? (
        <Cronograma fatias={visiveis} todas={data} hoje={hoje} onSelect={setAberta} />
      ) : (
        <Card className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line text-left">
                {["Id", "Nome", "Entrou", "Prazo", "Situação", "Responsável"].map((h) => (
                  <th key={h} className="label px-4 py-2.5 font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            {grupos.map(({ m, fs }) => {
              const done = fs.filter((f) => f.concluida).length;
              return (
                <tbody key={m.id}>
                  <tr className="bg-surface-2">
                    <td colSpan={6} className="px-4 py-2">
                      <span className="mr-2 inline-block h-2.5 w-2.5 rounded-full align-middle" style={{ background: m.cor }} aria-hidden />
                      <span className="font-semibold">{m.nome}</span>
                      <span className="ml-3 font-mono text-xs text-text-2">
                        {m.fim ? `prazos até ${fmt(m.fim)}` : "sem prazo"}{" · "}{done}/{fs.length} concluídos
                      </span>
                    </td>
                  </tr>
                  {fs.map((f) => {
                    const estado = estadoDe(f);
                    const isDone = estado === "concluida";
                    const removida = estado === "removida";
                    return (
                      <tr
                        key={f.id}
                        onClick={() => setAberta(f)}
                        title={removida ? `Removido em ${fmt(f.removida)}` : undefined}
                        className={`cursor-pointer border-t border-line-soft hover:bg-surface-2/60 ${removida ? "line-through opacity-40" : ""}`}
                        style={{ background: ROW_BG[estado] }}
                      >
                        <td className={`px-4 py-1.5 font-mono text-xs ${isDone ? "text-green" : "text-text-2"}`}>{f.id}</td>
                        <td className={`px-4 py-1.5 ${isDone ? "text-text-2" : ""}`}>{f.nome}</td>
                        <td className="px-4 py-1.5 font-mono text-xs text-text-2">{fmt(f.entradaEscopo)}</td>
                        <td className="px-4 py-1.5 font-mono text-xs text-text-2"><PrazoCard f={f} /></td>
                        <td className="px-4 py-1.5"><Selo f={f} /></td>
                        <td className="px-4 py-1.5 text-xs text-text-2">{AREA[f.area].rotulo}</td>
                      </tr>
                    );
                  })}
                </tbody>
              );
            })}
            {!visiveis.length && (
              <tbody><tr><td colSpan={6} className="px-4 py-3 text-text-3">Nenhum card com esses filtros.</td></tr></tbody>
            )}
          </table>
        </Card>
      )}

      <AvancoPorModulo fatias={data} className="mt-4" />

      {aberta && <PainelEntrega f={aberta} hoje={hoje} onClose={() => setAberta(null)} />}
    </>
  );
}

/** Filtro em menu: fechado ocupa um chip; aberto lista as opções com contagem. Fecha com ESC ou clicando fora. */
function Filtro<T extends string>({ rotulo, opcoes, sel, onChange }: {
  rotulo: string; opcoes: { v: T; label: string; n: number }[]; sel: T[]; onChange: (v: T[]) => void;
}) {
  const [aberto, setAberto] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!aberto) return;
    const fora = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setAberto(false); };
    const tecla = (e: KeyboardEvent) => { if (e.key === "Escape") setAberto(false); };
    document.addEventListener("mousedown", fora);
    window.addEventListener("keydown", tecla);
    return () => { document.removeEventListener("mousedown", fora); window.removeEventListener("keydown", tecla); };
  }, [aberto]);
  const toggle = (v: T) => onChange(sel.includes(v) ? sel.filter((x) => x !== v) : [...sel, v]);
  // Uma opção marcada aparece pelo nome; várias, pela contagem.
  const resumo = sel.length === 1 ? opcoes.find((o) => o.v === sel[0])?.label : sel.length ? `${sel.length}` : null;
  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setAberto(!aberto)}
        aria-expanded={aberto}
        className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs transition-colors duration-150 ${
          sel.length ? "border-teal bg-teal/15 text-text" : "border-line text-text-2 hover:text-text"
        }`}
      >
        {rotulo}
        {resumo && <span className="max-w-[140px] truncate font-mono text-text-2">· {resumo}</span>}
        <ChevronDown className={`h-3 w-3 text-text-3 ${aberto ? "rotate-180" : ""}`} aria-hidden />
      </button>
      {aberto && (
        <div className="absolute left-0 top-full z-40 mt-1 max-h-80 w-60 overflow-y-auto rounded-lg border border-line bg-surface-2 p-1">
          {opcoes.map((o) => {
            const on = sel.includes(o.v);
            return (
              <button
                key={o.v}
                onClick={() => toggle(o.v)}
                className={`flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors duration-150 hover:bg-surface ${on ? "text-text" : "text-text-2"}`}
              >
                <span className={`flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-sm border ${on ? "border-teal bg-teal" : "border-line"}`}>
                  {on && <Check className="h-3 w-3 text-bg" aria-hidden />}
                </span>
                <span className="flex-1 truncate">{o.label}</span>
                <span className="font-mono text-xs text-text-3">{o.n}</span>
              </button>
            );
          })}
          {sel.length > 0 && (
            <button onClick={() => onChange([])} className="mt-1 w-full border-t border-line-soft px-2 pb-1 pt-2 text-left text-xs text-text-3 hover:text-text-2">
              limpar {rotulo.toLowerCase()}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
