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
Copy-Item .env.example .env      # rellena JWT_ACCESS_SECRET y JWT_REFRESH_SECRET
pnpm install
pnpm infra:up                    # MongoDB 7 (rs0) + Redis 7 con Docker
pnpm dev                         # API :4000, web :3000 (compila core/realtime antes)
pnpm dev:mobile                  # Expo (en otra terminal)
```

- API / GraphQL Playground: http://localhost:4000/graphql (`GRAPHQL_PLAYGROUND=true`)
- Web: http://localhost:3000 (redirige a `/es` o `/en`)
- Salud: http://localhost:4000/health

### Sin Docker

```powershell
pnpm --filter @sentio/api db:memory   # MongoDB en memoria, rs0 en :27017 (datos efímeros)
$env:QUEUES_ENABLED = 'false'          # sin Redis: desactiva BullMQ
pnpm dev
```

O usa MongoDB Atlas (`MONGODB_URI=mongodb+srv://…`) y un Redis administrado (`REDIS_URL=rediss://…`).

## Flujo del schema GraphQL

```powershell
pnpm schema:emit   # resolvers code-first → packages/graphql/schema.graphql (sin BD)
pnpm codegen       # schema + operations → packages/api-client/src/generated
```

## Scripts

`pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm codegen`, `pnpm schema:emit`, `pnpm format`.

Las pruebas de la API (`pnpm --filter @sentio/api test`) usan mongodb-memory-server: no requieren Docker.
