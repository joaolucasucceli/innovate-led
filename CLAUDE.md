# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Visão Geral do Projeto

**Central Innovate** — sistema web para gestão de pré-atendimento da Innovate Brazil, empresa especializada em painéis LED. Dois módulos integrados em uma única aplicação Next.js:

1. **Painel de Gestão** — kanban, leads, métricas, roadmap
2. **Agente IA WhatsApp ("Andressa")** — pré-qualificação autônoma de leads via API Routes, alimentando o painel em tempo real + integração com Kommo CRM via n8n webhooks

## Stack Tecnológica

- **Framework:** Next.js 16 (App Router + Turbopack)
- **UI:** shadcn/ui 4 exclusivamente — nunca criar botões, inputs ou cards do zero
- **Estilização:** Tailwind CSS 4
- **Banco de Dados:** PostgreSQL via Supabase, ORM: Prisma 7
- **Autenticação:** NextAuth.js 4 (Credentials Provider + JWT)
- **Cache/Buffer:** Redis (Upstash)
- **IA:** OpenAI GPT-4o (chat), Whisper (áudio), GPT-4o-mini (visão/classificação)
- **WhatsApp:** Uazapi v2 (gateway)
- **CRM Externo:** Kommo via n8n webhooks
- **Data Fetching:** SWR
- **Validação:** Zod
- **Deploy:** Vercel

## Comandos Comuns

```bash
# Setup inicial
npm install

# Banco de dados
npx prisma generate
npx prisma db push
npx prisma db seed

# Desenvolvimento
npm run dev

# Prisma
npx prisma studio
```

## Arquitetura

### Perfis de Usuário e Permissões

Dois perfis: **Gestor** (acesso total), **Atendente** (operacional). O agente IA é um usuário especial do tipo Atendente (`tipo: "ia"`) que opera exclusivamente via API Routes.

### Funil Kanban (6 colunas)

| Coluna | Quem move | Descrição |
|--------|-----------|-----------|
| qualificacao | IA | Andressa coletando informações do lead |
| encaminhado | IA | Lead qualificado, encaminhado ao comercial |
| tarefa_criada | IA | Tarefa de ligação criada para consultor |
| em_negociacao | Humano | Consultor em contato com o lead |
| venda_realizada | Humano | Negócio fechado |
| perdido | Humano/IA | Lead perdido |

Colunas 1-3 são movidas automaticamente pelo agente IA. Colunas 4-5 exigem ação manual. Coluna 6 (Perdido) é manual.

### Arquitetura do Agente IA

Fluxo do webhook: `POST /api/webhooks/whatsapp` → detectar tipo de conteúdo → processar mídia se necessário → buffer Redis (debounce 20s, chave: `{chat_id}_buf_innovate`) → concatenar mensagens → GPT-4o com system prompt + memória Redis (20 msgs, chave: `{chat_id}_mem_innovate`) → segmentar resposta → enviar via Uazapi com delay aleatório de 3-5s entre mensagens.

O agente tem 3 ferramentas em `/api/agente/*`:
- `salvar-qualificacao` — salva dados + webhook n8n → Kommo
- `encaminhar-contato` — avança funil + webhook n8n → Kommo
- `criar-tarefa` — cria tarefa comercial + webhook n8n → Kommo

Rotas de infraestrutura (usadas pelo loop, não pelo agente GPT):
- `consultar-lead` — busca/cria lead por WhatsApp
- `registrar-mensagem` — registra mensagem no banco

### Integração n8n / Kommo CRM

As 3 ferramentas do agente fazem dual-write:
1. Atualizam o banco local (PostgreSQL) para o dashboard
2. Disparam webhook n8n (fire-and-forget) que sincroniza com Kommo CRM

Variáveis de ambiente: `N8N_WEBHOOK_SALVAR_QUALIFICACAO_URL`, `N8N_WEBHOOK_ENCAMINHA_CONTATO_URL`, `N8N_WEBHOOK_CRIAR_TAREFA_URL`

### Segurança da API

- Rotas internas do agente validam header `x-api-secret`
- Rotas do painel validam sessão do usuário
- Endpoint do webhook valida payload da Uazapi

### Regras de Componentes

- `components/ui/` — shadcn/ui gerado, não editar
- `components/features/` — componentes de domínio organizados por módulo
- **StatusBadge** é o único componente que define cores de status
- **ConfirmDialog** é o único diálogo de confirmação destrutiva
- **MetricCard** é o único card de número/métrica
- **DataTable** é a única tabela com filtro/paginação
- **PageHeader** é obrigatório no topo de toda página

### Convenção de Estrutura de Pastas

- `app/(dashboard)/` — páginas do painel com sidebar + verificação de perfil
- `app/api/agente/` — ferramentas do agente IA (5 endpoints)
- `lib/agente/` — internos do agente: buffer, memória, processamento de mídia, prompt, ferramentas, sincronização do kanban
- `prisma/seed.ts` — seed com usuário IA Andressa + admin

## Notas do Modelo de Dados

- `Lead.sobreOLead` é texto cumulativo — nunca sobrescrever, apenas adicionar (append)
- `Lead.whatsapp` é único — usado para dedup
- `MensagemWhatsapp.messageIdWhatsapp` é único — usado para dedup de mensagens
- Todos os nomes de campos dos modelos estão em português (camelCase)

## Documentação — Regra Obrigatória

O arquivo de documentação centralizada fica em: `lib/documentacao/conteudo.ts`

**Toda sprint, feature ou mudança no sistema DEVE atualizar esse arquivo.**

## Idioma

O sistema é **100% brasileiro**. Todo o código usa português para termos de domínio. Manter essa convenção.

### Configurações regionais:
- **Timezone:** `America/Sao_Paulo`
- **Locale:** `pt-BR`
- **Moeda:** BRL (R$)
- **Formato de data:** `dd/MM/yyyy`
- **Formato de telefone:** `+55 (XX) XXXXX-XXXX`
