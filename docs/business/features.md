# SUMO AYCE — Feature List & Build Context

> How to use this: the **HTML prototype (Mercado Pop direction) is the visual + behavioral
> spec**. Rebuild each feature as Nuxt 4 / Vue 3 components, pulling content from WordPress
> (CMS) and app data from Neon. This doc lists every feature with its purpose, flow, data,
> API surface, and acceptance criteria. Pair it with `docs/business/overview.md` (visual system).

**Reference prototype:** `/Users/betonajera/Documents/Projects/Clients/SUMO/Proposal/Mercado Pop D/`

Files in the prototype:
- `index.html` — page shell
- `mercadopop.css` — design tokens + base styles (signature look: 3px black borders, sticker shadows)
- `mercadopop.js` — render logic (i18n strings application, page composition)
- `sumo-core.js` — shared logic (i18n, distance, geolocation, WhatsApp link builder, reservation slots)
- `sumo-data.js` — seed data (branches, menu, drinks, promos, reviews, i18n strings)
- `assets/` — brand, deck, dishes, drinks, posters

> **Note**: the prototype is unpolished. It is the source of truth for **look and behavior**,
> NOT for code quality. Reimplement following the constitution (Article I — feature folders,
> DRY components, Storybook coverage; Article VII — design context as visual source of truth)
> and the design tokens in `docs/business/overview.md`.

---

## 0. Cross-cutting (applies to all pages)

- **Bilingual ES/EN** — every UI + content string has `es`/`en`. Default Spanish. Language toggle in nav. → Nuxt `@nuxtjs/i18n`. Content strings come bilingual from WordPress (ACF fields `*_es` / `*_en` or WPML/Polylang).
- **Per-type accent** — AYCE = orange, Express = blue (`--accent` swap). Blue is Express-exclusive. See `docs/business/overview.md` §6.
- **Brand copy rules** — "Estilo americano-japonés" (never "comida japonesa"); "All You Can Eat" (never "Buffet").
- **Responsive / mobile-first** — primary traffic is mobile. Breakpoints 880px / 520px (see `docs/business/overview.md` §9).
- **Content via WordPress REST/GraphQL**, ISR 60s. App features (reservations, loyalty, staff) talk to Neon directly, not WordPress.
- **WordPress admin setup is out of scope for this repo** — CPTs and ACF fields are configured by the user in WordPress admin. This repo only consumes the REST/GraphQL endpoints.

---

## 1. Homepage  `/`

**Purpose:** sell the AYCE experience fast and route users to menu / branches / reservation.
**Sections (in order):** hero (headline "ALL YOU CAN EAT" + kicker + $269 price sticker + photo) → type selector (AYCE / Express cards) → featured dishes rail → promotions (3) → Google reviews → branches CTA band.
**Data:** featured dishes + promos + reviews from WordPress. Price ($269) configurable.
**Acceptance:** loads < 2s on 4G; hero legible on 360px; type cards link to `/menu?type=ayce|express`; reduced-motion disables marquee/bounce.

---

## 2. Menu / Bebidas  `/menu`  ← product core

**Purpose:** browse the full menu by location type and modality.
**Controls:** type toggle (AYCE/Express) + modality toggle (AYCE only: All You Can Eat / À la carte) + category chips filtering the dish grid.
**Rules:**
- Drinks identical for both types (shared category, grouped).
- AYCE-only: "Sumo Sándwich". Express-only: "Burritos", "Postres".
- **Wings & Boneless always include 1 sauce** → render sauce picker (radio, single active, 12 sauces).
- À la carte → per-dish price. All You Can Eat → "incluido" instead of price.
- "Ver carta completa" → lightbox with full printed-menu images.
**Data (WordPress CPT `menu_item`):** `name, desc_es, desc_en, image, category, type[], modality[], price?, badge?`. Categories: entradas, burgers, sandwich, burritos, hotdogs, frio, caliente, dulce, postres, alitas, salsas, extras, bebidas.
**Acceptance:** switching type/modality updates categories + grid without full reload; chips scroll/filter correctly; sauce picker appears for alitas + salsas; prices only in à la carte; lightbox opens/closes.

---

## 3. Promotions  `/promociones`

**Purpose:** the most dynamic content — client adds/edits/removes freely.
**Data (WordPress CPT `promociones`):** `badge{es,en}, title{es,en}, desc{es,en}, validity{es,en}, color (orange|pink|blue|yellow), type (all|ayce|express), active (bool)`.
**Behavior:** only `active` promos show; Express promos use blue; homepage shows top 3.
**Acceptance:** editing in WP admin reflects on site within ISR window (60s); inactive promos hidden; no code needed to manage them.

---

## 4. Branch Finder  `/sucursales`

**Purpose:** find nearest SUMO; distinguish AYCE vs Express.
**Flow:** geolocation (sort by distance, haversine) → permission-denied handling → postal-code fallback → list + interactive map (**Mapbox**). Pin color: orange=AYCE, blue=Express. Card actions: Reserve (opens reservation), Directions (Google Maps), Call.
**Data (WordPress CPT `sucursales`):** `name, type, address, zone, phone, lat, lng, hours[open,close]`. Seed: 29 branches in `sumo_ayce.json`. Express: Buenavista, Portal Centro (+confirm Tepepan).
**Server:** none required for search (client-side distance); optional `/server/api/sucursales` proxy/cache of WP data. **Backend geolocation API already exists** (feature 004-branch-finder-location, done).
**Acceptance:** denied geolocation falls back gracefully; CP search works; nearest-first order correct; map pins clickable ↔ list.

---

## 5. Reservation System  `/reservaciones` (modal)

**Purpose:** book a table; confirm via WhatsApp.
**Flow:** form (branch → **branch-dependent time slots from `hours`**, date, party size, name, phone) → submit → confirmation. Prototype opens a prefilled WhatsApp to the branch number; **production** routes through Twilio.
**Server:** **already exists** (features 002-reservaciones-crud and 003-twilio-notifications, both done):
- `POST /api/v1/reservations` → validate, write to Neon, send Twilio WhatsApp to **client** (confirmation) + to **branch manager** (notice), return status.
- Cron (end of day) → generate CSV from Neon → upload to client's Google Drive folder (Service Account).
**Data (Neon, Drizzle):** `reservations { id, branch_id, name, phone, date, time, party_size, status, created_at }` — schema already in place (feature 001).
**Acceptance:** slots match the selected branch's hours; both WhatsApp messages send; row persists; daily CSV lands in Drive.

---

## 6. Loyalty Program  `/lealtad`

**Purpose:** points per visit → reward redemption, with WhatsApp notifications.
**Flow:** user registers/authenticates → accrues points per validated visit → redeems rewards → gets WhatsApp updates.
**Server:** **already exists** (feature 005-loyalty-program, done):
- `POST /api/v1/loyalty/customers` (register), `GET /api/v1/loyalty/customers/:phone` (balance + history), `POST /api/v1/loyalty/transactions` (earn), `POST /api/v1/loyalty/redemptions` (redeem). WhatsApp notifications already wired via Twilio.
**Data (Neon):** `users { id, name, phone, password_hash, points, created_at }`, `loyalty_tx { id, user_id, branch_id, type (earn|redeem), points, created_at }`.
**Acceptance:** points accrue only on staff-validated visits; redemption deducts atomically; auth secure (hashed passwords, sessions/JWT); notifications fire.

---

## 7. Staff Portal  `/staff`

**Status:** already shipped (feature 006-staff-portal, done). Out of scope for the redesign pass unless a re-style pass is explicitly requested later.

---

## 8. Suggested build order

1. **Scaffold + design system** (feature 007) — verify and install missing libs (Tailwind CSS, `@nuxtjs/i18n`, `mapbox-gl`); set up design tokens from `docs/business/overview.md` §2; build base components (Button, Card, Chip, Sticker, Kicker, Input/Select/Textarea, Nav); i18n config; layouts.
2. **Content pages** — Homepage, Menu, Promotions, Branches.
3. **Branch finder** — Mapbox + geolocation/CP (UI on top of existing backend 004).
4. **Reservations modal** — UI on top of existing backend 002 + 003.
5. **Loyalty user portal** — UI on top of existing backend 005.

> The prototype already implements the UI for the content pages and the branch finder /
> reservation UX end-to-end (without the real Twilio/Neon backend). Use its `.css`/`.js`
> as the source of truth for look + behavior; port the data shapes from `sumo-data.js`
> into TS types + WordPress fields. Reimplement following Article I (feature folders,
> DRY components) and Article VII (Storybook coverage).

---

## 9. Out of scope for this repo

- **WordPress admin configuration** — CPTs (`menu_item`, `promociones`, `sucursales`) and ACF fields (bilingual `*_es` / `*_en`) are configured by the user in WordPress admin. This repo only consumes the REST/GraphQL endpoints exposed by that setup.
- **Per-branch dedicated phone numbers, real per-branch hours, final AYCE/Express classification** — pending from the client.
- **Final dish photos, ambiance photos, SUMO mascot PNG, à la carte PDF with prices, remaining drink images** — pending assets (see `docs/business/overview.md` §10).
