# Implementation Plan: Menu Image Refresh & Express Branding

**Branch**: `feat/024-menu-image-refresh-express-branding` | **Date**: 2026-07-15 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `specs/024-menu-image-refresh-express-branding/spec.md`
**Source assets**: [assets/source/](./assets/source/) (6 client-provided files, copied from the
client's WeTransfer export; the Downloads path is not durable, this folder is now the source of
truth)

## Summary

A consolidated, three-part client asset-driven visual refresh, all three scope decisions
already confirmed by the client (no new [NEEDS CLARIFICATION] markers in spec.md):

1. **Kids AYCE dish photo collage**: the "All You Can Eat Kids" menu item ($179 buffet,
   currently has no image) gets a single composite/collage image combining 3 client-provided
   dish photos (kids burger, sushi roll, chicken tenders + fries), uploaded to Vercel Blob via
   the existing one-off ops script pattern.
2. **Sitewide watermark background**: a client-provided pop-art pattern is applied as a
   low-opacity (~10–15%) tiled background texture at the shared layout level, visible across
   every page, coexisting with (not replacing) the existing per-section backgrounds like the
   homepage's `hero-pop` treatment.
3. **Sumo Express branch map branding**: Express-type branch pins on the branch-finder map get
   the actual Sumo Express vertical logo lockup (replacing the generic SUMO mark used today for
   both types); AYCE pins and the global header/footer logo are untouched.

Technical approach: no new feature folder, no DB migration, no new routes. Edit an existing
seed file + reseed + run the (lightly extended) upload script; add one Tailwind token + one
layout edit; edit one function inside the existing Mapbox adapter. Every changed testable unit
gains/keeps a co-located Vitest spec; Storybook coverage is extended where an existing story
already demonstrates the affected component.

## Technical Context

**Language/Version**: TypeScript (strict mode), Vue 3 (Composition API only), Nuxt 4
**Primary Dependencies**: Nuxt 4, Tailwind CSS + global design-token stylesheet
(`app/assets/css/`), Drizzle ORM (Neon Postgres, seed script only — no runtime schema change),
`@vercel/blob` (existing `scripts/replace-blob-images.ts`), `mapbox-gl` (behind the existing
provider-agnostic `MapView`/adapter pattern — see `docs/business/maps-strategy.md`), Vitest +
`@vue/test-utils` (happy-dom), Storybook 10, Biome.
**Storage**: Neon Postgres via Drizzle — only a seed-data value changes
(`menu_items.file_name` for one row); no migration. Vercel Blob — one new object uploaded
(`menu/kids/all_you_can_eat_kids.webp`).
**Testing**: Vitest + `@vue/test-utils`; co-located `Component.ts ↔ Component.spec.ts` /
`Component.vue ↔ Component.spec.ts`; centralized `mapbox-gl` mock in `tests/mocks/mapbox.ts`
(Gate IV.6 — no ad-hoc per-file mocks); `vue-tsc --noEmit`.
**Target Platform**: Web (Vercel), mobile-first; affects existing pages only (`/`, `/menu`,
`/sucursales` or `/branches`, and every other page via the shared layout).
**Project Type**: Web application (Nuxt 4 single repo, frontend + server routes co-located).
**Performance Goals**: Lighthouse 90+ preserved on all affected pages (Article V) after adding
the collage image, the watermark tile, and the Express logo asset — all three MUST be
optimized/compressed web-format images, none render-blocking.
**Constraints**: No new project dependency for image compositing (Article X — one-off tooling
only, not added to `package.json`); no schema/migration change; global `SiteLogo.vue` and
`menu-sets.ts` explicitly untouched (out of scope per spec.md); Express logo used unmodified
once introduced (Article VII); tokens only for any new CSS (no inline hex); watermark must not
regress text/content contrast (Article VII / a11y baseline).
**Scale/Scope**: 1 seed file edit + reseed, 1 upload script CLI-flag addition, 1 Tailwind token
+ 1 layout file edit, 1 adapter function edit + 1 new co-located spec file, 3 new/converted
static assets (collage, watermark tile, Express vertical logo). No new pages, no new feature
folder, no new server routes.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Phase -1 Gates (derived from `.specify/memory/constitution.md` v3.1.0)

| # | Gate (Article) | Requirement | Status |
|---|----------------|-------------|--------|
| G1 | **I — Code Organization & Reusability** | No new feature folder needed — this touches existing seed data (`server/db/seeds/`), an existing ops script (`scripts/`), the shared layout (`app/layouts/`), and one existing adapter file (`app/composables/maps/adapters/`). No cross-feature imports introduced. | PASS (design) |
| G2 | **I / VII — Storybook coverage (NON-NEGOTIABLE)** | No brand-new Vue component is introduced. Existing stories that already demonstrate the affected surfaces (e.g. `MapView.stories.ts`, `BranchCard.stories.ts`) get an Express-pin/branding variant added where it clarifies the change; the layout-level watermark is demonstrated via a Responsive story/viewport on an existing page-level story if one exists, rather than a new component being created solely to host a story. | PASS (planned) |
| G3 | **II — TypeScript & Framework** | TS strict, no `any`; Composition API only; no new shared types required (`MenuItem`/`Branch`/`MapMarker` shapes are unchanged). | PASS |
| G4 | **IV — Testing** | New co-located `mapboxAdapter.spec.ts` covers the Express-vs-AYCE marker branching (research.md R6). Seed-file change is data-only (no new server logic requiring a fresh test beyond existing seed idempotency coverage, if any). No test depends on another test's state; `mapbox-gl` stays centrally mocked. | PASS (planned) |
| G5 | **V — Performance** | No new routes; no `routeRules` change needed. All 3 new/converted image assets MUST be optimized and lazy-loaded per existing conventions; Lighthouse 90+ verified post-implementation on `/`, `/menu`, and the branches page (SC-005). No Drizzle/Neon import added to `app/**`. | PASS (verify post-impl) |
| G6 | **VI — Security** | No new API endpoint, no new input surface, no auth change. N/A. | PASS |
| G7 | **VII — UX Consistency & Component Documentation** | Global header/footer `SiteLogo.vue` MUST NOT be touched (spec.md FR-011, out-of-scope note) — verified in review/diff. The new Express logo asset, once introduced, is used **unmodified** (no recolor/crop/distort) per the logo-integrity rule, same discipline already applied to the primary SUMO mark. Mobile-first / responsive discipline applies to the watermark (must not break any breakpoint). | PASS (design; enforce in review) |
| G8 | **VIII — Clean Code Discipline** | `mapboxAdapter.ts`'s `makeMarkerElement` stays a small, single-purpose function after the branch-color conditional is added (no 30-line-limit risk from a one-line `img.src` branch). No dead code, no commented-out code, no bare `console.log`. Tokens only for the new Tailwind `watermark` entry (no inline hex). | PASS (enforce in review) |
| G9 | **IX — Quality Gates** | Biome lint + format pass; `vue-tsc --noEmit` passes; unit tests pass; Conventional Commits; hooks never bypassed. | PASS (enforced by hooks/CI) |
| G10 | **X — KISS** | No image-compositing library added to `package.json` for the one-time collage asset (research.md R2 — ephemeral tool use only). No new Mapbox `Popup`/info-window abstraction built to host the horizontal Express logo — explicitly deferred (research.md R5) since no acceptance scenario in spec.md requires it. | PASS (design) |
| G11 | **XI — Absolute Imports via Alias** | Any new imports (e.g. in a new `mapboxAdapter.spec.ts`) use `@/` aliases; no new `../../..` chains beyond same-directory relative imports already used in that folder. | PASS |
| G12 | **Scope guardrail (project rule)** | `menu-sets.ts` and any other menu category/chip logic are untouched (explicitly out of scope per spec.md, unrelated to feature 023). `SiteLogo.vue` is untouched. No DB migration. No new pages/routes. | PASS (design) |

**Result**: No constitutional violations identified. Complexity Tracking table not required.

## Project Structure

### Documentation (this feature)

```text
specs/024-menu-image-refresh-express-branding/
├── plan.md              # This file
├── spec.md              # Feature spec
├── research.md          # Phase 0 output
├── data-model.md         # Phase 1 output
├── quickstart.md         # Phase 1 output (verification steps)
├── checklists/
│   └── requirements.md   # Spec quality checklist
├── assets/
│   ├── source/            # 6 client-provided source files (durable copy)
│   └── output/             # Produced composite deliverable(s) pre-upload
└── tasks.md               # Phase 2 output (/speckit.tasks — NOT created here)
```

### Source Code (repository root — files touched)

```text
server/db/seeds/
└── kidsMenu.ts                              # set fileName for "All You Can Eat Kids"

scripts/
└── replace-blob-images.ts                   # add --src CLI flag (no new script)

tailwind.config.ts                           # add backgroundImage.watermark token

app/layouts/
└── default.vue                              # root wrapper gains watermark bg layer

app/composables/maps/adapters/
├── mapboxAdapter.ts                         # makeMarkerElement(color) branches img.src
└── mapboxAdapter.spec.ts                    # NEW — co-located test for the branching

public/
├── patterns/sumo-watermark.webp             # NEW — pre-baked low-opacity tiled asset
└── brand/sumo-express-vertical.{svg,webp}   # NEW — converted/optimized Express logo

# Existing stories extended (no new components):
app/components/ui/MapView.stories.ts         # optional Express-pin fixture variant
app/features/branches/components/BranchCard.stories.ts  # optional Express variant check
```

**Structure Decision**: Web application (Nuxt 4 single repo). This feature is intentionally
surgical: it edits one seed file, extends one existing ops script with a flag, adds one design
token + one layout edit, and edits one function inside an existing adapter (plus its new
co-located spec). No new feature folder, no new pages, no new server routes, no DB migration —
consistent with Article I (no new vertical slice needed) and Article X (KISS).

## Complexity Tracking

> No Constitution Check violations. Table intentionally empty.
