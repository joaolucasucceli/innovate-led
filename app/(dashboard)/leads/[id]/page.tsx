"use client"

import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, Mic } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PageHeader } from "@/components/features/shared/PageHeader"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { LoadingState } from "@/components/features/shared/LoadingState"
import { ErrorState } from "@/components/features/shared/ErrorState"
import { EmptyState } from "@/components/features/shared/EmptyState"
import { StatusBadge } from "@/components/features/shared/StatusBadge"
import { useLead } from "@/hooks/use-lead"
import { GaleriaFotos } from "@/components/features/leads/GaleriaFotos"

export default function LeadDetalhePage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const { lead, carregando, erro, recarregar } = useLead(id)

  if (carregando) {
    return (
      <div>
        <PageHeader titulo="Carregando..." />
        <div className="mt-6"><LoadingState /></div>
      </div>
    )
  }

  if (erro || !lead) {
    return (
      <div>
        <PageHeader titulo="Lead" />
        <div className="mt-6">
          <ErrorState mensagem={erro || "Lead não encontrado"} onTentar={recarregar} />
        </div>
      </div>
    )
  }

  return (
    <div>
      <Breadcrumb className="mb-4">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/leads">Leads</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{lead.nome}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <PageHeader titulo={lead.nome}>
        <Button variant="outline" onClick={() => router.push("/leads")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar
        </Button>
      </PageHeader>

      <Tabs defaultValue="dados" className="mt-6">
        <TabsList>
          <TabsTrigger value="dados">Dados</TabsTrigger>
          <TabsTrigger value="historico">Histórico de Atendimento</TabsTrigger>
          <TabsTrigger value="fotos">Fotos</TabsTrigger>
        </TabsList>

        <TabsContent value="dados" className="mt-4 grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Informações</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label>Nome</Label>
                <Input value={lead.nome} readOnly className="bg-muted cursor-default" />
              </div>
              <div className="grid gap-2">
                <Label>WhatsApp</Label>
                <Input value={lead.whatsapp} readOnly className="bg-muted cursor-default" />
              </div>
              <div className="grid gap-2">
                <Label>Email</Label>
                <Input value={lead.email || "—"} readOnly className="bg-muted cursor-default" />
              </div>
              <div className="grid gap-2">
                <Label>Responsável</Label>
                <Input
                  value={lead?.responsavel?.nome || "Sem responsável"}
                  readOnly
                  className="bg-muted cursor-default"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Qualificação</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label>Etapa no Funil</Label>
                <div className="flex items-center gap-2">
                  <StatusBadge status={lead.statusFunil} />
                </div>
              </div>
              <div className="grid gap-2">
                <Label>Origem</Label>
                <Input value={lead.origem || "—"} readOnly className="bg-muted cursor-default" />
              </div>
            </CardContent>
          </Card>

          {lead.sobreOLead && (
            <Card>
              <CardHeader>
                <CardTitle>Sobre o Lead</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground mb-2">
                  Gerenciado pelo agente IA
                </p>
                <Textarea value={lead.sobreOLead} readOnly rows={6} />
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="historico" className="mt-4">
          {lead.conversas.length === 0 ? (
            <EmptyState
              titulo="Sem conversas ainda"
              descricao="O histórico de conversas será exibido quando o agente IA iniciar atendimentos."
            />
          ) : (() => {
            // Agrupar conversas por ciclo
            const ciclosMap = new Map<number, typeof lead.conversas>()
            for (const conversa of lead.conversas) {
              const ciclo = conversa.ciclo ?? 1
              if (!ciclosMap.has(ciclo)) ciclosMap.set(ciclo, [])
              ciclosMap.get(ciclo)!.push(conversa)
            }
            const ciclosOrdenados = Array.from(ciclosMap.entries()).sort((a, b) => b[0] - a[0])

            return (
              <div className="space-y-6">
                {ciclosOrdenados.map(([ciclo, conversas]) => (
                  <div key={ciclo}>
                    {lead.ciclosCompletos > 0 && (
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                        {ciclo === 1 ? "1º Atendimento" : `${ciclo}º Atendimento (Retorno)`}
                      </p>
                    )}
                    <div className="space-y-4">
                      {conversas.map((conversa) => (
                        <Card key={conversa.id}>
                          <CardHeader>
                            <CardTitle className="text-sm">
                              Conversa — <StatusBadge status={conversa.etapa} />
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-2">
                            {conversa.mensagens.map((msg) => {
                              const ehAgente = msg.remetente === "agente"
                              const temMidia = msg.mediaUrl && msg.tipo !== "texto"
                              return (
                                <div
                                  key={msg.id}
                                  className={`flex ${ehAgente ? "justify-end" : "justify-start"}`}
                                >
                                  <div
                                    className={`max-w-[75%] rounded-2xl px-4 py-2 text-sm ${
                                      ehAgente
                                        ? "bg-primary text-primary-foreground rounded-tr-sm"
                                        : "bg-muted text-foreground rounded-tl-sm"
                                    }`}
                                  >
                                    <p className={`text-xs mb-1 font-medium ${ehAgente ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                                      {ehAgente ? "Lívia" : lead.nome.split(" ")[0]}
                                    </p>
                                    {temMidia && msg.tipo === "imagem" && (
                                      <img
                                        src={msg.mediaUrl!}
                                        alt="Foto enviada"
                                        className="max-w-[240px] rounded-md mb-1 cursor-pointer"
                                        onClick={() => window.open(msg.mediaUrl!, "_blank")}
                                      />
                                    )}
                                    {temMidia && msg.tipo === "audio" && (
                                      <div className="flex items-center gap-2 mb-1">
                                        <Mic className={`h-4 w-4 ${ehAgente ? "text-primary-foreground/70" : "text-muted-foreground"}`} />
                                        <span className={`text-xs ${ehAgente ? "text-primary-foreground/70" : "text-muted-foreground"}`}>Áudio transcrito</span>
                                      </div>
                                    )}
                                    {(!temMidia || msg.conteudo) && (
                                      <p>{msg.conteudo}</p>
                                    )}
                                    <p className={`text-xs mt-1 text-right ${ehAgente ? "text-primary-foreground/60" : "text-muted-foreground"}`}>
                                      {new Date(msg.criadoEm).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                                    </p>
                                  </div>
                                </div>
                              )
                            })}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )
          })()}
        </TabsContent>

        <TabsContent value="fotos" className="mt-4">
          <GaleriaFotos
            leadId={lead.id}
            fotosIniciais={lead.fotos}
          />
        </TabsContent>

      </Tabs>
    </div>
  )
}
