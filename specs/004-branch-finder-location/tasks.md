# Tasks: Branch Finder por Ubicación

**Input**: Design documents from `specs/004-branch-finder-location/`
**Branch**: `feat/004-branch-finder-location`
**Prerequisites**: plan.md ✅ · spec.md ✅ · research.md ✅ · data-model.md ✅ · contracts/api.md ✅

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Puede correr en paralelo (archivos distintos, sin dependencias incompletas)
- **[Story]**: User story al que pertenece la tarea (US1–US2)
- Todos los paths son relativos al root del repositorio

---

## Phase 1: Setup

**Purpose**: Sin dependencias nuevas ni migración de BD. Verificar que la tabla `branches` tiene `lat`/`lng` y actualizar `.env.example`.

- [x] T001 Update `.env.example` — add `BRANCH_FINDER_DEFAULT_RADIUS_KM=10` and `BRANCH_FINDER_MAX_RADIUS_KM=50` with descriptions, following existing format

**Checkpoint**: `.env.example` tiene las dos nuevas variables documentadas.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Utilidades core que ambas user stories necesitan. Ninguna historia puede implementarse sin esta fase.

**⚠️ CRITICAL**: No iniciar ningún user story hasta completar T002–T003.

- [x] T002 [P] Create `server/utils/haversine.ts` — export `haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number` implementing the Haversine formula returning distance in km rounded to 2 decimals; create `tests/server/utils/haversine.test.ts` verifying: (a) known distance between two CDMX points matches expected ±0.1 km; (b) symmetry A→B equals B→A; (c) same point returns 0; (d) distance between CDMX and Guadalajara ≈ 465 km ±5 km

- [x] T003 [P] Create `server/utils/branch-finder-config.ts` — export `branchFinderConfig` object reading `BRANCH_FINDER_DEFAULT_RADIUS_KM` (default 10) and `BRANCH_FINDER_MAX_RADIUS_KM` (default 50) from `process.env` parsed as integers (fallback to defaults if 0 or negative); export `buildRadii(min: number, max: number): number[]` returning 4-element geometric progression `[min, round(min×r), round(min×r²), max]` where `r = (max/min)^(1/3)`; create `tests/server/utils/branch-finder-config.test.ts` verifying: (a) defaults when env vars absent; (b) env override for both vars; (c) `buildRadii(10, 50)` returns `[10, 17, 29, 50]`; (d) `buildRadii(10, 100)` returns `[10, 22, 46, 100]`; (e) `buildRadii(7, 128)` returns `[7, 18, 47, 128]`; (f) fallback to default 10 when env var is 0 or negative

**Checkpoint**: `pnpm test` pasa para T002 y T003. Utilidades listas para las user stories.

---

## Phase 3: US1 — Búsqueda por Coordenadas (Priority: P1) 🎯 MVP

**Goal**: `GET /api/v1/branches?lat&lng` filtra sucursales por radio, expande automáticamente con progresión geométrica, y regresa `distanceKm` + `searchContext`.

**Independent Test**: `curl "http://localhost:3000/api/v1/branches?lat=19.4326&lng=-99.1332"` retorna sucursales con `distanceKm` y `searchContext.radiusUsed`.

- [x] T004 [US1] Write test cases in `tests/server/api/v1/branches/index.get.test.ts` for the coordinates path — (a) lat/lng with a branch at 5 km → `data[0].distanceKm` present, `searchContext.radiusUsed=10`, `expanded=false`, `noResults=false`; (b) no branches in default radius but one at 20 km → `searchContext.expanded=true`, `radiusUsed` is intermediate; (c) no branches in any radius → `data=[]`, `searchContext.noResults=true`; (d) results sorted ascending by `distanceKm`; (e) response excludes `whatsappReservaciones`, `whatsappReservacionesBackup`, `createdAt`, `updatedAt` fields; (f) lat without lng → 400; (g) lng without lat → 400; (h) lat=999 → 400; (i) lng=-999 → 400; (j) radius=0 → 400; (k) lat=abc → 400 (non-numeric coercion fails)

- [x] T005 [US1] Create `server/api/v1/branches/index.get.ts` — (a) define Zod schema with `z.coerce.number()` for `lat` (min -90, max 90), `lng` (min -180, max 180), `radius` (positive, optional); add `.refine()` that lat and lng must be provided together or not at all, throw ZodError with message `"lat and lng must be provided together"`; wrap handler in try/catch with `handleError`; (b) if lat/lng present: query `db.select()` from `branches` where `isActive=true` and `lat IS NOT NULL` and `lng IS NOT NULL`; compute `haversineKm` for each; loop `buildRadii(radius ?? branchFinderConfig.defaultRadiusKm, branchFinderConfig.maxRadiusKm)`, filter branches at each radius, stop at first radius with results; return `{ ...ok(results.map(stripInternalFields)), searchContext: { radiusUsed, expanded: radiusUsed > defaultRadius, noResults: results.length === 0 } }`; (c) `stripInternalFields` omits `whatsappReservaciones`, `whatsappReservacionesBackup`, `createdAt`, `updatedAt`; imports from `@/server/utils/haversine`, `@/server/utils/branch-finder-config`, `@/server/utils/db`, `@/server/utils/error-handler`, `@/server/utils/response`

**Checkpoint**: `pnpm test` pasa T004. `curl` con coordenadas retorna sucursales con `distanceKm` y `searchContext`.

---

## Phase 4: US2 — Listado Completo sin Filtro (Priority: P2)

**Goal**: `GET /api/v1/branches` sin params retorna todas las sucursales activas ordenadas por nombre, sin `distanceKm` ni `searchContext`.

**Independent Test**: `curl "http://localhost:3000/api/v1/branches"` retorna todas las sucursales activas sin `searchContext`.

- [x] T006 [US2] Add test cases to `tests/server/api/v1/branches/index.get.test.ts` for the no-coords path — (a) no params → all active branches returned, no `distanceKm` field on any item, no `searchContext` in response; (b) inactive branches (`isActive=false`) excluded; (c) results ordered by `name` ascending; (d) branches without lat/lng included (no exclusion for missing coords when returning full list)

- [x] T007 [US2] Extend `server/api/v1/branches/index.get.ts` — add else branch when no lat/lng: query all `isActive=true` branches ordered by `name` ascending; return `ok(branches.map(stripInternalFields))` without `searchContext`

**Checkpoint**: `pnpm test` pasa T006. `curl` sin params retorna catálogo completo sin `searchContext`.

---

## Phase 5: Polish & Cross-Cutting

**Purpose**: Validación final de tipos y end-to-end.

- [x] T008 Run full validation per `specs/004-branch-finder-location/quickstart.md` — (a) `pnpm test` pasa todos los tests nuevos (T002–T007); (b) `pnpm typecheck` pasa sin errores; (c) ejecutar los 6 escenarios del quickstart.md con curl y verificar responses; (d) confirmar que `whatsappReservaciones` no aparece en ningún response

**Checkpoint**: Todos los tests pasan, typecheck limpio, 6 escenarios validados manualmente.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: Sin dependencias — empezar aquí.
- **Phase 2 (Foundational)**: Depende de Phase 1. **Bloquea ambas user stories.**
  - T002 y T003 pueden correr en paralelo entre sí (archivos distintos)
- **Phase 3 (US1)**: Depende de Phase 2 completo.
  - T004 (tests) antes de T005 (implementación) — Constitution III
- **Phase 4 (US2)**: Depende de Phase 3 completo (extiende el mismo archivo).
  - T006 (tests) antes de T007 (implementación)
- **Phase 5 (Polish)**: Depende de Phases 3 y 4.

### Story Dependencies

- **US1 (Phase 3)**: Bloquea US2 porque ambas tocan el mismo archivo `index.get.ts`.
- **US2 (Phase 4)**: Extiende el endpoint de US1 — no es independiente a nivel de archivo.

### Parallel Opportunities

```
Phase 2:
  T002 server/utils/haversine.ts + test     ← en paralelo
  T003 server/utils/branch-finder-config.ts ← en paralelo

Phase 3 → Phase 4 (secuencial, mismo archivo):
  T004 (tests US1) → T005 (impl US1) → T006 (tests US2) → T007 (impl US2)
```

---

## Implementation Strategy

### MVP (Solo US1 — Phases 1 + 2 + 3)

1. Phase 1: actualizar `.env.example`.
2. Phase 2: implementar Haversine y `buildRadii` con tests.
3. Phase 3: escribir tests de filtrado → implementar endpoint con coordenadas.
4. **VALIDAR**: `curl` con lat/lng de CDMX, confirmar `distanceKm` y expansión correcta.
5. **Deployable**: el endpoint ya sirve búsquedas por ubicación.

### Entrega Incremental

1. MVP (US1) → endpoint funciona con coordenadas.
2. + US2 → endpoint también sirve listado completo sin params.
3. + Polish → typecheck y quickstart validados.

---

## Summary

| Fase | User Story | Tareas | Archivos principales |
|------|-----------|--------|---------------------|
| 1 Setup | — | T001 | .env.example |
| 2 Foundation | — | T002–T003 | utils/haversine.ts, utils/branch-finder-config.ts |
| 3 | US1 (P1) | T004–T005 | api/branches/index.get.ts |
| 4 | US2 (P2) | T006–T007 | api/branches/index.get.ts |
| 5 Polish | — | T008 | — |

**Total**: 8 tareas · 5 fases · MVP en T001–T005
