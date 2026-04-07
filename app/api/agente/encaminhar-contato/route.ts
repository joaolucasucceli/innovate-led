import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { validarApiSecret } from "@/lib/api-auth"
import { encaminharLeadKommo } from "@/lib/kommo"
import type { StatusFunil, EtapaConversa } from "@/generated/prisma/client"

export async function POST(request: NextRequest) {
  const erro = validarApiSecret(request)
  if (erro) return erro

  let body: { leadId?: string; conversaId?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Payload inválido" }, { status: 400 })
  }

  const { leadId, conversaId } = body

  if (!leadId || !conversaId) {
    return NextResponse.json(
      { error: "leadId e conversaId são obrigatórios" },
      { status: 400 }
    )
  }

  // Avançar lead para "encaminhado"
  await prisma.$transaction([
    prisma.lead.update({
      where: { id: leadId },
      data: {
        statusFunil: "encaminhado" as StatusFunil,
        ultimaMovimentacaoEm: new Date(),
      },
    }),
    prisma.conversa.update({
      where: { id: conversaId },
      data: { etapa: "encaminhado" as EtapaConversa },
    }),
  ])

  // Buscar dados do lead para webhook
  const lead = await prisma.lead.findUnique({
    where: { id: leadId },
    select: { nome: true, whatsapp: true, sobreOLead: true },
  })

  // Sincronizar com Kommo CRM (fire-and-forget)
  if (lead?.whatsapp) {
    encaminharLeadKommo(lead.whatsapp).catch(() => {})
  }

  return NextResponse.json({ sucesso: true, etapaAvancada: "encaminhado" })
}
