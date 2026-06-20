# Feature Specification: Homepage (`/`)

**Feature Branch**: `feat/010-homepage`
**Created**: 2026-06-19
**Status**: Implemented (reconciled to built state 2026-06-20)
**Input**: User description: Public homepage at route `/` with hero (ALL YOU CAN EAT headline, kicker, price sticker, hero photo), type selector (AYCE / Express cards routing to /menu), featured dishes rail, top 3 promotions, Google reviews, branches CTA band. Content from headless WordPress fetched server-side. Rendering per `docs/business/rendering-strategy.md`. Reduced-motion disables marquee/bounce. See `docs/business/features.md §1`.

## Overview

The Homepage is the public landing surface at `/`. Its job is to **sell the All-You-Can-Eat experience fast** and **route the visitor** to the menu, branches, and reservation flow. It is the first content page built on top of the design system (feature 007) and the frontend test setup (feature 008), and it is the **first page in the codebase to consume headless WordPress content**.

The page is composed (top to bottom) of six sections: Hero → Type Selector → Featured Dishes Rail → Promotions (top 3) → Google Reviews → Branches CTA Band. The dynamic content on this page comes from **three distinct sources**: **promotions** are pulled live from the WordPress `promociones` endpoint via a Nitro content route (the one true network dependency on this page); **featured dishes (and any drinks/bebidas)** are served from a **static fixture committed in the repo** (`app/features/homepage/data/featured-dishes.ts`) via `useFeaturedDishes` — swappable for a real data source (e.g. a Nitro/DB route) later with no component change; **Google reviews** are also a static/hardcoded data source committed in the repo (swappable later). Everything else is static brand copy. The visual language is **"Mercado Pop"** (cream background, diagonal-stripe + radial-sun hero, ink marquee band, Bricolage Grotesque + Hanken Grotesk fonts, official SUMO logos in `public/brand/`). The page is bilingual (Spanish default, English toggle), mobile-first, Tailwind-token-only (no `<style>` blocks / inline hex), and respects reduced-motion preferences.

## Clarifications

### Session 2026-06-19 (+ build reconciliation 2026-06-20)

> **Build reconciliation (2026-06-20):** during implementation two sourcing decisions
> were simplified vs. the 2026-06-19 clarifications, and the promotion selection /
> color rules were finalized to match the WordPress `promociones` ACF schema and the
> Mercado Pop reference design. The entries below reflect the **built** behavior; the
> superseded earlier wording is noted inline.

- Q: How is the "top 3" set of promotions selected and ordered, and where do promotions come from? → A: Promotions come from the **WordPress `promociones` endpoint** (`/wp-json/wp/v2/promociones`, pretty-permalink, origin `https://cms.sumo.com.mx`), fetched server-side by `server/api/v1/content/promotions.get.ts`. Selection is **two-step**: (1) PRIMARY query `?activa=1&home=1&per_page=100` (active promos explicitly flagged for the home) capped in code to the **3 newest** (publish-date desc); (2) FALLBACK, only when the primary returns ZERO, `?activa=1&per_page=100` (all active) again capped to the 3 newest; (3) if both are empty the section hides. **Any `tipo` (`all`/`ayce`/`express`) is allowed** — Express promos are included. List/media fetches have timeouts (4s/3s) for graceful degradation. Documented in `docs/business/wordpress-endpoints.md`. *(Superseded earlier wording: "filter type ∈ {all, ayce}" — the built logic uses the editor `home` flag + active fallback and admits all types.)*
- Q: Where do homepage "featured dishes" (and any drinks/bebidas) come from? → A: **From a static fixture committed in the repo** (`app/features/homepage/data/featured-dishes.ts`), exposed via `useFeaturedDishes()` which returns the route-compatible `{ dishes, ok, pending }` shape. There is **no** DB-backed Nitro route for dishes in this feature — the fixture is a drop-in placeholder for a real data source later (the composable contract already matches a future route). The current fixture dishes have **no images** (each renders the neutral "SUMO" placeholder). If the fixture is empty the rail hides. *(Superseded earlier wording: "application database (Neon/Drizzle) via a Nitro route" — implemented as a static fixture instead; no Drizzle/Neon is imported anywhere for the home.)*
- Q: Where do "Google reviews" come from on this page? → A: **Static / hardcoded** — a typed constant (`app/features/homepage/data/reviews.ts`) committed in the repo. NOT from WordPress, NOT from the DB, NOT the Google Places API. The reviews section renders them normally; the source is swappable later.
- Q: While the reservation modal (feature 014) is unbuilt, what does the reserve CTA do? → A: It emits an open-reservation intent via a shared cross-feature composable (`useReservationModal`) the modal will later subscribe to. The header carries a "Reservar" button wired to it; until feature 014 lands the call is no-op-safe (it must not error).

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Land and understand the offer (Priority: P1)

A first-time visitor arrives at `/` (most likely on a phone). Within the first viewport they must immediately understand what SUMO is ("ALL YOU CAN EAT", American-Japanese style), how much it costs (the price sticker), and be drawn in by an appetizing hero photo.

**Why this priority**: The hero is the single most important conversion surface. If the offer is not legible and compelling on a 360px phone in under 2 seconds, the visitor bounces and no other section matters. This is the MVP slice — a homepage with only a working, legible, fast hero already delivers the core marketing value.

**Independent Test**: Load `/` on a 360px viewport on a throttled 4G connection. Confirm the headline "ALL YOU CAN EAT", the kicker, and the price sticker are all visible and legible without horizontal scroll, and that the page is interactive in under 2 seconds.

**Acceptance Scenarios**:

1. **Given** a visitor on a 360px-wide screen, **When** the homepage loads, **Then** the hero headline, kicker, and price sticker are fully visible, legible, and do not overflow horizontally.
2. **Given** the default language is Spanish, **When** the homepage first renders, **Then** the hero copy reads in Spanish ("Come sin límites · Estilo americano-japonés").
3. **Given** a visitor toggles the language to English in the nav, **When** the toggle is applied, **Then** all hero copy switches to English without a full page reload.
4. **Given** the configured price is `$269`, **When** the hero renders, **Then** the price sticker shows that configured value (and changing the configured price changes what is shown, with no other code change).

---

### User Story 2 - Choose a SUMO type and head to the menu (Priority: P1)

A visitor who is interested wants to explore food. The type selector presents two large cards — **SUMO AYCE** (orange) and **SUMO Express** (blue) — and each routes the visitor to the menu pre-filtered to that type.

**Why this priority**: Routing visitors into the product core (the menu) is the primary call to action of the page. Without it, the homepage is a dead end. It is independently testable and delivers standalone value (a visitor can navigate to the menu).

**Independent Test**: Click the AYCE card and confirm navigation to `/menu?type=ayce`; click the Express card and confirm navigation to `/menu?type=express`.

**Acceptance Scenarios**:

1. **Given** the type selector is visible, **When** the visitor activates the SUMO AYCE card, **Then** they navigate to `/menu?type=ayce`.
2. **Given** the type selector is visible, **When** the visitor activates the SUMO Express card, **Then** they navigate to `/menu?type=express`.
3. **Given** the type selector, **When** it renders, **Then** the AYCE card uses the orange accent and the Express card uses the blue accent; the blue accent appears nowhere else on the page.
4. **Given** a keyboard-only or screen-reader user, **When** they reach the type cards, **Then** each card is reachable, focusable, and announces its destination.

---

### User Story 3 - Browse featured content (dishes, promotions, reviews) (Priority: P2)

A visitor scrolls the page and is shown appetizing featured dishes (a horizontal rail), the three most relevant active promotions, and social-proof reviews. These come from three sources: featured dishes from a **static fixture** committed in the repo, promotions from the live **WordPress `promociones` endpoint** (the page's only network dependency), and reviews from a static committed source.

**Why this priority**: This content builds desire and trust but the page is still functional (hero + routing) without it. The single live integration (WordPress promotions) is the riskiest part of the feature, so it is sequenced after the static MVP slices.

**Independent Test**: With seeded WordPress promotions, load `/` and confirm the featured dishes rail scrolls horizontally (visible styled scrollbar, scroll-snap), the top 3 selected promotions are shown, and the static reviews render. With WordPress unreachable, confirm the page still renders the static sections (including dishes and reviews) and the promotions section degrades gracefully (self-hides).

**Acceptance Scenarios**:

1. **Given** the static featured-dishes fixture, **When** the homepage renders, **Then** the dishes appear in a horizontally scrollable, scroll-snapping rail with a visible styled scrollbar and adaptive card width; dishes without an image render a neutral "SUMO" placeholder.
2. **Given** the WordPress `promociones` endpoint returns active home-flagged promotions, **When** the homepage renders, **Then** at most the 3 newest selected promotions are shown; inactive promotions are never shown; if no home-flagged promo exists the section falls back to the 3 newest active promos of any type, and if there are none the section hides.
3. **Given** a promotion of any type, **When** it renders, **Then** its badge color comes from the editor-set `acf.color` (orange/pink/yellow/blue/green, default orange) and it shows a small type-indicator bar driven by `acf.tipo` (Express→blue, AYCE→orange, all→ink); the blue type-bar / Express coding never appears as the badge color unless the editor set it.
4. **Given** a promotion has a flyer image (`acf.imagen`), **When** the visitor activates the promo card, **Then** the flyer opens large in a reusable lightbox (`UiLightbox`); the flyer is NOT shown inline in the card, and a promo without a flyer is non-interactive.
5. **Given** the static reviews source, **When** the homepage renders, **Then** the reviews render as social proof (reviewer name, rating, text).
6. **Given** WordPress is unreachable/returns an error/times out, **When** the homepage renders, **Then** the static sections (hero, type selector, featured dishes, reviews, branches CTA) still render and the promotions section degrades gracefully (self-hides) without breaking the page or surfacing a technical error.

---

### User Story 4 - Convert to a branch visit or reservation (Priority: P2)

At the bottom of the page, a branches CTA band invites the visitor to find their nearest branch or start a reservation.

**Why this priority**: This is the secondary conversion path (after the menu route). It reuses navigation/overlay behavior owned by other features, so it can land after the content sections.

**Independent Test**: Activate the "Find a branch" CTA and confirm navigation to `/sucursales`; activate the "Reserve" CTA and confirm the reservation overlay is requested to open.

**Acceptance Scenarios**:

1. **Given** the branches CTA band, **When** the visitor activates the branches CTA, **Then** they navigate to `/sucursales`.
2. **Given** the branches CTA band, **When** the visitor activates the reserve CTA, **Then** the reservation modal/overlay is requested to open on top of the homepage (the modal implementation itself is out of scope — feature 014).

---

### Edge Cases

- **WordPress promotions endpoint down / slow / times out**: the promotions section degrades gracefully (self-hides) — the page never shows a broken layout, an error stack, or a perpetual spinner. The list fetch (4s) and per-image media fetch (3s) are time-bounded so a slow WordPress never blocks the ISR render. Static sections (including dishes and reviews) always render.
- **Zero selected promotions (WP)**: when neither the home-flagged query nor the active fallback returns anything, the promotions section hides itself (no empty shell, no "0 results" noise). Dishes and reviews are static and always present.
- **Zero featured dishes (empty fixture)**: the rail self-hides (defensive `v-if`); the rest of the page is unaffected.
- **Fewer than 3 selected promotions**: show however many exist (1 or 2), do not pad with inactive ones.
- **A promotion flyer or dish missing its image**: a dish renders a neutral "SUMO" placeholder (never a broken image); a promo without a flyer simply renders as a non-interactive text card. A promo flyer that fails to resolve from its media ID degrades to no flyer / non-interactive card.
- **A content item missing the active language string** (e.g. EN missing): fall back to the Spanish string rather than rendering empty.
- **Reduced-motion preference set**: the marquee does not animate and bounce/entrance animations are disabled; all content remains fully readable and reachable.
- **Very long headline/promo text in either language**: text wraps and remains contained within its card; no horizontal overflow at 360px.
- **Stale ISR content**: a content edit in WordPress may take up to the revalidation window to appear; this is expected and acceptable for this page.

## Requirements *(mandatory)*

### Functional Requirements

**Page composition & rendering**

- **FR-001**: The system MUST serve a public homepage at the route `/` requiring no authentication.
- **FR-002**: The homepage MUST render the six sections in this exact top-to-bottom order: (1) Hero, (2) Type Selector, (3) Featured Dishes Rail, (4) Promotions, (5) Google Reviews, (6) Branches CTA Band.
- **FR-003**: The homepage MUST be rendered with incremental static regeneration at a 3600-second revalidation interval, matching the rendering strategy for `/`. The page's `routeRules` entry MUST remain consistent with `docs/business/rendering-strategy.md`.
- **FR-004**: WordPress-sourced content (promotions) MUST be fetched server-side during render/revalidation (not on every visitor request), so that WordPress is queried at most once per revalidation interval. The list and per-image media fetches MUST be time-bounded (4s list / 3s media) so a slow/unreachable WordPress degrades gracefully instead of blocking the render.
- **FR-005**: No database/Neon/Drizzle client may be imported or used anywhere under `app/`. The homepage's only network dependency is the WordPress promotions Nitro route; the featured-dishes data is served from a static fixture (see FR-012) consumed via `useFeaturedDishes`, and reviews from a static fixture. (Should any data source become DB-backed later, it MUST be reached exclusively through a server API route, never imported under `app/`.)

**Hero**

- **FR-006**: The hero MUST display the headline "ALL YOU CAN EAT" in the display style, the kicker (ES "Come sin límites · Estilo americano-japonés" / EN equivalent), a price sticker, and the official SUMO vertical logo in a rotated, **transparent-fill** frame (no black fill) on the cream diagonal-stripe + radial-sun ("Mercado Pop") background. A full-bleed **ink marquee band** is rendered globally just below the nav (component `SiteMarquee`, not inside the hero), with i18n phrases separated by an orange ✺ star and adaptive repetition.
- **FR-007**: The hero price MUST be configurable without changing component code (driven by configuration/content), defaulting to `$269`.
- **FR-008**: The hero MUST remain legible and free of horizontal overflow at a 360px viewport width.

**Type selector**

- **FR-009**: The type selector MUST present exactly two cards: "SUMO AYCE" and "SUMO Express".
- **FR-010**: The AYCE card MUST link to `/menu?type=ayce` and the Express card MUST link to `/menu?type=express`.
- **FR-011**: The AYCE card MUST use the orange accent; the Express card MUST use the blue accent. The blue accent MUST NOT appear on any non-Express element on the page.

**Featured dishes rail**

- **FR-012**: The featured dishes rail MUST present featured dishes (and any drinks/bebidas) from a **static fixture** committed in the repo (`app/features/homepage/data/featured-dishes.ts`), consumed via `useFeaturedDishes` which returns a route-compatible `{ dishes, ok, pending }` shape so the source is swappable for a real data source (e.g. a Nitro route) later without changing the rail or page. The rail MUST be a horizontally scrollable track with scroll-snap, a visible styled scrollbar, and adaptive card width. If the fixture is empty, the rail MUST hide.
- **FR-013**: Each dish MUST show at least its name; a missing image MUST render a neutral "SUMO" placeholder rather than a broken image. (The current fixture dishes have no images and therefore all render the placeholder.)

**Promotions**

- **FR-014**: The promotions section MUST display at most the 3 newest **active** promotions selected from the WordPress `promociones` endpoint, fetched server-side; inactive promotions MUST never be shown. Selection is two-step: PRIMARY `?activa=1&home=1&per_page=100` (active + home-flagged) capped to the 3 newest by publish date; FALLBACK (only when PRIMARY is empty) `?activa=1&per_page=100` (all active) capped to the 3 newest; if both are empty the section hides. Promotions of any `tipo` (`all`/`ayce`/`express`) are eligible. The cap-to-3 / sort logic MUST remain defensive even if the endpoint already returns the promotions ranked.
- **FR-015**: Each promotion MUST render its bilingual badge, title, description, and validity in the active language, falling back to Spanish when the active-language string is missing. Validity MUST render as neutral text (not accent-colored).
- **FR-016**: Each promotion's badge color MUST come from the editor-set `acf.color` (one of orange/pink/yellow/blue/green; unknown values fall back to orange). Each promotion MUST additionally show a small decorative type-indicator bar driven by `acf.tipo`: Express→blue, AYCE→orange, `all`→ink. The badge color and the type bar are independent (the type bar is the only place Express is rendered blue by default).
- **FR-016a**: A promotion's flyer (`acf.imagen`, resolved from a WordPress media ID) MUST NOT be shown inline in the card. A promo with a flyer MUST be interactive (keyboard-operable, role `button`) and open the flyer large in the reusable lightbox (`UiLightbox`, `app/components/ui/Lightbox.vue`); a promo without a flyer MUST render as a non-interactive text card.

**Google reviews**

- **FR-017**: The reviews section MUST render reviews from a **static/hardcoded source committed in the repo** (a code constant or local JSON) as social proof, including reviewer name, rating, and review text. The reviews MUST NOT be fetched from WordPress, the database, or the Google Places API. The static source MUST be structured so it can later be swapped for a real source without changing the reviews section's component contract.

**Branches CTA band**

- **FR-018**: The branches CTA band MUST provide a control that navigates to `/sucursales`.
- **FR-019**: The branches CTA band MUST provide a control that requests opening the reservation overlay via a shared cross-feature open-reservation mechanism (composable/event the modal will subscribe to). The call MUST be no-op-safe (must not error) while feature 014 is unbuilt. (Opening intent only; the modal itself is feature 014.)

**Internationalization**

- **FR-020**: All UI copy MUST be available in Spanish (default) and English, switchable via the existing nav language toggle without a full page reload.
- **FR-021**: Brand copy rules MUST be honored: use "All You Can Eat" (never "Buffet") and "Estilo americano-japonés" (never "comida japonesa").

**Motion & accessibility**

- **FR-022**: When the visitor's system indicates reduced-motion, the marquee MUST NOT animate and bounce/entrance animations MUST be disabled, with all content remaining fully readable and operable.
- **FR-023**: All interactive elements (type cards, CTAs, language toggle) MUST be keyboard-operable, focusable with a visible focus indicator, and expose accessible names/destinations.
- **FR-024**: Images MUST be lazy-loaded where below the fold and optimized; the hero image MUST be prioritized for the initial viewport.

**Graceful degradation & reuse**

- **FR-025**: If the WordPress promotions endpoint is unreachable, errors, or times out, the homepage MUST still render its static sections (hero, type selector, featured dishes, reviews, branches CTA) and the promotions section MUST degrade gracefully (self-hide) without surfacing technical errors to the visitor. The route MUST always return HTTP 200 with `{ promotions: [], ok: false }` on failure and MUST log via the centralized error handler without leaking the upstream error body/stack.
- **FR-026**: The homepage MUST reuse the existing base UI components (Button, Card, Chip, Sticker, Kicker, Marquee, Nav, Lightbox) rather than duplicating their markup; section-specific composition lives in homepage-scoped components, and global shell components (header, footer, logo, marquee) live under `app/components/layout/`. The page and its homepage components MUST be Tailwind-token-only (no `<style>` blocks, no inline hex, no arbitrary color/text/shadow/border values); `hover:` is desktop-only (`hoverOnlyWhenSupported`).
- **FR-027**: The promotions live data source MUST be accessed through its own dedicated composable (`usePromotions`) that calls the Nitro `promotions` route via `useFetch`; it MUST NOT import the featured-dishes composable or any DB client. Featured dishes (`useFeaturedDishes`) and reviews are local/static and require no fetch layer; they MUST NOT be merged into the promotions fetch.

### Key Entities *(include if feature involves data)*

- **Featured Dish**: A dish (or drink/bebida) highlighted on the homepage. Attributes: name, bilingual description, nullable image, optional badge, category. Sourced from a static fixture committed in the repo (swappable for a real data source later).
- **Promotion**: A time-bound marketing offer. Attributes: bilingual badge/title/description/validity, decorative color (`acf.color`), type (`all` | `ayce` | `express`, drives the type bar), active flag, publish date (ordering), nullable flyer image URL (resolved from the `acf.imagen` media ID, opened in a lightbox). Only active promotions are shown; the homepage shows up to the 3 newest selected (home-flagged, with an active fallback). Sourced from the WordPress `promociones` endpoint.
- **Review**: A social-proof customer review. Attributes: reviewer name, rating, bilingual review text, source, optional date. Sourced from a static/hardcoded fixture committed in the repo (swappable later).
- **Homepage Content**: The aggregate of the featured dishes (static fixture), promotions (WordPress endpoint, the only live source), and reviews (static fixture) needed to render the page. Promotions are fetched server-side at render/revalidation time; dishes and reviews require no fetch.
- **Price Configuration**: The configurable headline price (default `$269`) displayed on the hero sticker.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: The homepage is interactive in under 2 seconds on a throttled 4G connection.
- **SC-002**: The homepage achieves a Lighthouse score of 90+ across Performance, Accessibility, Best Practices, and SEO.
- **SC-003**: On a 360px viewport, the hero headline, kicker, and price sticker are fully visible and legible with zero horizontal overflow.
- **SC-004**: 100% of visitors activating the AYCE card reach `/menu?type=ayce` and 100% activating the Express card reach `/menu?type=express`.
- **SC-005**: At most 3 promotions are ever displayed, all of them active; no inactive promotion is ever shown.
- **SC-006**: When the WordPress promotions endpoint is unreachable, errors, or times out, the homepage still renders all static sections (hero, type selector, featured dishes, reviews, branches CTA) and shows no broken layout or technical error to the visitor; the promotions section self-hides.
- **SC-007**: A content editor's published change in WordPress is reflected on the homepage within the revalidation window without any code change or redeploy.
- **SC-008**: With reduced-motion enabled, no animation plays (marquee static, no bounce/entrance) while all content stays readable and operable.
- **SC-009**: Switching the language toggle updates every visible string on the page (no mixed-language state) without a full page reload.

## Assumptions

- **WordPress `promociones` endpoint exists**: The WordPress `promociones` endpoint (pretty-permalink `/wp-json/wp/v2/promociones`, origin `https://cms.sumo.com.mx`, with bilingual `*_es`/`*_en` ACF fields plus `activa`, `home`, `tipo`, `color`, `imagen`) is created by the client in WordPress admin and supports the server-side `?activa=1` / `?home=1` filters; this feature only consumes it (see `docs/business/wordpress-endpoints.md`). WordPress admin configuration is out of scope.
- **Featured dishes are a static fixture**: Featured dishes/drinks are a committed static fixture, not a DB read. The `useFeaturedDishes` composable returns a route-compatible shape so the source can be swapped for a real data source later with no component change. The current fixture dishes have placeholder (no) images.
- **"Top 3" promotions selection**: Up to the 3 newest active promotions, selected via the editor `home` flag with an all-active fallback, most-recent-first. The cap/sort stays defensive even if the endpoint already ranks them.
- **Reviews are static**: Reviews are a hardcoded fixture (constant or local JSON) committed in the repo, not fetched from WordPress, the DB, or the Google Places API. A later feature may swap the source.
- **Reservation modal is external**: The homepage only requests opening the reservation overlay; the overlay component and its submission flow are delivered by feature 014. Until then the reserve CTA may route to a placeholder anchor that feature 014 wires up.
- **Menu and Branches pages may not exist yet**: The type cards and branches CTA link to `/menu` and `/sucursales`, which are delivered by features 011 and 013. The links are correct now even if the destinations are stubs.
- **Design system is in place**: Base components, design tokens, layout, and i18n scaffolding from features 007/008 exist and are reused; no new base primitives are introduced unless a genuine gap is found.
- **Hero/ambiance imagery**: The hero uses the official SUMO vertical logo (`public/brand/sumo-vertical.svg`) on the Mercado Pop background; featured-dish photography is pending, so dishes render the neutral "SUMO" placeholder until real images are supplied.
- **The price is content/config-driven** and editable without a code change.
- **`/` rendering mode is fixed** at ISR 3600 by the rendering strategy; this feature does not change it.
