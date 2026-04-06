"use client"

import { cn } from "@/lib/utils"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"

const funilConfig: Record<string, { label: string; classes: string; descricao: string }> = {
  qualificacao: { label: "Qualificação", classes: "bg-blue-100 text-blue-800", descricao: "IA qualificando o lead" },
  encaminhado: { label: "Encaminhado", classes: "bg-cyan-100 text-cyan-800", descricao: "Lead encaminhado ao comercial" },
  tarefa_criada: { label: "Tarefa Criada", classes: "bg-purple-100 text-purple-800", descricao: "Tarefa de ligação criada" },
  em_negociacao: { label: "Em Negociação", classes: "bg-yellow-100 text-yellow-800", descricao: "Consultor em contato" },
  venda_realizada: { label: "Venda Realizada", classes: "bg-green-100 text-green-800", descricao: "Negócio fechado" },
  perdido: { label: "Perdido", classes: "bg-red-100 text-red-800", descricao: "Lead perdido" },
}

interface StatusBadgeProps {
  status: string
  className?: string
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const item = funilConfig[status]

  if (!item) {
    return (
      <span
        className={cn(
          "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-gray-100 text-gray-800",
          className
        )}
      >
        {status}
      </span>
    )
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          className={cn(
            "inline-flex cursor-default items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
            item.classes,
            className
          )}
        >
          {item.label}
        </span>
      </TooltipTrigger>
      <TooltipContent>{item.descricao}</TooltipContent>
    </Tooltip>
  )
}

export function getStatusFunilLabel(status: string): string {
  return funilConfig[status]?.label || status
}
