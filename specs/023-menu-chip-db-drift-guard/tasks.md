# Tasks: Menu Chip / DB Drift Guard

**Input**: Design documents from `/specs/023-menu-chip-db-drift-guard/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, quickstart.md

**Tests**: Included — both user stories are inherently test-shaped (US1 needs a unit-tested
pure filter + composable behavior; US2 IS a regression test), and Article IV requires
co-located coverage for composables/pure functions.

**Organization**: Tasks are grouped by user story (US1 = runtime guard, US2 = regression
test) so each can be implemented, tested, and demoed independently.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2)
- File paths are exact and relative to the repository root

---

## Phase 1: Setup

**Purpose**: Establish a clean baseline before touching any code.

- [x] T001 Confirm branch `fix/023-menu-chip-db-drift-guard` is checked out and capture a
      green baseline by running `npx vitest run app/features/menu tests/db/menu-seeds.test.ts`
      — no code changes in this task, just confirms the starting point is stable before the
      fix begins.

---

## Phase 2: Foundational

**Purpose**: Confirm the existing typed surfaces this fix reads from need no changes, so
later phases can proceed without touching `types/menu.ts` or the server query layer.

**⚠️ Note**: This phase is verification-only (no code changes) — both user stories read the
same existing types, so confirming them once avoids redundant checks in each story.

- [x] T002 [P] Verify `types/menu.ts`'s `FullMenuResult.categories[].key` and
      `FullMenuResult.drinkGroups[].key` (via `DrinkGroupMeta`) already exist and are the
      correct fields to build an "available keys" set from (per data-model.md §1) — confirm no
      type changes are required in `types/menu.ts`.

**Checkpoint**: Foundation confirmed — both user stories can proceed.

---

## Phase 3: User Story 1 - No dead chip when a curated category is deactivated in the DB (Priority: P1) 🎯 MVP

**Goal**: A chip for a curated category/drink-group only renders when that category/group is
actually present in the current menu content read; the active selection never resolves to a
filtered-out key.

**Independent Test**: Deactivate/remove a category or drink group that is a member of one of
the four curated sets from the content store (without touching `menu-sets.ts`), reload the
affected `/menu` view, and confirm the chip for the missing member is absent, the remaining
chips keep their order, and the active selection falls back to the view's default if it was
the removed key (see `quickstart.md` "Verify the fix (User Story 1)").

### Tests for User Story 1 ⚠️

> Write these tests FIRST; confirm they fail before implementing T005-T007.

- [x] T003 [P] [US1] Write unit tests for a new `filterAvailableKeys(keys, availableKeys)`
      pure function in `app/features/menu/menu-sets.test.ts` (new file): preserves curated
      order for keys present in `availableKeys`; drops keys absent from `availableKeys`; never
      adds a key not already in `keys`; returns an empty array when `availableKeys` is empty;
      returns the full input when all keys are available (no-op case, matches current
      behavior for a healthy DB — FR-012 no-regression).
      (Deviation, reviewer-accepted: these tests were added to the pre-existing
      `app/features/menu/menu-sets.spec.ts` instead of a new `menu-sets.test.ts`, to avoid two
      competing test files for one module. Coverage is equivalent — order preservation,
      drop-missing, never-adds-a-key, empty-`availableKeys`, full-`availableKeys` no-op are all
      present there.)
- [x] T004 [P] [US1] Extend `app/features/menu/composables/useMenuFilters.test.ts` with a new
      `describe('useMenuFilters — drift guard')` block: `curatedSet` excludes a key that has
      no matching entry in the menu data passed to the composable; when the currently active
      category/drink-group becomes unavailable, `activeCategory` resolves to the view's
      default (reusing existing `resolveActiveKey` fallback semantics) instead of the missing
      key; unaffected views (no drift) keep their exact current behavior (regression guard for
      FR-003, FR-004, FR-012).

### Implementation for User Story 1

- [x] T005 [US1] Implement `filterAvailableKeys(keys: string[], availableKeys: Set<string>):
      string[]` in `app/features/menu/menu-sets.ts`, alongside the existing `getCuratedSet`/
      `getDefaultKey`/`resolveActiveKey` helpers, per data-model.md §2 (depends on T003 failing
      tests).
- [x] T006 [US1] Wire `filterAvailableKeys` into `app/features/menu/composables/
      useMenuFilters.ts`: accept the current menu content's available category/drink-group
      keys as an input, filter the `curatedSet` computed through `filterAvailableKeys` before
      exposing it, and ensure `resolveActiveKey` (used in the initial `activeCategory` ref and
      in `setSelection`/`setModality`/`setCategory`) checks membership against the filtered set
      so a stale active key always falls back to the view's default (depends on T005; must
      make T004's tests pass).
- [x] T007 [US1] Update the `useMenuFilters(...)` call site in
      `app/features/menu/components/MenuShell.vue` to supply the available keys derived from
      `props.menuData.categories`/`props.menuData.drinkGroups` to the composable (depends on
      T006); confirm `foodCategoryLabel()`/`drinkGroupLabel()`'s existing fallback-to-raw-key
      branch is no longer reachable for any rendered chip once the upstream filter is wired in.
- [x] T008 [P] [US1] Add a new story variant to `app/features/menu/components/
      MenuShell.stories.ts` using a `menuData` fixture missing one curated category or drink
      group, demonstrating the filtered (shorter) chip row per Article VII (can run in
      parallel with T007 — different file).
- [x] T009 [US1] Run `npx vitest run app/features/menu/menu-sets.test.ts
      app/features/menu/composables/useMenuFilters.test.ts` and confirm all pass; manually
      walk through `quickstart.md`'s "Verify the fix (User Story 1 — runtime guard)" steps
      against a local dev build.

**Checkpoint**: User Story 1 is fully functional and independently testable — dead chips are
no longer possible at runtime, with no visible-behavior regression for still-valid categories.

---

## Phase 4: User Story 2 - Automated regression guard catches curated-set / DB drift before release (Priority: P2)

**Goal**: A regression test fails, with a message naming the offending key and curated set,
the moment `app/features/menu/menu-sets.ts` references a category/drink-group key with no
matching active entry in the current seed — independent of whether User Story 1's runtime
guard has shipped.

**Independent Test**: Temporarily rename/remove a key from one curated set (or add a
non-existent key) in `menu-sets.ts`, run the test suite, and confirm the new test fails with a
message naming the specific key and set; revert and confirm it passes (see `quickstart.md`
"Verify the fix (User Story 2 — regression test)").

### Tests for User Story 2 ⚠️

- [x] T010 [US2] Add a new `describe('menu-sets.ts curated keys match the active seed')`
      block to `tests/db/menu-seeds.test.ts`, importing `AYCE_BUFFET_SET`, `AYCE_CARTA_SET`,
      `EXPRESS_SET`, `DRINKS_SET` from `app/features/menu/menu-sets.ts` and `CATEGORIES`,
      `DRINK_GROUPS` from `server/db/seeds/menuCategories.ts` /
      `server/db/seeds/drinkGroups.ts` (reusing the file's existing
      `vi.mock('../../server/utils/db', () => ({ db: {} }))` stub); for each of the four
      curated sets, assert every referenced key exists among the active seed entries' keys,
      and craft the assertion (e.g. per-set `it.each` or an explicit failure message argument)
      so a failure names both the missing key and which curated set it belongs to (FR-008,
      FR-009); add one assertion confirming the test suite makes no reference to `sauces` or
      `drinkSubGroups` seed exports (FR-010 — scope guard, e.g. a comment plus review, since
      the test file simply not importing them is the enforcement mechanism).

### Implementation for User Story 2

- [x] T011 [US2] Temporarily introduce a bogus key into one curated set in
      `app/features/menu/menu-sets.ts` (local, uncommitted change) and confirm T010's test
      fails with a message identifying that key and set; revert the temporary change and
      confirm the test passes again — this task IS the implementation verification for US2
      (the "implementation" is the test itself; there is no production code change for this
      story).
- [x] T012 [P] [US2] Run `npx vitest run tests/db/menu-seeds.test.ts` on the real (unmodified)
      `menu-sets.ts` and current seeds, and confirm a green baseline.

**Checkpoint**: User Story 2 is fully functional and independently testable — any future drift
between `menu-sets.ts` and the seed data fails CI with an actionable message, regardless of
whether US1's runtime guard is present.

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: Confirm the fix as a whole satisfies FR-012 (no regression) and Article IX
(quality gates), across both user stories.

- [x] T013 Run the full menu feature test surface: `npx vitest run app/features/menu
      tests/db/menu-seeds.test.ts` and confirm all pre-existing tests (e.g. curated ordering,
      default-category, deep-link restoration in `useMenuFilters.test.ts`) still pass unchanged
      alongside the new tests from T003, T004, T010 (FR-012, SC-005).
- [x] T014 [P] Run the full quality gate locally per `quickstart.md`: `npx biome check .`,
      `npx vue-tsc --noEmit`, `npx vitest run` — confirm all three pass (Article IX parity with
      CI).
- [x] T015 Execute the remaining `quickstart.md` steps end-to-end against a local dev build
      (`npm run dev`, or `npm run storybook` for the T008 story variant) to visually confirm
      the filtered chip row and the fallback-to-default behavior described in User Story 1.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately.
- **Foundational (Phase 2)**: Depends on Phase 1 (T001); verification-only, very fast.
- **User Story 1 (Phase 3)**: Depends on Phase 2 (T002). No dependency on User Story 2.
- **User Story 2 (Phase 4)**: Depends on Phase 2 (T002). No dependency on User Story 1 — can
  be implemented and shipped independently or in parallel by a different contributor.
- **Polish (Phase 5)**: Depends on both User Story 1 (Phase 3) and User Story 2 (Phase 4)
  being complete.

### User Story Dependencies

- **User Story 1 (P1)**: Independent of US2. Delivers the diner-facing fix on its own.
- **User Story 2 (P2)**: Independent of US1. Delivers the CI safety net on its own — can even
  ship first, since it only adds a test, no production code change.

### Within Each User Story

- US1: tests (T003, T004) before implementation (T005-T007); Storybook (T008) can run in
  parallel with T007; verification (T009) last.
- US2: the test (T010) IS the deliverable; T011 is manual verification of the test's failure
  behavior; T012 confirms the green baseline.

### Parallel Opportunities

- T002 has no dependents besides Phase 3/4 start, so it can run alongside final review of
  Phase 1's baseline.
- T003 and T004 (different files) can run in parallel.
- T008 (Storybook, different file) can run in parallel with T007 (composable call-site wiring).
- T012 (US2 baseline run) can run in parallel with any US1 task once Phase 2 is done — the two
  stories touch entirely different files (`menu-sets.ts`/`useMenuFilters.ts`/`MenuShell.vue`
  vs. `tests/db/menu-seeds.test.ts`).

---

## Parallel Example: Phase 3 (User Story 1)

```bash
# Launch both new/extended test files together (different files, no dependency):
Task: "Write unit tests for filterAvailableKeys in app/features/menu/menu-sets.test.ts"
Task: "Extend useMenuFilters.test.ts with the drift-guard describe block"

# After T005-T007 land, the Storybook variant can be written in parallel with final wiring:
Task: "Add filtered-chip-row story variant to MenuShell.stories.ts"
```

## Parallel Example: Phase 3 + Phase 4 together

```bash
# US1 and US2 touch disjoint files, so a two-person team can run both phases at once:
Task: "US1 — implement filterAvailableKeys + wire into useMenuFilters/MenuShell"
Task: "US2 — add the curated-set-vs-seed regression test to tests/db/menu-seeds.test.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1 (T001) and Phase 2 (T002).
2. Complete Phase 3 (User Story 1, T003-T009) — this alone fixes the diner-facing bug.
3. **STOP and VALIDATE**: run `quickstart.md`'s User Story 1 steps.
4. Ship as the MVP if time-constrained; User Story 2 can follow in a fast-follow commit/PR.

### Incremental Delivery

1. Setup + Foundational (T001-T002) → baseline confirmed.
2. User Story 1 (T003-T009) → dead chips impossible at runtime → validate → ship.
3. User Story 2 (T010-T012) → drift now fails CI → validate → ship.
4. Polish (T013-T015) → confirm no regressions, full quality gate, visual check.

### Parallel Team Strategy

With two contributors: one takes User Story 1 (T003-T009, the `app/features/menu/**` files),
the other takes User Story 2 (T010-T012, `tests/db/menu-seeds.test.ts`) — the stories share no
files, so there is no merge-conflict risk between them; both converge on Phase 5 (Polish).

---

## Notes

- [P] tasks touch different files and have no unmet dependency.
- Every task under Phase 3/4 carries its story label ([US1]/[US2]) for traceability back to
  spec.md.
- T005-T007 are NOT marked [P] — they form a single dependency chain within `menu-sets.ts` →
  `useMenuFilters.ts` → `MenuShell.vue` (each step needs the previous file's export).
- No task touches `sauces`, `drinkSubGroups`/`drink_sub_group`, adds a new route, or changes a
  Neon schema/migration — consistent with FR-010/FR-011 and the plan's Complexity Tracking
  (no violations).
- Commit after each task or logical group per repository convention; run the Phase 5 quality
  gate before opening a PR.
