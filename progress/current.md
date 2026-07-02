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

## Feature spec authored: 019 — homepage-brand-updates (2026-07-01)

**Feature id**: 19
**Feature name**: homepage-brand-updates
**Status change**: `pending` → `spec_ready`
**Spec folder**: `specs/019-homepage-brand-updates/`
**Branch**: `feat/019-homepage-brand-updates`

### Skills invoked (in order)

1. `/speckit-git-feature` — created branch `feat/019-homepage-brand-updates` (renamed from an accidental double-prefix; spec dir 019 already existed with client-brief.md + copy-audit.md)
2. `/speckit-specify` — generated `spec.md` (+ `checklists/requirements.md`), all copy transcribed verbatim from `client-brief.md`
3. `/speckit-plan` — generated `plan.md`, `research.md`, `data-model.md`, `contracts/i18n-keys.md`, `quickstart.md`; updated CLAUDE.md SPECKIT active-feature block
4. `/speckit-tasks` — generated `tasks.md` (23 atomic tasks across Setup / Foundational / US1–US3 / Polish)

### No [NEEDS CLARIFICATION] markers

All design + copy decisions were pre-confirmed with the client in `client-brief.md` (source
of truth): headline = CSS real text (Anton flat Variant A, no border/shadow); translate all
copy to EN; sumo.webp replaces hero-frame logo only; page titles apply to H1 + SEO; kicker +
site-wide tagline = "Buffet preparado al instante"; menu drinks label is i18n-only (align
seed, no migration). `/speckit-clarify` was correctly skipped.

### Main Phase -1 gates (from plan.md)

- **Article I**: homepage components stay feature-scoped; type-selector cards remain ONE
  component via re-mapped keys (no duplication).
- **Article II**: TS strict, Composition API only.
- **Article V**: `/` stays `isr: 3600`; no new route; Lighthouse 90+ preserved after adding
  the Anton font + webp; no Neon/Drizzle import in `app/**`.
- **Article VII**: design tokens as source of truth; mobile-first (880/520 breakpoints);
  Storybook coverage (Default + variants + responsive) NON-NEGOTIABLE for every changed
  component; nav/footer logo unmodified.
- **Article VIII + a11y**: component + story files ≤200 lines; functions ≤30 lines; TOKENS
  ONLY (headline uses `--ink`/`--orange`, no inline hex); WCAG AA contrast **verified =
  6.30:1 (pass)**; real-text `<h1>` with accessible name = `home.hero.headline`;
  `prefers-reduced-motion` disables rotation animation.
- **Article IX/XI**: Biome + `vue-tsc --noEmit` + Vitest green; absolute imports via alias.
- **Project gates**: ES↔EN key parity + equal marquee array length; story ≤200-line limit.

### Notable research findings (research.md)

- Source `sumo.webp` is ~1.76MB → MUST be optimized to `< ~200KB` at rendered size (artwork
  unmodified) before commit, or it fails the perf budget.
- orange-on-ink (`#F37021` on `#1A1209`) contrast = 6.30:1 → passes WCAG AA (even normal-text).
- Anton self-hosted woff2, `font-display: swap` + preload, scoped to hero headline only.

## Feature closed: 018 — vercel-blob-images (2026-07-01)

Formal closure only (code was already delivered + merged in a prior session). Reviewer
verified traceability + gates, `./init.sh` exit 0, marked `done`. Commit `0007c7e` on master.

## Feature closed: 019 — homepage-brand-updates (2026-07-01)

**Branch**: `feat/019-homepage-brand-updates` (merged `--no-ff` to master; branch deleted).

### Flow
- Human approved spec → leader flipped `spec_ready` → `in_progress` (after closing 018 to
  respect one-feature-at-a-time).
- Implementer: 5 commits, all 23 tasks `[x]`.
- Reviewer → **APPROVED** (commit `f99e279`), marked `done`. `review.md` written.

### What was delivered
- `public/brand/sumo.webp` — new illustrated hero logo, optimized by leader 1.76MB→121KB
  (900px), wired into `HomeHero.vue` (hero frame only; nav/footer keep the horizontal SVG).
- `public/fonts/anton-regular.woff2` (12KB, Latin subset) + `OFL-Anton.txt`; `@font-face` +
  `.hero-headline` flat box treatment in `app/assets/css/base.css` (tokens only, reduced-motion
  safe, WCAG AA 6.30:1); Anton preloaded via `nuxt.config.ts`.
- Full ES+EN copy refresh in `i18n/locales/{es,en}.json`: hero kicker/subtitle, marquee items,
  home SEO title/desc, type-selector title + AYCE/Express cards, featured section
  (label/heading/subtitle), branches CTA "Más de 30 sucursales…", footer blurb, page titles
  (Sucursales/Promociones/Reservas Sumo in H1 + SEO), menu drinks "Bebidas y coctelería".
  "Estilo americano-japonés" → "Buffet preparado al instante" site-wide (grep = 0).
- `server/db/seeds/menuCategories.ts` — drinks label aligned (seed only, NO migration).
- Components touched: `HomeHero.vue` (+ spec/stories), `HomeFeaturedRail.vue` (+ spec),
  `index.vue`, `branches.vue`; specs added for changed components.
- Reference docs: `specs/019-homepage-brand-updates/{client-brief,copy-audit}.md`.

### Final state
- `./init.sh` — Environment ready (all green). **775 tests** (+16), biome + typecheck +
  build + `storybook:build` all exit 0. 0 features `in_progress`.

## Pending
- Feature **015 — loyalty-portal** (`pending`, `sdd: true`) — next candidate.
- Feature **017 — contact-page** is `done`. Backlog 001–014, 016, 018–020 → `done`.
