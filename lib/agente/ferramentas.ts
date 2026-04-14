import type { ChatCompletionTool } from "openai/resources/chat/completions"

/** Definição das 3 ferramentas do agente no formato OpenAI function calling */
export const ferramentasAgente: ChatCompletionTool[] = [
  {
    type: "function",
    function: {
      name: "salvar_qualificacao",
      description:
        "Salva informações de qualificação do lead no CRM. Use sempre que coletar informações novas sobre o contato. O campo sobreOLead é cumulativo (nunca sobrescrito). Também atualiza o nome do lead se informado via nomeLead.",
      parameters: {
        type: "object",
        properties: {
          leadId: {
            type: "string",
            description: "ID do lead/contato",
          },
          conversaId: {
            type: "string",
            description: "ID da conversa ativa",
          },
          sobreOLead: {
            type: "string",
            description: "Informações coletadas sobre o lead (será adicionado ao histórico, nunca sobrescrito). Formato: 'Objetivo: X | Ambiente: Y | Distância: Z | Tamanho: W | Tipo: fixo/móvel | Prazo: P | Investimento: I | Foto: sim/não'",
          },
          nomeLead: {
            type: "string",
            description: "Nome real do contato, informado por ele na conversa. Atualiza o nome do lead se o atual é genérico.",
          },
        },
        required: ["leadId", "conversaId", "sobreOLead"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "encaminhar_contato",
      description:
        "Move o lead para a etapa 'encaminhado' no funil do CRM. Usar quando a qualificação for SUFICIENTE (não precisa ser completa) e o lead demonstrar interesse. SEMPRE chamar junto com criar_tarefa. Gatilhos: lead pediu preço 2x, lead deu orçamento, lead confirmou horário, lead demonstrou impaciência com perguntas.",
      parameters: {
        type: "object",
        properties: {
          leadId: {
            type: "string",
            description: "ID do lead/contato",
          },
          conversaId: {
            type: "string",
            description: "ID da conversa ativa",
          },
        },
        required: ["leadId", "conversaId"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "criar_tarefa",
      description:
        "Cria uma tarefa de ligação para o consultor comercial entrar em contato com o cliente. Usar JUNTO com encaminhar_contato na mesma resposta. Se o lead não informou horário específico, use 'O mais breve possível' como dataHora.",
      parameters: {
        type: "object",
        properties: {
          leadId: {
            type: "string",
            description: "ID do lead/contato",
          },
          conversaId: {
            type: "string",
            description: "ID da conversa ativa",
          },
          dataHora: {
            type: "string",
            description: "Dia e horário de preferência do cliente para receber a ligação (ex: 'Hoje às 16h', 'Segunda às 10h', 'Amanhã de manhã')",
          },
          resumo: {
            type: "string",
            description: "Resumo completo da qualificação. Formato: 'Nome: X | Objetivo: Y | Ambiente: Z | Distância: W | Tamanho: T | Tipo: fixo/móvel | Prazo: P | Investimento: I | Foto: sim/não'",
          },
        },
        required: ["leadId", "conversaId", "dataHora", "resumo"],
      },
    },
  },
]

/** Executa uma ferramenta do agente via fetch interno */
export async function executarFerramenta(
  nome: string,
  args: Record<string, unknown>,
  baseUrl: string
): Promise<string> {
  const nomeRota = nome.replace(/_/g, "-")
  const url = `${baseUrl}/api/agente/${nomeRota}`

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-secret": process.env.API_SECRET || "",
      },
      body: JSON.stringify(args),
    })

    const data = await res.json()

    if (!res.ok) {
      return JSON.stringify({ erro: data.error || `Erro ${res.status}` })
    }

    return JSON.stringify(data)
  } catch (error) {
    return JSON.stringify({
      erro: error instanceof Error ? error.message : "Erro ao executar ferramenta",
    })
  }
}
