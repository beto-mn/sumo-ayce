# Phase 0 Research: Homepage & Global Brand/Copy Updates

All open questions from the Technical Context are resolved below. Copy and design decisions
were pre-confirmed with the client in `client-brief.md`, so this phase focuses on the two
implementation unknowns (font hosting, contrast) plus the asset-optimization risk.

## R1 — Self-hosted Anton webfont

- **Decision**: Self-host Anton (Google Fonts, OFL) as a single `woff2` file, declared with a
  scoped `@font-face` (`font-family: "Anton"; font-display: swap;`). Apply it via a dedicated
  utility class used ONLY by the hero headline. Do NOT change `--disp` globally; Bricolage
  Grotesque remains the general display font.
- **Rationale**: Constitution Technology Stack says fonts are self-hosted; the app currently
  ships no bundled webfont. `woff2` is the smallest widely-supported format. `font-display:
  swap` avoids invisible-text FOIT and protects the Lighthouse budget. Anton has a single
  weight (400), so one file covers the headline.
- **Preload**: Add `<link rel="preload" as="font" type="font/woff2" crossorigin>` for the
  Anton file so the LCP headline text paints without a late swap. Keep it to the single hero
  font only (over-preloading hurts performance).
- **Fallback**: `font-family: "Anton", system-ui, sans-serif;` keeps the headline legible if
  the font fails to load (edge case in spec). Contrast is unaffected by fallback.
- **Alternatives considered**: (a) Google Fonts CDN link — rejected: violates self-hosting
  rule and adds a third-party render-blocking request. (b) Rendering the headline as an image
  — rejected: client confirmed real text for a11y/SEO/selectability.

## R2 — WCAG AA contrast for orange-on-ink

- **Decision**: Use `--orange` (#F37021) text on `--ink` (#1A1209) boxes, tokens only.
- **Verification**: Computed contrast ratio = **6.30:1**.
  - AA large text (≥3:1): **PASS**
  - AA normal text (≥4.5:1): **PASS**
- **Rationale**: The headline is large display text; 6.30:1 clears AA comfortably (and AAA
  large text ≥4.5:1). Gate G8 (SC-003) is satisfied. Re-verify only if brand tokens change.
- **Note**: This uses the official brand token values already present in
  `docs/business/overview.md` §2; no new color token is introduced.

## R3 — Hero headline "Variant A — Plana" (flat) layout

- **Decision**: Two block lines: line 1 "ALL YOU", line 2 "CAN EAT". Each line is an
  inline-block with an `--ink` background and `--orange` text, uppercase, Anton. Line 2 is
  offset to the right and each line carries a small OPPOSITE static rotation (e.g. line 1
  ~ -2deg, line 2 ~ +2deg) for the staggered look. NO border, NO box-shadow.
- **Real text + a11y**: The visible two-line split is presentational only. The `<h1>` exposes
  the full string from `home.hero.headline` ("All You Can Eat") as a single accessible name
  (via aria-label or an sr-only full string with the visual split as `aria-hidden`
  decoration — implementation may choose either as long as SR announces the full phrase once).
- **Reduced motion**: `@media (prefers-reduced-motion: reduce)` disables any rotation
  *animation/transition*; the static rotation transform is acceptable and may be kept.
- **Rationale**: Matches client-confirmed Variant A flat treatment while keeping the heading
  semantic, selectable, and SEO-visible.

## R4 — `sumo.webp` asset optimization (RISK)

- **Finding**: The source file
  `/Users/betonajera/Documents/Projects/Clients/SUMO/Assets/Logo/sumo.webp` is **~1.76 MB** —
  too large for a hero image against the Lighthouse 90+ budget (SC-008).
- **Decision**: Before committing to `public/brand/sumo.webp`, resize/recompress it to the
  actual rendered frame dimensions (retina 2x max) and target well under ~150–200 KB, WITHOUT
  altering the visible artwork (logo must remain unmodified per Article VII — resizing/
  recompressing for delivery is allowed; recolor/crop/distort is not). Use lazy/appropriate
  loading in the frame and set explicit width/height to avoid CLS.
- **Rationale**: Delivering a 1.76 MB webp would regress LCP and fail the performance gate.
  Optimization is a delivery concern, not a modification of the mark.
- **Alternatives considered**: Keep original — rejected (performance). Convert to AVIF —
  optional future optimization; webp is sufficient and already the client's format.

## R5 — Type-selector prominent titles without duplication (DRY, Article I)

- **Decision**: Keep ONE `HomeTypeSelector.vue` card structure. Re-map the existing keys so
  the visible prominent title reads "All You Can Eat" (AYCE card) and "Express" (Express
  card). Concretely: the card's prominent title binds to the badge-style key that already
  holds "All You Can Eat" for AYCE, and Express's prominent title becomes "Express"
  (derived from `express.name` with "SUMO " dropped, or a dedicated short label key), while
  the SUMO wordmark/brand remains available as secondary text if the design needs it.
- **Rationale**: Article I forbids duplicating components for visual variation; the two cards
  already differ only by props/keys. The exact key wiring is an implementation detail; the
  DoD is the visible result in FR-017/FR-018.

## R6 — Menu drinks label: i18n-only, seed alignment only

- **Finding**: `MenuCategoryChips`, `MenuDrinkSection`, `MenuShell` render the label via
  `t('menu.category.drinks')`. The seed `server/db/seeds/menuCategories.ts` currently has
  `nameEs: 'Bebidas'`, `nameEn: 'Drinks'` (lines 137–138).
- **Decision**: Update the i18n key in both locale files to "Bebidas y coctelería" /
  "Drinks & cocktails". Align the seed `nameEs`/`nameEn` for consistency. NO migration, NO
  prod DB write.
- **Rationale**: The runtime label is i18n-driven; the seed is only source data for local
  re-seeding, so consistency alignment is safe and non-breaking.

## R7 — Rendering strategy unchanged

- **Decision**: No `routeRules` change. `/` stays `isr: 3600`; `/menu`, `/branches`
  `isr: 3600`; `/promotions` `isr: 60`; `/reserve` SSR. No new route is added, so the
  `docs/business/rendering-strategy.md` §4 table needs no update.
- **Rationale**: This feature only edits existing surfaces; Gate G5/G14 satisfied.

## Summary of decisions

| ID | Decision |
|----|----------|
| R1 | Self-host Anton woff2, `@font-face` scoped to hero headline, `font-display: swap` + preload |
| R2 | orange-on-ink contrast = 6.30:1 → passes AA (and AA normal) — verified |
| R3 | Variant A flat: two staggered ink/orange lines, no border/shadow, real-text h1, reduced-motion safe |
| R4 | Optimize sumo.webp (~1.76MB → <~200KB) without altering the artwork before committing |
| R5 | One type-selector component; re-map keys so cards read "All You Can Eat" / "Express" |
| R6 | Drinks label i18n-only; align seed; no migration |
| R7 | No rendering-strategy change; no new route |
