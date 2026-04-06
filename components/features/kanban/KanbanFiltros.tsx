"use client"

import { useEffect, useState } from "react"
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface Usuario {
  id: string
  nome: string
}

interface KanbanFiltrosProps {
  responsavelId: string
  onResponsavelChange: (valor: string) => void
}

export function KanbanFiltros({
  responsavelId,
  onResponsavelChange,
}: KanbanFiltrosProps) {
  const [usuarios, setUsuarios] = useState<Usuario[]>([])

  useEffect(() => {
    fetch("/api/usuarios")
      .then((r) => r.json())
      .then((data) => setUsuarios(data.dados || []))
      .catch(() => {})
  }, [])

  const temFiltro = !!responsavelId

  return (
    <div className="flex flex-wrap items-center gap-3 mb-4">
      <Select
        value={responsavelId || "todos"}
        onValueChange={(v) => onResponsavelChange(v === "todos" ? "" : v)}
      >
        <SelectTrigger className="w-[200px]">
          <SelectValue placeholder="Responsável" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="todos">Todos os responsáveis</SelectItem>
          {usuarios.map((u) => (
            <SelectItem key={u.id} value={u.id}>
              {u.nome}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {temFiltro && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                onResponsavelChange("")
              }}
            >
              <X className="mr-1 h-4 w-4" />
              Limpar
            </Button>
          </TooltipTrigger>
          <TooltipContent>Remover todos os filtros</TooltipContent>
        </Tooltip>
      )}
    </div>
  )
}
