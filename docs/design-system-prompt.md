# Prompt de aplicação do design system

Cole o bloco abaixo na ferramenta de geração. Antes, troque tudo que está marcado com `[AJUSTAR]`.

Este prompt resolve as inconsistências registradas em `design-system.md` escolhendo um valor só para cada caso: a linha de referência em text-3 em todos os lugares, uma escala de tintas, título de 32px e padding de linha de tabela de 6px em todas as tabelas.

---

```text
Construa a interface deste produto seguindo o design system descrito abaixo. A especificação é completa e não depende de nenhum outro material. Não use componentes prontos de biblioteca com aparência própria: implemente cada peça a partir dos valores daqui. Onde esta especificação não disser nada, escolha a opção mais sóbria.

## 1. Estética

Painel de acompanhamento em tema escuro único, denso e sem ornamento, feito para ser lido de longe numa tela projetada e numa captura de tela sem interação. A profundidade vem de degraus de superfície e bordas finas, nunca de sombra. A cor é pouca e sempre quer dizer alguma coisa: cada tom tem um significado fixo, que se repete igual em cartão, tabela, selo e gráfico.

## 2. Cores

Use exatamente estes valores, como variáveis nomeadas. Não escreva cor solta em componente.

Superfícies
- bg #09090b: fundo da página e da barra de navegação. Também é o contorno que recorta pontos de gráfico das linhas atrás deles.
- surface #111113: fundo de cartão.
- surface-2 #18181b: estado ativo, cabeçalho de grupo em tabela e camada flutuante (tooltip, dica).
- line #27272a: borda de cartão, borda de cabeçalho de tabela, linha de total, linha de eixo e linha de marco.
- line-soft #1f1f23: separador entre linhas de tabela e grade do gráfico.

Texto
- text #fafafa: texto principal.
- text-2 #a1a1aa: texto secundário, subtítulo, legenda, colunas secundárias, links inativos.
- text-3 #52525b: rótulos de seção, notas, ticks de eixo, séries e linhas de referência, zeros e itens removidos.

Acentos
- cyan #22d3ee [AJUSTAR significado]: neste produto, "escopo", o total combinado. Também é o início do gradiente de texto.
- green #10b981 [AJUSTAR significado]: neste produto, "entregue" e o que vem depois da entrega (período de piloto, fase de entrega, diferença positiva frente ao plano).
- green-glow #34d399: hover do elemento verde e ponto do valor atual da série verde.
- green-ink #052e1b: texto sobre fundo verde.
- teal #14b8a6: exclusivamente seleção de filtro. Não carrega significado de dado.

Semânticas
- warn #f59e0b [AJUSTAR significado]: neste produto, "trabalho em andamento" e "o dia de hoje". Também é a cor do alerta de fluxo travado.
- danger #f43f5e [AJUSTAR significado]: neste produto, "o prazo e o que o ameaça" (o prazo final, a diferença negativa frente ao plano, os itens do caminho crítico). Não é cor de erro de sistema.

Estados de item, cada um com sua cor:
- Não iniciado: text-2
- Em andamento: warn
- Concluído: green
- Removido: text-3

Escala de tinta (cor semântica com transparência sobre a superfície). Use só estes degraus:
- 5%: fundo do cartão de destaque
- 6%: fundo de linha de tabela por estado
- 8%: fundo de linha crítica e fundo de área de período no gráfico
- 10%: fundo de caixa de alerta
- 12%: fundo de selo de situação e brilho do cartão de destaque
- 15%: fundo de chip selecionado
- 18%: faixa de fase
- 22%: preenchimento de área no gráfico
- 40%: borda de caixa de alerta

Gradiente da marca [AJUSTAR: tons e ângulo], usado só no fundo do cabeçalho de página. São duas camadas:
- Camada de baixo: gradiente linear a 100 graus. Começa em azul-marinho rgb(30, 58, 138) a 55% de opacidade, passa pelo fundo da página #09090b opaco no meio (50%) e termina em verde-escuro rgb(6, 78, 59) a 55% de opacidade. O centro volta ao fundo, de modo que só as pontas acendem.
- Camada de cima: textura de barras verticais. É uma linha branca de 1px a 3,5% de opacidade, repetida a cada 8px na horizontal. Deve ser quase imperceptível.

Gradiente de texto [AJUSTAR: cores], usado só na parte de destaque do título: horizontal, de cyan para green, recortado no texto.

## 3. Tipografia

Duas famílias:
- Sans: Inter, pesos 400, 500, 600 e 700. Fallback para a sans do sistema.
- Mono: JetBrains Mono, pesos 400 e 600. Fallback para a mono do sistema.

Regra de uso:
- Mono para tudo que é contável, comparável ou identificador: número, data, id, contagem, contagem regressiva, todo texto dentro de gráfico, tooltip, notas sob valores e dicas de sistema. Se todas as colunas de uma tabela são número ou data, a linha inteira vai em mono.
- Sans para tudo que é nome ou frase: título, subtítulo, nome de item e de categoria, texto de situação, legenda, rótulo de seção, link, botão, chip.

Escala (papel: família, tamanho, peso, espaçamento entre letras, altura de linha, cor):
- Título de página: sans, 32px, 700, −0.03em, 1.25, text. A parte de destaque leva o gradiente de texto.
- Valor de cartão de número: mono, 30px, 600, normal, 36px, text ou a cor semântica.
- Valor de contagem regressiva: mono, 20px (16px abaixo de 640px de largura), 600, normal, 28px, danger.
- Corpo, célula de tabela, link, botão: sans, 14px, 400, normal, 20px.
- Subtítulo de cabeçalho: sans, 14px, 400, normal, 20px, text-2, largura máxima de 672px.
- Número em tabela, nota de cartão, tooltip: mono, 12px, 400, normal, 16px.
- Chip, legenda: sans, 12px, 400, normal, 16px.
- Selo de situação: sans, 12px, 500, normal, 16px.
- Rótulo de seção e cabeçalho de tabela: sans, 11px, 500, 1.5px, caixa alta, 16px, text-3.
- Dica de sistema: mono, 11px, 400, normal, 16px, text-2 ou text-3.
- Gráfico, tick de eixo: mono, 11px, 400, text-3.
- Gráfico, rótulo fixo de série e rótulo do prazo final: mono, 11px, 600, na cor da série.
- Gráfico, rótulo de "hoje": mono, 11px, 400, warn.
- Gráfico, título de eixo, rótulo de marco, rótulo de período: mono, 10px, 400, text-3 (o período usa a sua cor).
- Gráfico, faixa de fase: mono, 9px, 400, 1px, caixa alta, na cor da fase.

## 4. Espaçamento e raio

A base é 4px. Use só estes valores: 2, 4, 6, 8, 10, 12, 16, 20, 24, 32 e 64px.

Referências fixas:
- Página: largura máxima de 1280px, centralizada, com 24px de margem lateral. Em tela cheia a largura fica livre.
- Barra de navegação: 48px de altura mais 1px de borda.
- Entre blocos: 16px. Entre cartões na grade: 16px. Abaixo do cabeçalho: 24px. Fim da página: 64px.
- Cartão de conteúdo: padding de 20px. Cartão de número: padding de 16px.
- Célula de tabela: 6px na vertical e 16px na horizontal. Cabeçalho de tabela: 10px e 16px.
- Botão, link e chip: 12px na horizontal. Botão e link: 6px na vertical. Chip: 4px na vertical.

Raio:
- 14px: cartão e cartão de número.
- 10px: trilho do alternador, tooltip, caixa de alerta.
- 8px: botão, link de navegação, botão de ícone, dica flutuante.
- Pílula: chip e selo.
- 3px: faixa de fase no gráfico.
- O contêiner sempre tem raio maior que o controle dentro dele.

## 5. Componentes

Cartão
Fundo surface, borda de 1px em line, raio de 14px, sem sombra. Quando envolve uma tabela, não tem padding: a tabela vai até a borda, e só o título interno recebe recuo de 20px nas laterais e 16px no topo. O título interno é sempre um rótulo de seção (11px, caixa alta, text-3) e pode levar uma contagem depois de " · ". Não aninhe cartões. Não colora a borda.

Cartão de número
Altura mínima de 120px e três faixas de altura fixa distribuídas na vertical: rótulo (16px de altura, rótulo de seção, ícone opcional de 14px antes a 6px de distância), valor (40px de altura, mono 30px/600) e nota (16px de altura, mono 12px text-3, cortada com reticências). As alturas são fixas para que as três faixas se alinhem na horizontal entre cartões vizinhos. O valor usa text, ou a cor semântica do que mede. Os cartões ficam numa grade de 2 colunas, 3 a partir de 768px e 5 a partir de 1280px. O valor nunca quebra linha.

Cartão de número, variante de destaque [AJUSTAR: o que é destacado; aqui é a contagem regressiva até o prazo]
Borda sólida em danger, fundo danger a 5% e brilho externo de 20px de desfoque em danger a 12%. É a única sombra do produto. O ícone e o valor também ficam em danger. Na contagem regressiva, dias, horas, minutos e segundos ficam numa linha só, em pares de dois dígitos, com os segundos a 60% de opacidade; ao zerar, mostra uma frase de prazo atingido. Use no máximo uma vez por tela.

Tabela densa
Ocupa a largura do cartão, com rolagem horizontal quando não couber. O cabeçalho usa o estilo de rótulo de seção, alinhado à esquerda, com borda inferior em line. As linhas são separadas por borda superior em line-soft. Nomes vão em sans 14px; número, data e id em mono 12px; colunas secundárias em text-2. Célula vazia mostra um travessão. Tabela vazia mostra uma linha única em text-3. Valor zero fica em text-3, e valor não zero fica na cor semântica da coluna. A linha de total tem borda superior em line (a forte), peso 600, e as somas levam a cor semântica da coluna. A linha de grupo tem fundo surface-2, nome em 600 e contador "feitos/total" em mono 12px text-2.
Linha por estado: em andamento com fundo warn a 6%; concluída com fundo green a 6%, nome em text-2 e id em green; removida riscada, a 40% de opacidade; crítica com fundo danger a 8%.
Não use zebra, borda vertical nem número centralizado.

Selo de situação
Pílula sem borda, com padding de 2px × 10px, sans 12px/500 e texto na cor do estado sobre fundo da mesma cor a 12%. Um selo por linha, só na coluna de situação.

Chip de filtro
Pílula com borda de 1px e padding de 4px × 12px, sans 12px. Não selecionado: borda line, texto text-2, e text no hover. Selecionado: borda teal, fundo teal a 15% e texto text. Pode mostrar uma contagem em mono text-3 depois do nome. A fileira começa com um rótulo de seção e termina com "limpar" (12px text-3, sem borda) quando há seleção. Permite seleção múltipla, e nada selecionado equivale a tudo.

Alternador de duas opções [AJUSTAR: rótulos; aqui "Por fatia" e "Por story point"]
Trilho com borda line, fundo bg a 60%, raio de 10px e padding de 4px. Dentro, dois botões de raio 8px, padding de 6px × 12px e sans 14px. Ativo: fundo green, texto green-ink 600 e green-glow no hover. Inativo: sem fundo, text-2, e text no hover. Troca a unidade de medida da tela inteira, e a escolha persiste entre telas. Não use para mais de duas opções nem para filtro.

Barra de navegação
Faixa de 48px com fundo bg, borda inferior line e conteúdo limitado a 1280px. À esquerda fica a marca [AJUSTAR: nome], com um ponto cheio em green seguido do nome em mono 12px text-2. A 24px da marca, os links: sans 14px text-2, padding de 6px × 12px, raio de 8px e 4px entre eles; text no hover. O link ativo tem fundo surface-2 e texto text, sem sublinhado. Sem ícones. Some em tela cheia.

Cabeçalho com gradiente
Vaza as margens laterais da página, com padding de 32px na vertical e 24px na horizontal, borda inferior line e o gradiente da marca no fundo. À esquerda fica o título, composto de uma parte neutra seguida de uma parte com gradiente de texto (por exemplo "Nome da tela ·" + "Recorte"), e abaixo, a 8px, um subtítulo opcional que descreve o recorte em uma frase com datas. À direita, alinhados à base do título, os controles da tela. Permanece em tela cheia. O gradiente não aparece em nenhum outro lugar.

Faixa de fase [AJUSTAR: nomes e datas das fases; aqui DISCOVERY em cyan e DELIVERY em green]
Retângulo de 18px de altura e raio de 3px, desenhado abaixo das datas do eixo de tempo, fora da área de plotagem, indo do início ao fim da fase. Preenchimento na cor da fase a 18% e texto centralizado na cor plena, mono 9px, caixa alta, espaçamento de 1px. Há 1px de folga em cada ponta para que fases vizinhas não se toquem.

Peças menores
- Legenda de série: traço horizontal de 16px com 2px de espessura (contínuo ou tracejado, igual à série), seguido do nome em sans 12px text-2 a 6px.
- Botão de ícone: borda line, raio de 8px, padding de 6px, ícone de 14px em text-2 e text no hover.
- Tooltip: fundo surface-2, borda line, raio de 10px, padding de 8px × 12px, mono 12px. Data completa em text-2 e, abaixo, uma linha por série com o nome na cor da série à esquerda e o valor em text à direita, com pelo menos 24px entre os dois.
- Caixa de alerta: borda warn a 40%, fundo warn a 10%, texto warn 14px, raio de 10px, padding de 8px × 12px. Só aparece quando a condição ocorre.
- Dica flutuante: centralizada no topo, fundo surface-2 a 90%, borda line, raio de 8px, mono 11px text-2. Some sozinha em 3 segundos.
- Indicador de rolagem: seta para baixo seguida de uma frase curta, mono 11px text-3, centralizado na base da primeira dobra. Some quando a página rola.

## 6. Gráficos

Cor e forma por série [AJUSTAR: nomes das séries; aqui é um burnup]:
- Total ou teto (Escopo): linha contínua em cyan, 2px, sem preenchimento, em degrau.
- Referência (Planejado): linha tracejada em text-3 (traço de 6, intervalo de 4), 2px, curva suave, sem preenchimento.
- Realizado (Construído): área em green com traço de 3px e preenchimento em gradiente vertical, de 22% no topo a 0% na base, em degrau.
- Em curso (Em andamento): área em warn empilhada sobre o realizado, com traço de 2px, preenchimento plano a 22% e em degrau. A espessura da faixa é o trabalho em curso.
Regra geral: o real é saturado e preenchido, e a referência é cinza e tracejada.

Linha, área e pilha:
- Linha para total e referência. Área para quantidade realizada ou em curso.
- Empilhe o em curso sobre o realizado.
- Use degrau para séries que mudam por evento de um dia. Use curva suave só para séries interpoladas.
- Desenhe as áreas primeiro e as linhas por cima.
- Uma série só começa quando tem o primeiro valor real. As séries reais param no dia de hoje.

Referências:
- Marco intermediário: linha vertical em line, tracejada 4/4, 1px, com a data em mono 10px text-3 no canto superior esquerdo.
- Prazo final [AJUSTAR: rótulo; aqui "MVP PRONTO"]: linha vertical contínua em danger, 2px, com rótulo em mono 11px/600 danger acima da área.
- Hoje: linha vertical contínua em warn, 1px, com o rótulo "hoje dd/mm" em mono 11px warn acima da área.
- Fechamento de etapa: linha vertical pontilhada (2/4) na cor da série relacionada a 35%, sem rótulo próprio.
- Período [AJUSTAR: nome; aqui "Piloto"]: área vertical sem traço, preenchida na cor do período a 8%, com rótulo em mono 10px na base, por dentro.
- Fases: faixa sob o eixo, conforme o componente Faixa de fase.
Só o prazo final e hoje são contínuos e coloridos. Todo o resto é cinza ou translúcido.

Rótulo fixo em vez de tooltip:
- Toda série tem um rótulo permanente "Nome · valor", em mono 11px/600 na cor da série, preso a um ponto relevante (fechamento, valor atual).
- O ponto do valor atual da série realizada tem um halo de 9px de raio a 20% e um ponto de 4px em green-glow. Pontos de outras séries têm 3 a 4px. Todos têm contorno de 2px na cor do fundo, para se recortarem das linhas.
- O rótulo do realizado fica no início do eixo de tempo, na altura do valor atual.
- O gráfico precisa ser legível numa captura estática. O tooltip é complemento, com cursor vertical em line.

Grade e eixos:
- Só grade horizontal, em line-soft. Nunca grade vertical: as linhas verticais são reservadas a referências.
- Eixo de tempo com linha em line, sem marcas de tick e 6px entre a linha e o texto. Ticks só nas datas com significado no cronograma, no formato dd/mm. Hoje e o prazo não viram tick, porque têm linha própria.
- Eixo de valor sem linha e sem marcas de tick, só com inteiros. O passo é 20 quando o máximo é até 100 e 50 acima disso, e cai pela metade quando o gráfico tem 520px ou mais de altura. O topo é o máximo arredondado para cima ao passo. O título do eixo vai rotacionado, em mono 10px text-3.
- Ticks em mono 11px text-3.
- Margens internas: 24px no topo (para os rótulos acima), 16px à direita, 8px à esquerda e 22px embaixo (para a faixa de fase).

Legenda:
Na barra de título do cartão do gráfico, alinhada à direita, na mesma linha do rótulo de seção que nomeia o gráfico, com 16px entre os itens, na ordem das séries. O botão de tela cheia fecha a fileira. Nunca embaixo do gráfico.

Tela cheia:
A navegação e o detalhamento somem, a largura fica livre, os traços de 2px passam a 3px e o eixo de tempo ganha mais datas. O cabeçalho e os cartões de número permanecem.

## 7. Princípios

- Use tema escuro único. Separe camadas por degrau de superfície (bg, surface, surface-2) e por borda (line, line-soft). Não use sombra, exceto no cartão de destaque.
- Não anime nada. A única transição permitida é a de cor no hover, com 150ms. Gráficos aparecem já desenhados.
- Escreva todo número, data e id em monoespaçada, em qualquer lugar.
- Mantenha as tabelas densas: 6px de padding vertical por linha, texto de 14px, número de 12px e separador quase invisível.
- Use o vocabulário cromático fixo. Cada cor semântica tem um significado só e o repete em cartão, tabela, selo e gráfico. Não crie cor nova para categoria.
- Expresse estado com texto na cor plena sobre fundo tingido da escala de tinta, não com bloco sólido.
- Faça a hierarquia por cor e caixa alta, não por tamanho. O que é zero ou inativo recua para text-3.
- Destaque um cartão por tela, no máximo.
- Faça a tela legível sem interação: rótulos fixos nas séries, ticks só em datas com significado e cabeçalho que permanece em tela cheia.
- Alinhe irmãos com alturas fixas.
- Faça a primeira dobra caber na janela: cabeçalho, indicadores e gráfico juntos, com o detalhamento abaixo.
- Use ícone só quando ele tem função (prazo, tela cheia). Nada decorativo.
- Use formato local [AJUSTAR se não for pt-BR]: datas dd/mm e decimais com vírgula.

## 8. O que não fazer

- Não criar tema claro.
- Não usar sombra, elevação ou desfoque, exceto no cartão de destaque.
- Não usar animação de entrada, transição de gráfico, esqueleto de carregamento pulsante nem transição de rota.
- Não depender de tooltip para ler um valor.
- Não desenhar grade vertical nem pôr tick em data sem significado.
- Não pôr a legenda embaixo do gráfico.
- Não dar cor própria a categorias (a seleção de filtro é sempre teal).
- Não usar o gradiente da marca fora do cabeçalho, nem o gradiente de texto em mais de uma parte do título.
- Não usar mais de um cartão de destaque por tela.
- Não usar zebra, borda vertical ou número centralizado em tabela.
- Não usar botão primário sólido colorido. O único fundo sólido colorido é o da opção ativa do alternador.
- Não usar barra, pizza ou rosca onde linha e área resolvem.
- Não escrever cor, família de fonte, tamanho de fonte, raio ou opacidade diretamente em componente. Tudo sai das variáveis desta especificação, inclusive dentro do gráfico.
- Não inventar degraus de espaçamento, tinta ou tipografia fora das escalas acima.
```
