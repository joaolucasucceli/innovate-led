import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { supabaseAdmin, agora } from "@/lib/supabase"
import { redis } from "@/lib/redis"
import { deletarLeadKommo } from "@/lib/kommo"
import { requireAuth, requireAnyRole, requireRole } from "@/lib/auth-helpers"
import { atualizarLeadSchema } from "@/lib/validations/lead"

type RouteParams = { params: Promise<{ id: string }> }

export async function GET(_request: NextRequest, { params }: RouteParams) {
  const auth = await requireAuth()
  if (auth.error) return auth.error

  const { id } = await params

  // Buscar lead
  const { data: lead, error: leadError } = await supabaseAdmin
    .from("leads")
    .select("*")
    .eq("id", id)
    .is("deletadoEm", null)
    .single()

  if (leadError || !lead) {
    return NextResponse.json({ error: "Lead não encontrado" }, { status: 404 })
  }

  // Buscar responsável
  let responsavel = null
  if (lead.responsavelId) {
    const { data: resp } = await supabaseAdmin
      .from("usuarios")
      .select("id, nome")
      .eq("id", lead.responsavelId)
      .single()
    responsavel = resp
  }

  // Buscar conversas com mensagens
  const { data: conversas } = await supabaseAdmin
    .from("conversas")
    .select("*")
    .eq("leadId", id)
    .order("ciclo", { ascending: false })
    .order("atualizadoEm", { ascending: false })

  const conversasComMensagens = await Promise.all(
    (conversas || []).map(async (conversa) => {
      const { data: mensagens } = await supabaseAdmin
        .from("mensagens_whatsapp")
        .select("*")
        .eq("conversaId", conversa.id)
        .order("criadoEm", { ascending: true })
      return { ...conversa, mensagens: mensagens || [] }
    })
  )

  // Buscar fotos
  const { data: fotos } = await supabaseAdmin
    .from("fotos_lead")
    .select("*")
    .eq("leadId", id)
    .order("criadoEm", { ascending: false })

  return NextResponse.json({
    ...lead,
    responsavel,
    conversas: conversasComMensagens,
    fotos: fotos || [],
  })
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const auth = await requireAnyRole(["gestor", "atendente"])
  if (auth.error) return auth.error

  const { id } = await params
  const body = await request.json()
  const parsed = atualizarLeadSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Dados inválidos", detalhes: parsed.error.flatten() },
      { status: 400 }
    )
  }

  const { data: leadAtual, error: findError } = await supabaseAdmin
    .from("leads")
    .select("*")
    .eq("id", id)
    .is("deletadoEm", null)
    .single()

  if (findError || !leadAtual) {
    return NextResponse.json({ error: "Lead não encontrado" }, { status: 404 })
  }

  const dados: Record<string, unknown> = { ...parsed.data }

  // sobreOLead: APPEND, nunca overwrite
  if (dados.sobreOLead) {
    const textoAtual = leadAtual.sobreOLead || ""
    dados.sobreOLead = textoAtual
      ? `${textoAtual}\n---\n${dados.sobreOLead}`
      : dados.sobreOLead
  }

  // Se whatsapp mudou, verificar unicidade
  if (dados.whatsapp && dados.whatsapp !== leadAtual.whatsapp) {
    const { data: existente } = await supabaseAdmin
      .from("leads")
      .select("id")
      .eq("whatsapp", dados.whatsapp as string)
      .limit(1)
      .single()
    if (existente) {
      return NextResponse.json({ error: "WhatsApp já cadastrado" }, { status: 409 })
    }
  }

  const { data: leadAtualizado, error: updateError } = await supabaseAdmin
    .from("leads")
    .update({ ...dados, atualizadoEm: agora() })
    .eq("id", id)
    .select("id, nome, whatsapp, statusFunil, origem, sobreOLead, responsavelId, arquivado, criadoEm, atualizadoEm")
    .single()

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 })
  }

  return NextResponse.json(leadAtualizado)
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const auth = await requireRole("gestor")
  if (auth.error) return auth.error

  const { id } = await params

  const { data: lead, error: findError } = await supabaseAdmin
    .from("leads")
    .select("*")
    .eq("id", id)
    .single()

  if (findError || !lead) {
    return NextResponse.json({ error: "Lead não encontrado" }, { status: 404 })
  }

  // Hard delete em cascata
  // 1. Limpar replyToId — tanto deste lead quanto de outros leads que referenciam mensagens deste
  const { data: mensagensDoLead } = await supabaseAdmin
    .from("mensagens_whatsapp")
    .select("id")
    .eq("leadId", id)

  const idsMsg = (mensagensDoLead || []).map((m) => m.id)

  if (idsMsg.length > 0) {
    await supabaseAdmin
      .from("mensagens_whatsapp")
      .update({ replyToId: null })
      .in("replyToId", idsMsg)
  }

  // 2. Deletar em ordem de dependência (sequencial)
  await supabaseAdmin.from("mensagens_whatsapp").delete().eq("leadId", id)
  await supabaseAdmin.from("fotos_lead").delete().eq("leadId", id)
  await supabaseAdmin.from("conversas").delete().eq("leadId", id)
  await supabaseAdmin.from("leads").delete().eq("id", id)

  // 5. Limpar memória e buffer da IA no Redis
  const chatId = `${lead.whatsapp}@s.whatsapp.net`
  try {
    await redis.del(
      `${chatId}_mem_innovate`,
      `${chatId}_buf_innovate`,
      `${chatId}_deb_innovate`,
      `${chatId}_lock_innovate`
    )
  } catch {
    // Redis indisponível não impede a exclusão do lead
  }

  // 6. Deletar lead no Kommo CRM (fire-and-forget)
  deletarLeadKommo(lead.whatsapp).catch(() => {})

  return NextResponse.json({ mensagem: "Lead e dados relacionados removidos permanentemente" })
}
