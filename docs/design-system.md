# Design system do painel de status

Levantamento do que o código faz hoje, para reconstruir a identidade em outra base.
Não é uma proposta. Onde o código se contradiz, o ponto aparece marcado como **Inconsistência**.
Onde um valor está escrito direto no componente em vez de vir de variável, aparece como **Literal**.

Fontes lidas:

- [src/styles.css](../src/styles.css): tokens e classes utilitárias (`.brand-gradient`, `.text-grad`, `.label`)
- [src/components/AppNav.tsx](../src/components/AppNav.tsx): navegação, cabeçalho, cartão
- [src/components/painel.tsx](../src/components/painel.tsx): cartão de número, alternador, legenda, rótulos e faixa de fase do gráfico (arquivo novo, ainda não commitado, extraído de `index.tsx` sem mudar valores)
- [src/routes/index.tsx](../src/routes/index.tsx): burnup, tabelas "Em andamento agora" e "Escopo por épico"
- [src/routes/fatias.tsx](../src/routes/fatias.tsx), [src/routes/marcos.tsx](../src/routes/marcos.tsx), [src/routes/__root.tsx](../src/routes/__root.tsx)
- [src/lib/burnup.ts](../src/lib/burnup.ts): estados e suas cores

Os 46 componentes de [src/components/ui/](../src/components/ui/) (shadcn) não são usados por nenhuma tela. Ficaram de fora deste levantamento.

---

## 1. Cores

### 1.1 Dois conjuntos de tokens

O arquivo de estilos declara dois sistemas:

| Conjunto | Prefixo | Formato | Uso real |
|---|---|---|---|
| shadcn (padrão do template) | `--background`, `--primary`, `--chart-1`... | oklch, com `:root` claro e `.dark` escuro | Só nas telas de 404 e de erro em `__root.tsx` |
| Burnup (o sistema de fato) | `--bu-*`, expostos ao Tailwind como `bg-surface`, `text-text-2`, `border-line`... | hex | Todas as telas do produto |

> **Inconsistência.** A classe `.dark` nunca é aplicada. Então as telas de 404 e de erro usam os valores claros do shadcn (`bg-background` = branco), enquanto o resto do produto é escuro. O comentário no topo de `styles.css` diz "All colors MUST use oklch format", mas todos os tokens usados de fato estão em hex.

Daqui em diante, "token" quer dizer o conjunto `--bu-*`. O nome da classe Tailwind aparece entre parênteses.

### 1.2 Superfícies

| Variável | Valor | Classe | Onde é usada | Papel |
|---|---|---|---|---|
| `--bu-bg` | `#09090b` | `bg-bg` | `body`; barra de navegação; fundo do alternador (`bg-bg/60`); contorno dos pontos do gráfico (`stroke`) | Fundo da página. Também serve de "recorte" em volta dos pontos do gráfico |
| `--bu-surface` | `#111113` | `bg-surface` | Cartão, cartão de número | Primeiro degrau acima do fundo |
| `--bu-surface-2` | `#18181b` | `bg-surface-2` | Link ativo da navegação, linha de agrupamento na tabela de fatias, tooltip, dica de tela cheia (`/90`) | Segundo degrau: estado ativo, cabeçalho de grupo, camada flutuante |
| `--bu-border` | `#27272a` | `border-line` | Borda de todo cartão, borda do cabeçalho de tabela, linha de total, eixo X, linhas de marco, cursor do tooltip | Separador principal |
| `--bu-border-soft` | `#1f1f23` | `border-line-soft` | Borda entre linhas de tabela, grade horizontal do gráfico | Separador de segunda ordem, quase invisível |

### 1.3 Texto

| Variável | Valor | Classe | Onde é usada | Papel |
|---|---|---|---|---|
| `--bu-text` | `#fafafa` | `text-text` | Corpo, valores de cartão neutros, hover de links e botões | Texto principal |
| `--bu-text-2` | `#a1a1aa` | `text-text-2` | Subtítulo, links inativos, legenda, colunas secundárias de tabela, estado "Não iniciada" | Texto secundário |
| `--bu-text-3` | `#52525b` | `text-text-3` | `.label`, nota do cartão de número, ticks e títulos de eixo, linha "Planejado", rótulo de marco, estado "Removida", zeros em tabela | Metadado, referência e o que é neutro ou inativo |

### 1.4 Acentos

| Variável | Valor | Classe | Onde é usada | Papel |
|---|---|---|---|---|
| `--bu-cyan` | `#22d3ee` | `text-cyan` | Série "Escopo", linha de fechamento do escopo, fase DISCOVERY, início do gradiente de texto | Escopo, o que foi combinado |
| `--bu-teal` | `#14b8a6` | `border-teal`, `bg-teal/15` | Só no chip de filtro selecionado (épicos, estados) | Seleção de filtro. Não carrega significado de dado |
| `--bu-green-glow` | `#34d399` | `bg-green-glow` | Hover do alternador ativo; ponto atual da série "Construído" | Versão mais clara do verde, para hover e para o ponto "você está aqui" |
| `--bu-green-ink` | `#052e1b` | `text-green-ink` | Texto sobre fundo verde, no alternador ativo | Tinta para texto sobre verde |
| `--bu-blue` | `#3b82f6` | `text-blue`, `bg-blue` | **Nenhum lugar** | Declarada e nunca usada |

> **Inconsistência.** `--bu-blue` existe mas não é usada. O azul do gradiente da marca é outro, `rgb(30 58 138)`, escrito direto no gradiente.

### 1.5 Semânticas

Cada cor semântica tem um significado estreito neste produto:

| Variável | Valor | Significa | Onde aparece |
|---|---|---|---|
| `--bu-green` | `#10b981` | **Entregue, e o que vem depois da entrega.** Trabalho concluído, diferença positiva frente ao plano, período de piloto, fase DELIVERY. Também marca a escolha ativa no alternador e o ponto da marca na navegação | Série "Construído", cartão "Construído", estado "Concluída", coluna "Construído", diferença ≥ 0 em Marcos, faixa do piloto, fase DELIVERY, alternador ativo, `●` da navegação |
| `--bu-warn` | `#f59e0b` | **Trabalho em andamento e o dia de hoje.** O que começou e não terminou, e o ponto no tempo onde isso é medido. Também é a cor do alerta de "faixa travada" | Série "Em andamento", cartão "Em andamento", estado "Em andamento", id das fatias em voo, linha "hoje", coluna "Em voo", alerta de faixa travada |
| `--bu-danger` | `#f43f5e` | **O prazo e o que o ameaça.** O prazo do MVP, a diferença negativa frente ao plano e as fatias do caminho crítico. Não é usado para erro de sistema | Cartão de contagem regressiva (único com borda colorida), linha "MVP PRONTO", diferença < 0 em Marcos, fundo das linhas do caminho crítico |

Estados de fatia ([src/lib/burnup.ts](../src/lib/burnup.ts)):

| Estado | Cor |
|---|---|
| Não iniciada | `--bu-text-2` |
| Em andamento | `--bu-warn` |
| Concluída | `--bu-green` |
| Removida | `--bu-text-3` |

> **Inconsistência (sobrecarga).** O verde junta dois papéis que não têm relação: "entregue" (dado) e "selecionado" (controle, no alternador). Já a seleção de filtro usa teal. Duas cores diferentes para "selecionado", e uma delas repete a cor de um dado.

### 1.6 Tintas (cor com transparência)

Estados e destaques usam a cor semântica em transparência baixa sobre a superfície. Valores encontrados:

| Uso | Mistura |
|---|---|
| Fundo do cartão de destaque | danger a 5% (`bg-danger/5`) |
| Fundo de linha "Em andamento" e "Concluída" (Fatias) | warn e green a 6% (`color-mix`) |
| Fundo de linha do caminho crítico | danger a 8% (`color-mix`) |
| Faixa do piloto no gráfico | green a 8% (`fillOpacity`) |
| Fundo do alerta | warn a 10% (`bg-warn/10`), borda warn a 40% |
| Fundo do selo de situação | cor do estado a 12% (`color-mix`) |
| Fundo do chip selecionado | teal a 15% |
| Faixa de fase | cor da fase a 18% (`fillOpacity`) |
| Halo do ponto "Construído" | green a 20% |
| Preenchimento das áreas do gráfico | 22% |
| Linha de fechamento do escopo | cyan a 35% (`strokeOpacity`) |

> **Inconsistência.** A mesma operação, tingir com uma cor semântica, é feita de três formas: modificador de opacidade do Tailwind (`/5`, `/10`, `/15`), `color-mix(in srgb, ... N%, transparent)` em `style` inline, e `fillOpacity` no SVG. A escala também não se repete: 5, 6, 8, 10, 12, 15, 18, 20, 22%.

### 1.7 Gradiente da marca

Classe `.brand-gradient`, aplicada só ao cabeçalho da página. São duas camadas:

1. **Textura de barras verticais** (por cima):
   `repeating-linear-gradient(90deg, rgb(255 255 255 / 0.035) 0 1px, transparent 1px 8px)`
   Uma linha branca de 1px a 3,5% de opacidade a cada 8px. O resultado é um riscado vertical fino, quase subliminar.
2. **Gradiente diagonal** (por baixo):
   `linear-gradient(100deg, rgb(30 58 138 / 0.55), #09090b 50%, rgb(6 78 59 / 0.55))`
   - Ângulo: 100° (quase horizontal, da esquerda para a direita, com leve queda)
   - 0%: azul-marinho `rgb(30 58 138)` (Tailwind blue-900) a 55%
   - 50%: o fundo da página `#09090b`, opaco
   - 100%: verde-escuro `rgb(6 78 59)` (Tailwind emerald-900) a 55%

O centro volta ao fundo da página, então o cabeçalho "acende" só nas pontas.

**Gradiente de texto** (`.text-grad`), usado na palavra de destaque do título:
`linear-gradient(90deg, var(--bu-cyan), var(--bu-green))`, recortado no texto. Vai do escopo ao entregue.

> **Literal.** `#09090b`, `rgb(30 58 138)` e `rgb(6 78 59)` estão escritos no gradiente. O primeiro deveria ser `var(--bu-bg)`, e os dois tons da marca não têm variável.

---

## 2. Tipografia

### 2.1 Famílias e pesos

| Família | Variável | Pesos carregados (Google Fonts) | Pesos usados |
|---|---|---|---|
| Inter | `--font-sans` (fallback `ui-sans-serif, system-ui, sans-serif`) | 400, 500, 600, 700 | 400 (corpo), 500 (`.label`, selo), 600 (destaques em tabela, alternador ativo), 700 (título) |
| JetBrains Mono | `--font-mono` (fallback `ui-monospace, monospace`) | 400, 500, 600 | 400 (datas, ids, ticks), 600 (valores de cartão, rótulos de série, "MVP PRONTO"). **500 é carregado e não é usado** |

### 2.2 Regra das duas famílias

- **Monoespaçada**: tudo o que é contável, comparável ou identificador. Números, datas (`dd/mm`), ids de fatia (`B01`), story points, contagens, contagem regressiva, todo texto dentro do gráfico (ticks, marcos, rótulos de série, fases), tooltip. Também o nome do produto na navegação (`● status report`), as notas sob os valores dos cartões e as dicas de sistema ("ESC para sair", "↓ role para ver o detalhamento").
- **Sans**: tudo o que é nome ou frase. Títulos, subtítulos, nomes de fatia e épico, texto de situação, legenda do gráfico, rótulos de seção (`.label`), links, botões, chips.

Em Marcos, a linha inteira da tabela é monoespaçada porque todas as colunas são número ou data.

### 2.3 Escala

Altura de linha: nas classes Tailwind v4 é a padrão de cada tamanho. Onde não há classe, herda o `line-height` do corpo, que é 1,5.

| Papel | Família | Tamanho | Peso | Espaçamento entre letras | Altura de linha | Cor |
|---|---|---|---|---|---|---|
| Título de página | sans | 32px | 700 | −0.03em | 1.25 | text (acento com `.text-grad`) |
| Valor de cartão de número | mono | 30px (`text-3xl`) | 600 | normal | 36px, dentro de caixa de 40px | text / green / warn |
| Contagem regressiva | mono | 20px (`text-xl`); 16px abaixo de 640px | 600 | normal | 28px / 24px | danger; segundos a 60% |
| Corpo, célula de tabela, link, botão | sans | 14px (`text-sm`) | 400 (600 no alternador ativo e na linha de total) | normal | 20px | text / text-2 |
| Subtítulo do cabeçalho | sans | 14px | 400 | normal | 20px, largura máxima 672px | text-2 |
| Número em tabela, nota de cartão, tooltip, marca da navegação | mono | 12px (`text-xs`) | 400 | normal | 16px | varia |
| Chip, selo de situação, legenda | sans | 12px | 400 (500 no selo) | normal | 16px | varia |
| Rótulo de seção e cabeçalho de tabela (`.label`) | sans | 11px | 500 | 1.5px, caixa alta | 1.5 (herdada), 16px fixo no cartão | text-3 |
| Dica de sistema | mono | 11px | 400 | normal | 1.5 | text-2 / text-3 |
| Gráfico: tick de eixo | mono | 11px | 400 | normal | n/a | text-3 |
| Gráfico: rótulo de série, "MVP PRONTO" | mono | 11px | 600 | normal | n/a | cor da série |
| Gráfico: "hoje dd/mm" | mono | 11px | 400 | normal | n/a | warn |
| Gráfico: título do eixo Y, rótulo de marco, "Piloto" | mono | 10px | 400 | normal | n/a | text-3 / green |
| Gráfico: faixa de fase | mono | 9px | 400 | 1px, caixa alta | n/a | cor da fase |

> **Inconsistência.** A escala efetiva é 9, 10, 11, 12, 14, 16, 20, 30 e 32px. O 32px do título fica fora da escala do Tailwind (seria 30px, `text-3xl`, já usado no valor do cartão), e 9, 10 e 11px não existem nela. O 11px aparece de três formas: `font-size: 11px` em `.label`, `text-[11px]` em duas dicas, e `fontSize={11}` no gráfico.

> **Inconsistência.** O espaçamento entre letras usa unidades misturadas: `1.5px` no `.label`, `1px` na faixa de fase, `-0.03em` no título.

> **Inconsistência.** O cabeçalho de tabela aplica `.label` e `font-medium` juntos, mas `.label` já é peso 500.

> **Literal.** A família `"JetBrains Mono"` aparece escrita em cada elemento de texto do gráfico (ticks, título do eixo, marcos, MVP, hoje, piloto, rótulo de série, faixa de fase) em vez de `var(--font-mono)`. Com isso, o fallback se perde.

---

## 3. Espaçamento e raio

### 3.1 Espaçamento efetivamente usado

Base de 4px. Valores que aparecem no código:

| px | Onde |
|---|---|
| 2 | Padding vertical do selo |
| 4 | Padding do trilho do alternador, espaço entre links da navegação, pequenos respiros (`mt-1`, `ml-1`) |
| 6 | **Padding vertical de linha de tabela**, padding vertical de link e botão, espaço entre ícone e rótulo, espaço entre traço e texto da legenda |
| 8 | Espaço entre chips, abaixo do subtítulo, entre o título da tabela e a tabela |
| 10 | Padding vertical do cabeçalho de tabela, padding horizontal do selo |
| 12 | Padding horizontal de botão, link e chip; espaço entre a barra de título do gráfico e o gráfico |
| 16 | **Padding horizontal de célula**, padding do cartão de número, espaço entre cartões, margem entre blocos (`mb-4`) |
| 20 | Padding do cartão de conteúdo (`p-5`), recuo do título das tabelas |
| 24 | Margem lateral da página, espaço sob o cabeçalho, espaço entre a marca e os links |
| 32 | Padding vertical do cabeçalho, espaço sob a primeira dobra |
| 64 | Espaço no fim da página |

Layout:

- Largura máxima 1280px, centralizada, margem lateral de 24px. Em tela cheia a largura fica livre.
- Barra de navegação: 48px de altura mais 1px de borda.
- Cartões de número em grade de 2 colunas, 3 a partir de 768px e 5 a partir de 1280px, com 16px entre eles.
- O cabeçalho vaza as margens laterais (`-mx-6`) e ocupa a largura toda do container.
- Primeira dobra: cabeçalho, cartões e gráfico ocupam a altura da janela menos a navegação. O gráfico cresce para preencher e tem no mínimo 420px.

> **Inconsistência.** O padding vertical de linha de tabela é 6px em Fatias, Em andamento e Escopo por épico, e 12px em Marcos.

> **Inconsistência.** O cartão de conteúdo usa padding de 20px e o cartão de número usa 16px.

> **Literal.** `max-w-[1280px]` aparece em dois arquivos. `calc(100dvh - 49px)` supõe a altura da navegação (48 + 1), que está em outro componente. `min-h-[420px]` e `min-h-[120px]` também estão soltos.

> **Duplicação.** `TH` e `TD` (classes de cabeçalho e célula) estão definidos em `painel.tsx`, mas `fatias.tsx` e `marcos.tsx` repetem as classes escritas à mão.

### 3.2 Raio

`--radius` vale 10px, e o `@theme` do shadcn redefine a escala do Tailwind a partir dele:

| Classe | Valor | Elementos |
|---|---|---|
| `rounded-md` | 8px | Link da navegação, botão do alternador, botão de tela cheia, dica de tela cheia |
| `rounded-lg` | 10px | Trilho do alternador, tooltip, caixa de alerta |
| `rounded-xl` | 14px | Cartão, cartão de número |
| `rounded-full` | pílula | Chip de filtro, selo de situação |
| `rx=3` | 3px | Faixa de fase no gráfico |

Regra que se lê: o contêiner tem raio maior que o controle dentro dele (cartão 14 > trilho 10 > botão 8).

> **Literal.** O `rx=3` da faixa de fase fica fora da escala (o menor degrau é 6px).

---

## 4. Componentes

### 4.1 Cartão

**Estrutura.** Caixa com fundo `surface`, borda de 1px `line` e raio de 14px. Sem sombra. O padding fica por conta de quem usa: 20px no cartão de conteúdo, ou zero quando o cartão envolve uma tabela. Nesse caso, a tabela vai até a borda e só o título interno recebe recuo de 20px nas laterais e 16px no topo.

**Título interno.** Sempre um `.label`: 11px, caixa alta, `text-3`. Pode levar uma contagem depois de ` · ` ("Em andamento agora · 4").

**Quando usar.** Para qualquer bloco de conteúdo: gráfico, tabela ou texto explicativo.

**Não fazer.** Não adicionar sombra. Não colorir a borda (a borda colorida é exclusiva do cartão de destaque). Não aninhar um cartão dentro de outro.

### 4.2 Cartão de número

**Estrutura.** Três faixas com altura fixa, distribuídas na vertical num cartão com altura mínima de 120px e padding de 16px:

1. Rótulo: 16px de altura, `.label`, com ícone opcional de 14px antes, a 6px de distância
2. Valor: 40px de altura, mono 30px/600, centralizado na vertical
3. Nota: 16px de altura, mono 12px `text-3`, cortada com reticências se não couber

As alturas são fixas para que cada faixa caia na mesma linha horizontal em todos os cartões lado a lado.

**Variações de tom do valor.** `text` (neutro), `green` (construído), `warn` (em andamento). `painel.tsx` ainda prevê `muted`, `cyan` e `danger`, mas nenhuma tela usa.

**Variante de destaque.** Borda `danger` sólida, fundo danger a 5% e brilho externo `0 0 20px` em danger a 12%. É a única sombra do produto. O ícone (ampulheta) e o valor também ficam em `danger`. No burnup é a contagem regressiva até o prazo do MVP: dias, horas, minutos e segundos numa linha só, com os segundos a 60% de opacidade, e "PRAZO ATINGIDO" quando zera. O código reserva a variante para **um cartão por tela**.

**Quando usar.** Na fileira de indicadores do topo, com no máximo cinco cartões.

**Não fazer.** Não usar o destaque em mais de um cartão. Não deixar o valor quebrar em duas linhas: em tela estreita, o espaço entre as partes encolhe e a fonte cai de 20px para 16px antes de qualquer quebra. Não pôr frase no valor.

> **Literal.** A sombra do destaque está escrita como `rgba(244,63,94,.12)`, que é `--bu-danger` a 12% sem referência à variável.

### 4.3 Tabela densa

**Estrutura.**
- Largura total do cartão, com rolagem horizontal quando não cabe.
- Cabeçalho: `.label` (11px, caixa alta, `text-3`), padding de 10px × 16px, alinhado à esquerda e com borda inferior `line`.
- Linhas: padding de 6px × 16px, texto sans 14px e borda superior `line-soft` entre elas.
- Colunas de número, data e id: mono 12px. Colunas de nome: sans 14px. Colunas secundárias (épico, dependência, datas): `text-2`.
- Vazio: "—" em `text-2` na coluna; linha única "Nenhuma fatia em andamento." em `text-3`.
- Linha de total: borda superior `line` (a forte), peso 600, e as colunas de soma herdam a cor semântica da série (em andamento em warn, construído em green).
- Linha de grupo (Fatias): fundo `surface-2`, nome do grupo em 600 e contador `feitas/total` em mono 12px `text-2` peso 400.
- Zero sai em `text-3`, e valor não zero ganha a cor da série. O zero recua e o que tem conteúdo aparece.

**Tratamento de linha por estado.**
- Em andamento: fundo warn a 6%
- Concluída: fundo green a 6%, nome em `text-2` e id em green
- Removida: texto riscado, 40% de opacidade e a data da remoção no `title`
- Caminho crítico: fundo danger a 8% e id em warn

**Quando usar.** Para qualquer lista de itens com atributos comparáveis.

**Não fazer.** Não usar zebra. Não usar borda vertical. Não aumentar o padding vertical (ver a inconsistência de Marcos na seção 3.1). Não centralizar números.

### 4.4 Selo de situação

**Estrutura.** Pílula com padding de 2px × 10px, sans 12px/500 e texto na cor do estado sobre fundo da mesma cor a 12%. Sem borda.

| Estado | Cor |
|---|---|
| Não iniciada | text-2 |
| Em andamento | warn |
| Concluída | green |
| Removida | text-3 |

**Quando usar.** Na coluna de situação de uma tabela, com um selo por linha.

**Não fazer.** Não usar borda (é isso que o diferencia do chip de filtro). Não criar estado com cor fora do vocabulário semântico. A situação por épico, em "Escopo por épico", é texto corrido em `text-2`, não selo.

### 4.5 Alternador de duas opções

**Estrutura.** Trilho com borda `line`, fundo `bg` a 60%, raio de 10px e padding de 4px. Dentro, dois botões de raio 8px, padding de 6px × 12px e sans 14px.
- Ativo: fundo `green`, texto `green-ink` 600, e `green-glow` no hover
- Inativo: sem fundo, texto `text-2`, e `text` no hover

Os rótulos seguem a forma "Por fatia" e "Por story point".

**Onde fica.** À direita do cabeçalho com gradiente, alinhado à base do título.

**Quando usar.** Para trocar a unidade de medida de toda a tela. A escolha fica salva no navegador e vale também em outras telas (Marcos lê a mesma preferência).

**Não fazer.** Não usar para mais de duas opções. Não usar para filtro (filtro é chip).

### 4.6 Chip de filtro

Não estava na lista pedida, mas se repete em duas telas.

**Estrutura.** Pílula com borda de 1px, padding de 4px × 12px e sans 12px.
- Selecionado: borda `teal`, fundo teal a 15% e texto `text`
- Não selecionado: borda `line`, texto `text-2`, e `text` no hover
- Contagem opcional depois do nome, em mono `text-3`
- Precedido por um `.label` ("Épicos", "Estados") e seguido de "limpar" (texto 12px `text-3`, sem borda) quando há seleção

Seleção múltipla. Nada selecionado equivale a tudo.

### 4.7 Barra de navegação

**Estrutura.** Faixa de 48px com fundo `bg` e borda inferior `line`, conteúdo limitado a 1280px e 24px de espaço entre a marca e os links.
- Marca: `●` em green seguido de "status report", mono 12px `text-2`
- Links: sans 14px `text-2`, padding de 6px × 12px, raio de 8px e 4px entre eles; no hover, `text`
- Link ativo: fundo `surface-2` e texto `text`

**Tela cheia.** A navegação some.

**Não fazer.** Não usar ícone nos links. Não usar sublinhado no ativo (o ativo é um degrau de superfície).

### 4.8 Cabeçalho com gradiente

**Estrutura.** Vaza as margens laterais da página, com padding de 32px × 24px, borda inferior `line`, 24px de espaço abaixo e o fundo `.brand-gradient`.
- À esquerda, o título em sans 32px/700 com espaçamento −0.03em. A última parte vai em `.text-grad` (ciano → verde). O padrão é uma parte neutra seguida de uma parte com gradiente: "Burnup MVP ·" + "CRM Ingá Pneus"; "Fatias do" + "escopo"; "Marcos e" + "ritmo".
- Subtítulo opcional com 8px de espaço, sans 14px `text-2` e no máximo 672px de largura. Descreve o recorte em uma frase com datas.
- À direita, alinhado à base: controles da tela (o alternador).

**Tela cheia.** O cabeçalho permanece, porque a tela projetada precisa dizer do que se trata e qual é o prazo.

**Não fazer.** Não aplicar o gradiente em outro lugar. Não pôr o gradiente de texto em mais de uma parte do título.

### 4.9 Faixa de fase

**Estrutura.** Retângulo de 18px de altura e raio de 3px, desenhado **abaixo** das datas do eixo X, fora da área de plotagem. Vai da data de início à data de fim da fase. A cor da fase é usada a 18% no preenchimento e plena no texto. O texto fica centralizado, em mono 9px, caixa alta e espaçamento de 1px. Há 1px de folga em cada ponta, para que fases vizinhas não encostem.

Fases atuais: DISCOVERY (ciano, da abertura ao fechamento do escopo) e DELIVERY (verde, do fechamento ao fim).

**Quando usar.** Para mostrar em que etapa do ciclo cada trecho do eixo de tempo está.

**Não fazer.** Não desenhar a faixa dentro da área do gráfico (para isso existe a área de período, na seção 5.3). Não usar mais cores que as das séries.

### 4.10 Peças menores

- **Legenda de série.** Traço horizontal de 16px, com 2px de espessura, contínuo ou tracejado conforme a série, e o nome em sans 12px `text-2` a 6px de distância.
- **Botão de ícone** (tela cheia): borda `line`, raio de 8px, padding de 6px, ícone de 14px em `text-2` e `text` no hover.
- **Tooltip do gráfico.** Fundo `surface-2`, borda `line`, raio de 10px, padding de 8px × 12px e mono 12px. Data completa `dd/mm/aaaa` em `text-2` e, abaixo, uma linha por série com o nome na cor da série à esquerda e o valor em `text` à direita, com pelo menos 24px entre os dois.
- **Caixa de alerta.** Borda warn a 40%, fundo warn a 10%, texto warn 14px, raio de 10px e padding de 8px × 12px. Aparece só quando a condição ocorre.
- **Dica flutuante.** Centralizada no topo, com fundo `surface-2` a 90%, borda `line`, mono 11px `text-2` e raio de 8px. Some sozinha em 3 segundos.
- **Indicador de rolagem.** "↓ role para ver o detalhamento", mono 11px `text-3`, centralizado na base da primeira dobra. Some quando a página rola.
- **Bloco de leitura.** Três colunas, cada uma com um título sans 14px/600 `text` e um texto sans 14px `text-2` com 4px de espaço.

---

## 5. Gráficos

Hoje há um gráfico só, o burnup (linhas e áreas compostas sobre um eixo de tempo diário). [src/lib/burndown.ts](../src/lib/burndown.ts) está em construção e ainda não tem tela; os comentários de `painel.tsx` indicam que ele reutilizará as mesmas peças.

### 5.1 Cor por tipo de série

| Série | Cor | Traço | Preenchimento | Significado |
|---|---|---|---|---|
| Escopo | cyan | contínuo, 2px (3px em tela cheia) | nenhum | Teto: o total combinado |
| Planejado | text-3 | tracejado 6/4, 2px (3px em tela cheia) | nenhum | Referência de onde deveria estar |
| Construído | green | contínuo, 3px sempre | gradiente vertical de green 22% no topo a 0% na base | O realizado |
| Em andamento | warn | contínuo, 2px (3px em tela cheia) | warn plano a 22% | Trabalho em voo |

Regra que se lê: a série real tem cor saturada e preenchimento, e a de referência é cinza e tracejada.

> **Inconsistência.** A cor do "Planejado" muda conforme o lugar: `text-3` na linha e na legenda, `text-2` no rótulo fixo e no tooltip.

> **Inconsistência.** O "Construído" tem 3px fixos, e as demais séries passam de 2 para 3px em tela cheia. Pode ser intencional (a série principal é sempre mais grossa), mas não há comentário no código dizendo isso.

### 5.2 Linha, área e empilhamento

- **Linha** para total e referência (Escopo, Planejado): o que se compara, mas não se acumula visualmente.
- **Área** para o que foi feito ou está sendo feito (Construído, Em andamento): quantidade que ocupa espaço.
- **Empilhar** o "Em andamento" sobre o "Construído", de modo que a espessura da faixa laranja seja o trabalho em voo. O topo da pilha é "iniciado"; a base é "entregue".
- **Degrau** (`stepAfter`) para tudo que muda por evento de um dia (escopo, construído, em andamento). **Curva suave** (`monotone`) só para o planejado, que é interpolado.
- **Ordem de desenho.** Primeiro as áreas, depois as linhas, para que escopo e planejado fiquem por cima.
- A série em andamento só começa no primeiro início de trabalho, para não desenhar uma borda no zero antes disso. As séries reais param no dia de hoje.

### 5.3 Referências: linha, marco e período

| Elemento | Traço | Rótulo |
|---|---|---|
| Marco intermediário | `line`, tracejado 4/4, 1px | data `dd/mm`, mono 10px `text-3`, no canto superior esquerdo da linha |
| Prazo final (MVP) | `danger`, contínuo, 2px | "MVP PRONTO", mono 11px/600 `danger`, acima da área |
| Hoje | `warn`, contínuo, 1px | "hoje dd/mm", mono 11px `warn`, acima da área |
| Fechamento do escopo | `cyan` a 35%, pontilhado 2/4 | sem rótulo próprio; o rótulo vem do ponto da série Escopo |
| Período (piloto) | sem traço, preenchimento green a 8% | "Piloto", mono 10px green, dentro da área, na base |
| Fase | faixa sob o eixo (ver 4.9) | nome da fase |

Regra que se lê: o marco comum é cinza e tracejado, e só os dois instantes que importam (o prazo e hoje) ficam contínuos e coloridos, com o rótulo acima do gráfico.

### 5.4 Rótulo fixo no ponto em vez de tooltip

O gráfico precisa ser legível numa captura de tela, sem tooltip. Cada série tem um rótulo permanente `Nome · valor`, em mono 11px/600 na cor da série:

- **Escopo**: ponto de 3px no fechamento do escopo, em cyan com contorno de 2px na cor do fundo; rótulo à direita e abaixo.
- **Planejado**: sem ponto, rótulo numa data fixa escolhida por caber acima da curva, ancorado à direita.
- **Em andamento**: ponto de 4px em warn, com contorno na cor do fundo, no topo da pilha no dia de hoje; rótulo à direita.
- **Construído**: halo de 9px em green a 20%, ponto de 4px em green-glow com contorno na cor do fundo no dia de hoje, e o rótulo **no início do eixo X**, na altura do valor atual.

O contorno na cor do fundo recorta o ponto das linhas que passam por baixo.

O tooltip existe como complemento (ver 4.10), com cursor vertical em `line`.

> **Literal.** A data do rótulo do planejado (`ROTULO_PLANEJADO = "2026-10-10"`) e os deslocamentos de cada rótulo (`dx`, `dy`) são ajustados à mão para estes dados.

### 5.5 Grade e eixos

- **Grade.** Só linhas horizontais, em `line-soft`. Sem grade vertical: as linhas verticais do gráfico são todas de referência (marco, hoje, prazo).
- **Eixo X.** Linha em `line`, sem marcas de tick, 6px entre a linha e o texto. Mostra **só as datas com significado no cronograma** (marcos), em `dd/mm`. Hoje e o prazo têm linha própria, então não entram como tick. Em tela cheia cabem mais datas.
- **Eixo Y.** Sem linha e sem marcas de tick. Passo de 20 quando o total é até 100 e de 50 acima disso. O passo cai pela metade quando o gráfico tem 520px ou mais de altura. O topo é o total do escopo arredondado para cima ao passo. Só inteiros. O título do eixo vai rotacionado a −90°, em mono 10px `text-3` ("fatias de entrega", "story points").
- **Ticks.** Mono 11px `text-3`.
- **Margens do gráfico.** 24px no topo (para os rótulos acima), 16px à direita, 8px à esquerda e 22px embaixo (para a faixa de fase). O eixo X ocupa 30px.

### 5.6 Legenda

Na barra de título do cartão do gráfico, **alinhada à direita, na mesma linha** do `.label` que nomeia o gráfico, com 16px entre os itens. O botão de tela cheia fecha a fileira. A ordem segue a das séries: Escopo, Planejado, Construído, Em andamento.

### 5.7 Tela cheia

Pensado para projeção: a navegação e o detalhamento somem, a largura fica livre, os traços engrossam de 2 para 3px e o eixo X ganha mais datas. O cabeçalho e os cartões permanecem.

---

## 6. Princípios

Cada princípio vem do que o código faz, com a evidência ao lado.

1. **Tema escuro único, separado por borda e degrau de superfície, sem sombra.** São três degraus (`bg` → `surface` → `surface-2`) e dois pesos de borda (`line`, `line-soft`). A única sombra do produto é o brilho do cartão de destaque. Não há tema claro nas telas do produto.
2. **Nada se move, exceto a cor no hover.** Todo gráfico tem `isAnimationActive={false}`. As transições são só `transition-colors duration-150`. `tw-animate-css` é importado e não é usado. O único movimento é de conteúdo: o relógio da contagem regressiva.
3. **Número sempre em monoespaçada.** Vale para número, data e id, na tabela, no cartão, no gráfico e no tooltip. Se a linha inteira é número, a linha inteira é mono.
4. **Densidade alta em tabela.** Linha com 6px de padding vertical, texto de 14px e número de 12px. Sem zebra, com separador quase invisível.
5. **Vocabulário cromático pequeno e fixo.** Ciano é escopo, verde é entregue, laranja é em andamento e hoje, vermelho é o prazo e o que o ameaça, cinza é referência. Teal serve só para seleção de filtro. A mesma cor significa a mesma coisa no cartão, na tabela, no selo e no gráfico.
6. **Cor como tinta, não como bloco.** Um estado se expressa com o texto na cor plena sobre um fundo da mesma cor a 5–22%. O único fundo sólido colorido é o do alternador ativo.
7. **Hierarquia por cor e caixa, não por tamanho.** Rótulos são pequenos (11px), em caixa alta, com espaçamento e em `text-3`. O que importa tem cor; o que é zero ou inativo recua para `text-3`.
8. **Um destaque por tela.** Borda colorida e brilho vão em um cartão só.
9. **Legível sem interação.** Rótulos fixos nas séries, ticks só em datas com significado, cabeçalho que permanece em tela cheia e traço que engrossa quando a tela é projetada.
10. **Alinhamento rígido entre irmãos.** As faixas do cartão de número têm altura fixa, para que rótulo, valor e nota caiam na mesma linha em todos os cartões.
11. **Primeira dobra completa.** Cabeçalho, indicadores e gráfico ocupam a janela, e o detalhamento vem na rolagem.
12. **Português e formato local.** Datas em `dd/mm`, decimais com vírgula e rótulos em português.
13. **Ícone só com função.** São três ícones no produto todo: ampulheta (prazo), maximizar e minimizar.

---

## 7. O que não faz parte

Onde o código registra o motivo, ele aparece citado. Onde não registra, o motivo aparece marcado como *inferência*.

- **Tema claro.** Os tokens claros do shadcn existem, mas nenhuma tela do produto os usa. *Inferência:* o painel é feito para tela projetada e captura, e o escuro dá contraste às cores semânticas.
- **Sombras e elevação.** Só existe o brilho do destaque. A profundidade vem da superfície.
- **Animação de entrada e transição de gráfico.** Estão desligadas explicitamente em cada série.
- **Tooltip como fonte primária.** Código: "Rótulos permanentes: o gráfico precisa ser legível numa captura, sem tooltip."
- **Grade vertical e ticks em datas arbitrárias.** Código: "Só datas com significado no cronograma."
- **Legenda embaixo do gráfico.** A legenda fica sempre na barra de título.
- **Cor por categoria.** Épicos não têm cor própria: todo filtro selecionado é teal. *Inferência:* evita que a cor de categoria concorra com a cor semântica.
- **Mais de um destaque.** Código: "Único cartão com borda colorida" e "reservado a um cartão por tela".
- **Gradiente fora do cabeçalho.** O gradiente e o texto em gradiente aparecem uma vez por tela.
- **Zebra e bordas verticais em tabela.**
- **Botões primários sólidos.** Não há botão de ação. O produto só lê dados (a edição é feita no arquivo `src/data/fatias.ts`).
- **Componentes de biblioteca.** Os 46 componentes shadcn instalados não são usados. Todo o visual é feito com utilitários e tokens próprios.
- **Tipos de gráfico além de linha e área.** Não há barra, pizza nem rosca.

---

## Apêndice · Literais a transformar em variável

Pontos que atrapalham o reaproveitamento, em ordem de impacto:

| Literal | Onde | Deveria ser |
|---|---|---|
| `"JetBrains Mono"` (≈10 ocorrências) | Todos os textos do gráfico em `index.tsx` e `painel.tsx` | `var(--font-mono)` |
| `fontSize` 9, 10, 11 | Gráfico | Tokens da escala de texto do gráfico |
| `rgb(30 58 138 / .55)`, `rgb(6 78 59 / .55)` | `.brand-gradient` | `--brand-a`, `--brand-b` |
| `#09090b` | `.brand-gradient` | `var(--bu-bg)` |
| `rgba(244,63,94,.12)` | Sombra do destaque (`painel.tsx`) | `var(--bu-danger)` com opacidade |
| Tintas `6%`, `8%`, `12%` em `color-mix` inline | `fatias.tsx`, `index.tsx` | Escala única de tinta |
| Opacidades 0.08, 0.18, 0.2, 0.22, 0.35 | Gráfico | Mesma escala de tinta |
| `text-[32px]`, `tracking-[-0.03em]` | Título (`AppNav.tsx`) | Token de título |
| `text-[11px]` | Dicas (`painel.tsx`) | Mesmo token de `.label` |
| `max-w-[1280px]` | `AppNav.tsx`, `__root.tsx` | Token de largura |
| `calc(100dvh - 49px)` | Primeira dobra | Variável com a altura da navegação |
| `min-h-[120px]`, `min-h-[420px]` | Cartão de número, cartão do gráfico | Tokens de componente |
| `rx=3`, `height=18`, `+30` (altura do eixo) | Faixa de fase | Raio da escala; constante compartilhada com o eixo |
| Traços `2`/`3`, tracejados `6 4`, `4 4`, `2 4` | Gráfico | Tokens de traço |
| Classes de `TH`/`TD` repetidas | `fatias.tsx`, `marcos.tsx` | As constantes de `painel.tsx` |
