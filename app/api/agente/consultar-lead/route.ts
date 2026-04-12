import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { supabaseAdmin, gerarId, agora } from "@/lib/supabase"
import { validarApiSecret } from "@/lib/api-auth"

export async function POST(request: NextRequest) {
  const erro = validarApiSecret(request)
  if (erro) return erro

  let body: { whatsapp?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Payload inválido" }, { status: 400 })
  }

  const { whatsapp } = body
  if (!whatsapp) {
    return NextResponse.json({ error: "whatsapp é obrigatório" }, { status: 400 })
  }

  // Buscar lead existente
  const { data: leadExistente } = await supabaseAdmin
    .from("leads")
    .select("*")
    .eq("whatsapp", whatsapp)
    .maybeSingle()

  let lead = leadExistente

  // Se não existe, criar novo lead com responsável IA
  if (!lead) {
    const { data: usuarioIa } = await supabaseAdmin
      .from("usuarios")
      .select("*")
      .eq("tipo", "ia")
      .eq("ativo", true)
      .is("deletadoEm", null)
      .limit(1)
      .maybeSingle()

    const { data: novoLead, error: erroCriar } = await supabaseAdmin
      .from("leads")
      .insert({
        id: gerarId(),
        nome: `WhatsApp ${whatsapp}`,
        whatsapp,
        origem: "whatsapp",
        statusFunil: "qualificacao",
        responsavelId: usuarioIa?.id || null,
        atualizadoEm: agora(),
      })
      .select()
      .single()

    if (erroCriar) {
      return NextResponse.json({ error: erroCriar.message }, { status: 500 })
    }

    lead = novoLead
  }

  // Buscar conversa ativa do ciclo atual (mais recente)
  const { data: conversa } = await supabaseAdmin
    .from("conversas")
    .select("*")
    .eq("leadId", lead.id)
    .eq("ciclo", lead.cicloAtual)
    .order("criadoEm", { ascending: false })
    .limit(1)
    .maybeSingle()

  return NextResponse.json({
    lead: {
      id: lead.id,
      nome: lead.nome,
      whatsapp: lead.whatsapp,
      statusFunil: lead.statusFunil,
      origem: lead.origem,
      ehRetorno: lead.ehRetorno,
      cicloAtual: lead.cicloAtual,
      ciclosCompletos: lead.ciclosCompletos,
    },
    conversa: conversa
      ? { id: conversa.id, etapa: conversa.etapa }
      : null,
    sobreOLead: lead.sobreOLead || null,
  })
}
