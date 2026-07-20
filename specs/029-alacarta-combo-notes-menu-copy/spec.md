# Feature Specification: À La Carte Combo Notes & Menu Copy Refresh

**Feature Branch**: `feat/029-alacarta-combo-notes-menu-copy`
**Created**: 2026-07-20
**Status**: Draft
**Input**: User description: "Three independent, DB-seed-only copy/data changes for the SUMO AYCE bilingual (ES/EN) menu: (A) rename the shared 'rice' menu category's Spanish name from 'Arroz' to 'Arroces'; (B) add '10 Pzas'/'10 pcs.' piece-count copy to the à la carte Sushi Frío, Sushi Caliente and Sushi Dulce dish descriptions, since à la carte rolls are 10 pieces while the AYCE-buffet/Express versions of the same dishes are 5 pieces; (C) add à-la-carte-only combo notes to the Hamburguesas, Hot Dogs, Sushi Frío and Sushi Caliente categories describing what their à la carte combo includes, visible ONLY in the AYCE 'à la carte' modality — never in AYCE buffet, never in Express — which requires a modality-scoped extension of the existing category-note mechanism because these four categories are shared across all three modalities today."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Rice category renamed to "Arroces" (Priority: P1)

A visitor browsing the menu (any modality that shows the shared "rice" category, i.e. à la carte, since rice dishes are à la carte-only) sees the category labeled "Arroces" in Spanish instead of "Arroz". The English label ("Rice") is unchanged.

**Why this priority**: Smallest, lowest-risk change (single-row copy edit) and a direct, explicit client request.

**Independent Test**: Load the à la carte menu in Spanish and confirm the rice-dishes category chip/heading reads "Arroces". Switch to English and confirm it still reads "Rice".

**Acceptance Scenarios**:

1. **Given** a visitor views the à la carte menu in Spanish, **When** the page renders the rice-dishes category, **Then** the category name displays as "Arroces".
2. **Given** a visitor views the à la carte menu in English, **When** the page renders the rice-dishes category, **Then** the category name displays as "Rice" (unchanged).
3. **Given** the rice category is queried under any other modality or location type, **When** the seed data is inspected, **Then** no AYCE-buffet or Express item rows reference the rice category (confirmed unaffected — this category has always been à la carte-exclusive).

---

### User Story 2 - À la carte sushi shows its 10-piece count (Priority: P1)

A visitor comparing the AYCE-buffet/Express sushi rolls (5 pieces per order, already stated in their descriptions) against the à la carte sushi rolls wants to know the à la carte rolls are a bigger, 10-piece order. Today, the à la carte Sushi Frío, Sushi Caliente and Sushi Dulce dish descriptions do not mention a piece count at all, while the equivalent buffet/Express dish descriptions do. The visitor should see "10 Pzas." (Spanish) / "10 pcs." (English) on every à la carte roll dish, mirroring the piece-count convention already used elsewhere in the menu.

**Why this priority**: Directly requested by the client, low risk (copy-only, per-item description edit, no schema change), and resolves a real information gap for visitors comparing modalities.

**Independent Test**: Load the à la carte menu, open Sushi Frío, Sushi Caliente and Sushi Dulce, and confirm every dish's description ends with the piece-count copy in the active language.

**Acceptance Scenarios**:

1. **Given** a visitor views any Sushi Frío (cold rolls) dish in the à la carte modality, **When** the dish description renders in Spanish, **Then** it ends with "10 Pzas." and in English ends with "10 pcs."
2. **Given** a visitor views any Sushi Caliente (hot rolls) dish in the à la carte modality, **When** the dish description renders, **Then** the same piece-count copy is present in both languages.
3. **Given** a visitor views any Sushi Dulce (sweet rolls) dish in the à la carte modality, **When** the dish description renders, **Then** the same piece-count copy is present in both languages.
4. **Given** a visitor views the equivalent dishes in AYCE-buffet or Express, **When** those descriptions render, **Then** they are unchanged (still 5-piece copy, untouched by this feature).

---

### User Story 3 - À la carte-only combo notes on Hamburguesas, Hot Dogs, Sushi Frío and Sushi Caliente (Priority: P1)

A visitor browsing the à la carte menu opens Hamburguesas, Hot Dogs, Sushi Frío or Sushi Caliente and sees a short note at the top of the category explaining that ordering any dish in that category is a combo — it comes with sides included (fries + a soft drink for burgers/hot dogs; a choice of a rice/salad side + a soft drink for the sushi categories) — matching the client's marketing flyers. A visitor browsing the SAME categories under AYCE buffet or under Express (where these dishes are plain buffet-included items, not combos) sees no such note, because no combo applies there.

**Why this priority**: The client's core new-copy ask; correctly scoping it to à la carte only is the feature's central design risk (these categories are shared across all three modalities), so it is P1 alongside the other content changes.

**Independent Test**: Load the à la carte menu, open each of the four categories, and confirm the combo note is visible. Then switch to AYCE buffet and to Express, open the same four categories, and confirm no combo note appears in either.

**Acceptance Scenarios**:

1. **Given** a visitor views Hamburguesas or Hot Dogs in the à la carte modality, **When** the category renders, **Then** a note is shown stating the combo includes french fries (100 g) and a soft drink (400 ml), in both Spanish and English.
2. **Given** a visitor views Sushi Frío or Sushi Caliente in the à la carte modality, **When** the category renders, **Then** a note is shown stating the combo includes a choice of mixed yakimeshi (240 g) or sweet kani salad (180 g), plus a soft drink (400 ml), in both Spanish and English.
3. **Given** a visitor views Hamburguesas, Hot Dogs, Sushi Frío or Sushi Caliente under the AYCE buffet modality, **When** the category renders, **Then** no combo note is shown.
4. **Given** a visitor views Hamburguesas, Hot Dogs, Sushi Frío or Sushi Caliente under Express, **When** the category renders, **Then** no combo note is shown.
5. **Given** the "kids" and "wings" categories (which carry a pre-existing, modality-agnostic note from feature 028), **When** any modality renders them, **Then** their existing notes continue to display exactly as before — unaffected by this feature.

---

### Edge Cases

- What happens to a category with BOTH a modality-agnostic note (e.g. "wings", which appears with its note in every modality) and no à la carte-only note? It keeps showing its existing note in every modality, unchanged — the two note types are independent and additive, not mutually exclusive.
- What happens if a visitor is in the à la carte modality but a dish under Hamburguesas/Hot Dogs/Sushi Frío/Sushi Caliente has been deactivated (`isActive = false`)? The category note is attached to the category, not the dish, so it still renders as long as at least one active dish remains in that category for that modality; if the whole category becomes empty for that modality it renders nothing (existing category-with-no-dishes behavior, unchanged).
- What happens to Sushi Dulce (sweet rolls) under Part C? It receives the Part B piece-count copy but NOT a combo note — the client's flyers only describe combos for burgers, hot dogs, and the two roll categories (Sushi Frío / Sushi Caliente), not Sushi Dulce.
- What happens if the piece-count copy (Part B) is added to a dish whose description already ends with other trailing punctuation/notes (e.g. "Sushi sin alga.")? The piece-count copy is appended after all existing description text as a final sentence, in both languages, without altering any existing wording.
- **[Revised]** Hamburguesas, Hot Dogs, Sushi Frío and Sushi Caliente each display their name identically in every modality ("Hamburguesas"/"Burgers", etc.), yet under this revision they are backed by two distinct category records (a shared one for AYCE-buffet/Express, and an à la carte-only one carrying the combo note). Is showing the same display name under two different underlying category records ever visible to a visitor as a duplicate or conflict? No — confirmed safe: the AYCE-buffet, Express, and AYCE à la carte category chip rows are mutually exclusive views (a visitor is always in exactly one modality at a time; there is no combined "all categories" or "all modalities" view that would render both the shared and the à la carte-only variant of the same category side by side). This is confirmed against the current menu view implementation, not merely assumed.
- What happens if a future category needs the same "shared name, à la carte-only note" treatment? It follows the same pattern as this feature: a new, distinct category record with the same display name and its own note, not a modification to the shared record's note fields — keeping the shared record's note behavior (used today by kids/wings) untouched and modality-agnostic.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST display the shared "rice" menu category with the Spanish name "Arroces" (previously "Arroz") in every place that category name is rendered.
- **FR-002**: The system MUST leave the "rice" category's English name ("Rice") unchanged.
- **FR-003**: The system MUST NOT affect any AYCE-buffet or Express menu data as a result of the rice category rename (the rice category has no items outside à la carte).
- **FR-004**: The system MUST append piece-count copy — "10 Pzas." in Spanish, "10 pcs." in English — to the description of every dish in the à la carte Sushi Frío (cold rolls), Sushi Caliente (hot rolls) and Sushi Dulce (sweet rolls) categories.
- **FR-005**: The system MUST NOT alter the existing piece-count copy already present on the equivalent AYCE-buffet or Express dish descriptions (these already state their own, different piece count and are out of scope).
- **FR-006**: The system MUST display a combo note on the Hamburguesas and Hot Dogs categories, in both Spanish and English, stating that the combo includes french fries (100 g) and a soft drink (400 ml) — but ONLY when the visitor is viewing the AYCE à la carte modality.
- **FR-007**: The system MUST display a combo note on the Sushi Frío and Sushi Caliente categories, in both Spanish and English, stating that the combo includes a choice of mixed yakimeshi (240 g) or sweet kani salad (180 g) plus a soft drink (400 ml) — but ONLY when the visitor is viewing the AYCE à la carte modality.
- **FR-008**: The system MUST NOT display the Part C combo notes when the same four category names (Hamburguesas, Hot Dogs, Sushi Frío, Sushi Caliente) are viewed under the AYCE buffet modality.
- **FR-009**: The system MUST NOT display the Part C combo notes when the same four category names are viewed under Express (Express has no à la carte modality at all).
- **FR-010**: The system MUST continue to display the existing, modality-agnostic category notes already live for the "kids" and "wings" categories, in every modality, unaffected by this feature.
- **FR-011 (Revised)**: The system MUST distinguish, for each of the four affected category names, an à la carte-only variant (carrying the combo note, populated with the AYCE à la carte dishes) from the shared AYCE-buffet/Express variant (carrying no note, populated with the buffet/Express dishes) — implemented as two distinct category records with the same displayed bilingual name rather than one shared record carrying two note fields. This MUST NOT change the existing, modality-agnostic note behavior already in place for "kids" and "wings" (which remain single, unsplit category records).
- **FR-012**: All new or changed copy introduced by this feature MUST be provided in both Spanish and English.
- **FR-013 (Revised)**: This feature MUST be delivered by adding new category rows (the four à la carte-only variants), reassigning the affected à la carte menu items to point to them, and updating the curated per-view category set (`AYCE_CARTA_SET`) accordingly — no changes to existing AYCE-buffet or Express item rows or category rows, no new table, no new column on `menu_categories`, and no changes to the menu query layer (`server/utils/menu-queries.ts`). The only schema change permitted is a minimal, additive extension of the existing category-key enum to admit the four new keys, following the exact precedent already used in this codebase for prior category-key additions (see `server/db/migrations/0021_add_ensalada_arroces_category_keys.sql`, `0022_add_ramen_category_key.sql`). No price changes.

### Key Entities *(include if feature involves data)*

- **Menu Category**: The classification a dish belongs to (e.g. Hamburguesas, Sushi Frío, Arroces). Carries a bilingual name, a unique key, and an optional descriptive note. Most categories are single, shared records reused across AYCE-buffet, Express, and à la carte simultaneously. Two kinds of note exist: a modality-agnostic note that shows in every modality the category appears in (already used by "kids" and "wings", unaffected by this feature), and — newly introduced by this feature — an à la carte-only note, achieved not by adding a note field to a shared record but by giving the affected category a **second, à la carte-only category record** (distinct key, e.g. `burgers_carta`; same displayed name as the shared record, e.g. "Hamburguesas"/"Burgers") that carries the combo note and is populated exclusively by à la carte dishes. The original shared record (e.g. `burgers`) keeps its dishes under AYCE-buffet/Express and remains note-less, exactly as today.
- **Menu Dish (à la carte)**: An individual sellable item under a category, priced individually, with its own bilingual description that this feature extends (for the affected roll categories) with trailing piece-count copy. For Hamburguesas, Hot Dogs, Sushi Frío and Sushi Caliente, à la carte dishes reference the new à la carte-only category record instead of the shared one used by their AYCE-buffet/Express counterparts.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of rice-category renderings show "Arroces" in Spanish across the site, with zero regressions to the English label.
- **SC-002**: 100% of à la carte Sushi Frío, Sushi Caliente and Sushi Dulce dishes display the correct bilingual piece-count copy, with zero occurrences of that copy leaking into AYCE-buffet or Express views of the same dish names.
- **SC-003**: 100% of à la carte views of Hamburguesas, Hot Dogs, Sushi Frío and Sushi Caliente display the correct bilingual combo note, and 0% of AYCE-buffet or Express views of those same four categories display any combo note (verified across all three modality/location combinations for each category).
- **SC-004**: The existing "kids" and "wings" category notes render identically to their pre-feature behavior in 100% of modalities, confirming no regression from the new à la carte-only category variants.
- **SC-005 (Revised)**: A full delete-and-reseed cycle completes without data loss or foreign-key errors for the ten categories touched by this feature (the six named in FR-013, plus the four new à la carte-only category records this revision introduces: `burgers_carta`, `hot_dogs_carta`, `cold_rolls_carta`, `hot_rolls_carta`).

## Assumptions

- The "rice" category's English name ("Rice") is left unchanged because the client only requested the Spanish rename; if the client later wants an English change too, that is a follow-up, not part of this feature.
- Piece-count copy ("10 Pzas." / "10 pcs.") is appended as a trailing sentence at the end of each dish's existing bilingual description, matching the placement convention already used for the 5-piece copy on the AYCE-buffet/Express equivalents (`server/db/seeds/ayceMenu.ts`, `server/db/seeds/expressMenu.ts`), rather than being inserted as a separate field.
- The combo-note wording is authored to match the tone of the existing "kids" and "wings" category notes (short, factual, states exactly what's included) and is sourced directly from the client's own combo flyers (`assets/source/burger-combo-flyer.png`, `hotdog-combo-flyer.png`, `sushi-frio-combo-flyer.png`, `sushi-caliente-combo-flyer.png`):
  - Hamburguesas / Hot Dogs: "Incluye papas a la francesa (100 g) y refresco (400 ml)." / "Includes french fries (100 g) and a soft drink (400 ml)."
  - Sushi Frío / Sushi Caliente: "Incluye tu elección de yakimeshi mixto (240 g) o ensalada sweet kani (180 g), más refresco (400 ml)." / "Includes your choice of mixed yakimeshi (240 g) or sweet kani salad (180 g), plus a soft drink (400 ml)."
  This wording may be refined at implementation time as long as it preserves the same factual content (what's included) and bilingual coverage.
- Sushi Dulce (sweet rolls) receives the Part B piece-count copy only — it is explicitly out of scope for the Part C combo note, since the client's flyers do not describe a Sushi Dulce combo.
- **[Revised]** The mechanism for scoping a category note to a single modality (à la carte) is resolved as a **category split**, not a shared-record data-model extension: each of the four affected categories gets a second, à la carte-only category record (same displayed name, distinct key, e.g. `burgers_carta`) that carries the combo note, and the à la carte dishes that used to share the original category record are reassigned to point to it. The original shared category record (used by AYCE-buffet/Express) is untouched and stays note-less. This was explicitly requested by the client over the alternative (a shared record with two note-column-pairs plus a modality branch in the query layer) precisely because it means new categories — with independently manageable membership — are created and pointed to by the affected items, rather than a hidden per-modality flag on a single row. It also mirrors this project's own precedent for adding category variants (feature 023's curated per-view category sets; migrations `0021_add_ensalada_arroces_category_keys.sql`/`0022_add_ramen_category_key.sql` for prior category-key additions).
- **[Revised]** Because `menu_categories.key` is a Postgres enum (`menu_category_key`), the four new keys require a minimal, additive enum-value migration (`ALTER TYPE ... ADD VALUE IF NOT EXISTS`, one line per key) — this is the smallest schema change this enum type structurally allows for adding a new category key, already the established pattern in this codebase (see the migrations referenced above). No new column, no new table, and no change to `server/utils/menu-queries.ts` are needed: the existing `includedInAyce`/`locationType` filtering that already separates buffet/Express items from à la carte items means the new à la carte-only category records naturally only ever appear when a visitor is in the AYCE à la carte modality, with zero query-layer branching required.
- **[Revised]** Displaying the same bilingual name (e.g. "Hamburguesas"/"Burgers") under two different category keys is confirmed safe: the menu page renders exactly one category section at a time, selected from a single, modality-exclusive curated set (`AYCE_BUFFET_SET`, `AYCE_CARTA_SET`, or `EXPRESS_SET` — see `app/features/menu/menu-sets.ts` and `MenuShell.vue`'s `activeFoodCategory` lookup). There is no view that renders categories from more than one of these sets simultaneously, so the shared-name/split-key pair is never visible side by side. The only place `category.key` drives conditional UI logic today is a single hardcoded `=== 'wings'` check (the sauce thermometer graphic in `MenuDishGrid.vue`), unrelated to the four affected keys — confirmed via a repo-wide grep, no other consumer (i18n keys, hardcoded checks, tests outside this feature's own seed/menu-sets tests) depends on the literal string value of `burgers`/`hot_dogs`/`cold_rolls`/`hot_rolls`.
- The client's combo flyers show a combo price ($179 for cold_rolls/hot_rolls) that does not match the current à la carte item price already seeded ($119) for those dishes. This is a pre-existing pricing discrepancy, unrelated to the copy-only scope of this feature, and is explicitly out of scope — no price changes are made here.
- **[Revised]** This feature is delivered entirely through seed-data edits (Part A/B copy edits; Part C new category rows + à la carte item reassignment + curated-set update) plus a minimal additive enum-value migration (Part C only) and a full delete-and-reseed cycle; no new UI components are introduced and no query-layer code changes are made, since the existing category-note rendering surface and the existing buffet/à la carte item-filtering mechanism already do all the work needed.
