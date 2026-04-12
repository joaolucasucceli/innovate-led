import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { supabaseAdmin, gerarId, agora } from "@/lib/supabase"
import { requireRole } from "@/lib/auth-helpers"
import { configWhatsappSchema } from "@/lib/validations/whatsapp-config"
import { validarAdminToken } from "@/lib/uazapi"

export async function POST(request: NextRequest) {
  const auth = await requireRole("gestor")
  if (auth.error) return auth.error

  const body = await request.json()
  const parsed = configWhatsappSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Dados inválidos", detalhes: parsed.error.flatten() },
      { status: 400 }
    )
  }

  const { uazapiUrl, adminToken } = parsed.data

  // Validar admin token via GET /status
  const resultado = await validarAdminToken(uazapiUrl, adminToken)
  if (!resultado.ok) {
    console.error("[test-connection] Falha ao conectar ao Uazapi:", resultado.erro)
    return NextResponse.json(
      { error: "Não foi possível conectar ao Uazapi.", detalhe: resultado.erro },
      { status: 400 }
    )
  }

  // Upsert config — salvar credenciais admin
  const { data: existente } = await supabaseAdmin
    .from("config_whatsapp")
    .select("id")
    .order("criadoEm", { ascending: false })
    .limit(1)
    .maybeSingle()

  if (existente) {
    await supabaseAdmin
      .from("config_whatsapp")
      .update({ uazapiUrl, adminToken, atualizadoEm: agora() })
      .eq("id", existente.id)
  } else {
    await supabaseAdmin
      .from("config_whatsapp")
      .insert({ id: gerarId(), uazapiUrl, adminToken, instanceToken: "", atualizadoEm: agora() })
  }

  return NextResponse.json({ sucesso: true })
}
