# Implementation Report — Feature 019: Homepage & Global Brand/Copy Updates

**Status**: done (pending reviewer approval)
**Branch**: `feat/019-homepage-brand-updates`
**Final commit**: see `git log` head on the branch (last: tasks.md close-out)

## Summary

Brand + copy refresh across the homepage and shared layout plus page-title
updates. Hero headline is now CSS-styled real text (self-hosted Anton, flat
two-line ink/orange treatment), the hero-frame logo is the client's illustrated
`sumo.webp`, all homepage section copy and the site-wide tagline were updated
bilingually (ES + EN), and Branches/Promotions/Reserve titles plus the menu
drinks label were corrected. Tokens only, no inline hex, no new routes, no DB
migration.

## Files created

- `public/fonts/anton-regular.woff2` — self-hosted Anton (Latin-subset, 12 KB, OFL)
- `public/fonts/OFL-Anton.txt` — SIL OFL 1.1 license note for Anton
- `public/brand/sumo.webp` — optimized hero-frame logo (121 KB, 900×906) *(was pre-placed; verified ≤200 KB and wired)*

## Files changed

- `app/assets/css/base.css` — `@font-face` Anton (font-display: swap) + `.hero-headline` flat treatment (tokens only, reduced-motion safe)
- `nuxt.config.ts` — `<link rel=preload>` for the Anton woff2
- `i18n/locales/es.json` — all ES copy per contract; removed stale tagline
- `i18n/locales/en.json` — all EN copy per contract; removed stale tagline
- `app/features/homepage/components/HomeHero.vue` — real-text headline (sr-only full phrase + aria-hidden staggered boxes) + logo swap + kicker/subtitle
- `app/features/homepage/components/HomeHero.spec.ts` — extended (a11y name, real-text, logo src+dims, ES/EN copy)
- `app/features/homepage/components/HomeHero.stories.ts` — updated reduced-motion JSDoc
- `app/features/homepage/components/HomeFeaturedRail.vue` — added "Garantía Sumo" heading line (3 lines)
- `app/features/homepage/components/HomeFeaturedRail.spec.ts` — 3 header lines per locale
- `app/features/homepage/components/HomeTypeSelector.spec.ts` — prominent AYCE/Express titles + descriptions per locale
- `app/features/homepage/components/HomeBranchesCta.spec.ts` — "30+ / más de 30" title per locale
- `app/components/layout/SiteMarquee.spec.ts` — 7 items, order, ES/EN
- `app/components/layout/SiteFooter.spec.ts` — new tagline/blurb per locale + logo still `sumo-horizontal.svg`
- `app/features/homepage/data/featured-dishes.ts` — removed incidental "americano-japonés" demo copy
- `app/components/ui/Card.stories.ts`, `app/components/ui/Marquee.stories.ts` — removed incidental stale tagline demo copy
- `app/pages/index.vue` — SEO from dedicated `home.seo.title/description`
- `app/pages/branches.vue` — SEO/tab title reads page title verbatim (no prefix)
- `server/db/seeds/menuCategories.ts` — drinks `nameEs/nameEn` aligned (seed-only, no migration)
- `specs/019-homepage-brand-updates/tasks.md` — all tasks marked `[x]`

> Note: `HomeTypeSelector.vue`, `HomeBranchesCta.vue`, `SiteMarquee.vue`,
> `SiteFooter.vue`, `promotions.vue`, `reserve.vue` needed NO template change —
> they already bind the affected i18n keys, satisfied by the T004 copy update.
> The AYCE/Express prominent titles were achieved by re-mapping the existing
> `name`/`badge` keys (name→prominent title, badge→short chip) — one component,
> no duplication (Article I / FR-019).

## Tasks (all `[x]` in tasks.md)

- T001 baseline · T002 hero webp · T003 Anton font + @font-face + preload · T004 bilingual i18n
- T005 hero headline+logo · T006 hero spec · T007 hero story
- T008 marquee · T009 type selector · T010 featured rail · T011 branches CTA · T012 footer
- T013 index SEO · T014 branches title · T015 promotions title · T016 reserve title · T017 drinks seed
- T018 contrast · T019 grep guard · T020 parity · T021 perf/budgets · T022 gates · T023 quickstart

## Tests added (one+ per acceptance criterion)

- Hero: accessible name = headline, real-text not `<img>`, split lines aria-hidden, static-rotation classes, ES+EN kicker/subtitle, logo src `sumo.webp` + alt + explicit dims (US1 AC 1-5, SC-002)
- Marquee: 7 items in contract order, EN localizes only last phrase (US2 AC1, SC-001)
- TypeSelector: prominent "All You Can Eat"/"Express" titles, new descriptions ES+EN, "AYCE - EXPRESS" kicker (US2 AC2)
- FeaturedRail: 3 header lines (label/heading/subtitle) ES+EN (US2 AC3)
- BranchesCta: "más de 30 / 30+" title ES+EN (US2 AC4)
- Footer: new tagline+blurb ES+EN, logo still `sumo-horizontal.svg` (US2 AC5, US3 AC1, SC-006)

## Phase -1 gates

All G1–G14 in `plan.md` were verifiable against existing code and are satisfied.
G8 contrast (orange-on-ink 6.30:1) verified; G12 ES↔EN parity verified true.

## Verification results (exit codes)

- `pnpm check` (biome, --error-on-warnings): exit 0
- `pnpm typecheck` (vue-tsc --noEmit): exit 0
- `pnpm test` (vitest): exit 0 — 101 files, 775 tests passed (baseline 759, +16)
- `pnpm build`: exit 0
- `pnpm storybook:build`: exit 0 (no errors, assets copied, no image 404s)
- `./init.sh`: exit 0
- Grep `americano-jap|American-Japanese` in `i18n/ app/`: 0 matches
- Inline hex in touched CSS/Vue: none (tokens via `rgb(var(--…))` only)
- Story files ≤200 lines; changed component files ≤200 lines

## Known issues / TODOs

- None. (Lighthouse 90+ (SC-008) cannot be executed headless in this env; asset
  budgets are met: sumo.webp 121 KB < 200 KB, Anton 12 KB preloaded with
  font-display: swap, production build succeeds — no regression expected.)
