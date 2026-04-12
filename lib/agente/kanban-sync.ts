import { supabaseAdmin, gerarId, agora } from "@/lib/supabase"
import type { StatusFunil, EtapaConversa, Lead } from "@/types/database"

/** Atualiza o statusFunil de um lead + ultimaMovimentacaoEm */
export async function sincronizarFunil(
  leadId: string,
  novoStatus: StatusFunil
): Promise<void> {
  await supabaseAdmin
    .from("leads")
    .update({
      statusFunil: novoStatus,
      ultimaMovimentacaoEm: agora(),
      atualizadoEm: agora(),
    })
    .eq("id", leadId)
}

/** Avança a etapa de uma conversa */
export async function avancarEtapa(
  conversaId: string,
  novaEtapa: EtapaConversa
): Promise<void> {
  await supabaseAdmin
    .from("conversas")
    .update({ etapa: novaEtapa, atualizadoEm: agora() })
    .eq("id", conversaId)
}

interface ResultadoNovoCiclo {
  conversaId: string
  cicloAtual: number
  statusAnterior: StatusFunil
}

/**
 * Abre um novo ciclo de atendimento para um lead que retornou (encaminhado).
 * Incrementa cicloAtual, reseta statusFunil e cria nova conversa vinculada ao ciclo.
 */
export async function abrirNovoCiclo(leadId: string): Promise<ResultadoNovoCiclo> {
  const { data: lead, error } = await supabaseAdmin
    .from("leads")
    .select("*")
    .eq("id", leadId)
    .single()

  if (error || !lead) throw new Error(`Lead ${leadId} não encontrado`)

  const typedLead = lead as Lead
  const statusAnterior = typedLead.statusFunil
  const novoCiclo = typedLead.cicloAtual + 1
  const dataFormatada = new Date().toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "America/Sao_Paulo",
  })

  const notaRetorno = `\n\n[Ciclo ${novoCiclo} iniciado em ${dataFormatada}]: Contato retornou via WhatsApp. Status anterior: ${statusAnterior}.`

  const conversaId = gerarId()

  // Criar conversa
  await supabaseAdmin.from("conversas").insert({
    id: conversaId,
    leadId,
    etapa: "acolhimento",
    ciclo: novoCiclo,
    atualizadoEm: agora(),
  })

  // Atualizar lead
  await supabaseAdmin
    .from("leads")
    .update({
      cicloAtual: novoCiclo,
      ciclosCompletos: typedLead.ciclosCompletos + 1,
      ehRetorno: true,
      statusFunil: "acolhimento",
      ultimaMovimentacaoEm: agora(),
      arquivado: false,
      arquivadoEm: null,
      sobreOLead: typedLead.sobreOLead
        ? `${typedLead.sobreOLead}${notaRetorno}`
        : notaRetorno.trim(),
      atualizadoEm: agora(),
    })
    .eq("id", leadId)

  return {
    conversaId,
    cicloAtual: novoCiclo,
    statusAnterior,
  }
}
