import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { supabaseAdmin, agora } from "@/lib/supabase"
import { requireAuth } from "@/lib/auth-helpers"
import { mudarStatusSchema } from "@/lib/validations/lead"

type RouteParams = { params: Promise<{ id: string }> }

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const auth = await requireAuth()
  if (auth.error) return auth.error

  const { id } = await params
  const body = await request.json()
  const parsed = mudarStatusSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Dados inválidos", detalhes: parsed.error.flatten() },
      { status: 400 }
    )
  }

  const { data: lead, error: findError } = await supabaseAdmin
    .from("leads")
    .select("*")
    .eq("id", id)
    .is("deletadoEm", null)
    .single()

  if (findError || !lead) {
    return NextResponse.json({ error: "Lead não encontrado" }, { status: 404 })
  }

  // Atendente só pode mover leads atribuídos a si
  const perfil = auth.session.user.perfil
  if (
    perfil === "atendente" &&
    lead.responsavelId !== auth.session.user.id
  ) {
    return NextResponse.json(
      { error: "Sem permissão para mover este lead" },
      { status: 403 }
    )
  }

  const novoStatus = parsed.data.statusFunil

  // Preparar dados de atualização
  const dataUpdate: Record<string, unknown> = {
    statusFunil: novoStatus,
    ultimaMovimentacaoEm: new Date().toISOString(),
    atualizadoEm: agora(),
  }

  const { data: leadAtualizado, error: updateError } = await supabaseAdmin
    .from("leads")
    .update(dataUpdate)
    .eq("id", id)
    .select("id, nome, statusFunil, motivoPerda")
    .single()

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 })
  }

  return NextResponse.json(leadAtualizado)
}
