import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"
import { requireRole } from "@/lib/auth-helpers"

type RouteParams = { params: Promise<{ id: string; fotoId: string }> }

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const auth = await requireRole("gestor")
  if (auth.error) return auth.error

  const { id, fotoId } = await params

  const { data: foto } = await supabaseAdmin
    .from("fotos_lead")
    .select("*")
    .eq("id", fotoId)
    .eq("leadId", id)
    .limit(1)
    .single()

  if (!foto) {
    return NextResponse.json({ error: "Foto não encontrada" }, { status: 404 })
  }

  // Extrair path do Storage a partir da URL
  const urlParts = foto.url.split("/fotos-leads/")
  if (urlParts.length > 1) {
    const storagePath = urlParts[1]
    await supabaseAdmin.storage.from("fotos-leads").remove([storagePath])
  }

  await supabaseAdmin.from("fotos_lead").delete().eq("id", fotoId)

  return NextResponse.json({ mensagem: "Foto removida" })
}
