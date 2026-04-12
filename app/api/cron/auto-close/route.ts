import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { supabaseAdmin, agora } from "@/lib/supabase"
import { validarCronSecret } from "@/lib/cron-auth"

export async function GET(request: NextRequest) {
  const erro = validarCronSecret(request)
  if (erro) return erro

  const ha24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

  // Buscar conversas com 24h+ de silêncio, follow-up "24h" já enviado, ainda abertas
  const { data: conversas } = await supabaseAdmin
    .from("conversas")
    .select("id")
    .is("encerradaEm", null)
    .not("ultimaMensagemEm", "is", null)
    .lt("ultimaMensagemEm", ha24h)
    .contains("followUpEnviados", ["24h"])

  let encerradas = 0

  for (const conversa of conversas || []) {
    try {
      await supabaseAdmin
        .from("conversas")
        .update({ encerradaEm: agora(), atualizadoEm: agora() })
        .eq("id", conversa.id)
      encerradas++
    } catch (error) {
      console.error(`[Cron Auto-close] Erro ao encerrar conversa ${conversa.id}:`, error)
    }
  }

  return NextResponse.json({ encerradas, timestamp: new Date().toISOString() })
}
