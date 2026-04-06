"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams, usePathname } from "next/navigation"
import { useKanban } from "@/hooks/use-kanban"
import { KanbanBoard } from "./KanbanBoard"
import { KanbanFiltros } from "./KanbanFiltros"
import { LoadingState } from "@/components/features/shared/LoadingState"
import { ErrorState } from "@/components/features/shared/ErrorState"

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

  if (carregando) return <LoadingState />
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
