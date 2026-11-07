# Índices de Atlas Search

Definiciones que usa `AtlasSearchProvider` (`SEARCH_PROVIDER=atlas`). Con MongoDB local
(`SEARCH_PROVIDER=local`, por defecto) no hacen falta: se usan los índices de Mongoose.

| Archivo             | Colección | Nombre (variable de entorno)                |
| ------------------- | --------- | ------------------------------------------- |
| `users_search.json` | `users`   | `users_search` (`ATLAS_SEARCH_USERS_INDEX`) |
| `posts_search.json` | `posts`   | `posts_search` (`ATLAS_SEARCH_POSTS_INDEX`) |

Crear o actualizar (Atlas CLI; ajusta `database` en el JSON si tu base no se llama `sentio`):

```powershell
atlas clusters search indexes create --clusterName <cluster> --file infra/atlas-search/users_search.json
atlas clusters search indexes create --clusterName <cluster> --file infra/atlas-search/posts_search.json
```

Notas:

- Se indexan los campos **normalizados** (`searchName`, `searchTitle`, `searchText`), los mismos
  que usa la búsqueda local; ejecuta `pnpm --filter @sentio/api search:backfill` si hay
  documentos anteriores a la Fase 5.
- `status`, `visibility` y `handle` son `token` para poder filtrar con `equals` y ordenar.
- `createdAt` y `_id` permiten `sort` + `searchAfter` (paginación por cursor).
