import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/auth-helpers"

export async function GET(request: NextRequest) {
  const auth = await requireAuth()
  if (auth.error) return auth.error

  const { searchParams } = request.nextUrl
  const q = searchParams.get("q") ?? ""

  if (q.length < 2) {
    return NextResponse.json({ leads: [], total: 0 })
  }

  const leads = await prisma.lead.findMany({
    where: {
      deletadoEm: null,
      arquivado: false,
      OR: [
        { nome: { contains: q, mode: "insensitive" } },
        { whatsapp: { contains: q } },
      ],
    },
    select: { id: true, nome: true, whatsapp: true, statusFunil: true },
    take: 10,
  })

  return NextResponse.json({
    leads,
    total: leads.length,
  })
}
