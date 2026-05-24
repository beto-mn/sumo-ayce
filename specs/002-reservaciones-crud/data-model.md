# Data Model: Reservaciones — Backend CRUD API

**Date**: 2026-05-23 | **Branch**: `feat/002-reservaciones-crud`

---

## Schema Changes

### `branches` — Columna e Índices Nuevos

La tabla `branches` ya existe. Esta feature agrega:

```ts
// server/db/schema.ts — cambios a la tabla branches
postalCode: varchar('postal_code', { length: 10 }),  // nullable — search by CP
```

Índices nuevos:
```ts
index('branches_active_idx').on(t.isActive).where(sql`is_active = true`),
index('branches_postal_code_idx').on(t.postalCode),
index('branches_coords_idx').on(t.lat, t.lng),
```

**Migración**: `server/db/migrations/0002_branches_postal_code_indexes.sql`

```sql
ALTER TABLE "branches" ADD COLUMN "postal_code" varchar(10);

CREATE INDEX "branches_active_idx" ON "branches" ("is_active") WHERE "is_active" = true;
CREATE INDEX "branches_postal_code_idx" ON "branches" ("postal_code");
CREATE INDEX "branches_coords_idx" ON "branches" ("lat","lng");
```

---

## Zod Schemas (Validación de Input)

Ubicación: `types/reservaciones.ts`

```ts
import { z } from 'zod'

// ── Sucursales ────────────────────────────────────────────────────────────────

export const BranchSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  address: z.string(),
  postalCode: z.string().nullable(),
})

// ── Reservaciones — Input ─────────────────────────────────────────────────────

export const CreateReservacionSchema = z.object({
  branchId: z.string().uuid(),
  contactName: z.string().min(1).max(100),
  contactPhone: z.string().min(1).max(20),
  partySize: z.number().int().positive(),
  reservationDate: z.string().date(),              // ISO date "YYYY-MM-DD"
  reservationTime: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/),  // "HH:MM"
  notes: z.string().max(500).optional(),
})

export const UpdateReservacionSchema = z.object({
  status: z.enum(['pending', 'confirmed']).optional(),
  reservationDate: z.string().date().optional(),
  reservationTime: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/).optional(),
  partySize: z.number().int().positive().optional(),
  notes: z.string().max(500).nullable().optional(),
}).refine(data => Object.keys(data).length > 0, {
  message: 'At least one field must be provided',
})

export const ListReservacionesQuerySchema = z.object({
  branchId: z.string().uuid().optional(),
  status: z.enum(['pending', 'confirmed', 'cancelled']).optional(),
  reservationDate: z.string().date().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
})

// ── Reservaciones — Output ────────────────────────────────────────────────────

export const ReservacionSchema = z.object({
  id: z.string().uuid(),
  branchId: z.string().uuid(),
  contactName: z.string(),
  contactPhone: z.string(),
  partySize: z.number(),
  reservationDate: z.string(),
  reservationTime: z.string(),
  status: z.enum(['pending', 'confirmed', 'cancelled']),
  notes: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
  deletedAt: z.string().nullable(),
})

export type Branch = z.infer<typeof BranchSchema>
export type CreateReservacion = z.infer<typeof CreateReservacionSchema>
export type UpdateReservacion = z.infer<typeof UpdateReservacionSchema>
export type Reservacion = z.infer<typeof ReservacionSchema>
export type ListReservacionesQuery = z.infer<typeof ListReservacionesQuerySchema>
```

---

## Response Helper

Ubicación: `server/utils/response.ts`

```ts
type Meta = { page: number; limit: number; total: number } | null

export const ok = <T>(data: T, meta: Meta = null) =>
  ({ data, error: null, meta })

export const paginated = <T>(data: T[], page: number, limit: number, total: number) =>
  ok(data, { page, limit, total })
```

---

## Error Classes (extensión de `error-handler.ts`)

```ts
export class UnprocessableError extends Error {
  readonly statusCode = 422
  constructor(message: string) { super(message) }
}

export class NotFoundError extends Error {
  readonly statusCode = 404
  constructor(resource: string) { super(`${resource} not found`) }
}

export class ConflictError extends Error {
  readonly statusCode = 409
  constructor(message: string) { super(message) }
}
```

---

## Estado y Ciclo de Vida de Reservaciones

```
         POST /reservaciones
               │
               ▼
           [pending]  ←── estado inicial
               │
    PATCH status=confirmed
               │
               ▼
          [confirmed]
               │
    DELETE (soft-delete)
               │
               ▼
          [cancelled] ── deleted_at = NOW()
```

Reglas:
- `cancelled` es estado terminal — no se puede modificar ni re-cancelar (→ 409)
- `deleted_at IS NOT NULL` implica siempre `status = 'cancelled'`
- Los campos editables vía PATCH son: `status`, `reservationDate`, `reservationTime`, `partySize`, `notes`
- `branchId`, `contactName`, `contactPhone` son inmutables post-creación
