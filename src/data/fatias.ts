// Fonte de verdade do painel: a planilha do time de 02/10, com a situação informada card a card.
// Para atualizar: troque a `situacao` (ou o `prazo`) do card e publique. Nada aqui é derivado de outro arquivo.
// `entradaEscopo` reproduz os degraus do escopo de 81 cards fechado em 17/09 (cada card na data do card antigo
// de que descende); os 6 que não existiam entram em 02/10, e o escopo vai a 87.

export type Situacao = "concluido" | "andamento" | "parcial" | "a_fazer"

export type Card = {
  id: string
  modulo: string
  nome: string
  peso: number
  entradaEscopo: string         // ISO, quando o card passou a existir
  prazo: string | null          // ISO, null para itens sem data
  prazoOriginal: string | null  // preenchido quando houve replanejamento
  fase: "discovery" | "delivery"
  responsavel: "produto" | "desenvolvimento" | "orquestrador"
  dependeDe: string | null
  situacao: Situacao
}

/** Data da planilha: o estado de cada card vale até aqui. */
export const REVISAO = "2026-10-02"

/** Módulos na ordem do produto, cada um com a cor do agrupamento. Os cards dizem a qual pertencem pelo nome. */
export const MODULOS_BASE: { id: string; cor: string }[] = [
  { id: "Plataforma", cor: "#22d3ee" },
  { id: "Empresas", cor: "#38bdf8" },
  { id: "Perfis", cor: "#818cf8" },
  { id: "Registro", cor: "#a78bfa" },
  { id: "Base de clientes", cor: "#c084fc" },
  { id: "Integrações", cor: "#e879f9" },
  { id: "Infraestrutura", cor: "#94a3b8" },
  { id: "Canal", cor: "#2dd4bf" },
  { id: "Atendimento", cor: "#4ade80" },
  { id: "Funil", cor: "#a3e635" },
  { id: "Campanhas", cor: "#fde047" },
  { id: "Ofertas", cor: "#fb923c" },
  { id: "Visão Geral", cor: "#f472b6" },
  { id: "Orquestrador", cor: "#60a5fa" },
  { id: "Produto", cor: "#fda4af" },
  { id: "Dashboard", cor: "#fcd34d" },
  { id: "Permissionamento", cor: "#c4b5fd" },
  { id: "Catálogo", cor: "#fdba74" },
  { id: "Clientes", cor: "#5eead4" },
]

export const CARDS: Card[] = [
  { id: "B02", modulo: "Plataforma", nome: "Contas dos vendedores no diretório", peso: 1, entradaEscopo: "2026-09-02", prazo: "2026-10-20", prazoOriginal: "2026-09-26", fase: "discovery", responsavel: "produto", dependeDe: "TI", situacao: "andamento" },
  { id: "B05", modulo: "Plataforma", nome: "Número do piloto na Meta", peso: 1, entradaEscopo: "2026-09-02", prazo: "2026-10-20", prazoOriginal: "2026-09-26", fase: "discovery", responsavel: "produto", dependeDe: "TI e Sipal", situacao: "andamento" },
  { id: "B07", modulo: "Plataforma", nome: "Comercial fecha o recorte do piloto", peso: 1, entradaEscopo: "2026-09-02", prazo: "2026-10-20", prazoOriginal: "2026-09-26", fase: "discovery", responsavel: "produto", dependeDe: "Comercial", situacao: "andamento" },
  { id: "P04", modulo: "Plataforma", nome: "Carga de filiais, regionais e vendedores", peso: 3, entradaEscopo: "2026-09-11", prazo: "2026-09-26", prazoOriginal: null, fase: "delivery", responsavel: "desenvolvimento", dependeDe: "Planilha do comercial", situacao: "concluido" },
  { id: "PER-F2", modulo: "Perfis", nome: "Papel e alcance", peso: 3, entradaEscopo: "2026-09-11", prazo: "2026-09-26", prazoOriginal: null, fase: "delivery", responsavel: "desenvolvimento", dependeDe: null, situacao: "concluido" },
  { id: "D04", modulo: "Base de clientes", nome: "Higienização de telefone", peso: 3, entradaEscopo: "2026-09-17", prazo: "2026-09-26", prazoOriginal: null, fase: "delivery", responsavel: "desenvolvimento", dependeDe: null, situacao: "concluido" },
  { id: "REG-F1", modulo: "Registro", nome: "Cadastro de cliente e contato", peso: 4, entradaEscopo: "2026-09-17", prazo: "2026-09-26", prazoOriginal: null, fase: "delivery", responsavel: "desenvolvimento", dependeDe: null, situacao: "concluido" },
  { id: "EMP-F1", modulo: "Empresas", nome: "Empresa pelo slug e 404 genérica", peso: 3, entradaEscopo: "2026-09-17", prazo: "2026-09-26", prazoOriginal: null, fase: "delivery", responsavel: "desenvolvimento", dependeDe: null, situacao: "concluido" },
  { id: "EMP-F2", modulo: "Empresas", nome: "Cadastro de empresas e filiais com identidade visual", peso: 3, entradaEscopo: "2026-09-17", prazo: "2026-09-26", prazoOriginal: null, fase: "delivery", responsavel: "desenvolvimento", dependeDe: null, situacao: "concluido" },
  { id: "EMP-F3", modulo: "Empresas", nome: "Empresa de entrada e contato não identificado", peso: 2, entradaEscopo: "2026-09-17", prazo: "2026-09-26", prazoOriginal: null, fase: "delivery", responsavel: "desenvolvimento", dependeDe: null, situacao: "concluido" },
  { id: "PER-F5", modulo: "Perfis", nome: "Cargos e perfis", peso: 3, entradaEscopo: "2026-09-17", prazo: "2026-09-26", prazoOriginal: null, fase: "delivery", responsavel: "desenvolvimento", dependeDe: null, situacao: "concluido" },
  { id: "PER-F6", modulo: "Perfis", nome: "Gestão de usuários: convite, vínculos e desativação", peso: 3, entradaEscopo: "2026-09-17", prazo: "2026-09-26", prazoOriginal: null, fase: "delivery", responsavel: "desenvolvimento", dependeDe: null, situacao: "concluido" },
  { id: "REG-F7", modulo: "Registro", nome: "Importação de clientes e contatos por planilha", peso: 3, entradaEscopo: "2026-09-17", prazo: "2026-09-26", prazoOriginal: null, fase: "delivery", responsavel: "desenvolvimento", dependeDe: null, situacao: "concluido" },
  { id: "REG-F8", modulo: "Registro", nome: "Memórias do cliente", peso: 1, entradaEscopo: "2026-09-17", prazo: "2026-09-26", prazoOriginal: null, fase: "delivery", responsavel: "desenvolvimento", dependeDe: null, situacao: "concluido" },
  { id: "P05", modulo: "Plataforma", nome: "Tempo real", peso: 3, entradaEscopo: "2026-09-17", prazo: "2026-09-26", prazoOriginal: null, fase: "delivery", responsavel: "desenvolvimento", dependeDe: null, situacao: "concluido" },
  { id: "C01", modulo: "Canal", nome: "Envio pelo orquestrador", peso: 3, entradaEscopo: "2026-09-17", prazo: "2026-09-26", prazoOriginal: null, fase: "delivery", responsavel: "desenvolvimento", dependeDe: null, situacao: "concluido" },
  { id: "C02", modulo: "Canal", nome: "Entrada MCP do orquestrador", peso: 3, entradaEscopo: "2026-09-17", prazo: "2026-09-26", prazoOriginal: null, fase: "delivery", responsavel: "desenvolvimento", dependeDe: null, situacao: "concluido" },
  { id: "ATD-F7", modulo: "Atendimento", nome: "Caixa de entrada com filas e SLA", peso: 3, entradaEscopo: "2026-09-17", prazo: "2026-09-26", prazoOriginal: null, fase: "delivery", responsavel: "desenvolvimento", dependeDe: null, situacao: "concluido" },
  { id: "FUN-F7", modulo: "Funil", nome: "Cotações com itens de ofertas ativas", peso: 3, entradaEscopo: "2026-09-15", prazo: "2026-09-26", prazoOriginal: null, fase: "delivery", responsavel: "desenvolvimento", dependeDe: null, situacao: "andamento" },
  { id: "INT-F1", modulo: "Integrações", nome: "Integrações globais", peso: 5, entradaEscopo: "2026-09-17", prazo: "2026-09-26", prazoOriginal: null, fase: "delivery", responsavel: "desenvolvimento", dependeDe: null, situacao: "concluido" },
  { id: "INT-F2", modulo: "Integrações", nome: "Agendador interno", peso: 3, entradaEscopo: "2026-09-17", prazo: "2026-09-26", prazoOriginal: null, fase: "delivery", responsavel: "desenvolvimento", dependeDe: null, situacao: "concluido" },
  { id: "INT-F3", modulo: "Integrações", nome: "API do CRM documentada", peso: 1, entradaEscopo: "2026-09-17", prazo: "2026-09-26", prazoOriginal: null, fase: "delivery", responsavel: "desenvolvimento", dependeDe: null, situacao: "concluido" },
  { id: "B01", modulo: "Plataforma", nome: "Forma de pagamento na conta da Meta", peso: 1, entradaEscopo: "2026-09-02", prazo: "2026-10-20", prazoOriginal: "2026-09-30", fase: "discovery", responsavel: "produto", dependeDe: "Financeiro e TI", situacao: "andamento" },
  { id: "B06", modulo: "Plataforma", nome: "Templates enviados para aprovação", peso: 1, entradaEscopo: "2026-09-02", prazo: "2026-10-20", prazoOriginal: "2026-10-03", fase: "discovery", responsavel: "produto", dependeDe: "Meta", situacao: "andamento" },
  { id: "B08", modulo: "Produto", nome: "Jurídico define base legal e consentimento", peso: 1, entradaEscopo: "2026-09-02", prazo: "2026-10-20", prazoOriginal: "2026-10-03", fase: "discovery", responsavel: "produto", dependeDe: "Jurídico", situacao: "andamento" },
  { id: "C06", modulo: "Canal", nome: "Qualidade do número e limite diário", peso: 2, entradaEscopo: "2026-09-17", prazo: "2026-10-03", prazoOriginal: null, fase: "delivery", responsavel: "desenvolvimento", dependeDe: "B05", situacao: "andamento" },
  { id: "C07", modulo: "Canal", nome: "Teste ponta a ponta com 10 números", peso: 2, entradaEscopo: "2026-09-17", prazo: "2026-10-03", prazoOriginal: null, fase: "delivery", responsavel: "desenvolvimento", dependeDe: "B05", situacao: "a_fazer" },
  { id: "SPK-B1", modulo: "Canal", nome: "Contato e insumos", peso: 1, entradaEscopo: "2026-09-02", prazo: "2026-10-03", prazoOriginal: null, fase: "discovery", responsavel: "produto", dependeDe: null, situacao: "concluido" },
  { id: "PER-F1", modulo: "Perfis", nome: "Conta e autenticação", peso: 3, entradaEscopo: "2026-09-17", prazo: "2026-10-03", prazoOriginal: null, fase: "delivery", responsavel: "desenvolvimento", dependeDe: null, situacao: "concluido" },
  { id: "PER-F3", modulo: "Perfis", nome: "Visibilidade na consulta", peso: 3, entradaEscopo: "2026-09-11", prazo: "2026-10-03", prazoOriginal: null, fase: "delivery", responsavel: "desenvolvimento", dependeDe: null, situacao: "concluido" },
  { id: "PER-F4", modulo: "Perfis", nome: "Auditoria de acesso", peso: 2, entradaEscopo: "2026-09-11", prazo: "2026-10-03", prazoOriginal: null, fase: "delivery", responsavel: "desenvolvimento", dependeDe: null, situacao: "a_fazer" },
  { id: "D06", modulo: "Base de clientes", nome: "Carteira do cliente", peso: 2, entradaEscopo: "2026-09-17", prazo: "2026-10-03", prazoOriginal: null, fase: "delivery", responsavel: "desenvolvimento", dependeDe: null, situacao: "concluido" },
  { id: "D07", modulo: "Base de clientes", nome: "Importação de baixa relevância", peso: 1, entradaEscopo: "2026-09-17", prazo: "2026-10-03", prazoOriginal: null, fase: "delivery", responsavel: "desenvolvimento", dependeDe: "B07", situacao: "a_fazer" },
  { id: "REG-F2", modulo: "Registro", nome: "Vocabulário de autoria", peso: 2, entradaEscopo: "2026-09-11", prazo: "2026-10-03", prazoOriginal: null, fase: "delivery", responsavel: "desenvolvimento", dependeDe: null, situacao: "concluido" },
  { id: "REG-F4", modulo: "Registro", nome: "Auditoria de alteração", peso: 3, entradaEscopo: "2026-09-11", prazo: "2026-10-03", prazoOriginal: null, fase: "delivery", responsavel: "desenvolvimento", dependeDe: null, situacao: "concluido" },
  { id: "CMP-F0", modulo: "Campanhas", nome: "Costura: parâmetros do canal e templates", peso: 1, entradaEscopo: "2026-09-08", prazo: "2026-10-03", prazoOriginal: null, fase: "delivery", responsavel: "desenvolvimento", dependeDe: null, situacao: "concluido" },
  { id: "ATD-F6", modulo: "Atendimento", nome: "Opt-out e contenções", peso: 2, entradaEscopo: "2026-09-17", prazo: "2026-10-03", prazoOriginal: null, fase: "delivery", responsavel: "desenvolvimento", dependeDe: null, situacao: "concluido" },
  { id: "X01", modulo: "Infraestrutura", nome: "CI com lint, tipos e testes", peso: 2, entradaEscopo: "2026-09-17", prazo: "2026-10-03", prazoOriginal: null, fase: "delivery", responsavel: "desenvolvimento", dependeDe: null, situacao: "a_fazer" },
  { id: "C03", modulo: "Canal", nome: "Status e falha por mensagem", peso: 2, entradaEscopo: "2026-09-17", prazo: "2026-10-03", prazoOriginal: null, fase: "delivery", responsavel: "desenvolvimento", dependeDe: null, situacao: "concluido" },
  { id: "B03", modulo: "Infraestrutura", nome: "Banco de produção MongoDB com credencial", peso: 1, entradaEscopo: "2026-09-02", prazo: "2026-10-20", prazoOriginal: "2026-10-10", fase: "discovery", responsavel: "produto", dependeDe: "TI", situacao: "andamento" },
  { id: "CMP-F1", modulo: "Campanhas", nome: "Disparo com unicidade", peso: 5, entradaEscopo: "2026-09-08", prazo: "2026-10-10", prazoOriginal: null, fase: "delivery", responsavel: "desenvolvimento", dependeDe: null, situacao: "andamento" },
  { id: "CMP-F2", modulo: "Campanhas", nome: "Público congelado e aprovação", peso: 4, entradaEscopo: "2026-09-08", prazo: "2026-10-10", prazoOriginal: null, fase: "delivery", responsavel: "desenvolvimento", dependeDe: null, situacao: "concluido" },
  { id: "CMP-F3", modulo: "Campanhas", nome: "Segmentação e régua", peso: 3, entradaEscopo: "2026-09-08", prazo: "2026-10-10", prazoOriginal: null, fase: "delivery", responsavel: "desenvolvimento", dependeDe: null, situacao: "concluido" },
  { id: "CMP-F4", modulo: "Campanhas", nome: "Oferta mensagem cadência custo", peso: 3, entradaEscopo: "2026-09-08", prazo: "2026-10-10", prazoOriginal: null, fase: "delivery", responsavel: "desenvolvimento", dependeDe: null, situacao: "concluido" },
  { id: "CMP-F5", modulo: "Campanhas", nome: "Alocação de responsáveis", peso: 1, entradaEscopo: "2026-09-08", prazo: "2026-10-10", prazoOriginal: null, fase: "delivery", responsavel: "desenvolvimento", dependeDe: null, situacao: "concluido" },
  { id: "CMP-F6", modulo: "Campanhas", nome: "Operação e atribuição", peso: 2, entradaEscopo: "2026-09-08", prazo: "2026-10-10", prazoOriginal: null, fase: "delivery", responsavel: "desenvolvimento", dependeDe: null, situacao: "concluido" },
  { id: "ATD-F1", modulo: "Atendimento", nome: "Conversa e janela de 24h", peso: 5, entradaEscopo: "2026-09-17", prazo: "2026-10-10", prazoOriginal: null, fase: "delivery", responsavel: "desenvolvimento", dependeDe: null, situacao: "concluido" },
  { id: "ATD-F2", modulo: "Atendimento", nome: "Dono da conversa: assumir e devolver", peso: 3, entradaEscopo: "2026-09-17", prazo: "2026-10-10", prazoOriginal: null, fase: "delivery", responsavel: "desenvolvimento", dependeDe: null, situacao: "concluido" },
  { id: "ATD-F3", modulo: "Atendimento", nome: "Painel do cliente na conversa", peso: 4, entradaEscopo: "2026-09-17", prazo: "2026-10-10", prazoOriginal: null, fase: "delivery", responsavel: "desenvolvimento", dependeDe: null, situacao: "concluido" },
  { id: "FUN-F1", modulo: "Funil", nome: "Quadro e transições", peso: 4, entradaEscopo: "2026-09-15", prazo: "2026-10-10", prazoOriginal: null, fase: "delivery", responsavel: "desenvolvimento", dependeDe: null, situacao: "concluido" },
  { id: "FUN-F2", modulo: "Funil", nome: "Atribuição de responsável", peso: 2, entradaEscopo: "2026-09-15", prazo: "2026-10-10", prazoOriginal: null, fase: "delivery", responsavel: "desenvolvimento", dependeDe: null, situacao: "concluido" },
  { id: "FUN-F3", modulo: "Funil", nome: "Ficha do cliente", peso: 3, entradaEscopo: "2026-09-15", prazo: "2026-10-10", prazoOriginal: null, fase: "delivery", responsavel: "desenvolvimento", dependeDe: null, situacao: "concluido" },
  { id: "FUN-F4", modulo: "Funil", nome: "Termômetro de interesse", peso: 2, entradaEscopo: "2026-09-15", prazo: "2026-10-10", prazoOriginal: null, fase: "delivery", responsavel: "desenvolvimento", dependeDe: null, situacao: "concluido" },
  { id: "FUN-F5", modulo: "Funil", nome: "Motivo de perda", peso: 2, entradaEscopo: "2026-09-15", prazo: "2026-10-10", prazoOriginal: null, fase: "delivery", responsavel: "desenvolvimento", dependeDe: null, situacao: "concluido" },
  { id: "FUN-F8", modulo: "Funil", nome: "Lead pela entrada de mensagem", peso: 2, entradaEscopo: "2026-09-17", prazo: "2026-10-10", prazoOriginal: null, fase: "delivery", responsavel: "desenvolvimento", dependeDe: null, situacao: "concluido" },
  { id: "FUN-F9", modulo: "Funil", nome: "Lead por cadastro manual", peso: 2, entradaEscopo: "2026-09-17", prazo: "2026-10-10", prazoOriginal: null, fase: "delivery", responsavel: "desenvolvimento", dependeDe: null, situacao: "concluido" },
  { id: "FUN-F10", modulo: "Funil", nome: "Lead por importação de planilha", peso: 2, entradaEscopo: "2026-09-17", prazo: "2026-10-10", prazoOriginal: null, fase: "delivery", responsavel: "desenvolvimento", dependeDe: null, situacao: "concluido" },
  { id: "OFE-F1", modulo: "Ofertas", nome: "Catálogo e vigência", peso: 3, entradaEscopo: "2026-09-08", prazo: "2026-10-17", prazoOriginal: null, fase: "delivery", responsavel: "desenvolvimento", dependeDe: null, situacao: "andamento" },
  { id: "OFE-F2", modulo: "Ofertas", nome: "Carga de ofertas por planilha", peso: 3, entradaEscopo: "2026-09-08", prazo: "2026-10-17", prazoOriginal: null, fase: "delivery", responsavel: "desenvolvimento", dependeDe: null, situacao: "andamento" },
  { id: "OFE-F4", modulo: "Ofertas", nome: "Seleção na campanha", peso: 1, entradaEscopo: "2026-09-08", prazo: "2026-10-17", prazoOriginal: null, fase: "delivery", responsavel: "desenvolvimento", dependeDe: null, situacao: "andamento" },
  { id: "VIS-F1", modulo: "Visão Geral", nome: "Casco recorte e primeiro bloco", peso: 5, entradaEscopo: "2026-09-15", prazo: "2026-10-17", prazoOriginal: null, fase: "delivery", responsavel: "desenvolvimento", dependeDe: null, situacao: "concluido" },
  { id: "VIS-F2", modulo: "Visão Geral", nome: "Bloco de ação", peso: 3, entradaEscopo: "2026-09-17", prazo: "2026-10-17", prazoOriginal: null, fase: "delivery", responsavel: "desenvolvimento", dependeDe: null, situacao: "concluido" },
  { id: "VIS-F3", modulo: "Visão Geral", nome: "Bloco de campanha", peso: 3, entradaEscopo: "2026-09-17", prazo: "2026-10-17", prazoOriginal: null, fase: "delivery", responsavel: "desenvolvimento", dependeDe: "B01", situacao: "andamento" },
  { id: "VIS-F5", modulo: "Visão Geral", nome: "Faixa de indicadores", peso: 1, entradaEscopo: "2026-09-17", prazo: "2026-10-17", prazoOriginal: null, fase: "delivery", responsavel: "produto", dependeDe: null, situacao: "concluido" },
  { id: "O01", modulo: "Infraestrutura", nome: "Observabilidade e alertas", peso: 2, entradaEscopo: "2026-09-02", prazo: "2026-10-17", prazoOriginal: null, fase: "delivery", responsavel: "desenvolvimento", dependeDe: null, situacao: "parcial" },
  { id: "X02", modulo: "Infraestrutura", nome: "Deploy: Vercel em produção e Docker em QA", peso: 3, entradaEscopo: "2026-09-17", prazo: "2026-10-17", prazoOriginal: null, fase: "delivery", responsavel: "desenvolvimento", dependeDe: "B02 B03", situacao: "parcial" },
  { id: "X04", modulo: "Infraestrutura", nome: "Ensaio geral e treinamento", peso: 3, entradaEscopo: "2026-09-17", prazo: "2026-10-17", prazoOriginal: null, fase: "delivery", responsavel: "desenvolvimento", dependeDe: "CMP-F1 C07", situacao: "a_fazer" },
  { id: "X05", modulo: "Infraestrutura", nome: "AGENTS.md e vínculo com o Archflow", peso: 1, entradaEscopo: "2026-09-17", prazo: "2026-10-17", prazoOriginal: null, fase: "delivery", responsavel: "desenvolvimento", dependeDe: null, situacao: "concluido" },
  { id: "PER-F7", modulo: "Perfis", nome: "SSO Microsoft no Clerk", peso: 2, entradaEscopo: "2026-10-02", prazo: "2026-10-17", prazoOriginal: null, fase: "delivery", responsavel: "desenvolvimento", dependeDe: "B02", situacao: "andamento" },
  { id: "X08", modulo: "Infraestrutura", nome: "Revisão visual e responsividade", peso: 3, entradaEscopo: "2026-10-02", prazo: "2026-10-17", prazoOriginal: null, fase: "delivery", responsavel: "desenvolvimento", dependeDe: null, situacao: "andamento" },
  { id: "SPK-B2", modulo: "Canal", nome: "Leitura do contrato", peso: 1, entradaEscopo: "2026-09-02", prazo: "2026-11-10", prazoOriginal: null, fase: "discovery", responsavel: "produto", dependeDe: null, situacao: "andamento" },
  { id: "REG-F3", modulo: "Registro", nome: "Propriedades do registro", peso: 4, entradaEscopo: "2026-09-17", prazo: "2026-11-10", prazoOriginal: null, fase: "delivery", responsavel: "produto", dependeDe: null, situacao: "concluido" },
  { id: "REG-F5", modulo: "Registro", nome: "Retenção e privacidade", peso: 3, entradaEscopo: "2026-09-17", prazo: "2026-11-10", prazoOriginal: null, fase: "delivery", responsavel: "produto", dependeDe: "B08", situacao: "andamento" },
  { id: "REG-F6", modulo: "Registro", nome: "Leitura e volume", peso: 3, entradaEscopo: "2026-09-17", prazo: "2026-11-10", prazoOriginal: null, fase: "delivery", responsavel: "produto", dependeDe: null, situacao: "concluido" },
  { id: "VIS-F6", modulo: "Visão Geral", nome: "Tendência e volume", peso: 3, entradaEscopo: "2026-09-17", prazo: "2026-11-10", prazoOriginal: null, fase: "delivery", responsavel: "produto", dependeDe: null, situacao: "concluido" },
  { id: "EVO-01", modulo: "Orquestrador", nome: "Múltiplas contas e números de WhatsApp", peso: 0, entradaEscopo: "2026-09-02", prazo: null, prazoOriginal: null, fase: "delivery", responsavel: "orquestrador", dependeDe: null, situacao: "concluido" },
  { id: "EVO-02", modulo: "Orquestrador", nome: "Leitura e digitando controlados pelo sistema", peso: 0, entradaEscopo: "2026-09-02", prazo: null, prazoOriginal: null, fase: "delivery", responsavel: "orquestrador", dependeDe: null, situacao: "concluido" },
  { id: "EVO-03", modulo: "Orquestrador", nome: "Status das mensagens enviadas", peso: 0, entradaEscopo: "2026-09-02", prazo: null, prazoOriginal: null, fase: "delivery", responsavel: "orquestrador", dependeDe: null, situacao: "concluido" },
  { id: "EVO-04", modulo: "Orquestrador", nome: "Templates", peso: 0, entradaEscopo: "2026-09-02", prazo: null, prazoOriginal: null, fase: "delivery", responsavel: "orquestrador", dependeDe: null, situacao: "concluido" },
  { id: "EVO-05", modulo: "Orquestrador", nome: "Disparo de campanhas em lote", peso: 0, entradaEscopo: "2026-09-02", prazo: null, prazoOriginal: null, fase: "delivery", responsavel: "orquestrador", dependeDe: null, situacao: "concluido" },
  { id: "EVO-06", modulo: "Orquestrador", nome: "Idempotência real", peso: 0, entradaEscopo: "2026-09-02", prazo: null, prazoOriginal: null, fase: "delivery", responsavel: "orquestrador", dependeDe: null, situacao: "concluido" },
  { id: "EVO-07", modulo: "Orquestrador", nome: "Mídia", peso: 0, entradaEscopo: "2026-09-02", prazo: null, prazoOriginal: null, fase: "delivery", responsavel: "orquestrador", dependeDe: null, situacao: "concluido" },
  { id: "EVO-08", modulo: "Orquestrador", nome: "Dados de quem escreve e de quem recebe", peso: 0, entradaEscopo: "2026-09-02", prazo: null, prazoOriginal: null, fase: "delivery", responsavel: "orquestrador", dependeDe: null, situacao: "concluido" },
  { id: "NEW-1", modulo: "Dashboard", nome: "Visualização de dados da campanha", peso: 0, entradaEscopo: "2026-10-02", prazo: null, prazoOriginal: null, fase: "discovery", responsavel: "produto", dependeDe: null, situacao: "andamento" },
  { id: "NEW-2", modulo: "Permissionamento", nome: "Criar os perfis e as permissões", peso: 0, entradaEscopo: "2026-10-02", prazo: null, prazoOriginal: null, fase: "discovery", responsavel: "produto", dependeDe: null, situacao: "andamento" },
  { id: "NEW-3", modulo: "Catálogo", nome: "Criação do catálogo de produtos e serviços", peso: 0, entradaEscopo: "2026-10-02", prazo: null, prazoOriginal: null, fase: "delivery", responsavel: "produto", dependeDe: null, situacao: "andamento" },
  { id: "NEW-4", modulo: "Clientes", nome: "Input agnóstico a integrações para múltiplas vertentes", peso: 0, entradaEscopo: "2026-10-02", prazo: null, prazoOriginal: null, fase: "delivery", responsavel: "desenvolvimento", dependeDe: null, situacao: "andamento" },
]

/**
 * Discovery técnico: itens de decisão, fora dos módulos. Datas reconstruídas pela ordem de dependência:
 * na semana 1 as decisões de fundação; na semana 2 o ferramental, que dependia delas.
 */
export const DISCOVERY: { id: string; nome: string; inicio?: string; concluido: string | null; responsavel?: "produto" | "desenvolvimento" }[] = [
  { id: "DT-1", nome: "Stack", concluido: "2026-09-16" },
  { id: "DT-2", nome: "Banco", concluido: "2026-09-17" },
  { id: "DT-3", nome: "Regras de projeto", concluido: "2026-09-18" },
  { id: "DT-5", nome: "Arquitetura", concluido: "2026-09-19" },
  { id: "DT-4", nome: "Spec kit", concluido: "2026-09-22" },
  { id: "DT-6", nome: "Serviços · orquestrador de WhatsApp", concluido: "2026-09-23" },
  { id: "DT-7", nome: "MCP Linx", concluido: "2026-09-24" },
  { id: "DT-8", nome: "Homologar número na Meta", inicio: "2026-09-17", concluido: null, responsavel: "produto" },
]

/** Módulo com a janela que os cards dele ocupam: da data mais cedo (entrada no escopo ou prazo) ao último prazo. Sem prazo, sem fim. */
export type Modulo = { id: string; nome: string; cor: string; ordem: number; inicio: string | null; fim: string | null }

export const MODULOS: Modulo[] = MODULOS_BASE.map((m, i) => {
  const cs = CARDS.filter((c) => c.modulo === m.id)
  const prazos = cs.map((c) => c.prazo).filter((p): p is string => p !== null).sort()
  return { id: m.id, nome: m.id, cor: m.cor, ordem: i + 1, inicio: [...cs.map((c) => c.entradaEscopo), ...prazos].sort()[0] ?? null, fim: prazos.at(-1) ?? null }
})

/**
 * Card com as datas que os gráficos usam. A planilha não registra quando cada card começou ou terminou,
 * então as datas são aproximações declaradas na tela:
 * - concluído: no prazo, sem passar da data da planilha (o card já estava pronto nela) nem vir antes da entrada no escopo;
 * - em andamento: desde a entrada no escopo;
 * - parcial: selo próprio, mas conta com o a fazer, sem data de início.
 * O prazo do card é o `marco` de todas as telas.
 */
export type Fatia = {
  id: string
  moduloId: string
  nome: string
  peso: number
  dependeDe: string | null
  entradaEscopo: string
  iniciada: string | null
  concluida: string | null
  removida: string | null
  fase: Card["fase"]
  area: Card["responsavel"]
  situacao: Situacao
  marco: string | null
  prazoOriginal: string | null
}

const entre = (d: string, min: string, max: string) => (d < min ? min : d > max ? max : d)

export const FATIAS: Fatia[] = CARDS.map((c) => ({
  id: c.id,
  moduloId: c.modulo,
  nome: c.nome,
  peso: c.peso,
  dependeDe: c.dependeDe,
  entradaEscopo: c.entradaEscopo,
  iniciada: c.situacao === "andamento" ? c.entradaEscopo : null,
  concluida: c.situacao === "concluido" ? entre(c.prazo ?? REVISAO, c.entradaEscopo, REVISAO) : null,
  removida: null,
  fase: c.fase,
  area: c.responsavel,
  situacao: c.situacao,
  marco: c.prazo,
  prazoOriginal: c.prazoOriginal,
}))
