import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/auth-helpers"

export async function GET(request: NextRequest) {
  const auth = await requireAuth()
  if (auth.error) return auth.error

  const { searchParams } = request.nextUrl
  const pagina = Number(searchParams.get("pagina") || "1")
  const porPagina = Number(searchParams.get("porPagina") || "10")
  const status = searchParams.get("status")

  const where: Record<string, unknown> = {}

  if (status) where.status = status

  const [dados, total] = await Promise.all([
    prisma.solicitacaoAlteracao.findMany({
      where,
      include: {
        criadoPor: {
          select: { id: true, nome: true, email: true },
        },
      },
      skip: (pagina - 1) * porPagina,
      take: porPagina,
      orderBy: { criadoEm: "desc" },
    }),
    prisma.solicitacaoAlteracao.count({ where }),
  ])

  return NextResponse.json({ dados, total, pagina, porPagina })
}

export async function POST(request: NextRequest) {
  const auth = await requireAuth()
  if (auth.error) return auth.error

  const body = await request.json()
  const { titulo, descricao } = body

  if (!titulo || !descricao) {
    return NextResponse.json(
      { error: "Titulo e descricao sao obrigatorios" },
      { status: 400 }
    )
  }

  const solicitacao = await prisma.solicitacaoAlteracao.create({
    data: {
      titulo,
      descricao,
      criadoPorId: auth.session.user.id,
    },
    include: {
      criadoPor: {
        select: { id: true, nome: true, email: true },
      },
    },
  })

  return NextResponse.json(solicitacao, { status: 201 })
}
