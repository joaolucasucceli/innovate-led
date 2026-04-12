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

  await supabaseAdmin
    .from("mensagens_whatsapp")
    .update({ lidaEm: agora() })
    .eq("conversaId", parse.data.conversaId)
    .eq("remetente", "paciente")
    .is("lidaEm", null)

  return NextResponse.json({ sucesso: true })
}
