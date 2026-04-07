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

/** Obtém bytes da mídia usando 3 estratégias (base64, URLs diretas, POST /message/download) */
async function obterBytesMidia(
  msgRaw: any,
  _payloadRaw: any,
  uazapiUrl: string,
  uazapiToken: string
): Promise<{ bytes: Uint8Array; mimetype: string } | null> {
  // ESTRATÉGIA A: Base64 inline no payload
  const content = msgRaw.content
  if (content && typeof content === "object" && content.base64 && content.base64.length > 100) {
    console.log("[Webhook] Mídia: usando base64 inline")
    const raw = content.base64.includes(",")
      ? content.base64.split(",")[1]
      : content.base64
    const bytes = Uint8Array.from(Buffer.from(raw, "base64"))
    return { bytes, mimetype: content.mimetype || "application/octet-stream" }
  }

  // ESTRATÉGIA B: URLs diretas do payload (com validação de Content-Type)
  const urls = [
    msgRaw.audio_url,
    msgRaw.document_url,
    msgRaw.image_url,
    msgRaw.fileURL,
    msgRaw.file_url,
    content?.url,
    content?.fileUrl,
    content?.mediaUrl,
  ].filter((u) => u && typeof u === "string" && u.startsWith("http"))

  for (const url of urls) {
    try {
      const res = await fetch(url, { headers: { token: uazapiToken } })
      const ct = res.headers.get("content-type") || ""

      // Rejeitar páginas de erro HTML
      if (ct.includes("text/html")) continue

      // Se JSON: pode conter base64 dentro
      if (ct.includes("application/json")) {
        try {
          const json = await res.json()
          const b64 = json.base64 || json.data
          if (typeof b64 === "string" && b64.length > 100) {
            const raw = b64.includes(",") ? b64.split(",")[1] : b64
            const bytes = Uint8Array.from(Buffer.from(raw, "base64"))
            console.log("[Webhook] Mídia: base64 via URL direta (JSON)")
            return { bytes, mimetype: json.mimetype || json.Mimetype || "application/octet-stream" }
          }
        } catch { /* ignora JSON inválido */ }
        continue
      }

      if (!res.ok) continue

      // Binário direto
      const bytes = new Uint8Array(await res.arrayBuffer())
      if (bytes.length > 100) {
        console.log("[Webhook] Mídia: baixada via URL direta:", url.slice(0, 60))
        return { bytes, mimetype: ct || "application/octet-stream" }
      }
    } catch {
      continue
    }
  }

  // ESTRATÉGIA C: POST /message/download (fallback mais confiável ~95%)
  const messageId = msgRaw.messageid || msgRaw.id
  if (messageId && uazapiUrl && uazapiToken) {
    try {
      const res = await fetch(`${uazapiUrl}/message/download`, {
        method: "POST",
        headers: { token: uazapiToken, "Content-Type": "application/json" },
        body: JSON.stringify({ id: messageId, return_base64: true, return_link: false }),
      })

      const ct = res.headers.get("content-type") || ""

      // Rejeitar HTML (página de erro)
      if (ct.includes("text/html")) {
        console.warn("[Webhook] /message/download retornou HTML — falhou")
      } else if (ct.includes("application/json")) {
        const json = await res.json()

        // Tentar base64 (vários campos possíveis)
        const b64 = json.base64 || json.data || json.Body
        if (typeof b64 === "string" && b64.length > 100) {
          const raw = b64.includes(",") ? b64.split(",")[1] : b64
          const bytes = Uint8Array.from(Buffer.from(raw, "base64"))
          console.log("[Webhook] Mídia: base64 via POST /message/download")
          return { bytes, mimetype: json.mimetype || json.Mimetype || "application/octet-stream" }
        }

        // Tentar URL secundária (sem header token)
        const dlUrl = json.fileURL || json.url
        if (dlUrl) {
          const dlRes = await fetch(dlUrl)
          if (dlRes.ok) {
            const dlCt = dlRes.headers.get("content-type") || ""
            if (!dlCt.includes("text/html")) {
              const bytes = new Uint8Array(await dlRes.arrayBuffer())
              if (bytes.length > 100) {
                console.log("[Webhook] Mídia: baixada via URL do /message/download")
                return { bytes, mimetype: dlCt || json.mimetype || "application/octet-stream" }
              }
            }
          }
        }
      } else if (res.ok) {
        // Binário direto (raro)
        const buf = await res.arrayBuffer()
        if (buf.byteLength > 100) {
          console.log("[Webhook] Mídia: binário direto do /message/download")
          return { bytes: new Uint8Array(buf), mimetype: ct || "application/octet-stream" }
        }
      }
    } catch (err) {
      console.error("[Webhook] Erro no POST /message/download:", err)
    }
  }

  console.warn("[Webhook] Nenhuma estratégia de download funcionou para msgId:", messageId)
  return null
}

/** Faz upload dos bytes para Supabase Storage e retorna URL pública */
async function uploadParaStorage(
  bytes: Uint8Array,
  tipo: TipoMensagem,
  messageId: string,
  mimetype: string
): Promise<string | null> {
  try {
    const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const rawKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!rawUrl || !rawKey) return null

    const supabase = createClient(stripQuotes(rawUrl), stripQuotes(rawKey))
    const extMap: Record<string, string> = { imagem: "jpg", audio: "ogg", video: "mp4", documento: "pdf" }
    const ext = extMap[tipo] || "bin"
    const path = `webhook/${messageId}.${ext}`

    const { error } = await supabase.storage
      .from("atendimento-midias")
      .upload(path, bytes, {
        contentType: mimetype || MIME_MAP[tipo] || "application/octet-stream",
        upsert: true,
      })

    if (error) {
      console.error("[Webhook] Erro ao upload Storage:", error.message)
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

  // Detectar tipo de mídia (Uazapi v2: type + mediaType + messageType)
  const msgType = (msg.type || "").toLowerCase()
  const mediaType = (msg.mediaType || "").toLowerCase()
  let tipoMsg: TipoMensagem = "texto"

  if (msgType === "audio" || msgType === "ptt" || mediaType === "ptt" || mediaType.includes("audio")) {
    tipoMsg = "audio"
  } else if (msgType === "media" && mediaType.includes("image") || mediaType.includes("image")) {
    tipoMsg = "imagem"
  } else if (msgType === "sticker" || mediaType === "sticker") {
    tipoMsg = "imagem" // sticker renderiza como imagem
  } else if (msgType === "document" || mediaType.includes("document")) {
    tipoMsg = "documento"
  } else if (msgType === "video" || mediaType.includes("video")) {
    tipoMsg = "video"
  }

  // mediaUrl: sempre null aqui — download feito via obterBytesMidia (3 estratégias)
  const mediaUrl: string | null = null

  // Conteúdo texto:
  // - Mídia: msg.text contém caption/legenda. msg.content é OBJETO (mimetype, base64, etc)
  // - Texto: msg.content ou msg.body contém o texto real
  // - Documento: msg.content.fileName pode conter o nome do arquivo
  let conteudo = ""
  if (tipoMsg === "texto") {
    conteudo = (typeof msg.content === "string" ? msg.content : "") || msg.body || msg.text || ""
  } else if (tipoMsg === "documento") {
    const fileName = typeof msg.content === "object" ? msg.content?.fileName : null
    conteudo = msg.text || fileName || ""
  } else {
    conteudo = msg.text || msg.caption || ""
  }

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

    // Download mídia: 3 estratégias (base64 inline → URLs diretas → POST /message/download)
    if (msg.tipo !== "texto") {
      const configWa = await prisma.configWhatsapp.findFirst({ where: { ativo: true } })
      const uazapiUrl = configWa?.uazapiUrl || ""
      const uazapiToken = configWa?.instanceToken || ""

      const resultado = await obterBytesMidia(payload.message, payload, uazapiUrl, uazapiToken)

      if (resultado) {
        storedMediaUrl = await uploadParaStorage(resultado.bytes, msg.tipo, msg.id, resultado.mimetype)
      }
    }

    // Processar mídia (transcrição/descrição) usando URL pública do Supabase
    if (msg.tipo !== "texto") {
      try {
        if (msg.tipo === "audio" && storedMediaUrl) {
          const transcricao = await transcreverAudio(storedMediaUrl)
          conteudo = `[Áudio transcrito]: ${transcricao}`
        } else if (msg.tipo === "imagem" && storedMediaUrl) {
          descricaoImagem = await descreverImagem(storedMediaUrl)
          const caption = conteudo
          conteudo = caption
            ? `${caption}\n[Foto do local de instalação — análise técnica]: ${descricaoImagem}`
            : `[Foto do local de instalação — análise técnica]: ${descricaoImagem}`
        } else if (msg.tipo === "documento") {
          conteudo = `[Documento recebido]: ${conteudo || "arquivo"}`
        } else if (msg.tipo === "video") {
          conteudo = `[Vídeo recebido]${conteudo ? `: ${conteudo}` : ""}`
        }
      } catch (err) {
        console.error(`[Webhook] Erro ao processar ${msg.tipo}:`, err)
      }

      // Fallback quando download falhou e não tem conteúdo contextual
      if (!conteudo) {
        const fallbacks: Record<string, string> = {
          audio: "[Áudio recebido]",
          imagem: "[Imagem recebida]",
          documento: "[Documento recebido]",
          video: "[Vídeo recebido]",
        }
        conteudo = fallbacks[msg.tipo] || `[${msg.tipo} recebido]`
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
