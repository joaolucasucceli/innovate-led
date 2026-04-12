import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { supabaseAdmin, agora } from "@/lib/supabase"
import { validarApiSecret } from "@/lib/api-auth"
import { criarTarefaKommo } from "@/lib/kommo"
import type { StatusFunil, EtapaConversa } from "@/types/database"

export async function POST(request: NextRequest) {
  const erro = validarApiSecret(request)
  if (erro) return erro

  let body: {
    leadId?: string
    conversaId?: string
    dataHora?: string
    resumo?: string
  }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Payload inválido" }, { status: 400 })
  }

  const { leadId, conversaId, dataHora, resumo } = body

  if (!leadId || !conversaId || !dataHora || !resumo) {
    return NextResponse.json(
      { error: "leadId, conversaId, dataHora e resumo são obrigatórios" },
      { status: 400 }
    )
  }

  // Avançar lead para "encaminhado"
  await supabaseAdmin
    .from("leads")
    .update({
      statusFunil: "encaminhado" as StatusFunil,
      ultimaMovimentacaoEm: agora(),
      atualizadoEm: agora(),
    })
    .eq("id", leadId)

  await supabaseAdmin
    .from("conversas")
    .update({
      etapa: "encaminhado" as EtapaConversa,
      atualizadoEm: agora(),
    })
    .eq("id", conversaId)

  // Buscar dados do lead para webhook
  const { data: lead } = await supabaseAdmin
    .from("leads")
    .select("nome, whatsapp")
    .eq("id", leadId)
    .single()

  // Sincronizar com Kommo CRM (fire-and-forget)
  if (lead?.whatsapp) {
    criarTarefaKommo(lead.whatsapp, dataHora, resumo).catch(() => {})
  }

  return NextResponse.json({
    sucesso: true,
    etapaAvancada: "encaminhado",
    dataHora,
  })
}
