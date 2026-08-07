# Task Board

Aplicação kanban pessoal para gerenciar tarefas via drag-and-drop.

## Stack

- **Frontend**: React 19 + TypeScript + Vite + Tailwind CSS + shadcn/ui + @dnd-kit
- **Backend**: Node 22 + Fastify + Prisma + PostgreSQL 17
- **Estado**: TanStack Query (server) + Zustand (UI)
- **Validação**: Zod (compartilhado entre front e back)
- **Testes**: Vitest (unit) + Playwright (e2e)
- **Monorepo**: npm workspaces

## Pré-requisitos

- Node.js >= 22
- Docker Desktop (para rodar Postgres)
- npm >= 11

## Setup inicial

```bash
# 1. Instalar dependências
npm install

# 2. Subir o banco de dados
docker compose -f infra/docker-compose.yml up -d db

# 3. Copiar variáveis de ambiente
cp .env.example .env

# 4. Gerar cliente Prisma e rodar migrations
cd apps/api
npx prisma generate
npx prisma migrate dev

# 5. Popular board padrão (opcional)
npm run db:seed
```

## Desenvolvimento

```bash
# Frontend + backend em paralelo (raiz do projeto)
npm run dev

# Ou individualmente
npm run dev:web   # Vite em http://localhost:5173
npm run dev:api   # Fastify em http://localhost:3001
```

O Vite faz proxy de `/api/*` para o backend automaticamente.

## Comandos

| Comando | Descrição |
|---|---|
| `npm run dev` | Inicia web + api em modo watch |
| `npm run build` | Build de produção de todos os pacotes |
| `npm run typecheck` | Verificação de tipos em todos os pacotes |
| `npm run test` | Testes unitários (Vitest) |
| `npm run test:e2e` | Testes end-to-end (Playwright) — requer API + Postgres rodando |
| `npm run db:migrate` | Executa migrations (Prisma) |
| `npm run db:seed` | Popula board padrão |
| `npm run db:studio` | Abre o Prisma Studio |

## Estrutura do projeto

```
.
├── apps/
│   ├── api/          # Fastify + Prisma
│   └── web/          # React + Vite
├── packages/
│   ├── schemas/      # Zod schemas compartilhados
│   └── config/       # Configs compartilhadas
├── infra/
│   ├── docker-compose.yml
│   ├── Dockerfile.api
│   ├── Dockerfile.web
│   └── nginx.conf
└── docs/
    └── technical-documentation.md
```

## Deploy local com Docker

```bash
docker compose -f infra/docker-compose.yml up --build
```

- Frontend: http://localhost:5173
- API: http://localhost:3001
- Postgres: localhost:5432

## Licença

Uso pessoal.
