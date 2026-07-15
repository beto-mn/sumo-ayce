# Research — Menu Experience Overhaul (021)

Phase 0 technical findings. All decisions verified against the current codebase
(`server/db/schema.ts`, `server/utils/menu-queries.ts`, `server/db/seeds/*`,
`app/features/menu/*`, `types/menu.ts`) and the confirmed contract in
`specs/_batch-intake/intake.md`.

---

## D1 — Curated ordered category sets: encode in presentation, not a new table

**Decision**: Model the four curated sets (AYCE·buffet 8, AYCE·carta 12, Express 8, Bebidas 6)
as a **feature-local, typed config constant** consumed by `useMenuFilters` / `MenuShell`, driving
both membership ordering and the single default category. Do NOT add a parent/set table or a
join table.

**Rationale**: The taxonomy is **fixed and code-known** (17 category keys + 6 drink groups; the
client is not expected to invent new sets). Article X (KISS) forbids schema for anticipated-only
future flexibility. Category set *membership* already emerges from existing data (see D2); only the
**ordering** and **single-default** are new, and both are pure presentation concerns.

**Alternatives considered**:
- New `menu_sets` + `menu_set_categories` tables — rejected: adds a migration, two tables, and a
  query join for a taxonomy that never changes at runtime. Over-engineering per Article X.
- Reusing `menu_categories.displayOrder` alone — rejected: a single global order cannot express
  per-set ordering where the same category appears in different positions across sets, nor the
  asymmetries (Sándwiches buffet-only).

---

## D2 — Category set membership already falls out of existing columns (VERIFIED)

**Finding (verified against seeds + the live query path)**: The buffet/carta/express category
sets map exactly onto existing `menu_items` columns — **no item recategorization is required**:

- **AYCE · All You Can Eat (buffet)** = `includedInAyce = true` AND `locationType IN ('ayce','both')`
  → categories present: appetizers, burgers, **sandwiches**, hot_dogs, cold_rolls, hot_rolls,
  sweet_rolls, wings (the 8-category buffet set — includes Sándwiches).
- **AYCE · Carta** = `includedInAyce = false` AND `locationType IN ('ayce','both')` (seeded by
  `alaCarta.ts` + `desserts.ts` + `kidsMenu.ts`) → appetizers, salads, rice, ramen, burgers,
  hot_dogs, cold_rolls, hot_rolls, sweet_rolls, desserts, wings, kids (12; NO sandwiches, NO
  burritos).
- **Express** = `locationType IN ('express','both')` → appetizers, burgers, **burritos**, hot_dogs,
  cold_rolls, hot_rolls, sweet_rolls, wings (8; includes Burritos, excludes Sándwiches).

The three intentional asymmetries (Sándwiches AYCE-buffet-only, Burritos Express-only, Carta has
neither) therefore fall out **automatically** from `locationType` + `includedInAyce` — the curated
config only needs to fix **order** and pick the **default** category.

**`locationType = 'both'` items**: drinks and shared items marked `'both'` pass through every
location scope (see `locationScope()` `inArray(locationType, [requested, 'both'])`) and, in
`ayceModalityFilter`, drinks (`'both'`) bypass the modality filter so they always appear. The
curated food sets do not include the `drinks` category (drinks are the separate Bebidas selection),
so `both` food items (if any) must be confirmed to land in the correct set during seed review.

---

## D3 — The live modality filter ALREADY exists (coordinator claim corrected)

**Finding (VERIFIED)**: The production API (`server/api/v1/menu/index.get.ts`) imports
`getFullMenu` from **`server/utils/menu-queries.ts`**, which **already filters by modality** via
`ayceModalityFilter` (lines 247–256): AYCE buffet → `includedInAyce = true`; AYCE carta →
`includedInAyce = false`; Express → no modality filter; drinks (`locationType='both'`) always pass.
So buffet and carta already return **different** item sets in the live path. **No new modality
filter needs to be added.**

**Divergence to flag (real finding)**: A second, orphaned module `server/db/queries/menu.ts`
(imported **only** by `tests/db/menu-queries.test.ts`) filters by location **but not** by modality
(`buildLocationFilter` only). This is a duplicate of the live query logic and violates Article I
(DRY — two query implementations) and Article VIII (dead/duplicate code). **Recommendation
(in tasks)**: consolidate the test onto `server/utils/menu-queries.ts` and delete
`server/db/queries/menu.ts`, or explicitly justify keeping it. The coordinator's "no modality
filter" observation came from this orphaned file, not the live path.

---

## D4 — Destilados split: seed + TS union, plus ONE additive column for group order

**Decision**: Add a new `destilados` drink group (seed INSERT into `drink_group`), re-map spirit
items' `menu_items.drink_group_id` from `beers_spirits` to `destilados` (seed UPDATE), and extend
the `DrinkGroup` TS union in `types/menu.ts` with `'destilados'`. Rename the remaining group's
intent to "Cervezas" (beers) while keeping/adjusting its `groupKey`. Add a single **additive**
column `drink_group.display_order integer NOT NULL DEFAULT 0` (migration) to order the 6 groups
deterministically, backfilled by seed.

**Rationale**: `drink_group.groupKey` is free-text `varchar(60)`, not a Postgres enum → no enum
DDL needed for a new group. But the table has **no ordering column** and the query orders only by
category/item `displayOrder`; once Destilados is its own button the 6-group order (Coctelería Jumbo
→ … → Café y Digestivos) is load-bearing and must be data-driven (Article X: the client reorders
content without a deploy). One nullable-safe integer column is the minimal DDL.

**Alternatives considered**:
- Hard-coded group-order array in the composable — rejected: encodes content ordering in code
  (Article X prefers data for content the client will edit); still workable but less future-proof.
- Converting `groupKey` to an enum — rejected: unnecessary DDL churn; free-text is fine.

---

## D5 — 2x1 promo note once for Destilados

**Decision**: Move the "2x1 / Combo Mezcladores $189" text from per-spirit `drink_sub_group.promoEs/En`
onto the group-level `drink_group.promoEs/En` (columns already exist on `drink_group`); null the
per-sub-group promo/subtitle on the spirit sub-groups. `MenuDrinkSection` renders the group-level
promo once above the Destilados sub-groups.

**Rationale**: Group-level columns already exist (used today by `beers_spirits`). Moving the note
up one level renders it once, satisfying FR-015 with a seed change only.

---

## D6 — Vaso Sumo consolidation via reused sauce-picker interaction

**Decision**: Keep **one** canonical "Vaso Sumo" `menu_items` row ($159, `sumo_cup.webp`);
deactivate/remove the other four (Ron/Tequila/Vodka/Whisky/New Mix). Flavours are a **bounded,
code-known list** surfaced with the **existing `MenuSaucePicker` component parameterized** (props
for the option list + labels), not a new component.

**Rationale**: All five share price + image; only the flavour name differs. No per-flavour data
needs structured storage → no new table (Article X). Reusing `MenuSaucePicker` satisfies Article I
DRY (single-active selection is the same interaction). Parameterize it to accept a generic option
list so it serves both sauces and flavours.

**Alternatives considered**:
- New `menu_item_flavors` table — rejected: flavours carry no distinct price/image; a lookup list
  is enough.
- New `MenuFlavorPicker.vue` component — rejected: >60% markup overlap with `MenuSaucePicker`
  (Article I forces a merge/parameterization).

---

## D7 — Default single category + no "show all"

**Decision**: Change `useMenuFilters` so `activeCategory` defaults to the **first category of the
active curated set** (AYCE·buffet → `appetizers`; Bebidas → `jumbo_cocktails`) instead of `null`.
Remove the "activeCategory === null → show everything" branch in `MenuShell`; always render exactly
one active category/group. On primary/modality switch, reset to the new set's first category. Keep
URL sync; resolve an out-of-set `?category=` to the set default.

**Rationale**: FR-010/011/012/013. The current `null → all` behaviour is explicitly what the client
wants removed. URL sharing stays intact by validating the incoming category against the active set.

---

## D8 — Hover-zoom respecting hover-capable devices

**Decision**: Apply a transform-scale zoom on `MenuDishCard` image on hover using Tailwind's
`hover:` utilities under the `@media (hover: hover)` gate (Tailwind `hoverOnlyWhenSupported`
future-flag / v4 default), plus `motion-reduce:` to disable under `prefers-reduced-motion`.
Transform-only (no layout/opacity animation) per the design context and Lighthouse budget.

**Rationale**: FR-022 + Article VII (`prefers-reduced-motion`) + Article V (transform is
GPU-cheap, no LCP/CLS impact). `hover: hover` ensures touch-only devices never get a stuck hover.

**Verification**: Confirm `hoverOnlyWhenSupported` is enabled (Tailwind config) or that the
installed Tailwind version gates `hover:` behind `@media (hover: hover)` by default; if not,
enable the flag in `tailwind.config`.

---

## D9 — Half-width no-image drink cards

**Decision**: In `MenuDrinkSection`, drink cards **without** an image get a half-width grid span so
a no-image card is half of an image card → 6 per desktop row where image cards are 3 per row.
Implement with a responsive CSS grid (e.g. a 6-column desktop track; image card spans 2, no-image
card spans 1) so mixed rows pack correctly; collapse to fewer columns at 880/520 mobile-first.

**Rationale**: FR-024. A 6-track grid with span-2 (image) / span-1 (no-image) is the simplest way
to express "half width" that also handles mixed rows and trailing single cards (edge case) without
stretching.

---

## D10 — Garantías Sumo featured 11

**Decision**: Seed UPDATE — set `featured = true` + a sequential `displayOrder` on exactly the 11
named rows (Burger del Barrio, Papas Smash, Mac & Cheese, Smash Dog, Bora Bora, Coco Roll, Canela
Roll, Kushiage de Queso, Ramen XL, Tostiburger, Sumo Fries) and clear `featured` on any other row.
`getFeaturedDishes()` already selects `featured=true AND isActive=true` ordered by `displayOrder` —
no query change.

**Rationale**: FR-020. Column + query already exist (feature 016/010). Verify exact name matches in
the seeds ("Burger del Barrio", not "de barrio") before writing.

---

## D11 — "Carta" / "Menu" modality label

**Decision**: Change i18n values: `menu.modality.carta` = `"Carta"` (es) / `"Menu"` (en);
`menu.modality.buffet` stays `"All You Can Eat"` (both). Value-only change; the `MenuModalityToggle`
key reference is unchanged.

**Rationale**: FR-023. Pure i18n value edit at ES↔EN parity.

---

## Summary of resolved unknowns

| Unknown | Resolution |
|---|---|
| Migration needed? | YES — one additive `drink_group.display_order` column; everything else seed/i18n/component |
| Curated sets storage | Feature-local typed config (no table) |
| Set membership | Already derivable from `includedInAyce` + `locationType` (no recategorization) |
| Modality filter | Already live in `server/utils/menu-queries.ts` (no new filter) |
| Orphaned query module | `server/db/queries/menu.ts` is test-only + stale — consolidate/delete (task) |
| Flavour selector | Reuse parameterized `MenuSaucePicker` (no new component) |
| Hover-zoom | Tailwind `hover:` under `@media (hover:hover)` + `motion-reduce` |
| Half-width cards | 6-track grid, span-2 image / span-1 no-image |
