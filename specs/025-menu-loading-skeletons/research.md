# Research: Menu Loading Skeletons

**Feature**: 025-menu-loading-skeletons
**Date**: 2026-07-15

There were no `[NEEDS CLARIFICATION]` markers left in `spec.md` (the two judgment calls flagged by
the requester were resolved via existing codebase conventions — see below). This document records
those decisions and the technical research backing the plan.

---

## Decision 1 — Where does the new skeleton primitive live?

**Decision**: A generic `UiSkeleton.vue` primitive goes in `app/components/ui/`, alongside
`Button.vue` and `Chip.vue`. It renders a single pulsing/shimmering placeholder shape (rect or
pill, sized via props/slot) with built-in `prefers-reduced-motion` handling. The chip-shaped and
dish-card-shaped *compositions* that use it are menu-scoped, living in
`app/features/menu/components/` as `MenuChipSkeleton.vue` and `MenuDishCardSkeleton.vue`.

**Rationale**:
- Article I lists `app/components/ui/` as the home for "primitives reusable across features
  (Button, Input, Modal, Card)". A pulsing placeholder box is exactly that class of primitive —
  it has zero menu-specific knowledge (no dish/category concepts), so it satisfies the "reusable
  across features" bar even though only one feature consumes it today.
- Article X (KISS) says abstraction is justified "only when a concrete second use case already
  exists" — that bar applies to the *menu-specific shapes* (chip pill, dish card), not to the
  generic pulsing-box primitive itself. Building one small generic primitive is not
  over-engineering; duplicating the pulse animation + reduced-motion CSS inside two or three
  feature-local components WOULD violate Article I's DRY rule ("if the same markup pattern
  appears in 2+ places, it MUST be extracted into a reusable component").
- The menu-specific compositions (`MenuChipSkeleton`, `MenuDishCardSkeleton`) stay under
  `app/features/menu/components/` because their exact dimensions/layout mirror
  `MenuCategoryChips.vue`/`UiChip` and `MenuDishCard.vue` specifically — nothing else in the app
  has that shape today. If a second feature later needs a similarly-shaped card skeleton, that
  composition (not the primitive) is the thing to promote/generalize, per Article X.

**Alternatives considered**:
- *Everything in `app/components/ui/`* (a single generic `UiMenuSkeleton` in the shared library):
  rejected — bakes menu-specific layout knowledge (dish card anatomy) into the shared UI library,
  violating the "feature MUST NOT be spread across `app/components/`" rule in Article I.
- *Everything local to `app/features/menu/components/`* (no shared primitive at all): rejected —
  the pulse animation + reduced-motion handling would need to be duplicated across the chip and
  card skeleton components (2 places), which Article I's DRY rule explicitly forbids ("if the same
  markup pattern appears in 2 or more places, it MUST be extracted into a reusable component").

---

## Decision 2 — Where is the loading/pending state handled?

**Decision**: `app/pages/menu.vue` reads the `status`/`pending` value already available from its
existing `useAsyncData` call and adds a loading branch alongside its existing `error`/
`isUnavailable`/`data` branches. `MenuShell.vue` is not touched at all — it keeps receiving only
`menuData`/`initialSelection`/`initialModality` exactly as it does today.

**Rationale**:
- `MenuShell.vue` is already a sizeable orchestrator: it owns `useMenuFilters`, computes
  `chipItems`, `drinkItems`, `activeFoodCategory`, `kidsSections`, and renders four different
  conditional branches (`MenuTypeToggle`/`MenuModalityToggle`, `MenuCategoryChips`,
  `MenuDrinkSection` vs `MenuDishGrid`, plus the scroll-to-top button). Threading a `pending` prop
  through it would force every one of those branches to grow a parallel "loading" version,
  multiplying the surface area of an already multi-part component — the opposite of Article VIII's
  push toward small, single-purpose components.
- `menu.vue` already gates between three states today (`error`, `isUnavailable`, `data` truthy) at
  the top of its template. Adding a fourth ("loading") at that same seam is the smallest possible
  change: one more sibling branch, no new props on any existing component, and `MenuShell.vue`
  remains exactly as presentational as it is described in the spec's ground truth.
- This also cleanly satisfies FR-003 (the skeleton must know the destination selection/modality
  before data arrives): `menu.vue` already computes `activeSelection`/`activeModality` from
  `route.query` independently of the fetch (see current `apiType`/`activeModality` computed
  properties) — that computation doesn't change, so the new `MenuSkeleton` component can receive
  the same `activeSelection`/`activeModality` values `MenuShell` would have received, with no
  extra plumbing.

**Alternatives considered**:
- *Pass a `pending` prop into `MenuShell.vue` and branch internally*: rejected — spreads the
  loading concern across an already-complex component and its four rendering branches, for no
  benefit over handling it one level up where the existing error/unavailable gating already lives.
- *A composable (`useMenuLoadingState`) shared between page and shell*: rejected as premature
  abstraction (Article X) — there is exactly one call site (`menu.vue`); a computed/ref inline in
  the page is sufficient and simpler.

---

## Decision 3 — How is the exact chip skeleton count determined?

**Decision**: The skeleton orchestrator calls the existing `getCuratedSet(selection, modality)`
from `app/features/menu/menu-sets.ts` — the same function `useMenuFilters` already uses to build
the real chip row — to get the exact ordered list of chip/drink-group keys for the destination
view, before the fetch resolves. It renders one `MenuChipSkeleton` per entry, or omits the chip row
entirely when `selection === 'kids'` (matching `KIDS_SET`/`showCategoryChips === false` behavior).

**Rationale**: `menu-sets.ts` is a pure, static, data-independent configuration (no DB round-trip)
— it is already the single source of truth for "which chips show for this selection" today.
Reusing it means the skeleton's chip count is not an approximation but an exact match to what will
render once data arrives, directly satisfying FR-004 and SC-004 (no layout shift on swap). This
avoids inventing a second source of truth for chip counts.

**Alternatives considered**:
- *A hardcoded generic chip count (e.g., always show 8 skeleton chips)*: rejected — would
  mismatch the real count for Express/Carta/Bebidas (8/11/6 respectively) and would need a special
  case to suppress chips for Kids anyway; reusing `getCuratedSet` is no more complex and is exact.

---

## Decision 4 — How is the dish/drink card skeleton count determined?

**Decision**: A fixed, reasonable placeholder count (6 cards, matching two full rows of the
existing `grid-cols-1 sm:grid-cols-2 md:grid-cols-3` dish grid layout at the widest breakpoint) is
used for the card-grid skeleton, regardless of destination category. This number is NOT sourced
from live data (impossible before the fetch resolves) and is documented as an approximation in the
spec's Edge Cases / Assumptions.

**Rationale**: Per-category dish counts vary a lot (from 1 to 13 per the counts documented in
`specs/021-menu-experience-overhaul/data-model.md` §4) and are only known after the fetch
resolves — there is no static config to source them from (unlike chips). A fixed count that fills
a believable couple of grid rows is the simplest option that satisfies "approximate the real
layout without predicting the exact count" (FR-006, spec Edge Cases). Six was chosen because it is
divisible by the grid's column counts at every breakpoint (1/2/3 columns), so the skeleton grid
never looks lopsided at any viewport width.

**Alternatives considered**:
- *Match the count of the previous category shown*: rejected — over-engineered for a placeholder
  whose whole point is to be replaced quickly; also wrong on first load (no "previous" category).
- *A random/varying count*: rejected — adds complexity and non-determinism to something that
  should be trivially testable (a fixed, snapshot-stable component).

---

## Decision 5 — Animation technique and `prefers-reduced-motion` handling

**Decision**: Use Tailwind's built-in `animate-pulse` utility for the default (motion-OK) state,
combined with the project's already-established `motion-reduce:animate-none` modifier (used
verbatim in `Marquee.vue`'s track) to disable the animation entirely under
`prefers-reduced-motion: reduce`. No custom keyframes or JS-based `matchMedia` listeners are
needed — `motion-reduce:*` is a Tailwind media-query variant that requires no runtime JS, matching
the existing SSR-safe pattern already in the codebase.

**Rationale**: `Marquee.vue` already establishes this exact pattern (`animate-marquee
motion-reduce:animate-none`) for a different animated element on the same site — reusing the
identical Tailwind mechanism keeps the reduced-motion approach consistent codebase-wide (Article
VII) and avoids introducing a second, divergent technique for the same accessibility requirement.
`animate-pulse` is a stock Tailwind utility already available (no new dependency), which also
satisfies Article X (no library added for something Tailwind already provides).

**Alternatives considered**:
- *Custom shimmer keyframe (a moving gradient sweep) instead of `animate-pulse`*: considered for a
  more "premium" shimmer look, but rejected for this first iteration — `animate-pulse` needs zero
  new CSS, is trivially disabled by `motion-reduce:animate-none`, and satisfies FR-009's "pulse/
  shimmer" requirement without adding a new keyframe definition to maintain. Can be revisited later
  without changing the component's public contract.
- *A JS `useReducedMotion()` composable toggling a class*: rejected — adds a runtime dependency
  and a hydration-mismatch risk (server doesn't know the client's media query) for something the
  CSS-only `motion-reduce:` variant already solves statically and correctly during SSR.

---

## Summary of resolved unknowns

| Unknown | Resolution |
|---|---|
| Skeleton primitive location | `app/components/ui/UiSkeleton.vue` (shared, generic) |
| Chip/card skeleton composition location | `app/features/menu/components/` (feature-scoped) |
| Loading-state ownership | `app/pages/menu.vue` (page-level branch); `MenuShell.vue` unchanged |
| Chip skeleton count | Exact, sourced from `menu-sets.ts::getCuratedSet` |
| Card skeleton count | Fixed at 6 (grid-friendly at all breakpoints) |
| Animation + reduced motion | Tailwind `animate-pulse` + `motion-reduce:animate-none` (matches `Marquee.vue`) |
