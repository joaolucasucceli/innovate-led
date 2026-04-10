import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireRole } from "@/lib/auth-helpers"

type RouteParams = { params: Promise<{ id: string }> }

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const auth = await requireRole("gestor")
  if (auth.error) return auth.error

  const { id } = await params
  const body = await request.json()

  const artigo = await prisma.artigoDocumentacao.update({
    where: { id },
    data: {
      ...(body.titulo !== undefined && { titulo: body.titulo }),
      ...(body.conteudo !== undefined && { conteudo: body.conteudo }),
      atualizadoPorId: auth.session!.user.id,
    },
  })

  return NextResponse.json(artigo)
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const auth = await requireRole("gestor")
  if (auth.error) return auth.error

  const { id } = await params

  await prisma.artigoDocumentacao.update({
    where: { id },
    data: { ativo: false },
  })

  return NextResponse.json({ ok: true })
}
