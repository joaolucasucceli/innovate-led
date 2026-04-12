import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { supabaseAdmin, gerarId, agora } from "@/lib/supabase"
import { requireAuth, requireAnyRole } from "@/lib/auth-helpers"
import { criarLeadSchema } from "@/lib/validations/lead"

export async function GET(request: NextRequest) {
  const auth = await requireAuth()
  if (auth.error) return auth.error

  const { searchParams } = request.nextUrl
  const pagina = Number(searchParams.get("pagina") || "1")
  const porPagina = Number(searchParams.get("porPagina") || "10")
  const statusFunil = searchParams.get("statusFunil")
  const responsavelId = searchParams.get("responsavelId")
  const origem = searchParams.get("origem")
  const arquivado = searchParams.get("arquivado")
  const busca = searchParams.get("busca")
  const alerta = searchParams.get("alerta") === "true"
  const followup = searchParams.get("followup") === "true"

  let query = supabaseAdmin
    .from("leads")
    .select("id, nome, whatsapp, statusFunil, origem, arquivado, criadoEm, responsavelId", { count: "exact" })
    .is("deletadoEm", null)
    .eq("arquivado", arquivado === "true")
    .order("criadoEm", { ascending: false })
    .range((pagina - 1) * porPagina, pagina * porPagina - 1)

  if (statusFunil && !alerta) query = query.eq("statusFunil", statusFunil)
  if (responsavelId) query = query.eq("responsavelId", responsavelId)
  if (origem) query = query.eq("origem", origem)
  if (busca) {
    query = query.or(`nome.ilike.%${busca}%,whatsapp.ilike.%${busca}%`)
  }
  if (alerta) {
    const ha3dias = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
    query = query
      .neq("statusFunil", "encaminhado")
      .or(`ultimaMovimentacaoEm.lt.${ha3dias},ultimaMovimentacaoEm.is.null`)
  }

  const { data: leadsRaw, count, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Buscar responsáveis para os leads retornados
  const responsavelIds = [...new Set((leadsRaw || []).map((l) => l.responsavelId).filter(Boolean))]
  let responsaveisMap: Record<string, { id: string; nome: string }> = {}
  if (responsavelIds.length > 0) {
    const { data: responsaveis } = await supabaseAdmin
      .from("usuarios")
      .select("id, nome")
      .in("id", responsavelIds)
    if (responsaveis) {
      responsaveisMap = Object.fromEntries(responsaveis.map((r) => [r.id, r]))
    }
  }

  let dados = (leadsRaw || []).map(({ responsavelId: rId, ...rest }) => ({
    ...rest,
    responsavel: rId ? responsaveisMap[rId] || null : null,
  }))

  // Filtro follow-up: precisa de join com conversas — filtrar após query
  if (followup) {
    const leadIds = dados.map((d) => d.id)
    if (leadIds.length > 0) {
      const { data: conversasFollowUp } = await supabaseAdmin
        .from("conversas")
        .select("leadId, followUpEnviados")
        .in("leadId", leadIds)
        .is("encerradaEm", null)
      const leadsComFollowUp = new Set(
        (conversasFollowUp || [])
          .filter((c) => c.followUpEnviados && c.followUpEnviados.length > 0)
          .map((c) => c.leadId)
      )
      dados = dados.filter((d) => leadsComFollowUp.has(d.id))
    }
  }

  return NextResponse.json({ dados, total: count ?? 0, pagina, porPagina })
}

export async function POST(request: NextRequest) {
  const auth = await requireAnyRole(["gestor", "atendente"])
  if (auth.error) return auth.error

  const body = await request.json()
  const parsed = criarLeadSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Dados inválidos", detalhes: parsed.error.flatten() },
      { status: 400 }
    )
  }

  const { whatsapp } = parsed.data

  const { data: existente } = await supabaseAdmin
    .from("leads")
    .select("id")
    .eq("whatsapp", whatsapp)
    .limit(1)
    .maybeSingle()

  if (existente) {
    return NextResponse.json(
      { error: "WhatsApp já cadastrado" },
      { status: 409 }
    )
  }

  const { data: lead, error } = await supabaseAdmin
    .from("leads")
    .insert({ id: gerarId(), ...parsed.data, atualizadoEm: agora() })
    .select("id, nome, whatsapp, statusFunil, origem, criadoEm")
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(lead, { status: 201 })
}
