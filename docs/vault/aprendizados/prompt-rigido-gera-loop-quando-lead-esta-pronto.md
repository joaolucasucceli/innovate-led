---
title: "Prompt rigido gera loop de perguntas quando lead esta pronto"
date: 2026-04-14
tags: [aprendizado, agente-ia, prompt-engineering, livia]
---

# Prompt rigido gera loop de perguntas quando lead esta pronto

## Contexto

Em 14/04/2026, Mary Alves (Innovate) reportou via WhatsApp: "Hoje ela esta conversando, finalizou mais alguns e nao encaminhou". Auditoria do banco revelou que a Livia estava funcionando (9 leads encaminhados em 2 dias), mas 3 conversas ficaram presas em loop de perguntas e 1 lead desistiu reclamando "Misericordia quanto rodeio pra falar o preco".

## O que aconteceu

O prompt da Livia exigia completar TODAS as 8 perguntas de qualificacao antes de encaminhar ao consultor. Quando o lead pulava etapas (ja chegava pedindo preco, dando orcamento, confirmando horario), a Livia travava tentando voltar ao script.

### Casos reais:

1. **Victoria Benevenuto** — Qualificacao 100% completa. Lead pediu "quero valores". Livia perguntou horario pro consultor 2 vezes em vez de encaminhar.

2. **L L Guimaraes** — Lead confirmou "pode ser hoje no final do dia". Livia disse "otimo, vou agendar!" mas NAO chamou `encaminhar_contato` nem `criar_tarefa`. Lead ficou sem retorno.

3. **Mucio Maffacioli** — Lead informou orcamento de 40k e mandou audio pedindo orcamento direto. Livia repetiu "o consultor vai analisar" em loop.

4. **MAIS QUE VENCEDORA MECANICA** — Lead reclamou do excesso de perguntas e desistiu. Lead perdido por rigidez do prompt.

## Licao

**Qualificacao suficiente > qualificacao completa.**

Scripts rigidos em agentes de pre-venda funcionam bem para leads frios que seguem o fluxo, mas matam conversao com leads quentes que ja chegam prontos. O agente precisa de gatilhos de "encaminhamento antecipado".

## Gatilhos de encaminhamento antecipado

Aplicados ao prompt da Livia (commit `2b2917d`):

1. **Lead pediu preco/orcamento 2x** -> para qualificacao, encaminha direto
2. **Lead informou valor/orcamento por conta propria** (ex: "tenho 40k") -> encaminha direto
3. **Lead confirmou dia/horario** -> executa `salvar_qualificacao` + `encaminhar_contato` + `criar_tarefa` na mesma resposta
4. **Lead demonstrou impaciencia** ("fala logo", "quanto custa?", "muito rodeio") -> reconhece, encaminha
5. **Lead ja tem nome + tipo de projeto + 2 outras infos** -> qualificacao suficiente, pode encaminhar

## Reforco nas ferramentas (GPT function calling)

Tambem atualizei as `description` das ferramentas em `lib/agente/ferramentas.ts`:

- `encaminhar_contato`: listei os gatilhos de uso na descricao
- `criar_tarefa`: reforcei "usar JUNTO com encaminhar_contato"
- Regra explicita: "Se o lead confirma horario, chame as 3 ferramentas NA MESMA RESPOSTA"

Descricoes de ferramentas sao tao importantes quanto o prompt — o GPT usa elas para decidir quando chamar.

## Aplicavel a outros projetos

Todos os agentes de pre-venda (Livia/Innovate, futuros clones) devem ter:
- Script como **guia**, nao como lei
- Gatilhos de atalho para leads quentes
- Regra de chamar ferramentas imediatamente (nao prometer acao sem executar)
- Reconhecimento de impaciencia como sinal forte

## Intervencao manual

Para os 4 atendimentos travados, fiz intervencao direta via scripts:
- Enviei mensagens como Livia via Uazapi (token da instancia)
- Chamei as ferramentas via API (`x-api-secret`) para encaminhar
- Salvei qualificacoes no banco
- Tudo registrado como se fosse a IA para manter coerencia

Victoria e L L Guimaraes foram encaminhadas com sucesso. Mucio e luanruizs tiveram conversas retomadas.

## Links

- Issue Linear: CLIENTE-213
- Commit: `2b2917d`
- Prompt antes: [[decisoes/prompt-livia-script-rigido-3-etapas]] (pre-ajuste)
- Reuniao de teste: [[reunioes/2026-04-10-innovate-brazil]]
