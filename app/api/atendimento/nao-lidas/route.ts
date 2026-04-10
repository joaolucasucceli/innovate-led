import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/auth-helpers"

export async function GET() {
  const auth = await requireAuth()
  if (auth.error) return auth.error

  const total = await prisma.conversa.count({
    where: {
      encerradaEm: null,
      lead: { deletadoEm: null },
      mensagens: {
        some: {
          remetente: "paciente",
          lidaEm: null,
        },
      },
    },
  })

  return NextResponse.json({ total })
}
