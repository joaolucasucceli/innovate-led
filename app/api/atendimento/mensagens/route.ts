import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"
import { requireAuth } from "@/lib/auth-helpers"

export async function GET(req: Request) {
  const auth = await requireAuth()
  if (auth.error) return auth.error

  const { searchParams } = new URL(req.url)
  const conversaId = searchParams.get("conversaId")
  const cursor = searchParams.get("cursor")
  const limite = Math.min(Number(searchParams.get("limite")) || 50, 100)

  if (!conversaId) {
    return NextResponse.json({ error: "conversaId obrigatório" }, { status: 400 })
  }

  // Para cursor-based pagination com Supabase:
  // Se temos cursor, buscamos mensagens mais antigas que o cursor
  let query = supabaseAdmin
    .from("mensagens_whatsapp")
    .select("*, replyTo:mensagens_whatsapp!replyToId(id, conteudo, remetente)")
    .eq("conversaId", conversaId)
    .order("criadoEm", { ascending: false })
    .limit(limite + 1)

  if (cursor) {
    // Buscar criadoEm do cursor para filtrar mensagens anteriores
    const { data: cursorMsg } = await supabaseAdmin
      .from("mensagens_whatsapp")
      .select("criadoEm")
      .eq("id", cursor)
      .single()

    if (cursorMsg) {
      query = query.lt("criadoEm", cursorMsg.criadoEm)
    }
  }

  const { data: mensagens } = await query

  if (!mensagens) {
    return NextResponse.json({ mensagens: [], proximoCursor: null })
  }

  const temMais = mensagens.length > limite
  if (temMais) mensagens.pop()

  // Reverter para ordem cronológica
  mensagens.reverse()

  return NextResponse.json({
    mensagens,
    proximoCursor: temMais ? mensagens[0]?.id : null,
  })
}
