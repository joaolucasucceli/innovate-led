"use client"

import { useState, Suspense } from "react"
import { Bot, ExternalLink, Loader2, MessageSquare, Pause, Play } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { PageHeader } from "@/components/features/shared/PageHeader"
import { KanbanView } from "@/components/features/kanban/KanbanView"
import { ListaConversas } from "@/components/features/atendimentos/ListaConversas"
import { HistoricoChat } from "@/components/features/chat/HistoricoChat"
import { type ConversaResumo } from "@/hooks/use-conversas"
import { toast } from "sonner"

export default function AtendimentosPage() {
  const [refreshKey, setRefreshKey] = useState(0)

  // Conversa selecionada para ver historico
  const [conversaSelecionada, setConversaSelecionadaRaw] = useState<ConversaResumo | null>(null)
  const [alterandoModo, setAlterandoModo] = useState(false)

  function setConversaSelecionada(conversa: ConversaResumo | null) {
    setConversaSelecionadaRaw(conversa)
    if (conversa) {
      fetch("/api/atendimento/marcar-lida", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversaId: conversa.id }),
      }).catch(() => {})
    }
  }

  async function handlePausarRetomar() {
    if (!conversaSelecionada) return
    setAlterandoModo(true)

    const estaPausada = conversaSelecionada.modoConversa === "humano"
    const rota = estaPausada ? "/api/atendimento/devolver" : "/api/atendimento/assumir"

    try {
      const res = await fetch(rota, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversaId: conversaSelecionada.id }),
      })

      if (!res.ok) {
        const erro = await res.json()
        toast.error(erro.error || "Erro ao alterar modo")
        return
      }

      const novoModo = estaPausada ? "ia" : "humano"
      setConversaSelecionada({ ...conversaSelecionada, modoConversa: novoModo })
      toast.success(estaPausada ? "IA retomada" : "IA pausada")
    } catch {
      toast.error("Erro ao alterar modo")
    } finally {
      setAlterandoModo(false)
    }
  }

  return (
    <div className="h-full">
      <PageHeader
        titulo="Atendimentos"
        descricao="Visualize o funil e o histórico de conversas"
      />

      {/* Kanban */}
      <div className="mt-4">
        <Suspense>
          <KanbanView externalRefresh={refreshKey} />
        </Suspense>
      </div>

      {/* Historico de Conversas */}
      <div className="mt-6 flex h-[calc(100vh-520px)] min-h-[400px] border rounded-lg overflow-hidden bg-background">
        {/* Lista de conversas (esquerda) */}
        <div className="w-[340px] shrink-0">
          <ListaConversas
            conversaSelecionada={conversaSelecionada?.id || null}
            onSelecionar={setConversaSelecionada}
          />
        </div>

        {/* Historico (direita) */}
        <div className="flex-1 flex flex-col">
          {conversaSelecionada ? (
            <>
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b">
                <div className="flex items-center gap-3">
                  {conversaSelecionada.modoConversa === "humano" ? (
                    <div className="h-8 w-8 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                      <Pause className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                    </div>
                  ) : (
                    <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                      <Bot className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    </div>
                  )}
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{conversaSelecionada.lead.nome}</span>
                      <Badge variant={conversaSelecionada.modoConversa === "humano" ? "secondary" : "default"} className="text-[10px] h-5">
                        {conversaSelecionada.modoConversa === "humano" ? "IA Pausada" : "IA Ativa"}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{conversaSelecionada.lead.whatsapp}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant={conversaSelecionada.modoConversa === "humano" ? "default" : "outline"}
                    size="sm"
                    onClick={handlePausarRetomar}
                    disabled={alterandoModo}
                  >
                    {alterandoModo && <Loader2 className="mr-1 h-3 w-3 animate-spin" />}
                    {conversaSelecionada.modoConversa === "humano" ? (
                      <>
                        <Play className="mr-1 h-3 w-3" />
                        Retomar IA
                      </>
                    ) : (
                      <>
                        <Pause className="mr-1 h-3 w-3" />
                        Pausar IA
                      </>
                    )}
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                    <Link href={`/leads/${conversaSelecionada.leadId}`}>
                      <ExternalLink className="h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </div>

              {/* Historico read-only */}
              <div className="flex-1 min-h-0">
                <HistoricoChat conversaId={conversaSelecionada.id} />
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              <div className="text-center">
                <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p className="text-sm">Selecione uma conversa para ver o histórico</p>
              </div>
            </div>
          )}
        </div>
      </div>

    </div>
  )
}
