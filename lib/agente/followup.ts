import { prisma } from "@/lib/prisma"
import { openai } from "@/lib/openai"
import { enviarMensagem } from "@/lib/uazapi"
import type { Conversa, Lead, ConfigWhatsapp } from "@/generated/prisma/client"

type ConversaComLead = Conversa & { lead: Lead }

interface FollowUpPendente {
  conversa: ConversaComLead
  tipo: "1h" | "6h" | "24h"
}

/** Busca conversas que precisam de follow-up */
export async function buscarConversasParaFollowUp(): Promise<FollowUpPendente[]> {
  const agora = new Date()
  const ha1h = new Date(agora.getTime() - 1 * 60 * 60 * 1000)

  // Buscar conversas ativas com ultimaMensagemEm > 1h atrás
  const conversas = await prisma.conversa.findMany({
    where: {
      encerradaEm: null,
      ultimaMensagemEm: {
        not: null,
        lt: ha1h,
      },
      etapa: {
        in: ["acolhimento", "qualificacao"],
      },
      lead: {
        arquivado: false,
        deletadoEm: null,
      },
    },
    include: {
      lead: true,
    },
  })

  const pendentes: FollowUpPendente[] = []
  const ha6h = new Date(agora.getTime() - 6 * 60 * 60 * 1000)
  const ha24h = new Date(agora.getTime() - 24 * 60 * 60 * 1000)

  for (const conversa of conversas) {
    const ultimaMsg = conversa.ultimaMensagemEm!

    if (ultimaMsg < ha24h && !conversa.followUpEnviados.includes("24h")) {
      pendentes.push({ conversa, tipo: "24h" })
    } else if (ultimaMsg < ha6h && !conversa.followUpEnviados.includes("6h")) {
      pendentes.push({ conversa, tipo: "6h" })
    } else if (ultimaMsg < ha1h && !conversa.followUpEnviados.includes("1h")) {
      pendentes.push({ conversa, tipo: "1h" })
    }
  }

  return pendentes
}

/** Gera mensagem de follow-up via GPT-4o com contexto do lead */
async function gerarMensagemFollowUp(
  lead: Lead,
  conversa: ConversaComLead,
  tipo: "1h" | "6h" | "24h"
): Promise<string> {
  const nome = lead.nome.replace(/^WhatsApp\s+/, "") || "cliente"

  // Contexto do lead para personalizar
  const contexto = lead.sobreOLead
    ? `\nInformacoes ja coletadas sobre o projeto: ${lead.sobreOLead}`
    : ""
  const etapa = conversa.etapa === "acolhimento"
    ? "ainda na fase inicial (nao coletamos o nome ou acabamos de coletar)"
    : "na fase de qualificacao (ja coletamos algumas informacoes do projeto)"

  // Templates de fallback (sem emojis — regra da Livia)
  const templates: Record<string, string> = {
    "1h": `Ficou com alguma duvida, ${nome}? Estou por aqui para te ajudar com o seu projeto.`,
    "6h": `${nome}, sei que o dia a dia e corrido. Quando puder, estou por aqui para continuar falando sobre o seu projeto de painel LED.`,
    "24h": `${nome}, vou encerrar nosso atendimento por aqui, mas se quiser retomar a conversa sobre o seu projeto, e so me chamar!`,
  }

  try {
    const instrucaoBase = `Voce e a Livia, do time de pre-atendimento da Innovate Brazil (paineis LED). Escreva uma mensagem de follow-up no WhatsApp.

Regras:
- NUNCA use emojis
- NUNCA comece com "Oi" ou "Ola" — voces ja estao conversando, nao precisa cumprimentar de novo
- Va direto ao ponto, continue a conversa naturalmente
- Tom acolhedor e profissional
- Maximo 2-3 linhas curtas
- Personalize com base no contexto do lead (se disponivel)
- Nao repita informacoes que o lead ja deu
- Pode usar o nome do lead no meio ou fim da frase, nunca como saudacao

Lead: ${nome}
Etapa: ${etapa}${contexto}`

    const instrucoes: Record<string, string> = {
      "1h": `${instrucaoBase}\n\nTipo: Follow-up leve (1 hora sem resposta). Objetivo: retomar a conversa de forma natural, perguntar se ficou alguma duvida ou se pode ajudar com algo. Escreva como se estivesse continuando a conversa que ja estava rolando.`,
      "6h": `${instrucaoBase}\n\nTipo: Follow-up de valor (6 horas sem resposta). Objetivo: trazer um beneficio relevante sobre paineis LED relacionado ao projeto do lead, e reforcar que o consultor pode fazer uma analise personalizada gratuita.`,
      "24h": `${instrucaoBase}\n\nTipo: Encerramento gentil (24 horas sem resposta). Objetivo: encerrar o atendimento de forma empática, deixando a porta aberta para retorno futuro.`,
    }

    const resposta = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: instrucoes[tipo] }],
      max_tokens: 200,
      temperature: 0.7,
    })

    return resposta.choices[0]?.message?.content || templates[tipo]
  } catch {
    return templates[tipo]
  }
}

/** Envia follow-up e registra no banco */
export async function enviarFollowUp(
  conversa: ConversaComLead,
  tipo: "1h" | "6h" | "24h",
  configWa: ConfigWhatsapp
): Promise<void> {
  const mensagem = await gerarMensagemFollowUp(conversa.lead, conversa, tipo)

  // Enviar via Uazapi
  await enviarMensagem(
    configWa.uazapiUrl,
    configWa.instanceToken!,
    conversa.lead.whatsapp,
    mensagem
  )

  // Registrar no banco via API interna
  const baseUrl = (process.env.NEXTAUTH_URL || "http://localhost:3000").trim()
  try {
    await fetch(`${baseUrl}/api/agente/registrar-mensagem`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-secret": process.env.API_SECRET || "",
      },
      body: JSON.stringify({
        conversaId: conversa.id,
        leadId: conversa.leadId,
        conteudo: mensagem,
        direcao: "agente",
      }),
    })
  } catch {
    // Não impedir fluxo se registro falhar
  }

  // Marcar follow-up como enviado
  await prisma.conversa.update({
    where: { id: conversa.id },
    data: {
      followUpEnviados: { push: tipo },
    },
  })

  // Se follow-up 24h: encerrar conversa
  if (tipo === "24h") {
    await prisma.conversa.update({
      where: { id: conversa.id },
      data: { encerradaEm: new Date() },
    })
  }
}
