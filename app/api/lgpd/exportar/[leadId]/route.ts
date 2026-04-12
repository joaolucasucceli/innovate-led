import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"
import { requireRole } from "@/lib/auth-helpers"

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ leadId: string }> }
) {
  const auth = await requireRole("gestor")
  if (auth.error) return auth.error

  const { leadId } = await params

  const { data: lead, error: findError } = await supabaseAdmin
    .from("leads")
    .select("*")
    .eq("id", leadId)
    .single()

  if (findError || !lead) {
    return NextResponse.json({ error: "Lead não encontrado" }, { status: 404 })
  }

  // Buscar conversas com mensagens
  const { data: conversas } = await supabaseAdmin
    .from("conversas")
    .select("*")
    .eq("leadId", leadId)

  const conversasComMensagens = await Promise.all(
    (conversas || []).map(async (conversa) => {
      const { data: mensagens } = await supabaseAdmin
        .from("mensagens_whatsapp")
        .select("id, tipo, conteudo, remetente, criadoEm")
        .eq("conversaId", conversa.id)
      return {
        id: conversa.id,
        etapa: conversa.etapa,
        criadoEm: conversa.criadoEm,
        mensagens: mensagens || [],
      }
    })
  )

  // Buscar fotos
  const { data: fotos } = await supabaseAdmin
    .from("fotos_lead")
    .select("id, url, descricao, tipoAnalise, criadoEm")
    .eq("leadId", leadId)

  const payload = {
    exportadoEm: new Date().toISOString(),
    dadosPessoais: {
      id: lead.id,
      nome: lead.nome,
      whatsapp: lead.whatsapp,
      email: lead.email,
      origem: lead.origem,
      sobreOLead: lead.sobreOLead,
      consentimentoLgpd: lead.consentimentoLgpd,
      consentimentoLgpdEm: lead.consentimentoLgpdEm,
      criadoEm: lead.criadoEm,
    },
    conversas: conversasComMensagens,
    fotos: (fotos || []).map((f) => ({
      id: f.id,
      url: f.url,
      descricao: f.descricao,
      tipoAnalise: f.tipoAnalise,
      criadoEm: f.criadoEm,
    })),
  }

  return new NextResponse(JSON.stringify(payload, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="lead-${leadId}-dados.json"`,
    },
  })
}
