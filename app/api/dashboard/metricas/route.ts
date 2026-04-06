import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/auth-helpers"

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
  venda_realizada: "#bbf7d0",
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
  const ha3dias = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)

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
    mensagensEnviadasPelaIA,
    followUpsEnviados,
    leadsEmAlerta,
    leadsRetorno,
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
    prisma.mensagemWhatsapp.count({
      where: {
        remetente: "agente",
        ...(dataInicio ? { criadoEm: { gte: dataInicio } } : {}),
      },
    }),
    prisma.conversa.count({
      where: {
        followUpEnviados: { isEmpty: false },
        ...(dataInicio ? { atualizadoEm: { gte: dataInicio } } : {}),
      },
    }),
    prisma.lead.count({
      where: {
        ...filtroBase,
        statusFunil: { notIn: ["venda_realizada", "perdido"] as never[] },
        OR: [
          { ultimaMovimentacaoEm: { not: null, lt: ha3dias } },
          { ultimaMovimentacaoEm: null, atualizadoEm: { lt: ha3dias } },
        ],
      },
    }),
    prisma.lead.count({
      where: { ...filtroBase, ehRetorno: true },
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

  const taxaRetorno =
    totalLeads > 0
      ? Math.round((leadsRetorno / totalLeads) * 1000) / 10
      : 0

  const isAtendente = session!.user.perfil === "atendente"

  return NextResponse.json({
    totalLeads,
    leadsNovosNoPeriodo,
    taxaConversao,
    leadsPorEtapa,
    leadsPorOrigem,
    mensagensEnviadasPelaIA: isAtendente ? 0 : mensagensEnviadasPelaIA,
    followUpsEnviados: isAtendente ? 0 : followUpsEnviados,
    leadsEmAlerta,
    leadsRetorno,
    taxaRetorno,
    leadsHoje,
    periodo,
    dataInicio: dataInicio?.toISOString() ?? null,
    dataFim: dataFim.toISOString(),
  })
}
