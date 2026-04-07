import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/auth-helpers"

const labelsFunil: Record<string, string> = {
  qualificacao: "Qualificação",
  encaminhado: "Encaminhado",
  tarefa_criada: "Tarefa Criada",
}

const coresFunil: Record<string, string> = {
  qualificacao: "#93c5fd",
  encaminhado: "#a5b4fc",
  tarefa_criada: "#c4b5fd",
}

const ordemFunil = [
  "qualificacao",
  "encaminhado",
  "tarefa_criada",
]

const etapasConvertidas = [
  "venda_realizada",
]

function calcularDataInicio(periodo: string): Date | null {
  const agora = new Date()

  if (periodo === "total") return null

  if (periodo === "hoje") {
    const spDate = new Intl.DateTimeFormat("pt-BR", {
      timeZone: "America/Sao_Paulo",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(agora)
    const [dia, mes, ano] = spDate.split("/")
    return new Date(`${ano}-${mes}-${dia}T00:00:00-03:00`)
  }

  if (periodo === "semana") {
    return new Date(agora.getTime() - 7 * 24 * 60 * 60 * 1000)
  }

  // mes (default)
  return new Date(agora.getTime() - 30 * 24 * 60 * 60 * 1000)
}

export async function GET(request: NextRequest) {
  const { session, error } = await requireAuth()
  if (error) return error

  const periodo =
    request.nextUrl.searchParams.get("periodo") || "mes"
  const dataInicio = calcularDataInicio(periodo)
  const dataFim = new Date()

  const filtroBase = { deletadoEm: null, arquivado: false }
  const filtroPeriodo = dataInicio
    ? { criadoEm: { gte: dataInicio } }
    : {}

  const spHoje = new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date())
  const [diaH, mesH, anoH] = spHoje.split("/")
  const inicioHoje = new Date(`${anoH}-${mesH}-${diaH}T00:00:00-03:00`)

  const [
    totalLeads,
    leadsNovosNoPeriodo,
    leadsConvertidos,
    leadsPorEtapaRaw,
    leadsPorOrigemRaw,
    leadsHoje,
  ] = await Promise.all([
    prisma.lead.count({ where: filtroBase }),
    prisma.lead.count({ where: { ...filtroBase, ...filtroPeriodo } }),
    prisma.lead.count({
      where: {
        ...filtroBase,
        statusFunil: { in: etapasConvertidas as never[] },
      },
    }),
    prisma.lead.groupBy({
      by: ["statusFunil"],
      _count: { id: true },
      where: filtroBase,
    }),
    prisma.lead.groupBy({
      by: ["origem"],
      _count: { id: true },
      where: filtroBase,
    }),
    prisma.lead.count({
      where: { ...filtroBase, criadoEm: { gte: inicioHoje } },
    }),
  ])

  const taxaConversao =
    totalLeads > 0
      ? Math.round((leadsConvertidos / totalLeads) * 1000) / 10
      : 0

  const leadsPorEtapa = ordemFunil.map((etapa) => {
    const encontrado = leadsPorEtapaRaw.find(
      (g) => g.statusFunil === etapa
    )
    return {
      etapa,
      label: labelsFunil[etapa] || etapa,
      total: encontrado?._count?.id ?? 0,
      cor: coresFunil[etapa] || "#94a3b8",
    }
  })

  const leadsPorOrigem = leadsPorOrigemRaw.map((g) => ({
    origem: g.origem || "Não informada",
    total: g._count?.id ?? 0,
  }))

  return NextResponse.json({
    totalLeads,
    leadsNovosNoPeriodo,
    taxaConversao,
    leadsPorEtapa,
    leadsPorOrigem,
    leadsHoje,
    periodo,
    dataInicio: dataInicio?.toISOString() ?? null,
    dataFim: dataFim.toISOString(),
  })
}
