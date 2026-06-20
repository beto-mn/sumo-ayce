# Contract: Homepage component surface

Homepage section/leaf components live under `app/features/homepage/components/` (Article I vertical slice) and reuse `app/components/ui/*` primitives. Global shell components (`SiteHeader`, `SiteFooter`, `SiteLogo`, `SiteMarquee`) live under `app/components/layout/` per `docs/harness/structure.md`. A new reusable `Lightbox` primitive lives under `app/components/ui/`. Every component ships co-located `.spec.ts` (happy-dom) + `.stories.ts` (Default + variants + responsive). Tailwind-token-only — no `<style>` blocks, no inline hex, no arbitrary color/text/shadow/border values; `hover:` is desktop-only (`hoverOnlyWhenSupported`). PascalCase filenames.

## Page — `app/pages/index.vue`

- Template ≤ 100 lines (Article I). Composes the six section components in order; no business logic beyond wiring `usePromotions` (WordPress) + `useFeaturedDishes` (static fixture) + the static reviews fixture + `useHeroConfig` (price). (`useReservationModal` is wired in the global `SiteHeader`, not the page.)
- Promotions are passed through `select-promotions` defensively before reaching `HomePromotions` (the route already selects/sorts/slices).
- Sets bilingual SEO meta via `useSeoMeta`.

## Section components

| Component | Props (in) | Emits / actions | Reused primitives | Key behavior |
|-----------|-----------|-----------------|-------------------|--------------|
| `HomeHero` | `price: string` | — | `Kicker`, `Sticker` (price) | Headline "ALL YOU CAN EAT" (display token), kicker pill, price sticker, official SUMO vertical logo in a rotated **transparent-fill** frame on the Mercado Pop (cream stripe + radial-sun) background. Legible/no-overflow at 360px. (The marquee band is the global `SiteMarquee` below the nav, NOT in the hero.) |
| `HomeTypeSelector` | — | navigates (NuxtLink) | `Card` (`accent="ayce"` / `accent="express"`) | Two cards: AYCE→`/menu?type=ayce` (orange), Express→`/menu?type=express` (blue via `scope-express`). Keyboard-operable, accessible names. Blue confined here. |
| `HomeFeaturedRail` | `dishes: FeaturedDish[]` (from `useFeaturedDishes` static fixture) | — | `DishCard` | Horizontal scroll-snap rail with a visible styled scrollbar + adaptive card width. `dishes.length === 0` → render nothing (rail hidden). |
| `HomePromotions` | `promotions: Promotion[]` (from `usePromotions` / WordPress) | — | `PromoCard` | Renders ≤ 3 cards (already selected/sorted upstream). `[]` → hidden. Owns the `UiLightbox` state and opens the flyer when a `PromoCard` emits `open`. |
| `HomeReviews` | `reviews: Review[]` (static fixture) | — | `ReviewCard` | Social proof grid/rail. Static fixture is always non-empty; `[]` → hidden (defensive). |
| `HomeBranchesCta` | — | `openReservation()` + NuxtLink `/sucursales` | `Button` | "Find a branch" → `/sucursales`; "Reserve" → `useReservationModal().openReservation()` (no-op-safe). |

## Reusable leaf cards (extracted to satisfy Article I.4 — pattern repeated ≥ 2×)

| Component | Props | Reused primitives | Notes |
|-----------|-------|-------------------|-------|
| `DishCard` | `dish: FeaturedDish` | `Card`, `Sticker` (badge if present) | `imageUrl === null` → neutral "SUMO" placeholder. Adaptive width (`78vw`, capped). Name + description; bilingual fields render active locale w/ ES fallback. |
| `PromoCard` | `promo: Promotion` | `Card`, `Sticker` (badge) | Badge tone from `acf.color` (orange/pink/yellow/blue/green, default orange). Decorative type-bar from `acf.tipo` (express→blue, ayce→orange, all→ink). Validity neutral text. Flyer NOT inline; with `imageUrl` the card is interactive and emits `open` (`{ src, alt }`) for the lightbox. Bilingual fields render active locale w/ ES fallback. |
| `ReviewCard` | `review: Review` | `Card` | Author, rating (stars), bilingual text w/ ES fallback. |

## New reusable UI primitive

| Component | Props | Emits | Notes |
|-----------|-------|-------|-------|
| `UiLightbox` (`app/components/ui/Lightbox.vue`) | `open: boolean`, `src: string \| null`, `alt?: string` | `close` | Teleported `role="dialog" aria-modal`. Opens when `open && src`. Esc / backdrop click → `close`. Focus moves to the close button and restores on close; body scroll locked while open. Shows the image `object-contain` ≤ 90vw/90vh. Used by `HomePromotions` for promo flyers. |

## Cross-cutting contracts (every component)

| Rule | Expectation |
|------|-------------|
| i18n | All static labels via `useI18n()` `t('home.*')`; ES default; no hard-coded strings. |
| Bilingual content | Editorial `Bilingual` fields render the active locale; fall back to `es` when empty. |
| Reduced motion | No animation under `prefers-reduced-motion`; reveal animates `transform` only (never `opacity` from 0); marquee paused. |
| Responsive | Mobile-first; correct at 880px and 520px; hit targets ≥ 44px. |
| Accent discipline | `--accent` swap only; blue is Express-exclusive: the Express type card + the Express type-bar on express-typed promos. (The promo badge color is the independent editor-set `acf.color` and may be any of the 5 tones.) |
| Tokens | No `<style>` blocks; no inline hex; no arbitrary color/text/shadow/border values — Tailwind token classes / `var(--token)` only. `hover:` desktop-only. |
| File size | Component file ≤ 200 lines; functions ≤ 30 lines. |
| Stories | Default + significant variants (e.g. empty state, AYCE vs Express, missing image, long text) + responsive viewport. |
| Specs | Behavior-named tests: renders required content, routes correctly, hides on empty, calls `openReservation`, respects locale fallback. |
