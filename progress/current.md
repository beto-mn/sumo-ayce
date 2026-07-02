# Current session

> Last closed: **011 — menu-page** (`done`, 2026-06-24).

## State
- Backlog: 001–013 → `done`. 014–015 → `pending`. 016 → `done`.
- DB: Neon PostgreSQL. Migrations 0008–0026 applied to production. Tables: `menu_categories`, `menu_items`, `sauces`, `drink_sub_groups`.
- Tests: 746 passed (99 test files).

## Feature closed: 011 — menu-page

**Branch**: `feat/018-menu-page`
**Route**: `/menu` (ISR 3600 s)

### What was delivered
- `server/api/v1/menu/index.get.ts` — GET /api/v1/menu with Zod validation, imageUrl resolution, DB error handling
- `server/api/v1/menu/featured.get.ts` — featured dishes for homepage
- `server/db/migrations/0026_add_drink_sub_group.sql` + schema + seed — `drink_sub_groups` table with 2x1 promo on all spirits
- `app/pages/menu.vue` — ISR page, useAsyncData, SEO meta
- `app/features/menu/components/` — MenuShell, MenuTypeToggle, MenuModalityToggle, MenuCategoryChips, MenuDishGrid, MenuDishCard, MenuSaucePicker, MenuDrinkSection
- `app/features/menu/composables/useMenuFilters.ts` — type/modality/category state with URL sync
- `app/features/menu/types.ts` — MenuType
- `public/menu/{ayce,ala-carta,express,drinks,desserts,kids}/` — all menu images

### Tests added
- `useMenuFilters.test.ts` — 9 tests (≥70% coverage)
- `MenuDishCard.spec.ts` — 6 tests
- `MenuSaucePicker.spec.ts`, `MenuTypeToggle.spec.ts`, `MenuModalityToggle.spec.ts`
- `MenuCategoryChips.spec.ts`, `MenuDishGrid.spec.ts`, `MenuDrinkSection.spec.ts`, `MenuShell.spec.ts`
- `menu-queries.test.ts` — expanded with locationScope unit tests + integration tests

### Storybook
- Stories for all new components (MenuDishCard, MenuSaucePicker, MenuTypeToggle, MenuModalityToggle, MenuShell)

## Feature closed: 018 — vercel-blob-images (2026-06-29)

**Branch**: `chore/018-vercel-blob-images`

### What was delivered
- `server/utils/env.ts` — `BLOB_BASE_URL` added to Zod schema (required, validated at startup)
- `server/api/v1/menu/resolveImageUrl.ts` — new module: `(filePath: string | null) => string | null`, prefixes `BLOB_BASE_URL`, strips trailing/leading slashes
- `server/api/v1/menu/index.get.ts` — uses new `resolveImageUrl`; dead folder-routing logic removed
- `server/utils/menu-queries.ts` — `resolveFeaturedImageUrl` removed, uses shared `resolveImageUrl`
- 7 seed files updated with full Blob-relative paths (`menu/<folder>/<file>.webp`)
- `public/menu/` directory deleted (162 images, no longer served from static)
- `.env.example` — `BLOB_BASE_URL` documented
- `docs/harness/vercel-blob.md` — upload workflow, path conventions, DB update procedure
- `scripts/upload-blob.mjs` — one-off script for bulk upload (delete after use)

### Tests added
- `tests/server/api/v1/menu/resolveImageUrl.test.ts` — 4 tests, 100% branch coverage
- `tests/server/utils/env.test.ts` — 4 tests covering startup validation

### Final state
- 101 test files, 754 tests passed
- `./init.sh` exits 0

## Feature spec authored: 020 — storybook-full-coverage (2026-06-29)

**Feature id**: 20  
**Feature name**: storybook-full-coverage  
**Status change**: `pending` → `spec_ready`  
**Spec folder**: `specs/020-storybook-full-coverage/`  
**Branch**: `chore/021-storybook-coverage`

### Skills invoked (in order)

1. `/speckit-git-feature` — created branch `chore/021-storybook-coverage`
2. `/speckit-specify` — generated `specs/020-storybook-full-coverage/spec.md`
3. `/speckit-plan` — generated `plan.md`, `research.md`, `data-model.md`, `quickstart.md`
4. `/speckit-tasks` — generated `tasks.md` (139 tasks)

### No [NEEDS CLARIFICATION] markers

All aspects of the feature were fully specified by the context. No clarification round was needed.

### Main Phase -1 gates (from plan.md)

- **Article I**: Story files must remain co-located with components in `app/features/<slice>/components/` or `app/components/ui/`. No cross-feature story imports.
- **Article VII**: Every story file must cover Default + applicable state variants (loading, empty, error, disabled) + both locale variants (ES, EN) + responsive behavior.
- **Article VIII**: No story file may exceed 200 lines. Overflow splits to `*.variants.stories.ts` sibling.
- **Article IX**: Biome lint + formatting must pass. `vue-tsc --noEmit` must pass. `storybook build` must succeed with zero errors and zero image 404s. Zero WCAG AA violations on Default stories.
- **Article X**: No shared story utilities unless used by 3+ story files.

### Key technical decisions (from research.md)

- Addons pinned to `^10.4.1` to match installed Storybook major
- Autodocs enabled globally via `docs: { autodocs: true }` in `main.ts` (not per-file tags)
- Viewport presets configured in `.storybook/preview.ts` (not `main.ts`)
- Broken images fixed with `https://placehold.co/400x300` (3 occurrences in menu story files)
- Locale variants use direct prop passing (no i18n plugin decorator required)
- ComponentDocs files use CSF3 `.stories.ts` with `tags: ['autodocs']`

## Feature closed: 020 — storybook-full-coverage (2026-07-01)

**Branch**: `chore/021-storybook-coverage` (+ fix branch `chore/021-storybook-coverage-fixes`, merged `--no-ff` to master)

### Closure flow
- First reviewer pass → **REJECTED** (7 missing ComponentDocs slice-index files falsely marked `[x]`; `ReservationForm.stories.ts` at 253 lines violating the 200-line Article VIII limit).
- Implementer fix (commit `74ad683`): created the 7 ComponentDocs indexes (`app/features/{branches,contact,homepage,menu,promotions,reservation}/*.stories.ts` + `app/components/ui/UIPrimitives.stories.ts`), split `ReservationForm.stories.ts` (253 → 113) with overflow in `ReservationForm.variants.stories.ts` (127).
- Second reviewer pass → **APPROVED**, marked `done` in `feature_list.json`, review set to APPROVED.
- Merged to master (merge commit) and status commit `fe5e177`.

### Final state
- `./init.sh` — Environment ready (all green). Tests 759/759, biome + typecheck OK, `storybook:build` exit 0, zero image 404s.
- No story file exceeds 200 lines.

## Pending
- Feature **018** — mark `done` in `feature_list.json` (owner action required, still `in_progress`)
- Feature **019 — homepage-brand-updates** (`pending`, `sdd: true`) — NEXT. Spec pending; awaiting client info (headline font, vertical logo asset, ES/EN text updates). Design decision in progress: AYCE headline as CSS-styled text (box-highlight) vs. image.
