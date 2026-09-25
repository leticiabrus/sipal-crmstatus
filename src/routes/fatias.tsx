import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import { Card, PageHeader } from "@/components/AppNav";
import { AREA, Cronograma, DENSIDADE_ALTA, FASE, PainelEntrega, SEM_DATA, densidade } from "@/components/cronograma";
import { FaixaDiscovery, TD, TH } from "@/components/painel";
import { ESTADOS, FATIAS, MODULOS, estadoDe, fmt, n1, periodo, rotuloJanela, todayISO, usePersisted, type Estado, type Fatia } from "@/lib/burnup";

export const Route = createFileRoute("/fatias")({
  head: () => ({
    meta: [
      { title: "Entregas — cards por módulo" },
      { name: "description", content: "Cards agrupados por módulo do roadmap, com o estado derivado das datas, em cronograma ou lista, e a densidade de cada módulo." },
      { property: "og:title", content: "Entregas — cards por módulo" },
      { property: "og:description", content: "Cards agrupados por módulo do roadmap." },
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

type Visao = "lista" | "cronograma";
type Fase = Fatia["fase"];
type Area = Fatia["area"];

function FatiasPage() {
  const data = FATIAS;
  const hoje = todayISO();
  // O cronograma é o padrão a cada visita; os filtros ficam guardados e valem nas duas visões.
  const [visao, setVisao] = useState<Visao>("cronograma");
  const [estados, setEstados] = usePersisted<Estado[]>("fatias-estados", []);
  const [modulos, setModulos] = usePersisted<string[]>("fatias-modulos", []);
  const [fases, setFases] = usePersisted<Fase[]>("fatias-fases", []);
  const [areas, setAreas] = usePersisted<Area[]>("fatias-areas", []);
  const [aberta, setAberta] = useState<Fatia | null>(null);

  const visiveis = data.filter((f) =>
    (!estados.length || estados.includes(estadoDe(f))) &&
    (!modulos.length || modulos.includes(f.moduloId)) &&
    (!fases.length || fases.includes(f.fase)) &&
    (!areas.length || areas.includes(f.area)));
  // Grupos na ordem do roadmap; a densidade conta todos os cards do módulo, com ou sem filtro.
  const grupos = MODULOS.map((m) => ({
    m,
    fs: visiveis.filter((f) => f.moduloId === m.id),
    doModulo: data.filter((f) => f.moduloId === m.id && !f.removida).length,
  })).filter((g) => g.fs.length > 0);
  const conta = (p: (f: Fatia) => boolean) => data.filter(p).length;
  const algumFiltro = estados.length + modulos.length + fases.length + areas.length > 0;

  return (
    <>
      <PageHeader
        title="Entregas do"
        accent="escopo"
        subtitle="Cards agrupados por módulo do roadmap acordado em 24/09. O estado de cada card sai das datas de início e de conclusão registradas no arquivo de dados."
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
          opcoes={MODULOS.map((m) => ({ v: m.id, label: `${m.id} · ${m.nome}`, n: conta((f) => f.moduloId === m.id) }))} />
        <Filtro rotulo="Situação" sel={estados} onChange={setEstados}
          opcoes={ESTADOS.map((e) => ({ v: e.v, label: e.label, n: conta((f) => estadoDe(f) === e.v) }))} />
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
                {["Id", "Nome", "Critérios", "Entrou", "Prazo", "Iniciado", "Situação", "Concluído"].map((h) => (
                  <th key={h} className="label px-4 py-2.5 font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            {grupos.map(({ m, fs, doModulo }) => {
              const done = fs.filter((f) => f.concluida).length;
              const dens = densidade(m, doModulo);
              return (
                <tbody key={m.id}>
                  <tr className="bg-surface-2">
                    <td colSpan={8} className="px-4 py-2">
                      <span className="mr-2 font-mono text-xs text-text-2">{m.id}</span>
                      <span className={`font-semibold ${m.id === "SM" ? "text-warn" : ""}`}>{m.nome}</span>
                      <span className="ml-3 font-mono text-xs text-text-2">
                        {m.inicio && m.fim ? `${m.semanas} sem · ${periodo(m.inicio, m.fim)}` : SEM_DATA[m.id]?.rotulo}
                        {" · "}{done}/{fs.length} concluídos
                        {dens !== null && <> · <span className={dens > DENSIDADE_ALTA ? "text-warn" : ""}>{n1(dens)} cards/sem</span></>}
                        {rotuloJanela(m) && <span className="text-warn"> · {rotuloJanela(m)}</span>}
                      </span>
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
                        onClick={() => setAberta(f)}
                        title={removida ? `Removido em ${fmt(f.removida)}` : undefined}
                        className={`cursor-pointer border-t border-line-soft hover:bg-surface-2/60 ${removida ? "line-through opacity-40" : ""}`}
                        style={{ background: ROW_BG[estado] }}
                      >
                        <td className={`px-4 py-1.5 font-mono text-xs ${isDone ? "text-green" : "text-text-2"}`}>{f.id}</td>
                        <td className={`px-4 py-1.5 ${isDone ? "text-text-2" : ""}`}>{f.nome}</td>
                        <td className="px-4 py-1.5 font-mono text-xs">{f.criteriosAceite}</td>
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
            {!visiveis.length && (
              <tbody><tr><td colSpan={8} className="px-4 py-3 text-text-3">Nenhum card com esses filtros.</td></tr></tbody>
            )}
          </table>
        </Card>
      )}

      <DensidadePorModulo fatias={data} />

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

/** Nota de cada módulo na tabela de densidade: os achados da extração, sem julgamento de viabilidade. */
function notaDensidade(id: string, cards: number, dens: number | null): { texto: string; warn: boolean } {
  if (id === "SM") return { texto: "a alocar", warn: true };
  if (id === "BL") return { texto: "em paralelo, fora da contagem de semanas", warn: false };
  if (id === "M5" || id === "M6") {
    // A marcação de janela só entra se o módulo cair depois do prazo; com as janelas comprimidas até 10/11, não cai.
    const janela = rotuloJanela(MODULOS.find((m) => m.id === id)!);
    return { texto: janela ? `${janela} · escopo a confirmar` : "escopo a confirmar", warn: janela !== null };
  }
  if (id === "M7") return { texto: "escopo a confirmar · a estimar", warn: false };
  if (dens !== null && dens > DENSIDADE_ALTA) return { texto: `maior densidade: ${cards} cards`, warn: true };
  return { texto: "", warn: false };
}

/**
 * Densidade por módulo: cards por semana estimada. Destaque acima de ${DENSIDADE_ALTA} por semana.
 * Informação para a conversa de alocação, não veredito.
 */
function DensidadePorModulo({ fatias }: { fatias: Fatia[] }) {
  const linhas = MODULOS.map((m) => {
    const cards = fatias.filter((f) => f.moduloId === m.id && !f.removida).length;
    const dens = densidade(m, cards);
    return { m, cards, dens, nota: notaDensidade(m.id, cards, dens) };
  });
  const num = `${TD} font-mono text-xs`;
  return (
    <Card className="mt-4 overflow-x-auto">
      <div className="px-5 pt-4"><span className="label">Densidade por módulo · cards por semana estimada</span></div>
      <table className="mt-2 w-full text-sm">
        <thead>
          <tr className="border-b border-line text-left">
            {["Módulo", "Semanas", "Cards", "Cards por semana", "Observação"].map((h) => <th key={h} className={TH}>{h}</th>)}
          </tr>
        </thead>
        <tbody>
          {linhas.map(({ m, cards, dens, nota }) => {
            const alta = dens !== null && dens > DENSIDADE_ALTA;
            return (
              <tr key={m.id} className="border-t border-line-soft"
                style={alta ? { background: "color-mix(in srgb, var(--bu-warn) 6%, transparent)" } : undefined}>
                <td className={TD}>
                  <span className="mr-2 font-mono text-xs text-text-2">{m.id}</span>
                  <span className={m.id === "SM" ? "text-warn" : ""}>{m.nome}</span>
                </td>
                <td className={num}>{m.semanas ?? "—"}</td>
                <td className={num}>{cards}</td>
                <td className={`${num} ${alta ? "font-semibold text-warn" : ""}`}>{dens === null ? "—" : n1(dens)}</td>
                <td className={`${TD} ${nota.warn ? "text-warn" : "text-text-2"}`}>{nota.texto}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </Card>
  );
}
