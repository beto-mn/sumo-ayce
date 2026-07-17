# Feature Specification: Sauce Heat Thermometer Graphic + Sitewide Watermark Asset Refresh

**Feature Branch**: `028-sauce-thermometer-watermark-refresh`
**Created**: 2026-07-17
**Status**: Draft — **AMENDED 2026-07-17** (Part B scope reversal) — **AMENDED 2026-07-18** (Part C addition, see below) — **AMENDED 2026-07-18** (Part D addition, note box width fix, see below)
**Input**: User description: "Consolidated client asset request (2 independent parts): Part A replaces the sitewide pop-art watermark artwork with a new client-supplied tile; Part B introduces a visual sauce heat thermometer graphic wherever Wings & Boneless sauce selection happens (AYCE, Express, À la Carta), and requires first determining whether/how sauce selection needs to be newly wired into the menu since no interactive sauce picker exists for these dishes today."

**REVISED 2026-07-17 (client instruction, after receiving the FINAL thermometer graphic from the designer)**: The original Part B was implemented and committed as `df3a13c` — it wired an interactive sauce picker into Wings/Boneless dish cards (AYCE/Express single-select, À la Carta bounded multi-select via a new `maxSelections` column) and mounted the section-level heat-thermometer graphic. Having seen the final thermometer graphic, the client has decided it is sufficient guidance on its own — the interactive picker is **not wanted**, and the underlying `sauces` DB table (which predates this feature, originally added in feature 016-menu-schema-db) is to be **removed entirely**. This is a scope reversal of previously-approved User Stories 2/3 and FR-006/FR-009/FR-010/FR-011, documented below mirroring feature 027 Part C's "SCRAPPED" precedent. Part A (watermark) and the thermometer graphic itself are unaffected and remain exactly as shipped in `df3a13c`.

**PART C (ADDED 2026-07-18)**: After Parts A and B (revised) shipped and this feature was reviewer-approved and marked `done`, the client requested one further small addition, tracked here as an in-place amendment (not a new feature) since it directly builds on this feature's own Part B thermometer graphic: add the instructional copy "Escoge tu salsa favorita" / "Choose your favorite sauce" to the "Alitas & Boneless" category, reusing the existing `menu_categories.noteEs`/`noteEn` mechanism already live for the "kids" category. See User Story 4, FR-020/FR-021, and the "PART C" Revision subsection below.

**PART D (ADDED 2026-07-18)**: The client visually inspected Part C's own shipped output and found the note box too wide — the `category-note` block is a full-width `<div>` with no content-width constraint, which looks correct for the pre-existing "kids" category's long paragraph note but renders as an oversized, obviously-too-wide pill for Part C's short "Escoge tu salsa favorita" text. This is a pure CSS sizing fix (no template structure change, no new component), tracked as a further in-place amendment on this same feature. See User Story 5, FR-022, and the "PART D" Revision subsection below.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Refreshed sitewide watermark artwork (Priority: P1)

A visitor browses any page of the site (home, menu, promotions, branches, contact). In the background, behind the readable content, a subtle repeating pop-art texture is visible at low opacity — today it shows the original brand lockups (SUMO / ALL YOU CAN EAT / BURGER / SUSHI / RAMEN / YAKIMESHI / EXPRESS / CRUNCH). The client has commissioned a new version of this artwork and wants the site to display the updated tile everywhere the texture currently appears, with the same subtlety (it must never compete with foreground content for attention) and the same overall visual density (repeat frequency) as before.

**Why this priority**: Sitewide visual asset, touches every page; a client-requested brand refresh that is low-risk (decorative, non-blocking) but visible everywhere and explicitly asked for.

**Independent Test**: Load any page and visually confirm the background texture is the new artwork, at the same low-opacity/legibility baseline and roughly the same on-screen tile size/repeat frequency as before the change (no content readability regression).

**Acceptance Scenarios**:

1. **Given** a visitor loads any page of the site, **When** the page renders, **Then** the sitewide background texture shows the new artwork (not the old one) at a low opacity that does not reduce foreground text/content legibility.
2. **Given** the new artwork's source file has a different pixel resolution than the previous tile, **When** the site renders the texture, **Then** the on-screen repeat/tile size and overall visual density looks consistent with the pre-change baseline (the pattern does not suddenly appear much larger or smaller on screen).
3. **Given** a visitor has `prefers-reduced-motion` or any accessibility mode enabled, **When** the page renders, **Then** the watermark (a static, non-animated texture) is unaffected — this change introduces no motion.

---

### User Story 2 - Sauce heat thermometer graphic on Wings/Boneless sections (Priority: P1) — REVISED 2026-07-17, interactive picker SCRAPPED

*(Previous version of this story also described an interactive single-sauce picker for AYCE/Express Wings/Boneless dishes, implemented in `df3a13c`. That half is scrapped — see Assumptions. This is the current, approved version: thermometer graphic only.)*

A visitor viewing the AYCE or Express menu reaches the "Alitas & Boneless" (Wings & Boneless) section, where each dish includes one sauce of their choice. The dish shows descriptive text ("with your choice of sauce") — there is no interactive control to actually pick a sauce, by design. To help the visitor gauge how mild or spicy the available sauces are before ordering, the section displays a visual "heat thermometer" graphic, ordered from mildest to spiciest, once per section.

**Why this priority**: The thermometer graphic is the client's confirmed, final ask for this feature — a low-risk, purely informational visual that delivers the "help the visitor gauge spice level" value without the interaction-design surface area (and now-unwanted DB dependency) of a real picker.

**Independent Test**: On the AYCE or Express menu, open the "Alitas & Boneless" section and confirm the heat thermometer graphic is visible exactly once in that section, ordered mild → spicy, and that no Wings/Boneless dish shows any interactive sauce-selection control (single- or multi-select) — dish sauce choice remains descriptive text only, exactly as before `df3a13c`.

**Acceptance Scenarios**:

1. **Given** a visitor views the "Alitas & Boneless" section (AYCE or Express), **When** the section renders, **Then** the sauce heat thermometer graphic is visible exactly once in that section.
2. **Given** a visitor views any Wings or Boneless dish, **When** the dish renders, **Then** no interactive sauce-selection control (radio, checkbox, or any other selectable picker) is shown — the dish's sauce mention remains descriptive text only.
3. **Given** the thermometer graphic, **When** it is viewed, **Then** its visual mild-to-spicy ordering is legible and consistent left-to-right (or top-to-bottom) without requiring any live data lookup — the ordering is baked into the static graphic asset itself.

---

### User Story 3 - Multi-sauce selection for À la Carta Wings/Boneless packages (Priority: P2) — SCRAPPED 2026-07-17

*(This story, and the bounded multi-select sauce picker it described, is entirely scrapped — see Assumptions. À la Carta Wings/Boneless packages return to descriptive-text-only for sauce choice, same as AYCE/Express, and gain the same section-level thermometer graphic as User Story 2 covers. No replacement interaction is introduced.)*

---

### User Story 4 - Instructional note on the Wings/Boneless section (Priority: P2) — ADDED 2026-07-18

A visitor viewing the AYCE, Express, or À la Carta menu reaches the "Alitas & Boneless" (Wings & Boneless) section. Directly below the section title — and above the heat thermometer graphic from User Story 2 — a short instructional note reads "Escoge tu salsa favorita" (or "Choose your favorite sauce" in English), telling the visitor that each dish's included sauce is theirs to choose (in person / when ordering), before they see the thermometer that helps them gauge how mild or spicy each option is.

**Why this priority**: A small, low-risk copy addition that improves the section's readability (instruction before visual guide) but does not gate or change any other functionality — the thermometer graphic (User Story 2) already delivers the feature's primary value on its own.

**Independent Test**: On any menu view (AYCE, Express, or À la Carta) that shows the "Alitas & Boneless" section, confirm the note "Escoge tu salsa favorita" / "Choose your favorite sauce" (locale-aware) renders once, directly below the section's `<h2>` title and directly above the heat thermometer graphic — and that no other category shows this note.

**Acceptance Scenarios**:

1. **Given** a visitor views the "Alitas & Boneless" section, **When** the section renders, **Then** the note "Escoge tu salsa favorita" (ES) or "Choose your favorite sauce" (EN, locale-aware) is visible exactly once, positioned below the category title and above the thermometer graphic.
2. **Given** a visitor views any other menu category, **When** that category renders, **Then** no such sauce-related note appears (the addition is scoped to "Alitas & Boneless" only).
3. **Given** the existing "kids" category note, **When** either category renders, **Then** both notes use the same visual treatment/component (no new note style is introduced for Wings/Boneless).

---

### User Story 5 - Category note box sized to its content, not stretched full-width (Priority: P3) — ADDED 2026-07-18

A visitor viewing the "Alitas & Boneless" section sees the new "Escoge tu salsa favorita" note (User Story 4) rendered as a compact box that hugs its short text — not as an oversized bar stretching the full width of the section with the text left-aligned inside a mostly-empty box. A visitor viewing the "kids" ("Combo Infantil") section still sees its longer inclusions paragraph rendered exactly as before — fully readable, wrapping naturally, not clipped or oddly narrow.

**Why this priority**: A small, purely cosmetic follow-up to Part C — it improves the visual polish of the note box for short text without touching any functionality, content, or the already-correct behavior for the existing long-text case.

**Independent Test**: On the "Alitas & Boneless" section, confirm the note box visually hugs its short text (no large empty space to its right). On the "Combo Infantil" ("kids") section, confirm its longer note still reads exactly as it did before this change (fully visible, wraps naturally, not visually broken or clipped) at both desktop and mobile (360px) viewport widths.

**Acceptance Scenarios**:

1. **Given** a visitor views the "Alitas & Boneless" section, **When** the note box renders, **Then** its width fits its short text content rather than stretching to the full width of the section.
2. **Given** a visitor views the "Combo Infantil" ("kids") section, **When** its longer note box renders, **Then** the text remains fully readable and wraps naturally — no regression versus the pre-Part-D baseline.
3. **Given** a visitor on a narrow mobile viewport (360px), **When** either note box renders, **Then** the box never overflows/exceeds the width of its containing section, regardless of the note's text length.

---

### Edge Cases

- What happens if the new watermark artwork file is temporarily unavailable (e.g., asset upload issue)? The page must still render (broken background image must not break layout or block content).
- What happens on the reference thermometer graphic's known-placeholder blank left gutter (acknowledged WIP asset at spec-authoring time, since resolved — the client's FINAL asset is already in production use)? It must not be cropped, masked, or positioned in a way that assumes a permanent layout quirk, since any future designer revision must remain a single-file swap.
- What happens on narrow mobile viewports (360px) with the thermometer graphic present? It must remain legible and must not push the dish grid below the fold in a way that breaks the mobile-first requirement.
- **(REVISED 2026-07-17)** What happens to a Ramen XL or Vaso Sumo option group during the Wings/Boneless option-group removal? Nothing — the removal targets ONLY the Wings/Boneless-sourced seed rows added in `df3a13c`; Ramen XL's and Vaso Sumo's option groups (feature 027) MUST continue to render exactly as before, via the same unmodified `MenuDishCard.vue` rendering loop.
- **(REVISED 2026-07-17)** What happens to the `sauces` table removal if some other part of the codebase turns out to depend on it? Not expected — verified via repo-wide grep during spec authoring (see Assumptions) — but the removal migration and code changes MUST be reviewed against a fresh grep at implementation time as a final safety check before the DROP TABLE migration is applied.
- **(ADDED 2026-07-18)** What happens if a visitor's locale is neither `es` nor `en` (or the note field is somehow empty at read time)? Same fallback already used by the existing `category.note`/`categoryNote()` rendering: fall back to the Spanish (`es`) value; a genuinely empty/null note (which won't occur for "wings" after seeding, per FR-020) hides the note block entirely, exactly as it does today for every category without a note.
- **(ADDED 2026-07-18, Part D)** What happens to the "kids" category's longer note under the new content-fit sizing? It keeps wrapping/behaving as it does today — CSS `fit-content` sizing (which `w-fit` maps to) already clamps to the available container width for wrapping text, so a long paragraph note is unaffected; only short text (like the new wings note) visibly hugs tighter than before.

## Requirements *(mandatory)*

### Functional Requirements

**Part A — Watermark artwork refresh**

- **FR-001**: The system MUST display the new client-supplied artwork wherever the sitewide repeating background texture currently appears (every page using the default site layout).
- **FR-002**: The system MUST preserve the existing low-opacity, non-distracting presentation of the texture — foreground content legibility MUST NOT regress from the pre-change baseline.
- **FR-003**: The system MUST preserve the existing on-screen tile repeat size/visual density of the texture, regardless of the new artwork file's native pixel resolution differing from the previous file.
- **FR-004**: The system MUST NOT introduce a new separate overlay element for the texture — it continues to be layered together with the page's base background color on the same wrapper, consistent with the existing architecture.
- **FR-005**: Replacing the artwork MUST NOT change the texture's behavior under `prefers-reduced-motion` (it remains static/non-animated, unaffected either way).

**Part B — Sauce heat thermometer graphic (REVISED 2026-07-17 — interactive picker + multi-select SCRAPPED)**

- ~~**FR-006**: The system MUST provide an interactive sauce selection control for every AYCE and Express "Alitas & Boneless" dish...~~ **SCRAPPED 2026-07-17** — see FR-006-REV below.
- **FR-006-REV**: The system MUST NOT show any interactive sauce-selection control (single- or multi-select, radio or checkbox) on any Wings/Boneless dish, in AYCE, Express, or À la Carta. Sauce choice remains descriptive text only, exactly as it was before `df3a13c`.
- **FR-007**: The system MUST display a visual heat-thermometer graphic once per "Alitas & Boneless" category section (AYCE, Express, and À la Carta each show it once at the section level, not once per dish) that visually orders the sauces from mildest to spiciest. *(Unchanged — already correctly implemented and shipped.)*
- **FR-008**: The thermometer graphic's mild-to-spicy ordering MUST be visually consistent and legible as a static asset — it does not depend on any live sauce-catalog data lookup (the graphic is a single static image, not data-driven). *(Revised wording only — no functional change; previously referenced "the sauce picker's own ordering," which no longer exists.)*
- ~~**FR-009**: The system MUST provide a bounded multi-select sauce control (allowing exactly 2 or exactly 3 selections, per dish) for every À la Carta "Alitas & Boneless" package...~~ **SCRAPPED 2026-07-17** — superseded by FR-006-REV.
- ~~**FR-010**: The system MUST prevent a visitor from selecting more sauces than a given multi-sauce package allows...~~ **SCRAPPED 2026-07-17** — no selection control exists, so nothing to bound.
- ~~**FR-011**: The sauce catalog shown in every picker (single- or multi-select) MUST be the same underlying set of 12 sauces...~~ **SCRAPPED 2026-07-17** — no picker/catalog remains; superseded by FR-014 (removal).
- **FR-012**: The system MUST treat the thermometer image as a single swappable asset reference, with no hardcoded cropping or positioning logic that assumes any particular gutter/layout is permanent. *(Unchanged — already correctly implemented and shipped.)*
- **FR-013**: Existing sauce-selection-adjacent features (Ramen XL's "build your own" option groups, Vaso Sumo's flavor picker) MUST be completely unaffected by the removal work in this revision — they continue to render via the same unmodified `MenuDishCard.vue` option-groups loop.

**Part B — Removal requirements (NEW 2026-07-17)**

- **FR-014**: The Wings/Boneless-sourced `menu_item_option_groups`/`menu_item_option_choices` seed rows added in `df3a13c` (the AYCE/Express single-sauce groups and the À la Carta bounded multi-sauce groups for Alitas/Boneless and their packages) MUST be removed from the seed data and, on next seed run, from the database.
- **FR-015**: The entire `sauces` database table (predating this feature, originally added in feature 016-menu-schema-db) MUST be removed via a new additive-only migration that DROPs the table — the original feature-016 migration file MUST NOT be edited.
- **FR-016**: Every code reference to the `sauces` table MUST be removed as part of the same cleanup: the seed module that populates it, the seed-runner's invocation of that module, the query function that reads it, and the response field that exposes its data — with no dead/unreachable code left behind (Article VIII).
- **FR-017**: The dormant `menu_items.requires_sauce` boolean column and its corresponding type field (unused by any UI before or after `df3a13c`, noted as dormant in this spec's original Clarifications session) MUST also be removed, along with every seed/type/test/story reference to it, as part of the same cleanup pass — closing out the "sauce selection is data-modeled but nothing renders it" concern definitively.
- **FR-018**: The unrelated `MenuCategoryKey = 'sauces'` union member (the "Salsas" menu category key) MUST NOT be touched, renamed, or removed by this cleanup — it is a distinct concept that coincidentally shares the English word "sauces" and is out of scope.
- **FR-019**: The removal MUST NOT affect the "Alitas & Boneless" category's other content (dish names, descriptions, images, prices) or the section-level thermometer graphic — only the sauce-selection-specific additions from `df3a13c` are reverted.

**Part C — Wings/Boneless instructional note (NEW 2026-07-18)**

- **FR-020**: The system MUST display the note "Escoge tu salsa favorita" (Spanish) / "Choose your favorite sauce" (English, locale-aware) for the "Alitas & Boneless" ("wings") category, reusing the existing `menu_categories.noteEs`/`noteEn` mechanism and its existing rendering slot (`MenuDishGrid.vue`'s `categoryNote()`/`category-note` block) — no new schema, no new component.
- **FR-021**: The note MUST render exactly once per "Alitas & Boneless" section, positioned below the category `<h2>` title and above the heat-thermometer graphic (FR-007) — this is the existing render order already produced by `MenuDishGrid.vue` and requires no layout change. No other category's note is affected.

**Part D — Category note box content-width fix (NEW 2026-07-18)**

- **FR-022**: The `category-note` box (`MenuDishGrid.vue`) MUST size itself to fit its text content rather than always stretching to the full width of its containing section — a short note (e.g., the wings "Escoge tu salsa favorita") MUST render as a compact, content-hugging box; a long note (e.g., the existing "kids" inclusions paragraph) MUST continue to render fully readable, wrapping naturally, with no regression versus its pre-Part-D appearance. No other visual property of the box (color, border, shadow, font, text content) changes.

### Key Entities *(include if feature involves data)*

- ~~**Sauce**: One of the 12 selectable sauce/dressing options for Wings & Boneless dishes...~~ **REMOVED 2026-07-17** — the `sauces` table and its catalog are deleted entirely (FR-015/FR-016); no replacement entity.
- **Wings/Boneless dish**: A menu item in the "Alitas & Boneless" category; sauce choice is descriptive text only, with no attached option group (reverted to its pre-`df3a13c` shape).
- **Sitewide watermark artwork**: The single decorative background texture asset applied across all pages; this feature replaces its underlying image content only, not its application mechanism. *(Unchanged.)*
- **Sauce heat thermometer graphic**: A single decorative/informational static image asset depicting the relative heat of a range of sauces, mildest to spiciest; shown once per "Alitas & Boneless" category section (AYCE, Express, À la Carta) and swappable independently of everything else in this feature. *(Unchanged — no dependency on the removed `sauces` table.)*
- **Wings/Boneless category note**: The bilingual `menu_categories.noteEs`/`noteEn` value for the "wings" ("Alitas & Boneless") category, reusing the same entity/mechanism already populated for the "kids" category. *(NEW 2026-07-18 — Part C.)* Its rendered box's sizing behavior (content-fit vs. full-width) is a Part D, CSS-only concern — no change to the entity itself.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of pages using the default site layout show the refreshed watermark artwork, with no visible layout shift, missing-image state, or legibility regression compared to the pre-change baseline. *(Unchanged.)*
- ~~**SC-002**: Every AYCE and Express Wings/Boneless dish (100% of single-sauce dishes) offers a working, single-choice sauce selection...~~ **SCRAPPED 2026-07-17** — superseded by SC-006 (no picker present).
- ~~**SC-003**: Every À la Carta Wings/Boneless package (100% of multi-sauce packages) allows visitors to make their required number of sauce selections.~~ **SCRAPPED 2026-07-17** — superseded by SC-006.
- **SC-004**: Visitors can determine, within a few seconds of viewing the "Alitas & Boneless" section, which sauces are mild versus spicy, without needing to read each sauce's name individually — verified by the thermometer graphic's presence and legible mild-to-spicy visual order. *(Revised wording only — no longer compares against a picker's ordering, since none exists.)*
- **SC-005**: The thermometer graphic can be replaced with a corrected version supplied by the client's designer by swapping a single image reference, with zero code changes required elsewhere. *(Unchanged.)*
- **SC-006 (NEW 2026-07-17)**: 100% of Wings/Boneless dishes across AYCE, Express, and À la Carta show zero interactive sauce-selection controls — sauce choice is descriptive text only.
- **SC-007 (NEW 2026-07-17)**: The `sauces` database table, its seed module, and every code reference to it (query function, response field, dormant `requiresSauce` field) are absent from the codebase after this revision ships — verified by a repo-wide search finding zero remaining references outside historical spec/plan documentation.
- **SC-008 (NEW 2026-07-18)**: 100% of "Alitas & Boneless" section renders (AYCE, Express, À la Carta) show the "Escoge tu salsa favorita" / "Choose your favorite sauce" note exactly once, immediately above the thermometer graphic; 0% of any other category shows this note.
- **SC-009 (NEW 2026-07-18, Part D)**: The wings note box visually hugs its short text (no oversized empty space), and the kids note box remains fully readable and unchanged in wrapping behavior, verified across desktop and a 360px mobile viewport, with zero regression to either box's color/border/shadow/font treatment.

## Assumptions

- **Watermark on-screen sizing**: Since the new artwork tile (781×1056 px) is nearly the same aspect ratio as the current tile (300×405 px) but ~2.6x the linear resolution, and no explicit CSS sizing is set today, the on-screen tile size will be explicitly constrained (rather than left to the browser's native-pixel default) so the visual density matches the feature-024 baseline. This is an implementation detail resolved in planning, not a scope question.
- **Sauce catalog reuse**: The same 12-sauce catalog (with its existing spice-level ordering) already used elsewhere in the menu is reused as-is for both the single- and multi-select pickers and the thermometer graphic — no new sauces, no changes to spice levels.
- **Existing single-active picker behavior preserved**: For the single-sauce AYCE/Express case, the existing sauce-picker interaction pattern (one selectable option, defaults to the first choice) is reused unchanged; this feature does not redesign that interaction.
- **Placeholder thermometer asset**: The current reference graphic (with its acknowledged blank left gutter) is used as the actual shipped asset for this feature; a future designer-corrected version is expected to be a drop-in replacement requiring no further code changes.
- **Out of scope**: No changes to Ramen XL or Vaso Sumo's existing option groups; no changes to any menu category or dish unrelated to "Alitas & Boneless"; no changes to the "Alitas & Boneless" category's non-sauce content.
- **(NEW 2026-07-18) EN translation choice**: "Choose your favorite sauce" is used as the natural-sounding English equivalent of "Escoge tu salsa favorita," consistent with the direct, instructional tone of the existing "kids" category note's EN translation ("Includes french fries…"). No client-specific glossary entry exists for this exact phrase; this is a judgment call, not a scope ambiguity.
- **(NEW 2026-07-18) Out of scope (Part C)**: No changes to any other category's `note`; no changes to the thermometer graphic or watermark; no changes to option-groups/sauce-selection logic (already fully removed per the 2026-07-17 revision above).
- **(NEW 2026-07-18) Part D sizing approach**: Tailwind's `w-fit` (`width: fit-content`) is used, paired defensively with `max-w-full`. CSS `fit-content` sizing is defined as `min(max-content, max(min-content, available-space))` — for ordinary wrapping text (both the short wings note and the long kids paragraph are space-separated sentences, not single unbreakable tokens) this already cannot exceed the container's available width, so the kids note's wrapping/appearance is unaffected. `max-w-full` is added as a zero-cost defensive guard against a theoretical future edge case (e.g., a single very long unbreakable token) — not because `w-fit` alone is expected to be insufficient for either of today's two note strings. This was confirmed by CSS/Tailwind semantics during spec authoring, not left as an open question.
- **(NEW 2026-07-18) Out of scope (Part D)**: No other visual change to the note box (color, border, shadow, font, text content); no change to Parts A/B/C's already-shipped functionality; no template structure change; no new component.

### Revision 2026-07-17 — Part B scope reversal (interactive picker + `sauces` table SCRAPPED)

- **This is a complete re-scope of Part B's sauce-selection half, not an addition to `df3a13c`**: The originally-approved version of this spec (User Stories 2 & 3, FR-006/FR-009/FR-010/FR-011) described an interactive sauce picker (AYCE/Express single-select, À la Carta bounded multi-select) wired through new `menu_item_option_groups`/`menu_item_option_choices` seed rows sourced from the `sauces` table. This was implemented and committed as `df3a13c`. After seeing the FINAL thermometer graphic, the client decided the picker is not wanted — the thermometer alone is sufficient guidance. Any artifacts produced for the picker (the Wings/Boneless-sourced option-group seed rows, the `sauces` table itself, and the dormant `requiresSauce`/`FullMenuResult.sauces` fields called out in the original Clarifications session below) are **superseded and MUST be removed, not adapted** — they solve a problem ("let visitors actually pick a sauce online") the client has now explicitly decided not to solve in this channel. The thermometer graphic and Part A (watermark) solve a different, still-wanted problem ("help the visitor gauge spice level at a glance") and are unaffected.
- **Why remove the `sauces` table rather than just the new seed rows**: The client's instruction targets the table itself, not only the Part-B-added rows, because the table predates this feature (feature 016-menu-schema-db) and — following removal of its only real UI consumer (the now-scrapped picker) — would otherwise become genuinely dead infrastructure: queried every menu request (`querySauces()`), exposed on every `FullMenuResult` response, seeded on every DB reset, with zero rendering consumer. Article VIII (no dead code) and Article X (KISS) both favor a clean removal over leaving an unused table/query/response-field triplet in place "just in case."
- **`requiresSauce`/`FullMenuResult.sauces` were already dormant before `df3a13c`**: they were explicitly named as unused-by-any-UI in this spec's original Clarifications session (below) and explicitly marked out-of-scope-to-touch in the original plan.md's Technical Context (to avoid unrelated cleanup during a feature that was, at the time, actively building on the `sauces` table). Now that the table itself is being removed, leaving these two fields behind would be pointless dead weight referencing a table that no longer exists — they are removed in the same pass.
- **Migration convention preserved**: consistent with this project's additive-only migration discipline, the removal is a NEW migration that `DROP TABLE sauces` — it does not edit or delete migration 0016 (where the table was originally created).

### Revision 2026-07-18 — Part C addition (Wings/Boneless instructional note)

- **Context**: This feature had already shipped Parts A and B (revised), was reviewer-approved, and marked `done`. The client requested one further small addition — an instructional note on the "Alitas & Boneless" category — and the leader reopened this feature (status flipped back to `pending`) as an in-place amendment rather than a new feature entry, since Part C directly depends on Part B's already-shipped thermometer graphic (the note is designed to read immediately above it).
- **No new mechanism**: Unlike Parts A/B, Part C introduces no new schema, component, or removal — it populates two already-existing, already-live columns (`menu_categories.noteEs`/`noteEn`) for one additional category key (`wings`), using the exact same `seedMenuCategories()` upsert and `MenuDishGrid.vue` `categoryNote()` rendering path already proven for the `kids` category.
- **Render order confirmed, not assumed**: A prior research pass on this exact question found `MenuDishGrid.vue` already renders `category.note` directly below the category `<h2>` and directly above the `wings`-gated thermometer `<img>` (see `MenuDishGrid.vue` lines ~42-67 at spec-authoring time) — re-verified during this amendment's spec authoring against the current file state (post Part-B-reversal, post feature-023 loading-skeleton work) and still holds. No layout change is required for FR-021.
- **EN translation is a judgment call, not a scope ambiguity**: see Assumptions above — "Choose your favorite sauce" was chosen to match the direct, instructional register of the existing `kids` note's EN translation; there is no indication this needs a `/speckit.clarify` round.

### Revision 2026-07-18 — Part D addition (category note box content-width fix)

- **Context**: The client visually inspected Part C's own shipped output (screenshot confirmed) and found the `category-note` box — a block-level `<div>` with no width constraint — renders as an oversized, obviously-too-wide yellow pill for the new short "Escoge tu salsa favorita" wings note, even though the identical box class list looks correct for the pre-existing "kids" category's long paragraph note (which naturally fills the width by virtue of its own length). The leader flagged this as a further in-place amendment on this same feature/branch, since it is a direct continuation of Part C's own output — not a new feature.
- **Verified in the current file state before locking in the fix**: `app/features/menu/components/MenuDishGrid.vue` (~lines 47-53) confirmed to have the exact class list described in the client's request, with no existing width constraint (`w-fit`, `max-w-*`, `inline-block`, etc. all absent).
- **No regression risk from existing tests**: `MenuDishGrid.spec.ts` and `.stories.ts` were checked for any existing width-related assertion on the `category-note` block itself — none exists (the only width-related assertion in the file targets the unrelated `wings-thermometer` image's `w-full` class). This means fixing the note box's width introduces zero risk of breaking an existing pinned assertion; a new test is added instead (see plan.md/tasks.md Part D).
- **Sizing approach confirmed, not guessed**: see Assumptions above ("Part D sizing approach") — `w-fit max-w-full` was confirmed against CSS `fit-content` semantics (Tailwind 3.4, the project's installed version) to correctly handle both today's short (wings) and long (kids) note text without regressing either case. This did not surface a genuine ambiguity requiring a `/speckit.clarify` round.

## Clarifications

### Session 2026-07-17

- Q: How should sauce selection be wired for Wings/Boneless dishes, given two existing but currently-disconnected mechanisms (the generic DB-driven option-groups system used by Ramen XL/Vaso Sumo, vs. the dormant `requiresSauce`/`sauces` catalog fields already present in the menu data but unused by any UI)? → A: Extend the generic, already-proven option-groups system (new seed rows sourced from the `sauces` table) — reuses the existing end-to-end path (DB → query layer → `FullMenuDish.optionGroups` → `MenuDishCard` → `MenuSaucePicker`) instead of building a second, parallel sauce-picker mechanism from the currently-unconsumed `requiresSauce`/`sauces` fields. **(Superseded 2026-07-17 — this entire mechanism is now being removed; see Revision above.)**
- Q: Should this feature extend the sauce picker to support multi-select (2 or 3 sauces) for À la Carta Wings/Boneless packages, or is multi-sauce selection out of scope for this pass (keeping existing descriptive text only, with the interactive picker and thermometer limited to single-sauce AYCE/Express dishes)? → A: In scope — extend the picker with a bounded multi-select mode (max 2 or 3, per dish) reused for À la Carta packages, alongside the existing single-select mode for AYCE/Express; the feature description explicitly names À la Carta as an in-scope surface for Part B. **(Superseded 2026-07-17 — multi-select is now being removed entirely; see Revision above.)**
- Q: Where should the heat thermometer graphic be mounted — once per "Alitas & Boneless" category section (shown a single time regardless of how many dishes are in the section), or once per dish/picker instance? → A: Once per "Alitas & Boneless" category section (section-level), not once per dish — the reference graphic is a single legend-style asset depicting the full 12-sauce spectrum, so a per-dish mount would repeat the identical static image redundantly; this also follows the existing category-level `note` precedent already used elsewhere in the menu data model. *(Still valid — unaffected by the revision.)*

### Session 2026-07-17 (Revision) — `maxSelections` disposition

- Q: The `maxSelections` integer column (`menu_item_option_groups`) + its `MenuSaucePicker.vue` prop + its projection in `menu-queries.ts`/`types/menu.ts` was added specifically to support the now-removed Wings/Boneless À la Carta multi-select (values 2/3). The pre-existing Ramen XL/Vaso Sumo option groups (feature 027, staying) were also updated in `df3a13c` to explicitly set `maxSelections: 1` on every group. After removing the Wings/Boneless rows, every remaining seeded group has `maxSelections` = 1 (the column's own default) — the column/prop would have zero remaining consumers exercising any non-default value. Should this infrastructure be kept as harmless, already-tested, reusable scaffolding for a plausible future multi-select need (Article I reusability), or dropped entirely, reverting `menu_item_option_groups`/`MenuSaucePicker.vue`/`menu-queries.ts`/`types/menu.ts` to their pre-`df3a13c` shape? → **A: Drop it entirely.** Article X (KISS) is explicit that "an abstraction layer MUST NOT be created for anticipated future use — abstract only when a concrete second use case already exists in the codebase." After this revision, there is no concrete second use case exercising `maxSelections > 1` anywhere in the codebase — its sole reason for existing is removed alongside the Wings/Boneless rows. Keeping a column/prop whose only observable behavior across every remaining consumer is "always equals the default" is speculative scaffolding, not reuse. If a genuine second multi-select need arises later, reintroducing it is the same trivial additive migration + additive prop it was this time — there is no meaningful cost to dropping it now and re-adding it if/when a real second consumer appears.
