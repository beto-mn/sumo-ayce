# Data Model: Sauce Heat Thermometer Graphic + Sitewide Watermark Asset Refresh

> **⚠️ AMENDED 2026-07-17**: Part B's sauce-selection data model below (the
> `menu_item_option_groups.maxSelections` addition, the Wings/Boneless seed
> rows, and the `sauces` table it reads from) describes the ORIGINAL `df3a13c`
> implementation, since reversed. See `spec.md` ("Revision 2026-07-17") and
> `plan.md` ("AMENDMENT 2026-07-17") for what actually ships next — a revert of
> this data model, not an extension of it. This file is kept as historical
> record and is not updated further.

## Part A — Watermark artwork

No data-model changes. `tailwind.config.ts`'s `theme.extend.backgroundImage.watermark`
token is repointed at the replacement asset file; the file at
`public/patterns/sumo-watermark.webp` is replaced in place (same path, new content)
so no other reference (component classes, tests) needs to change. An explicit
`background-size` is added alongside the existing `bg-repeat` utility (see
research.md R1) to preserve the on-screen tile footprint.

## Part B — Sauce selection + heat thermometer

### Modified entity: `menu_item_option_groups` (Neon, Drizzle)

Existing table (feature 027). One additive column:

| Column | Type | Default | Notes |
|---|---|---|---|
| `max_selections` | `integer` | `1` | NEW (this feature). Number of choices a visitor may simultaneously select from this group. `1` = today's single-active behavior (Ramen XL, Vaso Sumo, AYCE/Express Wings/Boneless — unchanged/new-but-same). `2` or `3` = the À la Carta Wings/Boneless packages requiring multiple simultaneous sauces. |

**Constraint**: `max_selections >= 1` (CHECK), mirroring the existing
`sauces_spice_level_nonnegative`-style non-negative/positive constraints already
used elsewhere in this schema.

**Migration**: `0032_add_menu_item_option_group_max_selections.sql` — additive,
`ALTER TABLE menu_item_option_groups ADD COLUMN max_selections integer NOT NULL DEFAULT 1`
+ the CHECK constraint. No backfill needed (default `1` is correct for every
existing row — Ramen XL and Vaso Sumo groups are genuinely single-select).

### Unchanged entities (read-only inputs to new seed data)

- **`sauces`** (feature 016/024) — 12 rows, `nameEs`/`nameEn`/`spiceLevel`/`fileName`.
  Read as the source catalog for the new Wings/Boneless option-group choices. No
  schema or data change.
- **`menu_items`** — Wings/Boneless dishes (`ayceMenu.ts`, `expressMenu.ts`,
  `alaCarta.ts` seed rows for the `wings` category) gain new `menu_item_option_groups`
  rows (see below); no column changes to `menu_items` itself. The existing
  `requires_sauce` column and the `sauces` top-level API field remain untouched and
  unconsumed (research.md R2) — explicitly out of scope for this feature.

### New seed data shape (`server/db/seeds/menuItemOptions.ts`, extended)

For each Wings/Boneless dish, one option group named e.g. "Salsa" / "Sauce"
(`key: 'sauce'`), whose choices are the 12 sauces (name + `priceDelta: '0.00'`,
mirroring the existing choice shape — no price impact from sauce choice), and a
`maxSelections` value matching the dish's own description:

| Dish (name_es) | Source | `maxSelections` |
|---|---|---|
| Alitas (AYCE) | `ayceMenu.ts` | 1 |
| Boneless (AYCE) | `ayceMenu.ts` | 1 |
| Alitas (Express) | `expressMenu.ts` | 1 |
| Boneless (Express) | `expressMenu.ts` | 1 |
| Alitas Paquete Individual | `alaCarta.ts` | 2 |
| Alitas Paquete para Compartir | `alaCarta.ts` | 3 |
| Boneless Paquete Individual | `alaCarta.ts` | 2 |
| Boneless Paquete para Compartir | `alaCarta.ts` | 3 |

### Modified type: `DishOptionGroup` (`types/menu.ts`)

```ts
export interface DishOptionGroup {
  key: string
  name: Bilingual
  choices: DishOptionChoice[]
  /** NEW. Max simultaneous selections; 1 = single-active (existing behavior). */
  maxSelections: number
}
```

Purely additive — every existing consumer (Ramen XL, Vaso Sumo) receives
`maxSelections: 1` and is unaffected.

### Modified query: `queryOptionGroupsByMenuItem` (`server/utils/menu-queries.ts`)

Projects the new `menu_item_option_groups.max_selections` column onto
`DishOptionGroup.maxSelections`, alongside the existing `key`/`name` projection.
No new query, no N+1 — same batched query, one more selected column.

### Modified component contract: `MenuSaucePicker.vue`

```ts
defineProps<{
  options: PickerOption[]
  pickerLabel: string
  sortBySpice?: boolean
  /** NEW, additive. Default 1 (today's single-active behavior, unchanged). */
  maxSelections?: number
}>()
```

Behavior:
- `maxSelections` unset or `1` → unchanged: exactly one active id, defaults to the
  first option, clicking any option makes it the sole active one (never empty).
- `maxSelections > 1` → internal state becomes a bounded `Set<string>`; clicking an
  unselected option adds it if the set's size is below `maxSelections`; clicking an
  already-selected option removes it; clicking a new option once the set is full is
  a no-op (FR-010 — no error, selection simply doesn't grow further).

### New static asset (no DB entity): heat thermometer graphic

A single fixed public asset path (e.g.
`/menu/thermometer/sauce-heat-thermometer.webp`), referenced directly in
`MenuDishGrid.vue` gated on `category.key === 'wings'` (research.md R5) — not a DB
column, not an API field. Swappable by replacing the file at that path (FR-012).

## No changes

- `sauces` table schema (spice levels already correct, per feature description's
  explicit out-of-scope note).
- Ramen XL / Vaso Sumo existing option-group rows (their `max_selections` defaults
  to `1`, identical to their current implicit behavior).
- `menu_items.requires_sauce` and `FullMenuResult.sauces` — left as dormant,
  unconsumed fields (research.md R2), out of scope to wire or remove.
