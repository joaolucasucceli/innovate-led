"use client"

import { Droppable } from "@hello-pangea/dnd"
import { Users } from "lucide-react"
import { KanbanCard } from "./KanbanCard"
import type { KanbanLead } from "@/hooks/use-kanban"

const coresColuna: Record<string, { bg: string; text: string; border: string }> = {
  qualificacao: { bg: "bg-blue-50", text: "text-blue-800", border: "border-blue-300" },
  encaminhado: { bg: "bg-cyan-50", text: "text-cyan-800", border: "border-cyan-300" },
  tarefa_criada: { bg: "bg-purple-50", text: "text-purple-800", border: "border-purple-300" },
  em_negociacao: { bg: "bg-yellow-50", text: "text-yellow-800", border: "border-yellow-300" },
  venda_realizada: { bg: "bg-green-100", text: "text-green-900", border: "border-green-400" },
  perdido: { bg: "bg-red-50", text: "text-red-800", border: "border-red-300" },
}

const labelsColuna: Record<string, string> = {
  qualificacao: "Qualificação",
  encaminhado: "Encaminhado",
  tarefa_criada: "Tarefa Criada",
  em_negociacao: "Em Negociação",
  venda_realizada: "Venda Realizada",
  perdido: "Perdido",
}

interface KanbanColunaProps {
  etapa: string
  leads: KanbanLead[]
}

export function KanbanColuna({ etapa, leads }: KanbanColunaProps) {
  const cores = coresColuna[etapa] || coresColuna.qualificacao
  const label = labelsColuna[etapa] || etapa

  return (
    <div className="flex w-72 flex-shrink-0 flex-col rounded-lg border bg-muted/30">
      <div
        className={`flex items-center justify-between rounded-t-lg border-b-2 ${cores.border} ${cores.bg} px-3 py-2`}
      >
        <h3 className={`text-xs font-semibold ${cores.text}`}>{label}</h3>
        <span
          className={`flex h-5 min-w-5 items-center justify-center gap-1 rounded-full ${cores.bg} ${cores.text} px-1.5 text-[10px] font-bold`}
        >
          <Users className="h-3 w-3" />
          {leads.length}
        </span>
      </div>

      <Droppable droppableId={etapa}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`flex flex-1 flex-col gap-2 p-2 min-h-[200px] transition-colors ${
              snapshot.isDraggingOver ? "bg-muted/60" : ""
            }`}
          >
            {leads.map((lead, index) => (
              <KanbanCard key={lead.id} lead={lead} index={index} />
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </div>
  )
}
