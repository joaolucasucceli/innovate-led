import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { supabaseAdmin, gerarId, agora } from "@/lib/supabase"
import { requireAuth } from "@/lib/auth-helpers"

export async function POST(request: NextRequest) {
  const auth = await requireAuth()
  if (auth.error) return auth.error

  const body = await request.json()
  const { leadId } = body

  if (!leadId) {
    return NextResponse.json({ error: "leadId é obrigatório" }, { status: 400 })
  }

  const { data: lead, error: findError } = await supabaseAdmin
    .from("leads")
    .select("*")
    .eq("id", leadId)
    .single()

  if (findError || !lead) {
    return NextResponse.json({ error: "Lead não encontrado" }, { status: 404 })
  }

  if (lead.statusFunil !== "encaminhado") {
    return NextResponse.json(
      { error: "Lead já possui atendimento em andamento" },
      { status: 409 }
    )
  }

  const novoCiclo = lead.cicloAtual + 1

  // Sequential calls (replacing $transaction)
  await supabaseAdmin
    .from("leads")
    .update({
      cicloAtual: novoCiclo,
      ciclosCompletos: lead.ciclosCompletos + 1,
      ehRetorno: true,
      statusFunil: "qualificacao",
      motivoPerda: null,
      ultimaMovimentacaoEm: agora(),
      atualizadoEm: agora(),
    })
    .eq("id", leadId)

  await supabaseAdmin
    .from("conversas")
    .insert({
      id: gerarId(),
      leadId,
      ciclo: novoCiclo,
      etapa: "qualificacao",
      atualizadoEm: agora(),
    })

  return NextResponse.json({ sucesso: true })
}
