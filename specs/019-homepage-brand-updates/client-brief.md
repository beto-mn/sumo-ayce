# Client Brief — Feature 019 (Homepage & Global Brand Updates)

**Date**: 2026-07-01
**Source**: Direct client (Beto) instructions + confirmed decisions.
**Companion doc**: `copy-audit.md` (exact i18n keys + file locations for every item below).

This is the **source of truth** for the copy and design decisions. The `spec_author`
must encode all of this into `spec.md` verbatim. EN values below are suggested
translations — refine wording but keep meaning; ES is the client's exact text.

---

## Confirmed design decisions

1. **AYCE headline** — implemented as **CSS-styled real text** (NOT an image), keeping
   the existing i18n key for the `<h1>` / aria-label. Font: **Anton** (Google Fonts, OFL),
   **self-hosted** (@font-face, woff2 preferred — the app currently has no bundled webfont).
   Treatment: **Variant A "Plana"** — two lines ("ALL YOU" / "CAN EAT") each on a solid
   `--ink` box with `--orange` text, second line offset right, slight opposite rotation per
   line (staggered look). **No border, no drop-shadow** (flat, per client). Uppercase.
   Must respect `prefers-reduced-motion` (no rotation animation; static rotation is fine).
2. **Bilingual** — the site is ES-default + EN toggle. **Translate all new copy to EN.**
   The AYCE headline text stays identical in both locales.
3. **New logo asset** — `sumo.webp` (illustrated 3-sumos lockup) replaces
   `/brand/sumo-vertical.svg` in the **HERO frame only**. Nav + footer keep the current
   `sumo-horizontal.svg`. Source file: `/Users/betonajera/Documents/Projects/Clients/SUMO/Assets/Logo/sumo.webp`
   → copy into `public/brand/`. Keep the existing tilted/rounded frame slot + alt key.
4. **Page titles** (Sucursales/Promos/Reservas Sumo) → applied to **both** the visible H1
   AND the tab/SEO title.
5. **Branch count** — verified in `server/db/seeds/branches.ts`: **31 branches** incl.
   Cuernavaca. So "más de 30 … CDMX, EDOMEX y Cuernavaca" is accurate; the old
   "10 sucursales" is wrong.

---

## Copy changes (ES = client verbatim, EN = translate)

### 1. Hero — `app/features/homepage/components/HomeHero.vue`
- **Kicker** `home.hero.kicker`:
  - ES: `Come sin límites · Buffet preparado al instante`
  - EN: `Eat without limits · Buffet made to order`
- **Headline** `home.hero.headline`: stays `All You Can Eat` (ES = EN). Now rendered with
  the Anton box treatment (see decision 1).
- **Subtitle** `home.hero.subtitle`:
  - ES: `Disfruta de tu buffet Sumo y menú a la carta con sushi, hamburguesas, boneless y más. Vive la experiencia en nuestras más de 30 sucursales en CDMX, EDOMEX y Cuernavaca.`
  - EN: `Enjoy your Sumo buffet and à la carte menu with sushi, burgers, boneless and more. Live the experience at our 30+ locations across CDMX, EDOMEX and Cuernavaca.`
- **Logo** — swap `src` to the new `sumo.webp`; keep `home.hero.logoAlt`.

### 2. Marquee — `app/components/layout/SiteMarquee.vue` (`home.marquee` array)
Replace ALL items with:
- ES: `Sushi`, `Boneless`, `Smash Burgers`, `Yakimeshi`, `Sumo Sandwich`, `Hot Dogs`, `$269 todos los días`
- EN: `Sushi`, `Boneless`, `Smash Burgers`, `Yakimeshi`, `Sumo Sandwich`, `Hot Dogs`, `$269 every day`
(Product names stay as-is; only the last phrase is localized.)

### 3. Homepage SEO — `app/pages/index.vue`
Currently derives title/description from `home.hero.headline` / `home.hero.kicker`.
**Add dedicated keys** `home.seo.title` + `home.seo.description` and point `useSeoMeta` at them:
- Title ES: `Sumo All You Can Eat | Buffet de sushi y comida americana`
  - EN: `Sumo All You Can Eat | Sushi & American Food Buffet`
- Description ES: `Más de 45 platillos por un solo precio... Descubre tu nuevo lugar favorito.`
  - EN: `45+ dishes for a single price... Discover your new favorite place.`

### 4. Type Selector — `app/features/homepage/components/HomeTypeSelector.vue`
- **Kicker** `home.typeSelector.kicker`: ES/EN `AYCE - EXPRESS`
- **Title** `home.typeSelector.title`:
  - ES: `Dos experiencias, la misma garantía Sumo.`
  - EN: `Two experiences, the same Sumo guarantee.`
- **AYCE card** — visible title `All You Can Eat`; description `home.typeSelector.ayce.desc`:
  - ES: `La experiencia completa para disfrutar sin límites: buffet, variedad de platillos a la carta y el sabor sumo que ya conoces.`
  - EN: `The complete experience to enjoy without limits: buffet, a variety of à la carte dishes and the Sumo flavor you already know.`
- **Express card** — visible title `Express`; description `home.typeSelector.express.desc`:
  - ES: `La opción práctica y rápida para disfrutar tus favoritos de Sumo de forma más ágil, sin perder sabor ni calidad (con platillos exclusivos).`
  - EN: `The quick, practical option to enjoy your Sumo favorites in a nimbler way, without losing flavor or quality (with exclusive dishes).`
- NOTE: current keys are `ayce.name`="SUMO AYCE"/`ayce.badge`="All You Can Eat" and
  `express.name`="SUMO Express"/`express.badge`="Formato compacto". spec_author to decide
  the cleanest mapping so the cards read "All You Can Eat" and "Express" prominently.

### 5. Featured Rail ("Antojos del momento") — `app/features/homepage/components/HomeFeaturedRail.vue`
Client wants THREE lines (current section has only kicker + subtitle → add a heading slot):
- **Label / kicker**: ES `Los favoritos de nuestros clientes` · EN `Our customers' favorites`
- **Heading** (new): ES `Garantía Sumo` · EN `Sumo Guarantee`
- **Subtitle**: ES `Amado y recomendado por nuestros clientes` · EN `Loved and recommended by our customers`

### 6. Branches CTA — `home.branches.title` (in `HomeBranchesCta.vue`)
- ES: `Más de 30 sucursales en CDMX, EDOMEX y Cuernavaca`
- EN: `30+ locations across CDMX, EDOMEX and Cuernavaca`

### 7. Footer blurb — `footer.brand.blurb` (`SiteFooter.vue`)
- ES: `Sumo All You Can Eat es el buffet en donde encontrarás sushi, alitas, hamburguesas, ramen y mucho más, todo preparado al instante y con una gran variedad de bebidas y promociones para ofrecer una experiencia llena de sabor, variedad y diversión, tú eliges si es en familia, con amigos o en pareja.`
- EN: `Sumo All You Can Eat is the buffet where you'll find sushi, wings, burgers, ramen and much more, all made to order and with a great variety of drinks and promotions for an experience full of flavor, variety and fun — you choose whether it's with family, friends or your partner.`

### 8. Brand tagline "Estilo americano-japonés" → "Buffet preparado al instante" (SITE-WIDE)
Replace in **all** occurrences: `brand.tagline`, `footer.brand.tagline`, and (already) the
hero kicker.
- ES: `Buffet preparado al instante`
- EN: `Buffet made to order`

### 9. Page titles → H1 **and** SEO/tab title
- Branches (`branches.vue`): `branches.page.heading` + `branches.page.title` →
  ES `Sucursales Sumo` · EN `Sumo Branches`
- Promotions (`promotions.vue`): `promotions.page.heading` + `promotions.seo.title` →
  ES `Promociones Sumo` · EN `Sumo Promotions`
- Reserve (`reserve.vue`): H1 + `reservation.page_title` →
  ES `Reservas Sumo` · EN `Sumo Reservations`

### 10. Menu drinks label — `menu.category.drinks`
UI renders this via i18n (verified: `MenuCategoryChips`, `MenuDrinkSection`, `MenuShell`
all use `t('menu.category.drinks')`), so this is an **i18n-only** change — **no prod DB
migration required**. Align `server/db/seeds/menuCategories.ts` (nameEs/nameEn) too for
consistency.
- ES: `Bebidas y coctelería`
- EN: `Drinks & cocktails`

---

## Scope guardrails
- Original feature note said "no backend/DB". Confirmed: menu label is i18n-driven, so the
  only server-side touch is an OPTIONAL seed alignment (no migration, no prod DB write).
- New runtime dependency: the **Anton** self-hosted font (add @font-face + asset; update
  `--disp` usage only for the headline, not globally — keep Bricolage as the general display
  font unless spec decides otherwise).
- New asset `public/brand/sumo.webp`.
- Every changed string needs BOTH `es.json` and `en.json` updated.
- Follow constitution: co-located stories/specs, ≤200-line story files, a11y AA, tokens only
  (no inline hex), Storybook coverage for any changed component + `vue-tsc` + tests green.
