# Ata de Reunião — Innovate Brazil

**Data:** 10/04/2026, 09:01
**Duração:** 40 minutos
**Participantes:** João Lucas Ucceli (Buildenn), Mary Alves (Innovate), Nelson Silva Junior (Innovate)

---

## Objetivo

Apresentação do sistema Central Innovate + Agente IA "Lívia" para o time da Innovate Brazil. Teste ao vivo com conexão do WhatsApp da empresa. Definição do período de validação.

---

## O que foi apresentado

### Sistema Central Innovate

* Dashboard com total de leads atendidos e funil por etapa
* Kanban de atendimentos
* Gestão de leads com histórico de conversas
* Pausar/retomar IA por lead
* Relatórios IA diários (análise de público + qualidade de atendimento)
* Solicitações de ajuste (Mary/Nelson podem pedir mudanças pelo sistema)
* Base de conhecimento editável (Mary/Nelson podem atualizar informações da empresa)
* Documentação do sistema
* Configuração de WhatsApp (conectar número da empresa)

### Agente IA "Lívia"

* Modelo GPT-4o com personalidade consultiva
* Script de atendimento em 3 etapas (acolhimento → qualificação → encaminhamento)
* Ferramentas: salvar qualificação, encaminhar contato, criar tarefa
* Processamento de áudio, imagem, documento
* Follow-up automático (1h, 6h, 24h)
* Integração dupla: sistema local + Kommo CRM

---

## Teste ao vivo

### WhatsApp conectado

Número da empresa conectado via QR Code durante a reunião. Leads de teste criados com sucesso no sistema e no Kommo CRM simultaneamente.

### Teste da Mary Alves

* Enviou "Oi" → lead criado no sistema + Kommo
* Completou fluxo inteiro de qualificação
* Dados salvos corretamente no sistema e no Kommo
* Tarefa de ligação criada
* Lead encaminhado ao comercial
* **Resultado: SUCESSO COMPLETO**

### Teste do Nelson Silva Junior

* Enviou mensagem → lead criado no sistema
* Não apareceu no Kommo (número vinculado à conta pessoal do Nelson)
* Testou envio de foto → análise técnica funcionou
* Perguntou sobre preço → IA deu valor de R$45k (BUG — não deveria dar orçamento)
* **Resultado: PARCIAL — funcionou no sistema, Kommo com conflito de conta**

---

## Bugs encontrados e status

| Bug | Status |
| -- | -- |
| IA não respondeu inicialmente (Redis URL com whitespace) | Corrigido |
| Nome do contato não capturado (salva "WhatsApp 55...") | Corrigido |
| Mensagens fragmentadas (cada frase = 1 mensagem) | Corrigido |
| Histórico quebrado (cada msg em card separado) | Corrigido |
| IA deu orçamento de R$45k (não tem autoridade) | A fazer |
| Botão excluir lead visível (precisa ocultar para teste) | A fazer |

---

## Acordos firmados

1. **Período de teste:** 10 dias a partir de 10/04/2026 (até ~20/04/2026)
2. **Reunião de acompanhamento:** 20/06/2026 para decidir continuidade, V2 ou pausa
3. **Dados preservados:** Durante os 10 dias, nenhum dado será excluído
4. **Solicitações de ajuste:** Mary e Nelson usam o sistema de solicitações no painel
5. **Base de conhecimento:** Mary e Nelson podem editar diretamente no painel

---

## Funcionalidades V2 (mencionadas, não incluídas no escopo atual)

1. Geração de imagem mockup — IA gera simulação visual do painel LED na parede
2. Orçamento automático com PDF
3. CRM completo para vendas
4. IA no Instagram
5. IA de pós-venda

---

## Feedback do cliente

### Positivo

* Nelson: "Muito bom" ao ver os relatórios de qualidade
* Mary completou todo o fluxo sem problemas
* Sistema + Kommo CRM sincronizados perfeitamente
* Fotos analisadas pela IA com descrição técnica

### Pontos de atenção

* Nelson preocupado com velocidade de resposta (20s de debounce)
* Nelson quer que IA calcule orçamento (V2)
* Mary preocupou com leads duplicados
* Nelson brincou que "vai tirar o vendedor" com a IA
