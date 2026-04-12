import { NextResponse } from "next/server"
import { supabaseAdmin, agora } from "@/lib/supabase"
import { requireRole } from "@/lib/auth-helpers"
import { configurarWebhook } from "@/lib/uazapi"
import { z } from "zod"

const schema = z.object({
  configId: z.string().min(1),
})

export async function POST(req: Request) {
  const auth = await requireRole("gestor")
  if (auth.error) return auth.error

  const body = await req.json().catch(() => null)
  const parse = schema.safeParse(body)
  if (!parse.success) {
    return NextResponse.json({ error: "configId obrigatório" }, { status: 400 })
  }

  const { data: config, error: findError } = await supabaseAdmin
    .from("config_whatsapp")
    .select("*")
    .eq("id", parse.data.configId)
    .single()

  if (findError || !config) {
    return NextResponse.json({ error: "Instância não encontrada" }, { status: 404 })
  }

  if (!config.instanceToken) {
    return NextResponse.json(
      { error: "Instância sem token — conecte primeiro via QR Code" },
      { status: 400 }
    )
  }

  const baseUrl = (process.env.NEXTAUTH_URL || "http://localhost:3000").trim()
  const webhookUrl = `${baseUrl}/api/webhooks/whatsapp`

  try {
    const webhookToken = process.env.WEBHOOK_SECRET || process.env.API_SECRET || ""
    await configurarWebhook(config.uazapiUrl, config.instanceToken, webhookUrl, webhookToken)
    await supabaseAdmin
      .from("config_whatsapp")
      .update({ webhookUrl, atualizadoEm: agora() })
      .eq("id", config.id)

    return NextResponse.json({ sucesso: true, webhookUrl })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erro ao reconfigurar webhook" },
      { status: 500 }
    )
  }
}
