import { NextResponse } from "next/server"
import { supabaseAdmin, agora } from "@/lib/supabase"
import { requireAuth } from "@/lib/auth-helpers"
import { z } from "zod"

const schema = z.object({
  conversaId: z.string().min(1),
})

export async function POST(req: Request) {
  const auth = await requireAuth()
  if (auth.error) return auth.error

  const body = await req.json().catch(() => null)
  const parse = schema.safeParse(body)
  if (!parse.success) {
    return NextResponse.json({ error: "conversaId obrigatório" }, { status: 400 })
  }

  const { data: conversa } = await supabaseAdmin
    .from("conversas")
    .select("*")
    .eq("id", parse.data.conversaId)
    .single()

  if (!conversa) {
    return NextResponse.json({ error: "Conversa não encontrada" }, { status: 404 })
  }

  if (conversa.modoConversa === "ia") {
    return NextResponse.json({ error: "Conversa já está em modo IA" }, { status: 400 })
  }

  const { data: usuarioIa } = await supabaseAdmin
    .from("usuarios")
    .select("id")
    .eq("tipo", "ia")
    .eq("ativo", true)
    .is("deletadoEm", null)
    .limit(1)
    .maybeSingle()

  // Transaction: atualizar conversa + lead sequencialmente
  await supabaseAdmin
    .from("conversas")
    .update({
      modoConversa: "ia",
      atendenteId: null,
      atualizadoEm: agora(),
    })
    .eq("id", conversa.id)

  await supabaseAdmin
    .from("leads")
    .update({
      responsavelId: usuarioIa?.id || null,
      atualizadoEm: agora(),
    })
    .eq("id", conversa.leadId)

  return NextResponse.json({ sucesso: true, modoConversa: "ia" })
}
