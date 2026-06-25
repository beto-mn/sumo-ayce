# Tasks: Menu / Bebidas Page

**Feature**: 011-menu-page  
**Branch**: `feat/018-menu-page`  
**Date**: 2026-06-23

---

## Phase 0 — Pre-flight & i18n

- [x] **T0.1** Verify `'/menu': { isr: 3600 }` is in `nuxt.config.ts`
- [x] **T0.2** Add 35 `menu.*` keys to `locales/es.json`
- [x] **T0.3** Add 35 `menu.*` keys to `locales/en.json` (same structure, English values)
- [x] **T0.4** Copy AYCE images to `public/menu/ayce/` from assets folder
- [x] **T0.5** Copy À la carte images to `public/menu/ala-carta/` from assets folder
- [x] **T0.6** Copy Drinks images to `public/menu/drinks/` from assets folder
- [x] **T0.7** Copy Kids images to `public/menu/kids/` from assets folder
- [x] **T0.8** Copy Desserts images to `public/menu/desserts/` from assets folder
- [x] **T0.9** Create `public/menu/express/` (empty, for future Express images)
- [x] **T0.10** Create `app/features/menu/types.ts` with any local page types needed

**Gate check**: T0.1 (Gate 1), T0.2–T0.3 (Gate 8), T0.4–T0.9 (Gate 9)

---

## Phase 1 — API Route

- [x] **T1.1** Create `server/api/v1/menu/index.get.ts`
  - Zod: `type` required enum `['ayce', 'express']`; `modality` optional enum `['buffet', 'carta']` default `'buffet'`
  - Return 400 with `{ error: 'Invalid query parameters' }` on validation failure
  - Call `getFullMenu({ locationType, modality })` from `server/utils/menu-queries.ts`
  - For each dish, compute `imageUrl` using `resolveImageUrl(fileName, locationType, categoryKey, includedInAyce)`
  - Return the shaped `FullMenuResult` as JSON
  - Catch errors and return 500 with `{ error: 'Failed to load menu' }`
- [x] **T1.2** Implement `resolveImageUrl` helper (≤ 15 lines, pure function) inside `index.get.ts`
- [x] **T1.3** Smoke test: `curl "http://localhost:3000/api/v1/menu?type=ayce"` returns valid JSON with categories

**Gate check**: Gate 2 (`grep -r 'drizzle-orm' app/` empty), Gate 6 (biome + tsc)

---

## Phase 2 — `useMenuFilters` Composable (test-first)

- [x] **T2.1** Write `app/features/menu/composables/useMenuFilters.test.ts` with tests:
  - Default state: `activeType = 'ayce'`, `activeModality = 'buffet'`, `activeCategory = null`
  - `setType('express')` → `activeModality` resets to `'buffet'`; `activeCategory` resets to `null`
  - `setType('express')` → `showModalityToggle.value === false`
  - `setType('ayce')` → `showModalityToggle.value === true`
  - `setModality('carta')` → `activeModality.value === 'carta'`
  - `accentStyle` → orange when type=ayce; blue when type=express
  - URL sync: `setType` calls `router.replace` with updated `?type`
  - URL sync: `setModality` calls `router.replace` with updated `?modality`
- [x] **T2.2** Implement `app/features/menu/composables/useMenuFilters.ts`
  - Accept `initialType` and `initialModality` as parameters
  - Expose: `activeType`, `activeModality`, `activeCategory`, `showModalityToggle`, `accentStyle`, `setType`, `setModality`, `setCategory`
  - `setType` resets modality to 'buffet' and category to null, then calls `router.replace`

**Gate check**: Gate 7 (≥ 70% coverage)

---

## Phase 3 — Components

### T3.1 — MenuSaucePicker

- [x] **T3.1.1** Create `app/features/menu/components/MenuSaucePicker.vue`
  - Props: `sauces: FullMenuSauce[]`
  - Local `selectedId: Ref<string | null>`
  - Renders sauces in `spiceLevel` order; shows chili indicator for `spiceLevel ≥ 3`
  - Radio-style click selection (one active at a time)
- [x] **T3.1.2** Create `MenuSaucePicker.spec.ts` — renders sauce list, selects one, shows spice indicator
- [x] **T3.1.3** Create `MenuSaucePicker.stories.ts` — Default (13 sauces, none selected), SelectedState

### T3.2 — MenuDishCard

- [x] **T3.2.1** Create `app/features/menu/components/MenuDishCard.vue`
  - Props: `dish: FullMenuDish`, `sauces: FullMenuSauce[]`, `modality: MenuModality`, `locale: 'es'|'en'`
  - Shows `<NuxtImg>` with `imageUrl` (or placeholder SVG when null); `loading="lazy"`
  - Shows `name[locale]`, `description[locale]`, `badge[locale]` (if non-null)
  - Shows price ("$128") when `modality === 'carta'` and `price != null`
  - Shows "Incluido" when `modality === 'buffet'` and `incluido === true`
  - Mounts `<MenuSaucePicker>` when `requiresSauce === true`
- [x] **T3.2.2** Create `MenuDishCard.spec.ts` covering FR-030:
  - Renders name and description
  - Shows placeholder when `imageUrl = null`
  - Shows badge when non-null
  - Shows price "$128" in carta modality
  - Shows "Incluido" in buffet modality
  - Mounts `MenuSaucePicker` when `requiresSauce = true`
  - Does NOT mount `MenuSaucePicker` when `requiresSauce = false`
- [x] **T3.2.3** Create `MenuDishCard.stories.ts` — Default, NoImage, WithBadge, WithSauce, CartaWithPrice

### T3.3 — MenuDishGrid

- [x] **T3.3.1** Create `app/features/menu/components/MenuDishGrid.vue`
  - Props: `categories: FullMenuCategory[]`, `sauces: FullMenuSauce[]`, `modality: MenuModality`
  - Renders each category as `<section :id="category.key">` with `<MenuDishCard>` per dish
  - Grid layout: 1-col mobile, 2-col ≥520px, 3-col ≥880px (Tailwind)

### T3.4 — MenuDrinkSection

- [x] **T3.4.1** Create `app/features/menu/components/MenuDrinkSection.vue`
  - Props: `drinks: FullMenuDish[]`
  - Groups drinks by `drinkGroup`; renders group header (i18n key `menu.drink_group.{key}`)
  - Each drink shows name, description, image, price (always shown regardless of modality)

### T3.5 — MenuCategoryChips

- [x] **T3.5.1** Create `app/features/menu/components/MenuCategoryChips.vue`
  - Props: `categories: FullMenuCategory[]`, `activeCategory: string | null`
  - Emits: `update:active-category`
  - Clicking a chip scrolls to `#${key}` and emits the key
  - Uses `IntersectionObserver` (client-only) to update active chip on scroll
  - Horizontally scrollable on mobile

### T3.6 — MenuTypeToggle

- [x] **T3.6.1** Create `app/features/menu/components/MenuTypeToggle.vue`
  - Props: `activeType: 'ayce' | 'express'`
  - Emits: `update:active-type`
  - Two buttons with accent colors; orange for AYCE, blue for Express
- [x] **T3.6.2** Create `MenuTypeToggle.stories.ts` — AYCE active, Express active

### T3.7 — MenuModalityToggle

- [x] **T3.7.1** Create `app/features/menu/components/MenuModalityToggle.vue`
  - Props: `activeModality: 'buffet' | 'carta'`
  - Emits: `update:active-modality`
  - Only visible when passed (parent handles `v-if="showModalityToggle"`)
- [x] **T3.7.2** Create `MenuModalityToggle.stories.ts` — Buffet active, Carta active

### T3.8 — MenuShell

- [x] **T3.8.1** Create `app/features/menu/components/MenuShell.vue`
  - Props: `menuData: FullMenuResult`, `initialType: 'ayce'|'express'`, `initialModality: 'buffet'|'carta'`
  - Uses `useMenuFilters(initialType, initialModality)`
  - `:style="accentStyle"` on wrapper div
  - Renders: `MenuTypeToggle`, `MenuModalityToggle` (v-if), `MenuCategoryChips`, `MenuDishGrid`, `MenuDrinkSection`
  - Separates drinks category from food categories before passing to subcomponents

---

## Phase 4 — Page Assembly

- [x] **T4.1** Create `app/pages/menu.vue`
  - `useAsyncData` with key `() => \`menu-${type}-${modality}\`` calling `$fetch('/api/v1/menu', { params })`
  - Extract `type` and `modality` from `useRoute().query`; default `type = 'ayce'`
  - `useHead` with `menu.seo.title_ayce|express` and `menu.seo.description`
  - Renders `<MenuShell>` when data available, inline error state when not
  - Template MUST NOT exceed 100 lines
- [x] **T4.2** Manual verification: `pnpm dev` → navigate to `/menu?type=ayce`, `/menu?type=express`, `/menu?type=ayce&modality=carta`

---

## Phase 5 — Quality Gates

- [x] **T5.1** Run `pnpm vitest run --coverage app/features/menu/composables/` → ≥ 70%
- [x] **T5.2** Run `pnpm biome check .` → zero errors
- [x] **T5.3** Run `pnpm vue-tsc --noEmit` → zero errors
- [x] **T5.4** Run full test suite `pnpm vitest run` → all pass
- [x] **T5.5** Manual: type toggle changes accent + URL + grid
- [x] **T5.6** Manual: modality toggle shows prices in carta, "Incluido" in buffet
- [x] **T5.7** Manual: Wings category shows sauce picker
- [x] **T5.8** Manual: Drinks section shows group headers
- [x] **T5.9** Manual: Category chips scroll to correct section
- [x] **T5.10** Manual: Language toggle switches all content to English
