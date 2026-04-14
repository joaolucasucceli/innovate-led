---
title: "Innovate Led — Central Innovate"
date: 2026-04-12
tags: [projeto, jl-ltda, agente-ia, whatsapp, kommo, painel-led]
empresa: jl-ltda
---

# Innovate Led — Central Innovate

**Cliente:** Innovate Brazil — empresa especializada em paineis LED
**Tipo:** Sistema web de pre-atendimento + agente IA WhatsApp
**Repo:** `C:\Users\joaol\Desktop\Joao Lucas Ucceli\Clientes\Innovate Led`
**GitHub:** github.com/joaolucasucceli/innovate-led
**Deploy:** Vercel
**Linear:** Projeto "Innovate LED" no time Clientes (workspace Joao Lucas Ucceli)

## Stack

Next.js 16 + shadcn/ui 4 + Tailwind 4 + Supabase (PostgreSQL direto, sem ORM) + Redis (Upstash) + NextAuth 4 + OpenAI (GPT-4o, Whisper, GPT-4o-mini) + Uazapi v2 + Kommo CRM

## Dois modulos

1. **Painel de Gestao** — dashboard, kanban (3 etapas: acolhimento > qualificacao > encaminhado), leads, relatorios IA, base de conhecimento editavel
2. **Agente IA "Livia"** — pre-qualificacao autonoma via WhatsApp (Uazapi v2) + GPT-4o + integracao Kommo CRM

---

## Arquitetura do Agente Livia

### Pipeline de processamento

```
Mensagem WhatsApp
  -> Webhook Uazapi (normaliza + dedup)
  -> Processa midia (se houver)
  -> Busca/cria lead + conversa
  -> Buffer Redis (debounce 20s)
  -> "Digitando..." imediato pro usuario
  -> Concatena mensagens do buffer
  -> Gera system prompt dinamico (base de conhecimento do banco)
  -> GPT-4o com function calling (3 ferramentas)
  -> Loop de tool calls (max 10 iteracoes)
  -> Segmenta resposta (delimitador --- ou \n\n, max 300 chars)
  -> "Digitando..." + delay proporcional antes de cada msg
  -> Envia via Uazapi (delay aleatorio 3-5s entre msgs)
  -> Salva no banco + memoria Redis
```

### Componentes do agente (lib/agente/)

| Arquivo | Funcao |
|---------|--------|
| `buffer.ts` | Debounce de mensagens rapidas via Redis (20s TTL, chave `{chatId}_buf_innovate`) |
| `memoria.ts` | Janela deslizante de 20 msgs em Redis (48h TTL, chave `{chatId}_mem_innovate`) |
| `prompt.ts` | Gera system prompt dinamico com saudacao, contexto do lead, base de conhecimento do banco e script de 3 etapas |
| `ferramentas.ts` | Define 3 ferramentas GPT function calling (salvar_qualificacao, encaminhar_contato, criar_tarefa) |
| `loop.ts` | Orquestrador principal — busca buffer, monta mensagens, chama GPT, executa tools, segmenta e envia resposta |
| `kanban-sync.ts` | Sincroniza funil (3 etapas) + abre novo ciclo quando lead retorna |
| `followup.ts` | Follow-ups automaticos (1h/6h/24h) com GPT-4o-mini personalizado |
| `processar-midia.ts` | Transcreve audio (Whisper) e analisa imagens (GPT-4o-mini vision) |
| `horario-comercial.ts` | Saudacao por horario SP + verificacao de horario comercial |
| `analise-conversas.ts` | Gera relatorios IA diarios (perfil de publico + qualidade de atendimento) |

### Constantes e timings

| Parametro | Valor | Proposito |
|-----------|-------|-----------|
| Buffer debounce | 20s | Acumula mensagens rapidas antes de processar |
| Buffer TTL | 60s | Tempo maximo de mensagens no Redis |
| Memoria TTL | 48h | Quanto tempo lembra do contexto |
| Memoria max | 20 msgs | Janela deslizante por chat |
| Delay digitacao | 30ms/char, max 3s | Simula velocidade de digitacao humana |
| Delay entre msgs | 3-5s aleatorio | Evita cadencia robotica |
| Follow-up 1h | 1h sem atividade | Follow-up leve |
| Follow-up 6h | 6h sem atividade | Follow-up com proposta de valor |
| Follow-up 24h | 24h sem atividade | Encerramento + auto-close |
| Max tool calls | 10 iteracoes | Previne loops infinitos do GPT |

### Modelos de IA utilizados

| Tarefa | Modelo | Config |
|--------|--------|--------|
| Conversa principal | GPT-4o | tool_choice="auto" |
| Follow-ups | GPT-4o-mini | temp=0.7, max_tokens=200 |
| Analise de imagens | GPT-4o-mini (vision) | max_tokens=500 |
| Transcricao de audio | Whisper-1 | language="pt" |
| Relatorios diarios | GPT-4o | temp=0.3, max_tokens=2000 |

### Funil de 3 etapas

| Etapa | Quem move | O que acontece |
|-------|-----------|----------------|
| acolhimento | IA | Livia acolhe, captura nome do lead |
| qualificacao | IA | Livia coleta dados do projeto (8 perguntas) |
| encaminhado | IA | Lead qualificado, encaminhado ao comercial, IA para de responder |

### 3 ferramentas do agente (GPT function calling)

**1. `salvar_qualificacao`** — chamada toda vez que coleta info nova do lead
- Atualiza nome + `sobreOLead` (cumulativo, nunca sobrescreve — apenas append)
- Sincroniza com Kommo CRM (fire-and-forget)

**2. `encaminhar_contato`** — chamada quando coleta esta completa
- Move lead para "encaminhado" no funil
- Sincroniza com Kommo
- Conversa muda para modo humano

**3. `criar_tarefa`** — chamada apos coletar horario preferido de contato
- Cria tarefa de ligacao no banco
- Cria tarefa no Kommo com deadline de 24h

### Tecnicas e padroes notaveis

**1. Debounce de mensagens (Redis buffer)**
- Problema: Usuario manda 10 msgs rapidas, abordagem naive = 10 chamadas GPT
- Solucao: Buffer Redis acumula por 20s, concatena tudo em 1 chamada
- Beneficio: Economia de custo + GPT ve contexto completo

**2. Humanizacao do atendimento**
- "Digitando..." enviado IMEDIATAMENTE (antes do debounce de 20s)
- Re-enviado antes de cada segmento com delay proporcional ao tamanho
- Delay aleatorio 3-5s entre mensagens
- Fragmentacao natural via delimitador `---` no prompt
- Perfil sempre online (`POST /instance/privacy` com `online: "all"`, `last: "none"`)

**3. Injecao de IDs reais (anti-alucinacao)**
- GPT pode gerar IDs inventados nos tool calls
- Loop.ts sobrescreve com IDs reais apos extrair tool call:
  ```
  if (leadId) args.leadId = leadId
  if (conversaId) args.conversaId = conversaId
  ```

**4. Reativacao de leads**
- Lead deletado que manda nova msg -> undeletado (preserva historico)
- Lead "encaminhado" que retorna -> abre novo ciclo:
  - Incrementa `cicloAtual` e `ciclosCompletos`
  - Cria nova conversa vinculada ao ciclo
  - Reseta status para "acolhimento"
  - Append nota em `sobreOLead`: `[Ciclo X iniciado em DD/MM/YYYY]`
  - Prompt pula Etapa 1 e diz "Que bom ter voce de volta!"

**5. Base de conhecimento como configuracao**
- Armazenada no banco (`artigos_documentacao`, secao `base-conhecimento`)
- Cliente edita via UI (`/base-conhecimento`)
- Prompt carrega em tempo real — sem redeploy para mudar fatos
- Fallback hardcoded se banco indisponivel

**6. Download de midia em 3 estagios**
- Estagio A: Base64 inline no payload (mais confiavel)
- Estagio B: URLs diretas com validacao de Content-Type (rejeita HTML)
- Estagio C: POST `/message/download` no Uazapi (fallback, ~95% sucesso)
- Upload para Supabase Storage com URL publica

**7. Modo de conversa (toggle IA/humano)**
- Atendente pode mudar `conversa.modoConversa` para "humano"
- Webhook continua salvando msgs mas IA nao responde
- Permite takeover sem perder historico

**8. sobreOLead cumulativo**
- Nunca sobrescreve, apenas append
- Formato: `Objetivo: X | Ambiente: Y | [Ciclo 2]: Contato retornou...`
- Trilha de auditoria completa — CRM ve todo historico

### Prefixos Redis

| Chave | TTL | Uso |
|-------|-----|-----|
| `{chatId}_buf_innovate` | 60s | Buffer de mensagens |
| `{chatId}_deb_innovate` | 20s | Flag de debounce |
| `{chatId}_mem_innovate` | 48h | Memoria de conversa |

### Integracao Kommo CRM

- Base URL: `https://innovate.kommo.com`
- Auth: Bearer token via `KOMMO_API_TOKEN`
- Pipeline ID: 12989364
- Status Pre-atendimento (IA): 100157352
- Status Encaminhado: 100157356
- Todas as operacoes sao **fire-and-forget** (nao bloqueiam resposta ao usuario)
- Funcoes: criarLeadKommo, deletarLeadKommo, salvarQualificacaoKommo, encaminharLeadKommo, criarTarefaKommo

### Rotas do agente

**Ferramentas (x-api-secret):**
- `POST /api/agente/salvar-qualificacao`
- `POST /api/agente/encaminhar-contato`
- `POST /api/agente/criar-tarefa`

**Infraestrutura (x-api-secret):**
- `POST /api/agente/consultar-lead` — busca/cria lead por WhatsApp
- `POST /api/agente/registrar-mensagem` — registra msg no banco
- `POST /api/agente/processar` — dispara processamento do buffer

**Webhook:**
- `POST /api/webhooks/whatsapp` — entrada Uazapi (normaliza UazapiGO v2 + Baileys)

### Regras da Livia

- NUNCA informa valores, precos ou orcamentos
- NUNCA usa emojis
- NUNCA admite ser IA
- Saudacao baseada no horario SP (bom dia/boa tarde/boa noite)
- Uma pergunta por vez, valida antes de prosseguir
- Foto recebida: agradece + comenta 2+ detalhes tecnicos + sugere tipo de painel

---

## CRONs (4)

- `/api/cron/follow-ups` — a cada hora
- `/api/cron/auto-close` — a cada 6h
- `/api/cron/analise-publico` — diario 9h UTC (~6h SP)
- `/api/cron/analise-qualidade` — diario 9h UTC (~6h SP)

## Historico

- **Abr/2026:** Sistema implementado e entregue (85+ commits, 40 issues no Linear)
- Integracao Kommo feita via API REST direta (sem n8n)
- Migracao Prisma -> Supabase Client direto concluida em 12/04/2026
- 5 rodadas de auditoria — projeto 100% limpo

---

## Estado Atual do Sistema

**URL:** https://innovate-led.vercel.app
**Repo local:** `C:\Users\joaol\Desktop\Joao Lucas Ucceli\Clientes\Innovate Led`
**GitHub:** https://github.com/joaolucasucceli/innovate-led
**Deploy:** Vercel
**Login:** NextAuth (credenciais no .env)

### Stack em produção

Next.js 16, shadcn/ui 4, Tailwind 4, Supabase (PostgreSQL direto, sem ORM), Redis (Upstash), NextAuth 4, OpenAI (GPT-4o, Whisper, GPT-4o-mini), Uazapi v2, Kommo CRM

### Páginas

| Página | Rota | Descrição |
|--------|------|-----------|
| Login | `/login` | Autenticação NextAuth |
| Dashboard | `/` | Total de leads, funil por etapa, métricas |
| Kanban | `/kanban` | Atendimentos em 3 etapas (acolhimento → qualificação → encaminhado) |
| Leads | `/leads` | Listagem com histórico de conversas |
| Relatórios IA | `/relatorios` | Análise de público + qualidade de atendimento |
| Solicitações | `/solicitacoes` | Cliente pede ajustes pelo sistema |
| Base de Conhecimento | `/base-conhecimento` | Editável pelo cliente |
| Documentação | `/documentacao` | Docs do sistema |
| WhatsApp | `/whatsapp` | Conectar número via QR Code |

### API Routes principais

**Agente (x-api-secret):**
- `POST /api/agente/salvar-qualificacao`
- `POST /api/agente/encaminhar-contato`
- `POST /api/agente/criar-tarefa`
- `POST /api/agente/consultar-lead`
- `POST /api/agente/registrar-mensagem`
- `POST /api/agente/processar`

**Webhook:**
- `POST /api/webhooks/whatsapp`

**CRONs:**
- `/api/cron/follow-ups` — a cada hora
- `/api/cron/auto-close` — a cada 6h
- `/api/cron/analise-publico` — diário 9h UTC
- `/api/cron/analise-qualidade` — diário 9h UTC

### Reunião de apresentação

[[2026-04-10-innovate-brazil]] — teste ao vivo com Mary Alves e Nelson Silva Junior. WhatsApp conectado, fluxo completo validado. Período de teste: 10 dias (até ~20/04/2026).
