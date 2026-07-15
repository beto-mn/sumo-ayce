# Feature Specification: Menu Experience Overhaul (data + UI)

**Feature Branch**: `feat/021-menu-experience-overhaul`
**Created**: 2026-07-08
**Status**: Implemented (spec reconciled to delivered scope on 2026-07-14)
**Input**: Feature 021 (`menu-experience-overhaul`, `sdd: true`) — restructure the `/menu`
experience per the CONFIRMED contract in `specs/_batch-intake/intake.md` (taxonomy source of
truth) and `specs/_batch-intake/menu-map.md` (current architecture). Requirements were
pre-clarified with the client; the feature then grew through several client-approved iterations
during implementation (see the "Delivered scope deltas" note below).

> **Reconciliation note (2026-07-14).** This spec was authored around a **three-way** primary
> selector (AYCE / Express / Bebidas). During implementation, client-approved iterations expanded
> it to a **four-way** navigation and added a dedicated **Kids** view, moved all menu labels to
> the database, and added two further additive migrations. The requirements below have been
> updated to describe what actually shipped. Key deltas vs the original draft:
> - Primary navigation is FOUR-way: a segmented **[AYCE | Express]** pill plus TWO independent
>   standalone buttons **[Bebidas y coctelería]** and **[Kids]**. The AYCE modality sub-toggle
>   renders BETWEEN the pill and the standalone buttons.
> - **Kids** is its own view (not a category inside AYCE·Carta) with two sub-sections.
> - Category and drink-group **labels come from the database** (not i18n); the `menu.category.*`
>   and `menu.drink_group.*` i18n keys were removed (only `menu.category.empty` remains).
> - **Three** additive migrations shipped (0027 drink-group order, 0028 drink-group names, 0029
>   category notes), not one.
> - Vaso Sumo consolidated to a **six**-base selector (adds Jack Daniel's); Tropical Sumo is a
>   separate card.
> - Garantías Sumo dishes are flagged featured on EVERY location row (so the star shows in every
>   view); the homepage rail dedupes by name to 11 unique dishes.
> - Robustness added: image cache-busting, Neon retry, and graceful empty-menu degradation.

## Overview

The `/menu` page originally presented two navigation axes (location type AYCE/Express + modality
Buffet/À-la-carte) and, on load, showed **every** category at once. This overhaul restructures
the browsing model into a **four-way primary navigation** — a segmented **AYCE | Express** pill
plus two independent standalone buttons, **Bebidas y coctelería** and **Kids** — where AYCE keeps
a secondary modality selector (All You Can Eat / Carta), and each selection renders a **curated,
ordered set of categories** (or, for Kids, two fixed sub-sections) rather than the full
catalogue. On load the page lands on a single default category. The overhaul also moves every
menu label (category names, drink-group names) into the database so they are the single source of
truth, fixes several data-modelling and presentation issues in the drinks catalogue (Destilados
split into its own group, Vaso Sumo consolidated into a six-base flavour-selector card, Tropical
Sumo separated, promo note de-duplicated, sub-group ordering, café image-first), removes the sauce
picker from Alitas & Boneless, curates the homepage "Garantías Sumo" featured rail to exactly 11
unique dishes (flagging each featured on every location row and deduping by name), and polishes
the dish cards (whole-card hover-zoom, half-width no-image drink cards, a Garantía star badge, and
a renamed modality label).

The scope is **data/seed + schema + i18n + component changes** on the existing `/menu` route.
No new routes are introduced. Three small additive Drizzle/Neon migrations shipped (0027/0028/0029),
applied to production Neon and re-seeded.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Browse a curated menu via the four-way navigation (Priority: P1)

A diner opens `/menu` and immediately sees the menu for the SUMO **AYCE · All You Can Eat**
experience, scoped to a single starting category (**Entradas**). The primary navigation is a
**segmented AYCE | Express pill** plus two independent **standalone buttons**, **Bebidas y
coctelería** and **Kids**. AYCE and Express are the two mutually-exclusive restaurant experiences;
Bebidas and Kids are cross-cutting views available at either sucursal. When AYCE is active a
secondary modality selector (All You Can Eat / Carta) renders **between** the AYCE|Express pill and
the standalone buttons. Each selection presents only the categories that belong to that experience,
in the exact curated order, and the diner filters within that set using category chips — except
Kids, which is a single flat view with no chip row. AYCE uses the orange accent, Express blue, and
Bebidas and Kids both use the neutral ink/soft accent (cross-cutting).

**Why this priority**: This is the core navigation restructure and the reason the feature exists.
Without it, none of the downstream data/UI polish has a home. It delivers a coherent, guided
browsing experience on its own.

**Independent Test**: Load `/menu`; confirm the default landing is AYCE · All You Can Eat ·
Entradas. Switch through each primary selection (AYCE, Express, Bebidas, Kids) and (for AYCE) each
modality, and verify the visible categories exactly match the confirmed curated sets and order,
including the intentional asymmetries. Confirm the modality toggle appears only for AYCE and only
between the pill and the standalone buttons.

**Acceptance Scenarios**:

1. **Given** a first-time visit to `/menu` with no filters in the URL, **When** the page loads,
   **Then** the primary selection is AYCE, the modality is All You Can Eat, and the visible
   category is **Entradas** (a single category, not the full catalogue).
2. **Given** AYCE · All You Can Eat is active, **When** the category set renders, **Then** exactly
   these 8 categories appear in this order: Entradas, Hamburguesas, Sándwiches, Hot Dogs, Sushi
   Frío, Sushi Caliente, Sushi Dulce, Alitas & Boneless.
3. **Given** AYCE is active, **When** the diner selects the **Carta** modality, **Then** exactly
   these 11 categories appear in this order: Entradas, Ensaladas, Arroz, Ramen, Hamburguesas, Hot
   Dogs, Sushi Frío, Sushi Caliente, Sushi Dulce, Postres, Alitas & Boneless — and neither
   Sándwiches, Burritos nor Kids appear (Kids is its own standalone view).
4. **Given** the diner selects **Express**, **Then** no modality selector is shown and exactly
   these 8 categories appear in this order: Entradas, Hamburguesas, Burritos, Hot Dogs, Sushi
   Frío, Sushi Caliente, Sushi Dulce, Alitas & Boneless — with **Burritos present** and
   **Sándwiches absent**.
5. **Given** the diner selects **Bebidas y coctelería** (standalone button), **Then** no modality
   selector is shown, exactly these 6 drink groups appear in this order — Coctelería Jumbo,
   Cantaritos y Vasos Sumo, Refrescos y Bebidas (Sin Alcohol folded in), Cervezas, Destilados, Café
   y Digestivos — and the default visible group is **Coctelería Jumbo**.
6. **Given** the diner selects **Kids** (standalone button), **Then** no modality selector and no
   category chip row are shown, and the view renders as two ordered sub-sections: "All You Can Eat
   Kids" (the $179 buffet item, `includedInAyce=true`, ordered first) then "Combo Infantil" (the
   six $149 combos, `includedInAyce=false`) with the DB-sourced inclusion note at the top of the
   combos section. Kids always renders in price mode ($149 / $179).
7. **Given** the diner switches the primary selection or modality, **When** the new set renders,
   **Then** the visible category resets to the first category/group of the newly selected set
   (Entradas for food sets, Coctelería Jumbo for Bebidas, the single kids view for Kids).
8. **Given** a shared/deep link `/menu?type=<ayce|express|bebidas|kids>[&modality=<buffet|carta>][&category=<key>]`,
   **When** the page loads, **Then** the exact view is restored — the primary selection, the
   modality (AYCE only; ignored for Express/Bebidas/Kids), and the selected category or drink group
   (food category keys for AYCE/Express; drink group keys for Bebidas; Kids has a single view).
9. **Given** the `category` param is omitted, **When** the page loads, **Then** the view's default
   category applies (`type=ayce&modality=buffet` → Entradas; `type=bebidas` → Coctelería Jumbo;
   `type=kids` → the kids view).
10. **Given** a `category` (or group) key that is invalid for the active `type`+`modality`, **When**
    the page loads, **Then** the system falls back to that view's default category and never renders
    an empty view.
11. **Given** the diner interacts with any toggle or chip, **When** the state changes, **Then** the
    URL updates (via replace, no history spam) to a shareable link that reproduces the same view;
    the internal `drinks` selection serialises to `type=bebidas`.

---

### User Story 2 - Accurate, de-duplicated drinks catalogue (Priority: P2)

A diner browsing Bebidas sees Cervezas and Destilados as **separate** groups. Within Cervezas the
Caguamón sub-group appears first. The "2x1 / Combo Mezcladores $189" note appears **once** for the
Destilados section, not repeated under every spirit sub-group. The five previous "Vaso Sumo"
entries are consolidated into a **single** Vaso Sumo card whose base is chosen with a selector
offering **six** bases (Ron, Tequila, Vodka, Whisky, New Mix, Jack Daniel's); Tropical Sumo remains
a **separate** card. Café y Digestivos lists items with images before items without images
(carajillos with photos before the text-only Café Americano / Espresso / Bunny Shot).

**Why this priority**: The drinks section is the most confusing part of the current menu
(repeated promo notes, five near-identical Vaso Sumo cards). Fixing it materially improves
comprehension but depends on the navigation restructure (P1) being in place.

**Independent Test**: Open the Bebidas selection and inspect Destilados, Cervezas, Café y
Digestivos, and Cantaritos y Vasos Sumo; verify group separation, single promo note, Caguamón-
first ordering, image-first coffee ordering, the single Vaso Sumo six-base selector card, and the
separate Tropical Sumo card.

**Acceptance Scenarios**:

1. **Given** the Bebidas selection, **When** the group buttons render, **Then** **Destilados** is
   its own group/button, distinct from **Cervezas**.
2. **Given** the Destilados section, **When** it renders, **Then** the "2x1 / Combo Mezcladores
   $189" promotional note is shown **exactly once** for the section as a whole (not once per
   spirit sub-group).
3. **Given** the Cervezas area, **When** sub-groups render, **Then** the **Caguamón** sub-group is
   ordered **first**.
4. **Given** the Café y Digestivos group, **When** items render, **Then** all items that have an
   image are listed before all items that have no image.
5. **Given** the Cantaritos y Vasos Sumo group, **When** it renders, **Then** there is exactly
   **one** "Vaso Sumo" card (with the shared `sumo_cup.webp` cup image) offering a base selector
   with the SIX choices Ron, Tequila, Vodka, Whisky, New Mix, and Jack Daniel's; the previously
   separate Vaso Sumo entries no longer appear as individual cards, and **Tropical Sumo** remains a
   separate card in the same group.
6. **Given** a diner selects a base on the Vaso Sumo card, **When** the selection changes,
   **Then** the chosen base is visually indicated (single-active selection, mirroring the
   sauce-picker interaction; the picker reuses `MenuSaucePicker`).

---

### User Story 3 - Polished dish cards and correct homepage featured rail (Priority: P3)

A diner sees dish cards gently zoom on hover (on hover-capable devices only — the whole card
scales, not just the image), reads the correct modality label ("Carta" in Spanish, "Menu" in
English), sees a "Garantía Sumo" star badge on featured dishes, and sees drink cards without an
image at half the width of image cards so the drinks grid packs efficiently. Clickable
buttons/cards show a pointer cursor. Alitas & Boneless no longer show a sauce picker. On the
homepage, the "Garantías Sumo" featured rail shows exactly the 11 client-curated dishes (deduped
by name, since each is flagged featured on every location row so the star appears in every menu
view).

**Why this priority**: Visual and content polish. Valuable and client-requested, but the menu is
usable without these refinements; they layer on top of P1/P2.

**Independent Test**: Hover a dish card image on a desktop pointer device and confirm the zoom;
confirm no zoom is triggered on a touch-only device. Confirm the modality label reads "Carta"
(ES) / "Menu" (EN). Confirm no-image drink cards render at half width (6 per desktop row vs 3 for
image cards). Confirm Alitas & Boneless items have no sauce picker. Confirm the homepage featured
rail shows exactly the 11 named dishes.

**Acceptance Scenarios**:

1. **Given** a hover-capable pointer device, **When** the diner hovers a dish card, **Then**
   the whole card zooms smoothly (`hover:scale-105`, transform-only) and raises above its
   neighbours; **Given** a touch-only device, **When** the diner taps, **Then** no hover-zoom is
   applied; **Given** `prefers-reduced-motion`, **Then** the transform is disabled.
2. **Given** the AYCE modality selector, **When** it renders in Spanish, **Then** the à-la-carte
   option reads **"Carta"**; **When** it renders in English, **Then** it reads **"Menu"**; the
   buffet option reads **"All You Can Eat"** in both locales.
3. **Given** any drinks section, **When** a drink card has no image, **Then** it renders at half
   the width of an image card (6 per row on desktop where an image card is 3 per row); **When** a
   drink card has an image, **Then** it renders at full card width.
4. **Given** the Alitas & Boneless category, **When** its dishes render, **Then** no sauce picker
   is shown on those dishes.
5. **Given** the homepage featured rail ("Garantías Sumo"), **When** it renders, **Then** it shows
   exactly these 11 UNIQUE dishes and no others: Burger del Barrio, Papas Smash, Mac & Cheese, Smash
   Dog, Bora Bora, Coco Roll, Canela Roll, Kushiage de Queso, Ramen XL, Tostiburger, Sumo Fries — in
   a defined display order. Each dish is flagged featured on ALL of its location/modality rows (so
   the star shows in every menu view), and the featured query dedupes by name so the rail lists each
   exactly once.
6. **Given** any dish flagged featured, **When** its card renders in any menu view, **Then** a
   "Garantía Sumo" star badge (`public/brand/garantia-sumo.webp`, 64px) appears top-left of the
   card, independent of whether the dish has an image.

---

### Edge Cases

- **A curated category contains no available items for the active location/modality**: The
  category still appears in the chip set (the set is fixed and curated), and its section shows the
  existing empty-state message rather than being hidden. The curated set order is authoritative
  and independent of item availability.
- **A category referenced by a curated set is inactive or missing in the catalogue**: The system
  MUST render the remaining curated categories without error and MUST NOT fall back to showing the
  full catalogue.
- **Deep-link / shared URL points at a category that does not belong to the currently selected
  set** (e.g. a Sándwiches link opened while Express is active): The system MUST resolve to the
  default category of the active set rather than showing an out-of-set category.
- **The Vaso Sumo card renders with no base pre-selected**: A default base is selected so the
  card always communicates a valid choice; changing selection never removes the image.
- **A "Garantías Sumo" featured dish is temporarily inactive**: The rail shows only the active
  subset of the 11; it MUST never show a dish outside the curated 11. Because each dish is featured
  on multiple location rows, the rail dedupes by name so an active dish never appears twice.
- **Fewer than the expected number of drink cards fill a desktop row**: Half-width no-image cards
  still align to the half-width grid; a trailing single half-width card does not stretch to full
  width.
- **A deep link points at `type=kids`**: The Kids standalone view is restored; the modality param
  is ignored and no chip row is shown.
- **Neon is temporarily unavailable**: The menu read is retried on transient connection errors
  (up to 3 attempts, short linear backoff). If it stays unavailable, the `/menu` route degrades to
  a friendly "menu temporarily unavailable" state (`menu.unavailable`) — an empty menu result —
  rather than surfacing a raw 500. The failure is categorised as a handled `DatabaseUnavailableError`
  (logged at WARN, HTTP 503 for API consumers).
- **A menu image is replaced in Blob**: Image URLs carry a cache-busting `?v=<MENU_IMAGE_VERSION>`
  suffix so an in-place Blob overwrite is served as a new resource (busts browser + CDN cache);
  the version constant is bumped by hand when images are swapped.

## Requirements *(mandatory)*

### Functional Requirements

**Primary navigation & curated sets**

- **FR-001**: The menu MUST offer a FOUR-way primary navigation: a segmented **AYCE | Express**
  pill (two mutually-exclusive restaurant experiences) plus TWO independent standalone buttons,
  **Bebidas y coctelería** and **Kids** (cross-cutting views available at either sucursal).
- **FR-001a**: The navigation MUST be responsive: on phones (< sm / < 520px) each nav group stacks
  on its own full-width row (pill, then the AYCE modality slot, then Bebidas, then Kids); on tablet
  (sm–md, 520–880px) groups take their natural width and wrap; on desktop (≥ md) they sit in a
  single row. The AYCE|Express pill stays a single segmented pill at all breakpoints.
- **FR-001b**: Accent colours MUST be: AYCE → orange, Express → blue, Bebidas and Kids → the neutral
  ink/soft accent (both cross-cutting). Clickable buttons/cards MUST use a pointer cursor.
- **FR-002**: When **AYCE** is the active primary selection, the system MUST offer a secondary
  modality selection with two options, **All You Can Eat** and **Carta**, rendered BETWEEN the
  AYCE|Express pill and the standalone buttons.
- **FR-003**: When **Express**, **Bebidas y coctelería**, or **Kids** is the active primary
  selection, the system MUST NOT display the modality selector.
- **FR-004**: For **AYCE · All You Can Eat**, the system MUST present exactly these 8 categories in
  this order: Entradas, Hamburguesas, Sándwiches, Hot Dogs, Sushi Frío, Sushi Caliente, Sushi
  Dulce, Alitas & Boneless.
- **FR-005**: For **AYCE · Carta**, the system MUST present exactly these 11 categories in this
  order: Entradas, Ensaladas, Arroz, Ramen, Hamburguesas, Hot Dogs, Sushi Frío, Sushi Caliente,
  Sushi Dulce, Postres, Alitas & Boneless. (Kids is NOT part of Carta — it is a standalone view.)
- **FR-006**: For **Express**, the system MUST present exactly these 8 categories in this order:
  Entradas, Hamburguesas, Burritos, Hot Dogs, Sushi Frío, Sushi Caliente, Sushi Dulce, Alitas &
  Boneless.
- **FR-007**: For **Bebidas y coctelería**, the system MUST present exactly these 6 drink groups in
  this order: Coctelería Jumbo, Cantaritos y Vasos Sumo, Refrescos y Bebidas (Sin Alcohol folded
  in), Cervezas, Destilados, Café y Digestivos.
- **FR-007a**: For **Kids**, the system MUST render (with no chip row) two ordered sub-sections
  split by `includedInAyce`: (1) "All You Can Eat Kids" — the single $179 buffet item
  (`includedInAyce=true`), ordered first; (2) "Combo Infantil" — the six $149 combos
  (`includedInAyce=false`), with the DB-sourced inclusion note (`menu_categories.note_es/en`)
  rendered at the top of the combos section. Kids always renders in price mode. The sub-section
  headings are fixed i18n nav copy (`menu.kids.*`); the note is DB-driven.
- **FR-008**: The category asymmetries MUST be encoded literally: **Sándwiches** appears ONLY in
  AYCE · All You Can Eat; **Burritos** appears ONLY in Express; AYCE · Carta contains neither
  Sándwiches nor Burritos.
- **FR-009**: The curated category sets and their ordering MUST be data-driven (defined in the
  `app/features/menu/menu-sets.ts` config, not hard-coded in view templates) so they can be
  reordered or amended without changing the presentation components.
- **FR-009a**: All category names and drink-group names shown in the UI MUST come from the
  **database** (`menu_categories.name_es/en`, `drink_group.name_es/en`) as the single source of
  truth — NOT from i18n. The `menu.category.*` and `menu.drink_group.*` i18n keys were removed
  (only `menu.category.empty` remains). The sweet-rolls category label is **"Sushi Dulce"** (so the
  three sushi rows read Sushi Frío / Sushi Caliente / Sushi Dulce).

**Default landing view**

- **FR-010**: On first load of `/menu` with no explicit filter state, the system MUST default to
  **AYCE · All You Can Eat** with **Entradas** as the single visible category (NOT all categories
  at once).
- **FR-011**: When the active primary selection becomes **Bebidas y coctelería**, the default
  visible group MUST be **Coctelería Jumbo**.
- **FR-012**: When the primary selection or modality changes, the visible category MUST reset to
  the **first** category of the newly active curated set.
- **FR-013**: The active filter state (primary selection, modality, category) MUST remain
  shareable via the URL, consistent with the existing behaviour, and MUST resolve an out-of-set
  category to the default category of the active set.
- **FR-013a**: The `type` query parameter MUST accept **`bebidas`** and **`kids`** (in addition to
  `ayce` and `express`); `bebidas` selects the Bebidas y coctelería view and `kids` the Kids view.
  When `type` is `bebidas`, `express`, or `kids` the `modality` param MUST be ignored. Internally
  the `drinks` selection MUST serialise to `type=bebidas`.
- **FR-013b**: The `category` query parameter MUST accept **drink group keys** (`jumbo_cocktails`,
  `cantaritos_sumo_cups`, `sodas`, `beers`, `destilados`, `coffee_digestifs`) when `type=bebidas`,
  and **food category keys** when `type` is `ayce`/`express`; the selected group or category MUST
  become the active/visible one (filter + scroll target). Kids has a single view (no per-category
  selection).
- **FR-013c**: Every subcategory (food category and drink group) MUST be reachable and restorable
  via URL query params so a shared `/menu?...` link reproduces the exact view. URL updates MUST use
  replace semantics (no browser-history spam), as today.
- **FR-013d**: When `category` is omitted, the view's default category MUST apply
  (`type=ayce&modality=buffet` → Entradas; `type=bebidas` → Coctelería Jumbo; `type=kids` → the
  kids view). A `category`/group key that is invalid for the active `type`+`modality` MUST fall
  back to that view's default category and MUST NOT render an empty view.

**Drinks data model**

- **FR-014**: **Destilados** MUST be modelled as its own drink group (split out of the former
  combined `beers_spirits` group, which was renamed to **`beers`** / "Cervezas") with its own
  selectable group button. The standalone `non_alcoholic` group was removed and its items folded
  into **`sodas`** ("Refrescos y Bebidas").
- **FR-015**: The "2x1 / Combo Mezcladores $189" promotional note MUST render exactly **once** for
  the Destilados section as a whole (from `drink_group.promo_es/en`), and MUST NOT be repeated per
  spirit sub-group (per-sub-group promo text is nulled).
- **FR-016**: Within the Cervezas group, the **Caguamón** sub-group MUST be ordered first.
- **FR-017**: In **Café y Digestivos**, items that have an image (carajillos) MUST be ordered
  before items that have no image (Café Americano, Espresso, Bunny Shot).
- **FR-018**: The previous Vaso Sumo entries MUST be consolidated into a **single** "Vaso Sumo"
  card (shared `sumo_cup.webp` image) whose base is chosen via a single-active selector offering
  **six** bases: Ron, Tequila, Vodka, Whisky, New Mix, Jack Daniel's. **Tropical Sumo** and
  Cantarito Fest remain **separate** cards in the same group.
- **FR-019**: The Vaso Sumo base selector MUST reuse the existing `MenuSaucePicker` component
  (parameterized to a generic `PickerOption[]` list), preserving the single-active choice
  interaction; base labels come from i18n (`menu.vaso_sumo.flavor.*`, `menu.vaso_sumo.picker_label`).

**Featured rail & sauce removal**

- **FR-020**: These 11 dishes MUST be flagged featured with an explicit display order: Burger del
  Barrio, Papas Smash, Mac & Cheese, Smash Dog, Bora Bora, Coco Roll, Canela Roll, Kushiage de
  Queso, Ramen XL, Tostiburger, Sumo Fries. Each MUST be flagged featured on ALL of its
  location/modality seed rows (so the star badge shows in every menu view), and no other dish may
  be flagged featured. The homepage "Garantías Sumo" featured rail MUST dedupe by name and list
  exactly these 11 unique dishes in display order.
- **FR-020a**: Every featured dish card MUST render a "Garantía Sumo" star badge
  (`public/brand/garantia-sumo.webp`, 64px) top-left, independent of whether the dish has an image.
- **FR-021**: Alitas & Boneless dishes MUST NOT display a sauce picker; the sauce-selection
  affordance MUST be removed from that category. (The spice-thermometer visual is explicitly out
  of scope.)

**Presentation polish**

- **FR-022**: Dish cards MUST zoom on hover (the WHOLE card scales, `hover:scale-105`, transform
  only, raising above neighbours), and the hover effect MUST apply only on hover-capable pointer
  devices (touch-only devices MUST NOT trigger it) and MUST be disabled under `prefers-reduced-motion`.
- **FR-023**: The modality label previously shown as "À la carte" MUST read **"Carta"** in Spanish
  and **"Menu"** in English; the buffet modality label MUST remain **"All You Can Eat"** in both
  locales.
- **FR-024**: In every drinks section, a drink card **without** an image MUST render at half the
  width of an image card — a 6-track grid (`grid-cols-2 sm:grid-cols-4 md:grid-cols-6`) where image
  cards span 2 (3 per desktop row) and no-image cards span 1 (6 per desktop row).

**Robustness**

- **FR-024a**: Menu and featured image URLs MUST carry a cache-busting `?v=<MENU_IMAGE_VERSION>`
  suffix (a hand-maintained constant in `resolveImageUrl`) so an in-place Blob overwrite is served
  as a new resource and busts browser + CDN caches.
- **FR-024b**: Menu database reads MUST be retried on transient Neon connection errors (up to 3
  attempts, short linear backoff). If the DB stays unavailable, the read MUST raise a handled
  `DatabaseUnavailableError` (logged at WARN, HTTP 503 for API consumers) and the `/menu` route MUST
  degrade to a friendly empty-menu state (`menu.unavailable`) rather than a raw 500.

**Quality & scope**

- **FR-025**: Every component changed by this feature MUST have its Storybook stories and Vitest
  specs added or updated to reflect the new behaviour (default category, curated sets, hover-zoom,
  half-width cards, flavour selector, removed sauce picker, relabelled modality).
- **FR-026**: The feature MUST NOT introduce new routes; it operates entirely on the existing
  `/menu` page and the existing homepage featured rail.
- **FR-027**: All new or changed user-facing strings MUST be provided in both Spanish and English
  and kept at key parity between the two locale files.

### Key Entities *(include if feature involves data)*

- **Menu selection (primary)**: One of AYCE, Express, Bebidas y coctelería, or Kids
  (internally `ayce | express | drinks | kids`). AYCE/Express are a segmented pill; Bebidas/Kids are
  standalone buttons. Determines which curated set (or the Kids sub-sections) is presented and
  whether a modality selector is offered.
- **Modality**: Applicable only to AYCE — All You Can Eat or Carta. Determines the AYCE category
  set. Kids always renders in price ("carta") mode regardless of modality.
- **Curated category set**: An ordered list of categories (or drink groups) bound to a specific
  (selection, modality) combination, defined in `app/features/menu/menu-sets.ts`. Authoritative for
  membership and display order; encodes the intentional asymmetries. Kids maps to the single `kids`
  category.
- **Menu category**: A grouping of dishes with DB-sourced ES/EN name and an optional DB-sourced
  section note (`note_es/en`, used by Kids). Membership in curated sets varies (e.g. Sándwiches →
  AYCE·buffet only).
- **Dish**: A single menu item with names/descriptions (ES/EN), optional image, price or "included"
  status, an `includedInAyce` flag (splits the Kids view), a `featured` flag (flagged on every
  location row), and a display order. Alitas & Boneless dishes no longer carry a sauce requirement.
- **Drink group**: A top-level grouping in Bebidas with a DB-sourced name (`name_es/en`), a
  deterministic `display_order`, and an optional single group-level promo note. Groups: Coctelería
  Jumbo, Cantaritos y Vasos Sumo, Refrescos y Bebidas (`sodas`), Cervezas (`beers`), Destilados
  (new), Café y Digestivos.
- **Drink sub-group**: A subdivision within a drink group (e.g. Caguamón within Cervezas; the
  spirit sub-groups within Destilados), with an order that places Caguamón first.
- **Vaso Sumo card + base**: A single consolidated drink card whose six base options (Ron, Tequila,
  Vodka, Whisky, New Mix, Jack Daniel's) are chosen with a single-active selector (reused
  `MenuSaucePicker`). Tropical Sumo is a separate card.
- **Featured rail item**: A dish flagged featured with a display order, surfaced on the homepage
  "Garantías Sumo" rail — deduped by name to exactly 11 unique dishes.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: On loading `/menu` with no filters, a diner sees a single category (Entradas) under
  AYCE · All You Can Eat, not the full catalogue — verifiable in 100% of fresh loads.
- **SC-002**: For each of the four/five views (AYCE·buffet, AYCE·Carta, Express, Bebidas, Kids), the
  visible category/group set exactly matches the confirmed list AND order, including all three
  intentional asymmetries and the Kids two-section split — 0 discrepancies.
- **SC-003**: The Destilados "2x1 / Combo Mezcladores $189" note appears exactly once per view of
  the Destilados section (never duplicated per sub-group) — verifiable count = 1.
- **SC-004**: The Cantaritos y Vasos Sumo group shows exactly one Vaso Sumo card with a working
  six-base selector, plus a separate Tropical Sumo card; the count of standalone Vaso Sumo cards
  drops from 5 to 1.
- **SC-005**: The homepage "Garantías Sumo" rail shows exactly the 11 named UNIQUE dishes and no
  others — count = 11 after dedupe-by-name, membership matches the list exactly.
- **SC-006**: Alitas & Boneless dishes show zero sauce pickers.
- **SC-007**: No-image drink cards occupy half the width of image cards, producing 6 per desktop
  row versus 3 image cards per row — verifiable at the desktop breakpoint.
- **SC-008**: The modality label reads "Carta" (ES) / "Menu" (EN) and "All You Can Eat" (both) —
  verifiable in both locales.
- **SC-009**: Switching primary selection or modality resets the visible category to the first
  category of the new set — 100% of switches.
- **SC-010**: Every component changed by the feature has updated Storybook stories and passing
  Vitest specs; the full test suite remains green (789 tests reported at delivery).
- **SC-011**: `/menu` continues to load within the existing performance budget (Lighthouse 90+).
  Rendering mode is **`ssr: true`** (the route was never `isr:3600`); no `drizzle-orm` /
  `@neondatabase/serverless` import exists under `app/**`.
- **SC-012**: Each deep-link form (`type=ayce&modality=buffet&category=<foodKey>`,
  `type=ayce&modality=carta&category=<foodKey>`, `type=express&category=<foodKey>`,
  `type=bebidas&category=<drinkGroupKey>`, `type=kids`) restores the exact view; omitting `category`
  applies the correct default; an invalid key falls back to the default with no empty view; and
  every toggle/chip interaction yields a shareable URL that reproduces the same view — verifiable
  via automated tests.
- **SC-013**: All category and drink-group labels shown in the UI come from the database; grepping
  for removed `menu.category.*` / `menu.drink_group.*` i18n keys (other than `menu.category.empty`)
  returns nothing.
- **SC-014**: When Neon is unavailable, `/menu` degrades to the `menu.unavailable` empty state (no
  raw 500); transient errors are retried up to 3 times before degrading.

## Assumptions

- The intake contract in `specs/_batch-intake/intake.md` is the authoritative, client-confirmed
  taxonomy; the architecture map in `specs/_batch-intake/menu-map.md` accurately reflects the
  current schema, seeds, API, components, and i18n keys.
- The full menu catalogue (all categories and dishes) already exists in the content store from
  prior features (016 menu schema, 018 blob images, and the `/menu` page work). This feature
  restructures navigation and refines the drinks data; it does not add new dishes beyond the
  consolidation/split operations described.
- The category and drink-group **identifiers** already exist; this feature adds the notion of a
  curated, ordered **parent set** on top of them and one new drink group (Destilados). Three small
  additive migrations shipped: 0027 (`drink_group.display_order`), 0028 (`drink_group.name_es/en`),
  0029 (`menu_categories.note_es/en`) — all applied to production Neon and re-seeded.
- The Kids category (`kids`) already exists in the schema; this feature promotes it to a dedicated
  cross-cutting VIEW (standalone button) split into two sub-sections by `includedInAyce`, seeded by
  `kidsMenu.ts` (1 AYCE buffet item + 6 combos) with the inclusion note on `menu_categories`.
- The existing sauce catalogue remains available for any future use; only its association with
  Alitas & Boneless is removed. The spice-thermometer visual is deferred to a later feature.
- The `/menu` route rendering mode (ISR) and the homepage featured-rail data source are unchanged.
- Bilingual copy for the relabelled modality and any new labels is confirmed: "Carta"/"Menu" and
  "All You Can Eat".
- Half-width behaviour applies to drink cards specifically (no-image), across all drink sections;
  food dish cards are unaffected by the half-width rule.

## Out of Scope

- Spice-thermometer imagery/visual for Alitas & Boneless (deferred to a later feature).
- The hero headline font swap, promotions carousel, and contact job card — consolidated into
  feature 022 (`specs/022-homepage-hero-promos-contact/`), shipped on the SAME 021 branch/PR.
- Any new `/menu` sub-routes or additional pages.
- WordPress admin configuration; the drinks data lives in the app's own content store.
- Adding brand-new dishes beyond the described consolidation (Vaso Sumo) and split (Destilados).

## Dependencies

- Prior features: 016 (menu schema & DB), 018 (Vercel Blob images), and the `/menu` page
  implementation (delivered under feat/018-menu-page) — all `done`.
- The existing menu content store, API, filter composable, and menu feature components.
- Bilingual locale files (ES/EN) and the design tokens / Storybook coverage discipline from the
  constitution.
