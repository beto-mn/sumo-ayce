# Implementation Plan: Branch Finder por Ubicación

**Branch**: `feat/004-branch-finder-location` | **Date**: 2026-05-24 | **Spec**: [spec.md](spec.md)  
**Input**: Feature specification from `specs/004-branch-finder-location/spec.md`

## Summary

Implementar `GET /api/branches` — un endpoint que acepta `lat`/`lng` opcionales y regresa sucursales filtradas por radio con expansión automática (10 → 25 → 50 km) o el catálogo completo si no hay coordenadas. El cálculo de distancia usa la fórmula Haversine implementada en TypeScript puro. No requiere cambios de schema — la tabla `branches` ya tiene columnas `lat`/`lng` con índice compuesto.

## Technical Context

**Language/Version**: TypeScript 5 strict mode  
**Primary Dependencies**: Nuxt 3 server routes (h3), Drizzle ORM, Zod (ya instalados)  
**Storage**: Neon PostgreSQL — tabla `branches` existente con `lat decimal(10,8)`, `lng decimal(11,8)`, índice `branches_coords_idx`  
**Testing**: Vitest + `@nuxt/test-utils` (ya configurado)  
**Target Platform**: Vercel (Nuxt server route)  
**Project Type**: web-service (backend endpoint)  
**Performance Goals**: < 500 ms p95  
**Constraints**: Sin dependencias nuevas (Haversine + buildRadii < 20 líneas, no justifica librería per KISS). Sin migración de BD.  
**Scale/Scope**: Catálogo pequeño (< 50 sucursales SUMO). Fetch-all + filtrado en JS es seguro a esta escala.

## Constitution Check

| Principio | Estado | Notas |
|-----------|--------|-------|
| I. TypeScript strict | ✅ | `lat`/`lng` de Drizzle son `string \| null` (decimal) — parsear a `number` en la utilidad |
| II. Arquitectura | ✅ | Route en `server/api/branches/index.get.ts`, utilidad en `server/utils/haversine.ts` |
| III. Testing | ✅ | Tests antes de implementación: `haversine.test.ts` → `index.get.test.ts` |
| V. Seguridad | ✅ | Zod valida `lat`, `lng`, `radius`; rate-limiting existente aplica |
| VII. Clean Code | ✅ | Haversine ≤ 15 líneas, route descompuesta en utilidad + handler ≤ 30 líneas c/u |
| VIII. Quality Gates | ✅ | Biome + vue-tsc + pre-push tests deben pasar |
| IX. KISS | ✅ | Sin librería para Haversine. Sin bounding box SQL (escala no lo requiere) |
| XI. Error Handling | ✅ | ZodError → 400 via `handleError`; `ValidationError` para lat sin lng |
| XII. Env Validation | ✅ | `BRANCH_FINDER_DEFAULT_RADIUS_KM` y `BRANCH_FINDER_MAX_RADIUS_KM` son opcionales (defaults en código) |

**Resultado**: Sin violaciones. No se requiere tabla de Complexity Tracking.

## Project Structure

### Documentation (this feature)

```text
specs/004-branch-finder-location/
├── plan.md              ← este archivo
├── research.md          ← Phase 0
├── data-model.md        ← Phase 1
├── quickstart.md        ← Phase 1
├── contracts/
│   └── api.md           ← Phase 1
└── tasks.md             ← /speckit.tasks (no creado aquí)
```

### Source Code

```text
server/
├── api/
│   └── branches/
│       └── index.get.ts          # GET /api/branches (nuevo)
└── utils/
    ├── haversine.ts               # Haversine distance util (nuevo)
    └── branch-finder-config.ts    # Env vars: defaultRadius, maxRadius (nuevo)

tests/
└── server/
    ├── api/
    │   └── branches/
    │       └── index.get.test.ts  # Tests del endpoint (nuevo)
    └── utils/
        ├── haversine.test.ts      # Tests de la fórmula (nuevo)
        └── branch-finder-config.test.ts  # Tests de config (nuevo)
```

**Structure Decision**: Single project layout (Opción 1). Backend-only. Sin cambios al schema ni migraciones.
