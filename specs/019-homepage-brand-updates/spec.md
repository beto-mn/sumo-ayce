# Feature Specification: Homepage & Global Brand/Copy Updates

**Feature Branch**: `feat/019-homepage-brand-updates`
**Created**: 2026-07-01
**Status**: Draft
**Input**: Brand + copy refresh across the homepage and shared layout, plus page-title updates. No new routes, no DB migration. Exact copy and confirmed design decisions live in `client-brief.md` (source of truth) and the i18n key map in `copy-audit.md`.

> **Source of truth**: `specs/019-homepage-brand-updates/client-brief.md`. All copy in this
> spec is transcribed verbatim from that brief. If any wording conflicts, the client-brief
> wins. The i18n key → file map is in `specs/019-homepage-brand-updates/copy-audit.md`.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Refreshed hero that sells the AYCE experience (Priority: P1)

A visitor lands on the SUMO homepage. The hero immediately communicates the brand with a
bold, styled "ALL YOU CAN EAT" headline (real, selectable text — not an image), an updated
one-line kicker, a richer subtitle that mentions the buffet, the à-la-carte menu, signature
dishes and the 30+ locations, and the client's illustrated three-sumos logo in the hero
frame. The visitor understands what SUMO is within the first screen, on mobile and desktop.

**Why this priority**: The hero is the first impression and the single highest-visibility
surface of the site. The headline treatment and logo are the most visible brand assets and
carry the most business weight.

**Independent Test**: Load `/` on a 360px viewport and a desktop viewport in both ES and EN.
Verify the styled headline is real text (selectable, announced by screen readers via the
`<h1>`/aria-label), the kicker/subtitle read the new copy, and the hero frame shows the new
`sumo.webp` illustrated logo while nav and footer still show `sumo-horizontal.svg`.

**Acceptance Scenarios**:

1. **Given** a visitor on `/`, **When** the hero renders, **Then** the headline shows
   "ALL YOU CAN EAT" as real text in the Titan One typeface with a white fill and a thick
   black outline (logo-style), uppercase and straight (no rotation): two staggered lines
   ("ALL YOU" / "CAN EAT") on desktop and two large stacked lines on mobile/tablet.
2. **Given** a screen-reader user, **When** the headline is focused/read, **Then** the full
   text "All You Can Eat" (from `home.hero.headline`) is announced as a single heading.
3. **Given** a visitor with `prefers-reduced-motion: reduce`, **When** the hero renders,
   **Then** the headline's settle animation does not play and the headline has no rotation.
4. **Given** a visitor toggling ES ↔ EN, **When** the hero renders, **Then** the kicker and
   subtitle show the correct localized copy and the headline text is identical in both.
5. **Given** the hero frame, **When** it renders, **Then** it displays `sumo.webp` in the
   existing tilted/rounded frame slot with the existing `home.hero.logoAlt` alt text; nav
   and footer logos are unchanged (`sumo-horizontal.svg`).

---

### User Story 2 - Consistent, up-to-date brand copy across the homepage sections (Priority: P1)

A visitor scrolls the homepage past the hero: the marquee, the AYCE/Express type selector,
the featured-dishes rail, the branches CTA and the footer all show refreshed, accurate copy
in the selected language.

**Why this priority**: These sections drive comprehension and routing to menu/branches. The
old copy is stale or inaccurate (e.g. "10 sucursales" when there are 31) and must be corrected
before the redesigned homepage is credible.

**Independent Test**: Scroll `/` in ES and EN and verify every section below matches the
client-brief copy exactly.

**Acceptance Scenarios**:

1. **Given** the marquee, **When** it renders, **Then** its items are exactly: Sushi,
   Boneless, Smash Burgers, Yakimeshi, Sumo Sandwich, Hot Dogs, and "$269 todos los días"
   (ES) / "$269 every day" (EN). Product names are identical in both locales; only the last
   phrase is localized.
2. **Given** the type selector, **When** it renders, **Then** the kicker reads "AYCE -
   EXPRESS", the title reads the new title, the first card reads "All You Can Eat"
   prominently with the new AYCE description, and the second card reads "Express" prominently
   with the new Express description.
3. **Given** the featured rail, **When** it renders, **Then** it shows three lines: label,
   heading "Garantía Sumo" / "Sumo Guarantee", and subtitle — each localized.
4. **Given** the branches CTA, **When** it renders, **Then** the title reads "Más de 30
   sucursales en CDMX, EDOMEX y Cuernavaca" (ES) / "30+ locations across CDMX, EDOMEX and
   Cuernavaca" (EN).
5. **Given** the footer, **When** it renders, **Then** the brand blurb reads the new
   localized paragraph.

---

### User Story 3 - Correct, self-consistent brand tagline and page titles site-wide (Priority: P2)

A visitor moving between pages sees consistent branding: the tagline "Buffet preparado al
instante" everywhere the old "Estilo americano-japonés" used to be, correct SEO/tab titles
and page headings for the Branches, Promotions and Reserve pages, and the corrected drinks
category label on the menu.

**Why this priority**: Consistency and accuracy across pages matter for trust and SEO, but
are lower-risk than the homepage first impression.

**Independent Test**: Visit `/branches`, `/promotions`, `/reserve` and `/menu` in both
locales; verify H1s, browser tab titles, and the drinks label; grep the rendered output for
any remaining "Estilo americano-japonés" / "American-Japanese style".

**Acceptance Scenarios**:

1. **Given** any surface previously showing "Estilo americano-japonés" (`brand.tagline`,
   `footer.brand.tagline`, and the hero kicker), **When** it renders, **Then** it shows
   "Buffet preparado al instante" (ES) / "Buffet made to order" (EN); no occurrence of the
   old tagline remains.
2. **Given** `/branches`, **When** it renders, **Then** the H1 and the browser tab/SEO title
   both read "Sucursales Sumo" (ES) / "Sumo Branches" (EN).
3. **Given** `/promotions`, **When** it renders, **Then** the H1 and the browser tab/SEO
   title both read "Promociones Sumo" (ES) / "Sumo Promotions" (EN).
4. **Given** `/reserve`, **When** it renders, **Then** the H1 and the browser tab/SEO title
   both read "Reservas Sumo" (ES) / "Sumo Reservations" (EN).
5. **Given** `/menu`, **When** the drinks category chip and section render, **Then** the
   label reads "Bebidas y coctelería" (ES) / "Drinks & cocktails" (EN), with no production
   database migration performed.
6. **Given** the homepage `<head>`, **When** it renders, **Then** the SEO title and
   description come from dedicated `home.seo.title` / `home.seo.description` keys (not
   derived from the headline/kicker) and read the new localized values.

---

### Edge Cases

- **Missing/failed webfont**: If the self-hosted Titan One font fails to load, the headline
  MUST remain legible with a system-ui/sans-serif fallback and keep its readable white-fill /
  black-outline treatment. Layout MUST NOT collapse.
- **Reduced motion**: Users with `prefers-reduced-motion: reduce` get no settle animation on
  the headline (the headline has no rotation) and existing marquee/bounce reduced-motion
  behavior is preserved.
- **Long localized strings**: The richer subtitle and footer blurb are the longest strings;
  they MUST wrap without overflow at 360px and not push CTAs off-screen.
- **Locale toggle mid-view**: Toggling ES ↔ EN re-renders all updated strings immediately;
  no stale mixed-locale text remains.
- **New logo aspect ratio**: `sumo.webp` (illustrated lockup) has a different aspect ratio
  than the previous `sumo-vertical.svg`; it MUST fit the existing tilted/rounded frame slot
  without distortion (no stretch/squash).
- **Contrast of the outlined headline**: The white fill relies on the thick `--ink` outline
  (not the background) for legibility. Automated `color-contrast` (axe) does not measure the
  stroke, so it MUST be scoped-off for the headline node in its Storybook story with a
  documented justification; the treatment MUST remain visually legible.

## Requirements *(mandatory)*

### Functional Requirements

#### Hero (`app/features/homepage/components/HomeHero.vue`)

- **FR-001**: The hero headline MUST be rendered as CSS-styled real text (selectable,
  machine-readable), NOT as an image, and MUST keep the existing `home.hero.headline` i18n
  key for the `<h1>` / aria-label.
- **FR-002**: The headline MUST use a logo-style lettering treatment: two lines "ALL YOU" and
  "CAN EAT" with a white fill (`--panel`) and a thick black outline (`--ink`) via
  `-webkit-text-stroke` + `paint-order: stroke fill`, uppercase and straight (no rotation).
  Responsive: two staggered lines on desktop (>1024px) and two large stacked lines on
  mobile/tablet (≤1024px), scaled to fill the width without horizontal overflow.
- **FR-003**: The headline MUST use the Titan One typeface (Google Fonts, OFL license),
  self-hosted via `@font-face` (woff2 preferred). Titan One MUST be applied ONLY to the hero
  headline; Bricolage Grotesque remains the general display font site-wide.
- **FR-004**: The headline MUST NOT play its settle animation when the user prefers reduced
  motion; the headline has no rotation in any mode.
- **FR-005**: Colors used by the headline MUST come from design tokens (`--panel`, `--ink`)
  — no inline hex values.
- **FR-006**: The hero kicker (`home.hero.kicker`) MUST read:
  - ES: `Come sin límites · Buffet preparado al instante`
  - EN: `Eat without limits · Buffet made to order`
- **FR-007**: The hero subtitle (`home.hero.subtitle`) MUST read:
  - ES: `Más de 45 platillos por un solo precio... Descubre tu nuevo lugar favorito.`
  - EN: `45+ dishes for a single price... Discover your new favorite place.`
- **FR-008**: The hero frame logo MUST be swapped from `/brand/sumo-vertical.svg` to a new
  `/brand/sumo.webp` (the client's illustrated three-sumos lockup), keeping the existing
  tilted/rounded frame slot and the existing `home.hero.logoAlt` alt-text key. This swap
  applies to the HERO FRAME ONLY.
- **FR-009**: The nav (`SiteHeader.vue`) and footer (`SiteFooter.vue`) logos MUST remain
  `/brand/sumo-horizontal.svg` (unchanged).
- **FR-010**: The asset `sumo.webp` (source:
  `/Users/betonajera/Documents/Projects/Clients/SUMO/Assets/Logo/sumo.webp`) MUST be copied
  into `public/brand/`.

#### Marquee (`app/components/layout/SiteMarquee.vue`, `home.marquee` array)

- **FR-011**: The `home.marquee` array MUST be replaced entirely with exactly these items:
  - ES: `Sushi`, `Boneless`, `Smash Burgers`, `Yakimeshi`, `Sumo Sandwich`, `Hot Dogs`, `$269 todos los días`
  - EN: `Sushi`, `Boneless`, `Smash Burgers`, `Yakimeshi`, `Sumo Sandwich`, `Hot Dogs`, `$269 every day`
  Product names are identical across locales; only the last phrase is localized.

#### Homepage SEO (`app/pages/index.vue`)

- **FR-012**: Dedicated i18n keys `home.seo.title` and `home.seo.description` MUST be added
  and `useSeoMeta` MUST reference them instead of deriving title/description from
  `home.hero.headline` / `home.hero.kicker`.
- **FR-013**: The homepage SEO title MUST read:
  - ES: `Sumo All You Can Eat | Buffet de sushi y comida americana`
  - EN: `Sumo All You Can Eat | Sushi & American Food Buffet`
- **FR-014**: The homepage SEO description MUST read:
  - ES: `Disfruta de tu buffet Sumo y menú a la carta con sushi, hamburguesas, boneless y más. Vive la experiencia en nuestras más de 30 sucursales en CDMX, EDOMEX y Cuernavaca.`
  - EN: `Enjoy your Sumo buffet and à la carte menu with sushi, burgers, boneless and more. Live the experience at our 30+ locations across CDMX, EDOMEX and Cuernavaca.`

#### Type Selector (`app/features/homepage/components/HomeTypeSelector.vue`)

- **FR-015**: The kicker (`home.typeSelector.kicker`) MUST read `AYCE - EXPRESS` (identical
  in ES and EN).
- **FR-016**: The title (`home.typeSelector.title`) MUST read:
  - ES: `Dos experiencias, la misma garantía Sumo.`
  - EN: `Two experiences, the same Sumo guarantee.`
- **FR-017**: The first (AYCE) card MUST read "All You Can Eat" prominently as its visible
  title, and its description (`home.typeSelector.ayce.desc`) MUST read:
  - ES: `La experiencia completa para disfrutar sin límites: buffet, variedad de platillos a la carta y el sabor sumo que ya conoces.`
  - EN: `The complete experience to enjoy without limits: buffet, a variety of à la carte dishes and the Sumo flavor you already know.`
- **FR-018**: The second (Express) card MUST read "Express" prominently as its visible title,
  and its description (`home.typeSelector.express.desc`) MUST read:
  - ES: `La opción práctica y rápida para disfrutar tus favoritos de Sumo de forma más ágil, sin perder sabor ni calidad (con platillos exclusivos).`
  - EN: `The quick, practical option to enjoy your Sumo favorites in a nimbler way, without losing flavor or quality (with exclusive dishes).`
- **FR-019**: The mapping of the existing `ayce.name`/`ayce.badge` and
  `express.name`/`express.badge` keys MUST be resolved so the cards read "All You Can Eat"
  and "Express" prominently, without duplicating the component (the design-decision on which
  key becomes the prominent title vs. secondary label is left to implementation, but the
  visible result MUST match FR-017/FR-018).

#### Featured Rail (`app/features/homepage/components/HomeFeaturedRail.vue`)

- **FR-020**: The featured rail section MUST present THREE lines (a heading slot is added):
  - Label/kicker: ES `Los favoritos de nuestros clientes` · EN `Our customers' favorites`
  - Heading (new): ES `Garantía Sumo` · EN `Sumo Guarantee`
  - Subtitle: ES `Amado y recomendado por nuestros clientes` · EN `Loved and recommended by our customers`

#### Branches CTA (`app/features/homepage/components/HomeBranchesCta.vue`)

- **FR-021**: The branches CTA title (`home.branches.title`) MUST read:
  - ES: `Más de 30 sucursales en CDMX, EDOMEX y Cuernavaca`
  - EN: `30+ locations across CDMX, EDOMEX and Cuernavaca`

#### Footer (`app/components/layout/SiteFooter.vue`)

- **FR-022**: The footer brand blurb (`footer.brand.blurb`) MUST read:
  - ES: `Sumo All You Can Eat es el buffet en donde encontrarás sushi, alitas, hamburguesas, ramen y mucho más, todo preparado al instante y con una gran variedad de bebidas y promociones para ofrecer una experiencia llena de sabor, variedad y diversión, tú eliges si es en familia, con amigos o en pareja.`
  - EN: `Sumo All You Can Eat is the buffet where you'll find sushi, wings, burgers, ramen and much more, all made to order and with a great variety of drinks and promotions for an experience full of flavor, variety and fun — you choose whether it's with family, friends or your partner.`

#### Site-wide tagline

- **FR-023**: The tagline "Estilo americano-japonés" MUST be replaced by "Buffet preparado
  al instante" in ALL occurrences: `brand.tagline` and `footer.brand.tagline` (the hero
  kicker is already covered by FR-006). No occurrence of the old tagline may remain.
  - ES: `Buffet preparado al instante`
  - EN: `Buffet made to order`

#### Page titles → H1 AND SEO/tab title

- **FR-024**: The Branches page (`app/pages/branches.vue`) MUST show, in BOTH the H1
  (`branches.page.heading`) and the SEO/tab title (`branches.page.title`):
  ES `Sucursales Sumo` · EN `Sumo Branches`.
- **FR-025**: The Promotions page (`app/pages/promotions.vue`) MUST show, in BOTH the H1
  (`promotions.page.heading`) and the SEO/tab title (`promotions.seo.title`):
  ES `Promociones Sumo` · EN `Sumo Promotions`.
- **FR-026**: The Reserve page (`app/pages/reserve.vue`) MUST show, in BOTH the H1 and the
  SEO/tab title (`reservation.page_title`): ES `Reservas Sumo` · EN `Sumo Reservations`.

#### Menu drinks label

- **FR-027**: The menu drinks category label (`menu.category.drinks`) MUST read:
  - ES: `Bebidas y coctelería`
  - EN: `Drinks & cocktails`
- **FR-028**: The drinks-label change MUST be i18n-only at runtime (the UI resolves it via
  `t('menu.category.drinks')` in `MenuCategoryChips`, `MenuDrinkSection`, `MenuShell`). NO
  production database migration and NO production DB write may be performed.
- **FR-029**: For consistency, the seed file `server/db/seeds/menuCategories.ts`
  (`nameEs`/`nameEn` for drinks) MUST be aligned to the new label. This is a seed-only,
  non-migration change.

#### Cross-cutting

- **FR-030**: Every changed string MUST be updated in BOTH `i18n/locales/es.json` and
  `i18n/locales/en.json`. ES values are the client's verbatim text; EN values are the
  approved translations in `client-brief.md`.
- **FR-031**: NO new routes may be added and NO new page files created; this feature only
  edits existing pages, components, i18n files, the seed file, and adds one asset and one
  self-hosted font.
- **FR-032**: Every component changed by this feature MUST keep or gain a co-located
  Storybook story (`ComponentName.stories.ts`, ≤200 lines) and a co-located Vitest spec
  (`ComponentName.spec.ts`). `vue-tsc --noEmit` and all tests MUST pass.

### Key Entities *(include if feature involves data)*

- **i18n message keys**: Structured ES/EN string entries under `home`, `brand`, `footer`,
  `branches`, `promotions`, `reservation` and `menu` namespaces. Attributes: key path, ES
  value, EN value. This feature adds keys (`home.seo.title`, `home.seo.description`,
  `home.featured` heading) and updates existing keys.
- **Brand assets**: `sumo.webp` (hero-frame illustrated lockup, new), `sumo-horizontal.svg`
  (nav/footer, unchanged), and the self-hosted Titan One woff2 font file.
- **Menu category seed row (drinks)**: `nameEs`/`nameEn` in `menuCategories.ts` — aligned for
  consistency only (no migration).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of the 10 documented copy changes render the exact client-brief text in
  both ES and EN when toggling locale on the corresponding surfaces.
- **SC-002**: The hero headline is real, selectable text (a text selection tool can select
  "All You Can Eat") and screen readers announce it as a single heading via the `<h1>` /
  aria-label.
- **SC-003**: The headline's white fill + thick black (`--ink`) outline is visually legible;
  the axe `color-contrast` rule (which cannot measure the stroke) is scoped-off for the
  headline node in its Storybook story with a documented justification.
- **SC-004**: Zero occurrences of "Estilo americano-japonés" / "American-Japanese style"
  remain anywhere in the rendered site or the i18n files.
- **SC-005**: The Branches, Promotions and Reserve pages each show the new title in BOTH the
  visible H1 and the browser tab/SEO title, in both locales (6 title placements × 2 locales
  verified).
- **SC-006**: The hero frame shows the new illustrated logo while the nav and footer logos
  are visually unchanged.
- **SC-007**: With `prefers-reduced-motion: reduce`, the headline plays no settle animation
  (and the headline has no rotation in any mode).
- **SC-008**: The homepage still meets its performance budget (Lighthouse 90+); adding the
  self-hosted font and the webp asset does not regress it.
- **SC-009**: No production database migration runs for the drinks-label change; the label
  updates purely via i18n.
- **SC-010**: `vue-tsc --noEmit` passes and every changed component has a passing co-located
  Vitest spec and a co-located Storybook story ≤200 lines.

## Assumptions

- The existing homepage components, layout components, i18n files, and the affected pages
  already exist (delivered by features 010–018) and are only being edited here.
- The design tokens `--panel` (white) and `--ink` (black) already exist in the global
  stylesheet and carry the official brand values; the headline reuses them (no new color
  tokens introduced).
- The source asset `sumo.webp` exists at the client path and is suitable for web use as-is
  (correct size/quality); if not, it is optimized without changing the visible artwork.
- The Titan One font may be self-hosted under the OFL license; the woff2 file will be committed
  under the app's font/public assets and referenced via `@font-face`.
- "Prominent" card titles ("All You Can Eat" / "Express") reuse the existing type-selector
  card structure by re-mapping existing name/badge keys, not by adding a new card component.
- The client explicitly approved the word "Buffet" in the new tagline, subtitle and footer
  blurb, overriding the general "avoid the word Buffet" brand guidance from
  `docs/business/overview.md` for these specific, client-authored strings.
- Branch count of 31 (incl. Cuernavaca) is verified in `server/db/seeds/branches.ts`, so
  "más de 30" is accurate.

## Dependencies

- Existing features 010 (Homepage), 011 (Menu), 012 (Promotions), 013 (Branches), 014
  (Reservation) and the shared layout components from feature 007.
- The Nuxt i18n setup (`@nuxtjs/i18n`) and the ES/EN locale files.
- The design-token stylesheet (`--panel`, `--ink`, `--disp`).

## Out of Scope

- Any new route or page.
- Any production database migration or runtime DB write.
- Changing the general display font (Bricolage Grotesque) anywhere other than the hero
  headline.
- Changing nav/footer logos.
- Restyling the type-selector, featured-rail, branches-CTA or footer beyond the copy/heading
  changes and (for the featured rail) the added heading slot.
