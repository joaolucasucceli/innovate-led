import { supabaseAdmin, gerarId } from "@/lib/supabase"

interface AuditLogParams {
  usuarioId: string
  acao: string
  entidade: string
  entidadeId?: string
  dadosAntes?: Record<string, unknown>
  dadosDepois?: Record<string, unknown>
  ip?: string
}

export async function registrarAuditLog({
  usuarioId,
  acao,
  entidade,
  entidadeId,
  dadosAntes,
  dadosDepois,
  ip,
}: AuditLogParams): Promise<void> {
  try {
    await supabaseAdmin.from("audit_logs").insert({
      id: gerarId(),
      usuarioId,
      acao,
      entidade,
      entidadeId: entidadeId ?? null,
      dadosAntes: dadosAntes ?? null,
      dadosDepois: dadosDepois ?? null,
      ip: ip ?? null,
    })
  } catch {
    // Falha no audit log não deve bloquear a operação principal
    console.error("[AuditLog] Erro ao registrar:", { acao, entidade, entidadeId })
  }
}
