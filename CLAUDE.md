# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Visao Geral do Projeto

**Central Innovate** — sistema web para gestao de pre-atendimento da Innovate Brazil, empresa especializada em paineis LED. Dois modulos integrados em uma unica aplicacao Next.js:

1. **Painel de Gestao** — dashboard, kanban, leads, relatorios IA
2. **Agente IA WhatsApp ("Livia")** — pre-qualificacao autonoma de leads via API Routes, alimentando o painel em tempo real + integracao direta com Kommo CRM

## Stack Tecnologica

- **Framework:** Next.js 16 (App Router + Turbopack)
- **UI:** shadcn/ui 4 exclusivamente — nunca criar botoes, inputs ou cards do zero
- **Estilizacao:** Tailwind CSS 4
- **Banco de Dados:** PostgreSQL via Supabase, ORM: Prisma 7
- **Autenticacao:** NextAuth.js 4 (Credentials Provider + JWT)
- **Cache/Buffer:** Redis (Upstash)
- **IA:** OpenAI GPT-4o (chat), Whisper (audio), GPT-4o-mini (visao/classificacao)
- **WhatsApp:** Uazapi v2 (gateway)
- **CRM Externo:** Kommo — integracao direta via API (`lib/kommo.ts`)
- **Data Fetching:** SWR
- **Validacao:** Zod
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

### Perfis de Usuario e Permissoes

Dois perfis: **Gestor** (acesso total), **Atendente** (operacional). O agente IA e um usuario especial do tipo Atendente (`tipo: "ia"`) que opera exclusivamente via API Routes.

### Funil Kanban (3 etapas)

| Etapa | Quem move | Descricao |
|-------|-----------|-----------|
| acolhimento | IA | Livia acolhendo e capturando nome |
| qualificacao | IA | Livia coletando informacoes do projeto |
| encaminhado | IA | Lead qualificado, encaminhado ao comercial |

Apenas essas 3 etapas existem no enum `StatusFunil`. Apos encaminhamento, IA para de responder (gate no webhook).

### Arquitetura do Agente IA

Fluxo do webhook: `POST /api/webhooks/whatsapp` → detectar tipo de conteudo → processar midia se necessario → buffer Redis (debounce 20s, chave: `{chat_id}_buf_innovate`) → **digitando imediato** (antes do debounce) → concatenar mensagens → GPT-4o com system prompt dinamico (base de conhecimento do banco) + memoria Redis (20 msgs, chave: `{chat_id}_mem_innovate`) → segmentar resposta por delimitador `---` (ou fallback `\n\n`, max 300 chars) → **digitando + delay proporcional antes de cada mensagem** → enviar via Uazapi com delay aleatorio de 3-5s entre mensagens.

#### Humanizacao do Atendimento

- **Sempre online**: Ao conectar, webhook chama `POST /instance/privacy` com `online: "all"` e `last: "none"`
- **Digitando imediato**: Indicador "digitando..." enviado antes do debounce de 20s (usuario ve que a IA "leu")
- **Digitando por segmento**: Re-enviado antes de cada mensagem com delay proporcional ao tamanho do texto (max 3s)
- **Saudacao com horario**: `obterSaudacao()` retorna "Bom dia!", "Boa tarde!" ou "Boa noite!" baseado no horario SP
- **Fragmentacao natural**: Prompt usa `---` como delimitador para mensagens WhatsApp individuais

#### Monitoramento de Conexao

- Webhook trata `EventType: "connection"` e atualiza `configWhatsapp.ativo` no banco em tempo real
- Status API (`/api/whatsapp/status`) marca `ativo: false` quando chamada ao Uazapi falha (nao retorna dado velho)
- Frontend (`hooks/use-config-whatsapp.ts`) faz polling a cada 30s para detectar desconexoes automaticamente

O agente tem 3 ferramentas em `/api/agente/*`:
- `salvar-qualificacao` — salva dados no banco + cria/atualiza lead no Kommo
- `encaminhar-contato` — avanca funil + sincroniza Kommo
- `criar-tarefa` — cria tarefa de ligacao + sincroniza Kommo

Rotas de infraestrutura (usadas pelo loop, nao pelo agente GPT):
- `consultar-lead` — busca/cria lead por WhatsApp
- `registrar-mensagem` — registra mensagem no banco (busca conversa existente antes de criar nova)

### Integracao Kommo CRM

Integracao direta via API REST (`lib/kommo.ts`). As 3 ferramentas do agente fazem dual-write:
1. Atualizam o banco local (PostgreSQL) para o dashboard
2. Sincronizam com Kommo CRM via API direta (fire-and-forget)

Variavel de ambiente: `KOMMO_API_TOKEN`

### Base de Conhecimento Dinamica

A base de conhecimento da Livia e armazenada no banco (tabela `artigos_documentacao`, secao `base-conhecimento`). O prompt carrega do banco em tempo real via `carregarBaseConhecimento()` em `lib/agente/prompt.ts`. Se o banco estiver indisponivel, usa fallback hardcoded.

O cliente edita a base via pagina `/base-conhecimento` (CRUD com acordeoes).

### CRONs Automaticos

Configurados em `vercel.json`:
- `/api/cron/follow-ups` — a cada hora, envia follow-ups automaticos
- `/api/cron/auto-close` — a cada 6h, encerra conversas com 24h+ de silencio
- `/api/cron/analise-publico` — diario 06h SP, analise IA do perfil dos leads
- `/api/cron/analise-qualidade` — diario 06h SP, analise IA da qualidade do atendimento

Relatorios salvos na tabela `relatorios_ia`, visiveis em `/relatorios`.

### Seguranca da API

- Rotas internas do agente validam header `x-api-secret`
- Rotas do painel validam sessao do usuario
- Endpoint do webhook valida payload da Uazapi
- CRONs validam `CRON_SECRET` (Vercel) ou `API_SECRET` (fallback dev)

### Regras de Componentes

- `components/ui/` — shadcn/ui gerado, nao editar
- `components/features/` — componentes de dominio organizados por modulo
- **StatusBadge** e o unico componente que define cores de status
- **ConfirmDialog** e o unico dialogo de confirmacao destrutiva
- **MetricCard** e o unico card de numero/metrica
- **DataTable** e a unica tabela com filtro/paginacao
- **PageHeader** e obrigatorio no topo de toda pagina

### Convencao de Estrutura de Pastas

- `app/(dashboard)/` — paginas do painel com sidebar
- `app/api/agente/` — ferramentas do agente IA (5 endpoints)
- `app/api/cron/` — CRONs automaticos (4 endpoints)
- `app/api/base-conhecimento/` — CRUD da base de conhecimento
- `lib/agente/` — internos do agente: buffer, memoria, processamento de midia, prompt, ferramentas, sincronizacao do kanban, analise de conversas
- `lib/kommo.ts` — integracao direta com Kommo CRM
- `prisma/seed.ts` — seed com usuario IA Livia + admin

### Paginas do Painel

- `/dashboard` — total atendidos + funil por etapa
- `/atendimentos` — kanban de atendimentos
- `/leads` — lista de leads + detalhe com historico de conversas
- `/agente-ia` — identidade, script, ferramentas, fluxo tecnico da Livia
- `/relatorios` — analises IA diarias (publico + qualidade)
- `/base-conhecimento` — base de conhecimento editavel (CRUD)
- `/solicitacoes` — solicitacoes de ajuste do cliente
- `/configuracoes/whatsapp` — conexao WhatsApp via Uazapi

## Notas do Modelo de Dados

- `Lead.sobreOLead` e texto cumulativo — nunca sobrescrever, apenas adicionar (append)
- `Lead.whatsapp` e unico — usado para dedup
- `MensagemWhatsapp.messageIdWhatsapp` e unico — usado para dedup de mensagens
- `ArtigoDocumentacao` com `secao: "base-conhecimento"` alimenta o prompt da Livia
- `RelatorioIA` armazena analises diarias (tipo: publico/qualidade)
- Todos os nomes de campos dos modelos estao em portugues (camelCase)

## Regras do Agente IA

- Livia NUNCA informa valores, precos ou orcamentos
- Livia NUNCA usa emojis
- Livia NUNCA admite ser IA
- Apos encaminhamento, IA para de responder (gate no webhook)
- Base de conhecimento e carregada do banco em tempo real
- Saudacao baseada no horario: bom dia (5-12h), boa tarde (12-18h), boa noite (18-5h)
- Mensagens fragmentadas com delimitador `---` no prompt (cada bloco = 1 msg WhatsApp)
- Indicador "digitando..." antes de cada mensagem + delay proporcional ao tamanho
- Perfil sempre online (`POST /instance/privacy` com `online: "all"`, `last: "none"`)

## Idioma

O sistema e **100% brasileiro**. Todo o codigo usa portugues para termos de dominio. Manter essa convencao.

### Configuracoes regionais:
- **Timezone:** `America/Sao_Paulo`
- **Locale:** `pt-BR`
- **Moeda:** BRL (R$)
- **Formato de data:** `dd/MM/yyyy`
- **Formato de telefone:** `+55 (XX) XXXXX-XXXX`
