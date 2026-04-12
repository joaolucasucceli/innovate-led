import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"
import { requireAuth } from "@/lib/auth-helpers"

const labelsFunil: Record<string, string> = {
  acolhimento: "Acolhimento",
  qualificacao: "Qualificação",
  encaminhado: "Encaminhado",
}

const coresFunil: Record<string, string> = {
  acolhimento: "#86efac",
  qualificacao: "#93c5fd",
  encaminhado: "#a5b4fc",
}

const ordemFunil = [
  "acolhimento",
  "qualificacao",
  "encaminhado",
]

const etapasConvertidas = [
  "encaminhado",
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

  const spHoje = new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date())
  const [diaH, mesH, anoH] = spHoje.split("/")
  const inicioHoje = new Date(`${anoH}-${mesH}-${diaH}T00:00:00-03:00`)

  // Base query builder
  const baseQuery = () =>
    supabaseAdmin
      .from("leads")
      .select("*", { count: "exact", head: true })
      .is("deletadoEm", null)
      .eq("arquivado", false)

  const periodoQuery = () => {
    const q = baseQuery()
    return dataInicio ? q.gte("criadoEm", dataInicio.toISOString()) : q
  }

  const [
    totalLeadsRes,
    leadsNovosRes,
    leadsConvertidosRes,
    leadsHojeRes,
    // Por etapa — queries separadas
    acolhimentoRes,
    qualificacaoRes,
    encaminhadoRes,
  ] = await Promise.all([
    baseQuery(),
    periodoQuery(),
    baseQuery().in("statusFunil", etapasConvertidas),
    baseQuery().gte("criadoEm", inicioHoje.toISOString()),
    baseQuery().eq("statusFunil", "acolhimento"),
    baseQuery().eq("statusFunil", "qualificacao"),
    baseQuery().eq("statusFunil", "encaminhado"),
  ])

  const totalLeads = totalLeadsRes.count ?? 0
  const leadsNovosNoPeriodo = leadsNovosRes.count ?? 0
  const leadsConvertidos = leadsConvertidosRes.count ?? 0
  const leadsHoje = leadsHojeRes.count ?? 0

  const etapaCounts: Record<string, number> = {
    acolhimento: acolhimentoRes.count ?? 0,
    qualificacao: qualificacaoRes.count ?? 0,
    encaminhado: encaminhadoRes.count ?? 0,
  }

  const taxaConversao =
    totalLeads > 0
      ? Math.round((leadsConvertidos / totalLeads) * 1000) / 10
      : 0

  const leadsPorEtapa = ordemFunil.map((etapa) => ({
    etapa,
    label: labelsFunil[etapa] || etapa,
    total: etapaCounts[etapa] ?? 0,
    cor: coresFunil[etapa] || "#94a3b8",
  }))

  // Leads por origem
  const { data: leadsOrigem } = await supabaseAdmin
    .from("leads")
    .select("origem")
    .is("deletadoEm", null)
    .eq("arquivado", false)

  const origemMap: Record<string, number> = {}
  for (const l of leadsOrigem || []) {
    const key = l.origem || "Não informada"
    origemMap[key] = (origemMap[key] || 0) + 1
  }
  const leadsPorOrigem = Object.entries(origemMap).map(([origem, total]) => ({
    origem,
    total,
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
