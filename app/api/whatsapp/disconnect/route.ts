import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { supabaseAdmin, agora } from "@/lib/supabase"
import { requireRole } from "@/lib/auth-helpers"
import { desconectar } from "@/lib/uazapi"

export async function POST(request: NextRequest) {
  const auth = await requireRole("gestor")
  if (auth.error) return auth.error

  const { data: config } = await supabaseAdmin
    .from("config_whatsapp")
    .select("*")
    .order("criadoEm", { ascending: false })
    .limit(1)
    .single()

  const instanceToken = config?.instanceToken || config?.adminToken

  if (!config || !instanceToken) {
    return NextResponse.json(
      { error: "Nenhuma instância ativa" },
      { status: 404 }
    )
  }

  try {
    // DELETE /instance desconecta e remove a instância no Uazapi v2
    await desconectar(config.uazapiUrl, instanceToken).catch(() => {})
  } catch {
    // Ignorar erros do Uazapi — limpar config local mesmo assim
  }

  // Limpar dados de instância
  await supabaseAdmin
    .from("config_whatsapp")
    .update({
      instanceId: null,
      instanceToken: null,
      numeroWhatsapp: null,
      webhookUrl: null,
      ativo: false,
      atualizadoEm: agora(),
    })
    .eq("id", config.id)

  return NextResponse.json({ sucesso: true })
}
