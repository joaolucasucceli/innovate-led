import { openai } from "@/lib/openai"
import { prisma } from "@/lib/prisma"
import { obterELimparBuffer } from "@/lib/agente/buffer"
import { obterMemoria, adicionarAMemoria } from "@/lib/agente/memoria"
import { gerarSystemPrompt } from "@/lib/agente/prompt"
import { ferramentasAgente, executarFerramenta } from "@/lib/agente/ferramentas"
import { abrirNovoCiclo } from "@/lib/agente/kanban-sync"
import { enviarMensagem, enviarDigitando } from "@/lib/uazapi"
import type { ChatCompletionMessageParam } from "openai/resources/chat/completions"

const MAX_TOOL_ITERATIONS = 10

/** Statuses em que a IA fica em silêncio — humano está conduzindo */
const STATUSES_SILENCIO = ["encaminhado"]

/** Statuses que indicam contato retornando — IA abre novo ciclo */
const STATUSES_RETORNO = ["encaminhado"]

/** Segmenta resposta longa em mensagens curtas para WhatsApp */
export function segmentarResposta(texto: string): string[] {
  if (!texto) return []

  const blocos = texto.split(/\n\n+/).filter((b) => b.trim())

  // Agrupar blocos curtos em uma unica mensagem (ate 500 chars)
  const segmentos: string[] = []
  let atual = ""

  for (const bloco of blocos) {
    const trimmed = bloco.trim()
    if (atual.length + trimmed.length + 1 <= 500) {
      atual = atual ? `${atual}\n${trimmed}` : trimmed
    } else {
      if (atual) segmentos.push(atual)
      if (trimmed.length <= 500) {
        atual = trimmed
      } else {
        // Quebrar bloco grande por sentencas
        const frases = trimmed.split(/(?<=\.)\s+/)
        let parte = ""
        for (const frase of frases) {
          if (parte.length + frase.length > 500 && parte) {
            segmentos.push(parte.trim())
            parte = frase
          } else {
            parte = parte ? `${parte} ${frase}` : frase
          }
        }
        if (parte.trim()) atual = parte.trim()
      }
    }
  }
  if (atual) segmentos.push(atual)

  return segmentos.filter((s) => s.length > 0)
}

/** Extrai número do chatId (remoteJid) */
function extrairNumero(chatId: string): string {
  return chatId.split("@")[0]
}

/** Busca config WhatsApp ativa do banco */
async function obterConfigWhatsapp() {
  return prisma.configWhatsapp.findFirst({
    where: { ativo: true },
  })
}

/** Processa mensagens acumuladas no buffer e responde via GPT-4o */
export async function processarMensagens(chatId: string): Promise<void> {
  // 1. Obter mensagens do buffer
  const buffer = await obterELimparBuffer(chatId)
  if (buffer.length === 0) return

  // 2. Concatenar conteúdos
  const textoBuffer = buffer.map((m) => m.conteudo).join("\n")
  const whatsapp = extrairNumero(chatId)

  // 3. Obter config WhatsApp para envio
  const configWa = await obterConfigWhatsapp()
  if (!configWa?.instanceToken || !configWa?.uazapiUrl) {
    console.warn("[Agente] ConfigWhatsapp não encontrada ou incompleta — não será possível responder")
    return
  }

  // 4. Determinar baseUrl para chamadas internas
  const baseUrl = (process.env.NEXTAUTH_URL || "http://localhost:3000").trim()

  // 5. Consultar lead para contexto
  let contextoLead: {
    nome?: string
    etapa?: string
    sobreOLead?: string
    ehRetorno?: boolean
    cicloAtual?: number
    ciclosCompletos?: number
    leadId?: string
    conversaId?: string
  } = {}
  let leadId: string | null = null
  let conversaId: string | null = null

  try {
    const resultadoLead = JSON.parse(
      await executarFerramenta("consultar_lead", { whatsapp }, baseUrl)
    )
    if (resultadoLead.lead) {
      const statusAtual: string = resultadoLead.lead.statusFunil

      // 5a. Silêncio: humano está conduzindo — IA não responde
      if (STATUSES_SILENCIO.includes(statusAtual)) {
        return
      }

      // 5b. Retorno: contato voltou após encaminhado — abrir novo ciclo
      if (STATUSES_RETORNO.includes(statusAtual)) {
        try {
          const novoCiclo = await abrirNovoCiclo(resultadoLead.lead.id)
          conversaId = novoCiclo.conversaId
          // Rebuscar dados atualizados do lead
          const leadAtualizado = JSON.parse(
            await executarFerramenta("consultar_lead", { whatsapp }, baseUrl)
          )
          if (leadAtualizado.lead) {
            leadId = leadAtualizado.lead.id
            contextoLead = {
              nome: leadAtualizado.lead.nome,
              etapa: leadAtualizado.lead.statusFunil,
              sobreOLead: leadAtualizado.sobreOLead,
              ehRetorno: true,
              cicloAtual: leadAtualizado.lead.cicloAtual,
              ciclosCompletos: leadAtualizado.lead.ciclosCompletos,
              leadId: leadId || undefined,
              conversaId: conversaId || undefined,
            }
          }
        } catch (err) {
          console.error("[Agente] Erro ao abrir novo ciclo:", err)
          leadId = resultadoLead.lead.id
          conversaId = resultadoLead.conversa?.id || null
          contextoLead = {
            nome: resultadoLead.lead.nome,
            etapa: resultadoLead.lead.statusFunil,
            sobreOLead: resultadoLead.sobreOLead,
            leadId: leadId || undefined,
            conversaId: conversaId || undefined,
          }
        }
      } else {
        // 5c. Fluxo normal
        const nomeConfirmado = resultadoLead.sobreOLead
          ? resultadoLead.lead.nome
          : undefined
        leadId = resultadoLead.lead.id
        conversaId = resultadoLead.conversa?.id || null
        contextoLead = {
          nome: nomeConfirmado,
          etapa: resultadoLead.lead.statusFunil,
          sobreOLead: resultadoLead.sobreOLead,
          ehRetorno: resultadoLead.lead.ehRetorno,
          cicloAtual: resultadoLead.lead.cicloAtual,
          ciclosCompletos: resultadoLead.lead.ciclosCompletos,
          leadId: leadId || undefined,
          conversaId: conversaId || undefined,
        }
      }
    }
  } catch (error) {
    console.error("[Agente] Erro ao consultar lead:", error)
  }

  // 5d. Checar modo de conversa — se humano está atendendo, IA não responde
  if (conversaId) {
    const conversa = await prisma.conversa.findUnique({
      where: { id: conversaId },
      select: { modoConversa: true },
    })
    if (conversa?.modoConversa === "humano") {
      console.log(`[Agente] Conversa ${conversaId} em modo humano — IA não responde`)
      return
    }
  }

  // 6. Enviar "digitando"
  try {
    await enviarDigitando(configWa.uazapiUrl, configWa.instanceToken, chatId, true)
  } catch {
    // Ignorar erro de digitação
  }

  try {
    // 7. Obter memória
    const memoria = await obterMemoria(chatId)

    // 8. Montar mensagens
    const systemPrompt = await gerarSystemPrompt(contextoLead)
    const mensagens: ChatCompletionMessageParam[] = [
      { role: "system", content: systemPrompt },
      ...memoria,
      { role: "user", content: textoBuffer },
    ]

    // 9. Chamar GPT-4o com function calling
    let resposta = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: mensagens,
      tools: ferramentasAgente,
      tool_choice: "auto",
    })

    // 10. Loop de tool calls
    let iteracoes = 0
    while (
      resposta.choices[0]?.message?.tool_calls &&
      resposta.choices[0].message.tool_calls.length > 0 &&
      iteracoes < MAX_TOOL_ITERATIONS
    ) {
      const toolCalls = resposta.choices[0].message.tool_calls

      // Adicionar a mensagem do assistente com tool_calls
      mensagens.push(resposta.choices[0].message)

      // Executar cada tool call
      for (const toolCall of toolCalls) {
        if (toolCall.type !== "function") continue
        const fn = toolCall.function
        const args = JSON.parse(fn.arguments || "{}")
        // Injetar IDs reais (sobrescreve possíveis alucinações do GPT)
        if (leadId) args.leadId = leadId
        if (conversaId) args.conversaId = conversaId
        const resultado = await executarFerramenta(
          fn.name,
          args,
          baseUrl
        )

        mensagens.push({
          role: "tool",
          tool_call_id: toolCall.id,
          content: resultado,
        })
      }

      // Re-chamar GPT-4o com resultados
      resposta = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: mensagens,
        tools: ferramentasAgente,
        tool_choice: "auto",
      })

      iteracoes++
    }

    // 11. Obter resposta final
    const textoResposta = resposta.choices[0]?.message?.content || ""
    if (!textoResposta) {
      console.warn("[Agente] GPT-4o retornou resposta vazia")
      return
    }

    // 12. Segmentar e enviar
    const segmentos = segmentarResposta(textoResposta)

    for (let i = 0; i < segmentos.length; i++) {
      const segmento = segmentos[i]

      // Enviar via Uazapi
      await enviarMensagem(
        configWa.uazapiUrl,
        configWa.instanceToken,
        whatsapp,
        segmento
      )

      // Registrar no banco
      if (leadId) {
        try {
          await executarFerramenta(
            "registrar_mensagem",
            {
              conversaId,
              leadId,
              conteudo: segmento,
              direcao: "agente",
            },
            baseUrl
          )
        } catch {
          // Não impedir envio se registro falhar
        }
      }

      // Delay aleatório de 3-5s entre mensagens (exceto última)
      if (i < segmentos.length - 1) {
        const delay = Math.floor(Math.random() * 2001) + 3000
        await new Promise((resolve) => setTimeout(resolve, delay))
      }
    }

    // 13. Salvar na memória
    await adicionarAMemoria(chatId, { role: "user", content: textoBuffer })
    await adicionarAMemoria(chatId, { role: "assistant", content: textoResposta })
  } catch (error) {
    console.error("[Agente] Erro no loop de resposta:", error)
  } finally {
    // 14. Parar "digitando"
    try {
      await enviarDigitando(configWa.uazapiUrl, configWa.instanceToken, chatId, false)
    } catch {
      // Ignorar
    }
  }
}
