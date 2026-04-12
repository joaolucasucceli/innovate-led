import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { hash } from "bcryptjs"
import { supabaseAdmin, agora } from "@/lib/supabase"
import { requireAuth, requireRole } from "@/lib/auth-helpers"
import { atualizarUsuarioSchema } from "@/lib/validations/usuario"

type RouteParams = { params: Promise<{ id: string }> }

export async function GET(_request: NextRequest, { params }: RouteParams) {
  const auth = await requireAuth()
  if (auth.error) return auth.error

  const { id } = await params

  const { data: usuario, error } = await supabaseAdmin
    .from("usuarios")
    .select("id, nome, email, perfil, tipo, ativo, criadoEm, atualizadoEm")
    .eq("id", id)
    .is("deletadoEm", null)
    .single()

  if (error || !usuario) {
    return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 })
  }

  return NextResponse.json(usuario)
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const auth = await requireRole("gestor")
  if (auth.error) return auth.error

  const { id } = await params
  const body = await request.json()
  const parsed = atualizarUsuarioSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Dados inválidos", detalhes: parsed.error.flatten() },
      { status: 400 }
    )
  }

  const { data: usuarioAtual, error: findError } = await supabaseAdmin
    .from("usuarios")
    .select("*")
    .eq("id", id)
    .is("deletadoEm", null)
    .single()

  if (findError || !usuarioAtual) {
    return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 })
  }

  const dados: Record<string, unknown> = { ...parsed.data }

  // Se email mudou, verificar unicidade
  if (dados.email && dados.email !== usuarioAtual.email) {
    const { data: emailExistente } = await supabaseAdmin
      .from("usuarios")
      .select("id")
      .eq("email", dados.email as string)
      .limit(1)
      .maybeSingle()
    if (emailExistente) {
      return NextResponse.json({ error: "Email já cadastrado" }, { status: 409 })
    }
  }

  // Se senha foi enviada, hashear
  if (dados.senha) {
    dados.senha = await hash(dados.senha as string, 12)
  }

  const { data: usuarioAtualizado, error: updateError } = await supabaseAdmin
    .from("usuarios")
    .update({ ...dados, atualizadoEm: agora() })
    .eq("id", id)
    .select("id, nome, email, perfil, tipo, ativo, criadoEm, atualizadoEm")
    .single()

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 })
  }

  return NextResponse.json(usuarioAtualizado)
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const auth = await requireRole("gestor")
  if (auth.error) return auth.error

  const { id } = await params

  const { data: usuario, error: findError } = await supabaseAdmin
    .from("usuarios")
    .select("*")
    .eq("id", id)
    .is("deletadoEm", null)
    .single()

  if (findError || !usuario) {
    return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 })
  }

  // Não permitir deletar o usuário IA
  if (usuario.tipo === "ia") {
    return NextResponse.json(
      { error: "Não é possível remover o usuário IA" },
      { status: 403 }
    )
  }

  await supabaseAdmin
    .from("usuarios")
    .update({
      deletadoEm: agora(),
      ativo: false,
      atualizadoEm: agora(),
    })
    .eq("id", id)

  return NextResponse.json({ mensagem: "Usuário removido" })
}
