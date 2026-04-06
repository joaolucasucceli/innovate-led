import {
  LayoutDashboard,
  UserSearch,
  Kanban,
  Settings,
} from "lucide-react"
import { PageHeader } from "@/components/features/shared/PageHeader"
import { TabsDocumentacao } from "@/components/features/documentacao/TabsDocumentacao"
import { BotaoDownloadDoc } from "@/components/features/documentacao/BotaoDownloadDoc"
import { ModuloDashboard } from "@/components/features/documentacao/modulos/ModuloDashboard"
import { ModuloLeads } from "@/components/features/documentacao/modulos/ModuloLeads"
import { ModuloAtendimentos } from "@/components/features/documentacao/modulos/ModuloAtendimentos"
import { ModuloConfiguracoes } from "@/components/features/documentacao/modulos/ModuloConfiguracoes"

export default function DocumentacaoPage() {
  const abas = [
    {
      valor: "dashboard",
      titulo: "Dashboard",
      icone: <LayoutDashboard className="h-3.5 w-3.5" />,
      conteudo: <ModuloDashboard />,
    },
    {
      valor: "atendimentos",
      titulo: "Atendimentos",
      icone: <Kanban className="h-3.5 w-3.5" />,
      conteudo: <ModuloAtendimentos />,
    },
    {
      valor: "leads",
      titulo: "Leads",
      icone: <UserSearch className="h-3.5 w-3.5" />,
      conteudo: <ModuloLeads />,
    },
    {
      valor: "configuracoes",
      titulo: "Configurações",
      icone: <Settings className="h-3.5 w-3.5" />,
      conteudo: <ModuloConfiguracoes />,
    },
  ]

  return (
    <>
      <PageHeader
        titulo="Documentação"
        descricao="Guia completo de uso da Central Innovate — selecione um módulo para começar"
      >
        <BotaoDownloadDoc />
      </PageHeader>
      <TabsDocumentacao abas={abas} />
    </>
  )
}
