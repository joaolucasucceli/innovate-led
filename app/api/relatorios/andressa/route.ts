import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireRole } from "@/lib/auth-helpers"

export async function GET(request: NextRequest) {
  const auth = await requireRole("gestor")
  if (auth.error) return auth.error

  const { searchParams } = request.nextUrl
  const agora = new Date()
  const dataInicio = searchParams.get("dataInicio")
    ? new Date(searchParams.get("dataInicio")!)
    : new Date(agora.getTime() - 7 * 24 * 60 * 60 * 1000)
  const dataFim = searchParams.get("dataFim")
    ? new Date(searchParams.get("dataFim")!)
    : agora

  // Ajustar dataFim para incluir o dia inteiro
  const dataFimDia = new Date(dataFim)
  dataFimDia.setHours(23, 59, 59, 999)

  const filtroPeriodo = { criadoEm: { gte: dataInicio, lte: dataFimDia } }

  // Buscar usuário IA (Lívia)
  const livia = await prisma.usuario.findFirst({
    where: { tipo: "ia", deletadoEm: null },
    select: { id: true },
  })

  const [
    totalMensagens,
    enviadas,
    recebidas,
    totalConversas,
    conversasAtivas,
    conversasEncerradas,
  ] = await Promise.all([
    prisma.mensagemWhatsapp.count({ where: filtroPeriodo }),
    prisma.mensagemWhatsapp.count({ where: { ...filtroPeriodo, remetente: "agente" } }),
    prisma.mensagemWhatsapp.count({ where: { ...filtroPeriodo, remetente: "paciente" } }),
    prisma.conversa.count({ where: filtroPeriodo }),
    prisma.conversa.count({ where: { ...filtroPeriodo, encerradaEm: null } }),
    prisma.conversa.count({ where: { ...filtroPeriodo, encerradaEm: { not: null } } }),
  ])

  // Funil — leads gerenciados pela Lívia no período
  let funil = { leadsRecebidos: 0, qualificados: 0, encaminhados: 0, vendidos: 0 }
  if (livia) {
    const leadsIA = await prisma.lead.findMany({
      where: {
        responsavelId: livia.id,
        criadoEm: { gte: dataInicio, lte: dataFimDia },
        deletadoEm: null,
      },
      select: { statusFunil: true },
    })

    const etapasEncaminhado = new Set([
      "encaminhado",
      "tarefa_criada",
      "em_negociacao",
      "venda_realizada",
    ])
    const etapasTarefaCriada = new Set([
      "tarefa_criada",
      "em_negociacao",
      "venda_realizada",
    ])
    const etapasVendido = new Set([
      "venda_realizada",
    ])

    funil = {
      leadsRecebidos: leadsIA.length,
      qualificados: leadsIA.filter((l) => etapasEncaminhado.has(l.statusFunil)).length,
      encaminhados: leadsIA.filter((l) => etapasTarefaCriada.has(l.statusFunil)).length,
      vendidos: leadsIA.filter((l) => etapasVendido.has(l.statusFunil)).length,
    }
  }

  // Follow-ups enviados — contagem por tipo
  const conversasPeriodo = await prisma.conversa.findMany({
    where: { atualizadoEm: { gte: dataInicio, lte: dataFimDia } },
    select: { followUpEnviados: true },
  })

  let f1h = 0, f6h = 0, f24h = 0
  for (const c of conversasPeriodo) {
    if (c.followUpEnviados.includes("1h")) f1h++
    if (c.followUpEnviados.includes("6h")) f6h++
    if (c.followUpEnviados.includes("24h")) f24h++
  }

  // Atividade por dia (mensagens agrupadas por data)
  type AtividadeDiaRaw = { data: Date; enviadas: bigint; recebidas: bigint }
  const atividadeRaw = await prisma.$queryRaw<AtividadeDiaRaw[]>`
    SELECT
      DATE_TRUNC('day', "criadoEm" AT TIME ZONE 'America/Sao_Paulo') AS data,
      COUNT(*) FILTER (WHERE remetente = 'agente') AS enviadas,
      COUNT(*) FILTER (WHERE remetente = 'paciente') AS recebidas
    FROM mensagens_whatsapp
    WHERE "criadoEm" >= ${dataInicio} AND "criadoEm" <= ${dataFimDia}
    GROUP BY 1
    ORDER BY 1 ASC
  `

  const atividadePorDia = atividadeRaw.map((row) => ({
    data: row.data.toISOString().slice(0, 10),
    enviadas: Number(row.enviadas),
    recebidas: Number(row.recebidas),
  }))

  return NextResponse.json({
    periodo: { inicio: dataInicio.toISOString(), fim: dataFimDia.toISOString() },
    mensagens: { total: totalMensagens, enviadas, recebidas },
    conversas: { total: totalConversas, ativas: conversasAtivas, encerradas: conversasEncerradas },
    funil,
    followUps: { f1h, f6h, f24h },
    atividadePorDia,
  })
}
