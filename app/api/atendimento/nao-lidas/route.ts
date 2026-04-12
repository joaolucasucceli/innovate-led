import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"
import { requireAuth } from "@/lib/auth-helpers"

export async function GET() {
  const auth = await requireAuth()
  if (auth.error) return auth.error

  // Contar conversas abertas com mensagens não lidas de pacientes
  // Precisamos buscar conversas abertas e depois verificar mensagens não lidas
  const { data: conversasAbertas } = await supabaseAdmin
    .from("conversas")
    .select("id, lead:leads!inner(deletadoEm)")
    .is("encerradaEm", null)
    .is("lead.deletadoEm", null)

  if (!conversasAbertas || conversasAbertas.length === 0) {
    return NextResponse.json({ total: 0 })
  }

  const conversaIds = conversasAbertas.map((c: any) => c.id)

  // Contar conversas que têm pelo menos 1 mensagem não lida de paciente
  let total = 0
  for (const conversaId of conversaIds) {
    const { count } = await supabaseAdmin
      .from("mensagens_whatsapp")
      .select("*", { count: "exact", head: true })
      .eq("conversaId", conversaId)
      .eq("remetente", "paciente")
      .is("lidaEm", null)

    if (count && count > 0) total++
  }

  return NextResponse.json({ total })
}
