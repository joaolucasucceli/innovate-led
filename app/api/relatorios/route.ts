import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/auth-helpers"

export async function GET(request: NextRequest) {
  const auth = await requireAuth()
  if (auth.error) return auth.error

  const tipo = request.nextUrl.searchParams.get("tipo") || undefined
  const limite = Math.min(
    Number(request.nextUrl.searchParams.get("limite")) || 30,
    100
  )

  const relatorios = await prisma.relatorioIA.findMany({
    where: tipo ? { tipo: tipo as "publico" | "qualidade" } : undefined,
    orderBy: { dataRef: "desc" },
    take: limite,
  })

  return NextResponse.json(relatorios)
}
