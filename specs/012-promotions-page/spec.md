# Feature Specification: Promotions Page (`/promotions`)

**Feature ID**: 012
**Feature Branch**: `feat/017-promotions-page`
**Created**: 2026-06-22
**Status**: spec_ready
**Depends on**: 007 (design system, done), 008 (test setup, done), 010 (homepage — Lightbox.vue and the existing promotions route exist)
**Blocks**: nothing (standalone content page)

---

## Overview

The Promotions Page (`/promotions`) is the dedicated landing surface for all active SUMO
promotions. It fetches the complete active set from the WordPress `promociones` CPT via
`GET /api/v1/content/promotions?all=1`, which calls
`?activa=1` (no `home` filter, no per-page cap). The page renders a responsive grid of
`PromotionCard` components (text-only: badge, title, description, validity). Clicking a card
opens the full promo flyer in the existing `<UiLightbox>` component.

The homepage code path (`GET /api/v1/content/promotions` with no param) MUST NOT regress.

The page is served as an ISR-cached HTML shell with a **60-second revalidation interval**
(`isr: 60`), consistent with `docs/business/rendering-strategy.md` — promotions are the most
dynamic content and the client edits them frequently.

Color coding follows the per-type accent system (Article VII): Express promotions (`tipo=express`)
use blue (`--blue`); all other promotions use the editor-set `acf.color` mapped to a design
token. The `--accent` swap on a per-card wrapper is the implementation mechanism — no inline hex
is allowed.

Content is bilingual (Spanish default, English toggle via `@nuxtjs/i18n`). All bilingual
strings come from the `*_es` / `*_en` ACF fields as already parsed by `validators.ts`.

---

## Clarifications

### Session 2026-06-22

- **Q: Should the new server route reuse the homepage route's logic or be a new file?**
  A: **Extend the existing `server/api/v1/content/promotions.get.ts`** — no new file.
  The route reads a `?all=1` query parameter via `getQuery(event)`. When `all=1`, it skips
  the home filter, skips `capActiveNewest`, and returns all active promotions. The homepage
  calls `GET /api/v1/content/promotions` (no param). The promotions page calls
  `GET /api/v1/content/promotions?all=1`. The shared helpers (`parsePromotions`,
  `resolveImages`, `resolveMediaUrl`, `capActiveNewest`) stay in the same file; no extraction
  needed.

- **Q: What query does the promotions-page route use?**
  A: `GET /api/v1/content/promotions?all=1` — the Nitro route detects `all=1` and calls
  `GET {WORDPRESS_API_URL}/wp-json/wp/v2/promociones?activa=1&per_page=100` with no home
  filter and no per-code cap. Returns all active promotions.

- **Q: How is the card colored for Express vs other promotions?**
  A: Two-level rule. The type-indicator bar (a small visual element inside the card) is
  always driven by `acf.tipo`: `express` → blue, `ayce` → orange, `all` → ink. The card's
  decorative accent (badge background, border highlight) is driven by `acf.color` mapped to a
  token — EXCEPT when `tipo=express`, in which case the `--accent` variable is swapped to
  `--blue` on the card wrapper (Express-blue is exclusive to the Express line, Article VII).
  This mirrors the homepage behavior for promotions.

- **Q: Does clicking a card always open the lightbox? What if there is no image?**
  A: A card with `imageUrl !== null` is interactive — clicking it opens `<UiLightbox>` with
  the resolved image URL. A card with `imageUrl === null` is non-interactive (cursor default,
  no click handler). The card renders identically in both cases except for the cursor and the
  absence of a click handler.

- **Q: Is `acf.imagen` resolved to a URL in the new server route?**
  A: Yes, same pattern as the homepage: `acf.imagen` is a media ID resolved via
  `GET /wp-json/wp/v2/media/{id}`. Resolution happens server-side in the Nitro route. On
  failure the card degrades to `imageUrl: null` (non-interactive).

- **Q: What happens when WordPress is unreachable?**
  A: The route returns `{ promotions: [], ok: false }`. The page renders an empty state
  ("No hay promociones disponibles en este momento") rather than an error screen. The visitor
  is never shown a technical error. Same pattern as the homepage.

- **Q: Is `routeRules['/promotions'] = { isr: 60 }` already present?**
  A: Yes — confirmed in `nuxt.config.ts` line 85. MUST NOT be changed.

- **Q: Does the page need a loading skeleton?**
  A: No. The content is fetched at ISR time (server-side via `useAsyncData`), so the HTML
  shell already contains the promotion cards. A client-side loading state for the grid is not
  needed. If `ok: false`, the empty state renders in the shell.

- **Q: What component holds the grid — a page file or a feature component?**
  A: The page file (`app/pages/promotions.vue`) is the thin orchestrator (≤ 100 lines
  template). The grid is `app/features/promotions/components/PromotionsGrid.vue`. Each card is
  `app/features/promotions/components/PromotionCard.vue`. These are the feature-scoped
  components per Article I.

- **Q: Does `PromotionCard` already exist?**
  A: No dedicated page-level card exists. The homepage section renders promotions inline
  within `HomepagePromotions.vue` (feature 010 scope). For this page, a new `PromotionCard`
  component is created under `app/features/promotions/components/`. It is intentionally
  separate because the homepage section is owned by feature 010 and should not be modified.

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Browse all active promotions (Priority: P1)

A visitor navigates to `/promotions` (or is sent there from any marketing link). Without any
interaction they see a grid of all current active promotions, each with its badge, title,
description, and validity period. Express promotions are visually distinguished with blue.

**Why this priority**: This is the entire purpose of the page. The ISR shell must render
correctly with real WordPress data. An empty or broken grid is a complete failure.

**Independent Test**: With active promotions in WordPress, load `/promociones`. Confirm every
active promotion appears as a card with badge, title, description, validity. Confirm inactive
promotions are absent. Confirm Express promos show blue accent.

**Acceptance Scenarios**:

1. **Given** WordPress has active promotions, **When** the page renders, **Then** every
   promotion where `acf.activa === true` is displayed as a card; promotions with
   `acf.activa === false` are not shown.
2. **Given** a promotion with `tipo=express`, **When** its card renders, **Then** the card
   uses the blue accent (`--blue`) and the type-indicator bar is blue.
3. **Given** a promotion with `tipo=ayce` or `tipo=all`, **When** its card renders, **Then**
   the card accent comes from `acf.color` mapped to a design token (default orange if
   unmapped), and the type-indicator bar is orange (ayce) or ink (all).
4. **Given** the default language is Spanish, **When** the page first renders, **Then** badge,
   title, description, and validity are in Spanish (`*_es` fields).
5. **Given** the visitor switches to English, **When** the language toggle is applied, **Then**
   all card text switches to English (`*_en` fields) without a full page reload.

---

### User Story 2 — View promo details in the lightbox (Priority: P1)

A visitor sees a promotion that interests them and clicks the card. The full promo flyer opens
in an overlay lightbox. They can close it with the close button, the Escape key, or by clicking
outside the image.

**Why this priority**: The flyer is the actual detailed content of the promotion (full image
with all conditions). Without the lightbox working, the page delivers no actionable detail to
the visitor — they see only text teasers.

**Independent Test**: Click a promotion card that has a flyer image. Confirm `<UiLightbox>`
opens with the full-resolution image URL (`source_url` from the WP media endpoint). Close via
Escape; confirm it closes.

**Acceptance Scenarios**:

1. **Given** a promotion with a resolved `imageUrl`, **When** the visitor clicks the card,
   **Then** `<UiLightbox>` opens displaying the image at `imageUrl`.
2. **Given** the lightbox is open, **When** the visitor presses Escape, **Then** it closes.
3. **Given** the lightbox is open, **When** the visitor clicks outside the image, **Then** it
   closes.
4. **Given** a promotion with `imageUrl === null`, **When** the visitor interacts with the
   card, **Then** nothing happens (no lightbox, no error); the cursor is not a pointer.
5. **Given** a keyboard-only user, **When** they Tab to a clickable card and press Enter,
   **Then** the lightbox opens; when they Tab to the close button and press Enter, it closes.

---

### User Story 3 — Page degrades gracefully when WordPress is unavailable (Priority: P2)

WordPress is unreachable during the ISR revalidation pass. The page returns `ok: false` and
renders an empty-state message. No technical error is shown to the visitor.

**Why this priority**: The site must remain functional even when the CMS is unavailable. The
visitor should understand "no promotions right now" rather than see a broken page.

**Independent Test**: Mock the WordPress endpoint to return a 503. Load `/promociones`. Confirm
the empty state message renders (no unhandled error, no stack trace).

**Acceptance Scenarios**:

1. **Given** WordPress returns an error or times out, **When** the page renders, **Then** a
   user-friendly empty state message is shown; no stack trace or technical detail is exposed.
2. **Given** WordPress returns an empty array (all promos inactive), **When** the page renders,
   **Then** the same empty state message is shown.

---

### Edge Cases

- **Zero active promotions**: The grid is replaced by an empty-state message. No blank area.
- **Promotion with no `*_en` fields**: falls back to `*_es` values for both locales (same
  behavior as homepage via `validators.ts` `mapPromotion`).
- **Promotion with unknown `acf.color`**: defaults to orange token (`DEFAULT_COLOR`).
- **`acf.imagen === 0` or falsy**: `imageUrl` resolves to `null`; card is non-interactive.
- **Media endpoint failure**: `imageUrl` resolves to `null`; card still renders with text.
- **Very long title or description**: text wraps within the card; no horizontal overflow
  at 360px.
- **Many promotions (> 20)**: grid scrolls vertically; no horizontal overflow.
- **Reduced motion**: card entrance animations are instant (no transform transitions).
- **Stale ISR content**: a promotion activated/deactivated in WP admin reflects on the page
  within the 60 s revalidation window.

---

## Requirements *(mandatory)*

### Functional Requirements

**Page composition & rendering**

- **FR-001**: The system MUST serve the promotions page at the route `/promotions` requiring
  no authentication.
- **FR-002**: The page MUST be rendered with ISR at a 60-second revalidation interval.
  `routeRules['/promotions'] = { isr: 60 }` is already present in `nuxt.config.ts` — it
  MUST NOT be modified.
- **FR-003**: The ISR HTML shell MUST include the full promotion grid (all active promotions
  fetched at revalidation time via `useAsyncData` calling
  `GET /api/v1/content/promotions?all=1`). No client-side fetch is needed for the initial
  render.
- **FR-004**: NO Drizzle/Neon client may be imported anywhere under `app/`. Promotion data
  reaches the page exclusively via `GET /api/v1/content/promotions-page`.

**Server route**

- **FR-005**: The existing route `server/api/v1/content/promotions.get.ts` MUST be extended
  to accept a `?all=1` query parameter (read via `getQuery(event)`). When `all=1`, the route
  skips the home filter and the 3-cap, calling
  `GET {WORDPRESS_API_URL}/wp-json/wp/v2/promociones?activa=1&per_page=100` directly and
  returning all active promotions. Default behavior (no param) MUST remain unchanged.
- **FR-006**: The `capActiveNewest` helper, `parsePromotions`, `resolveImages`, and
  `resolveMediaUrl` MUST be reused as-is within the same file. No duplication. The homepage
  code path must not regress.
- **FR-007**: The route MUST resolve each `acf.imagen` media ID to a URL via
  `GET /wp-json/wp/v2/media/{id}`. On any media resolution failure the affected promotion's
  `imageUrl` is `null`; the route MUST NOT fail the whole response.
- **FR-008**: Existing timeouts (`LIST_FETCH_TIMEOUT_MS = 4000`, `MEDIA_FETCH_TIMEOUT_MS = 3000`)
  apply to the `all=1` path as well. No changes needed.
- **FR-009**: On any upstream error the route MUST return `{ promotions: [], ok: false }` with
  HTTP 200 (existing behavior). No internal detail is exposed to the client.
- **FR-010**: The route response MUST be typed as `PromotionsResult` (defined in
  `types/content.ts`). No type changes needed.

**Promotion grid & cards**

- **FR-011**: `app/features/promotions/components/PromotionsGrid.vue` MUST render one
  `PromotionCard` per promotion in the `promotions` prop array.
- **FR-012**: When `promotions` is empty (or `ok === false`), `PromotionsGrid` MUST render an
  empty-state message in place of the grid ("No hay promociones disponibles en este momento"
  / i18n key `promotions.empty`).
- **FR-013**: `app/features/promotions/components/PromotionCard.vue` MUST display: badge
  (localized), title (localized), description (localized), validity period (localized). It
  MUST NOT display the flyer image inline.
- **FR-014**: `PromotionCard` MUST apply the two-level color rule:
  - Type-indicator bar: `tipo=express` → blue, `tipo=ayce` → orange, `tipo=all` → ink.
  - Card accent (`--accent` swap on the card wrapper): `tipo=express` → `--blue`; all other
    types use `acf.color` mapped to a token (fallback: orange). No inline hex.
- **FR-015**: A `PromotionCard` with a non-null `imageUrl` MUST be interactive (pointer cursor,
  keyboard-operable); clicking / Enter MUST open `<UiLightbox>` with `imageUrl`.
- **FR-016**: A `PromotionCard` with `imageUrl === null` MUST be non-interactive (default
  cursor, no click handler, no lightbox).
- **FR-017**: `<UiLightbox>` (`app/components/ui/Lightbox.vue`) MUST be reused as-is. No
  modifications to `Lightbox.vue` are permitted in this feature.

**Layout & responsiveness**

- **FR-018**: The promotion grid MUST be a CSS grid: 1 column on viewports < 520px, 2 columns
  on 520px–879px, 3 columns on ≥ 880px (Mercado Pop breakpoints from
  `docs/business/overview.md` §9).
- **FR-019**: The page template (`app/pages/promociones.vue`) MUST NOT exceed 100 lines of
  template. Section-specific markup lives in `PromotionsGrid` and `PromotionCard`.

**Internationalisation**

- **FR-020**: All UI copy (page title, empty state, card text) MUST be available in Spanish
  (default) and English via `@nuxtjs/i18n`, switchable without a full page reload.
- **FR-021**: When the `*_en` ACF field is missing or empty, the `*_es` value MUST be used as
  fallback (already handled by `mapPromotion` in `validators.ts` — no new logic needed).

**SEO**

- **FR-022**: The page MUST set a bilingual `<title>` and `<meta name="description">` via
  `useSeoMeta` with i18n keys (`promotions.seo.title`, `promotions.seo.description`).

**Accessibility**

- **FR-023**: All interactive cards MUST be keyboard-operable (focusable, activatable with
  Enter) with visible focus indicators. Hit targets ≥ 44px.
- **FR-024**: The lightbox MUST trap focus when open and restore focus to the trigger card
  when closed (handled by the existing `<UiLightbox>` implementation).

### Key Entities

- **Promotion** (`types/content.ts`): `{ id, badge: BilingualString, title: BilingualString,
  description: BilingualString, validity: BilingualString, color, type, active, publishedAt,
  imageUrl: string | null }`. Already defined for the homepage; reused unchanged.
- **PromotionsResult** (`types/content.ts`): `{ promotions: Promotion[], ok: boolean }`.
  Already defined; reused unchanged.
- **BilingualString**: `{ es: string, en: string }`. Already defined.

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: The page HTML shell is served from the ISR cache (WordPress is not called on
  visitor requests). The `GET /api/v1/content/promotions-page` call happens only at
  revalidation time (≤ once per 60 s per route).
- **SC-002**: Lighthouse score on `/promociones` is ≥ 90 on all four metrics.
- **SC-003**: The promotion grid renders correctly at 360px with no horizontal overflow.
- **SC-004**: All active WordPress promotions (no 3-cap, no home filter) appear on the page;
  inactive ones do not.
- **SC-005**: A promotion added/removed in WP admin appears/disappears within 60 s.
- **SC-006**: WordPress unavailability never surfaces an unhandled exception or a stack trace
  to the visitor; the empty-state message renders instead.
- **SC-007**: `PromotionCard` unit tests cover: badge/title/desc/validity render, lightbox
  opens on click when `imageUrl` is set, no click when `imageUrl` is null, Express card uses
  blue accent, non-Express card uses `acf.color` token.
- **SC-008**: The new server route has a unit test covering: successful response, WordPress
  error returns `ok: false`, media resolution failure degrades to `imageUrl: null`.
- **SC-009**: No inline hex (`#xxxxxx`) in any new `.vue` or `.ts` file (verified by grep).

---

## WordPress Content Data

### Seed JSON

`docs/business/promotions-seed.json` contains the 6 active promotions extracted from the
official flyer images, ready to enter in WordPress. Each entry maps directly to ACF fields:

| Promotion | `badge_es` | `tipo` | `color` | `home` |
|---|---|---|---|---|
| Promo Cumpleañero | Cumpleañeros | ayce | pink | true |
| Eat & Drink | Todos los días | ayce | orange | true |
| Jueves Smash Burgers | Jueves | ayce | orange | true |
| Martes Tarro de Cerveza | Martes | all | orange | false |
| Sumo Sport Box | Sport Box | all | blue | false |
| Miércoles Sushi 2x1 | Miércoles | all | orange | false |

### Entry workflow

1. Upload the flyer image (PNG/JPG) to WordPress → Media Library.
2. Note the media ID WordPress assigns (visible in the URL when editing the media).
3. Create a new `Promociones` post.
4. Fill in ACF fields from `promotions-seed.json` — copy `acf.*` values as-is.
5. Set `imagen` = the media ID from step 2.
6. Set `activa = true` and `home = true/false` as indicated.
7. Publish.

### Ongoing image-to-JSON extraction

When the client provides new promo flyer images, extract the following fields from each
image and produce a JSON entry matching the `acf` shape in `promotions-seed.json`:
- `badge_es/en`: the small day/category label (e.g. "Martes", "Jueves")
- `titulo_es/en`: the main headline
- `descripcion_es/en`: a brief summary of the benefit (1–2 sentences)
- `vigencia_es/en`: validity and key conditions (condensed from the fine print)
- `color`: best match from `orange | pink | blue | yellow` based on the flyer's dominant color
- `tipo`: `ayce` if the flyer shows the AYCE logo/experience, `express` if Express-only,
  `all` if it applies to both or is ambiguous
- `activa`: `true`
- `home`: `true` for flagging as a homepage candidate (client decides)
- `imagen`: `0` (placeholder — client fills in the WP media ID after uploading)

---

## Assumptions

- **`PromotionsResult` and `Promotion` types exist** in `types/content.ts` (created for feature
  010). This feature reuses them with no changes.
- **`validators.ts` exports `parsePromotions`** and the `mapPromotion` helper already handles
  bilingual fallback and color normalization. No new parsing logic is needed in this feature.
- **`app/components/ui/Lightbox.vue` exists** (created for feature 010) and supports the
  `imageUrl: string` prop and `@close` emit already. No modifications.
- **`routeRules['/promociones'] = { isr: 60 }` is present** in `nuxt.config.ts`. Verified via
  `docs/business/rendering-strategy.md` §2.
- **`WORDPRESS_API_URL` env var** is validated at startup in `server/utils/env.ts`; the new
  route reads `env.WORDPRESS_API_URL` from the same utility.
- **`resolveMediaUrl` in the homepage route** is a module-level function. It may need to be
  extracted to a shared utility (`server/api/v1/content/media.ts`) to avoid duplicating the
  implementation. If it is already exported from `validators.ts` or a shared file, import it
  directly. If not, extract before using.
- **WordPress CPT `promociones`** is configured in WP admin with ACF fields. This repo only
  consumes the endpoint; no WP admin configuration is in scope.
- **No pagination is required** at the current scale (< 50 active promotions expected).
  `per_page=100` is a safe upper-bound guard; if the client grows the catalog beyond 100 the
  route can be updated.
