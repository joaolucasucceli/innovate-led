import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/auth-helpers"

export async function GET() {
  const auth = await requireAuth()
  if (auth.error) return auth.error

  const artigos = await prisma.artigoDocumentacao.findMany({
    where: { ativo: true },
    include: {
      atualizadoPor: {
        select: { id: true, nome: true },
      },
    },
    orderBy: [{ secao: "asc" }, { ordem: "asc" }, { criadoEm: "asc" }],
  })

  return NextResponse.json({ artigos })
}

export async function POST(request: NextRequest) {
  const auth = await requireAuth()
  if (auth.error) return auth.error

  if (auth.session.user.perfil !== "gestor") {
    return NextResponse.json(
      { error: "Apenas gestores podem criar artigos" },
      { status: 403 }
    )
  }

  const body = await request.json()
  const { titulo, conteudo, secao, ordem } = body

  if (!titulo || !conteudo || !secao) {
    return NextResponse.json(
      { error: "Titulo, conteudo e secao sao obrigatorios" },
      { status: 400 }
    )
  }

  const artigo = await prisma.artigoDocumentacao.create({
    data: {
      titulo,
      conteudo,
      secao,
      ordem: ordem ?? 0,
      atualizadoPorId: auth.session.user.id,
    },
    include: {
      atualizadoPor: {
        select: { id: true, nome: true },
      },
    },
  })

  return NextResponse.json(artigo, { status: 201 })
}
