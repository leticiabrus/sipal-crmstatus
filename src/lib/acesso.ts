/**
 * Acesso ao painel por código, sem usuário. O código fica na variável de ambiente PAINEL_CODIGO
 * (configurada na Vercel, nunca no repositório). Quem acerta ganha um cookie de 30 dias com o hash do código,
 * então trocar o código derruba todos os acessos.
 *
 * Sem PAINEL_CODIGO: em produção na Vercel o painel fica fechado (melhor fechado que aberto por esquecimento);
 * no desenvolvimento local e no preview do Lovable, fica aberto.
 */

const COOKIE = "painel_acesso";
const TRINTA_DIAS = 60 * 60 * 24 * 30;
export const ROTA_ENTRAR = "/entrar";
export const ROTA_SAIR = "/sair";

type Env = Record<string, string | undefined> | undefined;

function lerVariavel(env: unknown, nome: string): string | undefined {
  const doEnv = (env as Env)?.[nome];
  if (doEnv) return doEnv;
  return typeof process !== "undefined" ? process.env[nome] : undefined;
}

async function hash(texto: string): Promise<string> {
  const bytes = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(`painel:${texto}`));
  return [...new Uint8Array(bytes)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

/** Comparação em tempo constante: não revela, pelo tempo de resposta, quantos caracteres batem. */
function iguais(a: string, b: string) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

function lerCookie(request: Request, nome: string) {
  const cabecalho = request.headers.get("cookie") ?? "";
  for (const parte of cabecalho.split(";")) {
    const [k, ...v] = parte.trim().split("=");
    if (k === nome) return decodeURIComponent(v.join("="));
  }
  return null;
}

/** Só caminhos internos: impede que o "next" do login mande para outro site. */
function destinoSeguro(next: string | null) {
  return next && next.startsWith("/") && !next.startsWith("//") && next !== ROTA_ENTRAR ? next : "/";
}

function cookie(valor: string, maxAge: number, request: Request) {
  const seguro = new URL(request.url).protocol === "https:" ? "; Secure" : "";
  return `${COOKIE}=${encodeURIComponent(valor)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${seguro}`;
}

const html = (corpo: string, status = 200, headers: Record<string, string> = {}) =>
  new Response(corpo, {
    status,
    headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store", "x-robots-tag": "noindex", ...headers },
  });

const espera = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Decide a requisição antes do app: devolve uma Response quando o acesso responde por conta própria
 * (tela de entrada, redirecionamento, painel fechado), ou null quando a página pode seguir.
 */
export async function controlarAcesso(request: Request, env: unknown): Promise<Response | null> {
  const codigo = lerVariavel(env, "PAINEL_CODIGO")?.trim();
  const url = new URL(request.url);

  if (!codigo) {
    const producaoVercel = lerVariavel(env, "VERCEL_ENV") === "production";
    return producaoVercel ? html(paginaEntrada({ fechado: true }), 503) : null;
  }

  const esperado = await hash(codigo);
  const liberado = iguais(lerCookie(request, COOKIE) ?? "", esperado);

  if (url.pathname === ROTA_SAIR) {
    return new Response(null, { status: 303, headers: { location: ROTA_ENTRAR, "set-cookie": cookie("", 0, request) } });
  }

  if (url.pathname === ROTA_ENTRAR) {
    const next = destinoSeguro(url.searchParams.get("next"));
    if (request.method === "POST") {
      const form = await request.formData().catch(() => null);
      const tentativa = String(form?.get("codigo") ?? "").trim();
      if (tentativa && iguais(await hash(tentativa), esperado)) {
        return new Response(null, { status: 303, headers: { location: next, "set-cookie": cookie(esperado, TRINTA_DIAS, request) } });
      }
      // Um segundo por erro: sem banco para contar tentativas, a espera é o que freia a tentativa em massa.
      await espera(1000);
      return html(paginaEntrada({ erro: true, next }), 401);
    }
    if (liberado) return new Response(null, { status: 303, headers: { location: next } });
    return html(paginaEntrada({ next }));
  }

  if (liberado) return null;

  // Página pedida sem acesso: vai para a entrada e volta para ela depois do código.
  const pedeHtml = request.method === "GET" && (request.headers.get("accept") ?? "").includes("text/html");
  if (pedeHtml) {
    const next = encodeURIComponent(url.pathname + url.search);
    return new Response(null, { status: 303, headers: { location: `${ROTA_ENTRAR}?next=${next}`, "cache-control": "no-store" } });
  }
  return new Response("Acesso restrito.", { status: 401, headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "no-store" } });
}

const escapar = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

/** Tela de entrada, no tema do painel. Sem JavaScript: o formulário posta direto para o servidor. */
function paginaEntrada({ erro = false, fechado = false, next = "/" }: { erro?: boolean; fechado?: boolean; next?: string }) {
  const acao = `${ROTA_ENTRAR}?next=${encodeURIComponent(next)}`;
  return `<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="robots" content="noindex" />
    <title>Acesso · Status report</title>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;600&display=swap" />
    <style>
      :root { --bg:#09090b; --surface:#111113; --surface-2:#18181b; --line:#27272a; --text:#fafafa; --text-2:#a1a1aa; --text-3:#52525b;
        --green:#10b981; --green-glow:#34d399; --green-ink:#052e1b; --warn:#f59e0b; --cyan:#22d3ee; }
      * { box-sizing: border-box; }
      body { margin: 0; min-height: 100dvh; display: grid; place-items: center; padding: 16px; background: var(--bg); color: var(--text);
        font: 14px/1.5 "Inter", ui-sans-serif, system-ui, sans-serif; }
      .card { width: 100%; max-width: 380px; background: var(--surface); border: 1px solid var(--line); border-radius: 14px; padding: 28px 24px; }
      .marca { font: 12px "JetBrains Mono", ui-monospace, monospace; color: var(--text-2); }
      .marca b { color: var(--green); font-weight: 400; }
      h1 { margin: 16px 0 4px; font-size: 22px; font-weight: 700; letter-spacing: -0.02em; line-height: 1.25; }
      h1 span { background: linear-gradient(90deg, var(--cyan), var(--green)); -webkit-background-clip: text; background-clip: text; color: transparent; }
      p { margin: 0 0 20px; color: var(--text-2); }
      label { display: block; font-size: 11px; font-weight: 500; letter-spacing: 1.5px; text-transform: uppercase; color: var(--text-3); margin-bottom: 8px; }
      input { width: 100%; padding: 10px 12px; border-radius: 10px; border: 1px solid var(--line); background: var(--bg); color: var(--text);
        font: 16px "JetBrains Mono", ui-monospace, monospace; letter-spacing: 2px; outline: none; }
      input:focus { border-color: var(--text-3); }
      button { margin-top: 12px; width: 100%; padding: 10px 12px; border: 0; border-radius: 8px; background: var(--green); color: var(--green-ink);
        font: 600 14px "Inter", ui-sans-serif, system-ui, sans-serif; cursor: pointer; transition: background-color .15s; }
      button:hover { background: var(--green-glow); }
      .erro { margin: 12px 0 0; padding: 8px 12px; border-radius: 10px; border: 1px solid rgb(245 158 11 / .4); background: rgb(245 158 11 / .1); color: var(--warn); font-size: 13px; }
    </style>
  </head>
  <body>
    <main class="card">
      <div class="marca"><b>●</b> status report</div>
      <h1>CRM <span>Ingá Pneus</span></h1>
      ${fechado
        ? `<p>O acesso ao painel ainda não foi configurado. Defina o código na variável PAINEL_CODIGO do projeto na Vercel.</p>`
        : `<p>Digite o código de acesso para ver o painel.</p>
      <form method="post" action="${escapar(acao)}">
        <label for="codigo">Código</label>
        <input id="codigo" name="codigo" type="password" autocomplete="current-password" required autofocus />
        <button type="submit">Entrar</button>
        ${erro ? `<div class="erro" role="alert">Código incorreto. Confira e tente de novo.</div>` : ""}
      </form>`}
    </main>
  </body>
</html>`;
}
