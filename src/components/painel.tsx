// Peças visuais comuns às telas de gráfico (burnup e burndown): mesma identidade, uma implementação só.
import { useEffect, useState } from "react";
import { Maximize2, Minimize2 } from "lucide-react";
import type { LabelProps } from "recharts";
import { DISCOVERY, FATIAS, SEMANAS_ESTIMADAS, fmt, periodo, useTelaCheia, type TelaCheia } from "@/lib/burnup";

export const TH = "label px-4 py-2.5 font-medium";
export const TD = "px-4 py-1.5";

/** Número em pt-BR com casas fixas (1,74). */
export const dec = (n: number, casas = 2) =>
  n.toLocaleString("pt-BR", { minimumFractionDigits: casas, maximumFractionDigits: casas });

/**
 * Casca comum dos cartões de número. Rótulo, valor e descrição têm altura fixa,
 * então cada faixa cai na mesma linha horizontal em todos os cartões, qualquer que seja o conteúdo.
 */
export function CartaoNumero({ label, icon, note, className = "", children }: {
  label: string; icon?: React.ReactNode; note?: string | undefined; className?: string; children: React.ReactNode;
}) {
  return (
    <div className={`flex h-full min-h-[120px] flex-col justify-between rounded-xl border p-4 ${className}`}>
      <div className="label flex h-4 items-center gap-1.5">{icon}{label}</div>
      <div className="flex h-10 items-center font-mono font-semibold">{children}</div>
      <div className="h-4 truncate font-mono text-xs text-text-3">{note}</div>
    </div>
  );
}

/** Destaque em --danger: reservado a um cartão por tela (o cronômetro no burnup; o desvio no burndown, só quando existe). */
export const DESTAQUE = "border-danger bg-danger/5 shadow-[0_0_20px_rgba(244,63,94,.12)]";

const COR_TOM = {
  text: "text-text", muted: "text-text-2", green: "text-green", warn: "text-warn", cyan: "text-cyan", danger: "text-danger",
} as const;
export type Tom = keyof typeof COR_TOM;

export function Stat({ label, value, tone = "text", note, destaque, icon }: {
  label: string; value: string; tone?: Tom; note?: string | undefined; destaque?: boolean; icon?: React.ReactNode;
}) {
  return (
    <CartaoNumero label={label} note={note} icon={icon} className={destaque ? DESTAQUE : "border-line bg-surface"}>
      <span className={`text-3xl ${COR_TOM[tone]}`}>{value}</span>
    </CartaoNumero>
  );
}

export function Legend({ color, label, dashed }: { color: string; label: string; dashed?: boolean }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className="inline-block w-4" style={{ borderTop: `2px ${dashed ? "dashed" : "solid"} ${color}` }} />
      {label}
    </span>
  );
}

/**
 * Eixo Y que termina no total (arredondado ao passo). Com o gráfico alto,
 * o passo cai pela metade e a grade fica mais densa sem mudar o topo.
 */
export function eixoY(max: number, altura: number) {
  // Passo de 30 até 100: com 81 cards o topo fica em 90, sem a faixa vazia que o passo de 20 deixava até 100.
  const base = max <= 30 ? 10 : max <= 100 ? 30 : 50;
  const passo = altura >= 520 ? base / 2 : base;
  const topo = Math.max(passo, Math.ceil(max / passo) * passo);
  return { topo, ticks: Array.from({ length: Math.floor(topo / passo) + 1 }, (_, i) => i * passo) };
}

/** Rótulo fixo de série, ancorado num ReferenceDot (o viewBox do ponto é o próprio ponto quando r = 0). */
export function rotulo(texto: string, cor: string, { anchor = "start", dx = 0, dy = 0 }: { anchor?: "start" | "middle" | "end"; dx?: number; dy?: number }) {
  return {
    content: (props: LabelProps) => {
      const viewBox = props.viewBox as { x?: number; y?: number; width?: number; height?: number } | undefined;
      const x = (viewBox?.x ?? 0) + (viewBox?.width ?? 0) / 2, y = (viewBox?.y ?? 0) + (viewBox?.height ?? 0) / 2;
      return (
        // Contorno na cor do cartão: o rótulo continua legível quando uma linha passa por baixo dele.
        <text x={x + dx} y={y + dy} textAnchor={anchor} fill={cor} fontSize={11} fontWeight={600} fontFamily="JetBrains Mono"
          stroke="var(--bu-surface)" strokeWidth={4} strokeLinejoin="round" paintOrder="stroke">
          {texto}
        </text>
      );
    },
  };
}

type EixoX = { scale: ((v: string) => number | undefined) & { bandwidth?: () => number } };
export type Fase = { de: string; ate: string; rotulo: string; cor: string };

/** Faixa de fase abaixo das datas do eixo X, fora da área de plotagem. Uso: <Customized component={<FaseBar fases={...} />} />. */
export function FaseBar({ xAxisMap, offset, fases }: {
  xAxisMap?: Record<string, EixoX>; offset?: { top: number; height: number }; fases: Fase[];
}) {
  const axis = xAxisMap && Object.values(xAxisMap)[0];
  if (!axis || !offset) return null;
  const half = (axis.scale.bandwidth?.() ?? 0) / 2;
  const y = offset.top + offset.height + 30; // abaixo da altura do eixo X (30px)
  return (
    <g>
      {fases.map((f) => {
        const s1 = axis.scale(f.de), s2 = axis.scale(f.ate);
        if (s1 === undefined || s2 === undefined) return null;
        const x1 = s1 + half + 1, x2 = s2 + half - 1;
        return (
          <g key={f.rotulo}>
            <rect x={x1} y={y} width={Math.max(0, x2 - x1)} height={18} rx={3} fill={f.cor} fillOpacity={0.18} />
            <text x={(x1 + x2) / 2} y={y + 12.5} textAnchor="middle" fill={f.cor} fontSize={9} letterSpacing={1} fontFamily="JetBrains Mono">
              {f.rotulo}
            </text>
          </g>
        );
      })}
    </g>
  );
}

/** Tamanho atual de um elemento: ajusta a densidade da grade à altura do gráfico. */
export function useTamanho(ref: React.RefObject<HTMLElement | null>) {
  const [t, setT] = useState({ w: 0, h: 0 });
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ler = () => setT({ w: Math.floor(el.clientWidth), h: Math.floor(el.clientHeight) });
    ler();
    const ro = new ResizeObserver(ler);
    ro.observe(el);
    return () => ro.disconnect();
  }, [ref]);
  return t;
}

/** Verdadeiro depois que a página rolou: o indicador de conteúdo abaixo some. */
export function useRolou() {
  const [rolou, setRolou] = useState(false);
  useEffect(() => {
    const ler = () => setRolou(window.scrollY > 8);
    ler();
    window.addEventListener("scroll", ler, { passive: true });
    return () => window.removeEventListener("scroll", ler);
  }, []);
  return rolou;
}

/** Mostra a dica por alguns segundos sempre que a tela cheia é ativada (ou o gatilho muda). */
function useDicaTemporaria(ativo: unknown, ms: number, gatilho = 0) {
  const [visivel, setVisivel] = useState(false);
  useEffect(() => {
    if (!ativo) { setVisivel(false); return; }
    setVisivel(true);
    const id = setTimeout(() => setVisivel(false), ms);
    return () => clearTimeout(id);
  }, [ativo, ms, gatilho]);
  return visivel;
}

/**
 * Estado de tela cheia e a ação do botão. A fonte de verdade é o navegador (fullscreenchange / display-mode),
 * nunca um estado próprio. Em F11 o navegador só sai pelo próprio F11: o botão apenas lembra a tecla.
 */
export function useControleTelaCheia() {
  const telaCheia = useTelaCheia();
  const [pedidosF11, setPedidosF11] = useState(0);
  const dica = useDicaTemporaria(telaCheia, 3000, pedidosF11);
  const alternar = () => {
    if (telaCheia === "f11") setPedidosF11((n) => n + 1);
    else if (document.fullscreenElement) void document.exitFullscreen();
    else void document.documentElement.requestFullscreen?.();
  };
  return { telaCheia, dica, alternar };
}

export function BotaoTelaCheia({ telaCheia, onClick }: { telaCheia: TelaCheia; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      title={telaCheia ? "Sair da tela cheia" : "Tela cheia"}
      aria-label={telaCheia ? "Sair da tela cheia" : "Tela cheia"}
      className="rounded-md border border-line p-1.5 text-text-2 transition-colors duration-150 hover:text-text"
    >
      {telaCheia ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
    </button>
  );
}

export function DicaTelaCheia({ visivel, telaCheia }: { visivel: boolean; telaCheia: TelaCheia }) {
  if (!visivel) return null;
  return (
    <div className="pointer-events-none fixed left-1/2 top-4 z-50 -translate-x-1/2 rounded-md border border-line bg-surface-2/90 px-3 py-1.5 font-mono text-[11px] text-text-2">
      {telaCheia === "f11" ? "F11 para sair" : "ESC para sair"}
    </div>
  );
}

/** Primeira dobra: cabeçalho, cartões e gráfico ocupam a janela; o detalhamento vem na rolagem. */
export function PrimeiraDobra({ telaCheia, children }: { telaCheia: TelaCheia; children: React.ReactNode }) {
  const rolou = useRolou();
  return (
    <section className="relative flex flex-col pb-8" style={{ minHeight: telaCheia ? "100dvh" : "calc(100dvh - 49px)" }}>
      {children}
      {!rolou && !telaCheia && (
        <div className="pointer-events-none absolute inset-x-0 bottom-2 text-center font-mono text-[11px] text-text-3">
          ↓ role para ver o detalhamento
        </div>
      )}
    </section>
  );
}

/**
 * Faixa sobre alocação, abaixo dos cartões. Em --warn, não --danger: em sequência as estimativas passariam do prazo;
 * as janelas comprimidas até 10/11 são a hipótese de trabalho até a distribuição entre os dois desenvolvedores ser fechada.
 */
export function FaixaAlocacao() {
  return (
    <div className="mb-4 rounded-lg border border-warn/40 bg-warn/10 px-4 py-3 text-sm text-warn">
      As estimativas somam {SEMANAS_ESTIMADAS} semanas em sequência. Os prazos estão comprimidos até 10/11 supondo dois desenvolvedores
      em paralelo, com M3 junto de M4 e M5 junto de M6; a distribuição ainda será definida.
    </div>
  );
}

/** Discovery técnico: bloco próprio, acima dos módulos. Um selo por item, verde concluído e laranja em aberto. */
export function FaixaDiscovery({ className = "mb-4" }: { className?: string }) {
  const feitos = DISCOVERY.filter((i) => i.concluido).length;
  // Os cards da fundação feitos no discovery: contam aqui, não no cartão de concluídos do delivery.
  const fundacao = FATIAS.filter((f) => f.fase === "discovery" && f.concluida && !f.removida);
  const datas = fundacao.map((f) => f.concluida!).sort();
  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`}>
      <span className="label mr-1">Discovery técnico · {feitos} de {DISCOVERY.length} decisões</span>
      {DISCOVERY.map((i) => (
        <span key={i.id}
          title={i.concluido ? `Concluído em ${fmt(i.concluido)}` : `Em aberto${i.responsavel ? ` · com ${i.responsavel}` : ""}`}
          className={`flex flex-col rounded-lg px-2.5 py-1 text-xs font-medium leading-tight ${i.concluido ? "bg-green/12 text-green" : "bg-warn/12 text-warn"}`}>
          <span><span className="mr-1 font-mono">{i.concluido ? "✓" : "◐"}</span>{i.nome}</span>
          <span className="mt-0.5 font-mono text-[10px] font-normal opacity-75">
            {i.concluido ? fmt(i.concluido) : `em andamento desde ${fmt(i.inicio ?? null)}`}
          </span>
        </span>
      ))}
      {fundacao.length > 0 && (
        <span title={fundacao.map((f) => `${f.id} · ${fmt(f.concluida)}`).join("\n")}
          className="flex flex-col rounded-lg bg-green/12 px-2.5 py-1 text-xs font-medium leading-tight text-green">
          <span><span className="mr-1 font-mono">✓</span>{fundacao.length} cards da fundação</span>
          <span className="mt-0.5 font-mono text-[10px] font-normal opacity-75">{periodo(datas[0]!, datas.at(-1)!)}</span>
        </span>
      )}
    </div>
  );
}

/**
 * Pontos de medição de uma série diária: círculo de 3px onde o valor muda (o evento registrado) e de 5px
 * no último ponto real. A curva monotone entre eles é interpolação; os círculos são o que foi medido.
 * Dias sem mudança não ganham círculo: com uma linha por dia, marcar todos esconderia a curva.
 */
export function pontosDeMedicao(valores: (number | null | undefined)[], cor: string) {
  let ultimo = -1;
  valores.forEach((v, i) => { if (v !== null && v !== undefined) ultimo = i; });
  function Ponto(props: { cx?: number; cy?: number; index?: number }) {
    const i = props.index ?? -1;
    const v = valores[i];
    const anterior = i > 0 ? valores[i - 1] : null;
    const medido = v !== null && v !== undefined && (i === ultimo || anterior === null || anterior === undefined || anterior !== v);
    if (!medido || props.cx === undefined || props.cy === undefined) return <g key={i} />;
    return <circle key={i} cx={props.cx} cy={props.cy} r={i === ultimo ? 5 : 3} fill={cor} stroke="var(--bu-bg)" strokeWidth={1.5} />;
  }
  return Ponto;
}
