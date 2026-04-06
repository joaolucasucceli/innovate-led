import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { validarApiSecret } from "@/lib/api-auth"
import type { StatusFunil, EtapaConversa } from "@/generated/prisma/client"

export async function POST(request: NextRequest) {
  const erro = validarApiSecret(request)
  if (erro) return erro

  let body: {
    leadId?: string
    conversaId?: string
    dataHora?: string
    resumo?: string
  }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Payload inválido" }, { status: 400 })
  }

  const { leadId, conversaId, dataHora, resumo } = body

  if (!leadId || !conversaId || !dataHora || !resumo) {
    return NextResponse.json(
      { error: "leadId, conversaId, dataHora e resumo são obrigatórios" },
      { status: 400 }
    )
  }

  // Avançar lead para "tarefa_criada"
  await prisma.$transaction([
    prisma.lead.update({
      where: { id: leadId },
      data: {
        statusFunil: "tarefa_criada" as StatusFunil,
        ultimaMovimentacaoEm: new Date(),
      },
    }),
    prisma.conversa.update({
      where: { id: conversaId },
      data: { etapa: "tarefa_criada" as EtapaConversa },
    }),
  ])

  // Buscar dados do lead para webhook
  const lead = await prisma.lead.findUnique({
    where: { id: leadId },
    select: { nome: true, whatsapp: true },
  })

  // Disparar webhook n8n para criar tarefa no Kommo (fire-and-forget)
  const webhookUrl = process.env.N8N_WEBHOOK_CRIAR_TAREFA_URL
  if (webhookUrl) {
    fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        telefone: lead?.whatsapp,
        data_hora: dataHora,
        resumo,
      }),
    }).catch((err) => console.error("[n8n] Erro webhook criar-tarefa:", err))
  }

  return NextResponse.json({
    sucesso: true,
    etapaAvancada: "tarefa_criada",
    dataHora,
  })
}
