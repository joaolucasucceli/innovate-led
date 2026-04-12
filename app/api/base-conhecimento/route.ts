import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { supabaseAdmin, gerarId } from "@/lib/supabase"
import { requireAuth, requireRole } from "@/lib/auth-helpers"

const SECAO = "base-conhecimento"

export async function GET() {
  const auth = await requireAuth()
  if (auth.error) return auth.error

  const { data: artigos, error } = await supabaseAdmin
    .from("artigos_documentacao")
    .select("id, titulo, conteudo, ordem")
    .eq("secao", SECAO)
    .eq("ativo", true)
    .order("ordem", { ascending: true })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(artigos || [])
}

export async function POST(request: NextRequest) {
  const auth = await requireRole("gestor")
  if (auth.error) return auth.error

  const body = await request.json()
  const { titulo, conteudo } = body

  if (!titulo || !conteudo) {
    return NextResponse.json({ error: "titulo e conteudo sao obrigatorios" }, { status: 400 })
  }

  // Buscar max ordem
  const { data: maxOrdemRows } = await supabaseAdmin
    .from("artigos_documentacao")
    .select("ordem")
    .eq("secao", SECAO)
    .eq("ativo", true)
    .order("ordem", { ascending: false })
    .limit(1)

  const maxOrdem = maxOrdemRows && maxOrdemRows.length > 0 ? maxOrdemRows[0].ordem : -1

  const { data: artigo, error } = await supabaseAdmin
    .from("artigos_documentacao")
    .insert({
      id: gerarId(),
      titulo,
      conteudo,
      secao: SECAO,
      ordem: (maxOrdem ?? -1) + 1,
      atualizadoPorId: auth.session!.user.id,
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(artigo, { status: 201 })
}
