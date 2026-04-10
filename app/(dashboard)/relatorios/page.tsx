"use client"

import { useState } from "react"
import { FileText, Users, ShieldCheck } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { PageHeader } from "@/components/features/shared/PageHeader"
import { useRelatorios, type RelatorioIA } from "@/hooks/use-relatorios"

function formatarData(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "America/Sao_Paulo",
  })
}

function CardRelatorio({ relatorio }: { relatorio: RelatorioIA }) {
  const [expandido, setExpandido] = useState(false)

  return (
    <Card
      className="cursor-pointer transition-colors hover:bg-muted/50"
      onClick={() => setExpandido(!expandido)}
    >
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">
            {formatarData(relatorio.dataRef)}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="secondary">{relatorio.conversas} conversas</Badge>
            <Badge variant="outline">{relatorio.leads} leads</Badge>
          </div>
        </div>
      </CardHeader>
      {expandido && (
        <CardContent>
          <div className="prose prose-sm max-w-none dark:prose-invert whitespace-pre-wrap">
            {relatorio.conteudo}
          </div>
        </CardContent>
      )}
    </Card>
  )
}

function ListaRelatorios({ tipo }: { tipo: "publico" | "qualidade" }) {
  const { relatorios, carregando, erro } = useRelatorios(tipo)

  if (carregando) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    )
  }

  if (erro) {
    return <p className="text-sm text-muted-foreground">{erro}</p>
  }

  if (relatorios.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <FileText className="h-10 w-10 text-muted-foreground/50" />
        <p className="mt-3 text-sm text-muted-foreground">
          Nenhum relatorio gerado ainda.
        </p>
        <p className="text-xs text-muted-foreground">
          Os relatorios sao gerados automaticamente todos os dias as 06h.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {relatorios.map((r) => (
        <CardRelatorio key={r.id} relatorio={r} />
      ))}
    </div>
  )
}

export default function RelatoriosPage() {
  return (
    <div>
      <PageHeader
        titulo="Relatorios IA"
        descricao="Analises diarias geradas automaticamente"
      />

      <div className="mt-6">
        <Tabs defaultValue="publico">
          <TabsList>
            <TabsTrigger value="publico" className="gap-1.5">
              <Users className="h-4 w-4" />
              Publico
            </TabsTrigger>
            <TabsTrigger value="qualidade" className="gap-1.5">
              <ShieldCheck className="h-4 w-4" />
              Qualidade
            </TabsTrigger>
          </TabsList>

          <TabsContent value="publico" className="mt-4">
            <ListaRelatorios tipo="publico" />
          </TabsContent>

          <TabsContent value="qualidade" className="mt-4">
            <ListaRelatorios tipo="qualidade" />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
