// Central Innovate — Tipos do banco de dados
// Equivalentes aos modelos Prisma, mapeados para tabelas PostgreSQL (Supabase)

// ==========================================
// Enums
// ==========================================

export type Perfil = "gestor" | "atendente"
export type TipoUsuario = "humano" | "ia"
export type StatusFunil = "acolhimento" | "qualificacao" | "encaminhado"
export type EtapaConversa = "acolhimento" | "qualificacao" | "encaminhado"
export type TipoMensagem = "texto" | "audio" | "imagem" | "documento" | "video"
export type ModoConversa = "ia" | "humano" | "hibrido"
export type StatusSolicitacao = "pendente" | "concluida"
export type TipoRelatorioIA = "publico" | "qualidade"

// ==========================================
// Models (nomes de campos = colunas no PostgreSQL, camelCase)
// ==========================================

export interface Usuario {
  id: string
  nome: string
  email: string
  senha: string
  perfil: Perfil
  tipo: TipoUsuario
  ativo: boolean
  criadoEm: string
  atualizadoEm: string
  deletadoEm: string | null
}

export interface Lead {
  id: string
  nome: string
  whatsapp: string
  email: string | null
  statusFunil: StatusFunil
  origem: string | null
  sobreOLead: string | null
  responsavelId: string | null
  arquivado: boolean
  arquivadoEm: string | null
  consentimentoLgpd: boolean
  consentimentoLgpdEm: string | null
  criadoEm: string
  atualizadoEm: string
  motivoPerda: string | null
  ultimaMovimentacaoEm: string | null
  deletadoEm: string | null
  cicloAtual: number
  ciclosCompletos: number
  ehRetorno: boolean
}

export interface Conversa {
  id: string
  leadId: string
  etapa: EtapaConversa
  modoConversa: ModoConversa
  atendenteId: string | null
  ultimaMensagemEm: string | null
  followUpEnviados: string[]
  encerradaEm: string | null
  ciclo: number
  criadoEm: string
  atualizadoEm: string
}

export interface MensagemWhatsapp {
  id: string
  conversaId: string
  leadId: string
  messageIdWhatsapp: string
  tipo: TipoMensagem
  conteudo: string
  remetente: string
  mediaUrl: string | null
  mediaType: string | null
  lidaEm: string | null
  replyToId: string | null
  criadoEm: string
}

export interface FotoLead {
  id: string
  leadId: string
  url: string
  descricao: string | null
  tipoAnalise: string | null
  ciclo: number
  criadoEm: string
}

export interface ConfigWhatsapp {
  id: string
  nome: string | null
  uazapiUrl: string
  adminToken: string
  instanceId: string | null
  instanceToken: string | null
  numeroWhatsapp: string | null
  webhookUrl: string | null
  ativo: boolean
  criadoEm: string
  atualizadoEm: string
}

export interface SolicitacaoAlteracao {
  id: string
  titulo: string
  descricao: string
  status: StatusSolicitacao
  criadoPorId: string
  criadoEm: string
  atualizadoEm: string
  concluidoEm: string | null
}

export interface AuditLog {
  id: string
  usuarioId: string | null
  acao: string
  entidade: string
  entidadeId: string | null
  dadosAntes: unknown | null
  dadosDepois: unknown | null
  ip: string | null
  criadoEm: string
}

export interface RelatorioIA {
  id: string
  tipo: TipoRelatorioIA
  conteudo: string
  dataRef: string
  conversas: number
  leads: number
  criadoEm: string
}

export interface ArtigoDocumentacao {
  id: string
  titulo: string
  conteudo: string
  secao: string
  ordem: number
  ativo: boolean
  criadoEm: string
  atualizadoEm: string
  atualizadoPorId: string | null
}

// ==========================================
// Tipos com relações (para queries com joins)
// ==========================================

export interface LeadComResponsavel extends Lead {
  responsavel: Pick<Usuario, "id" | "nome"> | null
}

export interface LeadComConversas extends Lead {
  conversas: Conversa[]
}

export interface LeadCompleto extends Lead {
  responsavel: Pick<Usuario, "id" | "nome"> | null
  conversas: (Conversa & { mensagens: MensagemWhatsapp[] })[]
  fotos: FotoLead[]
}

export interface ConversaComLead extends Conversa {
  lead: Lead
}

export interface ConversaComDetalhes extends Conversa {
  lead: Lead
  atendente: Pick<Usuario, "id" | "nome"> | null
  mensagens: MensagemWhatsapp[]
}

export interface MensagemComReply extends MensagemWhatsapp {
  replyTo: Pick<MensagemWhatsapp, "id" | "conteudo" | "remetente"> | null
}

export interface SolicitacaoComCriador extends SolicitacaoAlteracao {
  criadoPor: Pick<Usuario, "id" | "nome">
}

// ==========================================
// Mapa de tabelas (Prisma @@map → nome real no PostgreSQL)
// ==========================================

export const TABELAS = {
  usuarios: "usuarios",
  leads: "leads",
  conversas: "conversas",
  mensagensWhatsapp: "mensagens_whatsapp",
  fotosLead: "fotos_lead",
  configWhatsapp: "config_whatsapp",
  solicitacoesAlteracao: "solicitacoes_alteracao",
  auditLogs: "audit_logs",
  relatoriosIa: "relatorios_ia",
  artigosDocumentacao: "artigos_documentacao",
} as const
