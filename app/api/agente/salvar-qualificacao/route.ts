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
    sobreOLead?: string
    nomeLead?: string
  }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Payload inválido" }, { status: 400 })
  }

  const { leadId, conversaId, sobreOLead, nomeLead } = body

  if (!leadId || !conversaId || !sobreOLead) {
    return NextResponse.json(
      { error: "leadId, conversaId e sobreOLead são obrigatórios" },
      { status: 400 }
    )
  }

  // APPEND em sobreOLead — NUNCA sobrescrever
  const lead = await prisma.lead.findUnique({
    where: { id: leadId },
    select: { sobreOLead: true, nome: true, whatsapp: true, statusFunil: true },
  })

  const textoExistente = lead?.sobreOLead || ""
  const novoTexto = textoExistente
    ? `${textoExistente}\n---\n${sobreOLead}`
    : sobreOLead

  const dadosAtualizar: Record<string, unknown> = {
    sobreOLead: novoTexto,
  }

  // Atualizar nome do lead se informado e o atual é genérico (WhatsApp XXXXX)
  if (nomeLead) {
    const nomeAtual = lead?.nome || ""
    if (nomeAtual.startsWith("WhatsApp ") || !nomeAtual) {
      dadosAtualizar.nome = nomeLead
    }
  }

  await prisma.lead.update({
    where: { id: leadId },
    data: dadosAtualizar,
  })

  // Avançar funil: acolhimento → qualificacao quando salva qualificação
  if (lead?.statusFunil === "acolhimento") {
    await prisma.$transaction([
      prisma.lead.update({
        where: { id: leadId },
        data: {
          statusFunil: "qualificacao" as StatusFunil,
          ultimaMovimentacaoEm: new Date(),
        },
      }),
      prisma.conversa.update({
        where: { id: conversaId },
        data: { etapa: "qualificacao" as EtapaConversa },
      }),
    ])
  }

  // Disparar webhook n8n (fire-and-forget)
  const webhookUrl = process.env.N8N_WEBHOOK_SALVAR_QUALIFICACAO_URL
  if (webhookUrl) {
    fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nome: nomeLead || lead?.nome,
        telefone: lead?.whatsapp,
        qualificacao: sobreOLead,
      }),
    }).catch((err) => console.error("[n8n] Erro webhook salvar-qualificacao:", err))
  }

  return NextResponse.json({ sucesso: true })
}
