import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { createId } from "@paralleldrive/cuid2"
import { supabaseAdmin, gerarId } from "@/lib/supabase"
import { requireAuth } from "@/lib/auth-helpers"

type RouteParams = { params: Promise<{ id: string }> }

export async function GET(_request: NextRequest, { params }: RouteParams) {
  const auth = await requireAuth()
  if (auth.error) return auth.error

  const { id } = await params

  const { data: lead } = await supabaseAdmin
    .from("leads")
    .select("id")
    .eq("id", id)
    .is("deletadoEm", null)
    .single()

  if (!lead) {
    return NextResponse.json({ error: "Lead não encontrado" }, { status: 404 })
  }

  const { data: fotos } = await supabaseAdmin
    .from("fotos_lead")
    .select("*")
    .eq("leadId", id)
    .order("criadoEm", { ascending: false })

  return NextResponse.json({ dados: fotos || [] })
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  const auth = await requireAuth()
  if (auth.error) return auth.error

  const { id } = await params

  const { data: lead } = await supabaseAdmin
    .from("leads")
    .select("id")
    .eq("id", id)
    .is("deletadoEm", null)
    .single()

  if (!lead) {
    return NextResponse.json({ error: "Lead não encontrado" }, { status: 404 })
  }

  const formData = await request.formData()
  const arquivo = formData.get("arquivo") as File | null
  const descricao = formData.get("descricao") as string | null
  const tipoAnalise = formData.get("tipoAnalise") as string | null

  if (!arquivo) {
    return NextResponse.json({ error: "Arquivo é obrigatório" }, { status: 400 })
  }

  const tiposPermitidos = ["image/jpeg", "image/png", "image/webp"]
  if (!tiposPermitidos.includes(arquivo.type)) {
    return NextResponse.json(
      { error: "Tipo de arquivo não permitido. Use JPEG, PNG ou WebP" },
      { status: 400 }
    )
  }

  if (arquivo.size > 10 * 1024 * 1024) {
    return NextResponse.json(
      { error: "Arquivo muito grande. Máximo 10MB" },
      { status: 400 }
    )
  }

  const ext = arquivo.name.split(".").pop() || "jpg"
  const nomeArquivo = `${id}/${createId()}.${ext}`

  const buffer = Buffer.from(await arquivo.arrayBuffer())

  const { error: uploadError } = await supabaseAdmin.storage
    .from("fotos-leads")
    .upload(nomeArquivo, buffer, {
      contentType: arquivo.type,
    })

  if (uploadError) {
    return NextResponse.json(
      { error: "Erro ao fazer upload da foto" },
      { status: 500 }
    )
  }

  const { data: urlData } = supabaseAdmin.storage
    .from("fotos-leads")
    .getPublicUrl(nomeArquivo)

  const { data: foto, error } = await supabaseAdmin
    .from("fotos_lead")
    .insert({
      id: gerarId(),
      leadId: id,
      url: urlData.publicUrl,
      descricao,
      tipoAnalise,
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(foto, { status: 201 })
}
