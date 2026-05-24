# Tasks: Reservaciones — Backend CRUD API

**Input**: Design documents from `specs/002-reservaciones-crud/`
**Prerequisites**: plan.md ✅ spec.md ✅ research.md ✅ data-model.md ✅ contracts/api.md ✅

**Tests**: Incluidos — el spec (FR-012) y la constitution (Principio III) exigen tests antes de la implementación en server routes.

**Organization**: Tareas agrupadas por User Story para implementación y prueba independiente.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Puede ejecutarse en paralelo (archivos distintos, sin dependencias incompletas)
- **[Story]**: User story al que pertenece la tarea (US0–US4)
- Todos los paths son relativos a la raíz del repositorio

---

## Phase 1: Setup

**Purpose**: Crear la estructura de directorios y el mock de base de datos compartido por todos los tests.

- [ ] T001 Create directory structure: `server/api/branches/`, `server/api/reservations/`, `tests/server/api/branches/`, `tests/server/api/reservations/`
- [ ] T002 [P] Create `tests/mocks/db.ts` — centralized Drizzle db mock with vi.fn() stubs for select, insert, update; used by all server route tests

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Infraestructura compartida que DEBE completarse antes de cualquier User Story.

**⚠️ CRÍTICO**: Ningún US puede comenzar hasta que esta fase esté completa.

- [ ] T003 [P] Extend `server/utils/error-handler.ts` — add `UnprocessableError` (422), `NotFoundError` (404), `ConflictError` (409) classes and update `handleError()` to detect them by instanceof before the generic fallback
- [ ] T004 [P] Create `server/utils/response.ts` — export `ok<T>(data, meta?)` and `paginated<T>(data, page, limit, total)` helpers returning `{ data, error: null, meta }` shape
- [ ] T005 [P] Create `types/reservations.ts` — export `CreateReservationSchema`, `UpdateReservationSchema`, `ListReservationsQuerySchema`, `BranchSchema`, `ReservationSchema` (Zod) and their inferred TypeScript types
- [ ] T006 Update `server/db/schema.ts` — add `postalCode: varchar('postal_code', { length: 10 })` to `branches` table and add three indexes: `branches_active_idx` (partial WHERE is_active=true), `branches_postal_code_idx`, `branches_coords_idx` on (lat, lng)
- [ ] T007 Run `pnpm db:generate` to create `server/db/migrations/0002_branches_postal_code_indexes.sql`, verify SQL content matches data-model.md, then run `pnpm db:migrate` to apply (depends on T006)

**Checkpoint**: Foundation ready — user story implementation can begin in parallel.

---

## Phase 3: US0 — Listar sucursales activas (Priority: P1) 🎯 MVP

**Goal**: `GET /api/branches` devuelve solo sucursales activas ordenadas por nombre.

**Independent Test**: `curl http://localhost:3000/api/branches` retorna `{ data: [...], error: null, meta: null }` con solo sucursales donde `is_active = true`, ordenadas alfabéticamente.

- [ ] T008 [US0] Write unit tests in `tests/server/api/branches/index.get.test.ts` — cover: returns only active branches sorted by name, returns empty array when none active, response shape matches contract (verify tests FAIL before T009)
- [ ] T009 [US0] Implement `server/api/branches/index.get.ts` — query `db.select({ id, name, address, postalCode }).from(branches).where(eq(branches.isActive, true)).orderBy(asc(branches.name))`, return `ok(rows)` (depends on T008)

**Checkpoint**: `GET /api/branches` funcional e independientemente testeable.

---

## Phase 4: US1 — Crear una reservación (Priority: P1) 🎯 MVP

**Goal**: `POST /api/reservations` crea una reservación con `status = pending` y devuelve 201.

**Independent Test**: POST con body válido retorna 201 + objeto con `id` y `status: "pending"`. POST con `partySize: 0` retorna 422. POST con `branchId` inexistente retorna 422.

- [ ] T010 [US1] Write unit tests in `tests/server/api/reservations/index.post.test.ts` — cover: creates reservation and returns 201, missing required field returns 422 with issues, partySize=0 returns 422, nonexistent branchId returns 422, past reservationDate returns 422 (verify tests FAIL before T011)
- [ ] T011 [US1] Implement `server/api/reservations/index.post.ts` — use `readValidatedBody(event, CreateReservationSchema.parse)`, validate branchId exists with a db lookup (throw `UnprocessableError` if not), insert into `reservations`, return `ok(row)` with status 201 (depends on T010)

**Checkpoint**: `POST /api/reservations` funcional. US0 + US1 entregan el formulario completo end-to-end.

---

## Phase 5: US2 — Consultar reservaciones (Priority: P2)

**Goal**: `GET /api/reservations` lista paginada con filtros. `GET /api/reservations/:id` retorna una reservación por UUID.

**Independent Test**: GET sin filtros retorna array paginado excluyendo `deleted_at IS NOT NULL`. GET con `?status=confirmed` filtra correctamente. GET `/:id` con UUID inválido retorna 404.

- [ ] T012 [P] [US2] Write unit tests in `tests/server/api/reservations/index.get.test.ts` — cover: returns paginated list excluding soft-deleted, filters by branchId/status/reservationDate, empty result returns empty array with meta, invalid query params return 422 (verify tests FAIL before T014)
- [ ] T013 [P] [US2] Write unit tests in `tests/server/api/reservations/[id].get.test.ts` — cover: returns reservation by UUID with 200, nonexistent/deleted ID returns 404 (verify tests FAIL before T015)
- [ ] T014 [P] [US2] Implement `server/api/reservations/index.get.ts` — validate query with `ListReservationsQuerySchema`, build Drizzle query with `isNull(deletedAt)` + optional `and()` filters, apply `limit/offset`, run COUNT(*) for meta, return `paginated(rows, page, limit, total)` (depends on T012)
- [ ] T015 [P] [US2] Implement `server/api/reservations/[id].get.ts` — `getRouterParam(event, 'id')`, query with `and(eq(id, param), isNull(deletedAt))`, throw `NotFoundError` if null, return `ok(row)` (depends on T013)

**Checkpoint**: Listado y detalle de reservaciones funcionan con filtros y paginación.

---

## Phase 6: US3 — Actualizar una reservación (Priority: P2)

**Goal**: `PATCH /api/reservations/:id` actualiza campos editables. Rechaza modificaciones a reservaciones canceladas con 409.

**Independent Test**: PATCH `{ status: "confirmed" }` en reservación `pending` devuelve 200 con status actualizado. PATCH en reservación `cancelled` devuelve 409. PATCH en ID inexistente devuelve 404.

- [ ] T016 [US3] Write unit tests in `tests/server/api/reservations/[id].patch.test.ts` — cover: updates status to confirmed returns 200, updates notes only leaves other fields unchanged, cancelled reservation returns 409, nonexistent ID returns 404, empty payload returns 422, forbidden field (branchId) is ignored (verify tests FAIL before T017)
- [ ] T017 [US3] Implement `server/api/reservations/[id].patch.ts` — validate body with `UpdateReservationSchema`, fetch reservation (throw `NotFoundError` if missing), throw `ConflictError` if `status === 'cancelled'`, apply partial update with `updatedAt = now()`, return `ok(updated)` (depends on T016)

**Checkpoint**: Confirmación de reservaciones funcional.

---

## Phase 7: US4 — Cancelar una reservación (Priority: P2)

**Goal**: `DELETE /api/reservations/:id` hace soft-delete: `status = cancelled` + `deleted_at = NOW()`.

**Independent Test**: DELETE en reservación existente devuelve 200 con `status: "cancelled"` y `deletedAt` no nulo. El registro sigue en la DB. DELETE repetido devuelve 409.

- [ ] T018 [US4] Write unit tests in `tests/server/api/reservations/[id].delete.test.ts` — cover: cancels reservation and returns 200 with deletedAt set, record still exists in db with status=cancelled, already-cancelled returns 409, nonexistent ID returns 404 (verify tests FAIL before T019)
- [ ] T019 [US4] Implement `server/api/reservations/[id].delete.ts` — fetch reservation (throw `NotFoundError` if missing or already has deletedAt), throw `ConflictError` if `status === 'cancelled'`, update `status = 'cancelled'` and `deleted_at = now()`, return `ok(updated)` (depends on T018)

**Checkpoint**: Ciclo de vida completo de reservaciones implementado.

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Validación final de cobertura, smoke test manual y verificación de calidad.

- [ ] T020 [P] Run `pnpm test --coverage` — verify server route coverage ≥ 80% (Principio III constitution); fix any failing tests before proceeding
- [ ] T021 [P] Manual smoke test of all 6 endpoints via curl following `specs/002-reservaciones-crud/quickstart.md` — verify responses match contracts in `specs/002-reservaciones-crud/contracts/api.md`
- [ ] T022 Commit final implementation with `/commit`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: Sin dependencias — puede empezar de inmediato
- **Foundational (Phase 2)**: Depende de Phase 1 — **BLOQUEA todos los US**
- **US0 (Phase 3)**: Depende de Phase 2 — puede empezar en paralelo con US1
- **US1 (Phase 4)**: Depende de Phase 2 — puede empezar en paralelo con US0
- **US2, US3, US4 (Phases 5–7)**: Dependen de Phase 2; US3/US4 pueden aprovechar patrones establecidos en US2
- **Polish (Phase 8)**: Depende de todas las fases anteriores

### User Story Dependencies

- **US0 (P1)**: Independiente — solo necesita `branches` table y `db`
- **US1 (P1)**: Independiente — solo necesita `reservations` table, `branches` para validar FK
- **US2 (P2)**: Independiente — solo lee `reservations`
- **US3 (P2)**: Independiente — usa patrones de US2 para fetch, pero no lo bloquea
- **US4 (P2)**: Independiente — usa patrones de US2/US3 para fetch, pero no los bloquea

### Within Each User Story

1. Tests primero (TDD) — verificar que FALLAN antes de implementar
2. Implementación del handler
3. Verificar que los tests PASAN
4. Checkpoint manual

### Parallel Opportunities

```bash
# Phase 2 — todo en paralelo:
T003  # error-handler.ts
T004  # response.ts
T005  # types/reservations.ts
# T006 → T007 secuencial (migración depende del schema)

# Phase 5 — tests en paralelo, handlers en paralelo:
T012  # tests index.get
T013  # tests [id].get
T014  # handler index.get
T015  # handler [id].get

# Phase 8 — polish en paralelo:
T020  # coverage
T021  # smoke test
```

---

## Implementation Strategy

### MVP (US0 + US1 — el formulario de reservaciones)

1. Phase 1: Setup
2. Phase 2: Foundational
3. Phase 3: US0 — branch selector
4. Phase 4: US1 — crear reservación
5. **STOP y VALIDAR**: El formulario público está completo end-to-end

### Incremental

1. Setup + Foundational → base lista
2. US0 + US1 → formulario público funcional (MVP)
3. US2 → staff puede ver reservaciones
4. US3 → staff puede confirmar reservaciones
5. US4 → staff puede cancelar reservaciones
6. Polish → cobertura y smoke tests

---

## Notes

- `[P]` = archivos distintos, sin dependencias incompletas
- `[USn]` vincula la tarea al user story para trazabilidad
- Tests DEBEN fallar antes de escribir la implementación (constitution Principio III)
- El mock de db en `tests/mocks/db.ts` es compartido por todos los tests — no mockear inline
- `deleted_at IS NULL` DEBE estar en TODAS las queries de lectura por defecto
- Los campos `branchId`, `contactName`, `contactPhone` son inmutables post-creación — no incluirlos en `UpdateReservationSchema`
