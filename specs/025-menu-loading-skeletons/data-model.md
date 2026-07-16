# Data Model: Menu Loading Skeletons

**Feature**: 025-menu-loading-skeletons
**Date**: 2026-07-15

This feature introduces no database schema, no API contract, and no new persisted or shared
(`/types/`) TypeScript types — it is a presentation-only UI state derived from the existing
`useAsyncData` call in `app/pages/menu.vue`. This document describes the component prop contracts
instead of a data schema.

---

## 1. Derived UI state (`app/pages/menu.vue`)

No new state is stored; an existing value already returned by `useAsyncData` is read for the first
time.

```ts
// Existing call, unchanged:
const { data, error, status } = await useAsyncData(
  () => `menu-${apiType.value}-${activeModality.value}`,
  () => $fetch<FullMenuResult>('/api/v1/menu', { params: { ... } }),
  { getCachedData: ... }
)

// New derived value (page-level only):
const isLoading = computed(() => status.value === 'pending')
```

| State | Source | Meaning |
|---|---|---|
| `isLoading` | `status.value === 'pending'` | The active fetch (initial load or a re-fetch triggered by a type/modality switch) has not resolved yet. |
| `error` | existing | The fetch threw (network/server failure). |
| `isUnavailable` | existing | The fetch succeeded but returned the degraded empty-menu shape (`DatabaseUnavailableError` path from feature 021). |
| `data` | existing | The fetch succeeded with real content. |

**Render precedence** (top to bottom, first match wins — extends the existing two-branch gate to
four):

1. `error || isUnavailable` → existing "menu temporarily unavailable" message (unchanged).
2. `isLoading` → **NEW**: `<MenuSkeleton :selection="activeSelection" :modality="activeModality" />`
3. `data` → existing `<MenuShell ... />` (unchanged).
4. (fallback, unreachable in practice) → nothing renders, same as today.

`activeSelection` and `activeModality` are already computed in `menu.vue` from `route.query`
independently of the fetch — no new computation is needed to feed them to `MenuSkeleton`.

---

## 2. Component prop contracts (new components)

### `UiSkeleton.vue` (`app/components/ui/`)

Generic placeholder box/pill primitive. No menu knowledge.

```ts
interface UiSkeletonProps {
  /** Visual shape of the placeholder. */
  shape?: 'rect' | 'pill' | 'circle'   // default: 'rect'
  /** Optional explicit width/height as Tailwind-compatible class overrides
   *  are passed via `class`/`style` from the consumer (no width/height props —
   *  keeps the primitive simple; sizing is the composer's responsibility). */
}
```

- Renders a single `<div>` with `bg-bg2`/ink-adjacent background, the shape's corresponding
  rounding token (`rounded-pop-sm` for `rect`, `rounded-pop-full` for `pill`/`circle`), and
  `animate-pulse motion-reduce:animate-none`.
- Accepts `class` passthrough (Vue's automatic attribute inheritance) so composers size it exactly
  like the real element it stands in for (e.g. `class="h-10 w-24"` for a chip-sized pill).
- No slots, no text content — purely decorative (`aria-hidden="true"`).

### `MenuChipSkeleton.vue` (`app/features/menu/components/`)

```ts
// No props — a single placeholder chip, sized to match UiChip's pill dimensions.
```

- Wraps one `<UiSkeleton shape="pill" class="h-10 w-24 border-pop border-ink" />`-equivalent
  markup matching `UiChip`'s padding/border/radius so the skeleton row's dimensions equal the real
  chip row's dimensions (no layout shift per SC-004).

### `MenuDishCardSkeleton.vue` (`app/features/menu/components/`)

```ts
// No props — a single placeholder card matching MenuDishCard's layout.
```

- Wraps the same outer card shell classes as `MenuDishCard.vue` (`rounded-pop border-pop border-ink
  bg-panel p-4 shadow-pop-sm`) containing three `UiSkeleton` instances: an image-area rect (`h-44`,
  matching the real image box height), a title-line rect, and a description-line rect (two lines).

### `MenuSkeleton.vue` (`app/features/menu/components/`) — orchestrator

```ts
interface MenuSkeletonProps {
  selection: PrimarySelection   // from app/features/menu/menu-sets.ts
  modality: AyceModality        // from app/features/menu/menu-sets.ts
}
```

- Computes `chipCount = getCuratedSet(selection, modality).length` and
  `showChips = selection !== 'kids'` (mirrors `useMenuFilters`'s `showCategoryChips`).
- Renders, when `showChips` is true, a `flex flex-wrap gap-2` row of `chipCount` `MenuChipSkeleton`
  instances (matching `MenuCategoryChips.vue`'s wrapper markup exactly, so widths/gaps line up).
- Always renders a fixed grid of 6 `MenuDishCardSkeleton` instances using the same
  `grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3` classes as `MenuDishGrid.vue`.
- No fetch, no i18n, no children beyond the two skeleton components above — purely presentational,
  same spirit as `MenuShell.vue` but for the loading state.

---

## 3. State transition summary

```text
route/selection change or first load
        │
        ▼
useAsyncData status: 'idle' → 'pending' ───────► MenuSkeleton (selection/modality-aware)
        │                                                │
        ▼ (resolves)                                     │ (fetch fails)
status: 'success', data populated                        ▼
        │                                          status: 'error' → error branch (unchanged)
        ▼                                          (or data resolves to the empty/unavailable
MenuShell renders real content                       shape → isUnavailable branch, unchanged)
```

No other transitions are introduced. Switching selection again while `status === 'pending'`
re-triggers the same `useAsyncData` key computation Nuxt already handles (existing behavior,
unchanged by this feature) — the newest requested key's `MenuSkeleton` (reflecting the newest
`activeSelection`/`activeModality`) is what's on screen, satisfying FR-012.
