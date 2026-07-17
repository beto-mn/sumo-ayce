# Feature Specification: Promo Flip-to-Terms + Garantía Badge + Ramen XL DB-Driven Options + Kids AYCE Background + Vaso Sumo Flavor Migration

**Feature Branch**: `feat/027-promo-flip-menu-card-tweaks`
**Created**: 2026-07-16
**Status**: Draft
**Input**: User description: "Consolidated client-requested visual/UX changes. PART A — promotions carousel click-to-flip revealing WordPress-sourced Terms & Conditions (`tyc_es`/`tyc_en`) on the back face, bilingual-completeness required. PART B — Garantía Sumo star badge on menu dish cards is too small, needs a more prominent size without overlapping the top-right pink badge sticker. PART C (REVISED 2026-07-16 — the original hero-image approach is SCRAPPED) — 'Ramen XL' renders as a completely NORMAL dish card (no showcase visual, no per-dish display-variant swap), but gains a DB-driven 'build your own' options selector (noodle base, protein, extra-protein add-on) that the client can edit (add/remove/rename choices, change prices) without a code deploy — modeled on the genuinely DB-driven `sauces`/`MenuSaucePicker.vue` precedent, NOT on the (newly-discovered) fully-hardcoded Vaso Sumo flavor list. PART D — 'All You Can Eat Kids' card needs an orange→blue gradient background behind its image panel, scoped to that one dish only, via its own minimal per-dish flag now that Part C no longer provides a shared discriminator to piggyback on. PART E (NEW 2026-07-16) — Vaso Sumo's 6 flavors, currently hardcoded via i18n keys in `MenuDrinkSection.vue` (not DB-backed at all), migrate onto the SAME generic DB-driven option-groups system built for Part C, so flavors become DB-editable with no code change, mirroring the Ramen build-your-own mechanism exactly."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Reveal promotion terms with a click (Priority: P1)

A visitor browsing promotions — either on the homepage's promotions rail or on the dedicated `/promotions` page — taps or clicks a promo card and sees it flip over to reveal the promotion's Terms & Conditions on the back, instead of having to guess what restrictions apply or leave the page to find out. Clicking again (or clicking elsewhere) returns the card to its front face.

**Why this priority**: This is the client's most explicit, top-billed ask in this consolidated request, and it applies to the single most-viewed dynamic content surface on the site (promotions, shown on both the homepage and its own page).

**Independent Test**: Open the homepage and `/promotions`, click a promo card on each, and verify the card visually flips to a back face containing terms text, and flips back on a second interaction, on both surfaces.

**Acceptance Scenarios**:

1. **Given** a promotion with Terms & Conditions content available in **both** Spanish and English, **When** a visitor clicks/taps anywhere on that promo card, **Then** the card animates a flip and its back face displays the promotion's Terms & Conditions text in the visitor's active language.
2. **Given** a promo card is currently showing its back face, **When** the visitor clicks/taps the card again, **Then** it flips back to show the original front face (image, badge, type pill).
3. **Given** a visitor has set a system/browser preference for reduced motion, **When** they click a promo card, **Then** the front/back swap happens as an instant or cross-fade transition instead of a 3D flip, with no other behavior change.
4. **Given** a visitor is dragging/swiping the carousel to move between promos, **When** the pointer movement is a drag rather than a discrete click/tap, **Then** the carousel navigates as it does today and no card flip is triggered.
5. **Given** a visitor flips a card and then swipes to a different promo, **When** the new promo becomes the active slide, **Then** the previously flipped card resets to its front face (a visitor never returns to a slide still stuck showing its back face from a prior visit to it).
6. **Given** the existing prev/next arrows and dot navigation, **When** a visitor uses them to move between promos, **Then** they continue to work exactly as they do today, unaffected by the flip feature.
7. **Given** a promotion has Terms & Conditions content in only ONE language (e.g. Spanish filled in, English left empty, or vice versa), **When** a visitor clicks/taps that promo card, **Then** the card does NOT flip — bilingual completeness (both languages present) is required before the flip affordance is offered at all, not per-locale fallback.

---

### User Story 2 - Notice the Garantía Sumo quality badge (Priority: P2)

A diner scanning the menu grid sees a dish carrying SUMO's "Garantía Sumo" quality-guarantee star badge and can actually notice it at a glance — today it's too small to register, undermining a trust signal the client specifically wants surfaced. The larger badge still reads cleanly and never overlaps the item's own promotional sticker in the opposite corner.

**Why this priority**: A quick, low-risk, high-visibility fix directly addressing explicit client feedback ("no se nota") on an existing, already-shipped element — no new data or asset dependency.

**Independent Test**: Open `/menu`, find any dish flagged as a Garantía Sumo item, and visually confirm the star badge is clearly more prominent than before and does not overlap the dish's own pink badge sticker, at mobile, tablet, and desktop widths.

**Acceptance Scenarios**:

1. **Given** a dish is flagged as a Garantía Sumo item, **When** its card renders at any breakpoint (mobile/tablet/desktop), **Then** the star badge is visibly larger and more noticeable than the current size while remaining fully legible.
2. **Given** a Garantía Sumo dish that also carries its own promotional sticker (e.g., "Nuevo"), **When** the card renders at any breakpoint, **Then** the two badges do not visually overlap or collide.
3. **Given** a Garantía Sumo dish with no image, **When** its card renders, **Then** the star badge still displays correctly in its designated position.

---

### User Story 3 - Build your own Ramen XL, editable from the DB (Priority: P3) — REVISED 2026-07-16

*(Previous version of this story described a large "hero image" showcase visual. That approach is scrapped — see Assumptions. This is the current, approved version.)*

A diner browsing the à la carte "Ramen" category on `/menu` sees "Ramen XL" rendered exactly like every other dish card (image, name, description, price — no special layout), but with an additional "build your own" section beneath the description: pick a noodle-base flavor, pick a protein, and optionally add extra protein for +$29 — matching the client's reference composition. Separately, the restaurant's staff can add, remove, rename, or reprice any of these noodle-base flavors, proteins, or the extra-protein add-on directly in the database, with zero code changes or deploys, exactly the way they already can with Wings/Boneless sauce choices today.

**Why this priority**: Meaningful upsell/informational value on a specific dish, but depends on a small new reusable schema, so it naturally follows the two lower-effort fixes above.

**Independent Test**: Open `/menu`, switch to the à la carte modality, open the "Ramen" category, and verify "Ramen XL" renders as a normal-sized dish card that additionally shows a "Base de fideo" picker, a "Proteína" picker, and an "Añade extra proteína" picker beneath its description. Separately, add a new choice to one of these groups directly in the database and confirm it appears on the page without any code change or redeploy.

**Acceptance Scenarios**:

1. **Given** the à la carte "Ramen" category contains "Ramen XL", **When** the category renders, **Then** "Ramen XL" appears as a normal-sized dish card, identical in layout/size to every other dish card in that category.
2. **Given** the "Ramen XL" card, **When** it renders, **Then** it shows a "Base de fideo" (noodle base) picker with (at least) the choices Pollo, Camarón cremoso, Camarón picante, and Vegetales picantes, allowing exactly one selection.
3. **Given** the "Ramen XL" card, **When** it renders, **Then** it shows a "Proteína" picker with (at least) the choices Res, Camarón, and Pollo, allowing exactly one selection.
4. **Given** the "Ramen XL" card, **When** it renders, **Then** it shows an "Añade extra proteína" picker communicating a +$29 option to add extra protein.
5. **Given** a staff member adds a new noodle-base or protein choice directly in the database (no code change), **When** the page is next loaded, **Then** the new choice appears in the corresponding picker automatically.
6. **Given** a staff member removes or renames an existing choice in the database, **When** the page is next loaded, **Then** the picker reflects the change automatically, with no code change.
7. **Given** a future new ramen dish is added to the same "Ramen" category that is NOT "Ramen XL" and has no options configured for it, **When** the category renders, **Then** that new dish appears as a normal dish card with no options section — the options mechanism only appears for dishes that actually have option groups configured, regardless of category.

---

### User Story 4 - Notice the Kids All-You-Can-Eat option (Priority: P4)

A parent browsing the Kids menu view sees the "All You Can Eat Kids" card stand out from the individual combo items around it, thanks to a colorful background behind its photo, instead of blending into the plain white/cream panel it sits in today.

**Why this priority**: Purely cosmetic polish on a single existing card; low risk and does not depend on any new asset or external content.

**Independent Test**: Open `/menu`, switch to the Kids view, and verify the "All You Can Eat Kids" card's image panel has a distinct colored background (not the plain white/cream default), while every other Kids item's card is unchanged.

**Acceptance Scenarios**:

1. **Given** the diner is viewing the Kids menu, **When** the "All You Can Eat Kids" card renders, **Then** its image panel shows a colored background (an orange-to-blue gradient) instead of the plain default.
2. **Given** any other Kids-view item (the $149 combos), **When** their cards render, **Then** their image panels are visually unchanged — only "All You Can Eat Kids" gets the new background.
3. **Given** the colored background is applied, **When** the card's dish name/description/price text is read, **Then** text legibility is unaffected (the background sits behind the image panel only).

---

### User Story 5 - Vaso Sumo flavors become DB-editable (Priority: P5) — NEW 2026-07-16

A diner viewing the "Vaso Sumo" drink in the Bebidas view sees the exact same flavor picker they see today (Ron, Tequila, Vodka, Whisky, New Mix, Jack Daniel's) — no visible change from the diner's perspective. Behind the scenes, though, that flavor list now comes from the database instead of being hardcoded in the app's translation files, so staff can add a new flavor, retire one, or fix a typo in a name without waiting for a code change.

**Why this priority**: Purely a data-source migration with no new user-facing behavior (the picker UI and its options look identical to today) — valuable for future editability, but the lowest urgency since nothing is visibly broken today.

**Independent Test**: Open `/menu`, switch to Bebidas, find "Vaso Sumo", and confirm the exact same 6 flavor choices render as they do today. Separately, add/remove/rename a flavor directly in the database and confirm the picker reflects the change with no code change or redeploy.

**Acceptance Scenarios**:

1. **Given** a diner opens the Vaso Sumo flavor picker, **When** it renders, **Then** it shows the same 6 flavors (Ron, Tequila, Vodka, Whisky, New Mix, Jack Daniel's) in the same style as today, with no visible regression.
2. **Given** a staff member adds a new flavor directly in the database (no code change), **When** the page is next loaded, **Then** the new flavor appears in the Vaso Sumo picker automatically.
3. **Given** a staff member removes or renames an existing flavor in the database, **When** the page is next loaded, **Then** the picker reflects the change automatically, with no code change.
4. **Given** the migration is complete, **When** the codebase is inspected, **Then** no i18n keys or hardcoded flavor lists remain describing Vaso Sumo's flavors — the database is the single source of truth, exactly like Wings/Boneless sauces already are.

---

### Edge Cases

- What happens when a promotion has no Terms & Conditions content configured (upstream field not yet filled in, WordPress rollout still in progress per Assumptions below, or the payload otherwise omits it)? The card does not offer the flip interaction for that promo — it behaves exactly as it does today, with no empty/blank back face ever shown.
- What happens when a promotion has Terms & Conditions content in only ONE of the two languages (e.g. `tyc_es` filled in, `tyc_en` left empty, or vice versa)? The card does NOT offer the flip interaction — the requirement is bilingual completeness (both `tyc_es` AND `tyc_en` non-empty), not "flip if at least one language is present with a same-language fallback." A partially-filled promo is treated identically to a promo with no terms at all.
- What happens when a visitor rapid-clicks a promo card? Each click toggles the flip state; the animation does not stack or glitch on repeated fast input.
- What happens when the visitor is on a touch device where "hover" doesn't apply? The flip triggers on tap (click), not hover, on every device type.
- What happens if the Garantía Sumo badge and the pink promotional sticker would collide at very narrow widths? The badge's larger size is confirmed clear of the sticker at every documented breakpoint (mobile/tablet/desktop); if a true collision risk exists at some width, the badge position/size is adjusted so it never overlaps, at the cost of some flexibility in exact size.
- What happens if a dish's option group in the database ends up with zero active choices (e.g. all choices deactivated)? That group does not render at all for that dish — an empty picker is never shown; this is a data-hygiene concern for whoever edits the database, not a code error.
- What happens if a dish has NO option groups configured at all (true for every dish except Ramen XL and Vaso Sumo today)? No options section renders for that dish — the mechanism is entirely opt-in per dish, not a change to every dish's layout.
- What happens to "Ramen XL" if it is ever removed from the menu, or if a second "XL"-style ramen item is added? Removal is out of scope here (data change, not a code change); giving a second dish its own option groups is a data change using the same mechanism, not a code change.
- What happens to the abandoned "hero image" artifacts from the original (now-scrapped) version of Part C? See Assumptions — they are superseded and removed, not adapted.

## Requirements *(mandatory)*

### Functional Requirements

**Promotion card flip-to-terms (Part A)**

- **FR-001**: The system MUST let a visitor reveal a promotion's Terms & Conditions by clicking/tapping its card, on both the homepage promotions rail and the `/promotions` page (the same shared component).
- **FR-002**: The reveal MUST be presented as a flip animation (card rotates to show a back face), except when the visitor has a reduced-motion preference set, in which case the front/back swap MUST use a non-motion (instant or cross-fade) transition instead.
- **FR-003**: Clicking/tapping a flipped card again MUST return it to its front face.
- **FR-004**: Navigating away from a flipped promo's slide (via drag/swipe, arrows, or dot navigation) MUST reset that card back to its front face.
- **FR-005**: The flip interaction MUST NOT trigger from a drag/swipe gesture used to navigate the carousel — only a discrete click/tap triggers it.
- **FR-006**: The existing prev/next arrow navigation and dot navigation MUST continue to function exactly as before, unaffected by the flip feature.
- **FR-007**: Terms & Conditions text MUST be sourced from WordPress, in the visitor's active language (Spanish/English), consistent with how every other promotion field is bilingual.
- **FR-008**: A promotion MUST offer the flip interaction ONLY when Terms & Conditions content exists in **both** Spanish and English. If either language's content is missing or empty — including the case where only one language has been filled in — the flip interaction MUST NOT be offered (no empty/partial back face is ever shown, and no single-locale content is ever shown with a same-language fallback standing in for the other). This is a stricter bilingual-completeness rule, not "flip whenever at least one language is present."

**Garantía Sumo badge size (Part B)**

- **FR-009**: The Garantía Sumo badge on a featured dish's card MUST render at a visibly larger, more prominent size than its current size, at every breakpoint (mobile/tablet/desktop).
- **FR-010**: The enlarged badge MUST NOT visually overlap the dish card's own promotional sticker badge, at any breakpoint.
- **FR-011**: The badge MUST continue to render correctly on featured dishes that have no image.

**Ramen XL build-your-own options, DB-driven (Part C — REVISED)**

- **FR-012**: "Ramen XL" MUST render as a normal, standard-sized dish card — identical in layout to every other dish card — with no showcase/hero visual treatment of any kind.
- **FR-013**: The system MUST provide a reusable, generic mechanism for attaching one or more "option groups" (each with its own set of choices) to ANY menu item, not specifically to Ramen XL — the mechanism itself must not be Ramen-specific.
- **FR-014**: For "Ramen XL" specifically, the system MUST expose exactly the groups described in the client's reference composition: a "Base de fideo" (noodle base) single-select group, a "Proteína" single-select group, and an "Añade extra proteína" add-on offered at +$29.
- **FR-015**: Every option group's label, every choice's label, and every choice's price MUST be editable directly in the database — adding, removing, renaming, or repricing a choice (or an entire group) MUST require no code change and no redeploy.
- **FR-016**: The options mechanism MUST be driven entirely by real database rows — no hardcoded enum of noodle-base flavors, protein choices, or their prices may exist anywhere in application code or seed-only constants without a backing database table.
- **FR-017**: A dish with no option groups configured (i.e., every dish except Ramen XL and Vaso Sumo, at least initially) MUST render exactly as it does today, with no options section appearing.

**Kids All-You-Can-Eat background (Part D)**

- **FR-018**: The "All You Can Eat Kids" card's image panel MUST render with a colored (orange-to-blue gradient) background, distinguishing it from the plain default background every other menu card uses.
- **FR-019**: No other Kids-view item's card MUST be visually affected by this change.
- **FR-020**: The system MUST use a minimal, dedicated per-dish targeting mechanism to flag "All You Can Eat Kids" for this background treatment — this MUST NOT depend on, or be coupled to, the Ramen XL option-groups mechanism from Part C; the two are unrelated concerns and must not share a data column or code path.
- **FR-021**: The colored background MUST NOT reduce the legibility of the card's existing text content (dish name, description, price).

**Vaso Sumo flavor migration (Part E — NEW)**

- **FR-022**: "Vaso Sumo"'s 6 flavor choices (Ron, Tequila, Vodka, Whisky, New Mix, Jack Daniel's) MUST be migrated onto the SAME generic option-groups mechanism introduced in Part C (FR-013), rather than remaining hardcoded in application translation files.
- **FR-023**: The diner-facing Vaso Sumo flavor picker's appearance and behavior MUST be unchanged from today — this is a data-source migration, not a UX change.
- **FR-024**: After the migration, no hardcoded flavor list or flavor-specific translation keys MUST remain in the codebase for Vaso Sumo — the database becomes the single source of truth, matching how Wings/Boneless sauces already work.
- **FR-025**: Adding, removing, or renaming a Vaso Sumo flavor directly in the database MUST require no code change and no redeploy, identical to FR-015's requirement for Ramen's options.

### Key Entities *(include if feature involves data)*

- **Promotion**: Existing WordPress-sourced entity (badge, title, color, type, active flag, images). Gains a new bilingual Terms & Conditions text field (WordPress field keys assumed `tyc_es`/`tyc_en`, pending final confirmation from a live payload), sourced from WordPress; the flip affordance requires BOTH languages to be present and non-empty — a promo with only one language filled in is treated the same as a promo with neither (see Assumptions).
- **Menu Item Option Group**: A new, generic, reusable entity — a named group of choices (e.g. "Base de fideo", "Proteína", "Añade extra proteína", "Sabor") attached to a specific menu item (dish or drink). Any menu item may have zero or more option groups; groups are ordered for display and can be deactivated without deletion.
- **Menu Item Option Choice**: A new, generic, reusable entity belonging to exactly one option group — a single selectable choice (e.g. "Pollo", "Camarón cremoso", "Sí, extra proteína") carrying its own display label and an associated price addition (which may be zero). Choices are ordered for display and can be deactivated without deletion.
- **Menu Item — "Ramen XL"**: The existing à la carte ramen dish. Gains a "Base de fideo" option group, a "Proteína" option group, and an "Añade extra proteína" option group (via the two new entities above). No longer has any per-dish showcase/display-variant designation — that concept is removed entirely (see Assumptions).
- **Menu Item — "All You Can Eat Kids"**: The existing Kids buffet dish. Gains its own minimal, dedicated "highlighted background" flag, unrelated to and independent of the option-groups mechanism used by Ramen XL/Vaso Sumo.
- **Menu Item — "Vaso Sumo"**: The existing drink item. Gains a "Sabor" (flavor) option group with 6 choices (Ron, Tequila, Vodka, Whisky, New Mix, Jack Daniel's), replacing its previous hardcoded i18n-based flavor list.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Once a promotion's Terms & Conditions content exists in WordPress in BOTH languages, 100% of clicks/taps on that promo's card (on both the homepage and `/promotions`) result in the card flipping to show that content, and a second click/tap returns it to the front, on both surfaces. A promo with only one language populated shows 0% flip affordance (treated the same as a promo with neither language populated).
- **SC-002**: 0% of carousel drag/swipe gestures unintentionally trigger a card flip, across a spot-check of both touch and pointer interaction.
- **SC-003**: In a visual spot-check across all breakpoints, 100% of featured (Garantía Sumo) dishes show a clearly more noticeable star badge with zero visual overlap against their own promotional sticker.
- **SC-004**: "Ramen XL" renders as a normal-sized dish card in 100% of à la carte "Ramen" category views, additionally showing its 3 option groups; adding/removing/renaming a choice or group in the database is reflected on the next page load with 0 code changes.
- **SC-005**: "All You Can Eat Kids" is the only Kids-view card showing a colored background, in 100% of Kids-view page loads; every other Kids item's card is pixel-for-pixel unchanged from before this feature.
- **SC-006**: The Vaso Sumo flavor picker shows the same 6 flavors, in the same style, in 100% of page loads after the migration, with 0 remaining hardcoded flavor-specific code or translation keys.
- **SC-007**: None of the five parts causes a measurable drop in page performance (Lighthouse score) versus the pre-feature baseline on the affected pages (home, promotions, menu).

## Assumptions

- **Coordination status (Part A, downgraded from blocking to in-progress)**: As of the most recent client update, the WordPress-side Terms & Conditions ACF field is being actively added to the `promociones` CPT edit screen right now — no longer a hypothetical future dependency. A screenshot of the live WP admin edit form (`assets/source/wp-admin-tyc-fields.png`) shows two new textarea fields labeled "TyC (ES)" and "TyC (EN)", positioned directly after the existing "Badge (ES)"/"Badge (EN)" fields, both currently empty and — unlike the required Badge fields (marked with a red asterisk) — optional. Following this project's established ACF naming convention (`badge_es`/`badge_en`, `imagen_desktop`/`imagen_tablet`/`imagen_movil`, all snake_case with `_es`/`_en` suffixes), the field keys are assumed to be **`tyc_es`** and **`tyc_en`** pending confirmation from a live API payload. Per `docs/business/features.md` §9, WordPress admin/ACF configuration remains an out-of-repo action performed by the client, not by this codebase — but the risk profile has moved from "field doesn't exist, timeline unknown" to "field is being wired in now, exact key/rollout timing not yet 100% confirmed." The defensive parsing/rendering requirement is unchanged and, if anything, more important now: the code MUST still treat any promo with an absent, empty, or only-partially-filled TyC pair as having no flip affordance (FR-008) — both as a graceful fallback if the assumed key names turn out to be wrong, and as the correct steady-state behavior for promotions the client simply hasn't written terms for yet.
- **Kids background color decision**: The client offered two options — a purple background, or an orange-to-blue gradient as fallback. Purple is not an existing approved design token; orange and blue both are, and an orange-to-blue gradient is already used elsewhere in the product (the promotions carousel's "all types" navigation styling). This spec adopts the orange-to-blue gradient as the resolved choice, per the client's own stated fallback preference, rather than introducing a new token for a single card.
- **Badge size increase**: "More prominent" is resolved as a clearly perceptible size increase (not a marginal one) sufficient to address the client's "no se nota" feedback, with the constraint that it must never overlap the existing top-right sticker — the exact size value is an implementation decision for the planning phase.
- **Flip-back-on-navigate behavior**: Resetting a flipped card to its front face when the carousel moves to a different slide is adopted as the reasonable default so visitors never get "stuck" on an old back face when browsing further promos.
- **No bilingual content concern for Parts B/D**: Parts B and D are purely visual/decorative changes and carry no new copy requiring translation. Part C and Part E DO carry new bilingual content (option-group labels and choice names), consistent with every other menu content field already being bilingual.
- **Existing WordPress/Neon separation is preserved**: Terms & Conditions content continues to flow through the existing WordPress promotions fetch path; no new content source is introduced. The new option-groups mechanism (Parts C/E) is entirely Neon-side, unrelated to WordPress.
- **Part C is a complete re-scope, not an addition to the original hero-image approach (2026-07-16)**: The original version of this spec described "Ramen XL" rendering as a large hero/showcase image via a per-dish `display_variant` discriminator and a new `MenuDishHero` component, delivered through Vercel Blob. The client has scrapped that direction entirely in favor of the DB-driven options approach described above. Any artifacts already produced against the old approach (a `MenuDishHero` component and its tests/stories, and a database migration adding a `display_variant` column) are **superseded and must be removed**, not adapted — they solve a problem ("which dish gets a special visual treatment") that no longer exists in this feature. The database migration slot they occupied is free to be reused for this feature's actual schema changes, since neither artifact was ever committed or applied to a shared environment.
- **Part D no longer shares a discriminator with Part C**: The original spec used one shared nullable column (`display_variant: 'hero' | 'highlight' | null`) so Parts C and D could reuse the same mechanism. Since Part C's "hero" concept no longer exists, Part D gets its own minimal, dedicated flag instead (a boolean, analogous to the existing `featured` boolean already on menu items) — simpler than keeping a single-value enum column alive for one dish.
- **Extra-protein add-on modeled as a priced choice, not a special "add-on" concept**: To keep the option-groups schema uniform (every group is a single-select group with N choices, no separate "toggle"/"add-on" entity type), "Añade extra proteína" is modeled as its own option group with two choices: a default $0 "no" choice and a "yes" choice carrying the +$29 price — reusing the exact same generic mechanism and, on the frontend, the exact same reusable single-select picker component already used for sauces, with zero new UI code required.
- **Vaso Sumo migration is invisible to diners**: Part E is scoped as a pure data-source swap. The diner-facing flavor list, its order, and its visual presentation are expected to stay pixel-identical — only the underlying source of truth (database vs. hardcoded i18n) changes.
- **Sauces remain untouched**: The existing `sauces` table and `MenuSaucePicker.vue`'s use for Wings/Boneless sauce selection are unrelated to this feature and are not modified — they are cited only as the precedent validating "a real, DB-driven, staff-editable catalog is achievable and already proven in this codebase," and the new option-groups mechanism is a parallel, dish-attachable system (not a rename or extension of the `sauces` table itself, since sauces are a single global catalog shared across many dishes, while option groups are scoped to one specific menu item each).
