# Data Model — Menu Experience Overhaul (021)

> **Reconciled to delivered scope on 2026-07-14.** The feature shipped THREE additive migrations
> (not one), moved category/drink-group labels into the DB, and added a Kids category note. This
> document has been updated to describe what was actually delivered.

Describes the entities touched, the THREE additive schema changes, the seed-level
transformations, and the presentation-layer curated-set model. Verified against
`server/db/schema.ts`, `server/utils/menu-queries.ts`, `server/db/seeds/*`, and
`types/menu.ts`.

---

## 1. Schema changes (three additive migrations)

All three were hand-written additive migrations, applied to production Neon (no Docker) and
re-seeded.

### `0027_add_drink_group_display_order.sql` — `drink_group.display_order`

| Column | Type | Change | Notes |
|---|---|---|---|
| `display_order` | `integer NOT NULL DEFAULT 0` | **NEW** | Orders the 6 drink-group buttons deterministically. Backfilled by seed (0..5). |

### `0028_add_drink_group_name.sql` — `drink_group.name_es` / `name_en`

| Column | Type | Change | Notes |
|---|---|---|---|
| `name_es` | `text` (nullable) | **NEW** | DB-driven Bebidas chip + section heading label (ES). Single source of truth — replaces i18n `menu.drink_group.*`. |
| `name_en` | `text` (nullable) | **NEW** | Same, EN. |

### `0029_add_menu_category_note.sql` — `menu_categories.note_es` / `note_en`

| Column | Type | Change | Notes |
|---|---|---|---|
| `note_es` | `text` (nullable) | **NEW** | Per-category section note rendered at the TOP of the section (the Kids "Combo incluye…" box). Backfilled only for `kids`. |
| `note_en` | `text` (nullable) | **NEW** | Same, EN. |

Everything else below is **seed / type / component** — no further DDL. Note that
`menu_categories.name_es/en` (used as the DB-driven food category labels) already existed and did
not require a migration.

---

## 2. Entities touched

### Menu category (`menu_categories`) — schema (0029 note) + seed

17 fixed keys. Curated **ordering** is expressed in the presentation config; the DB `name_es/en`
are the single source of truth for chip labels (the `sweet_rolls` label is "Sushi Dulce"). The
`kids` row carries `note_es/en` (the combo inclusion text: "Incluye papas… refresco… sushi kids…
yakimeshi").

### Menu item (`menu_items`) — seed changes only

| Field | Change |
|---|---|
| `featured` | Set `true` on the 11 Garantías Sumo dishes across ALL of their location/modality rows (so the star shows in every view); `false` on all others (incl. legacy Kid Burger, Sumo Bites). |
| `displayOrder` | Sequential `featuredOrder` on the 11 featured dishes (0..10); Café/Digestivos items reordered so image-having items (carajillos) sort before text-only items. |
| `drinkGroupId` | Spirit items re-mapped from `beers_spirits` → new `destilados`; beer items → renamed `beers`; former `non_alcoholic` items → `sodas`. |
| `requiresSauce` | Set `false` on Alitas & Boneless (wings) items — removes the sauce picker there. |
| (Vaso Sumo rows) | Consolidated to 1 canonical "Vaso Sumo" row (`sumo_cup.webp`); the six bases (Ron/Tequila/Vodka/Whisky/New Mix/Jack Daniel's) are a code-known list surfaced via the reused picker. Tropical Sumo + Cantarito Fest remain separate rows. |
| (Kids rows) | `kidsMenu.ts` seeds 7 items under `kids` (all `locationType='both'`): 1 "All You Can Eat Kids" $179 with `includedInAyce=true`, and 6 combos at $149 with `includedInAyce=false`. |

**Food set membership is NOT edited** — it already derives from existing `includedInAyce` +
`locationType` (see §4). Kids items are surfaced only via the dedicated Kids query (by category),
never in the AYCE/Express food lists.

### Sauces (`sauces`) — UNCHANGED

Catalogue stays; only its association with wings is removed (`requiresSauce=false`). Spice
thermometer out of scope.

### Drink group (`drink_group`) — schema (0027 + 0028) + seed

| Field | Change |
|---|---|
| `display_order` | NEW (0027); backfilled: `jumbo_cocktails`(0), `cantaritos_sumo_cups`(1), `sodas`(2), `beers`(3), **`destilados`(4, NEW)**, `coffee_digestifs`(5). |
| `name_es`/`name_en` | NEW (0028); DB-driven labels (e.g. Destilados/"Spirits", Cervezas/"Beers", Refrescos y Bebidas/"Sodas & Beverages"). Single source of truth for chip + heading. |
| `groupKey` | New row `destilados`; former `beers_spirits` **renamed to `beers`** ("Cervezas"); standalone `non_alcoholic` **deleted** (items fold into `sodas`). |
| `promoEs`/`promoEn` | The "2x1 / Combo Mezcladores $189" note lives here for `destilados` (rendered once); the spirit subtitle also sits on the group. |

### Drink sub-group (`drink_sub_group`) — seed changes only

| Field | Change |
|---|---|
| `drinkGroupId` | Spirit sub-groups (ron, vodka, brandy, mezcal, ginebra, tequila, whisky, cremas_licores) re-parented to `destilados`; beer sub-groups (cerveza_nacional, cerveza_premium, cerveza, caguamon) stay under Cervezas. |
| `displayOrder` | `caguamon` ordered FIRST within its group. |
| `subtitleEs/En`, `promoEs/En` | Per-spirit-sub-group 2x1/promo text NULLED (moved to group level, §above). |

---

## 3. Type changes (`types/menu.ts`)

- `DrinkGroup` union: `beers_spirits` **renamed to `beers`**, `destilados` added, `non_alcoholic`
  removed (folded into `sodas`):
  ```ts
  export type DrinkGroup =
    | 'jumbo_cocktails' | 'cantaritos_sumo_cups'
    | 'sodas' | 'coffee_digestifs' | 'beers' | 'destilados'
  ```
- `FullMenuResult` gains **`drinkGroups: DrinkGroupMeta[]`** — the DB-driven group metadata
  (`key`, `name`, `displayOrder`, group-level `promo`) that carries the labels, order, and single
  promo note to the client (no second fetch). `FullMenuCategory` gains a **`note`** field
  (DB category note, used by Kids). `FullMenuResult.locationType` widens to
  `'ayce' | 'express' | 'kids'`. `FullMenuDish` carries `includedInAyce` and `featured`.
- The presentation-layer `PrimarySelection` union (in `app/features/menu/menu-sets.ts`) is
  `'ayce' | 'express' | 'drinks' | 'kids'`.

---

## 4. Curated set model (presentation layer — NO table)

`app/features/menu/menu-sets.ts` maps each selection to an ordered list. Membership is validated
against what the API returns (which already scopes by `locationType` + modality); ordering +
default come from the config. Kids is a single flat view (no chips).

```ts
type PrimarySelection = 'ayce' | 'express' | 'drinks' | 'kids'
type AyceModality = 'buffet' | 'carta'

// Food sets: ordered category keys. Drinks set: ordered drink-group keys.
const AYCE_BUFFET_SET: MenuCategoryKey[] =
  ['appetizers','burgers','sandwiches','hot_dogs','cold_rolls','hot_rolls','sweet_rolls','wings']
const AYCE_CARTA_SET: MenuCategoryKey[] =   // 11 — Kids removed (standalone view)
  ['appetizers','salads','rice','ramen','burgers','hot_dogs','cold_rolls','hot_rolls','sweet_rolls','desserts','wings']
const EXPRESS_SET: MenuCategoryKey[] =
  ['appetizers','burgers','burritos','hot_dogs','cold_rolls','hot_rolls','sweet_rolls','wings']
const DRINKS_SET: DrinkGroup[] =
  ['jumbo_cocktails','cantaritos_sumo_cups','sodas','beers','destilados','coffee_digestifs']
const KIDS_SET: MenuCategoryKey[] = ['kids']  // single flat view, no chip row
```

Defaults: AYCE·buffet·`appetizers`; Bebidas·`jumbo_cocktails`; Kids·`kids`.

**Kids two-section split (presentation, in `MenuShell`)**: the single `kids` category is split into
two ordered sub-sections by `includedInAyce` — "All You Can Eat Kids" ($179 item, first) then
"Combo Infantil" (6 combos, carrying the DB category note). Headings are i18n (`menu.kids.*`).

**Verified non-empty (item counts per confirmed set)** — all curated categories have items, so no
set renders fully empty:
- Buffet (8): 13 / 8 / 3 / 3 / 8 / 9 / 2 / 2
- Carta (12): 9 / 2 / 4 / 1 / 5 / 3 / 8 / 9 / 2 / 7 / 4 / 8
- Express (8): 13 / 8 / 2 / 3 / 6 / 6 / 1 / 2

`locationType='both'` handling: `both` items pass every location scope; the curated **food** sets
exclude the `drinks` category (drinks = the separate Bebidas selection), so any `both` **food**
item must be confirmed during seed review to land in its expected set (buffet vs carta via
`includedInAyce`). Drinks (`both`) always pass the modality filter and appear only under Bebidas.

---

## 5. Filter/selection state (`useMenuFilters`)

| State | Before | After |
|---|---|---|
| primary selection | `activeType: 'ayce'\|'express'` | `activeSelection: 'ayce' \| 'express' \| 'drinks' \| 'kids'` (4-way) |
| modality | shown for AYCE | AYCE only; label "Carta"/"Menu"; forced `buffet` for non-AYCE |
| `activeCategory` | defaults `null` (→ show all) | defaults to **first of active set** (never `null`; no "show all") |
| chips visibility | always | hidden for Kids (`showCategoryChips === false`) |
| accent | orange/blue | AYCE orange, Express blue, Bebidas/Kids soft/ink |
| on switch | clears category to `null` | resets to first category/group of the new set |
| URL sync | present | present; `drinks` serialises to `type=bebidas`; out-of-set `?category=` resolves to set default |

---

## 6. Divergence / cleanup finding (RESOLVED)

`server/db/queries/menu.ts` was an **orphaned duplicate** of the live `server/utils/menu-queries.ts`
query logic (Article I DRY / Article VIII dead code). It and its subjectless test were **deleted**;
the live module is covered by the co-located `server/utils/menu-queries.test.ts`. The live path
(`index.get.ts` → `getFullMenu`) already filters buffet vs carta by `includedInAyce`.

## 7. Robustness delivered (not in the original draft)

- **`server/utils/db-retry.ts`** — `withDbRetry(op, run)` retries transient Neon errors up to 3
  attempts (150/300ms backoff); `isTransientDbError` classifies NeonDbError / "fetch failed" /
  connection wording. Non-transient errors re-throw immediately.
- **`DatabaseUnavailableError`** (503, WARN) — `getFullMenu`/`getFeaturedDishes` wrap transient
  failures in it; the `/menu` route catches it and renders `emptyMenuResult(...)` (→ `menu.unavailable`).
- **`resolveImageUrl` cache-busting** — appends `?v=<MENU_IMAGE_VERSION>` (hand-maintained
  constant) so in-place Blob overwrites bust browser + CDN caches.
- **Featured dedupe** — `getFeaturedDishes` dedupes rows by name (each dish is featured on multiple
  location rows) so the homepage rail lists exactly 11 unique dishes in `displayOrder`.
