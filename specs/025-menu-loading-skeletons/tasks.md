# Tasks: Menu Loading Skeletons

**Input**: Design documents from `/specs/025-menu-loading-skeletons/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/skeleton-components.md, quickstart.md

**Tests**: Included — the constitution (Article IV) requires co-located tests for new components,
and the spec's FR-015 explicitly requires automated coverage confirming placeholder shapes/count
and reduced-motion behavior.

**Organization**: Tasks are grouped by user story (US1 = P1, US2 = P2, US3 = P2, per spec.md) to
enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1/US2/US3)
- File paths are exact and relative to the repository root.

## Path Conventions

Existing Nuxt 4 single-repo layout (see `plan.md` Project Structure):
- `app/components/ui/` — shared UI primitives (Nuxt auto-imports with `Ui` prefix, no manual
  registration needed — confirmed against `nuxt.config.ts`'s existing `components: [{ path:
  '~/components/ui', prefix: 'Ui' }]` entry).
- `app/features/menu/components/` — menu-scoped components (Nuxt auto-imports by bare name, same
  convention already used by `MenuShell`/`MenuCategoryChips`/etc. — no manual registration needed).
- `app/pages/menu.vue` — the route file.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Confirm the project is ready for the new components — no new dependencies, no build
config changes are needed for this feature.

- [ ] T001 Confirm `tailwind.config` (or the project's Tailwind setup) already exposes the
  `animate-pulse` utility and the `motion-reduce:` variant with no plugin changes required, and
  confirm `app/components/ui/` and `app/features/menu/components/` are already covered by the
  existing Nuxt `components` auto-import config in `nuxt.config.ts` (no new entries needed) —
  record the confirmation as a one-line note in this task's checkbox comment (no file changes
  expected from this task).

**Checkpoint**: No dependency/config changes needed — proceed directly to Foundational.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Build the one primitive shared by all three user stories — the generic pulsing
placeholder box with built-in `prefers-reduced-motion` handling. All user stories depend on this.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [ ] T002 Create `app/components/ui/UiSkeleton.vue` — a `<script setup lang="ts">` component
  accepting a `shape?: 'rect' | 'pill' | 'circle'` prop (default `'rect'`), rendering a single
  `<div aria-hidden="true">` styled with the pop-art tokens (`bg-bg2` background, `rounded-pop-sm`
  for `rect`, `rounded-pop-full` for `pill`/`circle`) and the classes `animate-pulse
  motion-reduce:animate-none` (mirroring the exact reduced-motion pattern already used in
  `app/components/ui/Marquee.vue`'s track). No slots, no width/height props — sizing is left to
  the consumer via Vue's automatic `class` attribute inheritance.
- [ ] T003 [P] Create `app/components/ui/UiSkeleton.stories.ts` with a **Default** story (`shape:
  'rect'`, default animated), a **Pill** story (`shape: 'pill'`), a **Circle** story (`shape:
  'circle'`), a **ReducedMotion** story documenting the static appearance (annotate with a
  `prefers-reduced-motion` viewport/media parameter if the Storybook addon supports it, otherwise
  a code comment demonstrating the `motion-reduce:animate-none` class is present), and a
  **Responsive** story showing the component at mobile and desktop viewports per Article VII.
- [ ] T004 [P] Create `app/components/ui/UiSkeleton.spec.ts` (Vitest + `@vue/test-utils`) covering:
  renders a `div` with `aria-hidden="true"`; applies `rounded-pop-sm` for `shape="rect"` (default)
  and `rounded-pop-full` for `shape="pill"` and `shape="circle"`; always applies both `animate-pulse`
  and `motion-reduce:animate-none` classes (asserting the reduced-motion class is present
  regardless of the `shape` prop, since disabling motion must never depend on shape).

**Checkpoint**: `UiSkeleton.vue` is built, tested, and documented — user story implementation can
now begin.

---

## Phase 3: User Story 1 - Feedback while switching menu selection (Priority: P1) 🎯 MVP

**Goal**: Switching primary selection or AYCE modality on `/menu` immediately shows skeleton
placeholders (exact chip count for the destination view, a fixed dish/drink card grid) instead of
the previous selection's stale content, until the new data arrives.

**Independent Test**: On `/menu`, switch the primary selection and modality several times
(including on a throttled connection) and confirm each switch immediately shows the skeleton
(never stale content), with a chip count that exactly matches the real chip count once loaded, and
that Kids never shows a chip skeleton row.

### Tests for User Story 1

> Write these tests FIRST; ensure they FAIL before the corresponding implementation task.

- [ ] T005 [P] [US1] Write `app/features/menu/components/MenuChipSkeleton.spec.ts` (before the
  component exists) asserting: renders a single pill-shaped placeholder matching `UiChip`'s
  height/border classes; contains a `UiSkeleton` with `shape="pill"`.
- [ ] T006 [P] [US1] Write `app/features/menu/components/MenuDishCardSkeleton.spec.ts` (before the
  component exists) asserting: renders the same outer card shell classes as `MenuDishCard.vue`
  (`rounded-pop border-pop border-ink bg-panel p-4 shadow-pop-sm`); contains exactly 3 `UiSkeleton`
  instances (image area, title line, description line).
- [ ] T007 [P] [US1] Write `app/features/menu/components/MenuSkeleton.spec.ts` (before the
  component exists) asserting, via `getCuratedSet` from `app/features/menu/menu-sets.ts`: renders
  exactly 8 `MenuChipSkeleton` for `(selection: 'ayce', modality: 'buffet')`, exactly 11 for
  `(selection: 'ayce', modality: 'carta')`, exactly 8 for `(selection: 'express', modality:
  'buffet')`, exactly 6 for `(selection: 'drinks', modality: 'buffet')`, and **0** (no chip row
  rendered at all) for `(selection: 'kids', modality: 'buffet')`; always renders exactly 6
  `MenuDishCardSkeleton` instances regardless of selection/modality; root element carries
  `role="status"` and `aria-live="polite"` with a visually-hidden loading label.

### Implementation for User Story 1

- [ ] T008 [P] [US1] Implement `app/features/menu/components/MenuChipSkeleton.vue` per the contract
  in `specs/025-menu-loading-skeletons/contracts/skeleton-components.md` — no props, wraps one
  `<UiSkeleton shape="pill" class="h-10 w-24 border-pop border-ink" />`-equivalent markup sized to
  match `UiChip`'s dimensions (reference `app/components/ui/Chip.vue` for the exact pill classes).
- [ ] T009 [P] [US1] Implement `app/features/menu/components/MenuDishCardSkeleton.vue` — no props,
  wraps `MenuDishCard.vue`'s outer shell classes around one image-area `UiSkeleton` (`h-44`
  matching the real image box height), one title-line `UiSkeleton`, and one description-line
  `UiSkeleton` (two lines, `w-full` and `w-3/4` to read as wrapped text).
- [ ] T010 [US1] Implement `app/features/menu/components/MenuSkeleton.vue` (depends on T008, T009)
  — props `selection: PrimarySelection`, `modality: AyceModality` (imported from
  `@/features/menu/menu-sets`); computes `chipKeys = getCuratedSet(selection, modality)` and
  `showChips = selection !== 'kids'`; renders, when `showChips`, a `flex flex-wrap gap-2` row with
  one `MenuChipSkeleton` per entry in `chipKeys` (mirroring `MenuCategoryChips.vue`'s wrapper
  markup); always renders a `grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3` grid (mirroring
  `MenuDishGrid.vue`) with 6 `MenuDishCardSkeleton` instances; root element has `role="status"
  aria-live="polite"` plus a visually-hidden (`sr-only`) bilingual-safe loading label.
- [ ] T011 [US1] Modify `app/pages/menu.vue`: destructure `status` from the existing
  `useAsyncData` call (in addition to the already-destructured `data`/`error`); add a computed
  `isLoading = computed(() => status.value === 'pending')`; add a new template branch
  `v-else-if="isLoading"` rendering `<MenuSkeleton :selection="activeSelection"
  :modality="activeModality" />`, positioned AFTER the existing `error || isUnavailable` branch and
  BEFORE the existing `data` branch, so error/unavailable messaging always takes precedence over a
  stale pending indicator (FR-011). No other branch, prop, or computed on this page changes.
- [ ] T012 [P] [US1] Create `app/features/menu/components/MenuChipSkeleton.stories.ts` with a
  Default story and a Responsive story (mobile/desktop) per Article VII.
- [ ] T013 [P] [US1] Create `app/features/menu/components/MenuDishCardSkeleton.stories.ts` with a
  Default story and a Responsive story (mobile/desktop) per Article VII.
- [ ] T014 [US1] Create `app/features/menu/components/MenuSkeleton.stories.ts` (depends on T012,
  T013) with stories for each selection/modality combination that has a chip row (AYCE·buffet,
  AYCE·carta, Express, Bebidas) showing the exact chip count, a **Kids** story showing no chip row,
  and a Responsive story (mobile/desktop) per Article VII.

**Checkpoint**: User Story 1 is fully functional and independently testable — switching selection
on `/menu` now shows an exact-count skeleton instead of stale content.

---

## Phase 4: User Story 2 - Feedback on a slow first load (Priority: P2)

**Goal**: Loading `/menu` fresh (no cached data, slow connection) shows the same skeleton
placeholders from first paint instead of a blank page.

**Independent Test**: Load `/menu` fresh (clear cache / first visit) on a throttled connection;
confirm the skeleton for the default view (AYCE · All You Can Eat) appears immediately and is
replaced by real content with no visible flash of empty content.

**Note**: This story reuses every component built in User Story 1 (`MenuSkeleton` reacting to
`useAsyncData`'s `status`) — no new component is introduced. The tasks here validate that the same
mechanism correctly covers the initial-load path (not just client-side switches), since Nuxt's
`useAsyncData` sets `status` to `'pending'` on first mount exactly as it does on a key change.

### Tests for User Story 2

- [ ] T015 [US2] Add a test case to `app/pages/menu.spec.ts` (create the file if it does not
  already exist, following the project's page-testing conventions) asserting: when
  `useAsyncData`'s `status` is `'pending'` and `data` is `undefined` (simulating a fresh first
  load with nothing cached), the page renders `MenuSkeleton` with `selection="ayce"` and
  `modality="buffet"` (the default landing view) and does NOT render `MenuShell` or the error/
  unavailable message.

### Implementation for User Story 2

- [ ] T016 [US2] Verify (and adjust only if needed) that `activeSelection`/`activeModality` in
  `app/pages/menu.vue` already resolve correctly from `route.query` before the fetch resolves on a
  cold load (they do today, independent of `data`/`status` — confirm no regression was introduced
  by T011) so `MenuSkeleton` receives the correct default view on first paint.

**Checkpoint**: User Stories 1 AND 2 both work independently — the skeleton mechanism now covers
both switching and cold first loads.

---

## Phase 5: User Story 3 - Motion-sensitive diners see a calm placeholder (Priority: P2)

**Goal**: Under `prefers-reduced-motion: reduce`, every skeleton shape (chip and dish card) is
static — no pulsing/shimmering animation — while still communicating the loading state.

**Independent Test**: With the OS/browser "reduce motion" setting enabled (or emulated via
`prefers-reduced-motion: reduce` in devtools), trigger a menu switch or a fresh slow load; confirm
skeleton shapes appear without animation.

**Note**: The reduced-motion CSS itself (`motion-reduce:animate-none`) is already built into
`UiSkeleton.vue` in the Foundational phase and inherited automatically by every composition
(`MenuChipSkeleton`, `MenuDishCardSkeleton`, `MenuSkeleton`) built in US1 — no additional
implementation is required. This story's tasks add the specific automated coverage and Storybook
documentation for that behavior across the composed components (Foundational's `UiSkeleton.spec.ts`
already covers the primitive in isolation; these tasks confirm it holds through composition).

### Tests for User Story 3

- [ ] T017 [P] [US3] Add a test case to `app/features/menu/components/MenuChipSkeleton.spec.ts`
  asserting the rendered pill carries the `motion-reduce:animate-none` class (via its nested
  `UiSkeleton`).
- [ ] T018 [P] [US3] Add a test case to `app/features/menu/components/MenuDishCardSkeleton.spec.ts`
  asserting all 3 nested `UiSkeleton` placeholders carry the `motion-reduce:animate-none` class.
- [ ] T019 [US3] Add a test case to `app/features/menu/components/MenuSkeleton.spec.ts` asserting
  that for every rendered `MenuChipSkeleton`/`MenuDishCardSkeleton` instance (across at least one
  chip-bearing selection and the Kids selection), no element in the rendered tree is missing the
  `motion-reduce:animate-none` class — i.e. reduced-motion coverage holds end-to-end through the
  full composition, not just at the primitive level.

### Documentation for User Story 3

- [ ] T020 [P] [US3] Add a **ReducedMotion** story variant to
  `app/features/menu/components/MenuSkeleton.stories.ts` (created in US1) documenting the static
  appearance for at least the AYCE·buffet (chip-bearing) case, per Article VII's requirement that
  every significant prop/behavioral variant have a story.

**Checkpoint**: All user stories (US1, US2, US3) are independently functional — the full skeleton
feature is complete: switching, cold loads, and reduced motion are all covered end-to-end.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final verification across all three stories.

- [ ] T021 [P] Run `pnpm biome check .` and fix any formatting/lint issues introduced by this
  feature's new files.
- [ ] T022 [P] Run `pnpm vue-tsc --noEmit` and fix any type errors introduced by this feature's new
  files.
- [ ] T023 Run `pnpm vitest run` and confirm all new and existing tests pass, with no regressions
  to existing `menu.vue`/`MenuShell`-related suites.
- [ ] T024 Run `pnpm storybook` (or the project's Storybook build command) and confirm
  `UiSkeleton`, `MenuChipSkeleton`, `MenuDishCardSkeleton`, and `MenuSkeleton` stories all build
  without error.
- [ ] T025 Execute the manual verification steps in
  `specs/025-menu-loading-skeletons/quickstart.md` end-to-end (throttled switch, throttled cold
  load, reduced-motion emulation, and the error/unavailable precedence check) and confirm all
  pass.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately.
- **Foundational (Phase 2)**: Depends on Setup completion — BLOCKS all user stories (US1, US2, US3
  all consume `UiSkeleton.vue`).
- **User Story 1 (Phase 3)**: Depends on Foundational completion. No dependency on US2/US3.
- **User Story 2 (Phase 4)**: Depends on Foundational AND on US1's `MenuSkeleton`/`menu.vue` wiring
  existing (T010, T011) — it validates the same mechanism on the cold-load path, so it cannot be
  meaningfully tested before US1 lands. Not independently implementable before US1, but
  independently *testable* once US1 is in place (per spec.md's own framing of US2 as "naturally
  follows" US1).
- **User Story 3 (Phase 5)**: Depends on Foundational (the `motion-reduce` CSS lives there) AND on
  US1's composed components existing (T008-T010) to add composition-level coverage. Same
  relationship as US2: not independently implementable before US1, independently testable once
  US1 exists.
- **Polish (Phase 6)**: Depends on all three user stories being complete.

### Within Each User Story

- Tests (T005-T007 for US1) MUST be written and FAIL before their corresponding implementation
  tasks (T008-T010).
- `MenuChipSkeleton`/`MenuDishCardSkeleton` (T008, T009) before `MenuSkeleton` (T010), which
  composes them.
- `MenuSkeleton` (T010) before `menu.vue` wiring (T011), which consumes it.
- Implementation before Storybook stories (T012-T014) for each component.

### Parallel Opportunities

- T003 and T004 (Foundational stories/spec) can run in parallel once T002 lands.
- T005, T006, T007 (US1 tests) can run in parallel (different files) before any US1 implementation
  task.
- T008 and T009 (US1 chip/card skeleton components) can run in parallel (different files); T010
  depends on both.
- T012 and T013 (US1 chip/card Storybook stories) can run in parallel; T014 depends on both.
- T017 and T018 (US3 tests) can run in parallel (different files).

---

## Parallel Example: User Story 1

```bash
# Launch all US1 tests together (write first, confirm they fail):
Task: "Write app/features/menu/components/MenuChipSkeleton.spec.ts"
Task: "Write app/features/menu/components/MenuDishCardSkeleton.spec.ts"
Task: "Write app/features/menu/components/MenuSkeleton.spec.ts"

# Launch the two composable skeleton components together:
Task: "Implement app/features/menu/components/MenuChipSkeleton.vue"
Task: "Implement app/features/menu/components/MenuDishCardSkeleton.vue"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001).
2. Complete Phase 2: Foundational (T002-T004) — CRITICAL, blocks all stories.
3. Complete Phase 3: User Story 1 (T005-T014).
4. **STOP and VALIDATE**: Switch selections on `/menu` manually and via the US1 tests; confirm no
   stale content ever shows and chip counts are exact.
5. Deploy/demo if ready — this alone delivers the client's core request.

### Incremental Delivery

1. Setup + Foundational → shared primitive ready.
2. Add User Story 1 → test independently → deploy/demo (MVP: switching feedback).
3. Add User Story 2 → test independently → deploy/demo (cold-load feedback, same mechanism).
4. Add User Story 3 → test independently → deploy/demo (reduced-motion compliance verified
   end-to-end).
5. Polish (Phase 6) → final gates and manual quickstart pass.

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together (small, single-file scope — likely one developer).
2. Once Foundational is done, User Story 1 is the only story that can start immediately (US2/US3
   depend on its components existing first per the Dependencies section above) — assign it to the
   most available developer; US2/US3 tasks can be picked up by others as soon as US1's T008-T010
   land, even before T011-T014 finish.

---

## Notes

- [P] tasks = different files, no dependencies.
- [Story] label maps task to specific user story for traceability.
- No new npm/pnpm dependencies are introduced by this feature (Tailwind's `animate-pulse` and
  `motion-reduce:` are already available; Nuxt's existing component auto-import config already
  covers both target folders).
- `MenuShell.vue` and every existing menu component (`MenuCategoryChips.vue`, `MenuDishGrid.vue`,
  `MenuDishCard.vue`, `MenuTypeToggle.vue`, `MenuModalityToggle.vue`, `MenuDrinkSection.vue`) are
  NOT modified by any task in this list.
- Commit after each task or logical group, per repository convention.
