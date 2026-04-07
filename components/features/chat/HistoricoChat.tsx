"use client"

import { useRef, useEffect } from "react"
import { Loader2 } from "lucide-react"
import { format, isSameDay } from "date-fns"
import { ptBR } from "date-fns/locale"
import { BolhaChat } from "@/components/features/chat/BolhaChat"
import { useMensagens } from "@/hooks/use-mensagens"
import { useRealtimeTabela } from "@/lib/realtime"

interface HistoricoChatProps {
  conversaId: string
}

export function HistoricoChat({ conversaId }: HistoricoChatProps) {
  const { mensagens, carregando, recarregar } = useMensagens(conversaId)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [mensagens.length])

  useRealtimeTabela("mensagens", recarregar)

  if (carregando) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  const mensagensComSeparador: { tipo: "separador" | "mensagem"; data?: Date; mensagem?: Parameters<typeof BolhaChat>[0]["mensagem"] }[] = []
  let ultimaData: Date | null = null
  for (const msg of mensagens) {
    const dataMensagem = new Date(msg.criadoEm)
    if (!ultimaData || !isSameDay(ultimaData, dataMensagem)) {
      mensagensComSeparador.push({ tipo: "separador", data: dataMensagem })
      ultimaData = dataMensagem
    }
    mensagensComSeparador.push({ tipo: "mensagem", mensagem: msg })
  }

  return (
    <div ref={scrollRef} className="h-full overflow-y-auto px-4 py-3 space-y-2">
      {mensagens.length === 0 && (
        <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
          Nenhuma mensagem ainda
        </div>
      )}

      {mensagensComSeparador.map((item, i) => {
        if (item.tipo === "separador") {
          return (
            <div key={`sep-${i}`} className="flex items-center gap-3 py-2">
              <div className="flex-1 h-px bg-border" />
              <span className="text-xs text-muted-foreground">
                {format(item.data!, "dd 'de' MMMM", { locale: ptBR })}
              </span>
              <div className="flex-1 h-px bg-border" />
            </div>
          )
        }

        return (
          <div key={item.mensagem!.id} className="flex">
            <BolhaChat mensagem={item.mensagem!} />
          </div>
        )
      })}
    </div>
  )
}
