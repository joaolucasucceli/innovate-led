import { createHash } from "crypto"
import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin, agora } from "@/lib/supabase"
import { requireRole } from "@/lib/auth-helpers"

export async function POST(
  req: NextRequest,
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

  if (lead.deletadoEm) {
    return NextResponse.json({ error: "Lead já anonimizado" }, { status: 409 })
  }

  const whatsappHash = createHash("sha256").update(lead.whatsapp).digest("hex")

  // Sequential calls (replacing $transaction)
  await supabaseAdmin
    .from("leads")
    .update({
      nome: "Usuário Anonimizado",
      whatsapp: whatsappHash,
      email: null,
      sobreOLead: null,
      deletadoEm: agora(),
      atualizadoEm: agora(),
    })
    .eq("id", leadId)

  await supabaseAdmin
    .from("mensagens_whatsapp")
    .delete()
    .eq("leadId", leadId)

  return NextResponse.json({ ok: true })
}
