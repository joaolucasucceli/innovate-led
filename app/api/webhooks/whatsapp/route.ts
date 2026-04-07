import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import type { TipoMensagem } from "@/generated/prisma/enums"
import { adicionarAoBuffer } from "@/lib/agente/buffer"
import { transcreverAudio, descreverImagem } from "@/lib/agente/processar-midia"
import { criarLeadKommo } from "@/lib/kommo"
import { createClient } from "@supabase/supabase-js"

// ── Tipos UazapiGO v2 ─────────────────────────────────────────────

/* eslint-disable @typescript-eslint/no-explicit-any */

interface MensagemNormalizada {
  id: string
  chatId: string
  fromMe: boolean
  isGroup: boolean
  numero: string
  nomeContato: string | null
  tipo: TipoMensagem
  conteudo: string
  mediaUrl: string | null
  timestamp: number
}

// ── Helpers ────────────────────────────────────────────────────────

function extrairNumero(jid: string): string {
  return jid.split("@")[0]
}

const MIME_MAP: Record<string, string> = {
  imagem: "image/jpeg",
  audio: "audio/ogg",
  documento: "application/octet-stream",
  video: "video/mp4",
}

function stripQuotes(value: string) {
  return value.replace(/^["']|["']$/g, "")
}

async function downloadEUploadMidia(
  mediaUrl: string,
  tipo: TipoMensagem,
  messageId: string
): Promise<string | null> {
  try {
    const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const rawKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!rawUrl || !rawKey) {
      console.warn("[Webhook] Supabase URL ou Service Key não configurados — mídia não será salva")
      return null
    }

    const supabase = createClient(stripQuotes(rawUrl), stripQuotes(rawKey))
    const res = await fetch(mediaUrl)
    if (!res.ok) {
      console.warn("[Webhook] Erro ao baixar mídia:", res.status, mediaUrl.slice(0, 100))
      return null
    }

    const buffer = Buffer.from(await res.arrayBuffer())
    const ext = tipo === "imagem" ? "jpg" : tipo === "audio" ? "ogg" : tipo === "video" ? "mp4" : "bin"
    const path = `webhook/${messageId}.${ext}`

    const { error } = await supabase.storage
      .from("atendimento-midias")
      .upload(path, buffer, {
        contentType: MIME_MAP[tipo] || "application/octet-stream",
        upsert: true,
      })

    if (error) {
      console.error("[Webhook] Erro ao upload mídia:", error.message)
      return null
    }

    const { data } = supabase.storage.from("atendimento-midias").getPublicUrl(path)
    return data.publicUrl
  } catch (err) {
    console.error("[Webhook] Erro inesperado no upload mídia:", err)
    return null
  }
}

// ── Normalizar payload UazapiGO v2 ────────────────────────────────
// Formato real capturado dos logs:
// {
//   "EventType": "messages",
//   "message": { "chatid", "content", "fromMe", "isGroup", "id", "mediaType", "messageTimestamp" },
//   "chat": { "phone", "name", "wa_chatid" },
//   "owner": "5527996960847"
// }

function normalizarUazapiV2(payload: any): MensagemNormalizada | null {
  const msg = payload.message
  if (!msg) return null

  const chatId = msg.chatid || ""
  const isFromMe = msg.fromMe ?? false
  const isGroup = msg.isGroup ?? chatId.includes("@g.us")
  const messageId = msg.messageid || msg.id || ""
  const timestamp = msg.messageTimestamp
    ? Math.floor(typeof msg.messageTimestamp === "number" && msg.messageTimestamp > 1e12
        ? msg.messageTimestamp / 1000
        : msg.messageTimestamp)
    : Math.floor(Date.now() / 1000)

  // Detectar tipo de mídia (Uazapi v2: type + mediaType)
  const msgType = (msg.type || "").toLowerCase()
  const mediaType = (msg.mediaType || "").toLowerCase()
  let tipoMsg: TipoMensagem = "texto"
  let mediaUrl: string | null = null

  if (msgType === "audio" || msgType === "ptt" || mediaType.includes("audio") || mediaType === "ptt") {
    tipoMsg = "audio"
    mediaUrl = msg.content || null
  } else if ((msgType === "media" && mediaType.includes("image")) || mediaType.includes("image")) {
    tipoMsg = "imagem"
  } else if (msgType === "document" || mediaType.includes("document")) {
    tipoMsg = "documento"
    mediaUrl = msg.content || null
  } else if (msgType === "video" || mediaType.includes("video")) {
    tipoMsg = "video"
    mediaUrl = msg.content || null
  }

  // Para imagem: construir URL de download (múltiplas fontes)
  if (tipoMsg === "imagem") {
    const baseUrl = payload.BaseUrl || payload.baseUrl || payload.baseurl
    const token = payload.token || payload.Token
    const msgIdForDownload = msg.messageid || msg.id || ""

    if (baseUrl && token && msgIdForDownload) {
      mediaUrl = `${baseUrl}/chat/downloadMediaMessage/${msgIdForDownload}?token=${token}`
    }

    // Log detalhado para debug de imagem
    console.log("[Webhook] Imagem detectada — debug:", {
      msgId: msg.id,
      msgMessageId: msg.messageid,
      payloadBaseUrl: baseUrl || "AUSENTE",
      payloadToken: token ? "presente" : "AUSENTE",
      mediaUrlConstruida: mediaUrl || "FALHOU",
      payloadKeys: Object.keys(payload).join(","),
      msgKeys: Object.keys(msg).join(","),
    })
  }

  // Fallback: tentar mediaUrl direto (outros gateways)
  if (!mediaUrl && tipoMsg !== "texto") {
    mediaUrl = msg.mediaUrl || msg.media_url || null
  }

  // Conteúdo: para imagens, usar caption/texto (não a URL)
  const conteudo = tipoMsg === "imagem"
    ? (msg.text || msg.caption || "")
    : (msg.content || msg.body || "")

  // Nome do contato — vem do chat do Uazapi
  const chat = payload.chat || {}
  const nomeContato = chat.name || chat.wa_name || null

  if (!chatId || !messageId) {
    console.warn("[Webhook] UazapiGO — faltam chatId ou messageId", { chatId, messageId })
    return null
  }

  return {
    id: messageId,
    chatId,
    fromMe: isFromMe,
    isGroup,
    numero: extrairNumero(chatId),
    nomeContato,
    tipo: tipoMsg,
    conteudo,
    mediaUrl,
    timestamp,
  }
}

// ── Normalizar payload Baileys/Evolution API (formato legado) ─────

function normalizarBaileys(payload: any): MensagemNormalizada[] {
  const messages = payload?.data?.messages
  if (!Array.isArray(messages)) return []

  return messages
    .filter((msg: any) => msg?.key && !msg.key.fromMe && !msg.key.remoteJid?.includes("@g.us"))
    .map((msg: any) => {
      const message = msg.message || {}
      let tipo: TipoMensagem = "texto"
      let mediaUrl: string | null = null

      if (message.audioMessage) { tipo = "audio"; mediaUrl = message.audioMessage.url || null }
      else if (message.imageMessage) { tipo = "imagem"; mediaUrl = message.imageMessage.url || null }
      else if (message.documentMessage) { tipo = "documento"; mediaUrl = message.documentMessage.url || null }
      else if (message.videoMessage) { tipo = "video"; mediaUrl = message.videoMessage.url || null }

      const conteudo =
        message.conversation ||
        message.extendedTextMessage?.text ||
        message.imageMessage?.caption ||
        message.videoMessage?.caption ||
        ""

      return {
        id: msg.key.id,
        chatId: msg.key.remoteJid,
        fromMe: false,
        isGroup: false,
        numero: extrairNumero(msg.key.remoteJid),
        nomeContato: null,
        tipo,
        conteudo,
        mediaUrl,
        timestamp: msg.messageTimestamp || Math.floor(Date.now() / 1000),
      }
    })
}

// ── Handler principal ─────────────────────────────────────────────

export async function POST(request: NextRequest) {
  // Validar origem: apenas se WEBHOOK_SECRET estiver explicitamente configurado
  const webhookSecret = process.env.WEBHOOK_SECRET
  if (webhookSecret) {
    const tokenRecebido =
      request.headers.get("x-webhook-token") ??
      request.headers.get("x-api-secret")
    if (tokenRecebido !== webhookSecret) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }
  }

  let payload: any

  try {
    payload = await request.json()
  } catch {
    return NextResponse.json({ error: "Payload inválido" }, { status: 400 })
  }

  // Log completo do payload para diagnóstico
  console.log("[Webhook] Payload bruto:", JSON.stringify(payload).slice(0, 2000))

  // ── Detectar formato e normalizar ──
  let mensagens: MensagemNormalizada[] = []

  if (payload.EventType === "messages" && payload.message) {
    // UazapiGO v2: { EventType: "messages", message: { chatid, content, ... } }
    const msg = normalizarUazapiV2(payload)
    if (msg) mensagens = [msg]
  } else if (typeof payload.event === "string") {
    // Baileys/Evolution: { event: "messages.upsert", data: { messages: [...] } }
    const eventosValidos = ["messages.upsert", "messages"]
    if (!eventosValidos.includes(payload.event)) {
      return NextResponse.json({ ok: true })
    }
    mensagens = normalizarBaileys(payload)
  } else {
    console.log("[Webhook] Evento ignorado", {
      EventType: payload.EventType,
      event: payload.event,
      keys: Object.keys(payload),
    })
    return NextResponse.json({ ok: true })
  }

  if (mensagens.length === 0) {
    return NextResponse.json({ ok: true })
  }

  for (const msg of mensagens) {
    // Ignorar mensagens do próprio bot
    if (msg.fromMe) continue

    // Ignorar grupos
    if (msg.isGroup) continue

    // Dedup: verificar se já processou
    const existe = await prisma.mensagemWhatsapp.findUnique({
      where: { messageIdWhatsapp: msg.id },
    })
    if (existe) continue

    let conteudo = msg.conteudo
    let storedMediaUrl: string | null = null
    let descricaoImagem: string | null = null

    // Construir URL de download da mídia
    // Prioridade: msg.mediaUrl (do payload/normalização) → fallback ConfigWhatsapp
    let mediaDownloadUrl = msg.mediaUrl
    if (!mediaDownloadUrl && msg.tipo !== "texto") {
      const configWa = await prisma.configWhatsapp.findFirst({ where: { ativo: true } })
      if (configWa?.uazapiUrl && configWa?.instanceToken) {
        mediaDownloadUrl = `${configWa.uazapiUrl}/chat/downloadMediaMessage/${msg.id}?token=${configWa.instanceToken}`
        console.log("[Webhook] URL mídia construída via ConfigWhatsapp:", mediaDownloadUrl.slice(0, 100))
      }
    }

    // 1. Download mídia para Supabase PRIMEIRO
    if (mediaDownloadUrl && msg.tipo !== "texto") {
      storedMediaUrl = await downloadEUploadMidia(mediaDownloadUrl, msg.tipo, msg.id)
    }

    // 2. Processar mídia (transcrição/descrição) usando URL pública estável
    try {
      if (msg.tipo === "audio" && (storedMediaUrl || mediaDownloadUrl)) {
        conteudo = `[Áudio transcrito]: ${await transcreverAudio(storedMediaUrl || mediaDownloadUrl!)}`
      } else if (msg.tipo === "imagem" && (storedMediaUrl || mediaDownloadUrl)) {
        descricaoImagem = await descreverImagem(storedMediaUrl || mediaDownloadUrl!)
        conteudo = conteudo
          ? `${conteudo}\n[Foto do local de instalação — análise técnica]: ${descricaoImagem}`
          : `[Foto do local de instalação — análise técnica]: ${descricaoImagem}`
      }
    } catch (err) {
      console.error(`[Webhook] Erro ao processar ${msg.tipo}:`, err)
      if (!conteudo) {
        conteudo = `[${msg.tipo} não processado]`
      }
    }

    // Encontrar ou criar lead pelo whatsapp
    let lead = await prisma.lead.findUnique({
      where: { whatsapp: msg.numero },
    })

    if (lead && lead.deletadoEm) {
      // Lead foi deletado mas recebeu nova mensagem — reativar
      lead = await prisma.lead.update({
        where: { id: lead.id },
        data: {
          deletadoEm: null,
          nome: msg.nomeContato?.trim() || lead.nome,
        },
      })
    }

    if (!lead) {
      const usuarioIa = await prisma.usuario.findFirst({
        where: { tipo: "ia", ativo: true, deletadoEm: null },
      })
      const nomeLead = msg.nomeContato?.trim() || `WhatsApp ${msg.numero}`
      lead = await prisma.lead.create({
        data: {
          nome: nomeLead,
          whatsapp: msg.numero,
          origem: "whatsapp",
          responsavelId: usuarioIa?.id || null,
        },
      })
      // Criar lead no Kommo CRM (fire-and-forget)
      criarLeadKommo(nomeLead, msg.numero).catch(() => {})
    }

    // Encontrar ou criar conversa
    let conversa = await prisma.conversa.findFirst({
      where: { leadId: lead.id },
      orderBy: { criadoEm: "desc" },
    })

    if (!conversa) {
      conversa = await prisma.conversa.create({
        data: { leadId: lead.id },
      })
    }

    // Salvar mensagem
    await prisma.mensagemWhatsapp.create({
      data: {
        conversaId: conversa.id,
        leadId: lead.id,
        messageIdWhatsapp: msg.id,
        tipo: msg.tipo,
        conteudo,
        remetente: "cliente",
        mediaUrl: storedMediaUrl,
        mediaType: msg.tipo !== "texto" ? msg.tipo : null,
      },
    })

    // Atualizar ultimaMensagemEm na conversa
    await prisma.conversa.update({
      where: { id: conversa.id },
      data: { ultimaMensagemEm: new Date() },
    })

    // Salvar foto no registro do lead (FotoLead) — só se descrição foi gerada
    if (msg.tipo === "imagem" && storedMediaUrl && descricaoImagem) {
      try {
        await prisma.fotoLead.create({
          data: {
            leadId: lead.id,
            url: storedMediaUrl,
            descricao: descricaoImagem,
            tipoAnalise: "local_instalacao",
            ciclo: lead.cicloAtual,
          },
        })
      } catch (err) {
        console.error("[Webhook] Erro ao salvar FotoLead:", err)
      }
    }

    console.log("[Webhook] Mensagem processada", {
      leadId: lead.id,
      numero: msg.numero,
      tipo: msg.tipo,
      conteudo: conteudo.slice(0, 100),
    })

    // Adicionar ao buffer Redis e acionar processamento imediatamente
    // (setTimeout não funciona em serverless — a função é congelada após response)
    try {
      await adicionarAoBuffer(msg.chatId, {
        tipo: msg.tipo,
        conteudo,
        timestamp: msg.timestamp,
        messageId: msg.id,
      })

      const baseUrl = (process.env.NEXTAUTH_URL || "http://localhost:3000").trim()
      await fetch(`${baseUrl}/api/agente/processar`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-secret": process.env.API_SECRET || "",
        },
        body: JSON.stringify({ chatId: msg.chatId }),
      }).catch((err) => {
        console.error("[Webhook] Erro ao acionar processar:", err)
      })
    } catch {
      // Redis não configurado — mensagem já salva no banco, ok
    }
  }

  return NextResponse.json({ ok: true })
}
