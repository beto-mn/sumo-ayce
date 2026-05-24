# Research: Reservaciones — Backend CRUD API

**Date**: 2026-05-23 | **Branch**: `feat/002-reservaciones-crud`

---

## 1. Nuxt 3 Server Routes con H3 + Drizzle ORM

**Decision**: Usar `defineEventHandler` con archivos nombrados por método HTTP.

**Rationale**: Nuxt 3 resuelve el verbo HTTP automáticamente desde el nombre del archivo (`index.get.ts` → GET, `index.post.ts` → POST, `[id].patch.ts` → PATCH). Esto elimina routing manual y produce rutas predecibles. H3 es la capa de request/response — provee `getQuery`, `readValidatedBody`, `getRouterParam` y `createError`.

```ts
// Pattern estándar para un handler
export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  const body = await readValidatedBody(event, schema.parse)
  const result = await db.query.reservations.findFirst({ where: eq(reservations.id, id) })
  if (!result) throw createError({ statusCode: 404 })
  return { data: result }
})
```

**Alternativas consideradas**: Definir todo en un archivo con `eventHandler` + switch por método — rechazado por violar principio de single responsibility y dificultar el testing individual.

---

## 2. Validación de Input con Zod

**Decision**: Usar `readValidatedBody(event, schema.parse)` para body y validación manual para query params.

**Rationale**: `readValidatedBody` de H3 integra Zod nativamente — lanza un H3Error con status 422 automáticamente si la validación falla. Para query params, usar `getQuery` + `schema.safeParse` manual ya que `getValidatedQuery` también está disponible en H3 v1.x.

```ts
// Body validation
const body = await readValidatedBody(event, CreateReservationSchema.parse)

// Query params validation
const query = getValidatedQuery(event, ListReservacionesQuerySchema.parse)
```

Los schemas Zod viven en `types/reservaciones.ts` para ser compartidos si el front los necesita en el futuro.

**Status HTTP para validación**: 422 (Unprocessable Entity). H3's `readValidatedBody` usa 422 por defecto cuando Zod lanza — consistente con el spec. La constitution dice 400, pero 422 es semánticamente correcto para input bien formado pero inválido en su contenido. Documentado en Complexity Tracking del plan.

---

## 3. Respuesta JSON Consistente

**Decision**: Estructura `{ data, error, meta }` en todos los endpoints.

**Rationale**: El spec define esta estructura en FR-011. Proporciona un contrato predecible para el cliente.

```ts
// Éxito con lista paginada
{ data: Reservation[], error: null, meta: { page, limit, total } }

// Éxito con un recurso
{ data: Reservation, error: null, meta: null }

// Error
{ data: null, error: { message: string, issues?: ZodIssue[] }, meta: null }
```

Helper centralizado para construir la respuesta:

```ts
// server/utils/response.ts
export const ok = <T>(data: T, meta?: Meta) => ({ data, error: null, meta: meta ?? null })
export const err = (message: string, issues?: unknown) => ({ data: null, error: { message, issues }, meta: null })
```

---

## 4. Manejo de Errores — Extensión de `error-handler.ts`

**Decision**: Extender el error handler existente con tres nuevos tipos de error.

**Rationale**: El handler actual cubre `ZodError` (400) y errores genéricos (500). Se necesitan:

| Error class | Status | Cuándo |
|-------------|--------|--------|
| `UnprocessableError` | 422 | Input válido en formato pero inválido en contenido (ej. `branch_id` no existe) |
| `NotFoundError` | 404 | Recurso no encontrado |
| `ConflictError` | 409 | Operación inválida dado el estado actual (ej. cancelar una reservación ya cancelada) |

```ts
export class UnprocessableError extends Error { readonly statusCode = 422 }
export class NotFoundError extends Error { readonly statusCode = 404 }
export class ConflictError extends Error { readonly statusCode = 409 }
```

El `handleError` existente detecta estas por `instanceof` antes del fallback genérico.

---

## 5. Paginación

**Decision**: `?page=1&limit=20` con valores por defecto, usando Drizzle `.limit()` + `.offset()`.

**Rationale**: Simple y sin dependencias adicionales. El spec define 20 como default.

```ts
const { page = 1, limit = 20 } = query
const offset = (page - 1) * limit
const rows = await db.select().from(reservations).limit(limit).offset(offset)
```

`meta` incluye `{ page, limit, total }` donde `total` se obtiene con un `COUNT(*)` en la misma query (usando Drizzle subquery o una segunda query ligera).

---

## 6. Soft-Delete

**Decision**: Filtrar `WHERE deleted_at IS NULL` en todas las queries de lectura y mutación usando Drizzle `isNull`.

**Rationale**: El schema ya tiene `deleted_at` en `reservations`. La constitution y el spec exigen que registros con `deleted_at IS NOT NULL` nunca aparezcan en queries normales.

```ts
import { isNull } from 'drizzle-orm'
.where(and(eq(reservations.id, id), isNull(reservations.deletedAt)))
```

Para el soft-delete (DELETE endpoint): `UPDATE reservations SET status = 'cancelled', deleted_at = NOW() WHERE id = :id`.

---

## 7. Migración: `postal_code` + Índices en `branches`

**Decision**: Nueva migración `0002_branches_postal_code_indexes.sql` aplicada con `drizzle-kit migrate`.

**Rationale**: El schema existente ya fue migrado en feat/001. Agregar una columna nullable no requiere data migration — todos los registros existentes quedan con `NULL`.

```sql
ALTER TABLE branches ADD COLUMN postal_code VARCHAR(10);

CREATE INDEX branches_active_idx ON branches (is_active) WHERE is_active = true;
CREATE INDEX branches_postal_code_idx ON branches (postal_code);
CREATE INDEX branches_coords_idx ON branches (lat, lng);
```

El schema de Drizzle (`schema.ts`) también se actualiza para reflejar la columna e índices — Drizzle genera la migración automáticamente con `drizzle-kit generate`.

---

## 8. Testing con Vitest

**Decision**: Tests unitarios co-localizados en `tests/server/api/`, usando `mockNuxtImport` de `@nuxt/test-utils` para mockear el módulo `db`.

**Rationale**: El spec exige tests por endpoint. Los server routes de Nuxt se pueden testear invocando el handler directamente con un evento mockeado, sin levantar un servidor.

```ts
// Pattern de test
import { describe, it, expect, vi } from 'vitest'
import handler from '~/server/api/reservations/index.post'
import { mockNuxtImport } from '@nuxt/test-utils/runtime'

mockNuxtImport('~/server/utils/db', () => ({ db: mockDb }))

describe('POST /api/reservations', () => {
  it('should create a reservation and return 201', async () => { ... })
  it('should return 422 when party_size is 0', async () => { ... })
})
```

Los mocks de `db` se centralizan en `tests/mocks/db.ts` per la constitution (Principio III).

---

## Decisiones Resueltas

| NEEDS CLARIFICATION | Decisión |
|---------------------|----------|
| Framework de testing | Vitest + `@nuxt/test-utils` (ya en el proyecto) |
| Formato de respuesta | `{ data, error, meta }` con helper en `server/utils/response.ts` |
| Status HTTP validación | 422 (H3 default + semánticamente correcto) |
| Migración | `drizzle-kit generate` + nueva SQL migration |
| Paginación | `?page&limit` con Drizzle offset/limit |
