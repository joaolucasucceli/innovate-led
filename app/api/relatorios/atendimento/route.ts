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
    : new Date(agora.getTime() - 30 * 24 * 60 * 60 * 1000)
  const dataFim = searchParams.get("dataFim")
    ? new Date(searchParams.get("dataFim")!)
    : agora

  const dI = dataInicio.toISOString()
  const dF = dataFim.toISOString()

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

  // Follow-ups
  const { data: conversasFollowUp } = await supabaseAdmin
    .from("conversas")
    .select("id, followUpEnviados")
    .gte("atualizadoEm", dI)
    .lte("atualizadoEm", dF)
    .not("followUpEnviados", "eq", "{}")

  const followUpsEnviados = (conversasFollowUp || []).length
  const conversasComFollowUp = followUpsEnviados

  // Conversas respondidas: follow-up + mensagem do paciente
  let conversasRespondidas = 0
  if (conversasFollowUp && conversasFollowUp.length > 0) {
    const convIds = conversasFollowUp.map((c) => c.id)
    const { data: mensagensPaciente } = await supabaseAdmin
      .from("mensagens_whatsapp")
      .select("conversaId")
      .in("conversaId", convIds)
      .eq("remetente", "paciente")
      .gte("criadoEm", dI)
    const convComResposta = new Set((mensagensPaciente || []).map((m) => m.conversaId))
    conversasRespondidas = convComResposta.size
  }

  const taxaResposta =
    conversasComFollowUp > 0
      ? Math.round((conversasRespondidas / conversasComFollowUp) * 1000) / 10
      : 0

  const tempoMedioResposta = 0

  return NextResponse.json({
    periodo: { inicio: dataInicio.toISOString(), fim: dataFim.toISOString() },
    mensagens: {
      total: totalMensagensRes.count ?? 0,
      enviadas: enviadasRes.count ?? 0,
      recebidas: recebidasRes.count ?? 0,
    },
    conversas: {
      total: totalConversasRes.count ?? 0,
      ativas: conversasAtivasRes.count ?? 0,
      encerradas: conversasEncerradasRes.count ?? 0,
      tempoMedioResposta,
    },
    followUps: { enviados: followUpsEnviados, taxaResposta },
  })
}
