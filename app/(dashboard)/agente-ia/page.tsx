// Conteúdo baseado em lib/agente/prompt.ts e lib/agente/ferramentas.ts
// Atualizar manualmente se o prompt ou ferramentas forem alterados
"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PageHeader } from "@/components/features/shared/PageHeader"
import { SecaoIdentidade } from "@/components/features/agente-ia/SecaoIdentidade"
import { SecaoScript } from "@/components/features/agente-ia/SecaoScript"
import { SecaoFerramentas } from "@/components/features/agente-ia/SecaoFerramentas"
import { SecaoFluxoTecnico } from "@/components/features/agente-ia/SecaoFluxoTecnico"
import { SecaoBaseConhecimento } from "@/components/features/agente-ia/SecaoBaseConhecimento"

export default function AgenteIAPage() {
  return (
    <div>
      <PageHeader
        titulo="Agente IA"
        descricao="Conheça a Lívia — assistente de pré-atendimento da Innovate Brazil"
      />

      <Tabs defaultValue="identidade" className="mt-6">
        <TabsList className="flex w-full overflow-x-auto">
          <TabsTrigger value="identidade">Identidade</TabsTrigger>
          <TabsTrigger value="script">Script</TabsTrigger>
          <TabsTrigger value="ferramentas">Ferramentas</TabsTrigger>
          <TabsTrigger value="fluxo">Fluxo Técnico</TabsTrigger>
          <TabsTrigger value="conhecimento">Base de Conhecimento</TabsTrigger>
        </TabsList>

        <TabsContent value="identidade" className="mt-4">
          <SecaoIdentidade />
        </TabsContent>

        <TabsContent value="script" className="mt-4">
          <SecaoScript />
        </TabsContent>

        <TabsContent value="ferramentas" className="mt-4">
          <SecaoFerramentas />
        </TabsContent>

        <TabsContent value="fluxo" className="mt-4">
          <SecaoFluxoTecnico />
        </TabsContent>

        <TabsContent value="conhecimento" className="mt-4">
          <SecaoBaseConhecimento />
        </TabsContent>
      </Tabs>
    </div>
  )
}
