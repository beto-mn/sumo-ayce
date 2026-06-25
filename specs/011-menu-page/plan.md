# Implementation Plan: Menu / Bebidas Page

**Branch**: `feat/018-menu-page` | **Date**: 2026-06-23 | **Spec**: `specs/011-menu-page/spec.md`

---

## Summary

Build the `/menu` SSR+ISR page for SUMO AYCE. The feature is **mostly frontend** — the backend (DB schema, seeds, query functions) is complete. The page fetches `FullMenuResult` server-side via `useAsyncData`, supports `?type` and `?modality` query params, renders type/modality toggles, category chips (scroll navigation), a dish grid with optional sauce picker, and a grouped drinks section. The `--accent` CSS variable swaps orange↔blue on type change.

---

## Technical Context

**Language/Version**: TypeScript 5 strict (no `any`), Vue 3 Composition API, Nuxt 4  
**Primary Dependencies**: `@nuxtjs/i18n`, `@nuxt/image`, `vue-tsc`, Biome, Vitest, Storybook 10  
**Backend**: All menu queries exist in `server/utils/menu-queries.ts`. Only one new file needed: `server/api/v1/menu/index.get.ts`  
**Testing**: Vitest co-located (`*.test.ts` / `*.spec.ts`); coverage threshold ≥ 70% for composables  
**Target Platform**: Vercel (ISR function), mobile-first responsive  
**Performance Goals**: Lighthouse ≥ 90; ISR 3600 s  
**Constraints**: Page template ≤ 100 lines; function bodies ≤ 30 lines; no DB client under `app/`; per-type accent via single `:style` swap

---

## Phase -1 Gates (NON-NEGOTIABLE)

### Gate 1 — routeRules entry present
`nuxt.config.ts` MUST contain `'/menu': { isr: 3600 }`. Already present ✅ — verify before starting.

### Gate 2 — No DB client under `app/`
`grep -r 'drizzle-orm\|@neondatabase' app/` MUST return empty.

### Gate 3 — Feature folder structure
All new source files MUST live under `app/features/menu/` or `app/pages/menu.vue`.

### Gate 4 — Page template ≤ 100 lines
`app/pages/menu.vue` template section MUST NOT exceed 100 lines.

### Gate 5 — Storybook stories for every new component
`MenuDishCard.stories.ts`, `MenuSaucePicker.stories.ts`, `MenuTypeToggle.stories.ts`, `MenuModalityToggle.stories.ts` MUST exist with Default + key variants.

### Gate 6 — Biome + vue-tsc clean
`pnpm biome check .` and `pnpm vue-tsc --noEmit` MUST both pass with zero errors.

### Gate 7 — Composable test coverage ≥ 70%
`useMenuFilters.test.ts` MUST achieve ≥ 70% line coverage.

### Gate 8 — i18n keys present in both locales
All 35 `menu.*` keys MUST exist in both `es.json` and `en.json`.

### Gate 9 — Images in `public/menu/`
The following directories MUST exist (non-empty) before Phase 3:
`public/menu/ayce/`, `public/menu/ala-carta/`, `public/menu/drinks/`, `public/menu/kids/`, `public/menu/desserts/`

---

## Constitution Check

| Article | Requirement | Status |
|---------|-------------|--------|
| I | Feature under `app/features/menu/`; page ≤ 100 lines | ENFORCED |
| II | No `any`, Composition API only | ENFORCED |
| III | Single Nuxt 4 repo; no DB in `app/`; `useAsyncData` for menu fetch | ENFORCED |
| IV | Co-located Vitest; ≥ 70% composable coverage | ENFORCED |
| V | Lighthouse ≥ 90; `isr: 3600` in routeRules | ENFORCED |
| VI | No auth for public route; server-side Zod validation | COMPLIANT |
| VII | Mobile-first; `--accent` swap; Storybook for all new components | ENFORCED |
| VIII | Functions ≤ 30 lines; files ≤ 200 lines; no `console.log` | ENFORCED |
| IX | Biome + vue-tsc pre-commit; Vitest pre-push | ENFORCED |
| X | No new libraries; local `ref` for sauce state; `useMenuFilters` | ENFORCED |
| XI | `@/` aliases; no `../` across directories | ENFORCED |
| XII | API errors → inline error state; no internals exposed | ENFORCED |
| XIII | No new env vars | N/A |

---

## Implementation Phases

### Phase 0 — Pre-flight & i18n

**Goal**: Verify gates and add i18n keys before writing UI code.

1. Verify `'/menu': { isr: 3600 }` in `nuxt.config.ts` ✅
2. Add all 35 `menu.*` keys to `locales/es.json` and `locales/en.json`
3. Copy images to `public/menu/` subfolders:
   ```bash
   cp -r "/Users/betonajera/Documents/Projects/Clients/SUMO/Assets/Menu/AYCE/AYCE/."        public/menu/ayce/
   cp -r "/Users/betonajera/Documents/Projects/Clients/SUMO/Assets/Menu/AYCE/A la carta/."  public/menu/ala-carta/
   cp -r "/Users/betonajera/Documents/Projects/Clients/SUMO/Assets/Menu/AYCE/Drinks/."      public/menu/drinks/
   cp -r "/Users/betonajera/Documents/Projects/Clients/SUMO/Assets/Menu/AYCE/Kids/."        public/menu/kids/
   cp -r "/Users/betonajera/Documents/Projects/Clients/SUMO/Assets/Menu/AYCE/Desserts/."    public/menu/desserts/
   mkdir -p public/menu/express
   ```
4. Create `app/features/menu/types.ts` with any local page state types

**Gate check**: Gates 1, 8, 9

---

### Phase 1 — API Route

**Goal**: Create the thin `GET /api/v1/menu` route.

1. Create `server/api/v1/menu/index.get.ts`:
   - Zod-validate `type` and `modality`
   - Call `getFullMenu({ locationType: type, modality })`
   - Map each dish's `imageUrl` via `resolveImageUrl()` function
   - Return the `FullMenuResult` JSON
2. Smoke test with `curl "http://localhost:3000/api/v1/menu?type=ayce"` in dev

**Gate check**: Gates 2, 6

---

### Phase 2 — `useMenuFilters` Composable (test-first)

**Goal**: Implement and fully test the filter/state management composable.

1. Write `useMenuFilters.test.ts` covering:
   - Default state (type=ayce, modality=buffet)
   - `setType('express')` resets modality to 'buffet', resets activeCategory
   - `setModality('carta')` updates modality
   - `showModalityToggle` is false when type=express
   - `accentStyle` returns correct CSS variable per type
   - URL sync: `setType` calls `router.replace`
2. Implement `useMenuFilters.ts`

**Gate check**: Gate 7

---

### Phase 3 — Components

**Goal**: Build all components bottom-up.

1. `MenuSaucePicker.vue` — displays sauce list from props; local selected state
2. `MenuDishCard.vue` — dish card with image, name, desc, price/incluido, badge, sauce picker
3. `MenuDishGrid.vue` — renders list of `FullMenuCategory` as sections with scroll anchors
4. `MenuDrinkSection.vue` — renders drinks grouped by `drinkGroup`
5. `MenuCategoryChips.vue` — chips with IntersectionObserver for active tracking
6. `MenuTypeToggle.vue` — two-option type switcher
7. `MenuModalityToggle.vue` — two-option modality switcher (conditional)
8. `MenuShell.vue` — orchestrates all of the above; accepts `FullMenuResult` + composable

**Spec files**:
- `MenuDishCard.spec.ts` — FR-030 test cases
- `MenuSaucePicker.spec.ts` — renders sauces, selects one

**Storybook**:
- `MenuDishCard.stories.ts` — Default, NoImage, WithBadge, WithSauce, CartaWithPrice
- `MenuSaucePicker.stories.ts` — Default, SelectedState
- `MenuTypeToggle.stories.ts` — AYCE, Express
- `MenuModalityToggle.stories.ts` — Buffet, Carta

**Gate check**: Gates 3, 4, 5, 6

---

### Phase 4 — Page Assembly

**Goal**: Wire everything in `app/pages/menu.vue`.

1. Implement `menu.vue`:
   - `useAsyncData` calling `GET /api/v1/menu` with computed key on type+modality
   - Extract `?type` and `?modality` from `useRoute().query`
   - `useHead` for SEO meta
   - Render `<MenuShell>` or error state
   - Template ≤ 100 lines
2. Verify with `pnpm dev` at `/menu?type=ayce` and `/menu?type=express`

**Gate check**: Gates 1, 2, 4

---

### Phase 5 — Quality Gates

**Goal**: All checks pass.

1. `pnpm vitest run --coverage app/features/menu/composables/`
2. `pnpm biome check .`
3. `pnpm vue-tsc --noEmit`
4. Manual acceptance checks from `quickstart.md`

**Gate check**: All 9 gates

---

## Risk Register

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| `piñada.webp` UTF-8 filename breaks on Vercel | Low | Medium | Vercel serves UTF-8 filenames correctly; test in dev |
| `mac_&_cheese.webp` with `&` causes URL encoding issue | Low | Low | Nuxt encodes static asset URLs; test in dev |
| 237 MB of images exceeds Vercel deploy limit | Low | High | Vercel static asset limit is per-file (100 MB), not total. All WebP files are < 1 MB each. |
| `getFullMenu` returns empty categories for certain type/modality | Low | Medium | Test with real DB data; handle empty state per category |
| IntersectionObserver not available in SSR | Medium | Low | Guard with `process.client` or `useNuxtApp().$isClient`; chip scroll is client-only |
