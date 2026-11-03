# @sentio/graphql

- `schema.graphql`: SDL generado por `apps/api` (code-first). **No editar a mano.**
  Regenerar con `pnpm schema:emit` (no requiere MongoDB) o arrancando la API en desarrollo.
- `operations/**/*.graphql`: queries, mutaciones y fragments que usan los clientes.
- `codegen.ts`: genera tipos + hooks de Apollo en `packages/api-client/src/generated/graphql.ts`.

```powershell
pnpm schema:emit   # API → schema.graphql
pnpm codegen       # schema + operations → api-client/src/generated
```
