# Feature Specification: Menu Loading Skeletons

**Feature Branch**: `feat/025-menu-loading-skeletons`
**Created**: 2026-07-15
**Status**: Draft
**Input**: Feature 025 (`menu-loading-skeletons`, `sdd: true`) — the `/menu` page fetches its
data via `useAsyncData` keyed by the active type/modality; today the page only reads `data`/
`error` from that call and has no loading branch at all. Because the fetch key changes on every
type/modality switch, switching selection currently leaves the previous selection's chips and
dish cards visible with no visual feedback until the new fetch resolves — there is zero skeleton/
loading-placeholder pattern anywhere in the codebase today. This feature adds skeleton placeholders
for the category/drink-group chips and the dish cards, shown while the menu data fetch is in
flight (both on client-side navigation between type/modality selections and on a slow initial
load), animated with a pulse/shimmer treatment that respects `prefers-reduced-motion`.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Feedback while switching menu selection (Priority: P1)

A diner on `/menu` is browsing AYCE · All You Can Eat and taps Express (or Carta, or Bebidas, or
Kids). Today, nothing visibly changes until the new menu data has loaded — the previous chips and
dish cards stay on screen with no indication that a change is happening, which reads as an
unresponsive tap or a stuck page. Instead, the diner should immediately see a loading placeholder
in the shape of the chips and cards they're about to see, so the switch feels instant and alive
even before the new content is ready.

**Why this priority**: This is the exact interaction the client called out — switching selection
is the single most common action on `/menu`, and it's the one place where the current lack of
feedback is most noticeable. Without this, the rest of the feature has no primary use case.

**Independent Test**: On `/menu`, switch the primary selection (or modality) several times in a
row, including on a throttled connection. Confirm that each switch immediately shows a skeleton
placeholder (never the stale previous selection's content, never a blank gap) until the new data
arrives, at which point the skeleton is replaced by the real chips and cards.

**Acceptance Scenarios**:

1. **Given** a diner is viewing any menu selection, **When** they switch to a different primary
   selection (AYCE/Express/Bebidas/Kids) or AYCE modality (All You Can Eat/Carta), **Then** the
   chip row and the dish/drink card area immediately switch to skeleton placeholders instead of
   continuing to show the previous selection's content.
2. **Given** the skeleton is showing after a switch, **When** the new menu data finishes loading,
   **Then** the skeleton is replaced by the real chips and cards for the newly selected view.
3. **Given** the diner switches to Kids, **When** the skeleton renders, **Then** it reflects that
   Kids has no chip row (matching the real Kids view, which shows two sections with no category
   chips) rather than showing a generic chip skeleton that will never appear.
4. **Given** the diner switches selection again before the previous fetch has resolved, **When**
   the newest switch is registered, **Then** the skeleton for the most recently selected view is
   shown (no leftover skeleton or content from an abandoned prior selection).

---

### User Story 2 - Feedback on a slow first load (Priority: P2)

A diner opens `/menu` directly (e.g., from a shared link or a bookmark) on a slow mobile
connection. Instead of staring at a blank page while the menu loads, they should see the same
skeleton placeholders that appear during in-page switching, so the page always feels like it's
doing something from the first paint.

**Why this priority**: Slow first loads are less frequent than in-page switching but are the
diner's very first impression of the page; a blank screen on a slow connection reads as broken.
This depends on the same skeleton components built for User Story 1, so it naturally follows it.

**Independent Test**: Load `/menu` fresh (no cached data) on a throttled connection. Confirm a
skeleton placeholder appears immediately instead of a blank page, and is replaced by real content
once the initial fetch resolves.

**Acceptance Scenarios**:

1. **Given** a diner opens `/menu` fresh on a slow connection with no cached data, **When** the
   page starts loading, **Then** a skeleton placeholder for the default view (AYCE · All You Can
   Eat) appears immediately rather than a blank page.
2. **Given** the initial fetch resolves, **When** the real menu data arrives, **Then** the
   skeleton is replaced by the real chips and dish cards with no visible flash of empty content in
   between.

---

### User Story 3 - Motion-sensitive diners see a calm placeholder (Priority: P2)

A diner who has enabled "reduce motion" in their device or browser settings should not see a
pulsing or shimmering animation while the menu loads. They should still see the same skeleton
shapes (so they get the same "something is loading" feedback), just without the moving animation.

**Why this priority**: This is an accessibility requirement, not an optional nicety — the site
already honors `prefers-reduced-motion` for its other animated elements (e.g., the homepage
marquee), and skeletons are exactly the kind of animation that must be reduced. It rides on top of
User Stories 1 and 2 (there is nothing to make calm until the skeleton exists).

**Independent Test**: With the operating system/browser "reduce motion" setting enabled, trigger a
menu switch or a fresh slow load. Confirm the skeleton shapes still appear, but without a
pulsing/shimmering animation.

**Acceptance Scenarios**:

1. **Given** a diner has `prefers-reduced-motion: reduce` enabled, **When** a skeleton is shown
   (switch or initial load), **Then** the skeleton displays as a static, non-animated placeholder
   shape instead of pulsing or shimmering.
2. **Given** `prefers-reduced-motion` is NOT enabled, **When** a skeleton is shown, **Then** it
   animates with a pulse/shimmer treatment communicating that content is loading.

---

### Edge Cases

- **Fetch resolves near-instantly** (e.g., data already cached for that exact type/modality
  combination from a prior visit in the same session): the skeleton may flash briefly or not
  appear at all; no artificial minimum display time is required.
- **The fetch fails or the menu is temporarily unavailable** while a skeleton is showing: the
  skeleton MUST be replaced by the existing error/"menu temporarily unavailable" messaging, never
  left showing indefinitely and never shown at the same time as that messaging.
- **The diner switches selection again before the in-flight fetch resolves**: only the skeleton
  (and eventually the content) for the most recently requested selection is shown; no stale
  skeleton or content from an abandoned selection is displayed.
- **The target selection has no chip row** (Kids): the skeleton for that selection MUST omit the
  chip placeholder row, matching the real Kids view's layout (two sections, no chips).
- **The exact number of dishes in the destination category is unknown until data arrives**: the
  dish-card skeleton area MUST show a reasonable fixed number of placeholder cards in the same grid
  layout as real cards; it is not expected to predict the exact count, only to avoid a jarring size
  change when real cards replace it.
- **The number of chips for the destination selection IS predictable** (the curated chip/drink-
  group sets for each selection are a fixed, known list, independent of the menu data fetch):
  the chip skeleton row MUST render the exact chip count for the destination selection, not an
  arbitrary placeholder count.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The `/menu` page MUST track and expose whether its menu-data fetch is currently in
  flight (a "loading" state), distinct from its existing "error" and "loaded" states.
- **FR-002**: While the menu-data fetch is in flight — whether triggered by an initial page load or
  by the diner switching primary selection/modality — the page MUST show skeleton placeholders in
  place of the real chip row and dish/drink card area, and MUST NOT continue showing the previous
  selection's stale chips or cards.
- **FR-003**: The loading state MUST be determined before the skeleton is rendered so the skeleton
  can match the shape of the destination selection (e.g., no chip row for Kids) even though the
  destination's actual menu content has not arrived yet.
- **FR-004**: The chip-row skeleton MUST render one placeholder chip per chip that will appear for
  the destination selection/modality, using the same known, fixed curated category/drink-group
  count already used to build the real chip row for that selection — not an arbitrary or generic
  count.
- **FR-005**: The chip-row skeleton MUST be omitted entirely for selections that do not show a chip
  row today (Kids).
- **FR-006**: The dish/drink card area skeleton MUST render placeholder cards in the same grid
  layout as the real dish/drink cards, in a fixed, reasonable count (the exact per-category dish
  count is not known until data arrives).
- **FR-007**: Each placeholder chip MUST visually approximate the real chip's pill shape and
  dimensions; each placeholder card MUST visually approximate the real card's layout (an image
  area, a title-line placeholder, and one or more description-line placeholders).
- **FR-008**: All skeleton placeholders MUST use the site's existing pop-art design tokens (thick
  ink borders, rounded corners, panel background) so they read as part of the same design system
  rather than generic gray boxes.
- **FR-009**: Skeleton placeholders MUST animate with a pulse/shimmer treatment communicating that
  content is loading.
- **FR-010**: When the diner has `prefers-reduced-motion` enabled, the skeleton animation MUST be
  disabled or drastically simplified to a static, non-animated placeholder — consistent with how
  the site already handles reduced motion for its other animated elements (e.g., the homepage
  marquee).
- **FR-011**: If the fetch that a skeleton is standing in for fails, or the menu degrades to its
  "temporarily unavailable" state, the skeleton MUST be replaced by that existing error/
  unavailable messaging, never left on screen indefinitely and never shown simultaneously with
  that messaging.
- **FR-012**: If the diner switches selection again before an in-flight fetch resolves, only the
  skeleton (and subsequently the content) for the most recently requested selection MUST be shown.
- **FR-013**: This feature MUST NOT change the menu's data-fetching logic, query shape, or API
  contract — only how the loading gap is presented to the diner.
- **FR-014**: This feature MUST NOT change the loading behavior of any page other than `/menu`.
- **FR-015**: Every new component introduced by this feature MUST have a co-located Storybook story
  covering at least a default (animated) state, a reduced-motion (static) state, and mobile/desktop
  breakpoints, and MUST have automated test coverage confirming it renders the expected placeholder
  shapes/count and honors reduced motion.

### Key Entities *(include if feature involves data)*

- **Fetch/loading state**: A three-way state (loading, loaded, error/unavailable) derived from the
  existing menu-data fetch on `/menu`; drives which of skeleton, real content, or error messaging
  is shown. No new persisted data — purely a UI-facing derived state.
- **Skeleton placeholder**: A generic, reusable "loading box" shape (used to build both the chip
  and card placeholders) that supports an animated and a static (reduced-motion) presentation.
- **Chip placeholder set**: An ordered list of skeleton chips whose count matches the known,
  fixed curated chip/drink-group set for the destination selection/modality (empty for Kids).
- **Card placeholder set**: A fixed-size grid of skeleton cards standing in for the destination
  view's dish/drink cards, in the same grid layout as real cards.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of primary-selection or modality switches on `/menu` show a skeleton
  placeholder for the destination view instead of the previous selection's stale content, for the
  full duration of the fetch.
- **SC-002**: On a fresh, throttled-connection load of `/menu`, diners see loading feedback (a
  skeleton) instead of a blank page from the first moment the page starts rendering until real
  content arrives.
- **SC-003**: With `prefers-reduced-motion` enabled, 0 pulsing/shimmering animation is rendered on
  any skeleton placeholder — verified by automated tests.
- **SC-004**: Replacing a skeleton with real content produces no jarring layout shift: the chip
  skeleton count exactly matches the real chip count for every selection/modality, and the card
  skeleton grid uses the same layout as the real card grid.
- **SC-005**: `/menu` continues to meet the site's existing Lighthouse 90+ performance budget after
  this change (no regression from adding skeleton components).
- **SC-006**: Every new component introduced by this feature has a passing Storybook story and
  passing automated tests, with zero TypeScript or lint errors.

## Assumptions

- **Architecture — component placement**: A small, generic "skeleton box" primitive is added to
  the shared UI component library (alongside the existing `Button`/`Chip` primitives), since a
  pulsing placeholder shape with reduced-motion handling is generic enough to be reused by any
  future feature that needs loading feedback. The specific chip-shaped and dish-card-shaped
  skeleton compositions, however, are scoped to the menu feature's own component folder, since
  today only `/menu` needs those exact shapes; if a second feature later needs a similarly-shaped
  card skeleton, that composition can be promoted to the shared library at that time.
- **Architecture — where the loading state is handled**: The menu's main presentational shell
  component (which renders the chip row, dish grid, and drink/kids sections and does not itself
  fetch data) is left unchanged. The switch between skeleton, real content, and error/unavailable
  messaging is handled one level up, at the page, which already gates between error, unavailable,
  and loaded states today — adding a loading branch at that same level avoids threading a new
  loading flag through an already multi-part presentational component and its children.
- No artificial minimum display duration is enforced for the skeleton; a fetch that resolves
  before the skeleton would be visually perceptible may show it only briefly or not at all.
- The exact number of dishes in a destination category cannot be known before the fetch resolves;
  the card skeleton count is a fixed, reasonable approximation, not a prediction of the real count.
- The curated chip/drink-group sets per selection/modality already exist as a fixed, known
  configuration independent of the menu-data fetch, so the chip skeleton can match the exact real
  chip count rather than approximating it.
- Bilingual (ES/EN) text is not required on the skeleton itself, since it carries no readable copy
  (only shapes); no new i18n keys are introduced by this feature.
- This feature only affects the visual loading experience; it does not change what data is
  fetched, when it is fetched, or how it is cached.
