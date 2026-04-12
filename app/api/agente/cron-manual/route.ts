import { NextResponse } from "next/server"
import { supabaseAdmin, agora } from "@/lib/supabase"
import { requireRole } from "@/lib/auth-helpers"
import { ehHorarioComercial } from "@/lib/agente/horario-comercial"
import { buscarConversasParaFollowUp, enviarFollowUp } from "@/lib/agente/followup"

export async function POST() {
  const { error } = await requireRole("gestor")
  if (error) return error

  const { data: configWa } = await supabaseAdmin
    .from("config_whatsapp")
    .select("*")
    .eq("ativo", true)
    .limit(1)
    .maybeSingle()

  const resultado = {
    followups: 0,
    autoClose: 0,
    horarioComercial: ehHorarioComercial(),
    timestamp: new Date().toISOString(),
  }

  if (!configWa?.instanceToken) {
    return NextResponse.json({ ...resultado, motivo: "sem_config_whatsapp" })
  }

  // Follow-ups (só em horário comercial)
  if (resultado.horarioComercial) {
    try {
      const pendentesFollowUp = await buscarConversasParaFollowUp()
      for (const { conversa, tipo } of pendentesFollowUp) {
        try {
          await enviarFollowUp(conversa, tipo, configWa)
          resultado.followups++
        } catch {
          // Continuar com próximo
        }
      }
    } catch {
      // Ignorar erro geral
    }

  }

  // Auto-close (sempre, independente de horário)
  try {
    const ha24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    const { data: conversas } = await supabaseAdmin
      .from("conversas")
      .select("id")
      .is("encerradaEm", null)
      .not("ultimaMensagemEm", "is", null)
      .lt("ultimaMensagemEm", ha24h)
      .contains("followUpEnviados", ["24h"])

    for (const conversa of conversas || []) {
      try {
        await supabaseAdmin
          .from("conversas")
          .update({
            encerradaEm: agora(),
            atualizadoEm: agora(),
          })
          .eq("id", conversa.id)
        resultado.autoClose++
      } catch {
        // Continuar
      }
    }
  } catch {
    // Ignorar
  }

  return NextResponse.json(resultado)
}
