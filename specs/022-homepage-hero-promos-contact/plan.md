# Implementation Plan: Homepage hero font + Promotions carousel + Contact job card (022)

**Branch**: `feat/021-menu-experience-overhaul` (consolidated — no new branch) | **Date**: 2026-07-13 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `specs/022-homepage-hero-promos-contact/spec.md`

## Summary

Three client-requested changes shipped as one PR on the existing 021 branch:

- **A** — Swap the hero headline font Titan One → self-hosted Graphik Super (CSS `@font-face` + `.hero-headline` + preload link), preserving the white-fill/black-stroke logo treatment.
- **B** — Adapt the promotions content pipeline to the already-restructured WordPress ACF model (title from `title.rendered` decoded, editorial text fields removed, three responsive image media IDs resolved via a SINGLE batched media request with desktop fallback) — this fixes a live regression where the old validator drops every promotion — and present promotions as a shared, accessible full-bleed carousel (embla-carousel-vue) on both the homepage and the promotions page. Each slide overlays a **type pill** (top-left, AYCE/Express/Ambos coloured + labelled) and a **colour badge** (top-right); the carousel nav is coloured by the active slide's type. BOTH surfaces use the same `?activa=1` all-active list (NO cap, `home=1` removed); the homepage shows the "Promociones" title with no "ver todas" link.
- **C** — Add a static i18n "Bolsa de trabajo" card + phone/WhatsApp CTA (real RH number `wa.me/525584406639`, display `+52 55 8440 6639`) to the contact page.

Approach: minimal server rewrites (validators + route), one new shared UI carousel primitive lifted to `app/components/ui/` (Article I), a per-slide `<picture>` card, one new dependency (`embla-carousel-vue`), and a dependency-free HTML-entity decode util. Rendering windows unchanged (`/` ISR 3600, `/promociones` ISR 60); the carousel is client-hydrated over server-fetched promotions.

## Technical Context

**Language/Version**: TypeScript (strict), Vue 3 Composition API, Nuxt 4
**Primary Dependencies**: Nuxt 4, `@nuxtjs/i18n`, `@nuxt/fonts`, Zod (server validation), **`embla-carousel-vue` (NEW)**; Storybook 10 (`@storybook/vue3-vite`), Vitest + happy-dom + `@vue/test-utils`, Biome
**Storage**: None new. WordPress REST (`cms.sumo.com.mx`) for promotions content. Neon Postgres is NOT touched by this feature.
**Testing**: Vitest (co-located `*.spec.ts`), `@vue/test-utils`, happy-dom; Storybook stories per Article VII
**Target Platform**: Vercel (Nuxt SSR/ISR); mobile-first web
**Project Type**: Web application (Nuxt single repo, `app/` frontend + `server/` API)
**Performance Goals**: Public-page Lighthouse 90+ (Article V); hero font preloaded (LCP text); images lazy where appropriate
**Constraints**: `/` ISR 3600, `/promociones` ISR 60 (rendering-strategy.md); embla is client-only (SSR guard); no `any`; feature-folder boundaries
**Scale/Scope**: 3 CSS/config edits (Part A); ~2 server files + 2 type files (Part B pipeline); 1 new + ~3 changed UI components + stories/specs (Part B UI); 1 component + 2 locale files (Part C)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-checked after Phase 1 design.*

### Phase -1: Pre-Implementation Gates (NON-NEGOTIABLE)

#### Code Organization & Reusability (Article I)
- [x] The promotions carousel is a **shared** primitive in `app/components/ui/` (`UiPromotionsCarousel`), NOT duplicated in `app/features/homepage` and `app/features/promotions`. Both features consume the single component.
- [x] No cross-feature import: `app/features/promotions` MUST NOT import from `app/features/homepage`. Shared logic (carousel, slide card) lives in `app/components/ui/`.
- [x] `PromotionCard` (per-slide) is parameterized via props for both contexts (no variant-file duplication).
- [x] `app/pages/promotions.vue` template stays ≤ 100 lines; hero/contact edits do not push any page file over the limit.
- [x] The `<picture>`/slide markup is not copy-pasted between homepage and promotions page.

#### TypeScript & Framework (Article II)
- [x] No `any` types anywhere added/changed.
- [x] `<script setup lang="ts">` for all Vue components.
- [x] Shared `Promotion` type lives in `types/content.ts`; raw WP shape in `types/wordpress.ts`; no duplication across the frontend/server boundary.

#### Architecture & Data Sources (Article III / V §3.5)
- [x] Promotions read WordPress only; no Neon/Drizzle import anywhere under `app/`.
- [x] WordPress fetched server-side (existing route + `useFetch`/`useAsyncData`), not per-render `$fetch`.
- [x] `/` stays ISR 3600, `/promociones` stays ISR 60 in `nuxt.config.ts` routeRules (unchanged — no new routes added).

#### Testing (Article IV)
- [x] Server-side rewrites (validators, promotions route) have tests written BEFORE implementation (Red → Green).
- [x] Every changed/new component has a co-located `*.spec.ts`.
- [x] Test names describe behavior, not implementation.

#### Security (Article VI)
- [x] WordPress payload validated with Zod at the boundary (rewritten `rawPromotionSchema`); malformed items dropped individually, never crash the response.
- [x] No secrets/tokens added. Job-card phone is a documented TEST placeholder, not a secret.

#### UX Consistency & Storybook (Article VII)
- [x] Every changed/new UI component has a `*.stories.ts` with Default + variants (promo colors, missing-image fallback, single vs multi slide) + mobile/desktop breakpoints.
- [x] Mobile-first; carousel and `<picture>` breakpoints match design context (sm 520 / md 880 / lg 1200).
- [x] `prefers-reduced-motion` respected (no autoplay motion).
- [x] Per-type accent (AYCE orange / Express blue) via `--accent`/tokens, not per-rule rewrite; badge color via tokens (no inline hex).
- [x] SUMO logo/hero treatment unmodified (white fill + black stroke preserved). The CSS `@font-face`, `.hero-headline` family (`"Graphik Super"`), and preload all point at `/fonts/graphik-super.woff2`; the woff2 BINARY + license note were delivered under `public/fonts/`. Treatment/wiring + binary all done.

#### Clean Code (Article VIII)
- [x] Functions ≤ 30 lines, components ≤ 200 lines; no dead/commented code; no bare `console.log`.

#### Quality Gates & Imports (Articles IX, XI)
- [x] Biome lint/format + `vue-tsc` pass; commits use Conventional Commits.
- [x] Absolute alias imports (`@/…`); no `../` across directories.

#### KISS (Article X)
- [x] `embla-carousel-vue` justified: an accessible carousel with drag physics, snap, and a11y is > 100 lines to hand-write, and it is the agreed choice (see `specs/_batch-intake/intake.md`). See Complexity Tracking.
- [x] HTML-entity decode is a small **dependency-free** util (no new dep) — numeric (`&#215;`, `&#8211;`) + common named (`&amp;`, `&#039;`, `&quot;`, `&lt;`, `&gt;`) entities only.

**Result**: PASS — one justified dependency (`embla-carousel-vue`), no principle violations.

## Project Structure

### Documentation (this feature)

```text
specs/022-homepage-hero-promos-contact/
├── plan.md              # This file
├── spec.md              # Requirements + acceptance criteria
├── research.md          # Phase 0 — embla SSR integration, woff2 conversion, entity decode
├── data-model.md        # Phase 1 — Promotion old→new diff + raw WP shape
├── quickstart.md        # Phase 1 — how to build/verify
├── contracts/
│   └── promotions-wp.md # NEW WordPress promociones ACF contract
├── checklists/
│   └── requirements.md
└── tasks.md             # Phase 2 (/speckit.tasks)
```

### Source Code (repository root)

```text
public/fonts/
├── graphik-super.woff2          # NEW (converted from client .ttf)
├── GRAPHIK-SUPER-LICENSE.txt    # NEW license note
├── titan-one-regular.woff2      # REMOVE (no other consumer)
└── OFL-TitanOne.txt             # REMOVE

app/assets/css/base.css          # Part A: @font-face + .hero-headline font-family
nuxt.config.ts                   # Part A: preload link → graphik-super.woff2

types/
├── content.ts                   # Part B: Promotion (title:string, 3 image URLs; drop desc/validity/imageUrl)
└── wordpress.ts                 # Part B: WpPromotion/WpPromotionAcf (+ title.rendered, 3 media IDs)

server/api/v1/content/
├── validators.ts                # Part B: acfSchema/rawPromotionSchema/mapPromotion/ParsedPromotion rewrite
├── validators.spec.ts           # (co-located tests — new/updated)
├── promotions.get.ts            # Part B: resolveImages → 3 IDs + desktop fallback
├── promotions.get.spec.ts       # (updated)
└── html-entities.ts             # NEW dependency-free decode util (+ .spec.ts)

app/components/ui/
├── PromotionsCarousel.vue       # NEW shared embla carousel (Ui-prefixed) + .stories.ts + .spec.ts
├── PromotionCard.vue            # Part B: per-slide <picture> + badge overlay (+ stories/spec updated)

app/features/homepage/
├── components/HomePromotions.vue        # consumes UiPromotionsCarousel (+ stories/spec)
├── composables/usePromotions.ts         # type updates (+ spec)
└── utils/select-promotions.ts           # new Promotion type (+ spec)

app/features/promotions/
├── components/PromotionsGrid.vue        # replaced-by / delegates to UiPromotionsCarousel (+ stories/spec)
└── composables/usePromotions.ts         # type updates (+ spec)

app/pages/promotions.vue                 # renders the shared carousel

app/features/contact/components/
├── ContactInfo.vue              # Part C: job card section + phone pill (+ stories/spec)

i18n locale files (es + en)      # Part C: contact.* keys (jobs.*) — strict parity
```

**Structure Decision**: Web application (Nuxt single repo). The only cross-feature concern is the promotions carousel: per Article I it is lifted to `app/components/ui/PromotionsCarousel.vue` (a `Ui`-prefixed primitive taking `promotions: Promotion[]` + a mode/cap prop). `HomePromotions.vue` (homepage feature) and `app/pages/promotions.vue` / promotions feature both consume it; neither imports the other. `PromotionCard.vue` (already in `ui/`) becomes the per-slide component.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| New dependency `embla-carousel-vue` (Article X, > 100-line rule) | An accessible, touch/drag carousel with snap physics, pointer + keyboard nav, and reduced-motion handling is well over 100 lines to hand-write and maintain. Embla is the agreed choice recorded in `specs/_batch-intake/intake.md`. | Hand-rolled scroll-snap carousel rejected: lacks drag momentum, robust a11y, and dot/arrow sync; would exceed the 100-line hand-written threshold and duplicate a maintained library. |

## Notes / Follow-ups

- `docs/business/wordpress-endpoints.md` still documents the OLD promociones ACF contract (titulo/descripcion/vigencia/single `imagen`). It is **stale**; `contracts/promotions-wp.md` in this spec is authoritative for implementation. A docs update is a recommended follow-up (out of this feature's code scope but flagged).
- No new page routes → no `routeRules`/rendering-strategy §4 table changes required.
- Font conversion (`.ttf` → `.woff2`) is a one-time build/setup step; the command is documented in `research.md` and `quickstart.md`. The committed artifact is the `.woff2`.
