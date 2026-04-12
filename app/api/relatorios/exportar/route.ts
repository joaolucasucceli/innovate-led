import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"
import { requireRole } from "@/lib/auth-helpers"

function escapeCsv(valor: unknown): string {
  if (valor === null || valor === undefined) return ""
  const str = String(valor)
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

function linhasCsv(cabecalho: string[], linhas: unknown[][]): string {
  const header = cabecalho.join(",")
  const rows = linhas.map((l) => l.map(escapeCsv).join(","))
  return [header, ...rows].join("\n")
}

export async function GET(request: NextRequest) {
  const auth = await requireRole("gestor")
  if (auth.error) return auth.error

  const { searchParams } = request.nextUrl
  const tipo = searchParams.get("tipo") as "leads" | "conversas" | null
  const formato = searchParams.get("formato") || "csv"
  const agora = new Date()
  const dataInicio = searchParams.get("dataInicio")
    ? new Date(searchParams.get("dataInicio")!)
    : undefined
  const dataFim = searchParams.get("dataFim")
    ? new Date(searchParams.get("dataFim")!)
    : agora

  if (!tipo || !["leads", "conversas"].includes(tipo)) {
    return NextResponse.json({ error: "tipo inválido" }, { status: 400 })
  }

  const dataStr = agora.toISOString().slice(0, 10)
  let conteudo: string
  let contentType: string

  if (tipo === "leads") {
    let query = supabaseAdmin
      .from("leads")
      .select("id, nome, whatsapp, origem, statusFunil, criadoEm, atualizadoEm")
      .is("deletadoEm", null)
      .order("criadoEm", { ascending: false })

    if (dataInicio) {
      query = query.gte("criadoEm", dataInicio.toISOString()).lte("criadoEm", dataFim.toISOString())
    }

    const { data: leads } = await query

    if (formato === "json") {
      conteudo = JSON.stringify(leads || [], null, 2)
      contentType = "application/json"
    } else {
      conteudo = linhasCsv(
        ["id", "nome", "whatsapp", "origem", "statusFunil", "criadoEm", "atualizadoEm"],
        (leads || []).map((l) => [l.id, l.nome, l.whatsapp, l.origem, l.statusFunil, l.criadoEm, l.atualizadoEm])
      )
      contentType = "text/csv"
    }
  } else {
    // conversas
    let query = supabaseAdmin
      .from("conversas")
      .select("id, leadId, atualizadoEm, encerradaEm")
      .order("atualizadoEm", { ascending: false })

    if (dataInicio) {
      query = query.gte("criadoEm", dataInicio.toISOString()).lte("criadoEm", dataFim.toISOString())
    }

    const { data: conversas } = await query

    // Buscar leads e contagem de mensagens
    const leadIds = [...new Set((conversas || []).map((c) => c.leadId))]
    let leadsMap: Record<string, { nome: string; whatsapp: string }> = {}
    if (leadIds.length > 0) {
      const { data: leads } = await supabaseAdmin
        .from("leads")
        .select("id, nome, whatsapp")
        .in("id", leadIds)
      if (leads) {
        leadsMap = Object.fromEntries(leads.map((l) => [l.id, { nome: l.nome, whatsapp: l.whatsapp }]))
      }
    }

    // Contar mensagens por conversa
    const conversaIds = (conversas || []).map((c) => c.id)
    let msgCountMap: Record<string, number> = {}
    if (conversaIds.length > 0) {
      const { data: msgs } = await supabaseAdmin
        .from("mensagens_whatsapp")
        .select("conversaId")
        .in("conversaId", conversaIds)
      if (msgs) {
        for (const m of msgs) {
          msgCountMap[m.conversaId] = (msgCountMap[m.conversaId] || 0) + 1
        }
      }
    }

    const conversasFormatadas = (conversas || []).map((c) => ({
      id: c.id,
      lead: leadsMap[c.leadId] || { nome: "", whatsapp: "" },
      _count: { mensagens: msgCountMap[c.id] || 0 },
      atualizadoEm: c.atualizadoEm,
      encerradaEm: c.encerradaEm,
    }))

    if (formato === "json") {
      conteudo = JSON.stringify(conversasFormatadas, null, 2)
      contentType = "application/json"
    } else {
      conteudo = linhasCsv(
        ["id", "leadNome", "leadWhatsapp", "totalMensagens", "ultimaMensagemEm", "encerradaEm"],
        conversasFormatadas.map((c) => [
          c.id,
          c.lead.nome,
          c.lead.whatsapp,
          c._count.mensagens,
          c.atualizadoEm,
          c.encerradaEm ?? "",
        ])
      )
      contentType = "text/csv"
    }
  }

  const ext = formato === "json" ? "json" : "csv"
  return new NextResponse(conteudo, {
    headers: {
      "Content-Type": contentType,
      "Content-Disposition": `attachment; filename="relatorio-${tipo}-${dataStr}.${ext}"`,
    },
  })
}
