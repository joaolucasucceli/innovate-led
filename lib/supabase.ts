import { createClient, type SupabaseClient } from "@supabase/supabase-js"

// ==========================================
// Singleton — Admin Client (service role key)
// ==========================================

let _client: SupabaseClient | null = null

export function getSupabaseAdmin(): SupabaseClient {
  if (!_client) {
    _client = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
  }
  return _client
}

// Backward-compatible export — lazy proxy
export const supabaseAdmin = new Proxy({} as SupabaseClient, {
  get(_, prop) {
    return Reflect.get(getSupabaseAdmin(), prop)
  },
})

// ==========================================
// Helper: gerar ID (substitui Prisma cuid())
// ==========================================

export function gerarId(): string {
  return crypto.randomUUID()
}

// ==========================================
// Helper: timestamp atual ISO (substitui Prisma @updatedAt)
// ==========================================

export function agora(): string {
  return new Date().toISOString()
}

// ==========================================
// Helper: lançar erro se query falhou
// ==========================================

export function verificarErro<T>(
  resultado: { data: T; error: { message: string } | null },
  contexto?: string
): T {
  if (resultado.error) {
    throw new Error(
      contexto
        ? `[${contexto}] ${resultado.error.message}`
        : resultado.error.message
    )
  }
  return resultado.data
}
