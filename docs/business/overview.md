# SUMO AYCE — Design Context (Chosen direction: "Mercado Pop")

> Companion to the business/technical context. Describes the **client-approved visual
> direction** and how to translate it into Nuxt 4 + Vue 3 components. The reference HTML
> prototype lives outside the repo (delivered by the designer); this doc is the source of
> truth for rebuilding it as components.

---

## 1. Direction concept

**Internal name:** Mercado Pop
**Personality:** young, social and festive — a modern "Japanese market" aesthetic.
**Key visual devices:** chunky blocks, **thick black borders (3px)**, **sticker-style shadows** (solid offset, no blur), saturated color, bouncy micro-animations, moving marquees, rotated sticker-style badges.
**Target feeling:** fun, "shareable" on social, bold but orderly.

> Not flat minimalism: the thick black border + solid offset shadow (`6px 6px 0 #000`) are the signature of the style. Every "card-like" element (cards, buttons, chips, inputs) carries it.

---

## 2. Design tokens

> ⚠️ **Brand conflict to resolve with the client:** the business doc sets orange
> `#F37021` and Express blue `#2B3990`. The prototype uses `#FF6B2B` / `#2E7CF6` (more
> vivid, chosen for the pop style). **Recommended decision:** use the official brand-manual
> values (`#F37021`, `#2B3990`) as base tokens and, if they look dull on cream, bump
> saturation only on decorative accents. Settle this before building.

```
/* Color */
--bg:      #FFF7EC;   /* base cream */
--bg2:     #FFE9D2;   /* cream 2 (bands, hovers) */
--panel:   #FFFFFF;   /* card surface */
--ink:     #1A1209;   /* warm near-black — text + borders + shadows */
--soft:    #6B5C49;   /* secondary text */
--orange:  #F37021;   /* BRAND — AYCE accent (official) */
--blue:    #2B3990;   /* BRAND — Express accent (official, Express-only) */
--pink:    #FF2D6F;   /* decorative (promos/badges) */
--yellow:  #FFC23B;   /* decorative (stickers, language button) */
--green:   #1FAE5A;   /* success (confirmations) */
--line:    #1A1209;   /* border color = ink */
--accent:  var(--orange);  /* switches to --blue in Express context (see §6) */

/* Radii */
--r: 22px;  --r-sm: 14px;  /* pills use 999px */

/* Shadows (style signature — solid offset, no blur) */
--shadow:    6px 6px 0 var(--ink);
--shadow-sm: 4px 4px 0 var(--ink);

/* Layout */
--maxw: 1200px;

/* Typography */
--disp: "Bricolage Grotesque", system-ui, sans-serif;  /* display/UI, weight 800 */
--body: "Hanken Grotesk", system-ui, sans-serif;        /* body */
```

**Typography note:** the technical doc mentions **Lato**. The prototype uses **Bricolage Grotesque** (display) + **Hanken Grotesk** (body) — the "chunky" character relies on Bricolage 800. If the brand requires Lato, much of the style is lost: confirm. Recommendation: Bricolage for headings/UI, Lato or Hanken for body.

**Type scale**
- `h-xl` (hero): `clamp(48px, 9vw, 108px)`, UPPERCASE, line-height .86
- `h-lg` (section): `clamp(32px, 5vw, 60px)`
- body: 17px, line-height 1.55
- kicker: 13px, 800, uppercase, **black pill rotated -2°**

---

## 3. Base components (map to Vue)

| Component | Specs |
|---|---|
| **Button** (`.btn`) | 3px ink border, pill, `4px 4px 0` shadow; hover lifts `translate(-2px,-2px)` and shadow grows; active sinks. Variants: `--p` (filled accent, white text), `--ink` (filled black), `--sm`, `--lg` |
| **Card** | `--panel`, 3px ink border, 22px radius, `6px 6px 0` shadow |
| **Chip / filter** | pill, 2.5px border; active = filled ink, cream text |
| **Sticker badge** | absolute, yellow fill, 3px border, **rotated -8°** |
| **Kicker** | black pill, cream text, rotated -2° |
| **Input/Select/Textarea** | 2.5px ink border, 14px radius; focus = sticker shadow |
| **Nav** | sticky, cream bg, 3px bottom border; logo in rounded black box; pill links (active = filled accent); square yellow language button; burger on mobile |

**Micro-interactions:** hovers with slight rotation (`rotate(-1deg/-2deg)`) and bounce (`cubic-bezier(.34,1.56,.64,1)`). Respect `prefers-reduced-motion`.

**Entrance animation (reveal):** animate ONLY `transform` (don't animate `opacity` from 0). Use an IntersectionObserver that adds `.in`. Marquees: `@keyframes` translateX, pause under reduced-motion.

---

## 4. Pages & structure (content from WordPress)

Routes (Nuxt pages). The prototype was a hash SPA; in Nuxt these are real routes with 60s ISR.

1. **Home** (`/`)
   - Hero: large headline "ALL YOU CAN EAT", kicker "Come sin límites · Estilo americano-japonés", photo in a rotated frame + **price sticker** "$269", marquee.
   - Type selector: 2 large cards **SUMO AYCE** / **SUMO Express** → go to `/menu`.
   - Horizontal rail of featured dishes (scroll-snap).
   - Promos (3 cards) → from WordPress.
   - Google reviews (social proof).
   - Branches CTA band.
2. **Menu / Drinks** (`/menu`) — see §5 (product core).
3. **Promotions** (`/promociones`) — grid from WordPress CPT `promociones`.
4. **Branches** (`/sucursales`) — finder (see §7).
5. **Contact** (`/contacto`) — form → WhatsApp.

> **Important (copy):** the brand is **"Estilo americano-japonés"** (American-Japanese style),
> NOT "Japanese food". Never use the word **"Buffet"** (there's a competitor "Sumo Buffet")
> → use **"All You Can Eat"**.

---

## 5. Menu — the central UX challenge

Two combined navigation axes:

- **Location type:** `SUMO AYCE` (orange) vs `SUMO Express` (blue).
- **Modality:** only AYCE has `All You Can Eat` (buffet) **and** `À la carte`. Express only has `All You Can Eat`.

**Data rules (identical for both types):**
- **Drinks are the same** for AYCE and Express (shared category, with groups: Jumbo Cocktails, Cantaritos & SUMO Cups, Non-alcoholic, Sodas, Coffee & digestifs, Beers & spirits).
- Per-type differences: AYCE has "Sumo Sándwich"; Express has "Burritos" and "Postres".
- **Wings & Boneless always include 1 sauce** → the UI shows a **sauce picker** (radio, single active) under those dishes and in the "Salsas" category. 12 sauces.
- **À la carte** modality: carries a per-dish price (from the printed-menu PDF — pending integration). In "All You Can Eat", dishes show "incluido" (included), not a price.

**UI pattern:** type toggle (segmented) + modality toggle (AYCE only) + category chips that filter the grid. Each dish: image, name, description, and price or "incluido".

**Data structure** (replicate as TS types, fed from WordPress CPTs):
```ts
type MenuItem = { name: string; es: string; en: string; img?: string; price?: number; badge?: string }
type Section  = { cat: string; items?: MenuItem[]; bebidas?: true; salsas?: true; extras?: Extra[] }
type Menus    = { ayce: { buffet: Section[]; carta: Section[] }; express: { buffet: Section[] } }
```
Categories (i18n keys): entradas, burgers, sandwich, burritos, hotdogs, frio, caliente, dulce, postres, alitas, salsas, extras, bebidas.

---

## 6. Per-type color system (AYCE / Express)

`--accent` changes with context:
- **AYCE → orange** (`--orange`)
- **Express → blue** (`--blue`)

When the user is in Express context, blue should **clearly dominate**: buttons, accents, price kicker, active nav link, map pins, and (in the chosen direction) highlighted details. Blue is **exclusive to the Express line** — never use it as a general base. Implement as an `--accent` swap on a wrapper/state, not by rewriting each rule.

Branch map: **orange pin = AYCE**, **blue pin = Express**.

---

## 7. Features (aligned to the repo stack)

- **Branch finder:** geolocation (distance sort, haversine), postal-code fallback, denied-permission handling. In production: **Mapbox** (the prototype uses a schematic grid map with pins positioned by normalized lat/lng). Each card: type (color tag), name, address, distance, and Reserve / Directions (Google Maps) / Call actions.
- **Reservation:** modal with branch → **branch-dependent time slots** (each branch has its own `hours` range), date, party size, name, WhatsApp. On confirm: prefilled WhatsApp message **to that branch's number**. In production this goes through **Twilio** (confirmation to the client + notice to the manager) and is logged to Neon + a CSV to Drive.
- **Promotions:** CRUD designed to map to **WordPress CPT `promociones`**. Each promo: `badge`, `title`, `desc`, `validity` (bilingual), `color`, `type` (all/ayce/express), `active`. (The prototype's "edit" button was a demo; in production it's edited in WP admin.)
- **Bilingual ES/EN:** every UI and content string has `es`/`en`. Default **Spanish**. Language button in the nav. Use Nuxt i18n (`@nuxtjs/i18n`).
- **Contact:** form (name, WhatsApp, branch, message) → opens WhatsApp with the chosen branch's number.

---

## 8. Branch data

29 branches (source: client's `sumo_ayce.json`). Fields per branch:
`id, type ('ayce'|'express'), name, zone, addr, phone, lat, lng, hours:[open,close]`.

Marked as **Express**: Buenavista, Portal Centro *(confirm Tepepan — it wasn't in the JSON)*. The rest = AYCE.
> Pending from the client: per-branch dedicated phone (currently the reservations WhatsApp is used), real per-branch hours, and the final AYCE/Express classification.

---

## 9. Responsive

Mobile-first. Prototype breakpoints: `880px` (collapse 2→1 grids, nav→burger, map above the list) and `520px` (footer and gallery to 1 column; **footer links stacked vertically**). Hit targets ≥ 44px. The site is viewed and used mainly on mobile.

---

## 10. Pending assets (for production)

- Official logo in **vector** (.ai → SVG/PNG); use **unmodified** (square, orange background, white "SUMO", black "ALL YOU CAN EAT" bar).
- **Dish photos** in high quality (currently crops from the printed menu — variable quality).
- **Ambiance photos** and the SUMO **mascot** (a major brand asset) in PNG.
- **À la carte menu with prices** (PDF) → for the "À la carte" modality.
- Remaining **drink images**.
- Final **ES + EN copy** review.
- Confirm **official palette** and **typography** (see §2).
