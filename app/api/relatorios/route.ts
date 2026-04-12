import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"
import { requireAuth } from "@/lib/auth-helpers"

export async function GET(request: NextRequest) {
  const auth = await requireAuth()
  if (auth.error) return auth.error

  const tipo = request.nextUrl.searchParams.get("tipo") || undefined
  const limite = Math.min(
    Number(request.nextUrl.searchParams.get("limite")) || 30,
    100
  )

  let query = supabaseAdmin
    .from("relatorios_ia")
    .select("*")
    .order("dataRef", { ascending: false })
    .limit(limite)

  if (tipo) {
    query = query.eq("tipo", tipo)
  }

  const { data: relatorios, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(relatorios || [])
}
