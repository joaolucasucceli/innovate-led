import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"
import { requireAuth } from "@/lib/auth-helpers"

export async function GET(req: Request) {
  const auth = await requireAuth()
  if (auth.error) return auth.error

  const { searchParams } = new URL(req.url)
  const filtro = searchParams.get("filtro") || "todas"
  const busca = searchParams.get("busca") || ""
  const userId = auth.session.user.id

  // Montar query base: conversas abertas com lead e atendente
  let query = supabaseAdmin
    .from("conversas")
    .select("*, lead:leads!inner(id, nome, whatsapp, statusFunil), atendente:usuarios(id, nome)")
    .is("encerradaEm", null)
    .order("ultimaMensagemEm", { ascending: false })
    .limit(50)

  if (filtro === "minhas") {
    query = query.eq("atendenteId", userId)
  }

  if (filtro === "pendentes") {
    query = query.eq("modoConversa", "ia")
  }

  if (busca) {
    // Buscar por nome ou whatsapp do lead (ilike = case insensitive)
    query = query.or(`nome.ilike.%${busca}%,whatsapp.ilike.%${busca}%`, { referencedTable: "leads" })
  }

  const { data: conversas, error } = await query

  if (error) {
    console.error("[Conversas] Erro ao buscar:", error.message)
    return NextResponse.json({ conversas: [] })
  }

  // Para cada conversa, buscar última mensagem e contagem de não lidas
  const resultado = await Promise.all(
    (conversas || []).map(async (c: any) => {
      // Última mensagem
      const { data: ultimasMsgs } = await supabaseAdmin
        .from("mensagens_whatsapp")
        .select("id, conteudo, remetente, tipo, criadoEm")
        .eq("conversaId", c.id)
        .order("criadoEm", { ascending: false })
        .limit(1)

      // Contagem de não lidas
      const { count } = await supabaseAdmin
        .from("mensagens_whatsapp")
        .select("*", { count: "exact", head: true })
        .eq("conversaId", c.id)
        .eq("remetente", "paciente")
        .is("lidaEm", null)

      return {
        id: c.id,
        leadId: c.leadId,
        etapa: c.etapa,
        modoConversa: c.modoConversa,
        atendenteId: c.atendenteId,
        atendente: c.atendente,
        ultimaMensagemEm: c.ultimaMensagemEm,
        lead: c.lead,
        ultimaMensagem: ultimasMsgs?.[0] || null,
        naoLidas: count || 0,
      }
    })
  )

  return NextResponse.json({ conversas: resultado })
}
