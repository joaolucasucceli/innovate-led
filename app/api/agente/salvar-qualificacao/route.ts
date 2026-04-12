import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { supabaseAdmin, agora } from "@/lib/supabase"
import { validarApiSecret } from "@/lib/api-auth"
import { criarLeadKommo, salvarQualificacaoKommo } from "@/lib/kommo"
import type { StatusFunil, EtapaConversa } from "@/types/database"

export async function POST(request: NextRequest) {
  const erro = validarApiSecret(request)
  if (erro) return erro

  let body: {
    leadId?: string
    conversaId?: string
    sobreOLead?: string
    nomeLead?: string
  }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Payload inválido" }, { status: 400 })
  }

  const { leadId, conversaId, sobreOLead, nomeLead } = body

  if (!leadId || !conversaId || !sobreOLead) {
    return NextResponse.json(
      { error: "leadId, conversaId e sobreOLead são obrigatórios" },
      { status: 400 }
    )
  }

  // APPEND em sobreOLead — NUNCA sobrescrever
  const { data: lead } = await supabaseAdmin
    .from("leads")
    .select("sobreOLead, nome, whatsapp, statusFunil")
    .eq("id", leadId)
    .single()

  const textoExistente = lead?.sobreOLead || ""
  const novoTexto = textoExistente
    ? `${textoExistente}\n---\n${sobreOLead}`
    : sobreOLead

  const dadosAtualizar: Record<string, unknown> = {
    sobreOLead: novoTexto,
    atualizadoEm: agora(),
  }

  // Atualizar nome do lead se informado e o atual é genérico (WhatsApp XXXXX)
  if (nomeLead) {
    const nomeAtual = lead?.nome || ""
    if (nomeAtual.startsWith("WhatsApp ") || !nomeAtual) {
      dadosAtualizar.nome = nomeLead
    }
  }

  await supabaseAdmin
    .from("leads")
    .update(dadosAtualizar)
    .eq("id", leadId)

  // Avançar funil: acolhimento → qualificacao quando salva qualificação
  if (lead?.statusFunil === "acolhimento") {
    await supabaseAdmin
      .from("leads")
      .update({
        statusFunil: "qualificacao" as StatusFunil,
        ultimaMovimentacaoEm: agora(),
        atualizadoEm: agora(),
      })
      .eq("id", leadId)

    await supabaseAdmin
      .from("conversas")
      .update({
        etapa: "qualificacao" as EtapaConversa,
        atualizadoEm: agora(),
      })
      .eq("id", conversaId)
  }

  // Sincronizar com Kommo CRM (fire-and-forget)
  if (lead?.whatsapp) {
    criarLeadKommo(nomeLead || lead.nome || "Lead WhatsApp", lead.whatsapp).catch(() => {})
    salvarQualificacaoKommo(lead.whatsapp, sobreOLead).catch(() => {})
  }

  return NextResponse.json({ sucesso: true })
}
