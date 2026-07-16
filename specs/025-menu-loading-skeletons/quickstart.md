# Quickstart: Menu Loading Skeletons

**Feature**: 025-menu-loading-skeletons

## What this feature does

Adds skeleton loading placeholders to `/menu`: while the menu's data fetch is in flight (switching
type/modality, or a slow first load), diners see pill-shaped chip placeholders and card-shaped
dish placeholders — matching the exact chip count and approximate card layout of the view they're
about to see — instead of stale or blank content. The animation respects
`prefers-reduced-motion`.

## Local verification steps

1. `pnpm dev` and open `/menu`.
2. Throttle the network (browser devtools → Network → Slow 3G) and reload `/menu`. Confirm a
   skeleton (chip placeholders + card placeholders) appears immediately, before real content.
3. With throttling still on, switch the primary selection (AYCE → Express → Bebidas → Kids) and
   the AYCE modality (All You Can Eat → Carta). For each switch, confirm:
   - The chip skeleton row shows the exact number of chips that view will really have (8 for AYCE
     buffet, 11 for AYCE carta, 8 for Express, 6 for Bebidas, no chip row for Kids).
   - The dish/drink card area shows a fixed grid of placeholder cards.
   - No stale content from the previous selection is visible during the gap.
4. Enable "reduce motion" in OS/browser settings (macOS: System Settings → Accessibility → Display
   → Reduce Motion; or emulate via devtools → Rendering → `prefers-reduced-motion: reduce`). Repeat
   step 3 and confirm the skeleton shapes still appear but do not pulse/animate.
5. Turn off network throttling; disable it and reload/switch normally — confirm the skeleton still
   appears (briefly) and does not cause any visible flash of empty content when replaced by real
   content.
6. Trigger the existing "menu unavailable" state (e.g., by temporarily breaking the DB connection
   locally, or by reviewing the existing `menu.unavailable` test in `tests/`) and confirm the
   skeleton is never shown at the same time as that message — the error/unavailable branch always
   wins.

## Running the new tests

```bash
pnpm vitest run app/components/ui/UiSkeleton.spec.ts
pnpm vitest run app/features/menu/components/MenuChipSkeleton.spec.ts
pnpm vitest run app/features/menu/components/MenuDishCardSkeleton.spec.ts
pnpm vitest run app/features/menu/components/MenuSkeleton.spec.ts
```

## Running Storybook

```bash
pnpm storybook
```

Navigate to `UI/Skeleton`, `Menu/MenuChipSkeleton`, `Menu/MenuDishCardSkeleton`, and
`Menu/MenuSkeleton` in the sidebar. Each should have a Default (animated) story, a reduced-motion
(static) story, and a Responsive story per Article VII.

## Quality gates before merge

```bash
pnpm biome check .
pnpm vue-tsc --noEmit
pnpm vitest run
```
