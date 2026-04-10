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

  if (auth.session.user.perfil !== "gestor") {
    return NextResponse.json(
      { error: "Apenas gestores podem editar artigos" },
      { status: 403 }
    )
  }

  const { id } = await params
  const body = await request.json()
  const { titulo, conteudo, secao, ordem } = body

  const artigo = await prisma.artigoDocumentacao.update({
    where: { id },
    data: {
      ...(titulo !== undefined && { titulo }),
      ...(conteudo !== undefined && { conteudo }),
      ...(secao !== undefined && { secao }),
      ...(ordem !== undefined && { ordem }),
      atualizadoPorId: auth.session.user.id,
    },
    include: {
      atualizadoPor: {
        select: { id: true, nome: true },
      },
    },
  })

  return NextResponse.json(artigo)
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth()
  if (auth.error) return auth.error

  if (auth.session.user.perfil !== "gestor") {
    return NextResponse.json(
      { error: "Apenas gestores podem excluir artigos" },
      { status: 403 }
    )
  }

  const { id } = await params

  const artigo = await prisma.artigoDocumentacao.findUnique({
    where: { id },
  })

  if (!artigo) {
    return NextResponse.json(
      { error: "Artigo nao encontrado" },
      { status: 404 }
    )
  }

  await prisma.artigoDocumentacao.update({
    where: { id },
    data: { ativo: false },
  })

  return NextResponse.json({ ok: true })
}
