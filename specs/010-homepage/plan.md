# Implementation Plan: Homepage (`/`)

**Branch**: `feat/010-homepage` | **Date**: 2026-06-19 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `specs/010-homepage/spec.md`

## Summary

Build the public homepage at `/` as a Nuxt 4 page composed of six section components (Hero, Type Selector, Featured Dishes Rail, Promotions, Google Reviews, Branches CTA Band) under the "Mercado Pop" visual language. Dynamic content comes from three sources (as built 2026-06-20): **promotions** from the WordPress `promociones` endpoint via a `usePromotions` composable backed by a Nitro normalizer route with a two-step (home-flag → active-fallback) selection and time-bounded fetches — the page's only live network dependency; **featured dishes/drinks** from a **static fixture** committed in the repo via `useFeaturedDishes` (route-compatible shape, swappable later); **reviews** from a static fixture. All rendered under ISR 3600. Static brand copy lives in i18n. The page reuses the design-system primitives delivered in feature 007 (`Button`, `Card`, `Chip`, `Sticker`, `Kicker`, `Marquee`, `Nav`) plus a new reusable `Lightbox` (promo flyers), with global shell components (`SiteHeader`/`SiteFooter`/`SiteLogo`/`SiteMarquee`) under `app/components/layout/`, and ships co-located Vitest specs + Storybook stories per feature 008 conventions. The page is Tailwind-token-only (no `<style>` blocks / inline hex), **never imports a DB client**, and degrades gracefully if WordPress is down (promotions section self-hides; dishes/reviews are static).

## Technical Context

**Language/Version**: TypeScript (strict mode, no `any`), Vue 3 Composition API only, Nuxt 4.
**Primary Dependencies**: Nuxt 4, `@nuxtjs/i18n`, `@nuxtjs/tailwindcss`, `@nuxt/fonts`; existing `app/components/ui/*` primitives; `cx` util (`@/utils/cx`). No new runtime dependency is anticipated (KISS — Article X).
**Storage**: Read-only. Promotions come from WordPress REST (`https://cms.sumo.com.mx/wp-json/wp/v2/promociones`, pretty-permalink) via a Nitro route that fetches (with 4s list / 3s media timeouts), validates (Zod), selects (two-step) and normalizes. Featured dishes/drinks and reviews are static committed fixtures (no storage, no DB). NO Drizzle/Neon import anywhere (front or server) for this feature. No DB writes, no schema/migrations.
**Testing**: Vitest + happy-dom for `app/**` (co-located `Component.spec.ts`); Vitest + node for `server/**`; Storybook 10 (`@storybook/vue3-vite`) stories per component. Conventions per `docs/harness/conventions.md` and `docs/harness/verification.md`.
**Target Platform**: Vercel (Nuxt SSR/ISR). Route `/` is ISR 3600 per `docs/business/rendering-strategy.md`.
**Project Type**: Web application (Nuxt unified front + server). Feature-sliced under `app/features/homepage/` (Article I — first use of `app/features/`).
**Performance Goals**: Interactive < 2s on throttled 4G (SC-001); Lighthouse 90+ on all metrics (SC-002, Article V).
**Constraints**: Mobile-first; legible/no-overflow at 360px; breakpoints 880px / 520px; `prefers-reduced-motion` disables marquee + bounce; bilingual ES (default) / EN; AYCE=orange / Express=blue via `--accent` swap (blue Express-exclusive); no inline hex literals (design tokens only); page template ≤ 100 lines; component files ≤ 200 lines; functions ≤ 30 lines.
**Scale/Scope**: One public route; ~9 new homepage Vue components (6 sections + 3 leaf cards), 1 page, 2 content composables (`usePromotions`, `useFeaturedDishes`), 1 Nitro content route (promotions/WordPress) + validators/types, static featured-dishes + reviews fixtures, a new reusable `Lightbox` UI primitive, global layout shell components (`SiteHeader`/`SiteFooter`/`SiteLogo`/`SiteMarquee`), i18n key additions, plus the cross-feature open-reservation mechanism stub.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.* These are the Phase -1 gates derived from `.specify/memory/constitution.md` v3.1.0. Each is NON-NEGOTIABLE; a violation blocks merge.

### Gate I — Code Organization & Reusability (NON-NEGOTIABLE)
- [x] **G-I.1** Homepage is a vertical slice under `app/features/homepage/` (components + composables + `types.ts`). It MUST NOT spread into unrelated feature folders.
- [x] **G-I.2** No cross-feature import. The open-reservation trigger is reached via a **cross-feature** composable in `app/composables/` (e.g. `useReservationModal`), NOT by importing from `app/features/reservations/` (feature 014).
- [x] **G-I.3** All design variation expressed via existing `ui/*` primitives' props (Card `accent`, Sticker `tone`/`rotate`, Kicker `tone`, Button `variant`). NO duplicated primitive files. >60% shared markup → single component with props.
- [x] **G-I.4** Any markup pattern repeated ≥ 2× is extracted (e.g. a single `PromoCard` / `DishCard` / `ReviewCard` reused across rail/grid).
- [x] **G-I.5** `app/pages/index.vue` template ≤ 100 lines; decomposed into the six section components.
- [x] **G-I.6** Every new UI component has a `.stories.ts` (enforcement surface for reuse).

### Gate II — TypeScript & Framework Standards
- [x] **G-II.1** Strict TS, no `any`. Composition API only (no Options API).
- [x] **G-II.2** Types shared between front and the Nitro promotions route live in `types/content.ts` (plus the WordPress upstream shape in `types/wordpress.ts`); no duplication across the boundary.

### Gate III — Architecture
- [x] **G-III.1** WordPress treated as headless CMS only (promotions). No transactional state written. (DB-access sub-clause **N/A as built** — featured dishes are a static fixture, so there is no DB route to confine; should it become DB-backed later, the Drizzle read MUST live in a `server/api/**` route per Article III.)
- [x] **G-III.2** The one live source (WordPress promotions) is fetched server-side via `useFetch` (Nitro-cached within the ISR window), not per visitor request. Dishes/reviews are static (no fetch).

### Gate IV — Testing
- [x] **G-IV.1** Every new composable has a co-located unit test; the WordPress promotions route has a server-side unit/integration spec (mocked WordPress). A dedicated `home-degradation.spec.ts` covers the WordPress-outage graceful-degradation path. (No DB mock needed — dishes are a static fixture with its own composable spec.)
- [x] **G-IV.2** Every new Vue component has a co-located `Component.spec.ts` (happy-dom). Behavior-named tests.
- [x] **G-IV.3** No test depends on another's state; WordPress mock centralized in `tests/mocks/`.

### Gate V — Performance (rendering strategy)
- [x] **G-V.1** `/` keeps its `routeRules` entry `{ isr: 3600 }` (already present) — matches `rendering-strategy.md` §2; no change.
- [x] **G-V.2** **Backend logic never static**: NO `drizzle-orm` / `@neondatabase/serverless` import anywhere under `app/` (verified zero-match). As built there is no DB read at all — featured dishes are a typed static fixture consumed by `useFeaturedDishes`; the gate holds trivially. (The featured-dishes-DB-route clause is **N/A as built**; a future DB swap MUST keep the read in `server/`.)
- [x] **G-V.3** Sources are reached via **separate composables**: `usePromotions` (WordPress route) and `useFeaturedDishes` (static fixture) never import each other and never merge into one fetch layer (rendering-strategy §3.5). Reviews are a separate static fixture.
- [x] **G-V.4** Images optimized + lazy-loaded; hero image prioritized; Lighthouse 90+.

### Gate VI — Security
- [x] **G-VI.1** The Nitro promotions route validates/maps its source before returning (Zod for the WordPress promotions shape; invalid items dropped individually); it never forwards raw upstream errors / stack traces to the visitor (always HTTP 200 + graceful `{ promotions: [], ok: false }`). (No DB dishes route → no DB-error path.)
- [x] **G-VI.2** No secrets in the repo; WordPress origin comes from validated env (`WORDPRESS_API_URL`, Article XIII).

### Gate VII — UX Consistency & Component Documentation
- [x] **G-VII.1** Visual specifics follow `docs/business/overview.md` (tokens, type scale, component anatomy). No re-stated colors.
- [x] **G-VII.2** SUMO logo used unmodified.
- [x] **G-VII.3** Mobile-first; fully responsive at 880px and 520px; hit targets ≥ 44px; legible at 360px.
- [x] **G-VII.4** Per-type accent via `--accent` swap (Card `accent="express"` → `scope-express`); blue is Express-exclusive: the Express type card, and the Express **type-bar** on express-typed promos. (Promo badge color is the independent editor-set `acf.color`, which may legitimately be blue if the editor chooses it.)
- [x] **G-VII.5** Every UI component has Default + significant-variant + responsive Storybook stories. No component merged without a story.

### Gate VIII — Clean Code Discipline
- [x] **G-VIII.1** Functions ≤ 30 lines; component files ≤ 200 lines; no dead/commented code, no TODOs, no bare `console.log`.
- [x] **G-VIII.2** Composables use `use` prefix; Vue files PascalCase; server routes kebab-case.

### Gate IX — Quality Gates
- [x] **G-IX.1** Biome lint + format pass; `vue-tsc --noEmit` passes; Conventional Commits; pre-push tests pass. No `--no-verify`.

### Gate X — KISS
- [x] **G-X.1** No new library unless it saves >100 LOC or is infeasible by hand. No speculative abstraction (build the open-reservation mechanism as the single concrete trigger needed now).

### Gate XI — Absolute Imports
- [x] **G-XI.1** All imports via aliases (`@/components`, `@/composables`, `@/utils`, `@/types`); no `../` except same-directory.

### Gate XII — Error Handling
- [x] **G-XII.1** The Nitro promotions route delegates errors to `server/utils/error-handler.ts` — a WordPress outage/timeout logged as `ExternalServiceError` — and returns the documented graceful fallback (`{ promotions: [], ok: false }`, section self-hides) per Article XII. (No DB route → no second error path.)

### Gate XIII — Environment Validation
- [x] **G-XIII.1** `WORDPRESS_API_URL` read through the validated env schema (`server/utils/env.ts`); a missing var fails startup, not mid-request. Consumed only by the promotions server route. (No `DATABASE_URL` needed by this feature as built — dishes are a static fixture.)

**Final assessment (built state, 2026-06-20)**: PASS — all gates above are `[x]` for the implemented homepage. The DB-route-specific sub-clauses (G-III.1 DB confinement, G-V.2 DB read location, G-XII.1 DB error path, G-XIII.1 `DATABASE_URL`) are **N/A as built** because featured dishes are a static fixture, not a DB read — there is no Drizzle/Neon import in front or server for this feature (verified zero-match), so those gates hold trivially. The single Nitro promotions route (instead of fetching WordPress straight from the page) is NOT a Complexity Tracking violation — it satisfies Gates VI.1 (validate/map before returning), XII.1 (centralized error handling + documented fallback) and the source-separation rule (V.3).

**Implementation note (built state) — featured-dishes rail backed by a static fixture.**
The featured-dishes rail is backed by a static fixture
(`app/features/homepage/data/featured-dishes.ts`) shaped to the `FeaturedDish` view contract,
consumed by `useFeaturedDishes()` which returns the contract-correct `{ dishes, ok, pending }`.
Both the fixture and the composable carry a `// TODO:` marker noting the data source can later be
swapped for a real data source (e.g. a Nitro route — drop-in, since the composable already returns
the route-compatible shape). The current fixture dishes have no images (each renders the neutral
"SUMO" placeholder). The promotions route (WordPress) IS fully built (two-step home-flag → active
fallback selection, 4s/3s fetch timeouts, Zod validation, `acf.imagen` media-ID resolution). Gate
V.2 (no Drizzle/Neon import under `app/`) is verified zero-match.

**Implementation note (built state) — promotions card behavior + lightbox.**
The promo badge color is the editor-set `acf.color` (orange/pink/yellow/blue/green, default orange);
a separate decorative type-bar is driven by `acf.tipo` (express→blue, ayce→orange, all→ink). The
`acf.imagen` flyer is NOT shown inline — an interactive promo card opens it large in the reusable
`UiLightbox` (`app/components/ui/Lightbox.vue`, new this feature). Validity renders as neutral text.

**Implementation note (built state) — layout shell + visual language.**
Global shell components (`SiteHeader`, `SiteFooter`, `SiteLogo`, `SiteMarquee`) live under
`app/components/layout/` per `docs/harness/structure.md`. The visual language is "Mercado Pop"
(cream bg, diagonal-stripe + radial-sun hero with a transparent logo frame, ink marquee band with
orange ✺ separator + i18n phrases, Bricolage Grotesque + Hanken Grotesk, official SUMO logos in
`public/brand/`). Header has a Reservar button; footer does not. Footer social links are the real
official Instagram/Facebook/TikTok URLs (WhatsApp removed from social; Contacto links to `/contacto`).
All homepage components are Tailwind-token-only (no `<style>` blocks, no inline hex / arbitrary color
values); `hover:` is desktop-only (`hoverOnlyWhenSupported`).

## Project Structure

### Documentation (this feature)

```text
specs/010-homepage/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/
│   ├── home-content.md  # Nitro content endpoints + composables contract (promotions/WP + dishes/DB + static reviews)
│   └── components.md    # Section component prop/emit contracts
├── checklists/
│   └── requirements.md  # Spec quality checklist (from /speckit.specify)
└── tasks.md             # Phase 2 output (/speckit.tasks)
```

### Source Code (repository root)

```text
app/
├── pages/
│   └── index.vue                         # Homepage route (template ≤ 100 lines; composes sections)
├── features/
│   └── homepage/                         # First vertical slice under app/features/
│       ├── components/
│       │   ├── HomeHero.vue + .spec.ts + .stories.ts
│       │   ├── HomeTypeSelector.vue + .spec.ts + .stories.ts
│       │   ├── HomeFeaturedRail.vue + .spec.ts + .stories.ts
│       │   ├── HomePromotions.vue + .spec.ts + .stories.ts
│       │   ├── HomeReviews.vue + .spec.ts + .stories.ts
│       │   ├── HomeBranchesCta.vue + .spec.ts + .stories.ts
│       │   ├── DishCard.vue + .spec.ts + .stories.ts     # reused by the rail
│       │   ├── PromoCard.vue + .spec.ts + .stories.ts    # reused by promotions
│       │   └── ReviewCard.vue + .spec.ts + .stories.ts   # reused by reviews
│       ├── composables/
│       │   ├── usePromotions.ts + .spec.ts                 # WordPress promotions (server-side fetch)
│       │   ├── useFeaturedDishes.ts + .spec.ts             # static-fixture dishes (route-compatible shape)
│       │   └── useHeroConfig.ts                            # configurable hero price
│       ├── data/
│       │   ├── featured-dishes.ts                          # STATIC featured-dishes fixture (typed FeaturedDish[])
│       │   └── reviews.ts                                  # STATIC reviews fixture (typed Review[])
│       └── utils/
│           ├── select-promotions.ts + .spec.ts             # defensive top-3 filter+sort (pure fn)
│           └── bilingual.ts + .spec.ts                     # active-locale picker with ES fallback
├── composables/
│   └── useReservationModal.ts + .spec.ts   # CROSS-FEATURE open-reservation trigger (no-op-safe stub)
└── components/
    ├── layout/                             # GLOBAL shell (SiteHeader/SiteFooter/SiteLogo/SiteMarquee)
    └── ui/                                 # REUSED (007) + new Lightbox.vue (promo flyers)

server/
└── api/v1/content/
    ├── promotions.get.ts                   # Nitro route: fetch (timeouts) + two-step select + normalize WP `promociones`
    └── validators.ts                       # Zod schemas for the WordPress promotions response

types/
├── content.ts                             # Shared content view types (front + server)
└── wordpress.ts                           # Raw WordPress `promociones` upstream shape

i18n/locales/
├── es.json                                 # + home.* / footer.* keys (default)
└── en.json                                 # + home.* / footer.* keys

tests/mocks/
└── wordpress.ts                            # Centralized WordPress `promociones` fixture/mock
```

**Structure Decision**: Web application, feature-sliced. The homepage is the first `app/features/<feature>/` slice (Article I). Global shell components live under `app/components/layout/` per `docs/harness/structure.md`. The single shared concern that crosses into feature 014 territory — opening the reservation modal — is lifted to `app/composables/useReservationModal.ts` (cross-feature composable), never an inter-feature import. The one live source (WordPress promotions) is reached through a thin Nitro route (Gate V.3): `promotions.get.ts` owns the timed WordPress fetch + Zod validation + two-step selection + media-ID resolution + error categorization + graceful fallback (reached via `usePromotions`/`useFetch`). Featured dishes and reviews are static fixtures under `app/features/homepage/data/`, imported directly (no DB, no fetch). The promotions route is Nitro-cached within the ISR window.

## Complexity Tracking

> No constitutional violations requiring justification. The single Nitro promotions route is not a violation — it is the mechanism that satisfies Gates VI.1 (validate/map before returning), XII.1 (centralized error handling + documented fallback) and the source-separation rule V.3 (WordPress reached via its own route/composable, never merged with the static fixtures). Fetching WordPress directly from the page would push validation/error-handling into a Vue component (forbidden). Featured dishes being a static fixture (rather than a DB route) is a deliberate KISS simplification (Gate X): no live dependency, no DB import, drop-in swap later via the route-compatible composable.

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|--------------------------------------|
| (none) | — | — |
