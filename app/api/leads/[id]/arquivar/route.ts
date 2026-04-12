import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { supabaseAdmin, agora } from "@/lib/supabase"
import { requireAuth } from "@/lib/auth-helpers"

type RouteParams = { params: Promise<{ id: string }> }

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const auth = await requireAuth()
  if (auth.error) return auth.error

  const { id } = await params

  const { data: lead, error: findError } = await supabaseAdmin
    .from("leads")
    .select("*")
    .eq("id", id)
    .is("deletadoEm", null)
    .single()

  if (findError || !lead) {
    return NextResponse.json({ error: "Lead não encontrado" }, { status: 404 })
  }

  const novoArquivado = !lead.arquivado

  const { data: leadAtualizado, error: updateError } = await supabaseAdmin
    .from("leads")
    .update({
      arquivado: novoArquivado,
      arquivadoEm: novoArquivado ? agora() : null,
      atualizadoEm: agora(),
    })
    .eq("id", id)
    .select("id, nome, arquivado, arquivadoEm")
    .single()

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 })
  }

  return NextResponse.json(leadAtualizado)
}
