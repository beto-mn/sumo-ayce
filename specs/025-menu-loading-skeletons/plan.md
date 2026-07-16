# Implementation Plan: Menu Loading Skeletons

**Branch**: `feat/025-menu-loading-skeletons` | **Date**: 2026-07-15 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `specs/025-menu-loading-skeletons/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/plan-template.md` for the execution workflow.

## Summary

Add skeleton loading placeholders to `/menu` so diners get immediate visual feedback — instead of
stale or blank content — while the menu's `useAsyncData` fetch is in flight, both on client-side
type/modality switches and on a slow initial load. Technical approach: expose the fetch's
`status`/`pending` state in `app/pages/menu.vue` and branch to a new skeleton component while
loading (leaving the existing error/unavailable branches and `MenuShell.vue` untouched); build the
skeleton out of one new generic, reusable primitive (`app/components/ui/UiSkeleton.vue`) composed
into two menu-scoped shapes (a chip skeleton, a dish-card skeleton) plus an orchestrator that
renders the exact chip count for the destination selection/modality (sourced from the existing
`app/features/menu/menu-sets.ts` curated-set config — no fetch required to know that count) and a
fixed-size grid of dish-card skeletons. All animation respects `prefers-reduced-motion`, matching
the existing `motion-reduce:animate-none` convention used by `Marquee.vue`.

## Technical Context

**Language/Version**: TypeScript (strict mode), Vue 3 Composition API — Nuxt 4
**Primary Dependencies**: Nuxt 4, Tailwind CSS (pop-art design tokens: `border-pop`, `rounded-pop`,
`rounded-pop-full`, `rounded-pop-sm`, `shadow-pop-sm`, `bg-panel`, `bg-accent`), `@nuxtjs/i18n`
(no new keys needed — skeletons carry no text)
**Storage**: N/A — no schema, no DB, no API contract change
**Testing**: Vitest + `@vue/test-utils` (co-located `*.spec.ts`), Storybook 10
(`@storybook/vue3-vite`, co-located `*.stories.ts`)
**Target Platform**: Web (Vercel), mobile-first responsive, existing `/menu` route only
**Project Type**: Web application (single Nuxt 4 repo, frontend-only change for this feature)
**Performance Goals**: No regression to the existing Lighthouse 90+ budget on `/menu`; skeleton
must render before the fetch resolves so it never adds perceived latency
**Constraints**: No change to data-fetching logic, query shape, or API contract (FR-013); no
change to any other page's loading behavior (FR-014); animation MUST be disabled/simplified under
`prefers-reduced-motion` (FR-010)
**Scale/Scope**: 1 new shared primitive (`UiSkeleton.vue`), 3 new menu-scoped components (chip
skeleton, dish-card skeleton, skeleton orchestrator), 1 modified page (`menu.vue`); `MenuShell.vue`
and all its children are unchanged

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Article | Gate | Status | Notes |
|---|---|---|---|
| I — Code Organization & Reusability (NON-NEGOTIABLE) | New component MUST live in the correct folder; DRY vs KISS placement decision must be justified | **PASS** | `UiSkeleton.vue` (generic pulsing box, shape variants) goes in `app/components/ui/` — it crosses potential future features, matching the "primitives reusable across features" rule. The chip-shaped and dish-card-shaped *compositions* stay in `app/features/menu/components/` since only `/menu` needs those exact shapes today (Article X applies here too — see below). No feature imports another feature's components; nothing is spread outside `app/features/menu/` + `app/components/ui/`. |
| II — TypeScript & Framework Standards | Composition API only, strict types, no `any` | **PASS** | All new components are `<script setup lang="ts">`; skeleton count/shape props are typed against existing `MenuCategoryKey`/`DrinkGroup`/curated-set types — no new shared type needed in `/types/`. |
| III — Architecture | No WordPress/Neon coupling; single repo | **PASS / N/A** | Feature touches only presentation components; no server route, no WordPress, no Neon involved. |
| IV — Testing | Co-located tests; composables ≥70% coverage; behavior-named tests | **PASS** | Every new component gets a co-located `*.spec.ts` (component tests, not composables — no new composable is introduced, so the 70% composable threshold doesn't apply as a distinct target, but component behavior — count, shape, reduced-motion — is fully covered). |
| V — Performance | Rendering-mode rules; backend never static | **N/A** | No route, no rendering-mode change, no backend logic — purely a presentational branch inside the existing `ssr:true` `/menu` page. |
| VI — Security | Input validation, rate limiting, CORS | **N/A** | No new API surface, no user input, no auth. |
| VII — UX Consistency & Component Documentation | Mobile-first, responsive, Storybook coverage (Default + variants + breakpoints) | **PASS** | Every new component ships a `.stories.ts` with a Default (animated) story, a reduced-motion/static story, and a Responsive story per the existing convention (see `Chip.stories.ts`, `Marquee.stories.ts`). Reduced-motion handling follows the established `motion-reduce:animate-none` Tailwind pattern from `Marquee.vue`. |
| VIII — Clean Code Discipline | ≤30-line functions, ≤200-line components, no dead code, self-documenting names | **PASS** | Each new component is small (a single visual shape); the orchestrator delegates count/shape logic to `menu-sets.ts` (already exists) rather than reimplementing it — keeps it well under 200 lines. |
| IX — Quality Gates (NON-NEGOTIABLE) | Biome + vue-tsc must pass; Conventional Commits | **PASS** | No new tooling; existing pre-commit/pre-push gates apply unchanged. |
| X — KISS | No premature abstraction; abstract only with a concrete second use case | **PASS** | `UiSkeleton.vue` is kept intentionally minimal (a box/pill primitive with a shape prop and reduced-motion handling) — it does NOT try to generalize the *menu-specific* chip/card compositions, since only one feature needs those today. If a second feature later needs a card-shaped skeleton, that composition (not the primitive) gets promoted then — avoids building a generic "any-shape skeleton system" now. |
| XI — Absolute Imports via Alias | `@/components/`, `@/features/` aliases | **PASS** | All new imports use existing aliases (`@/components/ui/UiSkeleton.vue`, `@/features/menu/menu-sets`). |
| XII — Error Handling Convention | Centralized error handler; typed errors | **N/A** | No server route; the page's existing error/unavailable handling (already built in feature 021) is left untouched and takes precedence over the skeleton per FR-011. |
| XIII — Environment Validation | Env vars validated at startup | **N/A** | No new environment variables. |

No violations requiring justification — Complexity Tracking table is omitted (empty).

## Project Structure

### Documentation (this feature)

```text
specs/025-menu-loading-skeletons/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command) — component contract, no API
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
app/
├── pages/
│   └── menu.vue                                   # MODIFIED — read status/pending, branch to skeleton
├── components/
│   └── ui/
│       ├── UiSkeleton.vue                          # NEW — generic pulsing/shimmering box primitive
│       ├── UiSkeleton.stories.ts                   # NEW
│       └── UiSkeleton.spec.ts                      # NEW
└── features/
    └── menu/
        ├── menu-sets.ts                            # UNCHANGED — reused for curated chip counts
        └── components/
            ├── MenuChipSkeleton.vue                # NEW — one chip-shaped placeholder
            ├── MenuChipSkeleton.stories.ts          # NEW
            ├── MenuChipSkeleton.spec.ts             # NEW
            ├── MenuDishCardSkeleton.vue             # NEW — one dish-card-shaped placeholder
            ├── MenuDishCardSkeleton.stories.ts      # NEW
            ├── MenuDishCardSkeleton.spec.ts         # NEW
            ├── MenuSkeleton.vue                     # NEW — orchestrator (chip row + card grid)
            ├── MenuSkeleton.stories.ts               # NEW
            ├── MenuSkeleton.spec.ts                  # NEW
            ├── MenuShell.vue                        # UNCHANGED
            ├── MenuCategoryChips.vue                # UNCHANGED
            ├── MenuDishGrid.vue                     # UNCHANGED
            └── MenuDishCard.vue                     # UNCHANGED
```

**Structure Decision**: Frontend-only change within the existing single Nuxt 4 repo. One new
shared primitive under `app/components/ui/` (Article I: crosses potential future features). Three
new menu-scoped components under `app/features/menu/components/` (Article I: scoped to the one
feature that needs these exact shapes today; Article X: no premature generalization of the
menu-specific shapes). `app/pages/menu.vue` gains a loading branch; `MenuShell.vue` and every
existing menu component are unchanged, matching the spec's Assumptions section.

## Complexity Tracking

> Not applicable — no Constitution Check violations to justify.
