/**
 * Integração direta com Kommo CRM
 * https://innovate.kommo.com
 */

const KOMMO_URL = "https://innovate.kommo.com"
const PIPELINE_ID = 12989364
const STATUS_PRE_ATENDIMENTO = 100157352
const STATUS_ENCAMINHADO = 100157356

function getToken(): string | null {
  return process.env.KOMMO_API_TOKEN || null
}

async function kommoFetch(path: string, options: RequestInit = {}): Promise<Response> {
  const token = getToken()
  if (!token) throw new Error("KOMMO_API_TOKEN não configurado")

  return fetch(`${KOMMO_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  })
}

/** Busca contato no Kommo por telefone */
async function buscarContatoPorTelefone(whatsapp: string): Promise<{ id: number; leadId?: number } | null> {
  try {
    const res = await kommoFetch(`/api/v4/contacts?query=${whatsapp}`)
    if (!res.ok) return null

    const data = await res.json()
    const contato = data?._embedded?.contacts?.[0]
    if (!contato) return null

    // Buscar lead vinculado ao contato
    const leadId = contato._embedded?.leads?.[0]?.id
    return { id: contato.id, leadId }
  } catch (err) {
    console.error("[Kommo] Erro ao buscar contato:", err)
    return null
  }
}

/** Cria lead + contato no Kommo (status Pré-atendimento IA) */
export async function criarLeadKommo(nome: string, whatsapp: string): Promise<void> {
  try {
    const token = getToken()
    if (!token) return

    // Verificar se já existe
    const existente = await buscarContatoPorTelefone(whatsapp)
    if (existente) {
      console.log(`[Kommo] Contato já existe para ${whatsapp} (id: ${existente.id})`)
      return
    }

    const res = await kommoFetch("/api/v4/leads/complex", {
      method: "POST",
      body: JSON.stringify([
        {
          name: nome || "Lead WhatsApp",
          pipeline_id: PIPELINE_ID,
          status_id: STATUS_PRE_ATENDIMENTO,
          _embedded: {
            contacts: [
              {
                first_name: nome || "Lead WhatsApp",
                custom_fields_values: [
                  {
                    field_code: "PHONE",
                    values: [{ value: `+${whatsapp}`, enum_code: "WORK" }],
                  },
                ],
              },
            ],
          },
        },
      ]),
    })

    if (!res.ok) {
      const erro = await res.text()
      console.error("[Kommo] Erro ao criar lead:", res.status, erro)
    } else {
      console.log(`[Kommo] Lead criado: ${nome} (${whatsapp})`)
    }
  } catch (err) {
    console.error("[Kommo] Erro ao criar lead:", err)
  }
}

/** Move lead para "Encaminhado pela IA" no Kommo */
export async function encaminharLeadKommo(whatsapp: string): Promise<void> {
  try {
    const token = getToken()
    if (!token) return

    const contato = await buscarContatoPorTelefone(whatsapp)
    if (!contato?.leadId) {
      console.warn(`[Kommo] Lead não encontrado para ${whatsapp} — não pode encaminhar`)
      return
    }

    const res = await kommoFetch(`/api/v4/leads/${contato.leadId}`, {
      method: "PATCH",
      body: JSON.stringify({ status_id: STATUS_ENCAMINHADO }),
    })

    if (!res.ok) {
      const erro = await res.text()
      console.error("[Kommo] Erro ao encaminhar lead:", res.status, erro)
    } else {
      console.log(`[Kommo] Lead encaminhado: ${whatsapp}`)
    }
  } catch (err) {
    console.error("[Kommo] Erro ao encaminhar lead:", err)
  }
}

/** Cria tarefa de ligação no Kommo */
export async function criarTarefaKommo(
  whatsapp: string,
  dataHora: string,
  resumo: string
): Promise<void> {
  try {
    const token = getToken()
    if (!token) return

    const contato = await buscarContatoPorTelefone(whatsapp)
    if (!contato?.leadId) {
      console.warn(`[Kommo] Lead não encontrado para ${whatsapp} — não pode criar tarefa`)
      return
    }

    // Calcular complete_till (timestamp Unix)
    const completeTill = Math.floor(Date.now() / 1000) + 86400 // +24h como fallback

    const res = await kommoFetch("/api/v4/tasks", {
      method: "POST",
      body: JSON.stringify([
        {
          text: `Ligação: ${resumo}\nHorário preferido: ${dataHora}`,
          complete_till: completeTill,
          entity_id: contato.leadId,
          entity_type: "leads",
          task_type_id: 1, // Ligação
        },
      ]),
    })

    if (!res.ok) {
      const erro = await res.text()
      console.error("[Kommo] Erro ao criar tarefa:", res.status, erro)
    } else {
      console.log(`[Kommo] Tarefa criada para ${whatsapp}: ${dataHora}`)
    }
  } catch (err) {
    console.error("[Kommo] Erro ao criar tarefa:", err)
  }
}
