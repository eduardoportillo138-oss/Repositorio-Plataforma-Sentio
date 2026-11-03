# Sentio

Monorepo de la red social Sentio (feed con scroll infinito y grupos privados).

| Ruta                  | Contenido                                                         |
| --------------------- | ----------------------------------------------------------------- |
| `apps/api`            | NestJS + GraphQL code-first (Apollo), Socket.IO, Mongoose, BullMQ |
| `apps/web`            | Next.js 15 (App Router)                                           |
| `apps/mobile`         | Expo + Expo Router                                                |
| `packages/graphql`    | `schema.graphql` generado por la API, operaciones y codegen       |
| `packages/api-client` | Apollo Client y hooks generados                                   |
| `packages/ui`         | Componentes Tamagui (web y nativo)                                |
| `packages/core`       | Validación zod y reglas de permisos                               |
| `packages/realtime`   | Cliente Socket.IO tipado                                          |
| `packages/i18n`       | Traducciones es (por defecto) y en                                |
| `packages/config`     | tsconfig, ESLint y Prettier compartidos                           |
| `infra`               | docker-compose con MongoDB 7 (replica set `rs0`) y Redis 7        |

Reglas de dependencia: `apps/*` puede importar `packages/*`; `packages/*` nunca importa `apps/*`;
`packages/ui` y `packages/core` no usan APIs del DOM ni nativas (lo verifica ESLint).

## Requisitos

- Node 22+ (`.nvmrc` = 24), pnpm 10 (`npm i -g pnpm@10`)
- Docker Desktop (para MongoDB y Redis locales) o MongoDB Atlas + Redis remoto

## Arranque local (PowerShell)

```powershell
Copy-Item .env.example .env      # y rellena los secretos
pnpm install
pnpm infra:up                    # MongoDB rs0 + Redis
pnpm build --filter "./packages/*"
pnpm dev
```

## Scripts

`pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm codegen`, `pnpm format`.
