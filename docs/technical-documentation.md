# Task Board — Documentação Técnica

## 1. Visão Geral

Aplicação pessoal de gerenciamento de tarefas no estilo Kanban. O usuário move tickets entre colunas (`Backlog`, `Executando`, `Impedido`, `Concluído`) via drag-and-drop para atualizar o status. Foco em uso individual, sem camada de autenticação, rodando localmente com persistência offline-first.

---

## 2. Stack Tecnológica

| Camada       | Tecnologia                                  | Versão alvo  |
| ------------ | ------------------------------------------- | ------------ |
| Frontend     | React 19 + TypeScript                       | 5.x          |
| Build        | Vite                                        | 6.x          |
| Estilização  | Tailwind CSS 4 + shadcn/ui                  | 4.x          |
| Estado       | Zustand (client) + React Query (server)     | 5.x / 5.x    |
| DnD          | @dnd-kit/core + @dnd-kit/sortable           | 6.x / 10.x   |
| Gráficos     | Recharts ou VisX                            | 2.x          |
| Backend      | Node.js + Fastify                           | 22 / 5.x     |
| ORM          | Prisma                                      | 6.x          |
| Banco        | PostgreSQL 17                               | 17.x         |
| Validação    | Zod (front e back compartilham schemas)     | 3.x          |
| Testes       | Vitest (unit) + Playwright (e2e DnD)        | 3.x / 1.x    |
| Runtime dev  | Docker Compose                              | —            |

---

## 3. Arquitetura do Sistema

```
┌─────────────────────────────────────────────┐
│  Frontend (React + Vite)                    │
│  ├── UI (shadcn + Tailwind)                 │
│  ├── Estado local (Zustand: UI/drag state)  │
│  ├── Server state (TanStack Query cache)     │
│  └── dnd-kit (colunas e ordenação)          │
└──────────────────┬──────────────────────────┘
                   │ HTTP/JSON (REST)
                   ▼
┌─────────────────────────────────────────────┐
│  Backend (Node + Fastify)                   │
│  ├── Routes (boards, columns, tickets)      │
│  ├── Services (regras de negócio)           │
│  ├── Validation (Zod schemas)               │
│  └── Prisma Client                          │
└──────────────────┬──────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────┐
│  PostgreSQL 17                              │
│  ├── Tabelas: boards, columns, tickets,     │
│  │            comments, attachments, tags,  │
│  │            ticket_tags, audit_log        │
│  └── Extensions: pg_trgm (busca), uuid-ossp│
└─────────────────────────────────────────────┘
```

- **Offline-first no frontend**: TanStack Query mantém cache em `localStorage`; escritas entram em fila e sincronizam quando o backend responde. Enquanto offline, opera em memória e despenca ao reconectar.
- **Separação de camadas**: Rotas não contêm regra de negócio. Toda validação de transição, permissão de estado e cálculo de métrica vive em `services/`.

---

## 4. Modelagem de Dados

### 4.1 Entidades

#### `board`
| Campo       | Tipo        | Observação                          |
| ----------- | ----------- | ----------------------------------- |
| id          | uuid        | PK                                  |
| name        | text        |                                      |
| slug        | text        | único, URL-friendly                 |
| description | text?       |                                      |
| created_at  | timestamptz | default now()                       |
| updated_at  | triggereado | via trigger ou hook do Prisma       |

#### `column`
| Campo       | Tipo          | Observação                                |
| ----------- | ------------- | ----------------------------------------- |
| id          | uuid          | PK                                        |
| board_id    | uuid          | FK → board, ON DELETE CASCADE             |
| name        | text          |                                           |
| position    | int           | ordem na board (0, 1, 2, …)               |
| w_limit     | int?          | limite de WIP; null = sem limite          |
| is_system   | boolean       | colunas default não podem ser excluídas   |
| created_at  | timestamptz   |                                           |

Colunas padrão criadas na seed: **Backlog** → **Executando** → **Impedido** → **Concluído**.

#### `ticket`
| Campo        | Tipo          | Observação                                   |
| ------------ | ------------- | -------------------------------------------- |
| id           | uuid          | PK                                           |
| board_id     | uuid          | FK → board                                   |
| column_id    | uuid          | FK → column                                  |
| title        | text          |                                              |
| description  | text?         | markdown                                     |
| priority     | enum          | `low`, `medium`, `high`, `urgent`            |
| assignee     | text?         | livre; mesmo uso pessoal mantém o campo      |
| due_date     | timestamptz?  |                                              |
| position     | float         | ordem dentro da coluna (decimal para inserts)|
| created_at   | timestamptz   |                                              |
| updated_at   | timestamptz   |                                              |
| completed_at | timestamptz?  | preenchido ao entrar em Concluído            |

#### `tag`
| Campo    | Tipo   |
| -------- | ------ |
| id       | uuid   |
| board_id | uuid   |
| name     | text   |
| color    | text   | hex |

#### `ticket_tag`
| Campo     | Tipo |
| --------- | ---- |
| ticket_id | uuid |
| tag_id    | uuid |
PK composta `(ticket_id, tag_id)`.

#### `comment`
| Campo      | Tipo        |
| ---------- | ----------- |
| id         | uuid        |
| ticket_id  | uuid        |
| body       | text        | markdown |
| created_at | timestamptz |

#### `attachment`
| Campo       | Tipo        |
| ----------- | ----------- |
| id          | uuid        |
| ticket_id   | uuid        |
| filename    | text        |
| mime_type   | text        |
| size_bytes  | int         |
| storage_key | text        | caminho no disco local |
| created_at  | timestamptz |

#### `audit_log`
| Campo       | Tipo        | Observação                          |
| ----------- | ----------- | ----------------------------------- |
| id          | uuid        |                                     |
| ticket_id   | uuid        |                                     |
| event       | enum        | `created`, `moved`, `updated`, `commented`, `tagged` |
| from_column | uuid?       |                                     |
| to_column   | uuid?       |                                     |
| metadata    | jsonb       | snapshot resumido                   |
| created_at  | timestamptz |                                     |

### 4.2 Índices
- `ticket(board_id, column_id, position)` — listagem ordenada da coluna.
- `ticket(due_date)` — consultas de prazo vencido.
- `audit_log(ticket_id, created_at)` — histórico do ticket.
- `tag(board_id)` — busca de tags por board.

---

## 5. Regras de Negócio

### 5.1 Transições de coluna
- Toda movimentação passa por `canTransition(from, to)`.
- Regras padrão (customizáveis depois via tabela `transition_rule`):
  - De `Concluído` para qualquer outra coluna: **exige confirmação** (modal).
  - De qualquer coluna para `Impedido`: **exige motivo** (campo obrigatório no modal de movimentação).
  - `Backlog` → `Executando`: verifica WIP limit de `Executando`.
- WIP limit: se a coluna de destino atingir `w_limit`, o drag é cancelado com toast.

### 5.2 Movimentação
- **Entre colunas**: `column_id` atualizado + `position` recalculado (append no fim, ou entre dois tickets se soltar sobre um).
- **Reordenação dentro da coluna**: apenas `position` atualizado usando média entre vizinhos (float), com rebalanceamento quando a fração ficar < 0.001.
- Toda movimentação gera entrada em `audit_log` com `event = 'moved'`.

### 5.3 Conclusão
- Ao entrar na coluna `Concluído`, setar `completed_at = now()`.
- Ao sair de `Concluído`, limpar `completed_at`.

### 5.4 Prazos
- `due_date` é opcional.
- Visual: ticket com `due_date < now()` e não concluído recebe borda/ícone vermelho.
- Queries de "vencidos" filtram por `due_date < now() AND column_id != coluna_concluida`.

### 5.5 Etiquetas
- CRUD completo; cor em hex; vinculação N:N com ticket.
- Filtros combinados: múltiplas tags usam lógica AND (ticket precisa ter todas as tags selecionadas).

### 5.6 Anexos
- Armazenamento local em `./storage/attachments/<ticket_id>/<uuid>-<nome>`.
- Limite: 25 MB por arquivo, configurável.
- Endpoints: `POST /tickets/:id/attachments` (multipart), `GET /attachments/:id/download`, `DELETE /attachments/:id`.

### 5.7 Responsável
- Campo texto livre (não FK para tabela de usuários). Uso pessoal não justifica tabela `user` agora, mas o schema mantém o campo para o futuro.

---

## 6. Funcionalidades (Escopo v1)

1. CRUD de Board (criar, renomear, arquivar).
2. CRUD de Coluna (adicionar, renomear, reordenar, definir WIP limit, excluir se não-sistema).
3. CRUD de Ticket (criar inline, editar título/descrição/prioridade/prazo/assignee).
4. **Drag-and-drop**:
   - Entre colunas (com regras de transição).
   - Reordenação manual dentro da coluna.
   - Feedback visual durante o drag (placeholder, sombra, preview).
5. Etiquetas: criar, atribuir, remover, filtrar.
6. Comentários: listar, adicionar, editar próprio comentário, excluir.
7. Anexos: upload, download, remover.
8. Filtros: por tag, prioridade, assignee, prazo vencido, busca textual (título + descrição).
9. Persistência offline-first (fila de escritas, cache local).
10. Relatórios de fluxo:
    - Diagrama cumulativo (CFD): quantidade de tickets por coluna ao longo do tempo, derivado do `audit_log`.
    - Velocidade: tickets concluídos por semana.
    - Tempo médio de ciclo (lead time): `completed_at - created_at`.
11. Tema claro/escuro (shadcn theme toggle).

---

## 7. Detalhes do Drag-and-drop

- Biblioteca: `@dnd-kit/core` + `@dnd-kit/sortable` + `@dnd-kit/utilities`.
- `DndContext` único envolvendo o board.
- `SortableContext` por coluna, usando `verticalListSortingStrategy`.
- Sensores: `PointerSensor` (activation constraint: distância 8px) + `KeyboardSensor` (`sortableKeyboardCoordinates`).
- `useSortable` em cada ticket; `useDroppable` em cada coluna.
- `onDragEnd`:
  1. Identifica origem (`active.id` + `active.data.current.columnId`) e destino (`over.id` + tipo).
  2. Se destino é coluna → move pro fim (aplica regras de transição).
  3. Se destino é ticket → calcula posição intermediária e move.
  4. Otimista: atualiza cache local imediatamente; em caso de erro do servidor, reverte.
- `onDragOver`: permite reordenação ao vivo enquanto arrasta.
- Persistência: `PATCH /tickets/:id/move` com `{ columnId, position }`.
- Animações: CSS transitions simples; `Translate` transform do dnd-kit. Sem framer-motion (peso desnecessário).

---

## 8. Relatórios de Fluxo

Todos derivados do `audit_log`:

### 8.1 Cumulative Flow Diagram (CFD)
- Query agrega `COUNT(DISTINCT ticket_id)` por coluna por dia, usando snapshot diário.
- Materialização: tabela `cfd_snapshot` populada por job diário (cron do backend ou trigger no audit_log).
- Gráfico: áreas empilhadas (Recharts `AreaChart`), eixo X = data, Y = quantidade.

### 8.2 Velocidade
- `SELECT week, COUNT(*) FROM tickets WHERE completed_at IS NOT NULL GROUP BY week`
- Gráfico de barras semanal.

### 8.3 Lead Time
- `AVG(completed_at - created_at)` por semana.
- Tabela + linha de tendência.

---

## 9. Persistência e Sincronização (Offline-first)

- **Frontend**:
  - TanStack Query persiste `queryCache` no `localStorage` (plugin `persistQueryClient`).
  - Mutations entram em `offlineQueue`; `online` event despenca.
  - Conflitos: servidor vence; frontend refaz a query.
- **Backend**:
  - Toda mutation retorna o recurso atualizado; frontend substitui no cache.
  - `ETag` + `If-Match` para recursos críticos (futuro).
- **Storage de anexos**: disco local do backend; path salvo em `attachment.storage_key`.

---

## 10. Deploy e Infraestrutura

- **Local** via `docker-compose.yml`:
  - `db: postgres:17-alpine` (volume nomeado).
  - `api: node:22-alpine` (Fastify, porta 3001).
  - `web: node:22-alpine` (build Vite servido via `vite preview`, porta 5173).
  - Variáveis em `.env` (commitado como `.env.example`).
- **Inicialização**:
  - `docker compose up -d` → sobe DB, roda `prisma migrate deploy`, seed de board padrão.
- **Futuro** (fora do escopo v1): sync multi-dispositivo exigirá backend público + resolução de conflitos.

---

## 11. Roadmap (Fases)

| Fase | Escopo                                            | Marco                       |
| ---- | ------------------------------------------------- | --------------------------- |
| 0    | Setup do monorepo, Prisma schema, docker-compose  | Subir board vazio local     |
| 1    | Board + colunas + tickets (CRUD + DnD)            | Mover tickets funcionando   |
| 2    | Etiquetas, filtros, comentários                   | Filtrar e comentar          |
| 3    | Anexos, prazos, assignee                          | Upload + alerta de atraso   |
| 4    | Relatórios (CFD, velocidade, lead time)           | Dashboard de métricas       |
| 5    | Tema dark, PWA config, otimizações de UX         | Refinamento visual          |
| 6+   | Automações, retrospectiva, sync multi-dispositivo | Backlog futuro              |

---

## 12. Decisões Técnicas (ADR resumos)

### ADR-001 — dnd-kit nativo
**Contexto**: escolher biblioteca de drag-and-drop.
**Decisão**: dnd-kit (core + sortable).
**Motivação**: acessível (suporte a teclado), TypeScript-first, leve, sem jQuery/dependências pesadas.
**Consequência**: curva de aprendizado moderada; documentação rica.

### ADR-002 — Persistência local offline-first
**Contexto**: uso pessoal, sem necessidade de servidor agora, mas com stack full escolhida.
**Decisão**: servidor local (Fastify + Postgres) com frontend offline-first via TanStack Query.
**Motivação**: aproveita a stack escolhida, prepara terreno para sync futuro.
**Consequência**: complexidade de fila de sincronização no frontend.

### ADR-003 — position como float
**Contexto**: reordenar tickets sem reescrever toda a coluna a cada insert.
**Decisão**: campo `position` decimal (float); novo ticket entre A (1.0) e B (2.0) recebe 1.5.
**Motevação**: inserts O(1); rebalanceamento só quando fração < 0.001.
**Consequência**: rebalanceamento raro, mas necessário.

### ADR-004 — Sem tabela de usuários
**Contexto**: uso pessoal.
**Decisão**: `assignee` é texto livre; autenticação fica para o futuro.
**Motivação**: entrega rápida; schema mantém campo para migração.
**Consequência**: sem controle de acesso por usuário agora.

---

## 13. Próximos passos sugeridos

1. Criar monorepo (`apps/web`, `apps/api`, `packages/schemas` para Zod/Prisma compartilhados).
2. Subir `docker-compose.yml` com Postgres e rodar `prisma migrate dev`.
3. Implementar Fase 1 (board + colunas + tickets + DnD).
4. Configurar Playwright com teste e2e de movimentação entre colunas.
