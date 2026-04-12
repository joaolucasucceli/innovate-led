import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { supabaseAdmin, agora } from "@/lib/supabase"
import { requireAuth } from "@/lib/auth-helpers"

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth()
  if (auth.error) return auth.error

  const { id } = await params
  const body = await request.json()
  const { status } = body

  if (!status || !["pendente", "concluida"].includes(status)) {
    return NextResponse.json(
      { error: "Status invalido" },
      { status: 400 }
    )
  }

  const { data: solicitacao, error: updateError } = await supabaseAdmin
    .from("solicitacoes_alteracao")
    .update({
      status,
      concluidoEm: status === "concluida" ? new Date().toISOString() : null,
      atualizadoEm: agora(),
    })
    .eq("id", id)
    .select()
    .single()

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 })
  }

  // Buscar criador
  const { data: criadoPor } = await supabaseAdmin
    .from("usuarios")
    .select("id, nome, email")
    .eq("id", solicitacao.criadoPorId)
    .single()

  return NextResponse.json({ ...solicitacao, criadoPor })
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth()
  if (auth.error) return auth.error

  const { id } = await params

  const { data: solicitacao, error: findError } = await supabaseAdmin
    .from("solicitacoes_alteracao")
    .select("id")
    .eq("id", id)
    .single()

  if (findError || !solicitacao) {
    return NextResponse.json(
      { error: "Solicitacao nao encontrada" },
      { status: 404 }
    )
  }

  await supabaseAdmin.from("solicitacoes_alteracao").delete().eq("id", id)

  return NextResponse.json({ ok: true })
}
