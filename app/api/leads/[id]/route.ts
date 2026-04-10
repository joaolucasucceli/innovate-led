import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { redis } from "@/lib/redis"
import { deletarLeadKommo } from "@/lib/kommo"
import { requireAuth, requireAnyRole, requireRole } from "@/lib/auth-helpers"
import { atualizarLeadSchema } from "@/lib/validations/lead"

type RouteParams = { params: Promise<{ id: string }> }

export async function GET(_request: NextRequest, { params }: RouteParams) {
  const auth = await requireAuth()
  if (auth.error) return auth.error

  const { id } = await params

  const lead = await prisma.lead.findUnique({
    where: { id, deletadoEm: null },
    include: {
      responsavel: {
        select: { id: true, nome: true },
      },
      conversas: {
        orderBy: [{ ciclo: "desc" }, { atualizadoEm: "desc" }],
        include: {
          mensagens: {
            orderBy: { criadoEm: "asc" },
          },
        },
      },
      fotos: {
        orderBy: { criadoEm: "desc" },
      },
    },
  })

  if (!lead) {
    return NextResponse.json({ error: "Lead não encontrado" }, { status: 404 })
  }

  return NextResponse.json(lead)
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const auth = await requireAnyRole(["gestor", "atendente"])
  if (auth.error) return auth.error

  const { id } = await params
  const body = await request.json()
  const parsed = atualizarLeadSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Dados inválidos", detalhes: parsed.error.flatten() },
      { status: 400 }
    )
  }

  const leadAtual = await prisma.lead.findUnique({
    where: { id, deletadoEm: null },
  })

  if (!leadAtual) {
    return NextResponse.json({ error: "Lead não encontrado" }, { status: 404 })
  }

  const dados = { ...parsed.data }

  // sobreOLead: APPEND, nunca overwrite
  if (dados.sobreOLead) {
    const textoAtual = leadAtual.sobreOLead || ""
    dados.sobreOLead = textoAtual
      ? `${textoAtual}\n---\n${dados.sobreOLead}`
      : dados.sobreOLead
  }

  // Se whatsapp mudou, verificar unicidade
  if (dados.whatsapp && dados.whatsapp !== leadAtual.whatsapp) {
    const existente = await prisma.lead.findUnique({
      where: { whatsapp: dados.whatsapp },
    })
    if (existente) {
      return NextResponse.json({ error: "WhatsApp já cadastrado" }, { status: 409 })
    }
  }

  const leadAtualizado = await prisma.lead.update({
    where: { id },
    data: dados,
    select: {
      id: true,
      nome: true,
      whatsapp: true,
      statusFunil: true,
      origem: true,
      sobreOLead: true,
      responsavelId: true,
      arquivado: true,
      criadoEm: true,
      atualizadoEm: true,
    },
  })


  return NextResponse.json(leadAtualizado)
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const auth = await requireRole("gestor")
  if (auth.error) return auth.error

  const { id } = await params

  const lead = await prisma.lead.findUnique({
    where: { id },
  })

  if (!lead) {
    return NextResponse.json({ error: "Lead não encontrado" }, { status: 404 })
  }

  // Hard delete em cascata
  // 1. Limpar replyToId — tanto deste lead quanto de outros leads que referenciam mensagens deste
  const mensagensDoLead = await prisma.mensagemWhatsapp.findMany({
    where: { leadId: id },
    select: { id: true },
  })
  const idsMsg = mensagensDoLead.map((m) => m.id)

  if (idsMsg.length > 0) {
    await prisma.mensagemWhatsapp.updateMany({
      where: { replyToId: { in: idsMsg } },
      data: { replyToId: null },
    })
  }

  // 2. Deletar em ordem de dependência (sequencial)
  await prisma.mensagemWhatsapp.deleteMany({ where: { leadId: id } })
  await prisma.fotoLead.deleteMany({ where: { leadId: id } })
  await prisma.conversa.deleteMany({ where: { leadId: id } })
  await prisma.lead.delete({ where: { id } })

  // 5. Limpar memória e buffer da IA no Redis
  const chatId = `${lead.whatsapp}@s.whatsapp.net`
  try {
    await redis.del(
      `${chatId}_mem_innovate`,
      `${chatId}_buf_innovate`,
      `${chatId}_deb_innovate`,
      `${chatId}_lock_innovate`
    )
  } catch {
    // Redis indisponível não impede a exclusão do lead
  }

  // 6. Deletar lead no Kommo CRM (fire-and-forget)
  deletarLeadKommo(lead.whatsapp).catch(() => {})

  return NextResponse.json({ mensagem: "Lead e dados relacionados removidos permanentemente" })
}
