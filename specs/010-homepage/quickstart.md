# Quickstart: Homepage (`/`)

How to build, run, and verify feature 010 locally. Assumes features 007 (design system) and 008 (test setup) are merged.

## Prerequisites

- `pnpm install` (frozen lockfile).
- `.env.local` populated (Article XIII), including `WORDPRESS_API_URL` (bare origin `https://cms.sumo.com.mx`, used by the promotions route). Copy from `.env.example` if needed. (No `DATABASE_URL` is needed for this feature — featured dishes are a static fixture.)
- Branch: `feat/010-homepage`.

## Run

```bash
pnpm dev            # Nuxt dev server → http://localhost:3000/
pnpm storybook      # Storybook → review HomeHero/TypeSelector/etc. stories in isolation
```

## Build order (follows tasks.md)

1. **Shared types** — `types/content.ts` + `types/wordpress.ts` (Bilingual, FeaturedDish, Promotion, Review, HomeContent, FeaturedDishesResult, PromotionsResult, HeroConfig; raw WP shape).
2. **Promotions route + validators** — `server/api/v1/content/promotions.get.ts` (timeouts, two-step select, `acf.imagen` resolution) + `validators.ts`; centralized WordPress mock in `tests/mocks/wordpress.ts`. Test first (Article IV — server logic TDD).
3. **Featured-dishes fixture** — `app/features/homepage/data/featured-dishes.ts` (static, typed `FeaturedDish[]`) consumed by `useFeaturedDishes`. NOT a DB route.
4. **Reviews fixture** — `app/features/homepage/data/reviews.ts` (static, typed `Review[]`).
5. **Pure util** — `app/features/homepage/utils/select-promotions.ts` (+ spec, defensive top-3) and `bilingual.ts`. Test first.
6. **Composables** — `usePromotions` (+ spec); `useFeaturedDishes` (+ spec); `useHeroConfig`; `app/composables/useReservationModal.ts` (+ spec).
7. **Leaf cards + Lightbox** — `DishCard`, `PromoCard`, `ReviewCard`, `app/components/ui/Lightbox.vue` (each + spec + stories).
8. **Sections + shell** — `HomeHero`, `HomeTypeSelector`, `HomeFeaturedRail`, `HomePromotions`, `HomeReviews`, `HomeBranchesCta` + layout shell `SiteHeader`/`SiteFooter`/`SiteLogo`/`SiteMarquee` (each + spec + stories).
9. **Page** — `app/pages/index.vue` (template ≤ 100 lines, wires composables + reviews fixture + sections + SEO meta).
10. **i18n** — add `home.*` keys to `i18n/locales/es.json` and `en.json`.

## Verify (maps to spec Success Criteria)

```bash
pnpm check          # Biome lint + format (Gate IX)
pnpm typecheck      # vue-tsc --noEmit, no `any` (Gate II)
pnpm test           # Vitest: app/** (happy-dom) + server/** (node). New specs must pass.
pnpm build          # Production build succeeds
```

Manual / Lighthouse checks:

| Check | Maps to | How |
|-------|---------|-----|
| Interactive < 2s on 4G | SC-001 | Lighthouse throttled 4G on `/` |
| Lighthouse 90+ all metrics | SC-002, Gate V | Lighthouse on `/` |
| Hero legible, no overflow @360px | SC-003 | DevTools device toolbar @360px |
| AYCE→`/menu?type=ayce`, Express→`/menu?type=express` | SC-004 | Click both cards |
| ≤ 3 active promos, no inactive | SC-005 | Seed >3 promos incl. inactive + express + home-flagged in WP; confirm two-step selection |
| Promo flyer opens in lightbox | FR-016a | Click a promo with a flyer → `UiLightbox` opens; Esc/backdrop closes |
| WordPress promotions down → static (incl. dishes + reviews) still render, no error shown | SC-006 | Point `WORDPRESS_API_URL` at an unreachable host; reload `/`; promotions section hidden |
| Featured dishes always render (static fixture) | FR-012 | Rail appears regardless of WordPress state (dishes show "SUMO" placeholders) |
| Reviews always render (static) | FR-017 | Reviews appear regardless of WordPress state |
| Content edit reflects within ISR window | SC-007 | Edit a promo in WP; reload after revalidation |
| Reduced-motion → no animation | SC-008 | OS "reduce motion" on; confirm marquee static, no bounce |
| Language toggle updates all strings | SC-009 | Toggle ES↔EN in nav |

## Constitution self-check before PR (must all be true)

- [x] No `drizzle-orm` / `@neondatabase/serverless` import anywhere (front or server) for this feature — featured dishes are a static fixture (Gate V.2 holds trivially).
- [x] Promotions fetched via `useFetch` through `/api/v1/content/promotions` (WordPress), not `$fetch` per render; featured dishes from the static fixture via `useFeaturedDishes`; the two are separate composables, never merged (Gates III.2, V.3).
- [x] Featured dishes + reviews come from the static fixtures (`app/features/homepage/data/*.ts`), not from WordPress/DB/Google (FR-012, FR-017).
- [x] `/` `routeRules` unchanged (`isr: 3600`) (Gate V.1).
- [x] `app/pages/index.vue` template ≤ 100 lines (Gate I.5).
- [x] Every new component has `.spec.ts` + `.stories.ts` (Gates IV.2, VII.5).
- [x] Tailwind-token-only (no `<style>` blocks, no inline hex / arbitrary color values):
      `grep -rEn '(style=|: ?)#[0-9a-fA-F]{3,8}\b' app/features/homepage/ app/pages/index.vue` → zero matches.
- [x] All imports use `@/` aliases (Gate XI).
- [x] Blue is Express-exclusive as an accent: the Express type card + the express type-bar on promos (the promo badge color is the independent editor `acf.color`) (Gate VII.4).
- [x] WordPress outage/timeout handled via `error-handler.ts`; no stack/upstream body leaked (Gates VI.1, XII.1).
