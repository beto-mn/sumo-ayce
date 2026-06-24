# Tasks: Reservation Page (014)

**Input**: Design documents from `specs/014-reservation-page/`
**Branch**: `feat/018-reservation-page`
**Prerequisites**: plan.md ✅ spec.md ✅ research.md ✅ data-model.md ✅ contracts/ ✅ quickstart.md ✅

**Tests**: Included — spec.md explicitly mandates co-located Vitest tests (FR-035, FR-036, FR-037). Tests are written before implementation (TDD, Constitution Article IV).

**Organization**: Tasks grouped by user story to enable independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: User story this task belongs to (US1–US5)
- Exact file paths required in every task description

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Route registration, types, and i18n keys — must be in place before any component work.

- [x] T001 Add `'/reserve': { ssr: true }` to `routeRules` in `nuxt.config.ts`
- [x] T002 Update `docs/business/rendering-strategy.md` §4 table to add `/reserve → ssr: true` row (FR-002, rendering-strategy §7 step 6)
- [x] T003 [P] Create `app/features/reservation/types.ts` with interfaces: `Branch`, `BranchSchedule`, `ReservationDraft`, `ReservationConfirmation`, `CreateReservationPayload`, `FormScreen`, `FormStatus` (from `specs/014-reservation-page/data-model.md`)
- [x] T004 [P] Add all `reservation.*` i18n keys to `locales/es.json` (30 keys listed in `specs/014-reservation-page/contracts/reservation-form.md` §4)
- [x] T005 [P] Add all `reservation.*` i18n keys to `locales/en.json` (same 30 keys, English values)

**Checkpoint**: `pnpm vue-tsc --noEmit` passes with new types. Both locale files have all `reservation.*` keys.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Pure slot-generation logic and submit composable — tested before any UI is mounted.

**⚠️ CRITICAL**: No component work can begin until this phase is complete.

### Tests — Slot Generator (write first, must FAIL before implementation)

- [x] T006 Write `app/features/reservation/composables/useReservationSlots.test.ts` with Vitest cases (FR-035):
  - Future date: open=13:00, close=22:00 → slots 13:00…21:30 (15-min intervals, last slot = close minus 30 min)
  - Today with past slots: current time 15:45 → only slots ≥ 16:00 returned
  - No hours (open="" or close=""): returns `[]`
  - Boundary: first slot equals `open`, last slot equals `close` minus 30 min
  - Branch `schedule: null`: caller passes empty strings → `[]`
  - Day key selection: Mon uses `mon`, Sat uses `sat` (per-day keys)
  - Day with `null` schedule: returns `[]`

### Implementation — Slot Generator

- [x] T007 Implement `generateSlots(open, close, date): string[]` in `app/features/reservation/composables/useReservationSlots.ts` to make T006 tests pass (FR-016, FR-017, FR-018)
- [x] T008 Export reactive composable wrapper `useReservationSlots()` from same file `app/features/reservation/composables/useReservationSlots.ts` (accepts `branch: Ref<Branch | null>`, `date: Ref<string>`, returns `slots: ComputedRef<string[]>`) (FR-019)

### Tests — Submit Composable (write first, must FAIL before implementation)

- [x] T009 Write `app/features/reservation/composables/useReservationSubmit.test.ts` with Vitest cases covering all 8 validation rules (FR-022):
  - branchId null → error `reservation.error.branch_required`
  - date empty → error `reservation.error.date_required`
  - date in the past → error `reservation.error.date_past`
  - date > today+30 → error `reservation.error.date_too_far`
  - time empty → error `reservation.error.time_required`
  - partySize 0 or null → error `reservation.error.party_size`
  - name empty → error `reservation.error.name_required`
  - phone not 10 digits after stripping +52 → error `reservation.error.phone_invalid`
  - all valid → no errors, `$fetch` called with correct `CreateReservationPayload` shape (FR-024)
  - API 201 → `confirmationData` set, `status` = `'success'` (FR-025)
  - API 4xx/5xx → `status` = `'error'`, fields re-enabled (FR-027)
  - Network throw → `status` = `'error'` (FR-027 AC3)
  - Field edit after error → error cleared (FR-027 AC4)
  - Phone stripping: `+525512345678` → `contactPhone: '5512345678'` (FR-015)

### Implementation — Submit Composable

- [x] T010 Implement `useReservationSubmit()` in `app/features/reservation/composables/useReservationSubmit.ts` to make T009 tests pass; exports `draft`, `errors`, `status`, `confirmationData`, `submit()`, `resetForm()`, `clearErrorOnEdit()` (FR-022 – FR-027)

**Checkpoint**: `pnpm vitest run app/features/reservation/composables/` passes all tests. Coverage ≥ 70%.

---

## Phase 3: User Story 1 — Pre-fill from Query Params (Priority: P1) 🎯 MVP start

**Goal**: Visiting `/reserve?branch=<uuid>&type=ayce` pre-selects the branch and sets tipo to AYCE with orange accent.

**Independent Test**: Navigate to `/reserve?branch=<valid-uuid>&type=ayce`. Sucursal dropdown shows the matching branch name, Tipo shows "AYCE", page wrapper has `--accent: var(--orange)`.

### Tests — Pre-fill (write first, must FAIL before implementation)

- [x] T011 [US1] Write pre-fill test block in `app/features/reservation/components/ReservationForm.spec.ts`:
  - `?branch=<valid-uuid>` matches → Sucursal pre-selected (US1 AC1)
  - `?type=ayce` → Tipo = "AYCE", wrapper style has `--accent: var(--orange)` (US1 AC2)
  - `?type=express` → Tipo = "Express", `--accent: var(--blue)` (US1 AC3)
  - No query params → Sucursal unselected, Tipo defaults "AYCE" (US1 AC4)
  - `?branch=<unknown-uuid>` → Sucursal unselected, no error shown (US1 AC5)
  - `?type=invalid` → Tipo defaults to "AYCE" (edge case)

### Implementation — Pre-fill

- [x] T012 [US1] Create `app/pages/reserve.vue` with `useAsyncData` calling `GET /api/v1/branches`, extract `?branch` and `?type` from `useRoute().query`, pass as props to `ReservationForm`; template ≤ 100 lines (FR-001, FR-002, FR-003, FR-004)
- [x] T013 [US1] Create `app/features/reservation/components/ReservationForm.vue` skeleton: accepts props `branches: Branch[]`, `initialBranchId?: string`, `initialTipo?: 'ayce' | 'express'`; initialises `ReservationDraft` state from props; binds `--accent` via `:style` on wrapper (FR-005, FR-006, FR-007, FR-008, FR-020, FR-021)

**Checkpoint**: `pnpm vitest run app/features/reservation/components/ReservationForm.spec.ts` — pre-fill block passes.

---

## Phase 4: User Story 2 — Complete & Submit Reservation (Priority: P1)

**Goal**: Fill all seven fields and submit. Confirmation screen with folio replaces the form in-place.

**Independent Test**: Fill all fields with valid data, submit. Form disappears; confirmation panel appears with folio "SUMO-XXXX", branch name, date, time, party size, and WhatsApp reminder.

### Tests — Submit flow (write first, must FAIL before implementation)

- [x] T014 [US2] Add submit-flow test block to `app/features/reservation/components/ReservationForm.spec.ts`:
  - Valid submit → button enters loading state, fields disabled (US2 AC1)
  - API 201 → form replaced by confirmation screen showing folio from response (US2 AC2)
  - Confirmation shows: folio, branch name, date, time, party size, WhatsApp note (US2 AC3)
  - "Hacer otra reservación" → form resets and re-appears without navigation (US2 AC4)

### Implementation — Submit & Confirmation

- [x] T015 [US2] Implement full submit wiring in `app/features/reservation/components/ReservationForm.vue`: call `useReservationSubmit`, disable fields on submit, toggle screen to `'confirmation'` on success (FR-023, FR-025, FR-026)
- [x] T016 [P] [US2] Create `app/features/reservation/components/ReservationConfirmation.vue`: accepts `confirmation: ReservationConfirmation` prop, emits `reset`, displays folio, branch name, date, time, party size, WhatsApp note, "Hacer otra reservación" button (FR-025, FR-026)
- [x] T017 [P] [US2] Write `app/features/reservation/components/ReservationConfirmation.spec.ts`: displays all confirmation fields, "Hacer otra reservación" emits reset event
- [x] T018 [P] [US2] Write `app/features/reservation/components/ReservationConfirmation.stories.ts`: Default story with sample confirmation data

**Checkpoint**: Full submit → confirmation flow works in `pnpm dev`. `ReservationConfirmation.spec.ts` passes.

---

## Phase 5: User Story 3 — API/Network Error Handling (Priority: P1)

**Goal**: API call fails; inline error banner appears; form stays fully editable for resubmission.

**Independent Test**: Mock `POST /api/v1/reservations` to return 500. Submit. Error banner appears below form; fields re-enabled; button restored. Edit any field; banner clears.

### Tests — Error handling (write first, must FAIL before implementation)

- [x] T019 [US3] Add error-handling test block to `app/features/reservation/components/ReservationForm.spec.ts`:
  - API 4xx/5xx → button restored, inline error banner appears (US3 AC1)
  - API 422 → error message shown (no technical detail) (US3 AC2)
  - Network failure (fetch throws) → same error UX (US3 AC3)
  - Edit any field after error → banner cleared (US3 AC4)

### Implementation — Error banner

- [x] T020 [US3] Add error banner to `app/features/reservation/components/ReservationForm.vue`: render inline error div when `status === 'error'`; wire field `@input`/`@change` to `clearErrorOnEdit()` (FR-027)

**Checkpoint**: Error flow works end-to-end with mocked API. Test block passes.

---

## Phase 6: User Story 4 — Client-Side Field Validation (Priority: P1)

**Goal**: Submit with empty/invalid fields shows per-field error messages; API is not called.

**Independent Test**: Leave all fields empty and tap Submit. Each field shows its own error message. Network tab shows no API request.

### Tests — Validation (write first, must FAIL before implementation)

- [x] T021 [US4] Add validation test block to `app/features/reservation/components/ReservationForm.spec.ts` (one test per FR-022 AC):
  - Sucursal empty → "Selecciona una sucursal" under field (US4 AC1)
  - Fecha empty → error under Fecha (US4 AC2)
  - Past date → "fecha debe ser hoy o futura" (US4 AC3)
  - Date > 30 days ahead → "dentro de 30 días" (US4 AC4)
  - Hora empty → error under Hora (US4 AC5)
  - Party size 0 → "Entre 1 y 20 personas" (US4 AC6)
  - Nombre empty → error under Nombre (US4 AC7)
  - WhatsApp invalid → "Número de WhatsApp inválido" (US4 AC8)
  - All valid → no client errors, API called once (US4 AC9)

### Implementation — Per-field error display

- [x] T022 [US4] Add per-field error message rendering to `app/features/reservation/components/ReservationForm.vue`: bind `errors` from `useReservationSubmit` to each field, display error below field, link via `aria-describedby` (FR-022, FR-029)

**Checkpoint**: Empty form submit shows all 7 field errors. No API call made. All validation tests pass.

---

## Phase 7: User Story 5 — Time Slot Generation in Form (Priority: P1)

**Goal**: After selecting branch + date, Hora `<input type="time">` shows min/max within branch hours. Past slots excluded for today via `min` attribute.

**Independent Test**: Select a branch with schedule `{ open: "13:00", close: "22:00" }` and tomorrow's date. Hora input has min="13:00", max="21:30", step="900". Select today's date; `min` advances past current time.

### Tests — Slot rendering in form (write first, must FAIL before implementation)

- [x] T023 [US5] Add slot-generation test block to `app/features/reservation/components/ReservationForm.spec.ts`:
  - Branch + future date → Hora options match `generateSlots` output (US5 AC1)
  - Branch + today → past slots absent (US5 AC2)
  - No branch selected → Hora disabled, placeholder "Selecciona una sucursal primero" (US5 AC3)
  - Branch with `schedule: null` → "Horarios no disponibles", no slots (US5 AC4)
  - Branch changes after Hora selected → Hora cleared, slots recomputed (US5 AC5)
  - Tipo changes after Hora selected → Hora cleared (edge case §7)

### Implementation — Hora dropdown wiring

- [x] T024 [US5] Wire `useReservationSlots()` into `app/features/reservation/components/ReservationForm.vue`: pass selected branch + date, bind slots to Hora `<Select>`, disable and show placeholder when no branch, show fallback when no schedule, clear Hora on branch/tipo change (FR-012, FR-019, spec edge cases)

**Checkpoint**: Hora dropdown generates correct slots from branch hours. All slot tests pass.

---

## Phase 8: Storybook & Accessibility Polish

**Purpose**: Storybook stories for all new components; accessibility attributes; responsiveness; branch card link updates.

- [x] T025 [P] Write `app/features/reservation/components/ReservationForm.stories.ts` with stories: Default (no query params), AYCE (orange accent), Express (blue accent), Loading (submitting state), Error (error banner shown), Confirmation (post-submit screen) (Article VII)
- [x] T026 [P] Verify `app/features/reservation/components/ReservationConfirmation.stories.ts` exists and includes Default + Responsive stories (from T018; add Responsive story if missing) (Article VII)
- [x] T027 Add `aria-busy="true"` to submit button during submitting state and verify all fields have `<label>` or `aria-label` in `app/features/reservation/components/ReservationForm.vue` (FR-029, FR-030)
- [x] T028 Add `@media (prefers-reduced-motion: reduce)` rule to disable form entrance animations in `app/features/reservation/components/ReservationForm.vue` or associated CSS (spec edge case §8)
- [x] T029 Update `app/features/branches/components/BranchCard.vue`: replace `useReservationModal().openReservation()` CTA with `<NuxtLink :to="'/reserve?branch=' + branch.id + '&type=' + branch.type">` (FR-033)
- [x] T030 Update homepage CTA in `app/pages/index.vue` (or relevant homepage component): replace reservation modal call with `navigateTo('/reserve')` (FR-034)
- [x] T031 [P] Verify `app/pages/reserve.vue` template section does not exceed 100 lines (`wc -l` on `<template>` block); decompose further into feature components if over limit (Article I)
- [x] T032 [P] Verify no DB client imports (`drizzle-orm`, `@neondatabase`) under `app/`: `grep -r 'drizzle-orm\|@neondatabase' app/` must return empty (Constitution Article V §3.1)

**Checkpoint**: `pnpm storybook` — all new stories render. `pnpm biome check .` passes. Accessibility attributes present.

---

## Phase 9: Final Quality Gate

**Purpose**: Full test suite, type-check, coverage verification, and manual acceptance checks.

- [x] T033 Run `pnpm vitest run app/features/reservation/` — all tests pass
- [x] T034 Run `pnpm vitest run --coverage app/features/reservation/composables/` — coverage ≥ 70% for `useReservationSlots.ts` and `useReservationSubmit.ts` (FR-037, Constitution Article IV)
- [x] T035 Run `pnpm vue-tsc --noEmit` — zero type errors
- [x] T036 Run `pnpm biome check .` — zero lint/format errors
- [x] T037 Manual acceptance check — navigate to `/reserve?branch=<valid-uuid>&type=ayce`; confirm pre-fill, slot generation, full submit flow, error flow, "Hacer otra reservación" reset (quickstart.md acceptance checks)
- [x] T038 Manual acceptance check — navigate to `/reserve` with no query params; confirm empty form, validation errors on empty submit, API not called
- [x] T039 Confirm `docs/business/rendering-strategy.md` §4 table includes `/reserve → ssr:true` row (FR-002, rendering-strategy §7 step 6)

**Checkpoint**: All 9 Phase -1 gates pass. Feature ready for merge review.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies — start immediately
- **Phase 2 (Foundational)**: Depends on Phase 1 completion — BLOCKS all component phases
- **Phase 3–7 (User Stories)**: All depend on Phase 2 completion
  - US2 submit wiring (Phase 4) depends on Phase 3 skeleton existing (T012, T013)
  - US3/US4/US5 are additive to `ReservationForm.vue` — can proceed once Phase 3 skeleton exists
- **Phase 8 (Polish)**: All component phases (3–7) must be complete
- **Phase 9 (Quality Gate)**: All phases complete

### User Story Dependencies

- **US1 (P1)**: Start after Phase 2 — creates `reserve.vue` + `ReservationForm.vue` skeleton
- **US2 (P1)**: Depends on US1 skeleton (T012, T013) existing; adds submit + confirmation components [T016, T017, T018 are parallel]
- **US3 (P1)**: Depends on US1 skeleton; adds error banner to existing form
- **US4 (P1)**: Depends on US1 skeleton; adds per-field error display (uses `errors` from T010)
- **US5 (P1)**: Depends on US1 skeleton + Phase 2 slot composable; adds Hora dropdown wiring

### Within Each User Story

- Tests written first → must FAIL before implementation starts
- Types defined (Phase 1) before composables (Phase 2)
- Composables implemented before components consume them
- Stories accompany implementation (not deferred to Polish)

### Parallel Opportunities

- T003, T004, T005 (Phase 1) — fully parallel, different files
- T006 and T009 (test writing in Phase 2) — parallel, different files
- T007, T010 (implementations) — parallel once their respective tests exist
- T016, T017, T018 (confirmation component + tests + stories in Phase 4) — parallel
- T025, T026, T027, T028, T031, T032 (Phase 8 polish tasks) — parallel where marked [P]
- US3, US4, US5 phases — parallel once US1 skeleton (T012, T013) exists

---

## Parallel Execution Examples

### Phase 2 — Composables (parallel start)

```text
Task A: "Write useReservationSlots.test.ts (T006)"
Task B: "Write useReservationSubmit.test.ts (T009)"
```

After both test files exist and fail:

```text
Task A: "Implement generateSlots + useReservationSlots (T007, T008)"
Task B: "Implement useReservationSubmit (T010)"
```

### After US1 Skeleton (T012, T013) exists — parallel story work

```text
Task A: "US3 error banner tests + implementation (T019, T020)"
Task B: "US4 validation tests + implementation (T021, T022)"
Task C: "US5 slot wiring tests + implementation (T023, T024)"
```

### Phase 4 — Confirmation component (parallel)

```text
Task A: "ReservationConfirmation.vue implementation (T016)"
Task B: "ReservationConfirmation.spec.ts (T017)"
Task C: "ReservationConfirmation.stories.ts (T018)"
```

---

## Implementation Strategy

### MVP First (US1 + US2 core only)

1. Complete Phase 1: Setup (T001–T005)
2. Complete Phase 2: Foundational composables (T006–T010)
3. Complete Phase 3: US1 pre-fill (T011–T013)
4. Complete Phase 4: US2 submit + confirmation (T014–T018)
5. **STOP and VALIDATE**: Full submit flow works end-to-end in dev
6. Add US3 (error handling), US4 (validation), US5 (slots) incrementally

### Incremental Delivery

1. Setup + Foundational → composables tested and ready
2. US1 skeleton → page renders with branch dropdown
3. US2 → end-to-end happy path (reservation submits, folio shown)
4. US3 → errors handled gracefully
5. US4 → validation prevents bad API calls
6. US5 → slot list accurate per branch hours
7. Polish → stories, a11y, link updates, quality gates

---

## Notes

- All five user stories are Priority P1 — implement in order (US1 → US2 → US3 → US4 → US5) or parallelize US3/US4/US5 once US1 skeleton exists
- `[P]` tasks operate on different files with no shared state — safe to run concurrently
- TDD is mandatory for composables (Article IV); spec tests are written before the code they exercise
- Every new Vue component requires a `.stories.ts` before it can be merged (Article VII, Gate 5)
- Do not add any DB client imports under `app/` — all data access goes through `server/api/**` (Gate 2)
- Commit after each phase or logical group using Conventional Commits format
