# Campeonato FC

Sistema de campeonato de futebol com 10 participantes e elencos fixos de 16 jogadores.

## Requisitos

- Node.js 20+ e pnpm
- PostgreSQL 15+

## Configuração

1. Copie `.env.example` para `.env` e configure `DATABASE_URL`.
2. Instale as dependências: `pnpm install --frozen-lockfile`.
3. Gere o Prisma Client: `pnpm db:generate`.
4. Aplique as migrations: `pnpm db:migrate` (desenvolvimento) ou `pnpm db:migrate:deploy` (produção).
5. Carregue os participantes e elencos: `pnpm db:seed`.

O seed é idempotente: execuções repetidas não duplicam participantes nem jogadores. Use `pnpm db:seed` com segurança após reset do banco.

## Desenvolvimento

```bash
pnpm dev         # Servidor de desenvolvimento
pnpm lint        # ESLint
pnpm typecheck   # Verificação de tipos
pnpm build       # Build de produção
```

## Prisma

O client é gerado em `app/generated/prisma` (ignorado pelo Git). Use o singleton compartilhado em `@/lib/prisma` apenas em código server-side.
