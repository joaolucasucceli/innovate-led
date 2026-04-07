import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { validarApiSecret } from "@/lib/api-auth"
import { processarMensagens } from "@/lib/agente/loop"
import { redis } from "@/lib/redis"

const DEBOUNCE_MS = 20_000 // 20 segundos
const LOCK_SUFFIX = "_lock_innovate"
const LOCK_TTL = 30 // segundos (margem sobre o debounce)

export async function POST(request: NextRequest) {
  const erro = validarApiSecret(request)
  if (erro) return erro

  let body: { chatId?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Payload inválido" }, { status: 400 })
  }

  const { chatId } = body
  if (!chatId) {
    return NextResponse.json({ error: "chatId é obrigatório" }, { status: 400 })
  }

  // Debounce: se já existe um processamento esperando para este chat, retornar
  const lockKey = `${chatId}${LOCK_SUFFIX}`
  const locked = await redis.exists(lockKey)
  if (locked) {
    return NextResponse.json({ status: "debounce" })
  }

  // Adquirir lock e aguardar debounce para acumular mensagens
  await redis.set(lockKey, "1", { ex: LOCK_TTL })

  // Esperar debounce — mensagens que chegarem nesse intervalo serão acumuladas no buffer
  await new Promise((resolve) => setTimeout(resolve, DEBOUNCE_MS))

  try {
    await processarMensagens(chatId)
  } catch (err) {
    console.error("[Agente] Erro ao processar mensagens:", err)
    return NextResponse.json({ error: "Erro no processamento" }, { status: 500 })
  } finally {
    // Liberar lock
    await redis.del(lockKey)
  }

  return NextResponse.json({ status: "processado" })
}
