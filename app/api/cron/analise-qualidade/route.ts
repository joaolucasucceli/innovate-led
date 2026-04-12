import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { supabaseAdmin, gerarId } from "@/lib/supabase"
import { validarCronSecret } from "@/lib/cron-auth"
import {
  buscarConversasDoDiaAnterior,
  formatarConversasParaAnalise,
  gerarAnalise,
} from "@/lib/agente/analise-conversas"

const PROMPT_QUALIDADE = `Voce e um auditor de qualidade de atendimento. Analise as conversas de pre-atendimento de uma empresa de paineis LED, onde a atendente "Livia" (uma IA) segue um script de qualificacao.

O script esperado da Livia tem 3 etapas:
1. ACOLHIMENTO: saudacao, perguntar nome
2. QUALIFICACAO: objetivo do painel, ambiente (indoor/outdoor), foto do local, distancia de visualizacao, tamanho, fixo/movel, prazo, faixa de investimento
3. ENCAMINHAMENTO: perguntar dia/horario para consultor ligar, salvar tudo, confirmar

Estruture o relatorio em Markdown com as seguintes secoes:

## Resumo do Dia
Quantidade de conversas analisadas, taxa de conclusao do fluxo.

## Aderencia ao Script
A Livia seguiu o roteiro corretamente? Pulou etapas? Fez perguntas fora de ordem?

## Pontos Positivos
O que a Livia fez bem. Momentos de destaque no atendimento.

## Pontos de Melhoria
Onde o atendimento falhou ou poderia ser melhor. Momentos de travamento ou confusao.

## Objecoes Nao Tratadas
Situacoes onde o lead levantou uma objecao e a Livia nao soube lidar.

## Fluidez da Conversa
A conversa foi natural? Houve demora excessiva? O lead pareceu satisfeito?

## Recomendacoes
Sugestoes concretas para melhorar o script ou o comportamento da Livia.

Seja critico, objetivo e construtivo. Use exemplos concretos das conversas. Responda em portugues brasileiro.`

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
  const analise = await gerarAnalise(PROMPT_QUALIDADE, texto)

  await supabaseAdmin
    .from("relatorios_ia")
    .insert({
      id: gerarId(),
      tipo: "qualidade",
      conteudo: analise,
      dataRef: dataRef.toISOString(),
      conversas: conversas.length,
      leads: leadsUnicos.size,
    })

  return NextResponse.json({
    tipo: "qualidade",
    conversas: conversas.length,
    leads: leadsUnicos.size,
    dataRef: dataRef.toISOString(),
    timestamp: new Date().toISOString(),
  })
}
