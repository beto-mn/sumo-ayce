# Implementation Plan: Sauce Heat Thermometer Graphic + Sitewide Watermark Asset Refresh

**Branch**: `feat/028-sauce-thermometer-watermark-refresh` | **Date**: 2026-07-17 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `specs/028-sauce-thermometer-watermark-refresh/spec.md`
**AMENDED 2026-07-17**: Part B's sauce-selection half is reversed — see "Revision 2026-07-17" below. This plan section still describes the original `df3a13c` implementation for historical/audit context; the amendment section that follows it is authoritative for what ships next.
**AMENDED 2026-07-18**: A further small addition, Part C (Wings/Boneless instructional note), is layered on top of the already-reversed/shipped state — see "AMENDMENT 2026-07-18" below.
**AMENDED 2026-07-18 (Part D)**: A follow-up CSS-only fix to Part C's own note box (client found it too wide for short text) — see "AMENDMENT 2026-07-18 — Part D" below.

## Summary

Two independent client-requested changes. **Part A**: swap the sitewide
repeating watermark artwork (`tailwind.config.ts` `backgroundImage.watermark`
→ `public/patterns/sumo-watermark.webp`) for a new client-supplied tile,
preserving the existing opacity/legibility baseline and the existing
single-wrapper, two-CSS-background-layers architecture from feature 024 — an
explicit `background-size` is added because the new tile's native resolution
(781×1056) is ~2.6x larger than the current tile (300×405) despite an
almost-identical aspect ratio, which would otherwise double the perceived
tile density on screen. **Part B** *(original implementation, since reversed
— see amendment)*: wings/boneless sauce selection was wired, for the first
time, through the existing generic dish option-groups mechanism
(`menu_item_option_groups`/`menu_item_option_choices`, the same tables already
powering Ramen XL and Vaso Sumo) — new seed rows sourced each Wings/Boneless
dish's sauce choices from the existing `sauces` table, one group per dish.
`MenuSaucePicker.vue` gained an additive, backward-compatible bounded
multi-select mode (`maxSelections > 1`) for the 2- and 3-sauce À la Carta
packages, while AYCE/Express single-sauce dishes kept the existing
single-active behavior unchanged (`maxSelections` defaults to 1). A new sauce
heat thermometer graphic (a single swappable image reference) was rendered
once per "Alitas & Boneless" category section, reusing the existing category
`note` rendering precedent rather than a new per-dish element.

## AMENDMENT 2026-07-17 — Part B sauce-selection reversal (interactive picker + `sauces` table SCRAPPED)

**What stays exactly as shipped in `df3a13c`**: Part A (watermark) in its
entirety; the thermometer graphic (`public/menu/thermometer/sauce-heat-thermometer.webp`,
its section-level mount in `MenuDishGrid.vue` gated on `category.key === 'wings'`,
its `i18n` alt text) — this is a static `<img>` with zero dependency on the
`sauces` table or any option-groups data, so it requires no code change at all.

**What is reverted (not re-designed — this is undoing a diff, per spec.md
FR-014 through FR-019)**:

1. **Wings/Boneless option-group seed rows** (`server/db/seeds/menuItemOptions.ts`):
   remove `SAUCE_CHOICES`, `SINGLE_SAUCE_GROUP`, `multiSauceGroup()`, the 8
   `DISH_OPTIONS_SEED` entries for Alitas/Boneless (AYCE, Express, and the 4
   À la Carta packages), the `SAUCES` import, and the `locationType` disambiguation
   plumbing (`idByNameAndLocation`, `resolveMenuItemId`) that exists ONLY to
   resolve the AYCE/Express Alitas/Boneless name collision — none of which is
   needed once those seed rows are gone. Ramen XL and Vaso Sumo entries and
   their `maxSelections: 1` fields are untouched (see maxSelections decision below).
2. **The `sauces` table** (`server/db/schema.ts`): a new additive-only migration
   `DROP TABLE sauces` (migration 0016 is NOT edited). `server/db/seeds/sauces.ts`
   is deleted; `server/db/seed.ts` drops the `seedSauces` import/call.
3. **`querySauces()` + `FullMenuResult.sauces`** (`server/utils/menu-queries.ts`,
   `types/menu.ts`): removed entirely — `getFullMenu()`/`emptyMenuResult()` no
   longer populate a `sauces` field. `FullMenuSauce` interface removed from
   `types/menu.ts`.
4. **The dormant `requiresSauce` field**: `menu_items.requires_sauce` column
   (`server/db/schema.ts`) dropped in the SAME migration as the `sauces` table
   (both are part of the same cleanup, no reason for two migrations);
   `FullMenuDish.requiresSauce` removed from `types/menu.ts`; every seed file
   reference removed (`ayceMenu.ts`, `expressMenu.ts`, `alaCarta.ts`,
   `kidsMenu.ts`, `desserts.ts`, `drinks.ts`); every test/story mock reference
   removed.
5. **`maxSelections` — DECIDED: also removed** (spec.md Clarifications, Session
   2026-07-17 Revision). Per Article X (KISS — no abstraction without a
   concrete second use case), since its only non-default (>1) consumer is the
   Wings/Boneless multi-select being removed in this same pass, the column,
   the `MenuSaucePicker.vue` prop, and its projection in
   `menu-queries.ts`/`types/menu.ts` all revert to their pre-`df3a13c` shape
   (i.e., absent entirely — not just defaulted to 1). This is itself an
   additive-only migration (a new migration that drops the column), consistent
   with the project's migration convention.
6. **`MenuDishCard.vue`**: no direct edit needed for the Wings/Boneless removal
   itself — `dish.optionGroups` for Alitas/Boneless simply becomes `[]` again
   once the seed rows are gone, and the existing `v-for` loop already handles
   the empty case correctly (this is exactly how Ramen XL/Vaso Sumo pickers
   keep working — the loop is generic, not Wings/Boneless-specific). The
   `:max-selections="group.maxSelections"` binding is removed as part of
   reverting `maxSelections` (point 5).
7. **Test/story cleanup**: `tests/db/menu-item-options-seed.test.ts` loses its
   "Wings/Boneless sauce selection (feature 028)" describe block (lines ~124-204)
   and its now-unused `SAUCES` import, while its feature-027 Ramen XL/Vaso Sumo
   blocks (including the "every existing group has maxSelections=1" assertion,
   itself reverted per point 5) are updated to match the reverted shape.
   `server/utils/menu-queries.test.ts` loses its `sauces`/`querySauces`
   assertions and its `maxSelections` assertions. `MenuSaucePicker.spec.ts`/
   `.stories.ts` lose their multi-select test cases/story. `MenuDishGrid.spec.ts`/
   `.stories.ts` keep their thermometer assertions (unaffected) but lose any
   Wings/Boneless-picker-specific assertions. Every `requiresSauce: false` mock
   value across `*.spec.ts`/`*.stories.ts` files is removed along with the field.

## AMENDMENT 2026-07-18 — Part C addition (Wings/Boneless instructional note)

**What this is**: A further, small in-place amendment layered on top of the
already-shipped, reviewer-approved Parts A/B (revised) state — NOT a new
implementation round for Parts A/B, which are untouched. The feature was
`done`, then reopened to `pending` by the leader specifically for this
addition, since it builds on Part B's own thermometer graphic.

**Scope**: Add `noteEs: 'Escoge tu salsa favorita'` and
`noteEn: 'Choose your favorite sauce'` to the `wings` ("Alitas & Boneless")
entry in `CATEGORIES` (`server/db/seeds/menuCategories.ts`), exactly mirroring
the existing `kids` category's `noteEs`/`noteEn` fields already in the same
file. Re-run `seedMenuCategories()` (via the existing seed script) to upsert
the change into Neon. No schema change (the `noteEs`/`noteEn` columns already
exist, `server/db/schema.ts` lines ~263-266), no new component, no change to
`MenuDishGrid.vue`'s rendering logic — `categoryNote()` and the
`category-note` block already render any non-null `category.note` for any
category, including `wings`, with zero code change required.

**Verified before relying on it**: Re-confirmed against the CURRENT (post
Part-B-reversal, post feature-023 loading-skeleton) state of
`app/features/menu/components/MenuDishGrid.vue` that the render order is still
`<h2>` title → `category-note` block → `wings`-gated thermometer `<img>` →
dish grid. This order already reads correctly as "instruction before visual
guide" for the new wings note, so **no layout change is needed** — this
amendment is a pure seed-data addition plus its test/verification tasks.

**Test impact**: `tests/db/menu-seeds.test.ts` has an existing assertion
`'leaves every non-kids category without a note'` that loops over every
non-`kids` category asserting `noteEs`/`noteEn` are both null — this WILL fail
once `wings` gets a note and MUST be updated (excluding `wings` from that loop
and adding a dedicated assertion for the wings note, mirroring the existing
`'carries the Kids inclusion note (bilingual) on the kids category'` test).
`app/features/menu/components/MenuDishGrid.spec.ts`'s `wings` category fixture
currently hardcodes `note: null` for its "empty state"/thermometer tests
(unrelated to the note itself) — those are unaffected since fixtures are
independent of the real seed data, but a new spec case should be added
asserting the note renders above the thermometer image when
`category.note` is present on a `wings`-keyed category (extending the existing
"renders the category note at the TOP of the section when present" pattern,
already proven against `kids`, to also cover the `wings` + thermometer
combination specifically).

**Constitution re-check (Part C)**:

| Article | Rule | Status |
|---------|------|--------|
| I — Reusability | Reuses the existing `noteEs`/`noteEn` columns, `seedMenuCategories()` upsert, and `categoryNote()`/`category-note` rendering slot verbatim — zero new abstraction. | ✅ Pass |
| IV — Testing | Existing `menu-seeds.test.ts` assertion updated to reflect the new non-null wings note; a new `MenuDishGrid.spec.ts` case added for the wings-note-above-thermometer render order. | ✅ Pass |
| VIII — Clean Code Discipline | No dead code introduced; no unused fields. | ✅ Pass |
| X — KISS | No new schema/component/mechanism — the smallest possible change (two string values) using infrastructure already proven for an identical use case (`kids`). | ✅ Pass |

No new Complexity Tracking entries.

## AMENDMENT 2026-07-18 — Part D (category note box content-width fix)

**What this is**: A small, purely cosmetic, CSS-only follow-up to Part C, layered on top of the already-shipped Part C state. No schema, component, or layout-structure change — the note box's DOM position (below the `<h2>`, above the thermometer `<img>`, per FR-021) is unaffected.

**Root cause**: `MenuDishGrid.vue`'s `category-note` block (~lines 47-53) is a block-level `<div>` with no width-constraining class in its class list (`mb-6 rounded-pop border-pop border-ink bg-yellow px-4 py-3 font-disp font-extrabold text-kicker shadow-pop-sm`). A block-level element with no width class stretches to 100% of its parent's content width by default — this reads correctly for the "kids" category's long inclusions paragraph (which naturally approaches that width from its own text length) but produces an oversized, mostly-empty pill for Part C's short "Escoge tu salsa favorita" text.

**Fix**: Add `w-fit max-w-full` to the existing class list (append, do not remove any existing class).

- `w-fit` → Tailwind's utility for CSS `width: fit-content`. `fit-content` is a standards-defined sizing keyword computed as `min(max-content, max(min-content, available-space))` — for ordinary space-separated text (both note strings today), this already cannot exceed the parent's available width, so the box hugs short text tightly and still wraps/fills for long text exactly as a block-level `w-full` div would. Confirmed against Tailwind 3.4 (this project's installed version, `package.json`) — no version-specific behavior change affects this utility.
- `max-w-full` → added defensively alongside `w-fit`, capping the box at 100% of its parent's width no matter what. This has zero effect on either of today's two note strings (neither would ever hit this cap given `fit-content`'s own behavior) but is a free guarantee against a theoretical future edge case (e.g., a single unbreakable long token) and against any narrow-mobile-viewport regression risk — consistent with the client's Part D ask to "never look wrong," at no cost to the two cases that matter today.

**Why this is not a genuine ambiguity requiring `/speckit.clarify`**: The two candidate approaches (`w-fit` alone vs. `w-fit` + `max-w-full`) were resolved by CSS/Tailwind semantics, not by a judgment call the client would need to weigh in on — `max-w-full` is strictly additive safety with no behavioral trade-off for either existing note.

**No regression risk to existing tests**: `MenuDishGrid.spec.ts`/`.stories.ts` were checked (see spec.md Revision 2026-07-18 — Part D) — no existing test asserts a width-related class on `category-note`; the only existing width assertion in the file targets the unrelated `wings-thermometer` image. A new test is added instead (see tasks.md Phase 9).

**Constitution re-check (Part D)**:

| Article | Rule | Status |
|---------|------|--------|
| I — Reusability | No new component/abstraction — a class-list change on the existing `category-note` block only. | ✅ Pass |
| IV — Testing | New Vitest assertion added pinning the box's class list (contains `w-fit`, does not contain a full-width-forcing class); Storybook stories updated with a note documenting the visual check for both the short (wings) and long (kids) cases. | ✅ Pass |
| VII — UX Consistency | No visual property besides width sizing changes (color/border/shadow/font untouched); mobile-first behavior preserved (kids note still wraps/reads correctly at 360px). | ✅ Pass |
| VIII — Clean Code Discipline | No dead code; single-line class-list edit. | ✅ Pass |
| X — KISS | Smallest possible fix — a standard Tailwind width utility, no new custom CSS, no new prop/conditional logic. | ✅ Pass |

No new Complexity Tracking entries.

## Technical Context

> **⚠️ Amendment note**: The subsections below (Technical Context, Constitution
> Check, Project Structure) describe the ORIGINAL `df3a13c` implementation for
> audit-trail purposes. For what actually ships next, see "AMENDMENT 2026-07-17"
> above and `tasks.md`'s "Phase: Part B Reversal" — a revert, not a rebuild.

**Language/Version**: TypeScript 5.x (strict), Vue 3 Composition API, Node 20 (Vercel runtime)
**Primary Dependencies**: Nuxt 4, Tailwind CSS (design tokens in `tailwind.config.ts`), Drizzle ORM. No new npm packages.
**Storage**: Neon PostgreSQL — one additive column (`menu_item_option_groups.max_selections`, integer, default 1) and new seed rows in the existing `menu_item_option_groups`/`menu_item_option_choices` tables (no new tables, no changes to the `sauces` table schema).
**Testing**: Vitest (co-located `*.spec.ts`) + Storybook stories (`*.stories.ts`) per Article VII
**Target Platform**: Vercel edge/serverless (Nitro), rendered client in evergreen browsers
**Project Type**: Web application (Nuxt 4 frontend + server routes, single repo)
**Performance Goals**: No Lighthouse regression on `/menu` (Article V). Both new image assets (watermark tile, thermometer graphic) MUST be optimized `webp` and lazy-loaded where off the critical viewport; the thermometer graphic is decorative/informational and loads with `loading="lazy" decoding="async"` like every other dish/section image in the menu feature.
**Constraints**: No new npm packages (Article X KISS). No new Vue component for the sauce picker — `MenuSaucePicker.vue` is extended, not duplicated (Article I DRY). No changes to the `sauces` table schema (spice levels already correct). No changes to Ramen XL / Vaso Sumo option groups. The thermometer graphic reference MUST be a single swappable path with no hardcoded crop/positioning around the current placeholder's blank left gutter. The dormant `menu_items.requiresSauce` boolean and `FullMenuResult.sauces` catalog fields are explicitly NOT wired by this feature (Clarifications session 2026-07-17) — they remain unused; removing them is out of scope too (no unrelated cleanup).
**Scale/Scope**: Touches 1 Tailwind config file + 1 new/replaced public asset (Part A); 1 schema migration, 1 new seed module (wings/boneless option groups sourced from `sauces`), 1 extended query file (`menu-queries.ts`), 1 extended component (`MenuSaucePicker.vue`) + its spec/stories, 1 category-section-level UI addition (thermometer graphic) in the menu feature's section/category component, 1 new public asset (Part B).

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-checked after Phase 1 design.*

| Article | Rule | Status |
|---------|------|--------|
| I — Code Organization & Reusability | Part B reuses the existing generic option-groups mechanism and `MenuSaucePicker.vue` unmodified in architecture (extended via an additive optional prop, not duplicated) — directly satisfies the DRY mandate instead of building a second, parallel sauce-selection pathway from the dormant `requiresSauce`/`sauces` fields (Clarifications Q1). The thermometer graphic reuses the existing category-`note` rendering slot rather than introducing a new per-dish element. | ✅ Pass |
| II — TypeScript & Framework Standards | All new fields (`maxSelections: number`, thermometer asset path) are typed, no `any`. Composition API only, no Options API. | ✅ Pass |
| III — Architecture | Both parts are Neon/static-asset only — no WordPress involvement, no bypass of Neon for menu data. Single Nuxt 4 repo, one deploy. | ✅ Pass |
| IV — Testing | New Vitest cases for `MenuSaucePicker.vue`'s multi-select mode (bounded selection, max-reached guard), `menu-queries.test.ts` cases for the new `maxSelections` projection, and the new wings/boneless seed wiring. Tests written before the corresponding implementation per Article IV. | ✅ Pass (tracked in tasks.md) |
| V — Performance | No new routes; `/menu` keeps its existing `isr: 3600` rule (rendering-strategy.md unchanged). Both new images are optimized `webp`, lazy-loaded, and the option-groups query for wings/boneless reuses the existing batched (`queryOptionGroupsByMenuItem`) query — no N+1 added. | ✅ Pass |
| VI — Security | No new public endpoint; the existing `/api/v1/menu` response gains purely additive, read-only fields. No user input is newly accepted server-side (sauce/multi-sauce selection state is client-only UI state, not persisted). | ✅ Pass |
| VII — UX Consistency & Component Docs | `MenuSaucePicker.vue` gains a `MultiSelect` Storybook story (mobile + desktop) alongside its existing `Default`/spice-sorted stories. Mobile-first preserved; the thermometer graphic is sized to remain legible without pushing the picker below the fold on 360px viewports (spec Edge Cases). | ✅ Pass |
| VIII — Clean Code Discipline | `MenuSaucePicker.vue` stays under 200 lines after the additive change (small, focused `maxSelections` branch, no new file). Seed module follows the existing small-function style of `menuItemOptions.ts`. | ✅ Pass |
| IX — Quality Gates | No change to Biome/Husky/commitlint config. Standard gates apply. | ✅ Pass |
| X — KISS | No new npm package. No new abstraction layer built for the dormant `requiresSauce`/`sauces` fields — they are left untouched and unused rather than wiring a second mechanism (Clarifications Q1). Multi-select is modeled as a single additive `maxSelections` integer on the existing group table (default 1 = today's single-select behavior), not a new "selection mode" enum or a parallel table. | ✅ Pass |
| XI — Absolute Imports | All new imports use `@/` aliases. | ✅ Pass |
| XII — Error Handling | Option-groups queries keep the existing graceful-degradation pattern (`optionGroups: []` on transient failure) already used by `querySauces`/`queryDrinkGroups` — unaffected by this feature's additive column. | ✅ Pass |
| XIII — Environment Validation | No new env vars. | ✅ Pass |

**Post-design re-check**: Confirmed after Phase 1 — the additive
`max_selections` column and new seed rows introduce no new constitution
violation. No entries needed in Complexity Tracking.

## Project Structure

### Documentation (this feature)

```text
specs/028-sauce-thermometer-watermark-refresh/
├── plan.md              ← this file
├── spec.md              ← feature spec
├── research.md           ← Phase 0 output
├── data-model.md         ← Phase 1 output
├── quickstart.md         ← Phase 1 output
├── assets/source/
│   ├── Fondo web bien.webp             ← new watermark tile (Part A)
│   └── Termometro salsas new.webp      ← reference thermometer graphic (Part B, acknowledged WIP placeholder)
├── checklists/requirements.md
└── tasks.md              ← Phase 2 output (/speckit.tasks)
```

No `contracts/` directory: the one server route touched (`/api/v1/menu`)
gains a purely **additive** response field (`optionGroups[].maxSelections`)
with no shape removal or breaking change — documented directly in
`data-model.md`, mirroring the precedent set in feature 027.

### Source Code (repository root)

```text
tailwind.config.ts                                  ← Part A: `backgroundImage.watermark` points at the new tile; add explicit background-size to preserve on-screen tile density
public/patterns/sumo-watermark.webp                 ← Part A: REPLACED with the new artwork (optimized webp, re-baked opacity if the new source isn't already pre-blended)
app/layouts/default.vue                              ← unchanged (architecture/opacity mechanism from feature 024 preserved, FR-004)
app/layouts/default.spec.ts                          ← unchanged (existing contract still holds — no new classes/mechanism)

server/
  db/
    schema.ts                                        ← ADD `maxSelections` integer column (default 1) to `menuItemOptionGroups`
    migrations/
      0032_add_menu_item_option_group_max_selections.sql   ← NEW additive migration
    seeds/
      menuItemOptions.ts                              ← EXTEND `DISH_OPTIONS_SEED` with wings/boneless entries sourced from `sauces` table rows (one option group per dish, `maxSelections` per dish: 1 for AYCE/Express wings, 2 or 3 for the relevant À la Carta packages)
      menuCategories.ts                                ← Part C (2026-07-18): ADD `noteEs`/`noteEn` to the `wings` entry in `CATEGORIES`
  utils/
    menu-queries.ts                                   ← `queryOptionGroupsByMenuItem` projects the new `maxSelections` column onto `DishOptionGroup`
    menu-queries.test.ts                               ← ADD assertions for `maxSelections` projection (default 1, and > 1 for a multi-sauce group)

types/
  menu.ts                                             ← `DishOptionGroup` gains `maxSelections: number`

app/features/menu/
  components/
    MenuSaucePicker.vue                               ← EXTEND: additive `maxSelections` prop (default 1 preserves existing single-active behavior); when > 1, selection becomes a bounded `Set` instead of a single id, with a disabled/no-op guard once the limit is reached (FR-010)
    MenuSaucePicker.spec.ts                            ← ADD cases for multi-select mode (select up to the limit, extra selection is a no-op, deselecting frees a slot)
    MenuSaucePicker.stories.ts                          ← ADD a `MultiSelect` story (mobile + desktop viewports)
    MenuDishCard.vue                                    ← passes `group.maxSelections` through to `MenuSaucePicker` (existing rendering loop, no new logic)
    MenuDishGrid.vue                                    ← renders the new thermometer graphic once per "wings" ("Alitas & Boneless") category section, next to the existing `category-note`-style single mount point inside the `v-for="category in categories"` loop; NOT rendered per-dish. Part D (2026-07-18): `category-note` block's class list gains `w-fit max-w-full`.
    MenuDishGrid.spec.ts / .stories.ts                  ← extended for the `wings`-category thermometer mount; Part C (2026-07-18) adds a case for the wings note rendering above the thermometer; Part D (2026-07-18) adds a class-list assertion + story-level visual-check notes for both the short (wings) and long (kids) note cases

public/
  menu/thermometer/sauce-heat-thermometer.webp        ← Part B: new asset (optimized webp; copied from the client's placeholder reference for now, single swappable path per FR-012)

specs/028-sauce-thermometer-watermark-refresh/assets/source/
  Fondo web bien.webp                                  ← client-supplied source (already present)
  Termometro salsas new.webp                           ← client-supplied source (already present, acknowledged WIP placeholder)
```

**Structure Decision**: Single Nuxt 4 repo (Article III). Part A stays purely
in config + static asset (no component/logic change — `app/layouts/default.vue`
and its architecture are untouched). Part B stays within `server/db/`,
`server/utils/menu-queries.ts`, `types/menu.ts`, and
`app/features/menu/components/` per Article I's folder boundaries — no
cross-feature imports, and the only "new" UI surface is an additive prop on
an existing component (`MenuSaucePicker.vue`) plus a decorative image mount at
the existing category-section level. No new server route is added.

## Complexity Tracking

> No constitution violations — table not needed.

## Constitution Re-Check — Amendment 2026-07-17

| Article | Rule | Status |
|---------|------|--------|
| I — Code Organization & Reusability | The revert touches only files within the `menu` feature's existing folders (`server/db/`, `server/utils/`, `types/`, `app/features/menu/`) — no new folders, no cross-feature imports. Removing `maxSelections` eliminates infrastructure with no concrete second consumer, per the reusability rule's own "abstract only when a concrete second use case exists" test. | ✅ Pass |
| VIII — Clean Code Discipline | Directly enforces "dead code MUST NOT exist in the main branch" — the entire point of this amendment is removing dead/unwanted code (`sauces` table, `requiresSauce`, `maxSelections`) rather than leaving it in place unused. | ✅ Pass |
| X — KISS | The `maxSelections` disposition (spec.md Clarifications) is a direct application of this article: no abstraction is kept without a concrete second use case. | ✅ Pass |
| III — Architecture | The removal migration follows the additive-only convention (a NEW migration that DROPs the table/column; migration 0016 is not edited). | ✅ Pass |
| IV — Testing | Existing tests for the removed surface (Wings/Boneless option-group seed assertions, `sauces`/`querySauces` assertions, `maxSelections` assertions) are removed or updated to match the reverted shape — no orphaned tests asserting removed behavior are left in the suite. | ✅ Pass |

No new Complexity Tracking entries — this amendment is a pure reduction in surface area.
