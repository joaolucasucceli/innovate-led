import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { supabaseAdmin, agora } from "@/lib/supabase"
import { requireRole } from "@/lib/auth-helpers"

type RouteParams = { params: Promise<{ id: string }> }

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const auth = await requireRole("gestor")
  if (auth.error) return auth.error

  const { id } = await params
  const body = await request.json()

  const updateData: Record<string, unknown> = {
    atualizadoPorId: auth.session!.user.id,
    atualizadoEm: agora(),
  }
  if (body.titulo !== undefined) updateData.titulo = body.titulo
  if (body.conteudo !== undefined) updateData.conteudo = body.conteudo

  const { data: artigo, error } = await supabaseAdmin
    .from("artigos_documentacao")
    .update(updateData)
    .eq("id", id)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(artigo)
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const auth = await requireRole("gestor")
  if (auth.error) return auth.error

  const { id } = await params

  await supabaseAdmin
    .from("artigos_documentacao")
    .update({ ativo: false, atualizadoEm: agora() })
    .eq("id", id)

  return NextResponse.json({ ok: true })
}
