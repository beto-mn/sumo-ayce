# Phase 1 Data Model: Homepage & Global Brand/Copy Updates

This feature has no database entities. Its "data" is i18n message keys plus two static assets
(image + font) and one seed alignment. This document inventories them as the authoritative
change manifest. The full ES/EN values are the contract in `contracts/i18n-keys.md`.

## 1. i18n message keys

Both `i18n/locales/es.json` and `i18n/locales/en.json` MUST be kept in structural parity.

### Added keys

| Key | Type | Notes |
|-----|------|-------|
| `home.seo.title` | string | Homepage SEO/tab title (new dedicated key) |
| `home.seo.description` | string | Homepage SEO description (new dedicated key) |
| `home.featured.heading` | string | New middle line for the featured rail ("Garantía Sumo") |

### Updated keys

| Key | Component/Page | Notes |
|-----|----------------|-------|
| `home.hero.kicker` | HomeHero.vue | New kicker copy |
| `home.hero.subtitle` | HomeHero.vue | New richer subtitle |
| `home.marquee` (array) | SiteMarquee.vue | Replace all 7 items |
| `home.typeSelector.kicker` | HomeTypeSelector.vue | "AYCE - EXPRESS" |
| `home.typeSelector.title` | HomeTypeSelector.vue | New title |
| `home.typeSelector.ayce.desc` | HomeTypeSelector.vue | New AYCE description |
| `home.typeSelector.express.desc` | HomeTypeSelector.vue | New Express description |
| `home.typeSelector.ayce.*` / `home.typeSelector.express.*` (name/badge) | HomeTypeSelector.vue | Re-mapped so cards read "All You Can Eat" / "Express" prominently (no duplication) |
| `home.featured.title` / `home.featured.subtitle` | HomeFeaturedRail.vue | Label + subtitle copy (heading added above) |
| `home.branches.title` | HomeBranchesCta.vue | "Más de 30 sucursales…" |
| `footer.brand.blurb` | SiteFooter.vue | New blurb paragraph |
| `brand.tagline` | (global) | "Buffet preparado al instante" |
| `footer.brand.tagline` | SiteFooter.vue | "Buffet preparado al instante" |
| `branches.page.heading` + `branches.page.title` | branches.vue | "Sucursales Sumo" (H1 + SEO) |
| `promotions.page.heading` + `promotions.seo.title` | promotions.vue | "Promociones Sumo" (H1 + SEO) |
| `reservation.page_title` (+ H1) | reserve.vue | "Reservas Sumo" (H1 + SEO) |
| `menu.category.drinks` | Menu components | "Bebidas y coctelería" |

### Unchanged (do NOT touch)

- `home.hero.headline` — kept as-is ("All You Can Eat"), reused for the styled `<h1>` /
  aria-label.
- `home.hero.logoAlt` — kept as-is, reused for the new hero-frame logo.
- Nav/footer logo references (`sumo-horizontal.svg`).

### Validation rules

- **Parity**: Every key present in `es.json` MUST exist in `en.json` and vice versa (same
  key paths, same array lengths for `home.marquee`).
- **Verbatim ES**: ES values equal the client-brief text exactly (including punctuation,
  accents, "·", "—", and the literal "..." in the SEO description).
- **Locale-invariant items**: `home.typeSelector.kicker` = "AYCE - EXPRESS" and the marquee
  product names are identical in both locales; only the marquee's last phrase is localized.
- **No stale tagline**: no occurrence of "Estilo americano-japonés" / "American-Japanese
  style" remains in either file.

## 2. Static assets

| Asset | Source → Destination | Rule |
|-------|----------------------|------|
| Hero logo | `/Users/betonajera/Documents/Projects/Clients/SUMO/Assets/Logo/sumo.webp` → `public/brand/sumo.webp` | Hero frame ONLY. Optimize (~1.76MB → <~200KB) without altering artwork. Explicit width/height to avoid CLS. |
| Anton font | Google Fonts (OFL) → `public/fonts/anton-regular.woff2` (or `public/brand/`) | Self-hosted woff2, single weight (400). `@font-face` scoped to hero headline; preload. |

## 3. Seed alignment (no migration)

| File | Field | Old → New |
|------|-------|-----------|
| `server/db/seeds/menuCategories.ts` | drinks `nameEs` | `Bebidas` → `Bebidas y coctelería` |
| `server/db/seeds/menuCategories.ts` | drinks `nameEn` | `Drinks` → `Drinks & cocktails` |

Seed-only; no migration file, no production DB write.

## 4. Styling tokens (no new tokens)

The headline reuses existing tokens: `--ink` (box background, #1A1209) and `--orange` (text,
#F37021). No new color token is introduced. No inline hex anywhere.
