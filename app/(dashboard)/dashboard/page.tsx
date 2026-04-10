"use client"

import { Users, GitBranch } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PageHeader } from "@/components/features/shared/PageHeader"
import { MetricCard } from "@/components/features/shared/MetricCard"
import { SkeletonCard } from "@/components/features/shared/SkeletonCard"
import { ErrorState } from "@/components/features/shared/ErrorState"
import { GraficoFunil } from "@/components/features/dashboard/GraficoFunil"
import { useDashboard } from "@/hooks/use-dashboard"

export default function DashboardPage() {
  const { metricas, carregando, erro, recarregar } = useDashboard("total")

  if (carregando) {
    return (
      <div>
        <PageHeader
          titulo="Dashboard"
          descricao="Visao geral do funil de atendimento"
        />
        <div className="mt-6">
          <SkeletonCard quantidade={1} />
        </div>
      </div>
    )
  }

  if (erro || !metricas) {
    return (
      <div>
        <PageHeader
          titulo="Dashboard"
          descricao="Visao geral do funil de atendimento"
        />
        <div className="mt-6">
          <ErrorState mensagem={erro || "Erro ao carregar metricas"} onTentar={recarregar} />
        </div>
      </div>
    )
  }

  return (
    <div>
      <PageHeader
        titulo="Dashboard"
        descricao="Visao geral do funil de atendimento"
      />

      <div className="mt-6">
        <MetricCard
          titulo="Total de Leads Atendidos"
          valor={metricas.totalLeads}
          icone={<Users className="h-5 w-5" />}
        />
      </div>

      <div className="mt-4">
        <Card>
          <CardHeader className="flex flex-row items-center gap-2">
            <GitBranch className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-base">Funil por Etapa</CardTitle>
          </CardHeader>
          <CardContent>
            <GraficoFunil dados={metricas.leadsPorEtapa} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
