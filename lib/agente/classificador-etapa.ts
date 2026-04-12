import { openai } from "@/lib/openai"
import { supabaseAdmin } from "@/lib/supabase"
import { sincronizarFunil, avancarEtapa } from "@/lib/agente/kanban-sync"
import type { StatusFunil, EtapaConversa } from "@/types/database"

const ETAPAS_CLASSIFICAVEIS: StatusFunil[] = [
  "acolhimento",
  "qualificacao",
  "encaminhado",
]

function etapaIndex(etapa: StatusFunil): number {
  const ordem: StatusFunil[] = [
    "acolhimento",
    "qualificacao",
    "encaminhado",
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
  const { data: lead } = await supabaseAdmin
    .from("leads")
    .select("statusFunil")
    .eq("id", leadId)
    .single()

  if (!lead) return

  const etapaAtual = lead.statusFunil as StatusFunil

  // Já na última etapa — não há para onde avançar
  if (etapaAtual === "encaminhado") return

  // Buscar últimas 15 mensagens (ordem cronológica)
  const { data: mensagens } = await supabaseAdmin
    .from("mensagens_whatsapp")
    .select("remetente, conteudo")
    .eq("conversaId", conversaId)
    .order("criadoEm", { ascending: false })
    .limit(15)

  if (!mensagens || mensagens.length === 0) return

  const historico = mensagens
    .reverse()
    .map((m) => `${m.remetente === "agente" ? "Lívia" : "Cliente"}: ${m.conteudo}`)
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
- "acolhimento": Primeiro contato — a assistente está cumprimentando e entendendo o interesse inicial do cliente.
- "qualificacao": A assistente está coletando informações detalhadas sobre o projeto do cliente (objetivo, ambiente, tamanho, prazo, investimento, etc.).
- "encaminhado": A qualificação foi concluída e o cliente foi informado que será encaminhado para um consultor comercial.

Responda APENAS com JSON válido: { "etapa": "acolhimento" | "qualificacao" | "encaminhado", "motivo": "explicação curta" }`,
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
