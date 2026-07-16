# Data Model: Menu Image Refresh & Express Branding

**Feature**: `024-menu-image-refresh-express-branding`
**Date**: 2026-07-15

## No schema/migration changes

No table, column, or type changes. This feature only writes new *values* into existing,
already-nullable columns (`menu_items.file_name`) via a seed update, and swaps *static asset
references* in frontend code. No Drizzle migration is required.

---

## Entity: MenuItem (existing — `menuItems` table, `server/db/schema.ts`)

Only the single "All You Can Eat Kids" row (`categoryId` → `kids`) is affected.

| Field | Type | Before | After | Notes |
|-------|------|--------|-------|-------|
| `fileName` | `text` (nullable, DB column `file_name`) | `null` | `'menu/kids/all_you_can_eat_kids.webp'` | New Vercel Blob pathname; set in `server/db/seeds/kidsMenu.ts`, applied via reseed. |

No other field on this row (or any other Kids row) changes. `name*`, `description*`, `price`,
`includedInAyce`, `displayOrder`, etc. are untouched — matches spec.md FR-003.

**Source photos → composite mapping** (traceability only, not persisted):

| Source photo | Role in composite |
|---|---|
| `assets/source/KIDS BURGER_B.webp` | Kids burger panel |
| `assets/source/DSC02525 copia.webp` | Sushi roll panel |
| `assets/source/SEB08252 copia.webp` | Chicken tenders + fries panel |

Output: `assets/output/all_you_can_eat_kids.webp` (repo-local, pre-upload staging) →
uploaded to Vercel Blob at `menu/kids/all_you_can_eat_kids.webp` (see research.md R1–R3).

---

## Entity: Branch (existing — `branches` table, unchanged)

No changes to the `branches` table or its `type` column (`'ayce' | 'express'`). This feature
only changes which **static image asset** the frontend marker-rendering code selects based on
the value already present in `type` — a presentation-layer decision, not a data-model change.

| Marker `color` (derived from `branch.type`) | Logo asset before | Logo asset after |
|---|---|---|
| `orange` (`ayce`) | `/brand/sumo-vertical.svg` | `/brand/sumo-vertical.svg` (unchanged) |
| `blue` (`express`) | `/brand/sumo-vertical.svg` | new Express vertical asset (see below) |

---

## New static assets (not database entities)

| Asset | Location | Source | Purpose |
|---|---|---|---|
| Kids AYCE collage | Vercel Blob: `menu/kids/all_you_can_eat_kids.webp` | Composited from 3 source photos | Menu item image (US1) |
| Sitewide watermark tile | `public/patterns/sumo-watermark.webp` | `assets/source/Fondo webp.webp`, re-exported at pre-baked low opacity | Layout-level background texture (US2) |
| Express vertical logo | `public/brand/sumo-express-vertical.{svg,webp}` | `assets/source/Logo .webp`, converted/optimized, used unmodified (Article VII) | Express map marker branding (US3) |
| Express horizontal logo (retained, NOT shipped this feature) | `specs/024-menu-image-refresh-express-branding/assets/source/Logo 2.webp` | client-provided | Reserved for a future marker-popup feature (see research.md R5) — out of scope here |

## Configuration / token changes (not data, but tracked for completeness)

| File | Change |
|---|---|
| `tailwind.config.ts` | Add `backgroundImage.watermark` token pointing at `/patterns/sumo-watermark.webp`, alongside the existing `hero-pop` token. |
| `app/layouts/default.vue` | Root wrapper gains the `watermark` background layer alongside its existing `bg-bg`. |
| `app/composables/maps/adapters/mapboxAdapter.ts` | `makeMarkerElement(color)` branches the `img.src` by `color` (`'blue'` → Express asset, `'orange'` → unchanged). |
| `scripts/replace-blob-images.ts` | Add `--src <path>` CLI flag (default preserves current hardcoded path) so this feature's asset folder can be targeted without a second script. |
| `server/db/seeds/kidsMenu.ts` | Set `fileName` for the "All You Can Eat Kids" item. |
