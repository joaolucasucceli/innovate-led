import { createClient, type SupabaseClient } from "@supabase/supabase-js"

let _client: SupabaseClient | null = null

export function getSupabaseBrowser(): SupabaseClient | null {
  if (!_client) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!url || !key) return null

    try {
      new URL(url)
    } catch {
      console.warn("[Supabase] NEXT_PUBLIC_SUPABASE_URL inválida:", url)
      return null
    }

    _client = createClient(url, key)
  }
  return _client
}
