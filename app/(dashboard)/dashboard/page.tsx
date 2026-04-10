"use client"

import { useState } from "react"
import { useSession } from "next-auth/react"
import { Users, UserPlus, TrendingUp, GitBranch, PieChart, Download } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { PageHeader } from "@/components/features/shared/PageHeader"
import { MetricCard } from "@/components/features/shared/MetricCard"
import { SkeletonCard } from "@/components/features/shared/SkeletonCard"
import { ErrorState } from "@/components/features/shared/ErrorState"
import { GraficoFunil } from "@/components/features/dashboard/GraficoFunil"
import { GraficoOrigem } from "@/components/features/dashboard/GraficoOrigem"
import { LeadsAlerta } from "@/components/features/dashboard/LeadsAlerta"
import { LeadsFollowUpAtivos } from "@/components/features/dashboard/LeadsFollowUpAtivos"
import { useDashboard } from "@/hooks/use-dashboard"
import { exportarRelatorio } from "@/hooks/use-relatorio"

export default function DashboardPage() {
  const { data: session } = useSession()
  const perfil = session?.user?.perfil
  const isGestor = perfil === "gestor"
  const [periodo, setPeriodo] = useState("mes")
  const { metricas, carregando, erro, recarregar } = useDashboard(periodo)

  if (carregando) {
    return (
      <div>
        <PageHeader
          titulo="Dashboard"
          descricao="Visão geral do funil e atividade"
        />
        <div className="mt-6">
          <SkeletonCard quantidade={3} />
        </div>
      </div>
    )
  }

  if (erro || !metricas) {
    return (
      <div>
        <PageHeader
          titulo="Dashboard"
          descricao="Visão geral do funil e atividade"
        />
        <div className="mt-6">
          <ErrorState mensagem={erro || "Erro ao carregar métricas"} onTentar={recarregar} />
        </div>
      </div>
    )
  }

  const labelPeriodo: Record<string, string> = {
    hoje: "hoje",
    semana: "na semana",
    mes: "no mês",
    total: "no total",
  }

  return (
    <div>
      <PageHeader
        titulo="Dashboard"
        descricao="Visão geral do funil e atividade"
      >
        <Select value={periodo} onValueChange={setPeriodo}>
          <SelectTrigger>
            <SelectValue placeholder="Período" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="hoje">Hoje</SelectItem>
            <SelectItem value="semana">Última semana</SelectItem>
            <SelectItem value="mes">Último mês</SelectItem>
            <SelectItem value="total">Total</SelectItem>
          </SelectContent>
        </Select>

        {isGestor && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <Download className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => exportarRelatorio("leads")}>
                Exportar Leads
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => exportarRelatorio("conversas")}>
                Exportar Conversas
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </PageHeader>

      {/* Metric Cards */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <MetricCard
          titulo="Total de Leads"
          valor={metricas.totalLeads}
          descricao={`${metricas.leadsNovosNoPeriodo} novos ${labelPeriodo[periodo]}`}
          icone={<Users className="h-5 w-5" />}
        />
        <MetricCard
          titulo="Novos no Período"
          valor={metricas.leadsNovosNoPeriodo}
          icone={<UserPlus className="h-5 w-5" />}
        />
        {isGestor ? (
          <MetricCard
            titulo="Taxa de Conversão"
            valor={`${metricas.taxaConversao}%`}
            descricao="Leads convertidos em venda"
            icone={<TrendingUp className="h-5 w-5" />}
          />
        ) : (
          <MetricCard
            titulo="Leads do Dia"
            valor={metricas.leadsHoje}
            descricao="Novos leads criados hoje"
            icone={<UserPlus className="h-5 w-5" />}
          />
        )}
      </div>

      {/* Gráficos */}
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center gap-2">
            <GitBranch className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-base">Funil por Etapa</CardTitle>
          </CardHeader>
          <CardContent>
            <GraficoFunil dados={metricas.leadsPorEtapa} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center gap-2">
            <PieChart className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-base">Leads por Origem</CardTitle>
          </CardHeader>
          <CardContent>
            <GraficoOrigem dados={metricas.leadsPorOrigem} />
          </CardContent>
        </Card>
      </div>

      {/* Alertas e Follow-ups */}
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <LeadsAlerta />
        <LeadsFollowUpAtivos />
      </div>
    </div>
  )
}
