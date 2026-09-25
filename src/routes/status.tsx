import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Card, PageHeader } from "@/components/AppNav";
import { AREA, FASE } from "@/components/cronograma";
import { DISCOVERY, FATIAS, fmt, todayISO, type Fatia } from "@/lib/burnup";
import {
  colunasDaSemana, contar, estadoDaSemana, periodo, resumoDaSemana, semanaAtual, semanasDoDelivery, variacao, type Semana,
} from "@/lib/semanas";

export const Route = createFileRoute("/status")({
  head: () => ({
    meta: [
      { title: "Status report · CRM Ingá Pneus" },
      { name: "description", content: "Histórico semanal do MVP do CRM Ingá Pneus: o que foi concluído, o que está em andamento e o que vem a seguir." },
      { property: "og:title", content: "Status report · CRM Ingá Pneus" },
      { property: "og:description", content: "O que aconteceu em cada semana do delivery do MVP." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: StatusPage,
});

const ROTULO: Record<Semana["situacao"], string> = {
  encerrada: "encerrada", em_curso: "em curso", futura: "previsto", entrega: "entrega do MVP",
};

function StatusPage() {
  const today = todayISO();
  const semanas = semanasDoDelivery(today);
  // A semana em curso vem selecionada ao abrir a aba.
  const [sel, setSel] = useState(() => semanaAtual(semanas).n);
  const semana = semanas.find((s) => s.n === sel) ?? semanaAtual(semanas);

  return (
    <>
      <PageHeader
        title="Status report ·"
        accent="CRM Ingá Pneus"
        subtitle="O que aconteceu em cada semana do delivery. Cada semana é o estado do projeto na data de corte dela, recalculado a partir dos registros de cada card. Os prazos são os fins de módulo do roadmap."
      />
      <div className="grid gap-4 pb-8 md:grid-cols-[230px_minmax(0,1fr)]">
        <nav aria-label="Semanas" className="flex flex-col gap-1.5">
          {semanas.map((s) => (
            <ItemSemana key={s.n} s={s} ativa={s.n === semana.n} today={today} onClick={() => setSel(s.n)} />
          ))}
        </nav>
        <DetalheSemana s={semana} semanas={semanas} today={today} />
      </div>
    </>
  );
}

function ItemSemana({ s, ativa, today, onClick }: { s: Semana; ativa: boolean; today: string; onClick: () => void }) {
  const c = contar(estadoDaSemana(s, FATIAS, today));
  const futura = s.situacao === "futura" || s.situacao === "entrega";
  const pct = c.total ? Math.round((c.concluidas / c.total) * 100) : 0;
  const base = "w-full rounded-lg border px-3 py-2.5 text-left transition-colors duration-150";
  const estilo =
    s.situacao === "em_curso" ? "border-line border-l-[3px] border-l-warn bg-surface-2"
    : ativa ? "border-line bg-surface-2"
    : "border-transparent hover:bg-surface";
  return (
    <button onClick={onClick} aria-current={ativa ? "true" : undefined} className={`${base} ${estilo} ${ativa ? "ring-1 ring-line" : ""}`}>
      <div className={`flex items-baseline justify-between gap-2 text-sm ${futura ? "text-text-3" : "text-text"}`}>
        <span className="font-semibold">Semana {s.n} · <span className="font-normal">{periodo(s)}</span></span>
      </div>
      <div className={`mt-1 flex gap-3 font-mono text-[11px] ${futura ? "text-text-3" : ""}`}>
        <span className={futura ? "" : "text-green"} title="concluído">✓ {c.concluidas}</span>
        <span className={futura ? "" : "text-warn"} title="em andamento">◐ {c.emAndamento}</span>
        <span className="text-text-3" title="a fazer">○ {c.aFazer}</span>
        {futura && <span className="ml-auto text-[10px] uppercase tracking-wide">previsto</span>}
      </div>
      {!futura && (
        <div className="mt-2 h-1 overflow-hidden rounded-full bg-line" aria-label={`${pct}% concluído`}>
          <div className="h-full rounded-full bg-green" style={{ width: `${pct}%` }} />
        </div>
      )}
    </button>
  );
}

function DetalheSemana({ s, semanas, today }: { s: Semana; semanas: Semana[]; today: string }) {
  const col = colunasDaSemana(s, semanas, FATIAS, today);
  const v = variacao(s, semanas, FATIAS, today);
  const rotulo = s.situacao === "em_curso" ? `em curso · corte em ${fmt(s.corte)}` : ROTULO[s.situacao];
  return (
    <div className="min-w-0">
      <Card className="mb-4 p-5">
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <h2 className="text-xl font-semibold">Semana {s.n} · {periodo(s)}</h2>
          <span className={`font-mono text-xs ${s.situacao === "em_curso" ? "text-warn" : "text-text-3"}`}>{rotulo}</span>
        </div>
        <p className="mt-2 text-sm text-text-2">{resumoDaSemana(s, semanas, FATIAS, today)}</p>
        <DecisoesDaSemana s={s} today={today} />
        {v && (
          <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 font-mono text-xs">
            <Delta valor={v.concluidas} rotulo="concluídos" favoravel={v.concluidas > 0} />
            <Delta valor={v.emAndamento} rotulo="em andamento" favoravel={v.emAndamento > 0 && v.aFazer < 0} />
            <Delta valor={v.aFazer} rotulo="a fazer" favoravel={v.aFazer < 0} />
            <span className="text-text-3">em relação à semana {s.n - 1}</span>
          </div>
        )}
      </Card>
      <div className="grid gap-4 lg:grid-cols-3">
        <Coluna
          titulo={col.previsto ? "Concluído na semana · previsto" : "Concluído na semana"}
          cor="green"
          itens={col.concluidas}
          vazio={col.previsto ? "Nenhum módulo fecha nesta semana." : "Nenhum card concluído nesta semana."}
        />
        <Coluna
          titulo={col.previsto ? "Em andamento · previsto" : "Em andamento"}
          cor="warn"
          itens={col.emAndamento}
          vazio="Nenhum card em andamento no corte."
        />
        <Coluna
          titulo="Próximos a fechar"
          subtitulo={col.seguinte ? `módulo fecha na semana ${col.seguinte.n} · ${periodo(col.seguinte)}` : undefined}
          cor="cyan"
          itens={col.proximas}
          emAndamento={new Set(col.emAndamento.map((f) => f.id))}
          vazio={col.seguinte ? "Nenhum módulo fecha na semana seguinte." : "Última semana do delivery."}
        />
      </div>
    </div>
  );
}

/** Verde quando o movimento é favorável, cinza quando não mudou. */
function Delta({ valor, rotulo, favoravel }: { valor: number; rotulo: string; favoravel: boolean }) {
  const cor = valor === 0 ? "text-text-3" : favoravel ? "text-green" : "text-text-2";
  const sinal = valor > 0 ? "+" : valor < 0 ? "−" : "±";
  return <span className={cor}>{sinal}{Math.abs(valor)} {rotulo}</span>;
}

const COR = {
  green: { texto: "text-green", borda: "border-t-green" },
  warn: { texto: "text-warn", borda: "border-t-warn" },
  cyan: { texto: "text-cyan", borda: "border-t-cyan" },
} as const;

function Coluna({ titulo, subtitulo, cor, itens, vazio, emAndamento }: {
  titulo: string; subtitulo?: string | undefined; cor: keyof typeof COR; itens: Fatia[]; vazio: string;
  /** Cards que também estão na coluna em andamento: marcadas, para não parecer duplicação. */
  emAndamento?: Set<string>;
}) {
  return (
    <section className={`rounded-xl border border-line border-t-2 ${COR[cor].borda} bg-surface p-3`}>
      <header className="mb-2 px-1">
        <div className="flex items-baseline justify-between">
          <span className={`label ${COR[cor].texto}`}>{titulo}</span>
          <span className={`font-mono text-sm font-semibold ${COR[cor].texto}`}>{itens.length}</span>
        </div>
        {subtitulo && <div className="mt-0.5 font-mono text-[11px] text-text-3">{subtitulo}</div>}
      </header>
      {itens.length ? (
        <ul className="flex flex-col gap-2">
          {itens.map((f) => <CardEntrega key={f.id} f={f} cor={cor} jaEmAndamento={emAndamento?.has(f.id) ?? false} />)}
        </ul>
      ) : (
        <p className="rounded-lg border border-dashed border-line px-3 py-6 text-center text-sm text-text-3">{vazio}</p>
      )}
    </section>
  );
}

function CardEntrega({ f, cor, jaEmAndamento }: { f: Fatia; cor: keyof typeof COR; jaEmAndamento: boolean }) {
  const fase = FASE[f.fase];
  const area = AREA[f.area];
  return (
    <li className="rounded-lg border border-line-soft bg-surface-2 px-3 py-2">
      <div className="flex items-baseline justify-between gap-2">
        <span className="flex items-baseline gap-2">
          <span className={`font-mono text-xs ${COR[cor].texto}`}>{f.id}</span>
          <span
            className={`rounded-full px-1.5 py-px font-mono text-[9px] uppercase tracking-[1px] ${fase.classe}`}
            title={fase.dica}
          >
            {fase.rotulo}
          </span>
        </span>
        <span className="font-mono text-[11px] text-text-3">{f.marco ? `prazo ${fmt(f.marco)}` : "sem data de módulo"}</span>
      </div>
      <div className="mt-0.5 text-sm leading-snug">{f.nome}</div>
      <div className="mt-1 flex flex-wrap gap-x-3 text-[11px] text-text-3">
        <span className="font-mono">{f.moduloId}</span>
        <span>{f.epico}</span>
        {f.dependeDe && <span>depende de {f.dependeDe}</span>}
        {jaEmAndamento && <span className="text-warn">já em andamento</span>}
      </div>
      <div className="mt-2">
        <span className={`rounded-full px-2 py-px text-[11px] font-medium ${area.classe}`} title={area.dica}>{area.rotulo}</span>
      </div>
    </li>
  );
}

/**
 * Itens de decisão do discovery técnico na semana: os concluídos nela e os que seguiam em aberto no corte.
 * Não são cards, então ficam fora das colunas; sem eles as semanas de setembro pareceriam vazias.
 * Em aberto só aparece até a semana corrente: não há como prever quando destrava.
 */
function DecisoesDaSemana({ s, today }: { s: Semana; today: string }) {
  const concluidos = DISCOVERY.filter((i) => i.concluido && i.concluido >= s.de && i.concluido <= s.ate);
  const abertos = s.de > today ? [] : DISCOVERY.filter((i) => i.inicio && i.inicio <= s.corte && (!i.concluido || i.concluido > s.corte));
  if (!concluidos.length && !abertos.length) return null;
  return (
    <div className="mt-3 flex flex-wrap items-center gap-2">
      <span className="label mr-1">Discovery técnico</span>
      {concluidos.map((i) => (
        <span key={i.id} className="flex flex-col rounded-lg bg-green/12 px-2.5 py-1 text-xs font-medium leading-tight text-green">
          <span><span className="mr-1 font-mono">✓</span>{i.nome}</span>
          <span className="mt-0.5 font-mono text-[10px] font-normal opacity-75">{fmt(i.concluido)}</span>
        </span>
      ))}
      {abertos.map((i) => (
        <span key={i.id} className="flex flex-col rounded-lg bg-warn/12 px-2.5 py-1 text-xs font-medium leading-tight text-warn">
          <span><span className="mr-1 font-mono">◐</span>{i.nome}</span>
          <span className="mt-0.5 font-mono text-[10px] font-normal opacity-75">em andamento desde {fmt(i.inicio ?? null)}{i.responsavel ? ` · com ${i.responsavel}` : ""}</span>
        </span>
      ))}
    </div>
  );
}
