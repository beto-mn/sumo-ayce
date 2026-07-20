# Tasks: À La Carte Combo Notes & Menu Copy Refresh

**Input**: Design documents from `/specs/029-alacarta-combo-notes-menu-copy/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, quickstart.md

**Tests**: Included — constitution Article IV requires unit tests for server-side logic, written
before the implementation they cover (TDD). All test tasks below MUST be written and confirmed
FAILING before their corresponding implementation task begins.

**Organization**: Tasks are grouped by user story (US1 = Part A, US2 = Part B, US3 = Part C) per
`spec.md`. All three stories are P1 — they are independent, non-overlapping seed/schema edits
that can be delivered in any order, though US3 is listed last because it is the only one that
requires a schema migration.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: US1 (rice rename), US2 (piece-count copy), US3 (combo notes + schema)

## Path Conventions

Single Nuxt 4 repository. All paths below are relative to the repo root.

---

## Phase 1: Setup

**Purpose**: Confirm the environment is ready before any seed/schema edit.

- [x] T001 Verify local dev DB is reachable and the existing seed pipeline runs cleanly end to
      end (`pnpm db:up`, `pnpm db:migrate`, `pnpm db:seed`) as a pre-change baseline, per
      `quickstart.md` — this establishes the baseline the reseed in T019 will be compared against
      and surfaces the known `resetDrinkChildren()` FK-order bug early if it's going to trigger.

---

## Phase 2: Foundational

**Purpose**: Blocking prerequisites shared by all user stories.

No foundational tasks are required — Parts A (US1), B (US2), and C (US3) touch non-overlapping
files/rows (`menuCategories.ts` name field, `alaCarta.ts` descriptions, and a new schema column
+ query branch, respectively). The only schema change in this feature (the `cartaNoteEs`/
`cartaNoteEn` columns) is scoped entirely to US3 and is tracked within that story's phase below,
not shared by US1/US2.

---

## Phase 3: User Story 1 - Rice category renamed to "Arroces" (Priority: P1)

**Goal**: The shared `rice` menu category displays "Arroces" in Spanish (unchanged in English).

**Independent Test**: Load the à la carte menu in Spanish, confirm the rice-dishes category
reads "Arroces"; switch to English, confirm it still reads "Rice".

### Tests for User Story 1 ⚠️

> Write these tests FIRST, ensure they FAIL before implementation

- [x] T002 [P] [US1] Add a failing assertion in `tests/db/menu-seeds.test.ts` (within or
      alongside the existing `describe('menu categories seed', …)` block) that the `rice`
      category's `nameEs === 'Arroces'` and `nameEn === 'Rice'`

### Implementation for User Story 1

- [x] T003 [US1] In `server/db/seeds/menuCategories.ts`, change the `rice` entry's `nameEs` from
      `'Arroz'` to `'Arroces'` in the `CATEGORIES` array (leave `nameEn: 'Rice'` unchanged)
      (depends on T002 existing as a failing test)

**Checkpoint**: Run `tests/db/menu-seeds.test.ts` — the T002 assertion now passes; no other
assertion in that file regresses.

---

## Phase 4: User Story 2 - À la carte sushi piece-count copy (Priority: P1)

**Goal**: Every à la carte Sushi Frío, Sushi Caliente, and Sushi Dulce dish description ends with
bilingual piece-count copy ("10 Pzas." / "10 pcs.").

**Independent Test**: Load the à la carte menu, open Sushi Frío, Sushi Caliente, and Sushi Dulce,
confirm every dish description ends with the piece-count copy in both languages.

### Tests for User Story 2 ⚠️

> Write these tests FIRST, ensure they FAIL before implementation

- [x] T004 [P] [US2] Add a failing assertion in `tests/db/menu-seeds.test.ts` that every item in
      `alaCarta.ts`'s `COLD_ROLLS`, `HOT_ROLLS`, and `SWEET_ROLLS` arrays has a `descriptionEs`
      ending in `'10 Pzas.'` and a `descriptionEn` ending in `'10 pcs.'`

### Implementation for User Story 2

- [x] T005 [P] [US2] In `server/db/seeds/alaCarta.ts`, append `'10 Pzas.'` to `descriptionEs` and
      `'10 pcs.'` to `descriptionEn` for every item in the `COLD_ROLLS` array
- [x] T006 [P] [US2] In `server/db/seeds/alaCarta.ts`, append `'10 Pzas.'` to `descriptionEs` and
      `'10 pcs.'` to `descriptionEn` for every item in the `HOT_ROLLS` array
- [x] T007 [P] [US2] In `server/db/seeds/alaCarta.ts`, append `'10 Pzas.'` to `descriptionEs` and
      `'10 pcs.'` to `descriptionEn` for every item in the `SWEET_ROLLS` array

**Checkpoint**: Run `tests/db/menu-seeds.test.ts` — the T004 assertions now pass; AYCE-buffet
(`ayceMenu.ts`) and Express (`expressMenu.ts`) descriptions remain untouched.

---

## Phase 5: User Story 3 - À la carte-only combo notes via category split (Priority: P1)

> **[Revised after spec_ready human review]** — Part C's design changed from a shared-row +
> two-note-column-pairs + query-branch approach to a **category split**: 4 new category rows
> (`burgers_carta`, `hot_dogs_carta`, `cold_rolls_carta`, `hot_rolls_carta`) carrying the combo
> note, with the affected à la carte items reassigned to point at them, and the curated
> `AYCE_CARTA_SET` updated to reference the new keys. See `research.md`'s R3 revision note and
> `data-model.md` for the full rationale. **`server/utils/menu-queries.ts` is NOT touched by this
> story** — the existing `ayceModalityFilter()`/`groupByCategory()` logic already isolates the new
> category rows to the AYCE à la carte modality, as a side effect of the pre-existing
> `includedInAyce` item filter.

**Goal**: Hamburguesas, Hot Dogs, Sushi Frío and Sushi Caliente show a bilingual combo note ONLY
in the AYCE à la carte modality — never in AYCE buffet, never in Express — without disturbing the
existing modality-agnostic kids/wings notes, and without touching the shared category rows that
AYCE-buffet/Express continue to use.

**Independent Test**: Load à la carte, confirm the combo note on all four categories; switch to
AYCE buffet and to Express, confirm no combo note on any of the four (same category names, backed
by the original unsplit rows); confirm kids/wings notes are unchanged in every modality.

### Tests for User Story 3 ⚠️

> Write these tests FIRST, ensure they FAIL before implementation

- [x] T008 [P] [US3] Add failing assertions in `tests/db/menu-seeds.test.ts` that `CATEGORIES`
      contains exactly 4 new entries — `burgers_carta`, `hot_dogs_carta`, `cold_rolls_carta`,
      `hot_rolls_carta` — each with `nameEs`/`nameEn` matching its shared counterpart (e.g.
      `burgers_carta.nameEs === burgers.nameEs`) and non-null `noteEs`/`noteEn` matching the
      combo copy in `data-model.md`
- [x] T009 [P] [US3] Update the existing "leaves every category other than kids/wings without a
      note" test in `tests/db/menu-seeds.test.ts` so it excludes the 4 new `_carta` categories
      (asserted separately in T008) while still asserting the shared `burgers`/`hot_dogs`/
      `cold_rolls`/`hot_rolls`/`sweet_rolls` rows remain note-less, unchanged
- [x] T010 [P] [US3] Add a failing assertion in `tests/db/menu-seeds.test.ts` that every item in
      `alaCarta.ts`'s `BURGERS`, `HOT_DOGS`, `COLD_ROLLS`, and `HOT_ROLLS` arrays has a
      `categoryKey` equal to its `_carta` variant (not the shared key)
- [x] T011 [P] [US3] Extend the existing "menu-sets.ts curated keys match the active seed" block
      in `tests/db/menu-seeds.test.ts` with explicit assertions that `AYCE_CARTA_SET` contains the
      4 `_carta` keys and does NOT contain the 4 shared keys, while `AYCE_BUFFET_SET`/
      `EXPRESS_SET` contain the 4 shared keys and do NOT contain any `_carta` key

### Implementation for User Story 3

- [x] T012 [US3] Add 4 new values (`burgers_carta`, `hot_dogs_carta`, `cold_rolls_carta`,
      `hot_rolls_carta`) to the `menuCategoryKey` pgEnum in `server/db/schema.ts`, per
      `data-model.md` — no column, no table change (depends on T008–T011 existing as failing
      tests)
- [x] T013 [US3] Generate the Drizzle migration for the 4 new enum values (`pnpm db:generate`)
      and review the generated SQL to confirm it contains only 4× `ALTER TYPE ... ADD VALUE IF
      NOT EXISTS` statements, mirroring `0021_add_ensalada_arroces_category_keys.sql`/
      `0022_add_ramen_category_key.sql` (depends on T012)
- [x] T014 [US3] Apply the migration to the local dev DB (`pnpm db:up && pnpm db:migrate`) per
      `quickstart.md`, sanity-checking the known pre-existing `resetDrinkChildren()` FK-order bug
      in `server/db/seeds/drinkGroups.ts` does not block this feature's own migration/reseed
      (depends on T013)
- [x] T015 [US3] In `server/db/seeds/menuCategories.ts`: extend the local `CategoryKey` union type
      with the 4 new keys, and add 4 new entries to the `CATEGORIES` array (`nameEs`/`nameEn`
      copied from their shared counterparts, `noteEs`/`noteEn` per the combo copy in
      `data-model.md`/`spec.md` Assumptions, `isActive: true`, next available `displayOrder`
      values 17–20). Do NOT modify the existing `burgers`/`hot_dogs`/`cold_rolls`/`hot_rolls`
      entries (depends on T012)
- [x] T016 [US3] In `server/db/seeds/alaCarta.ts`: extend the local `CategoryKey` union type with
      the 4 new keys; change every item's `categoryKey` in the `BURGERS`, `HOT_DOGS`,
      `COLD_ROLLS`, and `HOT_ROLLS` arrays from the shared key to its `_carta` variant; update
      `requiredKeys` to replace the 4 shared keys with their `_carta` variants (leave
      `sweet_rolls` and all other keys unchanged, since `requiredKeys`/the delete-scope logic must
      target the categories à la carte items now actually belong to) (depends on T015)
- [x] T017 [US3] In `app/features/menu/menu-sets.ts`: in `AYCE_CARTA_SET` only, replace
      `'burgers'`/`'hot_dogs'`/`'cold_rolls'`/`'hot_rolls'` with `'burgers_carta'`/
      `'hot_dogs_carta'`/`'cold_rolls_carta'`/`'hot_rolls_carta'` at the same array positions;
      leave `AYCE_BUFFET_SET` and `EXPRESS_SET` referencing the original shared keys unchanged
      (depends on T015)
- [x] T018 [US3] Run the full delete-and-reseed cycle (`pnpm db:seed` against a clean DB state)
      per `quickstart.md`, confirming all ten touched categories (rice, cold_rolls, hot_rolls,
      sweet_rolls, burgers, hot_dogs, plus the 4 new `_carta` categories) reseed correctly and the
      known drink-children FK-order bug does not corrupt this feature's data (depends on T014,
      T016)

**Checkpoint**: All tests from T008–T011 pass. Manual verification per `quickstart.md` step 5:
à la carte shows the combo note on all four `_carta` categories; AYCE buffet and Express show the
same four category names (backed by the original, unsplit rows) with no combo note; kids/wings
notes unchanged in every modality. Confirm `server/utils/menu-queries.ts` and
`server/utils/menu-queries.test.ts` have zero diff — this story requires no change to either.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final validation across all three stories.

- [x] T019 [P] Run the full test suite (`pnpm test` or the project's equivalent Vitest command)
      and confirm zero regressions across all existing menu/seed tests, including
      `server/utils/menu-queries.test.ts` passing unmodified (US3 makes no change to that file)
- [x] T020 [P] Manual end-to-end verification against `quickstart.md`'s "Verify" checklist (rice
      rename, piece-count copy, combo notes visible/absent per modality) across both languages
      (ES/EN) and both location types (AYCE/Express)
- [x] T021 Confirm constitution Article IV coverage thresholds (80% server routes) are still met;
      note that US3 introduces zero new server-route/query-layer code to cover (seed-data + enum
      change only), so this check should be a formality, not a gap to close

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — run first.
- **Foundational (Phase 2)**: None required for this feature (see note above) — user stories may
  start immediately after Setup.
- **User Stories (Phase 3, 4, 5)**: Each is fully independent of the other two (different files/
  category keys) and may proceed in parallel or in any order. US3 (Phase 5) is the only story with
  an internal sequential dependency chain (enum → migration → seed/curated-set → reseed).
- **Polish (Phase 6)**: Depends on all three user stories being complete.

### User Story Dependencies

- **User Story 1 (US1)**: No dependency on US2 or US3.
- **User Story 2 (US2)**: No dependency on US1 or US3.
- **User Story 3 (US3)**: No dependency on US1 or US2 (touches different category keys entirely,
  no `server/utils/menu-queries.ts` change at all) — but internally, T012 → T013 → T014 →
  T015/T016 → T017 → T018 must run in that order (T015 and T016 both depend on T015's own
  completion since T016 assumes the new `CATEGORIES` entries already exist; T017 depends only on
  T015).

### Parallel Opportunities

- T002 (US1 test), T004 (US2 test), and T008–T011 (US3 tests) can all be written in parallel —
  different files/describe blocks, no shared dependency.
- T005, T006, T007 (US2 implementation across `COLD_ROLLS`/`HOT_ROLLS`/`SWEET_ROLLS`) can run in
  parallel — same file (`alaCarta.ts`) but disjoint array literals with no shared state.
- US1, US2, and US3 can be staffed and delivered in parallel by different contributors since they
  touch non-overlapping files/category keys (only T012–T018 within US3 has an internal sequential
  chain).

---

## Parallel Example: Writing all failing tests first

```bash
# Launch all test-writing tasks together before any implementation:
Task: "Add failing rice-name assertion in tests/db/menu-seeds.test.ts" (T002)
Task: "Add failing piece-count assertion in tests/db/menu-seeds.test.ts" (T004)
Task: "Add failing _carta category-row/reassignment/curated-set assertions in
       tests/db/menu-seeds.test.ts" (T008-T011)
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup.
2. Complete Phase 3: User Story 1 (rice rename) — smallest, lowest-risk, fastest to ship.
3. **STOP and VALIDATE**: Confirm "Arroces" renders correctly.
4. Continue to US2, then US3 (or in parallel, per team capacity).

### Incremental Delivery

1. Setup → US1 (rice rename) → validate → ship.
2. US2 (piece-count copy) → validate → ship.
3. US3 (category split + reseed) → validate (this is the story requiring the minimal enum
   migration + reseed; there is no query-layer change to validate) → ship.
4. Phase 6 polish once all three are in.

### Parallel Team Strategy

With multiple developers: Developer A takes US1, Developer B takes US2, Developer C takes US3 —
all three can proceed simultaneously since they touch disjoint files/category keys; only US3's own
T012→T018 chain is sequential within itself.

---

## Notes

- [P] tasks = different files or disjoint array literals within the same file, no dependencies.
- [Story] label maps each task to its user story for traceability.
- Tests MUST be written and confirmed failing before their paired implementation task.
- Commit after each task or logical group (per this repo's commit conventions).
- The full delete-and-reseed cycle (T018) is the highest-risk single step — see
  `quickstart.md`'s call-out of the pre-existing `resetDrinkChildren()` FK-order bug before
  running it against a non-empty DB.
- US3 was revised after the spec_ready human review (see `research.md`'s R3 revision note): the
  originally-planned schema migration (2 nullable columns) and `server/utils/menu-queries.ts`
  query-branch tasks are removed entirely, replaced by a smaller enum-value migration + seed
  category-split + curated-set update. `server/utils/menu-queries.ts` and its test file have zero
  diff in this feature.
