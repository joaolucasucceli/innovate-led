"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams, usePathname } from "next/navigation"
import { useKanban } from "@/hooks/use-kanban"
import { KanbanBoard } from "./KanbanBoard"
import { KanbanFiltros } from "./KanbanFiltros"
import { Skeleton } from "@/components/ui/skeleton"
import { ErrorState } from "@/components/features/shared/ErrorState"

function KanbanSkeleton() {
  return (
    <div className="flex gap-4 mt-4">
      {Array.from({ length: 3 }).map((_, col) => (
        <div key={col} className="flex-1 min-w-[280px] space-y-3">
          <Skeleton className="h-8 w-full rounded-lg" />
          {Array.from({ length: 3 - col }).map((_, card) => (
            <Skeleton key={card} className="h-24 w-full rounded-lg" />
          ))}
        </div>
      ))}
    </div>
  )
}

interface KanbanViewProps {
  externalRefresh?: number
}

export function KanbanView({ externalRefresh }: KanbanViewProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const [responsavelId, setResponsavelId] = useState(searchParams.get("responsavel") || "")

  function handleResponsavelChange(valor: string) {
    setResponsavelId(valor)
    const params = new URLSearchParams(searchParams.toString())
    if (valor) params.set("responsavel", valor)
    else params.delete("responsavel")
    router.replace(`${pathname}?${params.toString()}`, { scroll: false })
  }

  const { colunas, total, carregando, erro, recarregar, moverLead } = useKanban({
    responsavelId: responsavelId || undefined,
  })

  useEffect(() => {
    if (externalRefresh) recarregar()
  }, [externalRefresh])

  if (carregando) return <KanbanSkeleton />
  if (erro) return <ErrorState mensagem={erro} onTentar={recarregar} />

  return (
    <div className="mt-4 min-w-0">
      <KanbanFiltros
        responsavelId={responsavelId}
        onResponsavelChange={handleResponsavelChange}
      />

      <p className="mb-3 text-sm text-muted-foreground">
        {total} {total === 1 ? "lead" : "leads"} no funil
      </p>

      <div className="overflow-hidden">
        <KanbanBoard colunas={colunas} moverLead={moverLead} />
      </div>
    </div>
  )
}
