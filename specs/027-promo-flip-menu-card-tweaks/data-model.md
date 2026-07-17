# Data Model: Promo Flip-to-Terms + Garantía Badge + Ramen XL DB-Driven Options + Kids AYCE Background + Vaso Sumo Migration

**Feature**: `027-promo-flip-menu-card-tweaks`
**Date**: 2026-07-16 (Part C rescoped + Part E added same day)

## Migration summary — REVISED 2026-07-16

The original Part C ("Ramen XL hero image") required one additive column
(`menu_items.display_variant`). That approach is **scrapped** (see
`research.md` R6c). The uncommitted, never-merged migration
`server/db/migrations/0030_add_menu_item_display_variant.sql` and its
corresponding `displayVariant` column/CHECK addition already made to
`server/db/schema.ts` MUST be **deleted**, along with its journal entry —
not applied to any shared/production database, so the slot is free to reuse.

The revised feature needs **two** additive migrations (both fresh, both
purely additive — no destructive changes, per Article XIII precedent):

**Migration `0030` (reclaimed slot) — Kids highlight flag (Part D)**:

```sql
ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS highlight_background boolean NOT NULL DEFAULT false;
```

**Migration `0031` — generic option-groups schema (Parts C & E)**:

```sql
CREATE TABLE IF NOT EXISTS menu_item_option_groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  menu_item_id uuid NOT NULL REFERENCES menu_items(id),
  key varchar(60) NOT NULL,
  name_es varchar(80) NOT NULL,
  name_en varchar(80) NOT NULL,
  display_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp NOT NULL DEFAULT now(),
  updated_at timestamp NOT NULL DEFAULT now(),
  CONSTRAINT menu_item_option_groups_menu_item_key_unique UNIQUE (menu_item_id, key)
);

CREATE TABLE IF NOT EXISTS menu_item_option_choices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  option_group_id uuid NOT NULL REFERENCES menu_item_option_groups(id),
  name_es varchar(80) NOT NULL,
  name_en varchar(80) NOT NULL,
  price_delta decimal(8,2) NOT NULL DEFAULT '0.00',
  display_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp NOT NULL DEFAULT now(),
  updated_at timestamp NOT NULL DEFAULT now(),
  CONSTRAINT menu_item_option_choices_price_nonnegative CHECK (price_delta >= 0)
);

CREATE INDEX IF NOT EXISTS menu_item_option_groups_menu_item_idx ON menu_item_option_groups (menu_item_id, display_order);
CREATE INDEX IF NOT EXISTS menu_item_option_choices_group_idx ON menu_item_option_choices (option_group_id, display_order);
```

No column is dropped or renamed anywhere. Both migrations are additive per
Article I / Article XIII precedent (features 016, 018).

---

## Entity: MenuItem (existing — `menuItems` table, `server/db/schema.ts`)

| Field | Type | Before | After | Notes |
|---|---|---|---|---|
| `highlightBackground` (new) | `boolean` (DB column `highlight_background`, not null, default `false`) | n/a | `true` for the "All You Can Eat Kids" row only; `false` (default) everywhere else | Replaces the scrapped `displayVariant` enum column for Part D — see `research.md` R5. Directly analogous to the existing `featured` boolean already on this table. |
| `fileName` (existing) | `text` (nullable) | `'menu/ala-carta/ramen_xl.webp'` (Ramen XL) | **unchanged** — no hero image, no new asset; Ramen XL's existing photo continues to be used exactly as it is for any other dish. | Part C no longer needs a second, larger image asset. |

### Seed changes — MenuItem

| File | Row | Change |
|---|---|---|
| `server/db/seeds/kidsMenu.ts` | "All You Can Eat Kids" (`includedInAyce: true`) | Add `highlightBackground: true`. |
| `server/db/seeds/alaCarta.ts` | "Ramen XL" (`categoryKey: 'ramen'`) | **No field change on the `menu_items` row itself** — gains rows in the two new option-group tables instead (see below). No `displayVariant`/hero flag of any kind. |

No other row in either seed file changes.

---

## Entity: MenuItemOptionGroup (new — `menuItemOptionGroups` table)

Generic, reusable, attachable to any menu item via `menuItemId`.

| Field | Type | Notes |
|---|---|---|
| `id` | `uuid` pk | |
| `menuItemId` | `uuid` FK → `menuItems.id` | Which dish/drink this group belongs to. |
| `key` | `varchar(60)` | Slug identifying the group within its menu item (e.g. `'noodle_base'`, `'protein'`, `'extra_protein'`, `'flavor'`). Unique per `(menuItemId, key)`. |
| `nameEs` / `nameEn` | `varchar(80)` | The picker label shown to the diner (e.g. "Base de fideo", "Proteína", "Añade extra proteína", "Sabor"). |
| `displayOrder` | `integer`, default `0` | Order groups render in on the dish/drink card. |
| `isActive` | `boolean`, default `true` | Deactivate without deleting (mirrors `menuItems.isActive`/`sauces.isActive`). |

## Entity: MenuItemOptionChoice (new — `menuItemOptionChoices` table)

Belongs to exactly one option group.

| Field | Type | Notes |
|---|---|---|
| `id` | `uuid` pk | |
| `optionGroupId` | `uuid` FK → `menuItemOptionGroups.id` | Which group this choice belongs to. |
| `nameEs` / `nameEn` | `varchar(80)` | Displayed choice label (e.g. "Camarón cremoso", "Sí, extra proteína (+$29)"). |
| `priceDelta` | `decimal(8,2)`, default `'0.00'`, `CHECK >= 0` | Price addition for selecting this choice; `0.00` for choices with no price impact. Stored independently so price can be edited without touching the label text. |
| `displayOrder` | `integer`, default `0` | Order choices render in within their group; the first choice by this order is preselected by default (matches `MenuSaucePicker.vue`'s existing `selectedId = options[0]?.id` behavior). |
| `isActive` | `boolean`, default `true` | Deactivate without deleting. |

### Seed data for Ramen XL (`server/db/seeds/` — new seed file or extension of `alaCarta.ts`)

| Group `key` | Group label (es) | Choices (es, `priceDelta`) |
|---|---|---|
| `noodle_base` | "Base de fideo" | Pollo (0.00), Camarón cremoso (0.00), Camarón picante (0.00), Vegetales picantes (0.00) |
| `protein` | "Proteína" | Res (0.00), Camarón (0.00), Pollo (0.00) |
| `extra_protein` | "Añade extra proteína" | No, gracias (0.00), Sí, extra proteína (+$29) (29.00) |

### Seed data for Vaso Sumo (`server/db/seeds/drinks.ts` — extended, Part E)

| Group `key` | Group label (es) | Choices (es, `priceDelta`) |
|---|---|---|
| `flavor` | "Sabor" | Ron (0.00), Tequila (0.00), Vodka (0.00), Whisky (0.00), New Mix (0.00), Jack Daniel's (0.00) |

Same names, order, and (lack of) price impact as today's hardcoded
`menu.vaso_sumo.flavor.*` i18n values — a like-for-like migration (FR-023).

---

## Entity: FullMenuDish (existing — `types/menu.ts`, server-projected view) — REVISED

| Field | Before | After |
|---|---|---|
| `displayVariant` | *(scrapped, never shipped)* | **Removed entirely** — replaced by the two fields below. |
| `highlightBackground` (new) | n/a | `boolean` — projected 1:1 from `menu_items.highlight_background`. `true` only for "All You Can Eat Kids". |
| `optionGroups` (new) | n/a | `DishOptionGroup[]` — `[]` for every dish/drink with no configured option groups (the overwhelming majority); populated for "Ramen XL" and "Vaso Sumo" only, today. |

New supporting types in `types/menu.ts`:

```ts
export interface DishOptionChoice {
  id: string
  name: Bilingual
  priceDelta: string // decimal-as-string, matches the existing `price: string | null` convention
}

export interface DishOptionGroup {
  key: string
  name: Bilingual
  choices: DishOptionChoice[]
}
```

**Consumers**:

- `app/features/menu/components/MenuDishCard.vue` — renders `dish.highlightBackground`
  as a prop-driven gradient background on its existing image panel (unchanged
  from the prior round's `highlightImagePanel`-style prop, just re-sourced
  from the new boolean instead of `displayVariant === 'highlight'`), AND
  renders one `MenuSaucePicker` per entry in `dish.optionGroups` beneath the
  description (new, generic — works for any dish, not just Ramen XL).
- `app/features/menu/components/MenuDrinkSection.vue` — replaces its hardcoded
  `isVasoSumo()`/`vasoSumoFlavors`/`flavorOptions` logic with the same generic
  `dish.optionGroups` loop, reusing `MenuSaucePicker` exactly as
  `MenuDishCard.vue` does (research.md R6a).
- `app/features/menu/components/MenuDishGrid.vue` — **no longer swaps in any
  alternate component** for any dish (the old `MenuDishHero` swap is removed
  entirely) — every dish renders via the same `MenuDishCard.vue`, differing
  only by props (`highlightBackground`, `optionGroups`).

---

## Entity: Promotion (existing — `types/content.ts`) — UNCHANGED this round (Part A/B untouched)

| Field | Before | After |
|---|---|---|
| `terms` (new) | n/a | `Bilingual \| null` — `null` unless BOTH `tyc_es` AND `tyc_en` are present and non-empty upstream (bilingual-completeness rule, research.md R4a). A promo with only one language filled in projects `terms: null`, identical to a promo with neither. |

### WordPress raw shape (`types/wordpress.ts` — `WpPromotionAcf`)

| `acf` field (new) | Type | Notes |
|---|---|---|
| `tyc_es` | `string` (optional/nullish) | Assumed field key (see Coordination status below); mirrors the `badge_es` shape but is optional in WP admin, unlike Badge. |
| `tyc_en` | `string` (optional/nullish) | Assumed field key; NO same-language fallback to `tyc_es` — `terms` requires both languages present (research.md R4a), unlike `badge_en`'s fallback to `badge_es`. |

### Validation (`server/api/v1/content/validators.ts`)

- `acfSchema` gains `tyc_es: z.string().nullish()`, `tyc_en:
  z.string().nullish()` — nullish (not required), so promos that don't have
  the field configured (or configured in only one language) continue to parse
  successfully (never dropped for missing/partial terms).
- `mapPromotion()` projects: `terms: acf.tyc_es?.trim() && acf.tyc_en?.trim()
  ? { es: acf.tyc_es, en: acf.tyc_en } : null` — both sides must be non-empty
  after trimming, or the promo gets `terms: null`. There is intentionally NO
  `en: acf.tyc_en ?? acf.tyc_es` fallback branch here (unlike `badge_en`'s
  fallback to `badge_es`) — a partially-filled TyC pair must never render.

### Coordination status (downgraded from blocking, post-review 2026-07-16)

The `tyc_es` / `tyc_en` ACF field pair is **actively being added** to the live
WordPress `promociones` CPT right now — confirmed via a client-provided
screenshot of the WP admin edit screen
(`assets/source/wp-admin-tyc-fields.png`), showing "TyC (ES)"/"TyC (EN)"
textareas alongside the existing Badge fields, both currently empty and
optional (no required-field marker). The exact ACF field **key** is assumed
(`tyc_es`/`tyc_en`, per this CPT's established naming convention) pending
confirmation from a live API payload — WP admin does not expose the
underlying field key in its standard edit UI. This repo's schema/type/parsing
change is additive and safe to ship regardless of whether the assumed keys
are exactly right (every promo simply parses with `terms: null` until both
fields are populated with matching keys), and the **user-visible flip
behavior activates automatically once WordPress admin populates both
languages for a given promotion** — an out-of-repo action per
`docs/business/features.md` §9. See `research.md` R4/R4a and `plan.md`
Constitution Check for the same status called out at each phase.

---

## Entity: PromotionsCarousel flip state (frontend-only, not persisted) — UNCHANGED this round

| State | Owner | Notes |
|---|---|---|
| `flippedId: string \| null` | `PromotionsCarousel.vue` | Which promo (by `id`), if any, currently shows its back face. Reset to `null` on `onSelect()` (any slide-change: drag, arrows, dots). |
| `flipped: boolean` (prop) | `PromotionCard.vue` | Presentational only; `PromotionCard` never owns carousel state (see research.md R2). |

No new persisted entity — this is transient UI state, out of scope for the DB.

---

## Orphaned artifacts to remove (see `research.md` R6c for full disposition)

The following files exist uncommitted in the working tree from the
now-scrapped original Part C approach and MUST be deleted (not adapted) as
part of implementing this revision:

- `app/features/menu/components/MenuDishHero.vue`
- `app/features/menu/components/MenuDishHero.spec.ts`
- `app/features/menu/components/MenuDishHero.stories.ts`
- `server/db/migrations/0030_add_menu_item_display_variant.sql` (+ its
  `server/db/migrations/meta/_journal.json` entry)
- The `displayVariant` column/CHECK addition already present in
  `server/db/schema.ts` (to be replaced by `highlightBackground`)
- Any `displayVariant` references already introduced in `types/menu.ts`,
  `server/utils/menu-queries.ts`, `server/db/seeds/alaCarta.ts`,
  `server/db/seeds/kidsMenu.ts`
- Any test file already written specifically against the old
  `display_variant` mechanism (e.g. a `tests/db/menu-display-variant.test.ts`-
  style file, if present in the working tree)
