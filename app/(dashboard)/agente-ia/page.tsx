"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PageHeader } from "@/components/features/shared/PageHeader"
import { SecaoIdentidade } from "@/components/features/agente-ia/SecaoIdentidade"
import { SecaoScript } from "@/components/features/agente-ia/SecaoScript"
import { SecaoFerramentas } from "@/components/features/agente-ia/SecaoFerramentas"

export default function AgenteIAPage() {
  return (
    <div>
      <PageHeader
        titulo="Agente IA"
        descricao="Conheca a Livia — assistente de pre-atendimento da Innovate Brazil"
      />

      <Tabs defaultValue="persona" className="mt-6">
        <TabsList className="flex w-full overflow-x-auto">
          <TabsTrigger value="persona">Persona</TabsTrigger>
          <TabsTrigger value="processo">Processo</TabsTrigger>
          <TabsTrigger value="ferramentas">Ferramentas</TabsTrigger>
        </TabsList>

        <TabsContent value="persona" className="mt-4">
          <SecaoIdentidade />
        </TabsContent>

        <TabsContent value="processo" className="mt-4">
          <SecaoScript />
        </TabsContent>

        <TabsContent value="ferramentas" className="mt-4">
          <SecaoFerramentas />
        </TabsContent>
      </Tabs>
    </div>
  )
}
