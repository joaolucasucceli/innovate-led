---
title: "Vault — Innovate LED"
date: 2026-04-14
tags: [vault, innovate-led]
---

# Vault — Innovate LED

## O que e este vault

Base de conhecimento compartilhada do projeto **Innovate LED**. Versionado no Git para que toda a equipe tenha acesso.

Sistema web de gestao de pre-atendimento da Innovate Brazil (paineis LED). Stack: Next.js 16, Supabase, shadcn/ui.

## Estrutura

- `decisoes/` — Decisoes tecnicas e de produto com justificativas
- `aprendizados/` — Licoes aprendidas, erros evitados, descobertas
- `processos/` — Protocolos e fluxos de trabalho do projeto
- `reunioes/` — Atas e notas de reunioes com o cliente
- `pessoas/` — Contatos relevantes ao projeto
- `referencias/` — Material de apoio externo

## Frontmatter padrao

Todo arquivo .md deve ter:

```yaml
---
title: "Titulo descritivo"
date: YYYY-MM-DD
tags: [categoria, topico]
---
```

## Regras

- Usar wikilinks `[[nome-do-arquivo]]` para conectar notas
- Nomes de arquivo em kebab-case (ex: `decisao-migrar-para-supabase.md`)
- Datas absolutas, nunca relativas
- Conteudo em portugues brasileiro
- Codigo pode usar ingles para termos tecnicos
