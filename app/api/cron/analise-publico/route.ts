import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { validarCronSecret } from "@/lib/cron-auth"
import {
  buscarConversasDoDiaAnterior,
  formatarConversasParaAnalise,
  gerarAnalise,
} from "@/lib/agente/analise-conversas"

const PROMPT_PUBLICO = `Voce e um analista de inteligencia comercial. Analise as conversas de pre-atendimento de uma empresa de paineis LED e gere um relatorio focado no PUBLICO que esta entrando em contato.

Estruture o relatorio em Markdown com as seguintes secoes:

## Resumo do Dia
Quantidade de conversas, leads novos, visao geral.

## Perfil dos Leads
Quem sao as pessoas/empresas que entraram em contato. Segmentos predominantes (fachada, eventos, indoor, varejo, etc).

## Principais Necessidades
O que os leads estao buscando. Tipos de projeto mais solicitados.

## Padroes de Comportamento
Horarios de contato, faixa de investimento mencionada, nivel de conhecimento tecnico.

## Objecoes Comuns
Principais barreiras ou duvidas que os leads apresentaram.

## Insights e Recomendacoes
Tendencias observadas e sugestoes para melhorar a captacao.

Seja direto, objetivo e use dados concretos das conversas. Responda em portugues brasileiro.`

export async function GET(request: NextRequest) {
  const erro = validarCronSecret(request)
  if (erro) return erro

  const { conversas, dataRef } = await buscarConversasDoDiaAnterior()

  if (conversas.length === 0) {
    return NextResponse.json({
      mensagem: "Nenhuma conversa no dia anterior",
      dataRef: dataRef.toISOString(),
    })
  }

  const texto = formatarConversasParaAnalise(conversas)
  const leadsUnicos = new Set(conversas.map((c) => c.lead.whatsapp))
  const analise = await gerarAnalise(PROMPT_PUBLICO, texto)

  await prisma.relatorioIA.create({
    data: {
      tipo: "publico",
      conteudo: analise,
      dataRef,
      conversas: conversas.length,
      leads: leadsUnicos.size,
    },
  })

  return NextResponse.json({
    tipo: "publico",
    conversas: conversas.length,
    leads: leadsUnicos.size,
    dataRef: dataRef.toISOString(),
    timestamp: new Date().toISOString(),
  })
}
