# Implementation Plan: Database Schema & Local Development Environment

**Branch**: `feat/001-db-schema-drizzle` | **Date**: 2026-05-22 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `specs/001-db-schema-drizzle/spec.md`

## Summary

Define the complete Drizzle ORM schema for all 8 core entities (branches, customers, reservations, loyalty transactions, rewards, redemptions, staff users, staff sessions), set up a local PostgreSQL instance via Docker Compose for migration validation, and enforce startup env validation via Zod. Production database is Neon PostgreSQL (serverless, HTTP-based). The local Docker environment mirrors production schema exactly.

## Technical Context

**Language/Version**: TypeScript 5.x strict mode, Node.js 20+
**Primary Dependencies**: drizzle-orm 0.45+, @neondatabase/serverless, drizzle-kit, zod 4+, pino
**Storage**: Neon PostgreSQL (production) / Docker Compose PostgreSQL 16 (local dev)
**Testing**: Vitest — migration smoke tests, env validation unit tests
**Target Platform**: Vercel serverless (production), local Docker (development)
**Project Type**: web-service backend (Nuxt server routes)
**Performance Goals**: Migrations complete in <30s locally; DB connection ready within cold-start budget
**Constraints**: DB driver must be HTTP-based (Neon serverless) — no TCP persistent connections on Vercel
**Scale/Scope**: 8 tables, ~5–20 branches, hundreds to thousands of customers initially

## Constitution Check

*GATE: Must pass before Phase 0 research.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. TypeScript strict | ✅ | All schema and util files use strict TS |
| II. Architecture (single repo) | ✅ | Schema lives in `server/db/`, no new repo |
| II. Neon PostgreSQL | ✅ | Constitution updated to Neon PostgreSQL (v1.1.2). No behavioral change — same PostgreSQL wire protocol. |
| III. Testing | ✅ | Migration smoke tests + env.ts unit tests required |
| V. Security (Zod input validation) | ✅ | FR-009 enforces Zod env validation at startup |
| VIII. Quality Gates | ✅ | Husky hooks already enforce biome + typecheck + test |
| IX. KISS | ✅ | Drizzle is the thinnest possible ORM layer; no repository pattern |
| X. Absolute imports | ✅ | `@/server/db/schema` alias already configured |
| XI. Error Handling | ✅ | DB connection errors surface through error-handler.ts |
| XII. Env Validation | ✅ | `server/utils/env.ts` already implements Zod schema |

**Gate result**: ✅ PASS — all principles satisfied. Constitution patched to Neon PostgreSQL (v1.1.2). No violations.

## Project Structure

### Documentation (this feature)

```text
specs/001-db-schema-drizzle/
├── plan.md              ← this file
├── research.md          ← Phase 0 output
├── data-model.md        ← Phase 1 output
├── quickstart.md        ← Phase 1 output
├── contracts/
│   └── schema.md        ← Phase 1 output
└── tasks.md             ← Phase 2 (/speckit-tasks)
```

### Source Code (repository root)

```text
server/
└── db/
    ├── schema.ts          ← all Drizzle table definitions (single file, split when >200 lines)
    └── migrations/        ← generated SQL files from drizzle-kit (gitignored content, committed structure)

server/
└── utils/
    ├── db.ts              ← Neon HTTP driver + drizzle instance (already exists)
    └── env.ts             ← Zod env validation (already exists, needs DATABASE_URL as required)

docker-compose.yml         ← local PostgreSQL 16 (project root)
drizzle.config.ts          ← already exists, points to server/db/schema.ts
```

**Structure Decision**: Single `schema.ts` file for all entities. Drizzle supports splitting schemas across files — we defer that until the file exceeds 200 lines (Constitution VII).

## Complexity Tracking

No violations requiring justification.
