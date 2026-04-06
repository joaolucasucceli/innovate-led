import { openai } from "@/lib/openai"
import { prisma } from "@/lib/prisma"
import { sincronizarFunil, avancarEtapa } from "@/lib/agente/kanban-sync"
import type { StatusFunil, EtapaConversa } from "@/generated/prisma/client"

const ETAPAS_CLASSIFICAVEIS: StatusFunil[] = [
  "qualificacao",
  "encaminhado",
]

const LIMITE_CLASSIFICAVEL: StatusFunil = "tarefa_criada"

function etapaIndex(etapa: StatusFunil): number {
  const ordem: StatusFunil[] = [
    "qualificacao",
    "encaminhado",
    "tarefa_criada",
    "em_negociacao",
    "venda_realizada",
    "perdido",
  ]
  return ordem.indexOf(etapa)
}

/**
 * Analisa o histórico de conversa e avança automaticamente a etapa do funil.
 * Só opera nas etapas automatizadas (qualificacao e encaminhado).
 * Nunca regride — só avança.
 */
export async function classificarEtapaConversa(
  conversaId: string,
  leadId: string
): Promise<void> {
  const [lead] = await Promise.all([
    prisma.lead.findUnique({
      where: { id: leadId },
      select: { statusFunil: true },
    }),
  ])

  if (!lead) return

  const etapaAtual = lead.statusFunil

  // Território manual — não interferir
  if (etapaIndex(etapaAtual) >= etapaIndex(LIMITE_CLASSIFICAVEL)) return

  // Buscar últimas 15 mensagens (ordem cronológica)
  const mensagens = await prisma.mensagemWhatsapp.findMany({
    where: { conversaId },
    orderBy: { criadoEm: "desc" },
    take: 15,
    select: { remetente: true, conteudo: true },
  })

  if (mensagens.length === 0) return

  const historico = mensagens
    .reverse()
    .map((m) => `${m.remetente === "agente" ? "Andressa" : "Cliente"}: ${m.conteudo}`)
    .join("\n")

  let novaEtapa: StatusFunil | null = null

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `Analise o histórico de conversa de pré-atendimento de uma empresa de painéis LED e classifique em qual etapa a conversa está.

Etapas possíveis:
- "qualificacao": A assistente está coletando informações sobre o projeto do cliente (objetivo, ambiente, tamanho, prazo, investimento, etc.).
- "encaminhado": A qualificação foi concluída e o cliente foi informado que será encaminhado para um consultor comercial.

Responda APENAS com JSON válido: { "etapa": "qualificacao" | "encaminhado", "motivo": "explicação curta" }`,
        },
        {
          role: "user",
          content: historico,
        },
      ],
      response_format: { type: "json_object" },
      temperature: 0,
    })

    const resultado = JSON.parse(completion.choices[0]?.message?.content || "{}")
    if (ETAPAS_CLASSIFICAVEIS.includes(resultado.etapa as StatusFunil)) {
      novaEtapa = resultado.etapa as StatusFunil
    }
  } catch (err) {
    console.error("[classificador-etapa] Erro na classificação IA:", err)
    return
  }

  if (!novaEtapa) return

  // Regra de não-regressão: só avança
  if (etapaIndex(novaEtapa) <= etapaIndex(etapaAtual)) return

  await sincronizarFunil(leadId, novaEtapa)
  await avancarEtapa(conversaId, novaEtapa as EtapaConversa)
}
