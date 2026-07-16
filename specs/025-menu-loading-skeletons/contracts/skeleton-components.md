# Component Contract: Menu Loading Skeletons

**Feature**: 025-menu-loading-skeletons
**Date**: 2026-07-15

No API/server contract changes — this is a UI-only feature. This document is the component props
contract for the new skeleton components (see `data-model.md` for full rationale).

---

## `UiSkeleton.vue` (`app/components/ui/UiSkeleton.vue`)

```ts
interface UiSkeletonProps {
  shape?: 'rect' | 'pill' | 'circle'   // default: 'rect'
}
```

- **Renders**: one `<div aria-hidden="true">` styled as a placeholder box.
- **Animation**: `animate-pulse motion-reduce:animate-none` (Tailwind, no JS).
- **Sizing**: consumer-controlled via `class` passthrough (no width/height props).
- **Accessibility**: `aria-hidden="true"` — the placeholder itself carries no information; the
  loading state MUST be otherwise conveyed to assistive tech by an ancestor (see `MenuSkeleton`
  contract below).

---

## `MenuChipSkeleton.vue` (`app/features/menu/components/MenuChipSkeleton.vue`)

```ts
// No props.
```

- **Renders**: one pill-shaped `UiSkeleton` sized to match `UiChip`'s dimensions/border.
- **Used by**: `MenuSkeleton.vue`, one instance per curated-set entry.

---

## `MenuDishCardSkeleton.vue` (`app/features/menu/components/MenuDishCardSkeleton.vue`)

```ts
// No props.
```

- **Renders**: one card-shaped shell (matching `MenuDishCard.vue`'s outer classes) containing an
  image-area `UiSkeleton`, a title-line `UiSkeleton`, and a description-line `UiSkeleton`.
- **Used by**: `MenuSkeleton.vue`, fixed count of 6 instances.

---

## `MenuSkeleton.vue` (`app/features/menu/components/MenuSkeleton.vue`)

```ts
import type { AyceModality, PrimarySelection } from '@/features/menu/menu-sets'

interface MenuSkeletonProps {
  selection: PrimarySelection
  modality: AyceModality
}
```

- **Renders**:
  - A chip-row skeleton (`flex flex-wrap gap-2`) with `getCuratedSet(selection, modality).length`
    `MenuChipSkeleton` instances — omitted entirely when `selection === 'kids'`.
  - A dish-card-grid skeleton (`grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3`) with a fixed
    6 `MenuDishCardSkeleton` instances.
- **Accessibility**: the root element carries `role="status"` and `aria-live="polite"` with a
  visually-hidden (`sr-only`) label (e.g. "Cargando menú…" / "Loading menu…") so assistive
  technology is informed that content is loading, even though the visual placeholders themselves
  are `aria-hidden`.
- **Consumed by**: `app/pages/menu.vue`, replacing the `MenuShell` branch while
  `status.value === 'pending'`.
- **Contract guarantees** (verified by Vitest):
  - Chip skeleton count exactly equals `getCuratedSet(selection, modality).length` for every
    `(selection, modality)` combination that exists today (AYCE·buffet=8, AYCE·carta=11,
    Express=8, Bebidas=6, Kids=0/no row).
  - Dish-card skeleton count is always 6, regardless of `selection`/`modality`.
  - Under `prefers-reduced-motion: reduce` (simulated via `matchMedia` mock in tests / a
    `motion-reduce` class assertion), no element carries an active pulsing animation class.

---

## `app/pages/menu.vue` (modified, not new)

No prop contract change (it is a page, not a reusable component). Behavioral contract addition:

- Reads `status` from the existing `useAsyncData` call (in addition to `data`/`error`, already
  read today).
- Adds one new template branch: `v-else-if="status === 'pending'"` renders
  `<MenuSkeleton :selection="activeSelection" :modality="activeModality" />`, inserted between the
  existing `error || isUnavailable` branch and the existing `data` branch, so error/unavailable
  always take precedence over a stale pending indicator.
- No other branch, prop, or data flow on this page changes.
