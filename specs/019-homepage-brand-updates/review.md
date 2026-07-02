# Review: 019 — Homepage & Global Brand/Copy Updates

**Status:** APPROVED
**Reviewer:** reviewer agent
**Branch:** `feat/019-homepage-brand-updates`
**Date:** 2026-07-01

## Verifications

### Acceptance ↔ implementation traceability (spec.md)
- US1 (hero) — FR-001..FR-010: PASS. Headline is real, selectable text (`<h1>` with
  `sr-only` full phrase + two `aria-hidden` staggered ink/orange boxes), Anton flat
  Variant-A treatment in `base.css`, reduced-motion disables the settle animation while
  keeping static rotation, hero-frame logo swapped to `/brand/sumo.webp` (900×906, explicit
  dims), nav/footer keep `sumo-horizontal.svg` (`SiteLogo.vue`). Covered by
  `HomeHero.spec.ts` (accessible name, real-text/no-img, logo src+alt+dims, reduced-motion
  classes, ES/EN kicker+subtitle).
- US2 (section copy) — FR-011..FR-022: PASS. Marquee 7 items in order (only last phrase
  localized), type-selector `name`→prominent title / `badge`→chip so cards read
  "All You Can Eat" / "Express", featured rail 3 lines (label/"Garantía Sumo"/subtitle),
  branches CTA "Más de 30 sucursales…", footer blurb. Covered by respective `.spec.ts`.
- US3 (tagline/titles/SEO/drinks) — FR-023..FR-029: PASS. Tagline replaced site-wide,
  Branches/Promotions/Reserve H1 + SEO titles, dedicated `home.seo.*` keys wired in
  `index.vue`, drinks label i18n-only + seed aligned (no migration).
- Cross-cutting FR-030..FR-032: PASS. All keys present in both locales; no new routes;
  every changed component keeps a co-located story (≤200 lines) + spec.

### Copy correctness (client-brief.md verbatim)
All spot-checked strings match the brief exactly in ES with proper EN: hero kicker/subtitle,
footer blurb, type-selector title + AYCE/Express descriptions, featured
label/heading/subtitle, branches CTA, marquee, menu drinks "Bebidas y coctelería", page
titles (Sucursales/Promociones/Reservas Sumo in H1 + SEO), home SEO title/description.

### Phase -1 Gates (plan.md G1–G14)
All genuinely satisfied:
- Tokens only / no inline hex in touched files — grep for default palette, arbitrary
  `-[#...]`, and inline hex all return zero.
- Headline uses `rgb(var(--ink))` box + `rgb(var(--orange))` text; contrast 6.30:1 → WCAG AA.
- Story files ≤200 lines; changed component files ≤200 lines.
- Co-located stories + specs present for every changed component (pages need no story).
- No Neon/Drizzle import in `app/**`.
- Route `/` stays `isr: 3600`; no new route; no DB migration (seed-only drinks alignment).

### Repo state
- `./init.sh`: exit 0 (biome OK, `nuxt typecheck` OK, 775 tests / 101 files pass).
- `pnpm storybook:build`: completed successfully, zero errors. `sumo.webp`,
  `sumo-horizontal.svg` and `anton-regular.woff2` all copied to `storybook-static/`
  (no image 404s). Chunk-size notices are informational only.

### Assets & tasks
- `public/brand/sumo.webp` (121 KB < 200 KB), `public/fonts/anton-regular.woff2` (12 KB,
  preloaded in `nuxt.config.ts`, `font-display: swap`), OFL license note committed.
- Tasks T001–T023 all `[x]` and map to real deliverables (spot-checked: base.css headline,
  @font-face + font asset, sumo.webp wiring, "americano-japonés"/"American-Japanese" grep
  returns 0 in `i18n/ app/`).

### CHECKPOINTS C1–C7
- C2: exactly 1 in_progress (019, now → done). C3/C3.1: feature-scoped structure honored,
  no `*.vue` at `app/components/` root. C4: `app/` + `server/` tests pass, biome + typecheck
  green, Storybook sync OK. C6: spec/plan/tasks complete, no `[NEEDS CLARIFICATION]`, all
  tasks `[x]`, each AC covered. C7: secret scan clean (only design-"token" doc matches), no
  tracked env files.

## Notes (non-blocking)
- `HomeFeaturedRail.vue` gained a visible 3rd header line but its `.stories.ts` was not
  edited. Acceptable: the story mounts the REAL component and header lines resolve via i18n
  at runtime, so no static markup drifts and the `dishes` prop API is unchanged.
- `promotions.vue`/`reserve.vue`/`SiteMarquee.vue`/`HomeTypeSelector.vue`/`HomeBranchesCta.vue`
  needed no template change — they already bind the affected keys, satisfied by the T004
  i18n update. Verified each binding resolves the updated value.
- SC-008 Lighthouse could not be run headless; asset budgets are met and prod build passes.
