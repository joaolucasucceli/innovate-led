import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"
import { requireAuth } from "@/lib/auth-helpers"
import type { StatusFunil } from "@/types/database"

const ETAPAS_FUNIL: StatusFunil[] = [
  "acolhimento",
  "qualificacao",
  "encaminhado",
]

export async function GET(request: NextRequest) {
  const auth = await requireAuth()
  if (auth.error) return auth.error

  const { searchParams } = new URL(request.url)
  const responsavelId = searchParams.get("responsavelId")

  let query = supabaseAdmin
    .from("leads")
    .select("id, nome, whatsapp, statusFunil, criadoEm, atualizadoEm, ultimaMovimentacaoEm, motivoPerda, ehRetorno, cicloAtual, responsavelId")
    .is("deletadoEm", null)
    .eq("arquivado", false)
    .order("atualizadoEm", { ascending: false })

  if (responsavelId) {
    query = query.eq("responsavelId", responsavelId)
  }

  const { data: leads, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Buscar responsáveis
  const responsavelIds = [...new Set((leads || []).map((l) => l.responsavelId).filter(Boolean))]
  let responsaveisMap: Record<string, { id: string; nome: string }> = {}
  if (responsavelIds.length > 0) {
    const { data: responsaveis } = await supabaseAdmin
      .from("usuarios")
      .select("id, nome")
      .in("id", responsavelIds)
    if (responsaveis) {
      responsaveisMap = Object.fromEntries(responsaveis.map((r) => [r.id, r]))
    }
  }

  // Buscar conversas ativas (para followUpEnviados)
  const leadIds = (leads || []).map((l) => l.id)
  let conversasMap: Record<string, { followUpEnviados: string[] }> = {}
  if (leadIds.length > 0) {
    const { data: conversas } = await supabaseAdmin
      .from("conversas")
      .select("leadId, followUpEnviados")
      .in("leadId", leadIds)
      .is("encerradaEm", null)
      .order("criadoEm", { ascending: false })
    if (conversas) {
      // Pegar somente a primeira conversa de cada lead
      for (const c of conversas) {
        if (!conversasMap[c.leadId]) {
          conversasMap[c.leadId] = { followUpEnviados: c.followUpEnviados || [] }
        }
      }
    }
  }

  const agoraMs = Date.now()
  const colunas: Record<string, unknown[]> = {}

  for (const etapa of ETAPAS_FUNIL) {
    colunas[etapa] = []
  }

  for (const lead of leads || []) {
    const { responsavelId: rId, ...rest } = lead
    const referencia = rest.ultimaMovimentacaoEm || rest.atualizadoEm
    const diasNaEtapa = Math.floor((agoraMs - new Date(referencia).getTime()) / 86400000)

    colunas[rest.statusFunil].push({
      ...rest,
      responsavel: rId ? responsaveisMap[rId] || null : null,
      diasNaEtapa,
      followUpEnviados: conversasMap[rest.id]?.followUpEnviados ?? [],
    })
  }

  return NextResponse.json({
    colunas,
    total: (leads || []).length,
  })
}
