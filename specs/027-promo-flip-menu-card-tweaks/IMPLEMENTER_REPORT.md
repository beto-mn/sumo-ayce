# Implementer Report — Feature 027 (promo-flip-menu-card-tweaks)

**Branch**: `feat/027-promo-flip-menu-card-tweaks`
**Status at handoff**: implementation complete, `./init.sh` green. `feature_list.json` left at `spec_ready` (status transitions are the leader's job, not touched here).

This round restarted implementation after Amendment 2 scrapped the original
"Ramen XL hero image" approach. Parts A and B were already fully implemented
by a prior round and are unchanged here (verified, not re-touched). This
round's work: cleaned up the abandoned hero-image artifacts, built the new
generic option-groups schema, and implemented Parts C/D/E per the current
(twice-amended) spec/data-model/research/tasks.

## What was built, per part

**Part A (flip-to-terms)** — unchanged this round, already complete:
`PromotionsCarousel.vue` owns `flippedId`, `PromotionCard.vue` renders the 3D
flip (reduced-motion cross-fade fallback), `tyc_es`/`tyc_en` bilingual-complete
gating in `validators.ts`/`mapPromotion`. Verified via existing test suite,
no changes needed. Added the missing `tyc_es`/`tyc_en` documentation to
`docs/business/wordpress-endpoints.md` (task T049 was outstanding).

**Part B (Garantía badge)** — unchanged this round, already complete: badge
already at `size-24` (from `size-16`) in `MenuDishCard.vue`, tests/stories
already covered it. No changes needed.

**Part C (Ramen XL build-your-own, DB-driven)** — implemented fresh:
- Deleted `MenuDishHero.vue`/`.spec.ts`/`.stories.ts` and the orphaned
  migration `0030_add_menu_item_display_variant.sql` (+ journal entry).
- Removed the `displayVariant` column/CHECK from `server/db/schema.ts` and
  every reference in `types/menu.ts`, `server/utils/menu-queries.ts`,
  `server/db/seeds/alaCarta.ts`, `server/db/seeds/kidsMenu.ts`, and deleted
  `tests/db/menu-display-variant.test.ts`.
- Added two new generic, reusable tables: `menu_item_option_groups` and
  `menu_item_option_choices` (migration `0031`), attachable to any
  `menu_items` row.
- `types/menu.ts`: new `DishOptionChoice`/`DishOptionGroup` interfaces,
  `FullMenuDish.optionGroups: DishOptionGroup[]`.
- `server/utils/menu-queries.ts`: new batched `queryOptionGroupsByMenuItem()`
  (two queries: groups then choices, mirroring `querySauces`/
  `queryDrinkGroups`'s style — no N+1), wired into `getFullMenu()` for both
  the standard and Kids-view paths. A group with zero active choices is
  dropped entirely (never an empty picker).
- `MenuDishCard.vue`: renders one `MenuSaucePicker` per `dish.optionGroups`
  entry (component itself unchanged, per research.md R6a).
- `MenuDishGrid.vue`: simplified — removed the `MenuDishHero` swap entirely;
  every dish renders uniformly via `MenuDishCard`.
- New seed file `server/db/seeds/menuItemOptions.ts` (`seedMenuItemOptions()`)
  seeding Ramen XL's 3 groups (`noodle_base`, `protein`, `extra_protein` —
  the last modeled as a $0/+$29 two-choice group per research.md R6a, not a
  separate add-on entity type) and Vaso Sumo's `flavor` group (Part E). Wired
  into `server/db/seed.ts` after both `seedAlaCarta()` and `seedDrinks()`.
- Reverted Ramen XL's seed `fileName` back to `menu/ala-carta/ramen_xl.webp`
  (the abandoned hero asset path is gone).

**Part D (Kids AYCE gradient, standalone mechanism)**:
- Replaced the scrapped `displayVariant` enum with a standalone
  `menu_items.highlight_background` boolean (migration `0030`, default
  `false`), analogous to the existing `featured` boolean.
- `MenuDishCard.vue`'s prop renamed `highlightImagePanel` → `highlightBackground`
  (matches the DB column/type name end-to-end); `MenuDishGrid.vue` passes
  `dish.highlightBackground` through generically to every dish (no per-dish
  branching).
- `server/db/seeds/kidsMenu.ts`: "All You Can Eat Kids" now carries
  `highlightBackground: true`.

**Part E (Vaso Sumo flavor migration)**:
- `MenuDrinkSection.vue`: deleted the hardcoded `vasoSumoFlavors` array,
  `flavorOptions` computed, and `isVasoSumo()` name-matching function.
  Replaced with a generic `dish.optionGroups` loop (identical pattern to
  `MenuDishCard.vue`'s Part C rendering) — works for any drink, not
  Vaso-Sumo-specific.
- Removed `menu.vaso_sumo.flavor.*` and `menu.vaso_sumo.picker_label` keys
  from `i18n/locales/es.json` and `en.json`.
- `MenuSaucePicker.spec.ts`: updated a fixture literal that referenced the
  now-removed i18n key name (was never actually resolved through `t()` —
  inert but misleading) to a plain DB-style label (`'Sabor'`).

## Storybook

- `.storybook/preview.ts`: globally registers every component under
  `app/features/menu/components/*.vue` (bare name, mirroring the existing
  `app/components/ui/*.vue` → `Ui*` pattern) so composed menu stories
  (`MenuDishCard` → `MenuSaucePicker`, `MenuDishGrid` → `MenuDishCard`,
  `MenuDrinkSection` → `MenuDrinkCard`/`MenuSaucePicker`) resolve their real
  child components instead of silently failing to render them (Storybook has
  no equivalent of Nuxt's component auto-import).
- `MenuDishCard.stories.ts`: added `WithOptionGroups` story (Ramen XL
  fixture, 3 groups); `HighlightBackground` story updated to the renamed
  prop; removed the now-redundant per-file decorator (global registration
  covers it).
- `MenuDishGrid.stories.ts`: removed the old `RamenWithHeroShowcase` story,
  replaced with `RamenXlWithOptionGroups` (normal card + 3 pickers + a
  sibling plain dish); all fixtures updated to `highlightBackground`/
  `optionGroups`.
- `MenuDrinkSection.stories.ts`: Vaso Sumo fixture's flavor picker now
  sourced from `optionGroups` fixture data instead of relying on removed
  i18n keys; removed the now-redundant decorator.
- `MenuShell.stories.ts`/`.spec.ts`: fixtures updated (`highlightBackground`/
  `optionGroups`), no structural changes.

## Migrations

- `0030_add_menu_item_highlight_background.sql` (reclaimed slot): additive
  `ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS highlight_background
  boolean NOT NULL DEFAULT false`.
- `0031_add_menu_item_option_groups.sql`: creates `menu_item_option_groups`
  (id, `menu_item_id` FK, `key`, `name_es`/`name_en`, `display_order`,
  `is_active`, unique `(menu_item_id, key)`) and `menu_item_option_choices`
  (id, `option_group_id` FK, `name_es`/`name_en`, `price_delta decimal(8,2)`
  with a `>= 0` CHECK, `display_order`, `is_active`), plus their two indexes.
- `server/db/migrations/meta/_journal.json` updated (old `0030` entry
  replaced, new `0031` entry added).
- Both migrations hand-authored directly (no live DB in this environment to
  run `drizzle-kit generate` against) — consistent with this repo's existing
  convention: committed snapshot files (`meta/*_snapshot.json`) stop at
  `0019`; every migration from `0020` onward, including this feature's, is
  hand-written SQL matching `schema.ts`.

## Test coverage added/removed

- **Removed**: `tests/db/menu-display-variant.test.ts` (tested the scrapped
  mechanism).
- **Added**: `tests/db/menu-item-options-seed.test.ts` — `highlightBackground`
  seed-data assertions (Part D) + `DISH_OPTIONS_SEED` shape assertions for
  Ramen XL's 3 groups and Vaso Sumo's flavor group (Parts C & E), plus a
  Ramen-XL-fileName-reverted assertion.
- **Extended**: `server/utils/menu-queries.test.ts` — `highlightBackground`
  projection (true/false), `optionGroups` projection (empty, populated +
  correctly shaped/ordered, and the "group with zero active choices is
  dropped" edge case).
- **Extended**: `MenuDishCard.spec.ts` — renamed prop assertions
  (`highlightBackground`), new option-groups rendering assertions (no
  picker when empty; one `MenuSaucePicker` per group, correct label/count).
- **Extended**: `MenuDishGrid.spec.ts` — replaced the hero-dispatch describe
  block with uniform-rendering assertions (Ramen XL renders identically to
  its sibling; `highlightBackground` passthrough true/false).
- **Extended**: `MenuDrinkSection.spec.ts` — Vaso Sumo flavor picker now
  asserted via `optionGroups` fixture data (6 flavors incl. Jack Daniel's);
  added a "no option groups → no picker" case.
- **Untouched, already covering their acceptance criteria**:
  `PromotionCard.spec.ts`/`PromotionsCarousel.spec.ts` (Part A),
  `validators.test.ts` (Part A bilingual-completeness), `MenuDishCard.spec.ts`
  badge-size cases (Part B) — all verified passing, not modified.

Every acceptance scenario in `spec.md` (User Stories 1–5) has at least one
corresponding test, per the mapping above.

## Final `./init.sh` result

```
── 4. Running lint (biome) ─────────────────────────────
Checked 375 files in 51ms. No fixes applied.
[OK]    Biome check OK

── 5. Running typecheck ────────────────────────────────
[OK]    Typecheck OK

── 6. Running tests ────────────────────────────────────
 Test Files  115 passed (115)
      Tests  1002 passed (1002)
[OK]    Tests OK

── 6.5 Building Storybook ──────────────────────────────
└  Storybook build completed successfully
[OK]    Storybook build OK

── 7. Summary ──────────────────────────────────────────
[OK]    Environment ready. You can start working.
```

Exit code: 0.

## Known issues / TODOs / flagged ambiguities

- **T048 (Lighthouse spot-check) left unchecked in `tasks.md`**: no
  Lighthouse/Chrome tooling is available in this sandboxed implementer
  environment to literally run the audit against `/`, `/menu`,
  `/promotions`. The code-level reasoning for "no regression" holds (no new
  npm packages, one additional batched DB query mirroring the existing
  `querySauces`/`queryDrinkGroups` pattern), but a human/reviewer should
  spot-check this manually before considering SC-007 fully closed.
- **T047 (manual quickstart walkthrough)**: verified via automated Vitest
  component/unit coverage mirroring every quickstart assertion, not a literal
  browser/dev-server session (also unavailable in this sandbox). The DB
  editability claims (Parts C/E: "edit a choice, see it reflected with no
  code change") are demonstrated structurally by the query layer
  (`queryOptionGroupsByMenuItem` reads live rows, no hardcoded values) and by
  the seed-data tests, but were not exercised against a running Postgres
  instance in this session.
- No other ambiguities encountered — the twice-amended spec/data-model was
  unambiguous on every point the implementation touched.

## Files added / removed / changed (summary)

**Added**: `server/db/migrations/0030_add_menu_item_highlight_background.sql`,
`server/db/migrations/0031_add_menu_item_option_groups.sql`,
`server/db/seeds/menuItemOptions.ts`, `tests/db/menu-item-options-seed.test.ts`.

**Removed**: `app/features/menu/components/MenuDishHero.vue`/`.spec.ts`/
`.stories.ts`, `server/db/migrations/0030_add_menu_item_display_variant.sql`,
`tests/db/menu-display-variant.test.ts`.

**Changed**: `server/db/schema.ts`, `server/db/migrations/meta/_journal.json`,
`server/db/seed.ts`, `server/db/seeds/alaCarta.ts`,
`server/db/seeds/kidsMenu.ts`, `server/db/seeds/drinks.ts` (comment only),
`server/utils/menu-queries.ts`, `server/utils/menu-queries.test.ts`,
`types/menu.ts`, `app/features/menu/components/MenuDishCard.vue`/`.spec.ts`/
`.stories.ts`, `app/features/menu/components/MenuDishGrid.vue`/`.spec.ts`/
`.stories.ts`, `app/features/menu/components/MenuDrinkSection.vue`/`.spec.ts`/
`.stories.ts`, `app/features/menu/components/MenuSaucePicker.spec.ts`,
`app/features/menu/components/MenuShell.spec.ts`/`.stories.ts`,
`.storybook/preview.ts`, `i18n/locales/es.json`/`en.json`,
`docs/business/wordpress-endpoints.md`, `specs/027-promo-flip-menu-card-tweaks/tasks.md`.

Parts A/B files (`PromotionCard.*`, `PromotionsCarousel.*`,
`HomePromotions.*`, `validators.ts`/`.test.ts`, `types/content.ts`/
`wordpress.ts`, `app/pages/promotions.spec.ts`) are listed as modified in
`git status` from the prior implementation round — verified passing,
untouched by this session.
