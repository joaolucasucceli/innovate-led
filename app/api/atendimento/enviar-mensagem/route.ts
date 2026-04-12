import { NextResponse } from "next/server"
import { supabaseAdmin, gerarId, agora } from "@/lib/supabase"
import { requireAuth } from "@/lib/auth-helpers"
import { enviarMensagem } from "@/lib/uazapi"
import { z } from "zod"
import { randomUUID } from "crypto"

const schema = z.object({
  conversaId: z.string().min(1),
  texto: z.string().min(1),
  replyToId: z.string().optional(),
})

export async function POST(req: Request) {
  const auth = await requireAuth()
  if (auth.error) return auth.error

  const body = await req.json().catch(() => null)
  const parse = schema.safeParse(body)
  if (!parse.success) {
    return NextResponse.json(
      { error: "Dados inválidos", detalhes: parse.error.flatten() },
      { status: 400 }
    )
  }

  const { conversaId, texto, replyToId } = parse.data

  // Buscar conversa com lead
  const { data: conversa } = await supabaseAdmin
    .from("conversas")
    .select("*, lead:leads(*)")
    .eq("id", conversaId)
    .single()

  if (!conversa) {
    return NextResponse.json({ error: "Conversa não encontrada" }, { status: 404 })
  }

  const { data: config } = await supabaseAdmin
    .from("config_whatsapp")
    .select("*")
    .eq("ativo", true)
    .limit(1)
    .maybeSingle()
  if (!config?.instanceToken || !config?.uazapiUrl) {
    return NextResponse.json({ error: "WhatsApp não configurado" }, { status: 400 })
  }

  // Buscar messageIdWhatsapp do reply se fornecido
  let replyMessageId: string | undefined
  if (replyToId) {
    const { data: replyMsg } = await supabaseAdmin
      .from("mensagens_whatsapp")
      .select("messageIdWhatsapp")
      .eq("id", replyToId)
      .single()
    if (replyMsg) replyMessageId = replyMsg.messageIdWhatsapp
  }

  // Enviar via Uazapi
  const numero = conversa.lead.whatsapp
  const chatId = `${numero}@s.whatsapp.net`
  await enviarMensagem(config.uazapiUrl, config.instanceToken, chatId, texto, replyMessageId)

  // Salvar no banco
  const { data: mensagem } = await supabaseAdmin
    .from("mensagens_whatsapp")
    .insert({
      id: gerarId(),
      conversaId,
      leadId: conversa.leadId,
      messageIdWhatsapp: `atendente_${randomUUID()}`,
      tipo: "texto",
      conteudo: texto,
      remetente: "atendente",
      replyToId: replyToId || null,
      criadoEm: agora(),
    })
    .select()
    .single()

  // Atualizar ultimaMensagemEm da conversa
  await supabaseAdmin
    .from("conversas")
    .update({ ultimaMensagemEm: agora(), atualizadoEm: agora() })
    .eq("id", conversaId)

  return NextResponse.json(mensagem, { status: 201 })
}
