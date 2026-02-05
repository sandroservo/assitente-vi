# Assistente Vi – Contexto do projeto

Contexto para a IA (e para a equipe) saber **onde paramos** no projeto da Secretária Vi.

---

## O que é o projeto

- **Nome:** Secretária Vi / Assistente Vi (Amo Vidas)
- **Stack:** Next.js 16, Prisma (PostgreSQL), Evolution API (WhatsApp), OpenAI (Whisper, Vision, Chat).
- **Função:** Painel para gerenciar a Vi (consultora no WhatsApp): inbox, leads, base de conhecimento, handoff humano, configurações. Webhook recebe mensagens da Evolution e responde com IA.

---

## Onde paramos (últimas entregas)

1. **Suporte a áudio** – Mensagens de áudio são transcritas (Whisper) no webhook; o texto é usado como mensagem do usuário. Mensagem salva com `type: "audio"`.
2. **Suporte a imagem** – Imagens são descritas (Vision / gpt-4o-mini) no webhook; descrição (e legenda) viram contexto para a IA. Mensagem salva com `type: "image"`.
3. **Human in the loop** – Se a mensagem é `fromMe` (atendente enviou pelo WhatsApp), o lead passa para `ownerType: "human"` e a Vi para de responder até alguém clicar em "Devolver ao Bot" no painel.
4. **Lista de exceção** – Em Configurações → aba **Exceções**: números para a Vi **não** responder (ex.: pessoas da empresa). Modelo `ExcludedContact`, API `/api/excluded-contacts`, webhook verifica antes de responder.
5. **Correção form aninhado** – Em ExcludedContactsCard, o `<form>` interno foi trocado por `<div>` + botão `type="button"` para evitar form dentro de form (hydration error).

---

## Pendências / próximos passos (lista do fluxo)

- **Resumo da conversa** – Gerar e salvar resumo no lead (campos `summary` / `notes` já existem no modelo Lead).
- **Base de conhecimento enriquecida** – Tabela de dependentes, exemplos de valor (ex.: consultas).

---

## Arquivos importantes

| Área | Caminho |
|------|---------|
| Webhook Evolution | `src/app/api/webhooks/evolution/route.ts` |
| IA (prompt, conhecimento, status do lead) | `src/lib/ai.ts` |
| Mídia (Whisper, Vision) | `src/lib/media.ts` |
| Evolution (envio, base64 mídia) | `src/lib/evolution.ts` |
| Lista de exceção (API) | `src/app/api/excluded-contacts/` |
| Lista de exceção (UI) | `src/app/(dashboard)/settings/ui/ExcludedContactsCard.tsx` |
| Schema Prisma | `prisma/schema.prisma` |

---

## Documentação extra

- `docs/FLUXO-N8N-ANALISE.md` – Análise dos fluxos n8n e o que foi aproveitado.
- `docs/MELHORIAS-CODIGO.md` – Melhorias de segurança e multitenancy.
- `agent/` – Textos de referência (club de desconto, informações Amo Vidas, systemprompt).

---

*Atualize este arquivo quando fizer entregas ou mudar prioridades.*
