import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { supabaseAdmin, gerarId, agora } from "@/lib/supabase"
import { validarApiSecret } from "@/lib/api-auth"
import type { TipoMensagem } from "@/types/database"

export async function POST(request: NextRequest) {
  const erro = validarApiSecret(request)
  if (erro) return erro

  let body: {
    conversaId?: string
    leadId?: string
    conteudo?: string
    direcao?: string
    tipo?: string
    messageIdWhatsapp?: string
  }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Payload inválido" }, { status: 400 })
  }

  const { leadId, conteudo, direcao, tipo, messageIdWhatsapp } = body
  let { conversaId } = body

  if (!leadId || !conteudo || !direcao) {
    return NextResponse.json(
      { error: "leadId, conteudo e direcao são obrigatórios" },
      { status: 400 }
    )
  }

  // Se não há conversaId, buscar conversa existente antes de criar nova
  if (!conversaId) {
    const { data: conversaExistente } = await supabaseAdmin
      .from("conversas")
      .select("*")
      .eq("leadId", leadId)
      .order("criadoEm", { ascending: false })
      .limit(1)
      .maybeSingle()

    if (conversaExistente) {
      conversaId = conversaExistente.id
    } else {
      const { data: novaConversa, error: erroCriar } = await supabaseAdmin
        .from("conversas")
        .insert({
          id: gerarId(),
          leadId,
          atualizadoEm: agora(),
        })
        .select()
        .single()

      if (erroCriar) {
        return NextResponse.json({ error: erroCriar.message }, { status: 500 })
      }

      conversaId = novaConversa.id
    }
  }

  const { data: mensagem, error: erroMsg } = await supabaseAdmin
    .from("mensagens_whatsapp")
    .insert({
      id: gerarId(),
      conversaId,
      leadId,
      messageIdWhatsapp: messageIdWhatsapp || `agente_${gerarId()}`,
      tipo: (tipo || "texto") as TipoMensagem,
      conteudo,
      remetente: direcao === "agente" ? "agente" : "cliente",
    })
    .select()
    .single()

  if (erroMsg) {
    return NextResponse.json({ error: erroMsg.message }, { status: 500 })
  }

  // Atualizar ultimaMensagemEm na conversa
  await supabaseAdmin
    .from("conversas")
    .update({
      ultimaMensagemEm: agora(),
      atualizadoEm: agora(),
    })
    .eq("id", conversaId)

  return NextResponse.json({ mensagem, conversaId })
}
