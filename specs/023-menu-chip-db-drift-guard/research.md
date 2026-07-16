# Research — Menu Chip / DB Drift Guard (023)

No `NEEDS CLARIFICATION` markers remained in `plan.md`'s Technical Context — this is a small,
well-bounded bug fix over an already-shipped feature (021), so Phase 0 focuses on confirming
the exact integration points rather than resolving open unknowns.

## 1. Where curated keys become chips today

**Decision**: Filter at the `curatedSet` computed in `useMenuFilters.ts` (the single place that
turns `menu-sets.ts`'s static arrays into the list `MenuShell.vue` maps over), not inside
`MenuShell.vue` itself.

**Rationale**: `useMenuFilters` already owns `curatedSet` (`getCuratedSet(activeSelection,
activeModality)`) and is the composable Article IV requires unit coverage for (70%
threshold). Filtering here means `MenuShell.vue`'s `chipItems` computed and
`foodCategoryLabel`/`drinkGroupLabel` never see a stale key at all — the fallback-to-raw-key
branch becomes unreachable for filtered keys without deleting it (it can still exist as
defense-in-depth for any other caller). This keeps the fix inside the existing composable
boundary (Article I) and avoids touching the component's template logic.

**Alternatives considered**:
- Filter inside `MenuShell.vue`'s `chipItems` computed directly. Rejected: `useMenuFilters` is
  already the tested seam for selection/category state; duplicating filtering logic in the
  component would spread membership logic across two files for no benefit, and the component
  doesn't currently own any filtering — only mapping/labeling.
- Filter inside `menu-sets.ts`'s `getCuratedSet()`. Rejected: `getCuratedSet` is a pure
  function of `(selection, modality)` with no access to fetched menu data; threading
  `FullMenuResult` into it would change its signature and blur "curated config" (pure,
  static) with "live availability" (impure, data-dependent) — better kept as two composable
  layers per Article X (KISS: don't merge two different concerns into one function).

## 2. Filter function shape

**Decision**: A small, pure helper — e.g. `filterAvailableKeys(keys: string[], availableKeys:
Set<string>): string[]` — added to `menu-sets.ts` alongside the existing pure helpers
(`getCuratedSet`, `getDefaultKey`, `resolveActiveKey`), taking the curated key list and the
set of keys actually present in the current `FullMenuResult` (categories for food views,
`drinkGroups` for Bebidas) and returning only the intersection, preserving curated order.

**Rationale**: `menu-sets.ts` already is the home for small, pure, synchronously-testable
helpers over these arrays (Article VIII: single-purpose functions under 30 lines). Keeping the
new helper pure (no Vue reactivity, no fetch) means it's trivially unit-testable in isolation
and reusable from `useMenuFilters` without any new dependency.

**Alternatives considered**:
- Inline `.filter()` directly in `useMenuFilters.ts`'s `curatedSet` computed with no named
  helper. Rejected: the same filter must also gate `resolveActiveKey`'s membership check (so a
  stale active key falls back to default), so a named, reusable helper avoids duplicating the
  `.filter()` logic in two call sites.

## 3. Regression test placement

**Decision**: Extend `tests/db/menu-seeds.test.ts` with a new `describe` block asserting every
key in each of `AYCE_BUFFET_SET`, `AYCE_CARTA_SET`, `EXPRESS_SET`, `DRINKS_SET` exists among
the active `CATEGORIES`/`DRINK_GROUPS` seed constants' keys, using the same `vi.mock('../../
server/utils/db', () => ({ db: {} }))` pattern already used in that file to import seed
constants without a live DB connection.

**Rationale**: `tests/db/menu-seeds.test.ts` already exists specifically to assert properties
of the seed constants (`DRINK_GROUPS`, `CATEGORIES`, etc.) as pure data, per its own file
comment ("the seed *data* is a pure constant we assert against directly"). Adding the
curated-set-vs-seed cross-check here is the natural extension of an established pattern
(Article I DRY: don't create a second, near-identical test file) rather than inventing a new
test location.

**Alternatives considered**:
- A new `app/features/menu/menu-sets.test.ts` importing seed constants directly. Rejected:
  would duplicate the existing `vi.mock('.../db')` stubbing boilerplate already centralized in
  `tests/db/menu-seeds.test.ts`, and would split "seed shape" assertions across two files for
  the same underlying concern (curated config vs. seed data agreement).
- Asserting against a live DB query in an integration test hitting Neon. Rejected: the seed
  constants (`CATEGORIES`, `DRINK_GROUPS`) already are the pre-deploy source of truth for what
  will be active after seeding; testing against the static seed data catches drift at
  build/review time (the whole point of FR-008/009) without a live DB dependency in CI,
  consistent with the existing `menu-seeds.test.ts` approach.

## 4. Excluding sauces / drinkSubGroups

**Decision**: The new regression test asserts only against `menu-sets.ts`'s four curated sets
(food categories + drink groups); it does not import or assert anything from
`server/db/seeds/sauces.ts` or `server/db/seeds/drinkSubGroups.ts`.

**Rationale**: FR-010 explicitly excludes these two catalogues — both were confirmed still
required as-is in a prior investigation (drinkSubGroups live in `MenuDrinkSection.vue`; sauces
retained per specs/021 FR-021 "for any future use"). Neither is referenced by
`menu-sets.ts`'s curated sets in the first place (curated sets list category/drink-group keys,
not sauce or sub-group keys), so no code path needs to touch them — the exclusion is naturally
satisfied by scoping the test to `menu-sets.ts`'s actual exports.

## 5. Storybook impact

**Decision**: If `MenuShell.stories.ts` (confirmed to exist) renders a story with a `menuData`
fixture that is missing one of the curated categories/drink-groups, add or update a story
variant demonstrating the filtered chip row (fewer chips than the full curated set). If no
such fixture variance currently exists, add one minimal variant.

**Rationale**: Article VII requires Storybook coverage for changed component behavior;
`MenuShell.vue`'s chip row can now visibly render fewer chips than `curatedSet`'s static
length when data is missing — a state worth demonstrating in isolation.

**Alternatives considered**: Skipping the story update on the grounds that "the underlying
data changed, not the component." Rejected: the component's rendered *output* (a possibly
shorter chip row) is new observable behavior from the story's point of view, and Article VII's
enforcement is about what the component can render, not where the filtering logic lives.
