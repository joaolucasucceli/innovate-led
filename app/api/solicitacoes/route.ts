import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { supabaseAdmin, gerarId, agora } from "@/lib/supabase"
import { requireAuth } from "@/lib/auth-helpers"

export async function GET(request: NextRequest) {
  const auth = await requireAuth()
  if (auth.error) return auth.error

  const { searchParams } = request.nextUrl
  const pagina = Number(searchParams.get("pagina") || "1")
  const porPagina = Number(searchParams.get("porPagina") || "10")
  const status = searchParams.get("status")

  let query = supabaseAdmin
    .from("solicitacoes_alteracao")
    .select("*", { count: "exact" })
    .order("criadoEm", { ascending: false })
    .range((pagina - 1) * porPagina, pagina * porPagina - 1)

  if (status) query = query.eq("status", status)

  const { data: solicitacoes, count, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Buscar criadores
  const criadoPorIds = [...new Set((solicitacoes || []).map((s) => s.criadoPorId))]
  let criadoresMap: Record<string, { id: string; nome: string; email: string }> = {}
  if (criadoPorIds.length > 0) {
    const { data: criadores } = await supabaseAdmin
      .from("usuarios")
      .select("id, nome, email")
      .in("id", criadoPorIds)
    if (criadores) {
      criadoresMap = Object.fromEntries(criadores.map((c) => [c.id, c]))
    }
  }

  const dados = (solicitacoes || []).map((s) => ({
    ...s,
    criadoPor: criadoresMap[s.criadoPorId] || null,
  }))

  return NextResponse.json({ dados, total: count ?? 0, pagina, porPagina })
}

export async function POST(request: NextRequest) {
  const auth = await requireAuth()
  if (auth.error) return auth.error

  const body = await request.json()
  const { titulo, descricao } = body

  if (!titulo || !descricao) {
    return NextResponse.json(
      { error: "Titulo e descricao sao obrigatorios" },
      { status: 400 }
    )
  }

  const { data: solicitacao, error } = await supabaseAdmin
    .from("solicitacoes_alteracao")
    .insert({
      id: gerarId(),
      titulo,
      descricao,
      criadoPorId: auth.session.user.id,
      atualizadoEm: agora(),
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Buscar criador
  const { data: criadoPor } = await supabaseAdmin
    .from("usuarios")
    .select("id, nome, email")
    .eq("id", auth.session.user.id)
    .single()

  return NextResponse.json({ ...solicitacao, criadoPor }, { status: 201 })
}
