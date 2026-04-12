import { supabaseAdmin } from "@/lib/supabase"
import { openai } from "@/lib/openai"

/** Busca todas as conversas do dia anterior com suas mensagens */
export async function buscarConversasDoDiaAnterior() {
  const agora = new Date()
  const spDate = new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(agora)
  const [dia, mes, ano] = spDate.split("/")

  // Dia anterior em SP
  const hoje = new Date(`${ano}-${mes}-${dia}T00:00:00-03:00`)
  const ontem = new Date(hoje.getTime() - 24 * 60 * 60 * 1000)

  const hojIso = hoje.toISOString()
  const ontemIso = ontem.toISOString()

  // 1. Buscar IDs de conversas que tiveram mensagens ontem
  const { data: msgIds } = await supabaseAdmin
    .from("mensagens_whatsapp")
    .select("conversaId")
    .gte("criadoEm", ontemIso)
    .lt("criadoEm", hojIso)

  if (!msgIds || msgIds.length === 0) return { conversas: [], dataRef: ontem }

  const conversaIds = [...new Set(msgIds.map((m) => m.conversaId))]

  // 2. Buscar conversas com lead
  const { data: conversas } = await supabaseAdmin
    .from("conversas")
    .select("*, lead:leads!leadId(nome, whatsapp, statusFunil, origem, sobreOLead)")
    .in("id", conversaIds)

  if (!conversas) return { conversas: [], dataRef: ontem }

  // 3. Buscar mensagens do período para cada conversa
  const { data: mensagens } = await supabaseAdmin
    .from("mensagens_whatsapp")
    .select("conversaId, remetente, conteudo, tipo, criadoEm")
    .in("conversaId", conversaIds)
    .gte("criadoEm", ontemIso)
    .lt("criadoEm", hojIso)
    .order("criadoEm", { ascending: true })

  // 4. Agrupar mensagens por conversa
  const mensagensPorConversa = new Map<string, { conversaId: string; remetente: string; conteudo: string; tipo: string; criadoEm: string }[]>()
  for (const msg of mensagens || []) {
    const arr = mensagensPorConversa.get(msg.conversaId) || []
    arr.push(msg)
    mensagensPorConversa.set(msg.conversaId, arr)
  }

  const resultado = conversas.map((c) => ({
    ...c,
    mensagens: mensagensPorConversa.get(c.id) || [],
  }))

  return { conversas: resultado, dataRef: ontem }
}

/** Formata conversas para enviar ao GPT */
export function formatarConversasParaAnalise(
  conversas: Awaited<ReturnType<typeof buscarConversasDoDiaAnterior>>["conversas"]
): string {
  if (conversas.length === 0) return "Nenhuma conversa encontrada no dia anterior."

  return conversas
    .map((c, i) => {
      const lead = c.lead as { nome: string; statusFunil: string; origem: string | null }
      const header = `--- CONVERSA ${i + 1} | Lead: ${lead.nome} | Status: ${lead.statusFunil} | Origem: ${lead.origem || "N/I"} ---`
      const msgs = c.mensagens
        .map((m: { criadoEm: string; remetente: string; conteudo: string }) => {
          const hora = new Date(m.criadoEm).toLocaleTimeString("pt-BR", { timeZone: "America/Sao_Paulo", hour: "2-digit", minute: "2-digit" })
          const quem = m.remetente === "assistente" ? "Livia" : "Lead"
          return `[${hora}] ${quem}: ${m.conteudo}`
        })
        .join("\n")
      return `${header}\n${msgs}`
    })
    .join("\n\n")
}

/** Gera analise via GPT-4o */
export async function gerarAnalise(prompt: string, conversasTexto: string): Promise<string> {
  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { role: "system", content: prompt },
      { role: "user", content: conversasTexto },
    ],
    temperature: 0.3,
    max_tokens: 2000,
  })

  return response.choices[0]?.message?.content || "Sem analise gerada."
}
