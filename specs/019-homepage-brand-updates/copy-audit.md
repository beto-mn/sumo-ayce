# Copy Audit: Feature 019 — Homepage & Global Brand Updates

**Date**: 2025-07-01  
**Project**: SUMO AYCE (Nuxt 4)  
**Locale Files**: `/i18n/locales/es.json`, `/i18n/locales/en.json`

---

## Locale Files Overview

### Structure
Both locale files follow a hierarchical key structure with language-specific values.

**File Paths**:
- Spanish (ES): `/Users/betonajera/Workspaces/BetoNajera/sumo-ayce/i18n/locales/es.json`
- English (EN): `/Users/betonajera/Workspaces/BetoNajera/sumo-ayce/i18n/locales/en.json`

**Top-Level Keys**:
- `nav` — Navigation link labels
- `common` — Shared CTAs, language toggle, close button
- `brand` — Global brand tagline and badge
- `footer` — Footer content (brand, nav, social, contact, legal)
- `branches` — Branches page (title, headings, filters, search, card labels, etc.)
- `promotions` — Promotions page (title, badges, empty state, SEO)
- `contact` — Contact page (title, form labels, placeholders, WhatsApp, social links, email)
- `home` — **[PRIMARY AUDIT FOCUS]** All homepage sections
- `menu` — Menu categories, modalities, drink groups, dishes, sauces, SEO
- `reservation` — Reservation form page (title, form labels, errors, confirmation)

---

## Item-by-Item Audit

### 1. Homepage Hero Headline ("ALL YOU CAN EAT")

**i18n Key**: `home.hero.headline`

**Component File**: `/Users/betonajera/Workspaces/BetoNajera/sumo-ayce/app/features/homepage/components/HomeHero.vue` (line 22)

**Current Values**:
- **ES**: `"All You Can Eat"`
- **EN**: `"All You Can Eat"`

**Usage Location**: Rendered as `<h1>` in HomeHero.vue; also used in page SEO meta (index.vue, line 19).

---

### 2. Homepage Hero Kicker/Eyebrow & Subtitle

**Kicker i18n Key**: `home.hero.kicker`

**Component File**: `/Users/betonajera/Workspaces/BetoNajera/sumo-ayce/app/features/homepage/components/HomeHero.vue` (line 18)

**Current Values**:
- **ES**: `"Come sin límites · Estilo americano-japonés"`
- **EN**: `"Eat without limits · American-Japanese style"`

**Subtitle i18n Key**: `home.hero.subtitle`

**Component File**: `/Users/betonajera/Workspaces/BetoNajera/sumo-ayce/app/features/homepage/components/HomeHero.vue` (line 27)

**Current Values**:
- **ES**: `"Rolls, ramen, teppanyaki y smash burgers — ilimitados por un precio fijo. Llega con hambre, vete feliz."`
- **EN**: `"Rolls, ramen, teppanyaki and smash burgers — unlimited for one fixed price. Come hungry, leave happy."`

**Note**: The "Estilo americano-japonés" string is part of the **kicker**, not the subtitle. The **brand tagline** "Estilo americano-japonés" also appears in:
- `brand.tagline` (ES: `"Estilo americano-japonés"`, EN: `"American-Japanese style"`)
- `footer.brand.tagline` (includes both tagline and "All You Can Eat")

---

### 3. Homepage MARQUEE Component

**Component Location**: `/Users/betonajera/Workspaces/BetoNajera/sumo-ayce/app/components/layout/SiteMarquee.vue`

**i18n Key**: `home.marquee` (array)

**Source**: i18n array (not hardcoded, not config-sourced)

**Current Values**:
- **ES**:
  1. `"Sushi ilimitado"`
  2. `"Ramen 12 h de caldo"`
  3. `"Teppanyaki en vivo"`
  4. `"Smash burgers"`
  5. `"$269 todos los días"`

- **EN**:
  1. `"Unlimited sushi"`
  2. `"12-hour ramen broth"`
  3. `"Live teppanyaki"`
  4. `"Smash burgers"`
  5. `"$269 every day"`

**Component Logic**: Uses `tm('home.marquee')` and `rt()` to resolve and render each phrase; items are separated by an orange star (✺) visually.

---

### 4. Homepage SEO Metadata

**File**: `/Users/betonajera/Workspaces/BetoNajera/sumo-ayce/app/pages/index.vue` (lines 18–23)

**Implementation**: Uses `useSeoMeta()` composable.

**Keys Used**:
- `home.hero.headline` → `title`, `ogTitle`
- `home.hero.kicker` → `description`, `ogDescription`

**Rendered Meta Tags**:
- **Title**: `"SUMO · " + t('home.hero.headline')`
- **Description**: `t('home.hero.kicker')`
- **OG Title**: Same as title
- **OG Description**: Same as description

---

### 5. "Dos formatos, la misma garantía SUMO" Section (AYCE/Express Type Selector)

**Component Name**: `HomeTypeSelector.vue`

**File Path**: `/Users/betonajera/Workspaces/BetoNajera/sumo-ayce/app/features/homepage/components/HomeTypeSelector.vue`

**Section Heading Key**: `home.typeSelector.title`

**Current Values**:
- **ES**: `"Dos formatos, la misma garantía SUMO."`
- **EN**: `"Two formats, the same SUMO guarantee."`

**Kicker Key**: `home.typeSelector.kicker`

**Current Values**:
- **ES**: `"Elige tu SUMO"`
- **EN**: `"Pick your SUMO"`

**AYCE Card Keys**:
- Title: `home.typeSelector.ayce.name`
  - **ES**: `"SUMO AYCE"`
  - **EN**: `"SUMO AYCE"`
- Badge: `home.typeSelector.ayce.badge`
  - **ES**: `"All You Can Eat"`
  - **EN**: `"All You Can Eat"`
- Description: `home.typeSelector.ayce.desc`
  - **ES**: `"Todo el All You Can Eat + menú a la carta. La experiencia SUMO completa, para sentarte y repetir."`
  - **EN**: `"All You Can Eat + à la carte. The full SUMO experience — sit down and refill."`
- Chips: `home.typeSelector.ayce.chips` (array)
  - **ES**: `["All You Can Eat", "A la carta"]`
  - **EN**: `["All You Can Eat", "À la carte"]`

**Express Card Keys**:
- Title: `home.typeSelector.express.name`
  - **ES**: `"SUMO Express"`
  - **EN**: `"SUMO Express"`
- Badge: `home.typeSelector.express.badge`
  - **ES**: `"Formato compacto"`
  - **EN**: `"Compact format"`
- Description: `home.typeSelector.express.desc`
  - **ES**: `"El mismo All You Can Eat de SUMO en un formato más chico y ágil. Mismo sabor, espacio compacto."`
  - **EN**: `"The same unlimited SUMO all-you-can-eat in a smaller, nimbler format. Same flavor, compact space."`
- Chips: `home.typeSelector.express.chips` (array)
  - **ES**: `["All You Can Eat"]`
  - **EN**: `["All You Can Eat"]`

**CTA Key**: `home.typeSelector.cta`
- **ES**: `"Ver menú"`
- **EN**: `"See menu"`

---

### 6. "Antojos del momento" Featured-Dishes Section

**Component Name**: `HomeFeaturedRail.vue`

**File Path**: `/Users/betonajera/Workspaces/BetoNajera/sumo-ayce/app/features/homepage/components/HomeFeaturedRail.vue`

**Section Heading (Kicker) Key**: `home.featured.title`

**Current Values**:
- **ES**: `"Antojos del momento"`
- **EN**: `"Cravings right now"`

**Subheading Key**: `home.featured.subtitle`

**Current Values**:
- **ES**: `"Una probadita de lo que te espera en el All You Can Eat."`
- **EN**: `"A taste of what's waiting at the all you can eat."`

**Note**: "Antojos del momento" is the kicker/eyebrow; the subtitle is the subheading.

---

### 7. Site FOOTER

**Component Location**: `/Users/betonajera/Workspaces/BetoNajera/sumo-ayce/app/components/layout/SiteFooter.vue`

**Descriptive Paragraph Key**: `footer.brand.blurb`

**Current Values**:
- **ES**: `"Come sin límites, estilo americano-japonés. Llega con hambre, vete feliz."`
- **EN**: `"Eat without limits, American-Japanese style. Come hungry, leave happy."`

**"10 sucursales" Text Key**: `home.branches.title`

**Current Values**:
- **ES**: `"10 sucursales en CDMX y Edomex"`
- **EN**: `"10 locations across Mexico City"`

**Note**: This key is in the `home` namespace (not `footer`) because it's used in the **HomeBranchesCta** component, not the footer directly. However, it's visually repeated/similar to footer content. The footer contains the brand blurb and social/contact links.

**Other Footer Keys**:
- `footer.brand.tagline` (brand tagline + badge)
- `footer.nav.title` (nav section heading)
- `footer.social.title` (social links heading)
- `footer.contact.title` (contact section heading)
- `footer.legal.rights` (copyright text)

---

### 8. Page Titles & Headings for Key Pages

#### Branches Page (`/branches`)

**File**: `/Users/betonajera/Workspaces/BetoNajera/sumo-ayce/app/pages/branches.vue`

**H1/Page Title Key**: `branches.page.heading`
- **ES**: `"Encuentra tu SUMO"`
- **EN**: `"Find your SUMO"`

**Kicker Key**: `branches.page.kicker`
- **ES**: `"Sucursales"`
- **EN**: `"Locations"`

**SEO Title Key**: `branches.page.title`
- **ES**: `"Sucursales"`
- **EN**: `"Branches"`

**SEO Description Key**: `branches.page.description`
- **ES**: `"Encuentra la sucursal SUMO más cercana. All You Can Eat en todo CDMX y Edomex."`
- **EN**: `"Find the nearest SUMO branch. All You Can Eat across Mexico City and Edomex."`

---

#### Promotions Page (`/promotions`)

**File**: `/Users/betonajera/Workspaces/BetoNajera/sumo-ayce/app/pages/promotions.vue`

**Page Title Key**: `promotions.page.heading`
- **ES**: `"Promociones"`
- **EN**: `"Promotions"`

**Badge Key**: `promotions.page.badge`
- **ES**: `"Promociones"`
- **EN**: `"Promotions"`

**SEO Title Key**: `promotions.seo.title`
- **ES**: `"Promociones | SUMO AYCE"`
- **EN**: `"Promotions | SUMO AYCE"`

**SEO Description Key**: `promotions.seo.description`
- **ES**: `"Descubre todas las promociones activas de SUMO All You Can Eat. Martes 2x1, cumpleañeros, jueves especiales y más."`
- **EN**: `"Discover all active SUMO All You Can Eat promotions. Tuesdays 2for1, birthdays, specials and more."`

---

#### Reserve Page (`/reserve`)

**File**: `/Users/betonajera/Workspaces/BetoNajera/sumo-ayce/app/pages/reserve.vue`

**Page Title Key**: `reservation.page_title`
- **ES**: `"Reservar mesa | SUMO AYCE"`
- **EN**: `"Reserve a table | SUMO AYCE"`

**Note**: This is set via `useSeoMeta()` on line 44 of reserve.vue.

---

### 9. Menu Page: "Bebida" / Drinks Category Label

**Category Key**: `menu.category.drinks`

**Current Values**:
- **ES**: `"Bebidas"`
- **EN**: `"Drinks"`

**Source**: Both i18n-sourced AND database-sourced (dual approach):

1. **i18n Usage**: Components like `MenuShell.vue`, `MenuDrinkSection.vue`, and `MenuCategoryChips.vue` use `t('menu.category.drinks')` to display the label.

2. **Database Source**: Menu category names are **also seeded in the database** (`menu_categories` table):
   - Seed file: `/Users/betonajera/Workspaces/BetoNajera/sumo-ayce/server/db/seeds/menuCategories.ts`
   - Database fields: `nameEs`, `nameEn` (lines 137–138 in seed)
   - The API returns bilingual category objects with `name: { es: '...', en: '...' }` from the database (type: `FullMenuCategory`)

**Important**: Menu categories come from the database at runtime (queried via `/api/v1/menu`), but the i18n keys serve as fallback labels in the UI for static category names or display purposes.

---

### 10. Hero Logo Image & Site Logo Usage

**HomeHero Logo**:
- **Asset**: `/brand/sumo-vertical.svg`
- **Component File**: `/Users/betonajera/Workspaces/BetoNajera/sumo-ayce/app/features/homepage/components/HomeHero.vue` (line 55)
- **Alt Text Key**: `home.hero.logoAlt`
  - **ES**: `"SUMO — All You Can Eat"`
  - **EN**: `"SUMO — All You Can Eat"`

**Site Logo (Nav & Footer)**:
- **Asset**: `/brand/sumo-horizontal.svg` (bare horizontal lockup)
- **Component File**: `/Users/betonajera/Workspaces/BetoNajera/sumo-ayce/app/components/layout/SiteLogo.vue`
- **Locations**:
  1. Navigation header: `/app/components/layout/SiteHeader.vue` (line 52)
  2. Footer: `/app/components/layout/SiteFooter.vue` (line 75)
- **Alt Text Key**: `home.hero.logoAlt` (reused from hero)
  - **ES/EN**: `"SUMO — All You Can Eat"`

**Note**: Both logos are rendered **bare** (no background box) with their original SVG outline/styling. The vertical logo appears on a cream/striped hero background; the horizontal logo appears in the navigation (cream background) and footer (dark ink background).

---

## Summary of All i18n Keys for Feature 019

| Item | Primary Key | Additional Keys | File(s) |
|------|-------------|-----------------|---------|
| Hero Headline | `home.hero.headline` | — | HomeHero.vue, index.vue |
| Hero Kicker | `home.hero.kicker` | — | HomeHero.vue, index.vue |
| Hero Subtitle | `home.hero.subtitle` | — | HomeHero.vue |
| Marquee Items | `home.marquee` (array) | — | SiteMarquee.vue |
| SEO (Home) | — | `home.hero.headline`, `home.hero.kicker` | index.vue |
| Type Selector Title | `home.typeSelector.title` | `home.typeSelector.kicker`, `home.typeSelector.cta` | HomeTypeSelector.vue |
| AYCE Card | — | `home.typeSelector.ayce.{name, badge, desc, chips}` | HomeTypeSelector.vue |
| Express Card | — | `home.typeSelector.express.{name, badge, desc, chips}` | HomeTypeSelector.vue |
| Featured Rail | `home.featured.title` | `home.featured.subtitle` | HomeFeaturedRail.vue |
| Promotions Section | `home.promotions.title` | `home.promotions.kicker`, `home.promotions.cta` | HomePromotions.vue |
| Branches CTA Section | `home.branches.title` | `home.branches.kicker`, `home.branches.desc`, `home.branches.findBranch`, `home.branches.reserve` | HomeBranchesCta.vue |
| Footer Blurb | `footer.brand.blurb` | `footer.brand.tagline` | SiteFooter.vue |
| Logo Alt Text | `home.hero.logoAlt` | — | HomeHero.vue, SiteLogo.vue (nav & footer) |
| Branches Page H1 | `branches.page.heading` | `branches.page.kicker`, `branches.page.title`, `branches.page.description` | branches.vue |
| Promotions Page H1 | `promotions.page.heading` | `promotions.page.badge`, `promotions.seo.title`, `promotions.seo.description` | promotions.vue |
| Reserve Page Title | `reservation.page_title` | — | reserve.vue |
| Menu Category (Drinks) | `menu.category.drinks` | — | MenuShell.vue, MenuDrinkSection.vue, MenuCategoryChips.vue |

---

## File Dependency Map

**Locale Files** (source of truth):
- `/i18n/locales/es.json`
- `/i18n/locales/en.json`

**Components Referencing These Keys**:
- `/app/features/homepage/components/HomeHero.vue`
- `/app/features/homepage/components/HomeTypeSelector.vue`
- `/app/features/homepage/components/HomeFeaturedRail.vue`
- `/app/features/homepage/components/HomePromotions.vue`
- `/app/features/homepage/components/HomeBranchesCta.vue`
- `/app/components/layout/SiteMarquee.vue`
- `/app/components/layout/SiteFooter.vue`
- `/app/components/layout/SiteLogo.vue`
- `/app/components/layout/SiteHeader.vue`

**Pages**:
- `/app/pages/index.vue` (homepage)
- `/app/pages/branches.vue`
- `/app/pages/promotions.vue`
- `/app/pages/reserve.vue`
- `/app/pages/menu.vue`

**Database Seeds** (alternative source for category names):
- `/server/db/seeds/menuCategories.ts` (menu category names in DB)

---

## Notes for Feature Implementation

1. **Single Source of Truth**: All homepage copy originates from `/i18n/locales/{es,en}.json`.
2. **Menu Categories**: Drinks category label comes from both i18n AND the database seed. If updating, update both sources.
3. **Logo Assets**: Two SVGs in use — vertical (hero) and horizontal (nav/footer) — at `/brand/sumo-vertical.svg` and `/brand/sumo-horizontal.svg`.
4. **Brand Consistency**: The tagline "Estilo americano-japonés" / "American-Japanese style" appears in multiple places: `brand.tagline`, `home.hero.kicker`, `footer.brand.tagline`, and `footer.brand.blurb`. Ensure consistency across updates.
5. **SEO Meta**: Homepage SEO title and description use `home.hero.headline` and `home.hero.kicker` respectively. Updates to these keys will automatically propagate to SEO.
6. **Marquee Separation**: Marquee items in the array are visually separated by orange stars (✺) at runtime; no separator strings needed in i18n.

