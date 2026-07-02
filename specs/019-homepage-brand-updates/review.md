# Review: 019 — Homepage & Global Brand/Copy Updates (hero-refinements validation)

**Status:** APPROVED-WITH-NOTES
**Reviewer:** reviewer agent
**Branch:** `feat/019-hero-refinements`
**Date:** 2026-07-02
**Scope:** Fresh validation of the re-committed feature 019 (4 clean commits) PLUS the
post-original-review hero refinements (illustrated frameless `sumo.webp`, Titan One
real-text headline with white fill + black stroke, no rotation, responsive sizing).

## 1. Acceptance ↔ implementation traceability

- **Copy (all FR-006..FR-029, FR-030):** Every string verified programmatically against
  `client-brief.md` — 0 mismatches. Hero kicker/subtitle, home SEO title/description,
  type-selector title + AYCE/Express descriptions, featured heading "Garantía Sumo",
  branches CTA "Más de 30…", footer blurb, tagline "Buffet preparado al instante",
  marquee (7 items, only last phrase localized), menu drinks "Bebidas y coctelería",
  and Branches/Promotions/Reserve H1+SEO titles all match verbatim (ES) with approved EN.
- **`americano-japonés` / `American-Japanese`:** grep in `i18n/ app/` = 0.
- **US1 hero (FR-001, FR-005, FR-008, FR-009):** `<h1>` is real, selectable text
  (`sr-only` full phrase + two `aria-hidden` split lines), aria-label uses
  `home.hero.headline`; frameless `/brand/sumo.webp` (900×906, explicit dims) in hero only;
  nav/footer keep `sumo-horizontal.svg`. Covered by `HomeHero.spec.ts`.
- **i18n key parity:** ES↔EN identical key paths (0 drift), equal marquee length.
- **Cross-cutting (FR-031/FR-032):** no new routes; changed components keep co-located
  spec + story; `/` stays `isr: 3600`; seed-only drinks alignment (no migration).

## 2. Phase -1 gates (genuinely satisfied)

- Tokens only / no inline hex in touched files: default-palette grep, arbitrary `-[color]`
  grep, and inline-hex grep in `app/` all = 0.
- Story files ≤200 lines (HomeHero 73, Card 84, Marquee 145); component files ≤200
  (HomeHero 86, HomeFeaturedRail 40, SiteFooter 137, etc.).
- Co-located Vitest specs present for every changed `.vue` under components/features.
- WCAG AA: headline uses white fill (`--panel`) + thick 0.17em black stroke (`--ink`).
  The axe `color-contrast` exception is scoped ONLY to the `HomeHero` story meta and
  justified in JSDoc (axe cannot measure the stroke; legibility comes from the outline).
  Correctly NOT a blanket/global disable.
- No Neon/Drizzle import in `app/**`; no new route; no DB migration; seed-only.
- `prefers-reduced-motion`: settle animation disabled; price sticker `motion-reduce:rotate-0`.

## 3. Hero-refinement specifics

- **Titan One self-hosted:** `@font-face` in `base.css` + `public/fonts/titan-one-regular.woff2`
  (9.7 KB) + `public/fonts/OFL-TitanOne.txt`; preloaded in `nuxt.config.ts`, `font-display: swap`.
- **Anton fully removed:** grep for "anton" in `app/ nuxt.config.ts public/fonts/` = 0.
- **sumo.webp:** valid WebP, 121 KB ≤ 200 KB, used unmodified.
- **No rotation:** headline has zero transform/rotate; only the price sticker tilts
  (with reduced-motion guard). Uniform 0.17em stroke at all breakpoints.
- **Responsive:** two stacked lines mobile (17vw cap 120px) / tablet (8.8vw cap 96px);
  staggered two lines desktop (line-height 0.82, bottom `margin-left: 0.6em`). No arbitrary
  color values; sizing via `clamp()`. Real `<h1>` with `home.hero.headline` aria key.

## 4. CHECKPOINTS C1–C7

- C2: 0 in_progress in `feature_list.json` (018 & 019 already `done` — untouched).
- C3/C3.1: feature-scoped structure; `find app/components -maxdepth 1 -name '*.vue'` empty.
- C4: `app/` + `server/` tests pass (775/775, 101 files), biome + typecheck green,
  storybook:build exit 0.
- C6: spec/plan/tasks complete, no `[NEEDS CLARIFICATION]`, all tasks `[x]`, each AC covered.
- C7: secret scan clean (only the word "token(s)" in design-token docs), no tracked env files.

## 5. Repo state

- `./init.sh`: exit 0 (Biome OK, typecheck OK, 775 tests pass).
- `pnpm storybook:build`: exit 0, zero errors. `sumo.webp`, `sumo-horizontal.svg` and
  `titan-one-regular.woff2` all present in `storybook-static/` (no image 404s). Chunk-size
  notices are informational only.

## Notes (non-blocking)

1. **Stale prose vs. refined code.** `progress/impl_019-homepage-brand-updates.md` still
   describes "Anton" / "flat two-line ink/orange treatment", and
   `HomeHero.stories.ts` `ReducedMotion` JSDoc (lines 64-72) still says the headline
   "keeps its static staggered rotation." The CODE is correct (Titan One, white/black
   stroke, no rotation); only the documentation lags. Recommend a doc/JSDoc touch-up in a
   follow-up. Not blocking — no code, test, or user-facing drift.
2. `spec.md` FR-002/FR-003 and Acceptance Scenario 1 still describe the original Anton
   orange-box rotated treatment. The client-approved refinement supersedes it; consider
   updating the spec text so it matches the shipped design.
3. `HomeFeaturedRail.stories.ts` was not re-touched for the added 3rd header line;
   acceptable because the story mounts the real component and the lines resolve via i18n at
   runtime (prop API unchanged), consistent with the prior review's note.
4. SC-008 Lighthouse could not be run headless; asset budgets met, prod build passes.
