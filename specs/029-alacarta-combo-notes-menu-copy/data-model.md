# Data Model: À La Carte Combo Notes & Menu Copy Refresh

**[Revised]** Part C's original design (two new nullable `menu_categories` columns + a
modality-branch in `groupByCategory()`) was reviewed by the client and replaced with a **category
split**: no new columns, no new tables, and no query-layer change. See `research.md`'s R3 revision
note for the full rationale.

## `menu_categories` (existing table — Part C adds new ROWS, not new columns)

Location: `server/db/schema.ts`

| Column (existing) | Type | Notes |
|---|---|---|
| `id` | uuid PK | unchanged |
| `key` | enum `menuCategoryKey` | **Gains 4 new allowed values** (Part C): `burgers_carta`, `hot_dogs_carta`, `cold_rolls_carta`, `hot_rolls_carta`. Still unique per row. |
| `name_es` / `name_en` | varchar(80) | Part A: `key = 'rice'` row's `name_es` changes from `'Arroz'` to `'Arroces'`. Part C: the 4 new rows carry the **same** `name_es`/`name_en` as their shared counterparts (e.g. `burgers_carta.nameEs = 'Hamburguesas'`, identical to `burgers.nameEs`). |
| `note_es` / `note_en` | text, nullable | **UNCHANGED mechanism** — modality-agnostic note. `kids`/`wings` keep using it exactly as before. Part C populates it on the 4 **new** rows only (`burgers_carta`, `hot_dogs_carta`, `cold_rolls_carta`, `hot_rolls_carta`); the original shared rows (`burgers`, `hot_dogs`, `cold_rolls`, `hot_rolls`) are left with `note_es`/`note_en` = `NULL`, exactly as today. |
| `display_order` | integer | The 4 new rows get the next available integer values (17–20). This value has no visible effect on section ordering in the current UI (see "Why the display-order value doesn't matter" below) — it exists only to satisfy the `NOT NULL` column. |
| `is_active` | boolean | The 4 new rows are `true`. |
| `file_name` | text, nullable | unchanged, `NULL` on the new rows (matches the shared rows — categories don't carry item images). |
| `created_at` / `updated_at` | timestamp | unchanged |

### New category rows (Part C)

| `key` | `name_es` / `name_en` | `note_es` / `note_en` | Populated by |
|---|---|---|---|
| `burgers_carta` | Hamburguesas / Burgers | "Incluye papas a la francesa (100 g) y refresco (400 ml)." / "Includes french fries (100 g) and a soft drink (400 ml)." | à la carte `BURGERS` items (`server/db/seeds/alaCarta.ts`) |
| `hot_dogs_carta` | Hot Dogs / Hot Dogs | "Incluye papas a la francesa (100 g) y refresco (400 ml)." / "Includes french fries (100 g) and a soft drink (400 ml)." | à la carte `HOT_DOGS` items |
| `cold_rolls_carta` | Sushi Frío / Cold Rolls | "Incluye tu elección de yakimeshi mixto (240 g) o ensalada sweet kani (180 g), más refresco (400 ml)." / "Includes your choice of mixed yakimeshi (240 g) or sweet kani salad (180 g), plus a soft drink (400 ml)." | à la carte `COLD_ROLLS` items |
| `hot_rolls_carta` | Sushi Caliente / Hot Rolls | Same combo copy as `cold_rolls_carta` | à la carte `HOT_ROLLS` items |

The **original shared rows** (`burgers`, `hot_dogs`, `cold_rolls`, `hot_rolls`) are unchanged: they
keep their existing `name_es`/`name_en`, stay `note_es`/`note_en` = `NULL`, and continue to be
populated by the AYCE-buffet (`ayceMenu.ts`) and Express (`expressMenu.ts`) item rows exactly as
today. `sweet_rolls` is not split — it is out of scope for Part C (Sushi Dulce has no combo per
the client's flyers) and keeps its single shared row.

**Drizzle schema addition** (illustrative — implementer writes the actual migration):

```ts
export const menuCategoryKey = pgEnum('menu_category_key', [
  // ...existing 17 values unchanged...
  'burgers_carta',
  'hot_dogs_carta',
  'cold_rolls_carta',
  'hot_rolls_carta',
])
// menuCategories table itself is completely unchanged — no new column.
```

**Migration** (mirrors the existing precedent for prior category-key additions — see
`server/db/migrations/0021_add_ensalada_arroces_category_keys.sql`,
`0022_add_ramen_category_key.sql`):

```sql
ALTER TYPE "public"."menu_category_key" ADD VALUE IF NOT EXISTS 'burgers_carta';
--> statement-breakpoint
ALTER TYPE "public"."menu_category_key" ADD VALUE IF NOT EXISTS 'hot_dogs_carta';
--> statement-breakpoint
ALTER TYPE "public"."menu_category_key" ADD VALUE IF NOT EXISTS 'cold_rolls_carta';
--> statement-breakpoint
ALTER TYPE "public"."menu_category_key" ADD VALUE IF NOT EXISTS 'hot_rolls_carta';
```

### Why the display-order value doesn't matter for visible ordering

`MenuShell.vue` renders exactly **one** category section at a time — it looks up the single active
category by key (`props.menuData.categories.find(c => c.key === activeCategory.value)`) and passes
only that one category to `MenuDishGrid`. Which category is "active" (and in what order the chips
appear) is driven entirely by the curated set order in `app/features/menu/menu-sets.ts`, not by
`menu_categories.display_order`. So the new rows' `display_order` values only need to be unique,
`NOT NULL`-satisfying integers — they never determine what a visitor sees rendered before what.

## `menu_items` (existing table, no schema change — Part B content, Part C reassignment)

Location: `server/db/schema.ts` — no column changes.

- **Part B**: `description_es` / `description_en` for every item under `cold_rolls`, `hot_rolls`,
  `sweet_rolls` in `server/db/seeds/alaCarta.ts` gains a trailing sentence:
  `"… <existing description text> 10 Pzas."` (ES) / `"… <existing description text> 10 pcs."` (EN).
- **Part C**: every item in `alaCarta.ts`'s `BURGERS`, `HOT_DOGS`, `COLD_ROLLS`, `HOT_ROLLS`
  arrays has its `categoryKey` changed from the shared key (`burgers`, `hot_dogs`, `cold_rolls`,
  `hot_rolls`) to the corresponding `_carta` key. No other field on these items changes — same
  name, description, price, image, badges, `locationType: 'ayce'`, `includedInAyce: false`.
  AYCE-buffet (`ayceMenu.ts`) and Express (`expressMenu.ts`) items keep referencing the original
  shared keys — untouched.

No new entity, no new table, no relationship changes (item → category is still a plain FK; there
are simply two category rows sharing a display name instead of one).

## Query-layer shape (no change at all)

`types/menu.ts`'s `FullMenuCategory.note: Bilingual | null` and `MenuCategoryKey` are **unchanged
in shape** (`MenuCategoryKey` merely gains 4 new string literal members). `server/utils/menu-
queries.ts` is **not modified**. The correct per-modality visibility falls out of mechanisms that
already exist, with no new logic:

1. `groupByCategory()` already sources `category.note` unconditionally from whatever category row
   a query result row belongs to — no branch needed, because each row belongs to only one
   category row (`burgers` OR `burgers_carta`, never both).
2. `ayceModalityFilter()` already restricts a `buffet`-modality query to
   `includedInAyce = true` (or `locationType = 'both'`) rows, and a `carta`-modality query to
   `includedInAyce = false` (or `locationType = 'both'`) rows. À la carte items are seeded with
   `includedInAyce: false`; AYCE-buffet items are seeded with `includedInAyce: true`. Since à la
   carte items point at `burgers_carta` (etc.) and buffet items point at `burgers` (etc.), a
   `buffet`-modality query never returns any `burgers_carta` row (all its items are
   `includedInAyce: false`) and a `carta`-modality query never returns any `burgers` row (all its
   items are `includedInAyce: true`). Each category row is therefore only ever visible in exactly
   one modality — for free, as a consequence of filtering that already existed for an unrelated
   reason (pricing/inclusion logic), not anything added by this feature.
3. Express always resolves to `'buffet'` modality (`resolveModality()`) and only ever queries
   `locationType IN ('express', 'both')` rows — it can never see the à la carte-only `_carta`
   category rows, which belong to `locationType: 'ayce'` items.

## Validation rules

- `note_es` and `note_en` MUST both be set or both be `NULL` for a given category row (no
  half-bilingual note) — unchanged existing convention (kids, wings, and now the 4 new `_carta`
  rows all set both languages).
- Only the 4 new rows (`burgers_carta`, `hot_dogs_carta`, `cold_rolls_carta`, `hot_rolls_carta`)
  may carry the Part C combo note; the original shared rows (`burgers`, `hot_dogs`, `cold_rolls`,
  `hot_rolls`) MUST remain `NULL` in `note_es`/`note_en`, exactly as every other non-kids/wings
  category today.
- Every item under `alaCarta.ts`'s `BURGERS`/`HOT_DOGS`/`COLD_ROLLS`/`HOT_ROLLS` arrays MUST
  reference its `_carta` categoryKey variant; no item in `ayceMenu.ts`/`expressMenu.ts` may
  reference any `_carta` key.
- `AYCE_CARTA_SET` MUST reference the 4 `_carta` keys and MUST NOT reference the 4 shared keys;
  `AYCE_BUFFET_SET`/`EXPRESS_SET` MUST reference the 4 shared keys and MUST NOT reference any
  `_carta` key (enforced by the extended feature-023 drift-guard test).
