import { Kanban, Columns2, Bot, Hand, Filter } from "lucide-react"
import { HeroBanner } from "../HeroBanner"
import { FeaturesGrid } from "../FeaturesGrid"
import { ComoUsarSection } from "../ComoUsarSection"
import { PermissoesCallout } from "../PermissoesCallout"
import { DicaImportante } from "../DicaImportante"

export function ModuloAtendimentos() {
  return (
    <div className="space-y-8">
      <HeroBanner
        icone={<Kanban />}
        titulo="Atendimentos"
        subtitulo="Visualização em kanban do funil de atendimento com 6 etapas"
        gradientClasses="from-orange-500 to-amber-400"
      />

      <FeaturesGrid
        features={[
          {
            icone: <Columns2 />,
            titulo: "6 etapas do funil",
            descricao: "Qualificação → Encaminhado → Tarefa Criada → Em Negociação → Venda Realizada → Perdido.",
          },
          {
            icone: <Bot />,
            titulo: "Movimentação automática",
            descricao: "As primeiras etapas são movidas automaticamente pela Andressa conforme o atendimento via WhatsApp avança.",
          },
          {
            icone: <Hand />,
            titulo: "Ação manual (etapas finais)",
            descricao: "Em Negociação e Venda Realizada exigem ação manual do atendente ou gestor.",
          },
          {
            icone: <Filter />,
            titulo: "Filtros avançados",
            descricao: "Filtre cards por responsável, etapa ou busca por nome do lead.",
          },
        ]}
      />

      <ComoUsarSection
        passos={[
          {
            numero: 1,
            titulo: "Visualize o funil",
            descricao: "Cada coluna representa uma etapa. O número no cabeçalho mostra a quantidade de leads naquela etapa.",
          },
          {
            numero: 2,
            titulo: "Avance leads manualmente",
            descricao: "Use o menu do card (três pontos) ou arraste para mudar a etapa de um lead nas colunas manuais.",
          },
          {
            numero: 3,
            titulo: "Registre o motivo de perda",
            descricao: "Ao mover um lead para 'Perdido', informe o motivo. Esse dado alimenta os relatórios de perda.",
          },
        ]}
      />

      <div className="grid gap-4 md:grid-cols-2">
        <PermissoesCallout
          permissoes={[
            {
              perfil: "Gestor",
              acesso: "total",
              acoes: ["Move leads entre etapas", "Arquiva e reatribui leads", "Visualiza todos os responsáveis"],
            },
            {
              perfil: "Atendente",
              acesso: "total",
              acoes: ["Move leads nas etapas manuais", "Atualiza informações dos cards"],
            },
          ]}
        />
        <DicaImportante
          texto="A Andressa move leads automaticamente pelas primeiras etapas. A partir de 'Em Negociação', o time assume o controle manual do funil."
          variante="info"
        />
      </div>
    </div>
  )
}
