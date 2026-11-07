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
pnpm infra:up                    # MongoDB 7 (rs0) + Redis 7 + MinIO (S3) con Docker
pnpm dev                         # API :4000, web :3000 (compila core/realtime antes)
pnpm dev:mobile                  # Expo (en otra terminal)
```

- API / GraphQL Playground: http://localhost:4000/graphql (`GRAPHQL_PLAYGROUND=true`)
- Web: http://localhost:3000 (redirige a `/es` o `/en`)
- Salud: http://localhost:4000/health
- MinIO (consola): http://localhost:9001 (usuario y contraseña: `S3_ACCESS_KEY_ID` / `S3_SECRET_ACCESS_KEY`)

### Sin Docker

```powershell
pnpm --filter @sentio/api db:memory   # MongoDB en memoria, rs0 en :27017 (datos efímeros)
$env:QUEUES_ENABLED = 'false'          # sin Redis: desactiva BullMQ (los medios se procesan en línea)
$env:STORAGE_DRIVER = 'memory'         # sin MinIO: la API guarda y sirve las fotos en memoria
pnpm dev
```

O usa MongoDB Atlas (`MONGODB_URI=mongodb+srv://…`) y un Redis administrado (`REDIS_URL=rediss://…`).

## Flujo del schema GraphQL

```powershell
pnpm schema:emit   # resolvers code-first → packages/graphql/schema.graphql (sin BD)
pnpm codegen       # schema + operations → packages/api-client/src/generated
```

`schema.graphql` está versionado y **no se edita a mano**: el CI falla si no coincide con lo que
genera `pnpm schema:emit`, o si `packages/api-client/src/generated` quedó desactualizado.

## Scripts

`pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm codegen`, `pnpm schema:emit`, `pnpm format`.

## Pruebas

No requieren Docker ni Redis: la API se prueba contra MongoDB en memoria (mongodb-memory-server,
replica set de un nodo para las transacciones) con las colas desactivadas.

```powershell
pnpm test                                   # todo el monorepo (core + api)
pnpm --filter @sentio/core test             # reglas de permisos y validación
pnpm --filter @sentio/api test:unit         # unitarias de la API (src/**/*.spec.ts)
pnpm --filter @sentio/api test:e2e          # integración (test/**/*.e2e-spec.ts)
pnpm --filter @sentio/api test:handles      # jest --detectOpenHandles, para cazar fugas
pnpm --filter @sentio/api exec jest test/groups.e2e-spec.ts   # un solo archivo
```

- La primera ejecución descarga el binario de MongoDB (~100 MB) a la cache de
  mongodb-memory-server; las siguientes son rápidas.
- Las pruebas e2e levantan la API completa con `createTestApp()` (`apps/api/test/utils`).
  Cada archivo usa su propia app; `close()` cierra Nest, Socket.IO y Mongoose, y
  `global-teardown.ts` detiene MongoDB. Jest termina solo: no se usa `--forceExit`.
- `apps/api/test/groups.e2e-spec.ts` contiene la matriz de permisos de grupos
  (owner/admin/moderator/member/pending/banned/no miembro × público/privado/secreto). Si cambias
  una regla de `packages/core/src/permissions`, actualiza esa matriz a propósito.

## Secretos y hook de pre-commit

- `.env` nunca se versiona; `.env.example` solo lleva valores de ejemplo y los secretos vacíos.
- `pnpm install` instala con lefthook un hook de pre-commit que ejecuta
  [gitleaks](https://github.com/gitleaks/gitleaks) sobre los cambios en stage y bloquea el
  commit si encuentra un secreto. Necesitas gitleaks en el `PATH`:

  ```powershell
  winget install --id Gitleaks.Gitleaks -e   # abre una terminal nueva después
  ```

- Falso positivo: añade su `Fingerprint` (lo imprime gitleaks) a `.gitleaksignore`.
- Para escanear todo el historial a mano: `gitleaks git . --log-opts="--all" --redact`.

## CI (GitHub Actions)

`.github/workflows/ci.yml` corre en cada push y pull request a `main`:

| Job       | Qué hace                                                                                                         |
| --------- | ---------------------------------------------------------------------------------------------------------------- |
| `secrets` | gitleaks sobre los commits nuevos del push o del PR (todo el historial en el primer push).                       |
| `checks`  | `install --frozen-lockfile`, `lint`, `typecheck`, `test`, y comprueba `schema.graphql` y el código de `codegen`. |

El job `checks` usa Node según `.nvmrc` y pnpm 10 (campo `packageManager`) con cache del store y
del binario de MongoDB.

Dependabot (`.github/dependabot.yml`) abre PRs semanales agrupados para npm y GitHub Actions.
React y React Native no se actualizan solos: siguen la versión de Expo SDK.

Para reproducir el CI en local antes de un PR:

```powershell
pnpm install --frozen-lockfile
pnpm lint; pnpm typecheck; pnpm test
pnpm schema:emit; pnpm codegen; git status --short   # no debe mostrar cambios
```

## Seguridad y licencia

- Reporta vulnerabilidades de forma privada según [SECURITY.md](SECURITY.md).
- Código propietario: todos los derechos reservados. Ver [LICENSE](LICENSE).
