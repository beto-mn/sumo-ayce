# Implementation Plan: Reservation Page

**Branch**: `feat/018-reservation-page` | **Date**: 2026-06-23 | **Spec**: `specs/014-reservation-page/spec.md`
**Input**: Feature specification from `specs/014-reservation-page/spec.md`

---

## Summary

Build a full-page SSR reservation form at `/reserve` for SUMO AYCE. The feature is **frontend-only** — the backend (API, Twilio, Neon persistence) is complete. The page fetches the branch list server-side via `useAsyncData`, supports query-param pre-fill (`?branch`, `?type`), applies a per-type `--accent` CSS variable swap, generates 15-minute time slots from branch schedule data, validates all fields client-side before posting to `POST /api/v1/reservations`, and replaces the form with a confirmation screen on success.

---

## Technical Context

**Language/Version**: TypeScript 5 strict (no `any`), Vue 3 Composition API, Nuxt 4
**Primary Dependencies**: `@nuxtjs/i18n`, `vue-tsc`, Biome, Vitest, Storybook 10
**Storage**: N/A for this feature (no new DB tables; Neon accessed only through existing server routes)
**Testing**: Vitest co-located (`*.test.ts` / `*.spec.ts`); coverage threshold ≥ 70% for composables (Article IV)
**Target Platform**: Vercel (SSR function), mobile-first responsive
**Project Type**: Nuxt 4 fullstack web application (frontend slice only)
**Performance Goals**: Lighthouse ≥ 90 all metrics; fully interactive < 2 s on 4G (SC-004)
**Constraints**: Page template ≤ 100 lines (Article I); function bodies ≤ 30 lines (Article VIII); no DB client under `app/`; per-type accent via single `:style` swap (FR-021)
**Scale/Scope**: Single page, ~6 components, ~2 composables, ~30 i18n keys per locale

---

## Phase -1 Gates (NON-NEGOTIABLE)

These gates MUST pass before any implementation begins.

### Gate 1 — routeRules entry present (Constitution Article V + rendering-strategy.md)

`nuxt.config.ts` MUST contain `'/reserve': { ssr: true }` before the page file is created. Missing entry → BLOCKED.

### Gate 2 — No DB client under `app/` (Constitution Article V §3.1 + rendering-strategy.md §3.1)

`grep -r 'drizzle-orm\|@neondatabase' app/` MUST return empty. Any hit → BLOCKED.

### Gate 3 — Feature folder structure (Constitution Article I)

All new source files MUST live under `app/features/reservation/` or `app/pages/reserve.vue`. Files spread into `app/components/` (except UI primitives already there) or `server/` → BLOCKED.

### Gate 4 — Page template ≤ 100 lines (Constitution Article I)

`app/pages/reserve.vue` template section MUST NOT exceed 100 lines. Measured with `wc -l` on the `<template>` block. Violation → decompose before merge.

### Gate 5 — Storybook story for every new component (Constitution Article VII)

`ReservationForm.stories.ts` and `ReservationConfirmation.stories.ts` MUST exist and include Default + key variant stories. Missing story → BLOCKED from merge.

### Gate 6 — Biome + vue-tsc clean (Constitution Article IX)

`pnpm biome check .` and `pnpm vue-tsc --noEmit` MUST both pass with zero errors before any commit. Use pre-commit hook (Husky). Gate cannot be bypassed with `--no-verify`.

### Gate 7 — Composable test coverage ≥ 70% (Constitution Article IV)

`useReservationSlots.test.ts` and `useReservationSubmit.test.ts` MUST achieve ≥ 70% line coverage. Measured with `pnpm vitest run --coverage app/features/reservation/composables/`.

### Gate 8 — i18n keys present in both locales (FR-028)

All 30 `reservation.*` keys MUST exist in both `es` and `en` locale files. Missing key → runtime i18n warning; treat as a blocker.

### Gate 9 — rendering-strategy.md §4 table updated (FR-002, rendering-strategy §7 step 6)

`docs/business/rendering-strategy.md` §4 table MUST include the `/reserve → ssr:true` row as part of this feature's delivery. Missing entry → reviewer rejects.

---

## Constitution Check

| Article | Requirement | Status | Notes |
|---------|-------------|--------|-------|
| I — Code Organization | Feature under `app/features/reservation/`; page ≤ 100 lines; no cross-feature imports | ENFORCED | Decompose early; ReservationForm + ReservationConfirmation separate components |
| II — TypeScript strict | No `any`, Composition API only | ENFORCED | `generateSlots` must be fully typed |
| III — Architecture | Single Nuxt 4 repo; no DB client in `app/`; `useAsyncData` for branch fetch | ENFORCED | |
| IV — Testing | Co-located Vitest; ≥ 70% composable coverage; test names describe behavior | ENFORCED | See FR-035/036/037 |
| V — Performance | Lighthouse ≥ 90; `ssr: true` in routeRules | ENFORCED | SSR matches rendering-strategy |
| VI — Security | No auth for public route; Zod validation on server (already done in feat 002) | COMPLIANT | No new server routes |
| VII — UX Consistency | Mobile-first; `--accent` swap via `:style`; Storybook for all new components | ENFORCED | Express-blue exclusive to Express type |
| VIII — Clean Code | Functions ≤ 30 lines; files ≤ 200 lines; no `console.log`; `use` prefix on composables | ENFORCED | |
| IX — Quality Gates | Biome + vue-tsc pre-commit; Vitest pre-push | ENFORCED | No `--no-verify` |
| X — KISS | No new libraries; local `ref` for confirmation state (no Pinia) | ENFORCED | Avoid premature abstraction |
| XI — Absolute Imports | `@/` aliases; no `../` across directories | ENFORCED | |
| XII — Error Handling | API errors surfaced as inline banner; no internals exposed | ENFORCED | |
| XIII — Env Validation | No new env vars for this feature | N/A | |

**Complexity Tracking**: No constitution violations. No extra entries needed.

---

## Project Structure

### Documentation (this feature)

```text
specs/014-reservation-page/
├── plan.md              ← this file
├── spec.md              ← feature specification
├── research.md          ← Phase 0 decisions
├── data-model.md        ← entity shapes, state machine, generateSlots contract
├── quickstart.md        ← local dev + acceptance checklist
├── contracts/
│   └── reservation-form.md  ← UI contract + API call contract + i18n keys
└── tasks.md             ← Phase 2 output (generated by /speckit-tasks)
```

### Source Code (new files for this feature)

```text
app/
├── pages/
│   └── reserve.vue                          # Route; ≤100 lines; useAsyncData for branches
│
└── features/
    └── reservation/
        ├── types.ts                          # Branch, ReservationDraft, ReservationConfirmation, FormState
        ├── components/
        │   ├── ReservationForm.vue           # Main form orchestrator
        │   ├── ReservationForm.spec.ts       # Vitest: pre-fill, validation, submit, error
        │   ├── ReservationForm.stories.ts    # Storybook: Default, AYCE, Express, Loading, Error
        │   ├── ReservationConfirmation.vue   # Post-submit confirmation screen
        │   ├── ReservationConfirmation.spec.ts
        │   └── ReservationConfirmation.stories.ts
        └── composables/
            ├── useReservationSlots.ts        # generateSlots pure function + reactive wrapper
            ├── useReservationSlots.test.ts   # Vitest: full coverage of generateSlots
            ├── useReservationSubmit.ts       # Form submit logic (validation + API call)
            └── useReservationSubmit.test.ts  # Vitest: submit happy path, error path

# Modified files
nuxt.config.ts                    # Add '/reserve': { ssr: true }
docs/business/rendering-strategy.md  # §4 table: add /reserve row
app/features/branches/components/BranchCard.vue  # Update CTA link (FR-033)
app/pages/index.vue (or equivalent CTA)          # Update modal call to /reserve (FR-034)
locales/es.json                   # Add reservation.* keys
locales/en.json                   # Add reservation.* keys
```

---

## Implementation Phases

### Phase 0 — Infrastructure & Types

**Goal**: Get the route registered and types defined before any UI work.

1. Add `'/reserve': { ssr: true }` to `nuxt.config.ts` routeRules.
2. Update `docs/business/rendering-strategy.md` §4 table.
3. Create `app/features/reservation/types.ts` with all interfaces from `data-model.md`.
4. Add `reservation.*` i18n keys to both locale files.

**Gate check**: Gates 1, 3, 8 must pass.

---

### Phase 1 — Slot Generator (test-first)

**Goal**: Implement and fully test `generateSlots` before any form work.

1. Write `useReservationSlots.test.ts` with all cases from FR-035:
   - Future date: full slot range (open → close-30min)
   - Today: past slots excluded
   - No hours (`open`/`close` empty): returns `[]`
   - Boundary: `open` = "13:00", `close` = "22:00" → first slot "13:00", last "21:30"
2. Implement `useReservationSlots.ts` to make tests pass.
3. Export the reactive composable wrapper `useReservationSlots()` from the same file.

**Gate check**: Gate 7 (≥ 70% coverage on composables).

---

### Phase 2 — Form Submit Composable (test-first)

**Goal**: Implement validation logic and API call before mounting a component.

1. Write `useReservationSubmit.test.ts` covering:
   - All 8 validation rules from FR-022 (one test per rule)
   - Submit success → confirmation state set, form cleared
   - Submit API error → error state, fields re-enabled
   - Network failure → same error state
   - Field edit after error → error cleared
2. Implement `useReservationSubmit.ts` to make tests pass.

**Gate check**: Gate 7.

---

### Phase 3 — ReservationForm Component

**Goal**: Compose the form using existing UI primitives.

1. Implement `ReservationForm.vue`:
   - Use `Select` primitive for Sucursal, Tipo, Hora
   - Use `Input` primitive for Nombre and WhatsApp
   - Party size as `<select>` (options 1–20, no free-text)
   - Date `<input type="date">` with `min`/`max` attributes
   - `:style` binding for `--accent` on wrapper
   - Accepts `branches`, `initialBranchId`, `initialTipo` props
   - Calls `useReservationSlots` and `useReservationSubmit`
   - Shows `ReservationConfirmation` on success
2. Write `ReservationForm.spec.ts` covering FR-036.
3. Write `ReservationForm.stories.ts` with Default, AYCE, Express, Loading, Error stories.

**Gate check**: Gates 4, 5, 6.

---

### Phase 4 — ReservationConfirmation Component

**Goal**: Implement the post-submit confirmation screen.

1. Implement `ReservationConfirmation.vue` — receives `ReservationConfirmation` prop, emits `reset`.
2. Write `ReservationConfirmation.spec.ts`.
3. Write `ReservationConfirmation.stories.ts`.

**Gate check**: Gate 5.

---

### Phase 5 — Page Assembly

**Goal**: Wire everything together in `app/pages/reserve.vue`.

1. Implement `reserve.vue`:
   - `useAsyncData` calling `GET /api/v1/branches` (server-side)
   - Extract `?branch` and `?type` from `useRoute().query`
   - Pass values as props to `ReservationForm`
   - Template ≤ 100 lines
2. Verify page renders correctly in `pnpm dev` with and without query params.

**Gate check**: Gates 1, 2, 4.

---

### Phase 6 — Link Updates & Final Checks

**Goal**: Update existing pages and run all quality gates.

1. Update `app/features/branches/components/BranchCard.vue` — replace modal call with `NuxtLink` (FR-033).
2. Update homepage CTA — replace modal call with `navigateTo('/reserve')` (FR-034).
3. Run full test suite: `pnpm vitest run`.
4. Run Biome: `pnpm biome check .`
5. Run type-check: `pnpm vue-tsc --noEmit`
6. Manual acceptance checks from `quickstart.md`.

**Gate check**: All 9 gates.

---

## Risk Register

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| `schedule` field not yet returned by `GET /api/v1/branches` | Low | High | Verify in feature 013 delta; if absent, add to branches GET response before starting Phase 1 |
| Slot generation timezone edge case at midnight | Low | Medium | Test `generateSlots` with date = today at 23:45 |
| `folio` not in 201 response body | Low | High | Confirm in `server/api/v1/reservations/index.post.ts` before Phase 5 |
| Party size `<select>` not matching `Input` design tokens | Low | Low | Use existing `Select` primitive; verify in Storybook story |
| Branch card `useReservationModal` removal breaking other callers | Medium | Medium | Grep all callers before removing; keep composable, only remove call-sites |
