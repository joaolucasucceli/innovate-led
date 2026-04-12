import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"
import { requireAuth } from "@/lib/auth-helpers"

export async function GET() {
  const { error } = await requireAuth()
  if (error) return error

  const ha3dias = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()

  // Buscar leads em alerta: não encaminhados, com mais de 3 dias sem movimentação
  const { data: leads, count } = await supabaseAdmin
    .from("leads")
    .select("id, nome, statusFunil, ultimaMovimentacaoEm, atualizadoEm", { count: "exact" })
    .is("deletadoEm", null)
    .eq("arquivado", false)
    .neq("statusFunil", "encaminhado")
    .or(`ultimaMovimentacaoEm.lt.${ha3dias},ultimaMovimentacaoEm.is.null`)
    .order("atualizadoEm", { ascending: true })
    .limit(5)

  return NextResponse.json({ leads: leads || [], total: count ?? 0 })
}
