# AGENTS.md — Task Board

Regras de execução para o assistente que trabalha neste projeto.

## Idioma
- Código: inglês (nomes de variáveis, funções, arquivos, mensagens de commit).
- Interface (UI): português brasileiro.
- Comunicação com o usuário: português brasileiro.

## Commits
- Atômicos, verbo no imperativo, em português.
- Formato: `<verbo> <objeto>` — ex.: `adiciona drag-and-drop entre colunas`, `corrige cálculo de lead time`.
- Um commit por mudança lógica. Nada de "várias coisas".

## Branches
- Git Flow clássico: `feature/<nome>`, `bugfix/<nome>`, `release/<versão>`, `hotfix/<nome>`.
- Base: `main` estável. `develop` como linha de integração (opcional enquanto for mono-board, mas manter o padrão).
- **Todo desenvolvimento deve ser feito na branch `develop`**. Crie uma sub-branch (`feature/`, `bugfix/`) se preferir, mas o destino de merge é o `develop`.
- **Ao finalizar uma correção, funcionalidade ou qualquer atividade**, pergunte ao usuário se devemos abrir um PR/pedido para incluir as alterações na `main`. Nunca merge automaticamente sem confirmação.

## Dependências
- Antes de instalar qualquer lib: sugerir alternativa mais leve e perguntar.
- Só adiciona dependência quando o usuário confirma.
- Preferir soluções nativas do ecossistema já instalado (React, Tailwind, dnd-kit).

## Testes
- Obrigatoriedade: serviços com regra de negócio (transições, WIP limit, cálculo de métricas, relatórios) — testes unitários com Vitest.
- Fluxos críticos de drag-and-drop e transições de coluna — testes e2e com Playwright.
- Demais componentes: sob demanda do usuário.

## Comentários no código
- Mínimos. Só quando a intenção não for óbvia.
- JSDoc apenas em funções exportadas de `packages/schemas` e módulos compartilhados.
- Nada de comentário óbvio ("incrementa contador").

## Antes de implementar
- Confirmar o escopo quando houver mais de uma interpretação possível.
- Perguntar antes de mudar arquitetura, schema de banco ou contrato de API.
- Quando não houver informação suficiente, perguntar em vez de assumir.

## Backlog de funcionalidades
- Funcionalidades planejadas são registradas em `docs/backlog.md` com título, descrição e data de registro.
- **Regra:** ao implementar uma funcionalidade do backlog, remova-a de `docs/backlog.md` e faça commit da mudança.

## Como rodar (após setup)
- `docker compose up -d` — sobe Postgres e backend.
- `pnpm dev` — frontend (Vite) e backend (Fastify) em modo watch.
- `pnpm test` — unitários; `pnpm test:e2e` — Playwright.

## Stack fixa
- React 19 + TypeScript + Vite (frontend).
- Fastify + Prisma + PostgreSQL 17 (backend).
- Tailwind CSS 4 + shadcn/ui (estilo).
- @dnd-kit/core + @dnd-kit/sortable (drag-and-drop).
- TanStack Query + Zustand (estado).
- Zod (validação compartilhada).
