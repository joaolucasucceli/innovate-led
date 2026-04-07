import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { redis } from "@/lib/redis"
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
      email: true,
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

  // Hard delete em cascata: mensagens → conversas → fotos → lead
  const conversas = await prisma.conversa.findMany({
    where: { leadId: id },
    select: { id: true },
  })
  const conversaIds = conversas.map((c) => c.id)

  await prisma.$transaction([
    // 1. Deletar todas as mensagens das conversas do lead
    prisma.mensagemWhatsapp.deleteMany({
      where: { conversaId: { in: conversaIds } },
    }),
    // 2. Deletar todas as conversas do lead
    prisma.conversa.deleteMany({
      where: { leadId: id },
    }),
    // 3. Deletar todas as fotos do lead
    prisma.fotoLead.deleteMany({
      where: { leadId: id },
    }),
    // 4. Deletar o lead
    prisma.lead.delete({
      where: { id },
    }),
  ])

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

  return NextResponse.json({ mensagem: "Lead e dados relacionados removidos permanentemente" })
}
