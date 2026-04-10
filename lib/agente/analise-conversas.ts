import { prisma } from "@/lib/prisma"
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

  const conversas = await prisma.conversa.findMany({
    where: {
      mensagens: {
        some: {
          criadoEm: { gte: ontem, lt: hoje },
        },
      },
    },
    include: {
      lead: {
        select: {
          nome: true,
          whatsapp: true,
          statusFunil: true,
          origem: true,
          sobreOLead: true,
        },
      },
      mensagens: {
        where: { criadoEm: { gte: ontem, lt: hoje } },
        orderBy: { criadoEm: "asc" },
        select: {
          remetente: true,
          conteudo: true,
          tipo: true,
          criadoEm: true,
        },
      },
    },
  })

  return { conversas, dataRef: ontem }
}

/** Formata conversas para enviar ao GPT */
export function formatarConversasParaAnalise(
  conversas: Awaited<ReturnType<typeof buscarConversasDoDiaAnterior>>["conversas"]
): string {
  if (conversas.length === 0) return "Nenhuma conversa encontrada no dia anterior."

  return conversas
    .map((c, i) => {
      const header = `--- CONVERSA ${i + 1} | Lead: ${c.lead.nome} | Status: ${c.lead.statusFunil} | Origem: ${c.lead.origem || "N/I"} ---`
      const msgs = c.mensagens
        .map((m) => {
          const hora = m.criadoEm.toLocaleTimeString("pt-BR", { timeZone: "America/Sao_Paulo", hour: "2-digit", minute: "2-digit" })
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
