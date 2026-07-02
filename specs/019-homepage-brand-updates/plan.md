# Implementation Plan: Homepage & Global Brand/Copy Updates

**Branch**: `feat/019-homepage-brand-updates` | **Date**: 2026-07-01 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `specs/019-homepage-brand-updates/spec.md`
**Source of truth**: [client-brief.md](./client-brief.md) (copy + design decisions) · [copy-audit.md](./copy-audit.md) (i18n key → file map)

## Summary

A brand + copy refresh across the homepage and shared layout, plus page-title updates.
Primary changes: (1) render the hero "ALL YOU CAN EAT" `<h1>` as CSS-styled real text using a
self-hosted Anton webfont in a flat two-line staggered ink/orange treatment; (2) swap the
hero-frame logo to the client's illustrated `sumo.webp` (hero only); (3) update all homepage
section copy (kicker, subtitle, marquee, type selector, featured rail, branches CTA, footer
blurb); (4) replace the "Estilo americano-japonés" tagline with "Buffet preparado al
instante" site-wide; (5) apply new H1 + SEO titles to Branches/Promotions/Reserve; (6) update
the menu drinks label — all bilingual (ES + EN), tokens-only, no new routes, no DB migration.

Technical approach: edit existing Vue components, pages, and both locale JSON files; add one
`@font-face` (Anton woff2) scoped to the hero headline; add `public/brand/sumo.webp`; align
the drinks-category seed for consistency (no migration). Every changed component keeps or
gains a co-located Storybook story (≤200 lines) and a co-located Vitest spec; `vue-tsc` and
tests must stay green.

## Technical Context

**Language/Version**: TypeScript (strict mode), Vue 3 (Composition API only), Nuxt 4
**Primary Dependencies**: Nuxt 4, `@nuxtjs/i18n`, Tailwind CSS + global design-token stylesheet, Storybook 10 (`@storybook/vue3-vite`), Vitest + `@vue/test-utils` (happy-dom), Biome
**Storage**: N/A for runtime. Neon Postgres is NOT touched at runtime. `server/db/seeds/menuCategories.ts` is aligned for consistency only (seed-only, no migration, no prod write).
**Testing**: Vitest + `@vue/test-utils` (happy-dom); co-located `Component.vue ↔ Component.spec.ts`; `vue-tsc --noEmit` type-check
**Target Platform**: Web (Vercel), mobile-first; ES default + EN toggle
**Project Type**: Web application (Nuxt 4 single repo, frontend + server routes co-located)
**Performance Goals**: Lighthouse 90+ on `/` preserved after adding the Anton woff2 font and the webp asset (SC-008). Self-hosted font with `font-display: swap` and optional `<link rel=preload>`; webp is already an optimized format.
**Constraints**: Tokens only (no inline hex; headline uses `--ink`/`--orange`); component files ≤200 lines; functions ≤30 lines; story files ≤200 lines; WCAG AA contrast for orange-on-ink (must verify); `prefers-reduced-motion` respected (no rotation animation); absolute imports via alias; no new routes; no DB migration.
**Scale/Scope**: ~6 components, 3 pages, 2 locale files, 1 seed file, 1 global stylesheet, 1 new asset, 1 new font; ~32 functional requirements; 10 documented copy changes × 2 locales.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Phase -1 Gates (derived from `.specify/memory/constitution.md` v3.1.0)

| # | Gate (Article) | Requirement | Status |
|---|----------------|-------------|--------|
| G1 | **I — Code Organization & Reusability** | Homepage components stay under `app/features/homepage/components/`; shared layout under `app/components/layout/`. No cross-feature imports. Type-selector cards remain ONE component (re-map existing `name`/`badge` keys — DO NOT duplicate a card component). No page template exceeds 100 lines. | PASS (design) |
| G2 | **I / VII — Storybook coverage (NON-NEGOTIABLE)** | Every changed component (`HomeHero`, `HomeTypeSelector`, `HomeFeaturedRail`, `HomeBranchesCta`, `SiteMarquee`, `SiteFooter`) keeps or gains a co-located `*.stories.ts`: Default + significant variants + responsive/viewport (mobile 360/520 + desktop). | PASS (planned) |
| G3 | **II — TypeScript & Framework** | TS strict, no `any`; Composition API only; shared types in `types/` if any (none new expected). | PASS |
| G4 | **IV — Testing** | Every changed component gains/keeps a co-located `Component.spec.ts` (Vitest, `@vue/test-utils`). Behavior-named tests: assert rendered copy per locale, real-text `<h1>`, reduced-motion class, logo `src`, page titles. No server routes/composables added, so no new unit-test-first server logic. | PASS (planned) |
| G5 | **V — Performance** | `/` stays `isr: 3600`; rendering-strategy table unchanged (no new route). No Drizzle/Neon import in `app/**` (none added). Lighthouse 90+ preserved: Anton woff2 with `font-display: swap` (+ optional preload), webp asset optimized. Backend-never-static N/A (no DB access from app). | PASS (verify Lighthouse post-impl) |
| G6 | **VII — UX Consistency & Visual source of truth** | Follow `docs/business/overview.md` tokens; mobile-first; responsive at 880px / 520px breakpoints. Nav/footer logo unmodified (`sumo-horizontal.svg`); hero-frame logo is a client-supplied asset used unmodified in the existing frame slot. | PASS |
| G7 | **VIII — Clean Code + tokens only** | Component files ≤200 lines; functions ≤30 lines; no dead code, no commented-out code, no `console.log`. **Tokens only — NO inline hex**; the Anton headline boxes use `--ink` (box) and `--orange` (text). | PASS (enforce in review) |
| G8 | **VIII / a11y — WCAG AA contrast** | Orange-on-ink (`--orange` text on `--ink` box) MUST be verified to meet WCAG AA for the headline text size before merge (SC-003). | PASS pending explicit verification (see research.md) |
| G9 | **a11y — real-text heading + reduced motion** | Headline is real, selectable text; `<h1>`/aria-label uses `home.hero.headline`; `prefers-reduced-motion: reduce` disables rotation animation (static rotation allowed). | PASS (design) |
| G10 | **IX — Quality Gates** | Biome lint + format pass; `vue-tsc --noEmit` passes; unit tests pass; Conventional Commits; NEVER `--no-verify`. | PASS (enforced by hooks/CI) |
| G11 | **XI — Absolute imports via alias** | Any new imports use `@/` aliases; no `../` outside same dir. | PASS |
| G12 | **Bilingual completeness (project rule)** | Every changed/added key present in BOTH `i18n/locales/es.json` and `i18n/locales/en.json` with matching key structure (ES verbatim, EN approved). Key-parity check part of DoD. | PASS (planned) |
| G13 | **Story file size limit (VII/VIII)** | Each `*.stories.ts` ≤200 lines. | PASS (enforce in review) |
| G14 | **Scope guardrail** | NO new routes/pages; NO DB migration; menu drinks label is i18n-only (seed alignment only). Anton applied ONLY to hero headline; Bricolage remains the general display font. | PASS (design) |

**Result**: No constitutional violations. Complexity Tracking table not required.

## Project Structure

### Documentation (this feature)

```text
specs/019-homepage-brand-updates/
├── plan.md              # This file
├── spec.md              # Feature spec (source: client-brief.md)
├── client-brief.md      # SOURCE OF TRUTH — copy + design decisions
├── copy-audit.md        # i18n key → file map
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output (i18n key inventory + asset/font manifest)
├── quickstart.md        # Phase 1 output (verification steps)
├── contracts/
│   └── i18n-keys.md     # Phase 1 output (the copy contract: key ↔ ES/EN value)
├── checklists/
│   └── requirements.md  # Spec quality checklist
└── tasks.md             # Phase 2 output (/speckit.tasks — NOT created here)
```

### Source Code (repository root — files touched)

```text
app/
├── features/homepage/components/
│   ├── HomeHero.vue            # headline (Anton flat treatment) + kicker + subtitle + hero logo swap
│   ├── HomeHero.stories.ts     # keep/extend
│   ├── HomeHero.spec.ts        # keep/extend
│   ├── HomeTypeSelector.vue    # kicker/title + AYCE/Express prominent titles + descriptions
│   ├── HomeTypeSelector.stories.ts
│   ├── HomeTypeSelector.spec.ts
│   ├── HomeFeaturedRail.vue    # add heading slot (3 lines)
│   ├── HomeFeaturedRail.stories.ts
│   ├── HomeFeaturedRail.spec.ts
│   ├── HomeBranchesCta.vue     # branches CTA title
│   ├── HomeBranchesCta.stories.ts
│   └── HomeBranchesCta.spec.ts
├── components/layout/
│   ├── SiteMarquee.vue         # replace home.marquee items
│   ├── SiteMarquee.stories.ts
│   ├── SiteMarquee.spec.ts
│   ├── SiteFooter.vue          # footer.brand.blurb (nav/footer logo unchanged)
│   ├── SiteFooter.stories.ts
│   └── SiteFooter.spec.ts
├── pages/
│   ├── index.vue               # home.seo.title / home.seo.description keys in useSeoMeta
│   ├── branches.vue            # H1 + SEO title → Sucursales Sumo
│   ├── promotions.vue          # H1 + SEO title → Promociones Sumo
│   └── reserve.vue             # H1 + SEO title → Reservas Sumo
└── assets/ (or app global css)
    └── (global stylesheet)     # @font-face Anton + headline utility (tokens only)

i18n/locales/
├── es.json                     # all copy (verbatim ES) + new keys
└── en.json                     # all copy (approved EN) + new keys

public/brand/
├── sumo.webp                   # NEW — hero-frame illustrated logo
└── (Anton woff2)               # NEW self-hosted font asset (public/fonts or public/brand)

server/db/seeds/
└── menuCategories.ts           # drinks nameEs/nameEn aligned (seed-only, no migration)
```

**Structure Decision**: Web application (Nuxt 4 single repo). This feature edits existing
feature-scoped homepage components, shared layout components, three existing pages, both
locale files, one seed file, and the global stylesheet; it adds one image asset and one
self-hosted font. No new routes, no new feature folder, no server routes, no DB migration.

## Complexity Tracking

> No Constitution Check violations. Table intentionally empty.
