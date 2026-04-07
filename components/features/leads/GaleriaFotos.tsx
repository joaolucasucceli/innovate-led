"use client"

import { useState } from "react"
import { ImageIcon, ChevronLeft, ChevronRight } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog"
import { EmptyState } from "@/components/features/shared/EmptyState"

interface FotoLead {
  id: string
  url: string
  descricao: string | null
  tipoAnalise: string | null
  criadoEm: string
}

interface GaleriaFotosProps {
  leadId: string
  fotosIniciais: FotoLead[]
}

function badgeClasses(tipo: string | null) {
  if (tipo === "local_instalacao") return "bg-blue-500/90 text-white border-0"
  if (tipo === "antes") return "bg-blue-500/90 text-white border-0"
  if (tipo === "depois") return "bg-green-500/90 text-white border-0"
  return ""
}

function labelTipo(tipo: string | null) {
  if (tipo === "local_instalacao") return "Local de Instalação"
  if (tipo === "antes") return "Antes"
  if (tipo === "depois") return "Depois"
  return "Geral"
}

export function GaleriaFotos({ leadId, fotosIniciais }: GaleriaFotosProps) {
  const [fotoAmpliada, setFotoAmpliada] = useState<{ foto: FotoLead; secao: FotoLead[] } | null>(null)

  const fotos = fotosIniciais

  function navLightbox(direcao: 1 | -1) {
    if (!fotoAmpliada) return
    const { secao, foto } = fotoAmpliada
    const idx = secao.findIndex((f) => f.id === foto.id)
    const proximo = secao[idx + direcao]
    if (proximo) setFotoAmpliada({ foto: proximo, secao })
  }

  function CardFoto({ foto, secao }: { foto: FotoLead; secao: FotoLead[] }) {
    return (
      <div
        className="group relative overflow-hidden rounded-lg border cursor-pointer"
        onClick={() => setFotoAmpliada({ foto, secao })}
      >
        <img
          src={foto.url}
          alt={foto.descricao || "Foto do lead"}
          className="aspect-square w-full object-cover transition-transform group-hover:scale-105"
        />
        {foto.tipoAnalise && (
          <Badge className={`absolute left-2 top-2 text-[10px] uppercase ${badgeClasses(foto.tipoAnalise)}`}>
            {labelTipo(foto.tipoAnalise)}
          </Badge>
        )}
        {foto.descricao && (
          <p className="p-2 text-xs text-muted-foreground line-clamp-2">{foto.descricao}</p>
        )}
      </div>
    )
  }

  if (fotos.length === 0) {
    return (
      <EmptyState
        icone={<ImageIcon className="h-12 w-12" />}
        titulo="Nenhuma foto"
        descricao="As fotos enviadas pelo lead via WhatsApp aparecerão aqui automaticamente."
      />
    )
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {fotos.map((foto) => (
          <CardFoto key={foto.id} foto={foto} secao={fotos} />
        ))}
      </div>

      {/* Lightbox */}
      <Dialog open={!!fotoAmpliada} onOpenChange={(open) => !open && setFotoAmpliada(null)}>
        <DialogContent className="max-w-3xl p-0 overflow-hidden">
          {fotoAmpliada && (
            <div className="relative bg-black">
              <img
                src={fotoAmpliada.foto.url}
                alt={fotoAmpliada.foto.descricao || "Foto ampliada"}
                className="max-h-[80vh] w-full object-contain"
              />
              {fotoAmpliada.secao.findIndex((f) => f.id === fotoAmpliada.foto.id) > 0 && (
                <button
                  onClick={() => navLightbox(-1)}
                  className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white hover:bg-black/70"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
              )}
              {fotoAmpliada.secao.findIndex((f) => f.id === fotoAmpliada.foto.id) <
                fotoAmpliada.secao.length - 1 && (
                <button
                  onClick={() => navLightbox(1)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white hover:bg-black/70"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              )}
              {(fotoAmpliada.foto.descricao || fotoAmpliada.foto.criadoEm) && (
                <div className="bg-black/70 px-4 py-2 text-sm text-white">
                  {fotoAmpliada.foto.tipoAnalise && (
                    <p className="text-xs text-white/80 font-medium mb-1">{labelTipo(fotoAmpliada.foto.tipoAnalise)}</p>
                  )}
                  {fotoAmpliada.foto.descricao && (
                    <p>{fotoAmpliada.foto.descricao}</p>
                  )}
                  <p className="text-xs text-white/60 mt-1">
                    {new Date(fotoAmpliada.foto.criadoEm).toLocaleDateString("pt-BR", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                    })}
                  </p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
