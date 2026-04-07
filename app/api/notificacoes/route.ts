import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/auth-helpers"

export async function GET() {
  const auth = await requireAuth()
  if (auth.error) return auth.error

  const agora = new Date()
  const tressDiasAtras = new Date(agora.getTime() - 3 * 24 * 60 * 60 * 1000)
  const vintQuatroHorasAtras = new Date(agora.getTime() - 24 * 60 * 60 * 1000)


  const usuarioIA = await prisma.usuario.findFirst({
    where: { email: "livia@innovatebrazil.com" },
    select: { id: true },
  })

  const [leadsAlerta, leadsNovosIA] = await Promise.all([
    prisma.lead.findMany({
      where: {
        deletadoEm: null,
        arquivado: false,
        statusFunil: {
          notIn: ["encaminhado"] as never[],
        },
        ultimaMovimentacaoEm: { lt: tressDiasAtras },
      },
      select: { id: true, nome: true, statusFunil: true, ultimaMovimentacaoEm: true },
      take: 5,
    }),
    usuarioIA
      ? prisma.lead.findMany({
          where: {
            responsavelId: usuarioIA.id,
            criadoEm: { gte: vintQuatroHorasAtras },
          },
          select: { id: true, nome: true, criadoEm: true },
          take: 3,
          orderBy: { criadoEm: "desc" },
        })
      : Promise.resolve([]),
  ])

  const total = leadsAlerta.length + leadsNovosIA.length

  return NextResponse.json({ leadsAlerta, leadsNovosIA, total })
}
