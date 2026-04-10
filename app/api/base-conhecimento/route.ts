import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth, requireRole } from "@/lib/auth-helpers"

const SECAO = "base-conhecimento"

export async function GET() {
  const auth = await requireAuth()
  if (auth.error) return auth.error

  const artigos = await prisma.artigoDocumentacao.findMany({
    where: { secao: SECAO, ativo: true },
    orderBy: { ordem: "asc" },
    select: {
      id: true,
      titulo: true,
      conteudo: true,
      ordem: true,
    },
  })

  return NextResponse.json(artigos)
}

export async function POST(request: NextRequest) {
  const auth = await requireRole("gestor")
  if (auth.error) return auth.error

  const body = await request.json()
  const { titulo, conteudo } = body

  if (!titulo || !conteudo) {
    return NextResponse.json({ error: "titulo e conteudo sao obrigatorios" }, { status: 400 })
  }

  const maxOrdem = await prisma.artigoDocumentacao.aggregate({
    where: { secao: SECAO, ativo: true },
    _max: { ordem: true },
  })

  const artigo = await prisma.artigoDocumentacao.create({
    data: {
      titulo,
      conteudo,
      secao: SECAO,
      ordem: (maxOrdem._max.ordem ?? -1) + 1,
      atualizadoPorId: auth.session!.user.id,
    },
  })

  return NextResponse.json(artigo, { status: 201 })
}
