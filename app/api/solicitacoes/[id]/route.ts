import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/auth-helpers"

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth()
  if (auth.error) return auth.error

  const { id } = await params
  const body = await request.json()
  const { status } = body

  if (!status || !["pendente", "concluida"].includes(status)) {
    return NextResponse.json(
      { error: "Status invalido" },
      { status: 400 }
    )
  }

  const solicitacao = await prisma.solicitacaoAlteracao.update({
    where: { id },
    data: {
      status,
      concluidoEm: status === "concluida" ? new Date() : null,
    },
    include: {
      criadoPor: {
        select: { id: true, nome: true, email: true },
      },
    },
  })

  return NextResponse.json(solicitacao)
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth()
  if (auth.error) return auth.error

  const { id } = await params

  const solicitacao = await prisma.solicitacaoAlteracao.findUnique({
    where: { id },
  })

  if (!solicitacao) {
    return NextResponse.json(
      { error: "Solicitacao nao encontrada" },
      { status: 404 }
    )
  }

  await prisma.solicitacaoAlteracao.delete({ where: { id } })

  return NextResponse.json({ ok: true })
}
