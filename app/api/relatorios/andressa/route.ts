import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"
import { requireRole } from "@/lib/auth-helpers"

export async function GET(request: NextRequest) {
  const auth = await requireRole("gestor")
  if (auth.error) return auth.error

  const { searchParams } = request.nextUrl
  const agora = new Date()
  const dataInicio = searchParams.get("dataInicio")
    ? new Date(searchParams.get("dataInicio")!)
    : new Date(agora.getTime() - 7 * 24 * 60 * 60 * 1000)
  const dataFim = searchParams.get("dataFim")
    ? new Date(searchParams.get("dataFim")!)
    : agora

  // Ajustar dataFim para incluir o dia inteiro
  const dataFimDia = new Date(dataFim)
  dataFimDia.setHours(23, 59, 59, 999)

  const dI = dataInicio.toISOString()
  const dF = dataFimDia.toISOString()

  // Buscar usuário IA (Lívia)
  const { data: livia } = await supabaseAdmin
    .from("usuarios")
    .select("id")
    .eq("tipo", "ia")
    .is("deletadoEm", null)
    .limit(1)
    .single()

  const msgBase = () =>
    supabaseAdmin
      .from("mensagens_whatsapp")
      .select("*", { count: "exact", head: true })
      .gte("criadoEm", dI)
      .lte("criadoEm", dF)

  const convBase = () =>
    supabaseAdmin
      .from("conversas")
      .select("*", { count: "exact", head: true })
      .gte("criadoEm", dI)
      .lte("criadoEm", dF)

  const [
    totalMensagensRes,
    enviadasRes,
    recebidasRes,
    totalConversasRes,
    conversasAtivasRes,
    conversasEncerradasRes,
  ] = await Promise.all([
    msgBase(),
    msgBase().eq("remetente", "agente"),
    msgBase().eq("remetente", "paciente"),
    convBase(),
    convBase().is("encerradaEm", null),
    convBase().not("encerradaEm", "is", null),
  ])

  // Funil — leads gerenciados pela Lívia no período
  let funil = { leadsRecebidos: 0, qualificados: 0, encaminhados: 0, vendidos: 0 }
  if (livia) {
    const { data: leadsIA } = await supabaseAdmin
      .from("leads")
      .select("statusFunil")
      .eq("responsavelId", livia.id)
      .gte("criadoEm", dI)
      .lte("criadoEm", dF)
      .is("deletadoEm", null)

    const etapasQualificacao = new Set([
      "qualificacao",
      "encaminhado",
    ])
    const etapasEncaminhado = new Set([
      "encaminhado",
    ])

    const leads = leadsIA || []
    funil = {
      leadsRecebidos: leads.length,
      qualificados: leads.filter((l) => etapasQualificacao.has(l.statusFunil)).length,
      encaminhados: leads.filter((l) => etapasEncaminhado.has(l.statusFunil)).length,
      vendidos: 0,
    }
  }

  // Follow-ups enviados — contagem por tipo
  const { data: conversasPeriodo } = await supabaseAdmin
    .from("conversas")
    .select("followUpEnviados")
    .gte("atualizadoEm", dI)
    .lte("atualizadoEm", dF)

  let f1h = 0, f6h = 0, f24h = 0
  for (const c of conversasPeriodo || []) {
    if (c.followUpEnviados.includes("1h")) f1h++
    if (c.followUpEnviados.includes("6h")) f6h++
    if (c.followUpEnviados.includes("24h")) f24h++
  }

  // Atividade por dia — usando RPC ou manual aggregation
  const { data: mensagensPeriodo } = await supabaseAdmin
    .from("mensagens_whatsapp")
    .select("criadoEm, remetente")
    .gte("criadoEm", dI)
    .lte("criadoEm", dF)

  const atividadeMap: Record<string, { enviadas: number; recebidas: number }> = {}
  for (const m of mensagensPeriodo || []) {
    const data = new Date(m.criadoEm).toLocaleDateString("sv-SE", { timeZone: "America/Sao_Paulo" })
    if (!atividadeMap[data]) atividadeMap[data] = { enviadas: 0, recebidas: 0 }
    if (m.remetente === "agente") atividadeMap[data].enviadas++
    else atividadeMap[data].recebidas++
  }

  const atividadePorDia = Object.entries(atividadeMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([data, v]) => ({ data, ...v }))

  return NextResponse.json({
    periodo: { inicio: dataInicio.toISOString(), fim: dataFimDia.toISOString() },
    mensagens: {
      total: totalMensagensRes.count ?? 0,
      enviadas: enviadasRes.count ?? 0,
      recebidas: recebidasRes.count ?? 0,
    },
    conversas: {
      total: totalConversasRes.count ?? 0,
      ativas: conversasAtivasRes.count ?? 0,
      encerradas: conversasEncerradasRes.count ?? 0,
    },
    funil,
    followUps: { f1h, f6h, f24h },
    atividadePorDia,
  })
}
