# Feature Specification: Menu / Bebidas Page (`/menu`)

**Feature Branch**: `feat/018-menu-page`
**Created**: 2026-06-23
**Status**: Draft
**Input**: Menu browsing page at `/menu` with type toggle (AYCE/Express), modality toggle (buffet/à-la-carte — AYCE only), category chips, dish grid, sauce picker for Wings & Boneless, and grouped drinks section. Backend (DB schema, seed data, query functions) is fully complete. This feature is frontend-only plus a thin API route. See `docs/business/features.md §2`.

---

## Overview

`/menu` is the product core of the SUMO AYCE website — the page where visitors browse the full food and drink offering before deciding to reserve. The page is **ISR-rendered** (revalidated every 3600 s on Vercel) since menu content changes infrequently.

The **backend is complete**: all menu items are in Neon/Drizzle DB (seeded: 48 AYCE, 47 à-la-carte, 41 Express, 75 drinks, 5 desserts, 6 kids, 13 sauces). The query layer lives in `server/utils/menu-queries.ts`. This feature delivers:

1. A thin `GET /api/v1/menu` route wrapping the existing query
2. An `app/pages/menu.vue` page that fetches and passes data to components
3. The `app/features/menu/` component tree that renders type/modality toggles, category chips, dish grid, and sauce picker

Visual language: **Mercado Pop** design tokens (`--accent` orange for AYCE, blue for Express). Reference prototype: `/Users/betonajera/Documents/Projects/Clients/SUMO/Proposal/Mercado Pop D/`.

---

## Clarifications

### 2026-06-23

- **Image serving strategy**: `fileName` in the DB is a bare filename (e.g., `bora_bora.webp`). The API route resolves this to a full path using the following convention (see §Image Paths):

  | Condition | Public path |
  |-----------|-------------|
  | `locationType = 'both'` (drinks) | `/menu/drinks/{fileName}` |
  | Category key `'kids'` | `/menu/kids/{fileName}` |
  | Category key `'desserts'` | `/menu/desserts/{fileName}` |
  | `locationType = 'ayce'` AND `includedInAyce = true` | `/menu/ayce/{fileName}` |
  | `locationType = 'ayce'` AND `includedInAyce = false` | `/menu/ala-carta/{fileName}` |
  | `locationType = 'express'` | `/menu/express/{fileName}` |
  | `fileName = null` | `null` |

  Images must be copied to `public/menu/{subfolder}/` as a pre-implementation step. The API returns fully-resolved `imageUrl` values; the frontend never computes paths.

- **"Ver carta completa" lightbox**: deferred. Render a disabled CTA button with i18n text for now; link to a future PDF asset.

- **URL sync**: `?type`, `?modality`, and `?category` query params control the active toggle and chip state. Changing any of these updates the URL via `router.replace()` (shallow, no page reload). `?category=drinks` is set when the drinks chip is active; removed when deactivated; initialized from URL on page load.

- **Category chips filter behavior**: Clicking a chip **filters** the visible grid to show only that category's dishes. The selected category is reflected in the `?category` URL param. Clicking the active chip again (or selecting a different one) updates the filter. The `?category` param is removed when no chip is active.

- **Express modality**: Express has no modality concept — the modality toggle is hidden for `type=express`. Express items always show in "buffet" view (no prices).

- **Drink groups**: Drinks are always shown for both types. The drinks section appears at the end of the category list, grouped by `drinkGroup` with a visual header per group.

- **Sauce picker**: Appears inline below any dish with `requiresSauce: true` (i.e., in Wings category). It is a radio group listing all active sauces; user selects one. Selection is UI-local only (no server side effect in this feature).

---

## User Scenarios & Testing

### User Story 1 — Browse the AYCE menu (Priority: P1)

A visitor arrives from the homepage AYCE card (or types `/menu?type=ayce`). They see the full AYCE menu — appetizers, burgers, sandwiches, hot dogs, sushi rolls, wings — with orange accents. They can filter by category chip and see item names, descriptions, and photos.

**Why this priority**: This is the primary reason the page exists. Without the dish grid, nothing else on the page has value.

**Independent Test**: Navigate to `/menu?type=ayce`. Confirm the dish grid renders with multiple categories, each category has dish cards with names and descriptions, and the accent color is orange.

**Acceptance Scenarios**:

1. **Given** a visitor navigates to `/menu?type=ayce`, **When** the page loads, **Then** the AYCE dish grid renders with at least the categories: appetizers, burgers, sandwiches, hot_dogs, cold_rolls, hot_rolls, sweet_rolls, wings.
2. **Given** the AYCE page is active, **When** the visitor clicks a category chip (e.g., "Sushi Frío"), **Then** the grid filters to show only that category and `?category=cold_rolls` is set in the URL.
3. **Given** the AYCE page, **When** a dish has a `fileName`, **Then** the dish card shows the dish image from `/menu/ayce/{fileName}`.
4. **Given** the AYCE page, **When** a dish has no image (`imageUrl = null`), **Then** the dish card shows the SUMO neutral placeholder.
5. **Given** the AYCE page is rendered in Spanish, **When** the language toggle switches to English, **Then** all dish names and descriptions update to English without a page reload.

---

### User Story 2 — Switch between modalities on AYCE (Priority: P1)

A visitor on the AYCE menu wants to see prices. They toggle from "All You Can Eat" (buffet) to "À la carte" (carta) and the grid refreshes to show à-la-carte items with individual prices.

**Why this priority**: Showing prices is a key business requirement for AYCE's à-la-carte offering.

**Independent Test**: Start on `/menu?type=ayce` (buffet). Click the "À la carte" toggle. Confirm dish grid updates to show items with prices (e.g. "$128"), and "incluido" text disappears.

**Acceptance Scenarios**:

1. **Given** `type=ayce`, **When** the modality is "All You Can Eat" (buffet), **Then** all dish cards show "incluido" instead of a price, and no price values are displayed.
2. **Given** `type=ayce`, **When** the visitor toggles to "À la carte", **Then** dish cards for à-la-carte items show their price (e.g. "$128"); items without a price show no price indicator.
3. **Given** switching to à-la-carte, **When** the URL updates, **Then** `?modality=carta` is appended (shallow replace, no reload).
4. **Given** type=express, **When** the page renders, **Then** the modality toggle is NOT shown; dishes render without prices (buffet behavior).

---

### User Story 3 — Browse Express menu (Priority: P1)

A visitor navigates to `/menu?type=express`. They see the Express dish grid with blue accents and only Express-available items.

**Why this priority**: Express is a separate product type with a distinct identity (blue). Without it, half the restaurant's offering is hidden.

**Independent Test**: Navigate to `/menu?type=express`. Confirm blue accents, Express-only categories, and no modality toggle is shown.

**Acceptance Scenarios**:

1. **Given** `/menu?type=express`, **When** the page renders, **Then** the `--accent` CSS variable is set to the blue Express color and the modality toggle is absent.
2. **Given** `/menu?type=express`, **When** the dish grid renders, **Then** only Express and "both" items appear; AYCE-only items do not appear.
3. **Given** the type toggle, **When** the visitor switches from AYCE to Express, **Then** the URL updates to `?type=express`, the active category resets to the first available, and the accent color changes to blue.

---

### User Story 4 — Wings & sauce picker (Priority: P2)

A visitor browsing the Wings category sees sauce options inline. They select a sauce to understand what the dish comes with.

**Why this priority**: Sauce selection is a core UX rule (Wings & Boneless always require sauce). Without it, the dishes are missing a key detail.

**Independent Test**: Navigate to `/menu?type=ayce` and scroll to "Alitas" / "Boneless". Confirm a sauce picker renders below the dish with all available sauces listed; selecting one highlights it.

**Acceptance Scenarios**:

1. **Given** a dish with `requiresSauce = true`, **When** the dish card renders, **Then** a sauce picker (`SaucePicker`) appears below the dish description.
2. **Given** the sauce picker renders, **When** a visitor clicks a sauce, **Then** that sauce is visually highlighted as selected (radio behavior).
3. **Given** 13 active sauces, **When** the picker renders, **Then** all 13 sauces are listed in ascending `spiceLevel` order.
4. **Given** a sauce has `spiceLevel ≥ 3`, **When** it renders in the picker, **Then** a spice indicator is shown.

---

### User Story 5 — Drinks section (Priority: P2)

A visitor scrolls past food and reaches the Bebidas section. Drinks are grouped by drink group (Jumbo Cocktails, Cantaritos, Non-alcoholic, etc.) with group headers.

**Why this priority**: Drinks are a significant revenue source. They appear in both AYCE and Express, making them cross-type content.

**Independent Test**: Navigate to `/menu?type=ayce`. Scroll to the "Bebidas" section. Confirm drinks appear grouped with visible group headers and individual drink names/prices.

**Acceptance Scenarios**:

1. **Given** any page type (AYCE or Express), **When** the menu renders, **Then** a "Bebidas" section appears with all active drinks.
2. **Given** the drinks section, **When** it renders, **Then** drinks are grouped by `drinkGroup` with a visible header per group.
3. **Given** drinks with `fileName`, **When** the drink card renders, **Then** the image is loaded from `/menu/drinks/{fileName}`.
4. **Given** drinks with `price`, **When** the card renders, **Then** the price is always shown (drinks are always à-la-carte regardless of modality).

---

### Edge Cases

- What happens when the API returns an empty category? → The chip for that category does not render; no empty section is shown.
- What happens if `?type` is missing or invalid? → Default to `type=ayce`.
- What happens if `?modality=carta` is set for `type=express`? → Silently coerce to `buffet` (per `resolveModality` in the query layer).
- What happens if the DB returns no dishes? → Show an empty-state message per category section.
- What happens if `imageUrl` is null? → Show the SUMO neutral placeholder SVG.

---

## Requirements

### Functional Requirements

#### API route

- **FR-001**: `GET /api/v1/menu` MUST accept query params `type` (required, 'ayce'|'express') and `modality` (optional, 'buffet'|'carta', default 'buffet'). Validate with Zod; return 400 on invalid `type`.
- **FR-002**: The route MUST call `getFullMenu({ locationType: type, modality })` from `server/utils/menu-queries.ts` and return the `FullMenuResult` as JSON.
- **FR-003**: The route MUST resolve `imageUrl` for each dish: if `fileName` is non-null, compute the path per the image path convention (see Clarifications §Image Paths); otherwise set `imageUrl: null`.
- **FR-004**: The route MUST handle DB errors by returning HTTP 500 with a generic error message (no internals exposed).

#### Page

- **FR-005**: `app/pages/menu.vue` MUST use `useAsyncData` to call `GET /api/v1/menu` server-side. Template MUST NOT exceed 100 lines.
- **FR-006**: The page MUST read `?type` and `?modality` from `useRoute().query` and pass them as initial values to `MenuShell`.
- **FR-007**: The page MUST set ISR-appropriate SEO meta (title, description) per `useHead`.

#### Type toggle

- **FR-008**: The type toggle MUST show two options: "AYCE" (orange accent) and "Express" (blue accent). Active selection is reflected in the URL as `?type=ayce|express`.
- **FR-009**: Switching type MUST reset active category to the first available and reset modality to 'buffet'.

#### Modality toggle

- **FR-010**: The modality toggle MUST only be visible when `type=ayce`.
- **FR-011**: Switching modality MUST update `?modality` in the URL (shallow replace) and reload the dish grid from cached data.
- **FR-012**: In buffet modality, dish cards MUST show "incluido" for `includedInAyce=true` items. In carta modality, cards MUST show `price` (e.g. "$128") when non-null.

#### Category chips

- **FR-013**: Category chips MUST render for each `FullMenuCategory` returned by the API, plus a "Bebidas" chip always last.
- **FR-014**: Clicking a chip MUST filter the visible grid to show only that category's dishes, and MUST set `?category={key}` in the URL (shallow replace). Clicking the already-active chip resets the filter (no active chip, `?category` removed). The `?category` param is initialized on page load.
- **FR-015**: The active chip MUST be visually highlighted to reflect the current `?category` value. No IntersectionObserver required.

#### Dish grid

- **FR-016**: Each `FullMenuDish` MUST render a `MenuDishCard` with: dish image (or placeholder), `name[locale]`, `description[locale]`, badge (if non-null), and price/incluido.
- **FR-017**: `MenuDishCard` MUST render a `MenuSaucePicker` component below the description when `requiresSauce = true`.
- **FR-018**: Images MUST use `<NuxtImg>` (from `@nuxt/image`) with `loading="lazy"` and an explicit `alt` attribute.

#### Drinks section

- **FR-019**: The drinks section MUST group `FullMenuDish` items by `drinkGroup` key, with a bilingual group header per group (i18n key `menu.drink_group.{key}`).
- **FR-020**: Drink prices MUST always be shown regardless of active modality.

#### Sauce picker

- **FR-021**: `MenuSaucePicker` MUST render all sauces from `FullMenuResult.sauces` as radio inputs.
- **FR-022**: Sauces MUST be ordered by ascending `spiceLevel`. Sauces with `spiceLevel ≥ 3` MUST show a visual spice indicator (e.g. chili icon or count).
- **FR-023**: Sauce selection is client-local state; no API call is needed.

#### Accent

- **FR-024**: The `--accent` CSS variable MUST be applied to the page wrapper via `:style` binding: orange (`var(--color-orange)`) for AYCE, blue (`var(--color-express-blue)`) for Express.

#### i18n

- **FR-025**: All UI strings MUST use `useI18n()` `t()` calls with `menu.*` keys. Keys MUST exist in both `locales/es.json` and `locales/en.json`.
- **FR-026**: Drink group headers MUST use keys `menu.drink_group.jumbo_cocktails`, `menu.drink_group.cantaritos_sumo_cups`, etc.

#### Images (pre-implementation)

- **FR-027**: Before implementation, all image files MUST be copied from the assets folder to `public/menu/{subfolder}/` with exact filenames (case-sensitive, UTF-8 — including `piñada.webp`).

#### Storybook

- **FR-028**: Storybook stories MUST exist for: `MenuDishCard` (Default, NoImage, WithBadge, WithSauce, CartaWithPrice), `MenuSaucePicker` (Default, SelectedState), `MenuTypeToggle` (AYCE, Express), `MenuModalityToggle`.

#### Testing

- **FR-029**: `useMenuFilters` composable MUST have Vitest test coverage ≥ 70%.
- **FR-030**: `MenuDishCard.spec.ts` MUST cover: renders name/description, shows placeholder when imageUrl null, shows badge, shows price in carta, shows "incluido" in buffet, mounts SaucePicker when requiresSauce.

### Key Entities

- **`FullMenuResult`** (`types/menu.ts`): `{ locationType, modality, categories: FullMenuCategory[], sauces: FullMenuSauce[] }` — the complete API response.
- **`FullMenuCategory`**: `{ key, name: Bilingual, displayOrder, dishes: FullMenuDish[] }`
- **`FullMenuDish`**: `{ id, name, description, imageUrl, badge, price, incluido, drinkGroup, requiresSauce }`
- **`FullMenuSauce`**: `{ id, name: Bilingual, spiceLevel }`

---

## Success Criteria

- **SC-001**: `/menu?type=ayce` renders all AYCE categories with dish cards in < 2 s on 4G (ISR-cached response).
- **SC-002**: Switching type/modality updates the URL and re-renders the grid without a full page reload.
- **SC-003**: Lighthouse score ≥ 90 on all four metrics.
- **SC-004**: All 30 `menu.*` i18n keys present in both `es.json` and `en.json`.
- **SC-005**: Zero TypeScript errors (`pnpm vue-tsc --noEmit`). Zero Biome errors (`pnpm biome check .`).
- **SC-006**: `useMenuFilters` coverage ≥ 70%.
- **SC-007**: Storybook stories build without error for all new components.

---

## Assumptions

- The `/menu: { isr: 3600 }` route rule is already in `nuxt.config.ts` — no change needed.
- The backend query `getFullMenu()` is production-ready and returns correctly shaped data.
- Images will be copied to `public/menu/` before the frontend is implemented (FR-027). The spec_author assumes this pre-step; the implementer must verify.
- `@nuxt/image` is available (already installed in the project for image optimization).
- Express images are not yet available; Express dish cards will show the SUMO placeholder for all items until images are provided.
- The `mac_&_cheese.webp` filename (with `&`) is valid in `public/` on both macOS and Linux/Vercel.
