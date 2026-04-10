"use client"

import { useState, Suspense } from "react"
import { Skeleton } from "@/components/ui/skeleton"
import { PageHeader } from "@/components/features/shared/PageHeader"
import { KanbanView } from "@/components/features/kanban/KanbanView"

export default function AtendimentosPage() {
  const [refreshKey] = useState(0)

  return (
    <div className="h-full">
      <PageHeader
        titulo="Atendimentos"
        descricao="Visualize o funil de atendimento"
      />

      <div className="mt-4">
        <Suspense fallback={
          <div className="flex gap-4 mt-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex-1 min-w-[280px] space-y-3">
                <Skeleton className="h-8 w-full rounded-lg" />
                <Skeleton className="h-24 w-full rounded-lg" />
                <Skeleton className="h-24 w-full rounded-lg" />
              </div>
            ))}
          </div>
        }>
          <KanbanView externalRefresh={refreshKey} />
        </Suspense>
      </div>
    </div>
  )
}
