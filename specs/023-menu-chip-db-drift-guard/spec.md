# Feature Specification: Menu Chip / DB Drift Guard

**Feature Branch**: `fix/023-menu-chip-db-drift-guard`
**Created**: 2026-07-15
**Status**: Draft
**Input**: User description: "Bug found during exploration (not yet spec'd/implemented):
`app/features/menu/menu-sets.ts` hardcodes the per-view category/drink-group membership
(`AYCE_BUFFET_SET`, `AYCE_CARTA_SET`, `EXPRESS_SET`, `DRINKS_SET`) consumed by
`useMenuFilters.ts` to build `MenuShell.vue`'s chip row. This static list is never
cross-checked against what `menu-queries.ts` actually returns from
`menu_categories`/`drink_group`. If a category (e.g. Sándwiches) and its menu_items are
removed from the DB but `menu-sets.ts` is not updated, `MenuShell.vue` still renders the
chip — `foodCategoryLabel()` falls back to the raw untranslated key string when the
category isn't found, and `activeFoodCategory` falls back to an empty `{ dishes: [] }`
section, so the chip leads to a silent blank state instead of being hidden. Fix should hide
curated-set chips with no matching DB entry and/or add a regression test asserting every
`menu-sets.ts` key exists in the DB seed, failing CI on drift. Out of scope: `sauces` and
`drinkSubGroups` tables/seeds — both confirmed still needed and must not be touched."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - No dead chip when a curated category is deactivated in the DB (Priority: P1)

A diner browsing `/menu` under any of the four views (AYCE · All You Can Eat, AYCE · Carta,
Express, Bebidas y coctelería) only ever sees chips that lead to a real, populated section.
If a restaurant operator deactivates or removes a category (and its dishes) from the menu
content store while the curated navigation config (`app/features/menu/menu-sets.ts`) still
lists that category, the diner never sees the chip for the missing category at all — the
chip row silently shrinks to the categories that are actually available, instead of showing
a chip that leads to an empty, untranslated-looking section.

**Why this priority**: This is the actual diner-facing bug. Without this fix, a routine
content change (an operator retiring a dish category) produces a broken-looking menu page
in production with no code change required to trigger it — the worst kind of silent
regression. This must be fixed regardless of whether the CI guard (User Story 2) also ships.

**Independent Test**: Deactivate/remove a category that is currently a member of one of the
four curated sets from the content store (without touching `menu-sets.ts`), reload `/menu`
in that view, and confirm: (a) no chip is rendered for the missing category, (b) the
remaining chips render exactly as before (same order, same labels), (c) no chip leads to an
empty or untranslated section.

**Acceptance Scenarios**:

1. **Given** a curated set (e.g. AYCE · All You Can Eat) whose members all still exist and
   have at least one active dish in the content store, **When** the diner views that set's
   chip row, **Then** every curated key renders as a chip, in the existing curated order,
   with the existing DB-sourced label — identical to current behavior (no regression).
2. **Given** a curated set where one member category (or, for Bebidas, one drink group) has
   been deactivated or removed from the content store, **When** the diner views that set's
   chip row, **Then** the chip for the missing member does NOT render, the remaining chips
   still render in their existing relative order, and the visible/active category never
   resolves to the missing member.
3. **Given** the diner's active/selected chip is the one whose category just became missing
   (e.g. via a stale deep link), **When** the page loads, **Then** the view falls back to the
   default category of the active set (existing fallback behavior) rather than rendering the
   removed category's now-empty section.
4. **Given** every member of a curated set has been removed from the content store (an
   extreme edge case), **When** the diner views that set, **Then** the chip row renders empty
   and the section shows the existing "no categories" empty-state messaging rather than a
   crash or a blank layout with no explanation.
5. **Given** a category that is NOT part of any curated set exists and is active in the
   content store (e.g. an internal-only category), **When** any chip row renders, **Then** no
   chip is created for it — curated-set membership, not DB presence, still determines what
   *could* show; DB presence only determines what additionally gets filtered out.

---

### User Story 2 - Automated regression guard catches curated-set / DB drift before release (Priority: P2)

A developer changes the menu content seed (adds, renames, or deactivates a category or drink
group) without updating `app/features/menu/menu-sets.ts` to match. Before the change reaches
production, the project's automated test suite fails with a clear message identifying exactly
which curated-set key no longer has a matching, active entry in the content store, so the
drift is caught and fixed at review time instead of being silently absorbed by the runtime
guard (User Story 1) in production.

**Why this priority**: User Story 1 makes drift harmless to diners, but it doesn't prevent
drift from happening or make it visible to the team — a category could silently disappear
from a curated set for weeks before anyone notices the shrinking chip row. An automated test
turns silent drift into a loud, immediate build failure. This depends on User Story 1 only in
spirit (it guards the same config), not in implementation — each can be built and verified
independently.

**Independent Test**: Temporarily rename or remove one key from one of the four curated sets
in `menu-sets.ts` (or add a key that has no matching content-store entry) and run the test
suite; confirm the new regression test fails with a message naming the offending key and
set. Revert the change and confirm the test passes.

**Acceptance Scenarios**:

1. **Given** the current, unmodified curated sets and the current content-store seed,
   **When** the regression test runs, **Then** it passes (every key in every curated set has
   a matching active category/drink-group entry in the seed).
2. **Given** a curated set that references a category/drink-group key with no matching active
   entry in the content-store seed, **When** the regression test runs, **Then** it fails, and
   the failure message names the specific missing key and which curated set it belongs to.
3. **Given** the content-store seed removes or deactivates a category/drink-group that is
   still referenced by a curated set, **When** the test suite runs in CI, **Then** the build
   fails before the change can be merged.
4. **Given** the `sauces` or `drinkSubGroups`/`drink_sub_group` catalogues, **When** the
   regression test runs, **Then** it does not assert anything about them — they are outside
   this guard's scope.

---

### Edge Cases

- **A curated set loses every one of its members** (all deactivated/removed): the chip row
  for that set renders empty; the section shows the existing empty-state messaging rather
  than crashing or rendering a phantom section (see US1 Scenario 4).
- **A deep-linked/shared URL references a category that is a curated-set member but has
  since been removed from the content store**: the runtime guard filters it from the chip
  row, and the existing out-of-set fallback logic (`resolveActiveKey`) resolves the view to
  the active set's default category rather than rendering the removed category's empty
  section.
- **A category is temporarily deactivated and later reactivated**: the chip reappears
  automatically on the next content read with no code change required (the guard is
  data-driven, not a one-time filter).
- **The Bebidas view loses a drink group**: the same hide-when-missing behavior applies to
  drink-group chips as to food-category chips — both come from the same curated-set model.
- **A category exists in the content store but is not a member of any curated set**: it must
  never appear as a chip; this feature does not change what is eligible to show, only removes
  members that are curated but no longer backed by data.
- **The regression test and the runtime guard disagree during a transitional deploy** (test
  added before the runtime guard, or vice versa): each acceptance scenario is independently
  testable, so either can ship first without the other; together they provide defense in
  depth (test catches drift at build time, runtime guard protects diners even if drift
  reaches production some other way, e.g. hot content edits between deploys).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST render a chip for a curated-set member (food category or drink
  group) only when that member also exists as an active entry in the current menu content
  read for the active view (i.e. appears in the fetched result's categories or drink groups).
- **FR-002**: The system MUST NOT render a chip for any curated-set member that has no
  matching active entry in the current menu content read, for any of the four curated sets
  (AYCE · All You Can Eat, AYCE · Carta, Express, Bebidas y coctelería).
- **FR-003**: Filtering curated-set members against the content read MUST NOT change the
  relative order of the chips that DO still have a matching active entry — existing curated
  ordering is preserved for all still-valid members.
- **FR-004**: Filtering curated-set members against the content read MUST NOT change chip
  labels, accent colors, or any other presentation behavior for still-valid members — this is
  strictly a membership filter, not a relabeling or reordering change.
- **FR-005**: When the currently active/selected category or drink group is filtered out
  because it no longer has a matching content-store entry, the system MUST resolve the active
  selection to that view's existing default category/group (reusing the existing
  out-of-set-key fallback behavior) rather than rendering the missing member's section.
- **FR-006**: When a curated set has zero members with a matching active content-store entry,
  the system MUST render the set's existing empty-state messaging for that section rather
  than a broken or blank layout.
- **FR-007**: The system MUST NOT introduce a mechanism that adds chips for content-store
  categories/drink groups that are not already members of one of the four existing curated
  sets — the curated sets remain the sole source of truth for *what can* show; the content
  store only determines what additionally gets hidden.
- **FR-008**: The project's automated test suite MUST include a regression test that, for
  each of the four curated sets in `app/features/menu/menu-sets.ts`, asserts every referenced
  key exists as an active entry in the current menu content seed.
- **FR-009**: The regression test required by FR-008 MUST fail with a message that identifies
  both the specific missing key and the curated set it belongs to, so a developer can
  immediately locate and fix the drift.
- **FR-010**: This feature MUST NOT modify the `sauces` table/seed or the
  `drinkSubGroups`/`drink_sub_group` table/seed, and MUST NOT add any regression coverage
  asserting drift for those two catalogues — both are explicitly out of scope and confirmed
  still required as-is.
- **FR-011**: This feature MUST NOT add new routes, new query parameters, or change the
  existing URL-sharing/deep-link contract for `/menu` beyond the fallback behavior already
  required by FR-005 (which reuses existing fallback logic, not new logic).
- **FR-012**: Existing curated-set membership, ordering, default-category resolution, and
  deep-link fallback behavior for categories/drink groups that DO still exist in the content
  store MUST be unaffected by this feature (no regression to current `/menu` behavior when no
  drift is present).

### Key Entities *(include if feature involves data)*

- **Curated set**: An ordered list of category/drink-group keys per view (AYCE · buffet, AYCE
  · Carta, Express, Bebidas), defined in `app/features/menu/menu-sets.ts`. Unchanged by this
  feature except that its members are now filtered against live content before becoming
  chips.
- **Menu content read**: The current, live set of active categories and drink groups
  available for the active view (already fetched today to render dish/drink data). This
  feature adds the requirement that curated-set membership is validated against this read
  before a chip is produced.
- **Chip**: A UI affordance representing one curated-set member that, when active, scopes the
  visible section. After this fix, a chip only exists for members with a matching active
  content entry.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of chips rendered in any of the four `/menu` views lead to a section with
  at least one item, or the diner never sees a chip whose section would render empty due to a
  missing content-store category/drink group.
- **SC-002**: When a category or drink group that is a curated-set member is removed or
  deactivated from the content store without any code change, the corresponding chip
  disappears from the affected view on the very next content read (verifiable within one
  deploy/content-refresh cycle, no manual intervention required).
- **SC-003**: Removing a category/drink group from the content store never leaves a diner on
  a silently blank or untranslated-looking section — verifiable in 100% of such removals via
  automated testing.
- **SC-004**: A drift between `app/features/menu/menu-sets.ts` and the live content seed (a
  curated-set key with no matching active entry) is caught by the automated test suite before
  merge, 100% of the time such drift is introduced.
- **SC-005**: All previously passing menu navigation behavior (curated ordering, default
  category on view switch, deep-link restoration) continues to pass unchanged when no drift
  is present — 0 regressions.

## Assumptions

- The menu content store (Neon Postgres, per the constitution's Architecture principle) is
  the reference of truth for what content currently exists; the curated sets in
  `menu-sets.ts` remain the reference of truth for what the navigation is allowed to show —
  this feature only adds a "must also exist" filter on top of curated membership, it does not
  change which categories are eligible to be curated.
- "Removed or deactivated" in the content store means the category/drink-group (and/or its
  dishes) no longer appears in the data already being fetched to render the menu page today
  — no new data source or new endpoint is introduced to detect this.
- The existing out-of-set fallback behavior (resolving an invalid/missing selected key to the
  view's default) is reused as-is for the case where the currently active chip becomes
  filtered out; this feature does not define new fallback semantics beyond applying the
  existing ones to this new trigger condition.
- The `sauces` and `drinkSubGroups`/`drink_sub_group` catalogues are confirmed still in
  active use elsewhere in the menu experience (per `specs/021-menu-experience-overhaul/`)
  and are explicitly excluded from both the runtime guard and the regression test added here.
- This fix applies uniformly to all four curated sets (AYCE · All You Can Eat, AYCE · Carta,
  Express, Bebidas y coctelería); the Kids view is a single flat section with no chip row and
  is unaffected by this feature.
- No visual design changes are required — the fix is behavioral (fewer/no chips when data is
  missing), not a new UI treatment.

## Out of Scope

- Any change to the `sauces` table/seed or the `drinkSubGroups`/`drink_sub_group` table/seed.
- Any change to the Kids view (single flat section, no chip row, not curated-set driven).
- Adding an admin-facing warning/notification when drift is introduced in the content store
  directly (the regression test guards the codebase/seed path, not live content edits made
  directly in the content store outside of a code change).
- New `/menu` routes, new query parameters, or changes to the deep-link contract beyond
  reusing existing fallback behavior.
- Broader menu data cleanup, restructuring of curated sets, or changes to curated-set
  membership/ordering themselves.

## Dependencies

- Prior feature 021 (`menu-experience-overhaul`, done) — establishes the curated-set model
  (`app/features/menu/menu-sets.ts`), the filter composable (`useMenuFilters.ts`), the chip
  row and category-label fallback logic (`MenuShell.vue`), and the DB-driven category/drink-
  group labels this feature filters against.
- The existing menu content read (`server/utils/menu-queries.ts` / `getFullMenu`) as the
  source of truth for which categories/drink groups are currently active.
- The existing test suite structure (`tests/db/menu-seeds.test.ts` and co-located Vitest
  specs) as the home for the new regression test (FR-008).
