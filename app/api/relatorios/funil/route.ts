import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireRole } from "@/lib/auth-helpers"

const labelsFunil: Record<string, string> = {
  qualificacao: "Qualificação",
  encaminhado: "Encaminhado",
  tarefa_criada: "Tarefa Criada",
  em_negociacao: "Em Negociação",
  venda_realizada: "Venda Realizada",
  perdido: "Perdido",
}

const coresFunil: Record<string, string> = {
  qualificacao: "#93c5fd",
  encaminhado: "#a5b4fc",
  tarefa_criada: "#c4b5fd",
  em_negociacao: "#fcd34d",
  venda_realizada: "#86efac",
  perdido: "#fca5a5",
}

const ordemFunil = [
  "qualificacao",
  "encaminhado",
  "tarefa_criada",
  "em_negociacao",
  "venda_realizada",
  "perdido",
]

export async function GET(request: NextRequest) {
  const auth = await requireRole("gestor")
  if (auth.error) return auth.error

  const { searchParams } = request.nextUrl
  const agora = new Date()
  const dataInicio = searchParams.get("dataInicio")
    ? new Date(searchParams.get("dataInicio")!)
    : new Date(agora.getTime() - 30 * 24 * 60 * 60 * 1000)
  const dataFim = searchParams.get("dataFim")
    ? new Date(searchParams.get("dataFim")!)
    : agora
  const origem = searchParams.get("origem") || undefined

  const filtroBase = {
    deletadoEm: null,
    arquivado: false,
    criadoEm: { gte: dataInicio, lte: dataFim },
    ...(origem ? { origem } : {}),
  }

  const [leadsPorEtapaRaw, totalEntradas, leadsConvertidos, leadsParaTempoMedio] =
    await Promise.all([
      prisma.lead.groupBy({
        by: ["statusFunil"],
        _count: { id: true },
        where: filtroBase,
      }),
      prisma.lead.count({ where: filtroBase }),
      prisma.lead.count({
        where: {
          ...filtroBase,
          statusFunil: {
            in: ["venda_realizada"] as never[],
          },
        },
      }),
      prisma.lead.findMany({
        where: {
          ...filtroBase,
          statusFunil: {
            in: ["venda_realizada"] as never[],
          },
          ultimaMovimentacaoEm: { not: null },
        },
        select: { criadoEm: true, ultimaMovimentacaoEm: true },
        take: 100,
      }),
    ])

  const funil = ordemFunil.map((etapa, idx) => {
    const encontrado = leadsPorEtapaRaw.find((g) => g.statusFunil === etapa)
    const total = encontrado?._count?.id ?? 0
    const anterior =
      idx === 0
        ? totalEntradas
        : (ordemFunil
            .slice(0, idx)
            .map((e) => leadsPorEtapaRaw.find((g) => g.statusFunil === e)?._count?.id ?? 0)
            .find((v) => v > 0) ?? totalEntradas)
    const conversao = anterior > 0 ? Math.round((total / anterior) * 1000) / 10 : 0

    return {
      etapa,
      label: labelsFunil[etapa] || etapa,
      total,
      conversao,
      cor: coresFunil[etapa] || "#94a3b8",
    }
  })

  const taxaConversaoGeral =
    totalEntradas > 0 ? Math.round((leadsConvertidos / totalEntradas) * 1000) / 10 : 0

  const tempoMedioEtapas =
    leadsParaTempoMedio.length > 0
      ? Math.round(
          leadsParaTempoMedio.reduce((acc, l) => {
            if (!l.ultimaMovimentacaoEm) return acc
            return acc + (l.ultimaMovimentacaoEm.getTime() - l.criadoEm.getTime())
          }, 0) /
            leadsParaTempoMedio.length /
            (1000 * 60 * 60 * 24)
        )
      : 0

  return NextResponse.json({
    periodo: { inicio: dataInicio.toISOString(), fim: dataFim.toISOString() },
    funil,
    totalEntradas,
    taxaConversaoGeral,
    tempoMedioEtapas,
  })
}
