import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { hash } from "bcryptjs"
import { supabaseAdmin, gerarId, agora } from "@/lib/supabase"
import { requireRole } from "@/lib/auth-helpers"
import { criarUsuarioSchema } from "@/lib/validations/usuario"

export async function GET(request: NextRequest) {
  const auth = await requireRole("gestor")
  if (auth.error) return auth.error

  const { searchParams } = request.nextUrl
  const pagina = Number(searchParams.get("pagina") || "1")
  const porPagina = Number(searchParams.get("porPagina") || "10")
  const perfil = searchParams.get("perfil")
  const ativo = searchParams.get("ativo")
  const busca = searchParams.get("busca")

  let query = supabaseAdmin
    .from("usuarios")
    .select("id, nome, email, perfil, tipo, ativo, criadoEm", { count: "exact" })
    .is("deletadoEm", null)
    .order("criadoEm", { ascending: false })
    .range((pagina - 1) * porPagina, pagina * porPagina - 1)

  if (perfil) query = query.eq("perfil", perfil)
  if (ativo !== null && ativo !== undefined && ativo !== "") {
    query = query.eq("ativo", ativo === "true")
  }
  if (busca) {
    query = query.or(`nome.ilike.%${busca}%,email.ilike.%${busca}%`)
  }

  const { data: dados, count, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ dados: dados || [], total: count ?? 0, pagina, porPagina })
}

export async function POST(request: NextRequest) {
  const auth = await requireRole("gestor")
  if (auth.error) return auth.error

  const body = await request.json()
  const parsed = criarUsuarioSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Dados inválidos", detalhes: parsed.error.flatten() },
      { status: 400 }
    )
  }

  const { nome, email, senha, perfil, tipo } = parsed.data

  const { data: existente } = await supabaseAdmin
    .from("usuarios")
    .select("id")
    .eq("email", email)
    .limit(1)
    .maybeSingle()

  if (existente) {
    return NextResponse.json(
      { error: "Email já cadastrado" },
      { status: 409 }
    )
  }

  const senhaHash = await hash(senha, 12)

  const { data: usuario, error } = await supabaseAdmin
    .from("usuarios")
    .insert({ id: gerarId(), nome, email, senha: senhaHash, perfil, tipo, atualizadoEm: agora() })
    .select("id, nome, email, perfil, tipo, ativo, criadoEm")
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(usuario, { status: 201 })
}
