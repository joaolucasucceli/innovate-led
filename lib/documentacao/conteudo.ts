/**
 * DOCUMENTAÇÃO CENTRALIZADA — Central Innovate Brazil
 *
 * Este arquivo é a FONTE DE VERDADE da documentação do sistema.
 * Toda sprint, feature ou mudança deve atualizar este conteúdo.
 * O botão "Baixar Documentação" na página /documentacao gera
 * o arquivo .md a partir deste módulo.
 */

export const VERSAO_DOCUMENTACAO = "1.0.0"
export const DATA_ATUALIZACAO = "2026-04-06"

export const DOCUMENTACAO_MD = `# Documentação — Central Innovate Brazil
> Versão ${VERSAO_DOCUMENTACAO} · Atualizado em ${DATA_ATUALIZACAO}

Sistema web para gestão comercial da Innovate Brazil — empresa especializada em painéis de LED.
Dois módulos integrados em uma única aplicação Next.js:
- **Painel de Gestão** — kanban, leads, métricas, gestão comercial
- **Agente IA WhatsApp (Lívia)** — pré-qualificação autônoma de leads via WhatsApp

---

## Stack Tecnológica

| Camada | Tecnologia |
|--------|-----------|
| Framework | Next.js 16 (App Router + Turbopack) |
| UI | shadcn/ui 4 (preset b1Ymqvi3U) |
| Estilização | Tailwind CSS 4 |
| Banco de dados | PostgreSQL via Supabase |
| ORM | Prisma 7 |
| Autenticação | NextAuth.js (Credentials Provider) |
| Cache/Buffer | Redis (Upstash) |
| IA | OpenAI GPT-4o (chat), Whisper (áudio), GPT-4o-mini (visão) |
| WhatsApp | Uazapi (gateway) |
| Integrações | n8n + Kommo CRM |
| Deploy | Vercel |
| Real-time | Supabase Realtime (postgres_changes) |

---

## Atualizações em Tempo Real

O sistema utiliza **Supabase Realtime** para manter os dados atualizados automaticamente em todas as telas, sem necessidade de recarregar a página.

### Como funciona
- Um canal WebSocket conecta o navegador ao banco de dados via Supabase
- Quando qualquer dado é criado, atualizado ou removido, a tela se atualiza automaticamente
- Debounce de 300ms evita múltiplas atualizações simultâneas
- Polling de fallback continua ativo em intervalos maiores (2-5 minutos)

### Tabelas monitoradas em tempo real
| Tabela | Páginas afetadas |
|--------|-----------------|
| leads | Kanban, Dashboard, Lista de Leads |
| mensagens_whatsapp | Notificações, Atendimentos |
| conversas | Kanban (preview de mensagens) |

### Notificações automáticas (toasts)
- **Novo lead recebido** — quando um lead é criado (ex: pelo agente IA)
- **Nova mensagem recebida** — quando um lead envia mensagem via WhatsApp

---

## Perfis de Usuário

| Perfil | Acesso |
|--------|--------|
| **Gestor** | Total — todas as telas e funcionalidades |
| **Atendente** | Operacional — Dashboard, Atendimentos, Leads |

> O usuário "Lívia" é do tipo IA com perfil Atendente. Nunca deve ser desativado.

---

## Módulo 1 — Dashboard

Dashboard unificado com todas as métricas do sistema em página única com scroll.

### Funcionalidades

- **Métricas principais** — Total de leads, novos no período, vendas realizadas e taxa de conversão (gestor) / leads do dia (atendente)
- **Funil por etapa** — Gráfico de barras com a distribuição dos leads nas 6 etapas do kanban
- **Resumo Lívia** (gestor) — Card compacto com mensagens enviadas e follow-ups da IA
- **Leads em alerta** — Leads sem movimentação há 3+ dias com link direto para o perfil
- **Exportar CSV** (gestor) — Botão para exportar leads ou conversas em CSV

### Como usar

1. Selecione o período (Hoje / Última semana / Último mês / Total) no seletor superior
2. Analise os KPIs nos cards do topo
3. Verifique o card de resumo da Lívia e os leads em alerta
4. Use o botão de download para exportar dados em CSV

### Permissões

| Perfil | Acesso |
|--------|--------|
| Gestor | Total — vê taxa de conversão, resumo da IA, leads em alerta e pode exportar CSV |
| Atendente | Parcial — vê leads do dia, funil e leads em alerta |

> O Dashboard é atualizado a cada acesso. Recarregue para ver dados frescos.

---

## Módulo 2 — Leads

Gestão completa da base de leads e potenciais clientes interessados em painéis de LED.

### Funcionalidades

- **Busca e filtros** — Filtre por nome, WhatsApp, etapa do funil e status de arquivamento
- **Cadastro de leads** — Crie leads com nome, WhatsApp e origem
- **Exportação CSV** — Exporte a lista filtrada para análise em planilhas
- **Perfil completo** — Histórico de conversas e informações de qualificação

### Como usar

1. Use os filtros de etapa, status e busca para segmentar a lista
2. Clique em "Novo Lead" para cadastrar (nome e WhatsApp são obrigatórios)
3. Clique em qualquer linha para abrir o perfil completo
4. Com filtros aplicados, clique em "Exportar CSV" para gerar relatório segmentado

### Permissões

| Perfil | Acesso |
|--------|--------|
| Gestor | Total — cria, edita, arquiva, reatribui e exporta |
| Atendente | Total — cria, edita e visualiza |

> **Atenção:** O WhatsApp é único no sistema. A Lívia usa esse campo para identificar o lead. Nunca cadastre o mesmo número para dois leads.

---

## Módulo 3 — Atendimentos (Kanban)

Visualização em kanban do funil comercial com 6 etapas.

### Etapas do Funil

| # | Etapa | Movimentação |
|---|-------|-------------|
| 1 | Qualificação | Automática (Lívia) |
| 2 | Encaminhado | Automática (Lívia) |
| 3 | Tarefa Criada | Automática (Lívia) |
| 4 | Em Negociação | Manual |
| 5 | Venda Realizada | Manual |
| 6 | Perdido | Manual |

### Funcionalidades

- **6 etapas do funil** — Visualização completa da jornada comercial do lead
- **Movimentação automática** — Etapas 1 a 3 movidas pela Lívia via WhatsApp
- **Ação manual (etapas 4–5)** — Controle manual do time comercial
- **Filtros avançados** — Por responsável, etapa ou nome
- **Chat WhatsApp integrado** — Alternância entre modo IA e modo humano

### Como usar

1. Observe cada coluna representando uma etapa (número no cabeçalho = quantidade de leads)
2. Use o menu do card (três pontos) para mudar a etapa de um lead nas colunas 4 e 5
3. Ao mover para "Perdido", informe o motivo (alimenta relatórios de perda)
4. Clique no card para abrir o chat WhatsApp com alternância IA/humano

### Permissões

| Perfil | Acesso |
|--------|--------|
| Gestor | Total — move, arquiva e reatribui leads |
| Atendente | Total — move e atualiza cards |

> A Lívia move leads automaticamente até "Tarefa Criada" (etapa 3). A partir daí, o time comercial assume a negociação.

---

## Módulo 4 — Atendimentos (Chat WhatsApp)

Interface de chat para atendimento via WhatsApp com alternância entre modo IA e modo humano.

### Funcionalidades

- **Lista de conversas** — Todas as conversas ativas com preview da última mensagem
- **Chat em tempo real** — Envio e recebimento de mensagens WhatsApp
- **Modo IA / Humano** — Toggle para ativar ou desativar a Lívia em cada conversa
- **Histórico completo** — Todas as mensagens trocadas com o lead

### Como usar

1. Selecione uma conversa na lista lateral
2. Visualize o histórico de mensagens
3. Use o toggle para alternar entre modo IA (Lívia responde) e modo humano (consultor responde)
4. No modo humano, digite e envie mensagens diretamente

### Permissões

| Perfil | Acesso |
|--------|--------|
| Gestor | Total — visualiza e interage em todas as conversas |
| Atendente | Total — visualiza e interage nas conversas atribuídas |

---

## Módulo 5 — Lívia (Agente IA)

Agente de pré-qualificação IA para leads interessados em painéis de LED.

### Arquitetura do Agente

\`\`\`
POST /api/webhooks/whatsapp
  → detectar tipo de conteúdo
  → processar mídia (Whisper/GPT-4o-mini)
  → buffer Redis (debounce 20s)
  → concatenar mensagens
  → GPT-4o (system prompt + memória Redis, 20 msgs)
  → segmentar resposta
  → enviar via Uazapi (delay aleatório 3-5s entre mensagens)
\`\`\`

### Fluxo de Pré-Qualificação

1. **Qualificação** — Coleta nome, interesse no produto (tipo de painel, tamanho, aplicação) e informações do lead
2. **Encaminhamento** — Encaminha o lead qualificado para um consultor comercial via n8n/Kommo
3. **Criação de Tarefa** — Cria tarefa no Kommo CRM para acompanhamento do consultor

### Ferramentas do Agente (3 endpoints)

| Endpoint | Função |
|----------|--------|
| \`/api/agente/salvar-qualificacao\` | Salva dados coletados na pré-qualificação do lead |
| \`/api/agente/encaminhar-contato\` | Encaminha lead qualificado para consultor via n8n/Kommo |
| \`/api/agente/criar-tarefa\` | Cria tarefa no CRM para acompanhamento comercial |

### Integração n8n + Kommo

- A Lívia dispara webhooks para o n8n ao encaminhar contatos e criar tarefas
- O n8n processa e cria/atualiza registros no Kommo CRM
- Leads qualificados são atribuídos automaticamente a consultores comerciais

### Automações CRON

| Automação | Frequência | Descrição |
|-----------|-----------|-----------|
| Follow-ups | A cada hora | Envia follow-up após última mensagem sem resposta |
| Auto-close | A cada hora | Fecha conversas inativas por mais de 48h |

### Métricas

As métricas da Lívia (mensagens, follow-ups) estão no **Dashboard** — card "Lívia".

> A Lívia opera 24/7. Configure o WhatsApp em Configurações para ela funcionar.

---

## Módulo 6 — Exportação de Dados

Exportação de relatórios em CSV, disponível no Dashboard (botão de download).

### Tipos de Exportação

| Tipo | Conteúdo |
|------|---------|
| **Leads** | ID, nome, WhatsApp, e-mail, origem, status no funil, datas |
| **Conversas** | ID, lead, total de mensagens, última atualização, encerramento |

### Como usar

1. No Dashboard, clique no ícone de download (canto superior direito)
2. Selecione o tipo de exportação desejado
3. O arquivo CSV será baixado automaticamente

### Permissões

| Perfil | Acesso |
|--------|--------|
| Gestor | Total — exporta todos os tipos |
| Atendente | Sem acesso |

---

## Módulo 7 — Configurações

Integrações e configurações gerais do sistema.

### Seções

#### WhatsApp (Uazapi)
- Gateway para recebimento e envio de mensagens pela Lívia
- Configuração: inserir URL + token da Uazapi → escanear QR Code
- Gestão de instâncias WhatsApp

#### Usuários e Permissões
- Gerenciamento de acesso e perfis dos usuários da plataforma
- Criação, edição e desativação de usuários
- Definição de perfil (Gestor ou Atendente)

### Permissões

| Perfil | Acesso |
|--------|--------|
| Gestor | Total — configura integrações e gerencia usuários |
| Atendente | Sem acesso |

> Sem WhatsApp conectado, a Lívia fica silenciosa.

---

## Módulo 8 — Documentação

Página de documentação do sistema com botão para download do arquivo .md completo.

### Funcionalidades

- **Visualização** — Documentação completa renderizada na página
- **Download** — Botão para baixar o arquivo .md atualizado

### Permissões

| Perfil | Acesso |
|--------|--------|
| Gestor | Total |
| Atendente | Total |

---

## Modelo de Dados — Referência Rápida

### Lead
\`\`\`
id | nome | whatsapp (único) | email | statusFunil | etapaConversa
origem | sobreOLead (append-only) | responsavelId
arquivado | motivoPerda
\`\`\`

### Conversa
\`\`\`
id | leadId | etapa | ultimaMensagemEm | followUpEnviados[]
\`\`\`

### MensagemWhatsapp
\`\`\`
id | conversaId | messageIdWhatsapp (único) | tipo | conteudo | remetente
\`\`\`

### Usuario
\`\`\`
id | nome | email (único) | senha (bcrypt) | perfil (gestor/atendente)
tipo (humano/ia) | ativo | criadoEm | atualizadoEm | deletadoEm
\`\`\`

### ConfigWhatsapp
\`\`\`
id | uazapiUrl | adminToken | instanceId | instanceToken
numeroWhatsapp | webhookUrl | ativo
\`\`\`

---

## Segurança da API

- Rotas do painel: validam sessão NextAuth (\`getServerSession\`)
- Rotas do agente (\`/api/agente/*\`): validam header \`x-api-secret\`
- Endpoint webhook: valida payload da Uazapi

---

## Convenções de Código

- Todo código de domínio em **português** (campos, variáveis, labels)
- Estrutura de pastas em **português**
- \`Lead.sobreOLead\` — texto cumulativo, nunca sobrescrever, apenas append
- Soft deletes via campo \`deletadoEm\`
- Componentes de UI: usar **apenas shadcn/ui**
- StatusBadge — único componente para cores de status
- ConfirmDialog — único diálogo de confirmação destrutiva
- MetricCard — único card de número/métrica
- DataTable — única tabela com filtro/paginação

---

*Documentação gerada pelo sistema Central Innovate Brazil — ${DATA_ATUALIZACAO}*
`

export const NOME_ARQUIVO_DOWNLOAD = `documentacao-central-innovate-v${VERSAO_DOCUMENTACAO}.md`
