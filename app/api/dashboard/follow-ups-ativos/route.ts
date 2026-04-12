import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"
import { requireAuth } from "@/lib/auth-helpers"

export async function GET() {
  const { error } = await requireAuth()
  if (error) return error

  // Buscar conversas ativas com follow-ups enviados
  const { data: conversas } = await supabaseAdmin
    .from("conversas")
    .select("leadId, followUpEnviados, ultimaMensagemEm")
    .is("encerradaEm", null)
    .not("followUpEnviados", "eq", "{}")
    .order("criadoEm", { ascending: false })

  // Agrupar por leadId (primeira conversa)
  const leadConversaMap: Record<string, { followUpEnviados: string[]; ultimaMensagemEm: string | null }> = {}
  for (const c of conversas || []) {
    if (!leadConversaMap[c.leadId]) {
      leadConversaMap[c.leadId] = {
        followUpEnviados: c.followUpEnviados || [],
        ultimaMensagemEm: c.ultimaMensagemEm,
      }
    }
  }

  const leadIds = Object.keys(leadConversaMap)
  if (leadIds.length === 0) {
    return NextResponse.json({ leads: [], total: 0 })
  }

  // Buscar dados dos leads
  const { data: leads } = await supabaseAdmin
    .from("leads")
    .select("id, nome, statusFunil")
    .in("id", leadIds)
    .is("deletadoEm", null)
    .eq("arquivado", false)

  const resultado = (leads || [])
    .map((lead) => ({
      id: lead.id,
      nome: lead.nome,
      statusFunil: lead.statusFunil,
      followUpEnviados: leadConversaMap[lead.id]?.followUpEnviados ?? [],
      ultimaMensagemEm: leadConversaMap[lead.id]?.ultimaMensagemEm ?? null,
    }))
    .sort((a, b) => {
      if (!a.ultimaMensagemEm) return 1
      if (!b.ultimaMensagemEm) return -1
      return new Date(a.ultimaMensagemEm).getTime() - new Date(b.ultimaMensagemEm).getTime()
    })
    .slice(0, 5)

  return NextResponse.json({ leads: resultado, total: leadIds.length })
}
