# Implementation Plan: Menu Chip / DB Drift Guard

**Branch**: `fix/023-menu-chip-db-drift-guard` | **Date**: 2026-07-15 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/023-menu-chip-db-drift-guard/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/plan-template.md` for the execution workflow.

## Summary

Fix a silent-drift bug in the `/menu` chip navigation: `app/features/menu/menu-sets.ts`
curated sets (`AYCE_BUFFET_SET`, `AYCE_CARTA_SET`, `EXPRESS_SET`, `DRINKS_SET`) are never
cross-checked against the live menu content read (`getFullMenu` in
`server/utils/menu-queries.ts`). Technical approach: (1) a pure, unit-testable filter applied
in the existing `useMenuFilters`/`MenuShell` chip-building path that drops any curated-set
key with no matching active category/drink-group in the fetched `FullMenuResult`, reusing the
existing out-of-set fallback (`resolveActiveKey`) so the active selection never lands on a
filtered-out key; and (2) a new co-located Vitest regression test (alongside the existing
`tests/db/menu-seeds.test.ts` seed-shape tests) asserting every curated-set key in
`menu-sets.ts` exists among the current seed's active `menu_categories`/`drink_group` keys,
excluding `sauces` and `drinkSubGroups` per FR-010. No new routes, no schema/migration
changes, no WordPress involvement.

## Technical Context

**Language/Version**: TypeScript (strict mode), Vue 3 Composition API — Nuxt 4
**Primary Dependencies**: Nuxt 4, Vue 3, Drizzle ORM, `@neondatabase/serverless`, Vitest,
`@vue/test-utils`, Storybook 10 (`@storybook/vue3-vite`) — all already installed, no new
dependency required (KISS, Article X)
**Storage**: Neon PostgreSQL (existing `menu_categories`, `drink_group`, `menu_items` tables;
no schema change) — read-only for this feature
**Testing**: Vitest (co-located `*.test.ts` per Article IV); existing pattern in
`tests/db/menu-seeds.test.ts` for seed-shape assertions and
`app/features/menu/composables/useMenuFilters.test.ts` for composable behavior
**Target Platform**: Web (Nuxt 4 on Vercel), existing `/menu` route only
**Project Type**: Web application (frontend `app/` + backend `server/`, single Nuxt repo per
Article III)
**Performance Goals**: No new performance budget — must not regress `/menu`'s existing
Lighthouse 90+ (Article V); the filter is a synchronous array `.filter()` over ≤17 curated
keys, negligible cost
**Constraints**: No new routes (FR-011), no schema/migration changes, no change to `sauces` /
`drinkSubGroups` (FR-010), no change to curated-set membership/ordering/labels for still-valid
entries (FR-003, FR-004, FR-012)
**Scale/Scope**: 4 curated sets, ≤17 total category/drink-group keys, 1 presentation-layer
filter function + 1 regression test file — a small, surgical bug fix, not a new subsystem

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Article | Gate | Assessment |
|---|---|---|
| I. Code Organization & Reusability | Feature-folder boundaries; no cross-feature imports; DRY | PASS — all runtime changes stay inside `app/features/menu/` (menu-sets.ts + useMenuFilters.ts/MenuShell.vue); the filter is a single new pure function, not duplicated logic; no new component needed (chip list already maps over an array, filtering the source array is sufficient) |
| II. TypeScript & Framework Standards | Strict TS, no `any`, Composition API only | PASS — filter operates on existing typed `MenuCategoryKey`/`DrinkGroup` unions and `FullMenuResult`; no new shared types needed since `FullMenuResult.categories`/`drinkGroups` already carry `key` |
| III. Architecture | Neon-only for transactional/content-adjacent app data already in Neon; no WordPress coupling | PASS — menu content already lives in Neon (per feature 016/021); this feature only reads the already-fetched `FullMenuResult`, no new data source |
| IV. Testing | Co-located tests; server logic tested before implementation; coverage thresholds; centralized mocks; no test order-dependence | PASS — new pure filter function gets a co-located Vitest spec (composable, 70% threshold); new regression test lives beside `tests/db/menu-seeds.test.ts` (existing convention for seed-shape assertions), stubs the `db` client the same way (`vi.mock('../../server/utils/db', () => ({ db: {} }))`) so it needs no live DB, consistent with Article IV's centralized-mock intent |
| V. Performance | No route rendering-mode change; Lighthouse 90+ preserved | PASS — `/menu` stays `ssr: true` per specs/021 SC-011; filter is O(n) over a tiny array, no new fetch introduced |
| VI. Security | N/A (no new endpoint, no new input surface) | N/A |
| VII. UX Consistency & Storybook | Every new/changed component needs Storybook coverage | APPLIES CONDITIONALLY — `MenuShell.vue`'s chip-rendering behavior changes (fewer chips possible); its existing story file must gain a variant demonstrating a filtered/missing-category chip row if `MenuShell.stories.ts` exists, per Article VII |
| VIII. Clean Code Discipline | ≤30-line functions, ≤200-line files, no dead code | PASS — the filter is a small (<15 line) function; no existing function grows past the limit; `menu-sets.ts` remains a data/pure-function module |
| IX. Quality Gates | Biome, type-check, tests must pass pre-commit/pre-push | PASS — standard gates apply, nothing bypassed |
| X. KISS | No premature abstraction; simplest solution | PASS — a single filter function reused at the point curated sets are turned into chips is the minimal fix; no new adapter/service/class introduced |
| XI. Absolute Imports | Use path aliases, no deep relative imports | PASS — new test/util files use `@/features/menu/...` and `@/types/menu` aliases consistent with existing files in this folder |
| XII. Error Handling | Centralized error handler for server routes; graceful external-service degradation | N/A for the runtime guard (it is a silent UI filter, not an error path — filtering out a stale chip is expected behavior, not a failure); no new server route or error type is introduced |
| XIII. Environment Validation | N/A — no new env vars | N/A |

No violations requiring justification. Complexity Tracking table is empty (see below).

**Post-Phase 1 re-check**: `research.md` and `data-model.md` confirm the design stays a single
pure filter function plus a filtered-array parameter into an existing composable, with no new
component, no new route, no new table, and no new dependency — the gate assessment above is
unchanged after design.

## Project Structure

### Documentation (this feature)

```text
specs/023-menu-chip-db-drift-guard/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── checklists/
│   └── requirements.md  # Spec quality checklist (/speckit.specify command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

No `contracts/` directory: this feature exposes no new external interface (no new API route,
no new public composable contract beyond an internal filter helper consumed only within the
`menu` feature folder) — contracts are skipped per the Phase 1 guidance for purely internal
changes.

### Source Code (repository root)

```text
app/
  features/
    menu/
      menu-sets.ts                          # curated sets (UNCHANGED membership/order);
                                             # gains a pure `filterAvailableKeys()` helper
      menu-sets.test.ts                     # NEW — unit tests for filterAvailableKeys()
      composables/
        useMenuFilters.ts                   # curatedSet computed now filters against
                                             # menuData before exposing chip keys
        useMenuFilters.test.ts              # EXTENDED — covers the filtered-chip cases
      components/
        MenuShell.vue                       # chipItems computed consumes the already-
                                             # filtered curatedSet; no fallback-to-raw-key
                                             # path is reachable once filtered upstream
        MenuShell.stories.ts                # EXTENDED (if present) — filtered-chip-row story

server/
  utils/
    menu-queries.ts                         # UNCHANGED — existing source of truth for
                                             # FullMenuResult.categories/drinkGroups
  db/
    seeds/
      menuCategories.ts, drinkGroups.ts     # UNCHANGED — read by the new regression test

tests/
  db/
    menu-seeds.test.ts                      # EXTENDED — new describe block: "menu-sets.ts
                                             # curated keys match the active seed" (FR-008/009)
```

**Structure Decision**: Single Nuxt 4 repo (Option 1-equivalent, frontend `app/` + backend
`server/` co-located per Article III). All runtime changes are confined to the existing
`app/features/menu/` vertical slice (Article I); the regression test is added to the existing
`tests/db/` seed-test location to match the established pattern in
`tests/db/menu-seeds.test.ts`, rather than creating a new top-level test directory.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

No violations — table intentionally left empty.
