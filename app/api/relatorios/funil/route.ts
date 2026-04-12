import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"
import { requireRole } from "@/lib/auth-helpers"

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

  const baseQuery = () => {
    let q = supabaseAdmin
      .from("leads")
      .select("*", { count: "exact", head: true })
      .is("deletadoEm", null)
      .eq("arquivado", false)
      .gte("criadoEm", dataInicio.toISOString())
      .lte("criadoEm", dataFim.toISOString())
    if (origem) q = q.eq("origem", origem)
    return q
  }

  const [
    totalEntradasRes,
    leadsConvertidosRes,
    acolhimentoRes,
    qualificacaoRes,
    encaminhadoRes,
  ] = await Promise.all([
    baseQuery(),
    baseQuery().eq("statusFunil", "encaminhado"),
    baseQuery().eq("statusFunil", "acolhimento"),
    baseQuery().eq("statusFunil", "qualificacao"),
    baseQuery().eq("statusFunil", "encaminhado"),
  ])

  const totalEntradas = totalEntradasRes.count ?? 0
  const leadsConvertidos = leadsConvertidosRes.count ?? 0

  const etapaCounts: Record<string, number> = {
    acolhimento: acolhimentoRes.count ?? 0,
    qualificacao: qualificacaoRes.count ?? 0,
    encaminhado: encaminhadoRes.count ?? 0,
  }

  const funil = ordemFunil.map((etapa, idx) => {
    const total = etapaCounts[etapa] ?? 0
    const anterior =
      idx === 0
        ? totalEntradas
        : (ordemFunil
            .slice(0, idx)
            .map((e) => etapaCounts[e] ?? 0)
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

  // Tempo médio de etapas
  let leadsBaseQ = supabaseAdmin
    .from("leads")
    .select("criadoEm, ultimaMovimentacaoEm")
    .is("deletadoEm", null)
    .eq("arquivado", false)
    .gte("criadoEm", dataInicio.toISOString())
    .lte("criadoEm", dataFim.toISOString())
    .eq("statusFunil", "encaminhado")
    .not("ultimaMovimentacaoEm", "is", null)
    .limit(100)
  if (origem) leadsBaseQ = leadsBaseQ.eq("origem", origem)

  const { data: leadsParaTempoMedio } = await leadsBaseQ

  const tempoMedioEtapas =
    (leadsParaTempoMedio || []).length > 0
      ? Math.round(
          (leadsParaTempoMedio || []).reduce((acc, l) => {
            if (!l.ultimaMovimentacaoEm) return acc
            return acc + (new Date(l.ultimaMovimentacaoEm).getTime() - new Date(l.criadoEm).getTime())
          }, 0) /
            (leadsParaTempoMedio || []).length /
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
