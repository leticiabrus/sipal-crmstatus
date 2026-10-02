// Resumo da planilha de 02/10, comum às telas: os cinco cartões, a nota das curvas e as tabelas de
// bloqueios, prazos e avanço por módulo. Todo número sai das funções de contagem, nenhum é escrito aqui.
import { useEffect, useState } from "react";
import { Hourglass } from "lucide-react";
import { Card } from "@/components/AppNav";
import { CartaoNumero, DESTAQUE, Stat, TD, TH } from "@/components/painel";
import { dependencias } from "@/components/cronograma";
import {
  FATIAS, MVP, MVP_PRAZO, REVISAO, avancoPorModulo, contagem, ehBloqueio, estadoDe, fmt, porExtenso, seloEstado, tabelaPrazos,
  type Fatia,
} from "@/lib/burnup";

/** Os cinco cartões de número: concluído, em andamento, a fazer, bloqueios e o cronômetro do MVP. */
export function CartoesResumo({ fatias = FATIAS }: { fatias?: Fatia[] }) {
  const c = contagem(fatias);
  return (
    <div className="mb-4 grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-5">
      <Stat label="Concluído" value={String(c.concluidos)} tone="green" note={`de ${c.total} cards · ${c.pct}%`} />
      <Stat label="Em andamento" value={String(c.emAndamento)} tone="warn" note="começaram e não concluíram" />
      <Stat label="A fazer" value={String(c.aFazer)} tone="muted" note={`${c.semInicio} sem início, ${c.parciais} parcia${c.parciais === 1 ? "l" : "is"}`} />
      <Stat label="Bloqueios" value={String(c.bloqueios)} tone="warn" note="com terceiros" />
      <ContagemMvp />
    </div>
  );
}

const dois = (n: number) => String(n).padStart(2, "0");

/**
 * Contagem regressiva até o prazo do MVP. Único cartão com borda colorida.
 * Só calcula no cliente: o servidor não conhece o relógio do navegador e a hidratação divergiria.
 */
export function ContagemMvp() {
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
      className={DESTAQUE}
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

/** Nota abaixo das curvas: a posição de cada card é aproximada, e a regra fica dita. */
export function NotaCurva() {
  return (
    <p className="mt-3 text-xs text-text-3">
      A data de conclusão por card não é registrada. A curva usa o prazo como referência. Concluídos com prazo depois de{" "}
      {fmt(REVISAO)}, ou sem prazo, contam em {fmt(REVISAO)}, data da planilha; em andamento conta desde a entrada no escopo.
    </p>
  );
}

/** Selo de situação: parcial com borda tracejada, distinto de em andamento. */
export function Selo({ f }: { f: Fatia }) {
  const s = seloEstado(estadoDe(f));
  return <span className="whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium" style={s.style}>{s.label}</span>;
}

/** Prazo com o histórico do replanejamento, em texto pequeno, sem linguagem de atraso. */
export function PrazoCard({ f, className = "" }: { f: Fatia; className?: string }) {
  return (
    <span className={`inline-flex flex-col leading-tight ${className}`}>
      <span>{f.marco ? fmt(f.marco) : "sem prazo"}</span>
      {f.prazoOriginal && <span className="font-sans text-[10px] font-normal text-text-3">replanejado de {fmt(f.prazoOriginal)}</span>}
    </span>
  );
}

const FUNDO_WARN = { background: "color-mix(in srgb, var(--bu-warn) 5%, transparent)" };

/** O que depende de fora do time. Fica acima das outras tabelas. */
export function TabelaBloqueios({ fatias = FATIAS }: { fatias?: Fatia[] }) {
  const itens = fatias.filter(ehBloqueio).sort((a, b) => (a.marco ?? "9999").localeCompare(b.marco ?? "9999") || a.id.localeCompare(b.id));
  const ids = new Set(fatias.map((f) => f.id));
  const prazos = [...new Set(itens.map((f) => f.marco))];
  const todosEmAndamento = itens.length > 0 && itens.every((f) => estadoDe(f) === "em_andamento");
  const subtitulo = !itens.length
    ? "Nenhum bloqueio com terceiros em aberto."
    : [
        `${porExtenso(itens.length)} ${itens.length === 1 ? "item" : "itens"}`,
        todosEmAndamento ? (itens.length === 1 ? "em andamento" : "todos em andamento") : null,
        prazos.length === 1 && prazos[0] ? `com prazo acordado para ${fmt(prazos[0])}` : null,
      ].filter(Boolean).join(", ") + ".";
  return (
    <Card className="mb-4 overflow-x-auto">
      <div className="px-5 pt-4">
        <span className="label">Bloqueios com terceiros</span>
        <p className="mt-1 text-sm text-text-2">{subtitulo}</p>
      </div>
      <table className="mt-2 w-full text-sm">
        <thead>
          <tr className="border-b border-line text-left">
            {["Card", "O que é", "Prazo", "Com quem", "Situação"].map((h) => <th key={h} className={TH}>{h}</th>)}
          </tr>
        </thead>
        <tbody>
          {itens.map((f) => {
            const { externo, refs } = dependencias(f, ids);
            return (
              <tr key={f.id} className="border-t border-line-soft" style={FUNDO_WARN}>
                <td className={`${TD} font-mono text-xs text-warn`}>{f.id}</td>
                <td className={TD}>{f.nome}</td>
                <td className={`${TD} font-mono text-xs text-warn`}><PrazoCard f={f} /></td>
                <td className={`${TD} text-text-2`}>{[externo, ...refs].filter(Boolean).join(", ") || "—"}</td>
                <td className={TD}><Selo f={f} /></td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </Card>
  );
}

const traco = (n: number) => (n ? String(n) : "—");

/** Avanço por prazo. Linhas abaixo de 50% em --warn: é onde a conversa precisa ir. */
export function TabelaPrazos({ fatias = FATIAS }: { fatias?: Fatia[] }) {
  const linhas = tabelaPrazos(fatias);
  const total = contagem(fatias);
  const num = `${TD} font-mono text-xs`;
  return (
    <Card className="mb-4 overflow-x-auto">
      <div className="px-5 pt-4"><span className="label">Prazos</span></div>
      <table className="mt-2 w-full text-sm">
        <thead>
          <tr className="border-b border-line text-left">
            {["Prazo", "Cards", "Concluídos", "Em andamento", "A fazer", "Avanço"].map((h) => <th key={h} className={TH}>{h}</th>)}
          </tr>
        </thead>
        <tbody>
          {linhas.map((l) => {
            const baixo = l.pct < 50;
            return (
              <tr key={l.d ?? "sem"} className={`border-t border-line-soft ${baixo ? "text-warn" : ""}`} style={baixo ? FUNDO_WARN : undefined}>
                <td className={num}>{l.d ? fmt(l.d) : "sem prazo"}</td>
                <td className={num}>{l.total}</td>
                <td className={num}>{traco(l.concluidos)}</td>
                <td className={num}>{traco(l.emAndamento)}</td>
                <td className={num}>{traco(l.aFazer)}</td>
                <td className={num}>{l.soBloqueios && !l.concluidos ? <span className="font-sans">bloqueios</span> : `${l.pct}%`}</td>
              </tr>
            );
          })}
          <tr className="border-t border-line font-semibold">
            <td className={TD}>Total</td>
            <td className={num}>{total.total}</td>
            <td className={num}>{total.concluidos}</td>
            <td className={num}>{total.emAndamento}</td>
            <td className={num}>{total.aFazer}</td>
            <td className={num}>{total.pct}%</td>
          </tr>
        </tbody>
      </table>
    </Card>
  );
}

/** Avanço por módulo, com barra: verde acima de 70%, laranja abaixo. */
export function AvancoPorModulo({ fatias = FATIAS, className = "mb-4" }: { fatias?: Fatia[]; className?: string }) {
  const linhas = avancoPorModulo(fatias);
  const num = `${TD} font-mono text-xs`;
  return (
    <Card className={`${className} overflow-x-auto`}>
      <div className="px-5 pt-4"><span className="label">Avanço por módulo</span></div>
      <table className="mt-2 w-full text-sm">
        <thead>
          <tr className="border-b border-line text-left">
            {["Módulo", "Cards", "Concluídos", "Avanço"].map((h) => <th key={h} className={TH}>{h}</th>)}
          </tr>
        </thead>
        <tbody>
          {linhas.map(({ m, total, concluidos, emAndamento, pct }) => {
            const cor = pct > 70 ? "var(--bu-green)" : "var(--bu-warn)";
            const leitura = pct === 100 ? "concluído" : !concluidos && emAndamento ? "em andamento" : `${pct}%`;
            return (
              <tr key={m.id} className="border-t border-line-soft">
                <td className={TD}>
                  <span className="mr-2 inline-block h-2.5 w-2.5 rounded-full align-middle" style={{ background: m.cor }} aria-hidden />
                  {m.nome}
                </td>
                <td className={num}>{total}</td>
                <td className={num}>{traco(concluidos)}</td>
                <td className={TD}>
                  <div className="flex items-center gap-3">
                    <div className="h-1.5 w-32 overflow-hidden rounded-full bg-line" aria-hidden>
                      <div className="h-full rounded-full" style={{ width: `${pct}%`, background: cor }} />
                    </div>
                    <span className="font-mono text-xs" style={{ color: pct === 100 ? "var(--bu-green)" : pct ? cor : "var(--bu-text-2)" }}>{leitura}</span>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </Card>
  );
}
