"use client"

import { cn } from "@/lib/utils"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"

const funilConfig: Record<string, { label: string; classes: string; descricao: string }> = {
  acolhimento: { label: "Acolhimento", classes: "bg-green-100 text-green-800", descricao: "Primeiro contato com o lead" },
  qualificacao: { label: "Qualificação", classes: "bg-blue-100 text-blue-800", descricao: "IA qualificando o lead" },
  encaminhado: { label: "Encaminhado", classes: "bg-cyan-100 text-cyan-800", descricao: "Lead encaminhado ao comercial" },
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
