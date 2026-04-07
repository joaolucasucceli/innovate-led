import { createClient, type SupabaseClient } from "@supabase/supabase-js"

let _client: SupabaseClient | null = null

function stripQuotes(value: string) {
  return value.replace(/^["']|["']$/g, "")
}

export function getSupabaseBrowser(): SupabaseClient | null {
  if (!_client) {
    const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const rawKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!rawUrl || !rawKey) return null

    const url = stripQuotes(rawUrl)
    const key = stripQuotes(rawKey)

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
