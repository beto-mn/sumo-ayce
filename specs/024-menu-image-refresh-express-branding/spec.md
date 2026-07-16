# Feature Specification: Menu Image Refresh & Express Branding

**Feature Branch**: `feat/024-menu-image-refresh-express-branding`
**Created**: 2026-07-15
**Status**: Draft
**Input**: User description: "Consolidated client asset-driven visual refresh for SUMO AYCE (domain: SUMO AYCE restaurant chain, Mercado Pop design direction): PART A — combine 3 client-provided dish photos into one collage image for the 'All You Can Eat Kids' menu item. PART B — apply a client-provided pop-art watermark pattern as a low-opacity (~10-15%) sitewide background texture across all pages. PART C — add actual Sumo Express branding to Express-type branch markers on the branch-finder map, scoped to the map only, not the global site logo. All three PART-level scope decisions (collage vs. single photo, sitewide vs. scoped watermark, map-only vs. global logo) were confirmed by the client in a prior clarification round-trip and are treated as settled facts in this spec."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Kids AYCE Dish Photo Collage (Priority: P1)

A diner browsing the menu opens the **Kids** view and looks at the "All You Can Eat Kids" ($179 buffet) item, which today shows no image at all. The diner sees a single photo that visually communicates the variety of the kids buffet — a burger, a sushi roll, and chicken tenders with fries — composited into one collage image, so they understand at a glance what kinds of dishes are included without having to read the full description.

**Why this priority**: The Kids AYCE item is the only priced item in the Kids view with zero image today (a visible content gap on a page that otherwise shows a photo per dish); it directly affects a parent's ability to evaluate the offer before ordering.

**Independent Test**: Open `/menu`, switch to the Kids standalone view, and verify the "All You Can Eat Kids" card renders one image containing recognizable elements of all 3 source dishes (burger, sushi roll, chicken tenders + fries) rather than a blank/placeholder state.

**Acceptance Scenarios**:

1. **Given** the diner is on the Kids menu view, **When** the page renders the "All You Can Eat Kids" item, **Then** it displays a single composite image that visibly incorporates all 3 provided dish photos (not just one of them, not a generic placeholder).
2. **Given** the composite image has been produced and published, **When** any menu query reads the Kids category, **Then** the response shape and every other Kids item are unaffected — only the "All You Can Eat Kids" item gains an image reference.
3. **Given** the composite image fails to load for any reason (network, missing asset), **When** the card renders, **Then** it degrades the same way any other menu item with a broken image would (no layout break, no console-visible crash).

---

### User Story 2 - Sitewide Watermark Background (Priority: P2)

A visitor browses any page of the site — home, menu, promotions, branches, contact — and perceives a subtle, low-opacity repeating pop-art pattern textured into the background across the whole visit, reinforcing the brand's playful identity without competing with the page's actual content, headlines, or existing decorative backgrounds (like the homepage hero backdrop).

**Why this priority**: Brand-reinforcement texture that touches every page; valuable but not a functional blocker the way the Kids photo gap or the Express map identity are — a user can still fully use the site if this ships slightly later.

**Independent Test**: Visit at least one page of each type (home, menu, promotions, branches, contact) and verify a consistent low-opacity watermark pattern is present in the background in each case, without any text becoming harder to read than it is today.

**Acceptance Scenarios**:

1. **Given** a visitor loads any page on the site, **When** the page renders, **Then** the pop-art watermark pattern is visible at a subtle, low intensity somewhere in that page's background.
2. **Given** a visitor loads the homepage specifically, **When** the page renders, **Then** the watermark and the existing homepage hero backdrop coexist without one visually canceling, muddying, or fighting the other.
3. **Given** a visitor with a vision impairment or on a low-contrast display, **When** they read body text or headlines on any page, **Then** the perceived text-to-background contrast is not noticeably worse than it is today.

---

### User Story 3 - Sumo Express Branch Map Branding (Priority: P3)

A visitor opens the branch finder map looking for a nearby SUMO location. Branches are already color-coded (orange = AYCE, blue = Express), but every pin currently shows the same generic SUMO mark regardless of type. After this change, Express-type branch pins carry the actual Sumo Express brand mark, so a visitor scanning the map can tell an Express location apart by its real branding, not only by pin color.

**Why this priority**: A refinement of an already-functional map (color-coding already distinguishes the two types); valuable brand accuracy but the map is usable today without it.

**Independent Test**: Open `/sucursales`, load the map with at least one Express-type and one AYCE-type branch visible, and verify only the Express pins show the Express brand mark while AYCE pins are visually unchanged.

**Acceptance Scenarios**:

1. **Given** the branch map has both AYCE and Express branches, **When** the map renders its pins, **Then** every Express-type pin shows the Sumo Express brand mark and every AYCE-type pin is unchanged from its current appearance.
2. **Given** a visitor interacts with an Express-type pin (e.g., clicks/taps it), **When** the interaction resolves, **Then** the Express branding is legible at the size/context it is shown in (not cropped, not illegibly small).
3. **Given** the global site header/footer logo, **When** any page is inspected, **Then** it remains the standard, unmodified SUMO mark — this feature does not touch it.

---

### Edge Cases

- What happens when the composite Kids image is regenerated later with a different crop/arrangement? The existing blob pathname (once assigned) is reused so no other part of the system needs to change.
- What happens on a page or component whose own local background is already opaque (e.g., a white card panel)? The watermark is expected to show through the page's shared background, not necessarily through every nested opaque surface — this is not a regression, it is how a page-level texture composes with the rest of the design.
- What happens if a diner has `prefers-reduced-motion` set? The watermark is a static (non-animated) texture, so no interaction with reduced-motion is expected either way.
- What happens if the Express logo asset fails to load on the map (slow network, blocked request)? The pin degrades to the current generic mark rather than breaking the map render.
- What happens when an Express branch and an AYCE branch are shown side by side on the map at the same time? Only the Express pins change in appearance; a visitor should never see a mix of old/new Express pin styles simultaneously.

## Requirements *(mandatory)*

### Functional Requirements

**Kids AYCE dish photo collage**

- **FR-001**: The system MUST show a single image for the "All You Can Eat Kids" menu item where none exists today.
- **FR-002**: That image MUST be a composite/collage combining all 3 client-provided source dish photos (kids burger, sushi roll, chicken tenders + fries) — not a single photo pick and not a generic stand-in.
- **FR-003**: Publishing the new image MUST NOT change the response shape, category grouping, ordering, or any other field of the Kids menu data — only the image reference for this one item is added.
- **FR-004**: The new image MUST be delivered as a single optimized web-format asset consistent with how every other menu item image is served.

**Sitewide watermark background**

- **FR-005**: The system MUST apply the client-provided pop-art watermark pattern as a background texture on every page of the site (home, menu, promotions, branches, contact), regardless of location type (AYCE or Express) shown on that page.
- **FR-006**: The watermark MUST render at a low, subtle opacity (approximately 10–15%) — it must read as a background texture, never as a competing visual element.
- **FR-007**: The watermark MUST NOT reduce the readability (contrast) of any existing text or content below the site's current accessibility baseline, on any page.
- **FR-008**: The watermark MUST coexist with every existing page-level background treatment (the homepage hero backdrop, the base cream background, the site marquee) without visually conflicting with or doubling up on them.

**Sumo Express branch map branding**

- **FR-009**: The branch-finder map MUST show the actual Sumo Express brand mark on every Express-type branch pin.
- **FR-010**: AYCE-type branch pins MUST remain visually unchanged by this feature.
- **FR-011**: This feature MUST NOT alter the global header/footer site logo component or any other logo usage outside the branch-finder map.
- **FR-012**: The Express brand mark shown on the map MUST remain legible (not cropped or illegibly small) at the size it is displayed.

### Key Entities *(include if feature involves data)*

- **Kids Menu Item ("All You Can Eat Kids")**: The existing $179 kids buffet menu entry that currently has no image; gains a reference to the new composite image asset. No other attributes change.
- **Sitewide Background Texture**: A new, page-independent decorative asset (the watermark pattern) applied globally; not tied to any single page's content model.
- **Branch (map marker)**: Existing branch record already carrying a `type` (`ayce` | `express`); the marker's visual representation for `express`-type branches gains real brand imagery. No data-model changes to the branch record itself.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of visits to the Kids menu view show a photographic image (the new collage) for the "All You Can Eat Kids" item, where 0% did before.
- **SC-002**: The watermark pattern is present and visible at low intensity on 100% of the site's page types (home, menu, promotions, branches, contact) in a single site visit.
- **SC-003**: Text-to-background contrast on every page remains at or above the site's current accessibility baseline after the watermark ships (no measurable regression).
- **SC-004**: On the branch map, a visitor can correctly identify a branch's type (AYCE vs. Express) using the pin's brand mark alone, without relying only on pin color, in a visual spot-check across all Express branches.
- **SC-005**: None of the three changes causes a measurable drop in page performance (Lighthouse score) versus the pre-feature baseline on the affected pages.

## Assumptions

- The composite Kids image is a one-time creative asset produced from the 3 provided source photos; it is not user-editable in WordPress and does not require a new content-management workflow.
- The exact visual arrangement of the 3 photos within the collage (grid, overlapping frames, sticker-style crop, etc.) is a creative/implementation decision within the Mercado Pop visual language, not a business decision requiring separate sign-off — the client's requirement is that all 3 dishes are represented in one image, not the precise layout.
- The sitewide watermark is a purely decorative, non-interactive background layer; it carries no clickable behavior and does not need bilingual (ES/EN) treatment since it is an image, not copy.
- "Sitewide" includes every existing page type regardless of AYCE/Express context, per the client's explicit confirmation — this is intentional even though the watermark's copy reads "Sumo Express."
- The Express brand mark on the map replaces only the pin's brand imagery; the pin's existing color-coding (blue background for Express) is retained as-is.
- No changes are required to `menu-sets.ts` or any other menu category/chip logic — this feature only adds an image reference to one existing item.
- Existing branch data (`type` field) already reliably distinguishes AYCE from Express branches; no new data or schema is needed to know which pins should carry Express branding.

## Clarifications

### Session 2026-07-15

- Q: Client-confirmed scope decisions (collage composition, sitewide watermark scope, map-only logo scope) — are these settled or open for re-litigation in this spec? → A: Settled via a prior clarification round-trip with the client; folded into the spec above as fixed requirements (FR-001–FR-012), not re-opened as questions.
