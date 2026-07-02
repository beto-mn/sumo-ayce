# Quickstart & Verification: Homepage & Global Brand/Copy Updates

## Prerequisites

- Branch `feat/019-homepage-brand-updates` checked out.
- Node deps installed; dev server runnable (`npm run dev` or project equivalent).

## Implementation order (high level)

1. Add the Anton woff2 font (`public/fonts/anton-regular.woff2`) + `@font-face` in the global
   stylesheet (`font-display: swap`), scoped headline utility using `--ink`/`--orange`; add
   `<link rel=preload>` for the font. (See research R1/R3.)
2. Optimize and copy the hero logo to `public/brand/sumo.webp` (see research R4).
3. Update `i18n/locales/es.json` and `i18n/locales/en.json` per `contracts/i18n-keys.md`
   (add `home.seo.*`, `home.featured.heading`; update all listed keys; remove old tagline).
4. Edit components: `HomeHero.vue` (headline treatment + kicker/subtitle + hero logo src),
   `SiteMarquee.vue`, `HomeTypeSelector.vue`, `HomeFeaturedRail.vue` (add heading slot),
   `HomeBranchesCta.vue`, `SiteFooter.vue`.
5. Edit pages: `index.vue` (SEO keys), `branches.vue`, `promotions.vue`, `reserve.vue`
   (H1 + SEO titles).
6. Align seed `server/db/seeds/menuCategories.ts` drinks label.
7. Update/extend co-located `*.stories.ts` and `*.spec.ts` for every changed component.
8. Run gates: Biome, `vue-tsc --noEmit`, Vitest, Storybook build.

## Verification checklist (maps to Success Criteria)

- [ ] **SC-001**: Toggle ES ↔ EN on `/`; every one of the 10 copy changes shows the exact
      contract text in both locales.
- [ ] **SC-002**: On `/`, select the headline text with the cursor — "All You Can Eat" is
      selectable; a screen reader announces the `<h1>` once as the full phrase.
- [ ] **SC-003**: Contrast of `--orange` on `--ink` = 6.30:1 (verified) — AA pass. Re-check if
      tokens change.
- [ ] **SC-004**: `grep -ri "americano-jap\|American-Japanese" i18n/ app/` returns nothing;
      rendered pages show no old tagline.
- [ ] **SC-005**: On `/branches`, `/promotions`, `/reserve`, the visible H1 AND the browser
      tab title both show the new title, in ES and EN.
- [ ] **SC-006**: Hero frame shows `sumo.webp`; nav + footer still show `sumo-horizontal.svg`.
- [ ] **SC-007**: With DevTools "Emulate prefers-reduced-motion: reduce", the headline plays
      no rotation animation.
- [ ] **SC-008**: Lighthouse on `/` still ≥90 (perf) after font + webp; sumo.webp <~200KB;
      Anton preloaded with `font-display: swap`.
- [ ] **SC-009**: `/menu` drinks chip/section shows "Bebidas y coctelería" / "Drinks &
      cocktails"; no migration file created; no prod DB write.
- [ ] **SC-010**: `vue-tsc --noEmit` clean; every changed component has a passing
      co-located `.spec.ts` and a `.stories.ts` ≤200 lines.

## Commands

```bash
# type-check
npx vue-tsc --noEmit

# unit tests (all or targeted)
npx vitest run

# lint/format
npx biome check .

# storybook (build to verify stories)
npm run storybook:build   # or project equivalent

# grep for stale tagline
grep -rin "americano-jap\|American-Japanese" i18n/ app/
```

## Rollback

All changes are edits to existing files plus two added assets and (optional) added i18n keys.
Revert the branch to undo. No DB migration to reverse.
