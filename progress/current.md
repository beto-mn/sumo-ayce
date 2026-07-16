# Current session

## CLOSED: 024 — menu-image-refresh-express-branding (see progress/history.md)

---

## IN PROGRESS: 022 — homepage-hero-promos-contact (implementation, on 021 branch)

Branch: `feat/021-menu-experience-overhaul` (022 ships with 021 as one PR).

### Post-implementation dev-noise fixes (coordinator-relayed, in-scope)
1. error-handler: `ExternalServiceError` now logs at WARN + returns 502 (was
   falling through to ERROR "Unhandled server error"/500). Test added.
2. Promos validator: `imagen_desktop/tablet/movil` → `.nullish()` so promos with
   `null` image fields PARSE (were dropped with per-request WARN spam, e.g. WP
   ids 58/59). `resolveImages` now filters out promos whose desktop image is
   unresolved — quietly (single `logger.debug`, suppressed in prod). Fixtures +
   tests updated (validators + promotions.get): null-image promo parses then is
   excluded with no warn/error; image-bearing promos still show.
3. Removed root `postcss.config.cjs` (Nuxt "not supported together with Nuxt"
   warning). `@nuxtjs/tailwindcss` handles Nuxt's PostCSS; Storybook now sets
   Tailwind PostCSS INLINE in `.storybook/main.ts` (`css.postcss`) so its build
   still applies Tailwind. Verified: storybook:build exit 0 with Tailwind
   utilities in output CSS; no postcss warning on Nuxt boot (typecheck).

### Home-path stale-cache fix (coordinator-relayed, in-scope)
- `promotions.get.ts`: the homepage path no longer queries `?activa=1&home=1`
  (WordPress served a STALE/broken cache for that filter — deleted media id 66,
  null images — and no promo is home-flagged). Removed `homePromocionesUrl` and
  the primary→fallback branch; BOTH surfaces now use `?activa=1` (all active,
  newest-first). Home and /promotions are now identical + correct.
- Tests updated (promotions.get.test.ts): home path asserts a SINGLE `activa=1`
  call and never `home=1`; simplified `mockUpstream` (one list). 49 content tests.

### Client-review refinements to the promotions carousel (coordinator-relayed, in-scope)
1. ONE full-bleed slide per view at all breakpoints — `PromotionsCarousel.vue`
   slide basis `basis-full` (removed `sm:basis-1/2 lg:basis-1/3`); rounded/border
   moved to the viewport container.
2. Image IS the slide — `PromotionCard.vue` dropped the card frame
   (border/bg/shadow/rounded, object-cover); `<picture>` fills edge-to-edge
   (`w-full h-auto`, natural aspect). Colored badge overlay kept.
3. Home shows the SAME full-bleed carousel with ALL active promos:
   `promotions.get.ts` home path no longer caps to 3 (newest-first, home=1 →
   fallback all active); `selectPromotions` util no longer slices to 3.
4. Media robustness — `resolveImages` resolves ALL media in a SINGLE batched
   request (`/wp/v2/media?include=<ids>&per_page=100`) instead of ~15 per-id
   calls. A promo is dropped ONLY when it has NO configured image ID at all; a
   transient media failure logs WARN (not ERROR) and degrades gracefully without
   permanently dropping promos that HAVE image IDs.
5. Responsive `<picture>` swaps movil/tablet/desktop by 520/880 breakpoints
   (server returns distinct per-size URLs; covered by PromotionCard specs).
   Updated specs/stories (PromotionCard, PromotionsCarousel, HomePromotions,
   select-promotions, promotions.get + wordpress mock batch helper) and spec.md
   acceptance criteria. All green: check/typecheck/test(821)/storybook:build/
   init.sh exit 0.

### Task progress (see specs/022-…/tasks.md)
- 30/32 tasks `[x]`. Only T001 (font woff2 binary) and T031 (hero-font visual
  breakpoint check, depends on T001) remain — both blocked by the same asset.
- Part B (promotions, MVP) + Part C (contact job card) fully done + tested.
- Part A (hero font) wiring done; only the woff2 binary is pending.

### Verification (verified directly, not via init.sh masking)
- `pnpm check` → exit 0 (Biome, after check:fix).
- `pnpm typecheck` → exit 0 (vue-tsc).
- `pnpm test` → 813 passed / 106 files.
- `pnpm storybook:build` → exit 0.
- `./init.sh` → exit 0, "Environment ready".
- ES/EN i18n key parity → OK (0 drift).

### Blocker: T001 font woff2
macOS TCC denies read of the source ttf at
`~/Documents/Projects/Clients/SUMO/Assets/Fonts/Graphik-Super.ttf` from this
environment. fonttools IS installed and works; the file bytes are unreadable —
`cat`, `ditto`, python, and fonttools all get "Operation not permitted" even
with the sandbox disabled (`stat` succeeds → it is a Privacy/Full-Disk-Access
denial on the shell process, NOT a missing tool). Per the task rule I did NOT
ship a raw ttf or a fake woff2. All Part A wiring (base.css @font-face +
.hero-headline family, nuxt.config preload, GRAPHIK-SUPER-LICENSE.txt, Titan
One removal) is done and points at `/fonts/graphik-super.woff2`.
TO UNBLOCK: grant the terminal Full Disk Access (or Documents access) OR copy
the ttf into the repo (e.g. `public/fonts/_graphik-src.ttf`), then run:
  fonttools ttLib.woff2 compress -o public/fonts/graphik-super.woff2 <ttf>
and delete the source copy.

---

## PRIOR: 021 — menu-experience-overhaul (implementation)

Branch: `feat/021-menu-experience-overhaul`

### Client decisions honored
1. Rename internal drink group key `beers_spirits` → `beers` everywhere (TS union, i18n
   keys es/en, seeds, queries, components, stories/specs). Visible label stays "Cervezas".
   New `destilados` group added separately. Zero dangling `beers_spirits` (grep-verified).
2. Featured "Garantías Sumo" = exactly 11 seed rows with featured=true + explicit
   displayOrder (Burger del Barrio, Papas Smash, Mac & Cheese, Smash Dog, Bora Bora,
   Coco Roll, Canela Roll, Kushiage de Queso, Ramen XL, Tostiburger, Sumo Fries).
   "Sumo Fries" lives in desserts.ts. No other item featured.

### Production safety
- One additive migration `drink_group.display_order` created but NOT applied to prod Neon.
- Seeds updated but NOT run against prod. Exact migrate+seed commands in final report.
- Tests use mocked DB (no live DB), matching prior menu-feature test setup.

### Task progress (see tasks.md for full list)
- ALL 48 tasks `[x]` except T028 + T038 (production migrate/reseed — deferred, no Docker).
- `./init.sh` exits 0 (Biome + typecheck + 799/799 tests). `storybook:build` OK.
- All Phase -1 gates in plan.md marked `[x]`.
- Zero dangling functional `beers_spirits` reference (only rename comments + a legacy-row
  cleanup DELETE + negative test assertions remain, all intentional).

### Post-review fixes
- Reviewer round 1: fixed Biome format in menu-queries.test.ts; added MenuDrinkCard.spec.ts.
- Reseed FK-ordering bug: `seedDrinkGroups` now calls `resetDrinkChildren()` FIRST —
  deletes bebidas menu_items, then ALL drink_sub_groups (child→parent), BEFORE the legacy
  `beers_spirits`/`non_alcoholic` drink_group DELETEs. Makes `pnpm db:seed` idempotent
  against a DB that still holds pre-021 data (was NeonDbError 23503 FK violation).
  Regression test: `tests/db/drink-seed-order.test.ts` (records op order, asserts children
  deleted before any drink_group).

### PENDING production steps (human must run — coordinated, no Docker fallback)
1. Apply migration:  `pnpm db:migrate`  (adds drink_group.display_order — additive)
2. Reseed menu data: `pnpm db:seed`  (rename beers_spirits→beers, split destilados,
   consolidate Vaso Sumo, re-map non_alcoholic→sodas, 11 featured, wings no sauce)
Do NOT run against production Neon until coordinated.

---

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

## Feature spec authored: 021 — menu-experience-overhaul (2026-07-08)

**Feature id**: 21
**Feature name**: menu-experience-overhaul
**Status change**: `pending` → `spec_ready`
**Spec folder**: `specs/021-menu-experience-overhaul/`
**Branch**: `feat/021-menu-experience-overhaul`

### Skills invoked (in order)

1. `/speckit-git-feature` — created branch (renamed from accidental `feat/feat/021-…` double-prefix
   to `feat/021-menu-experience-overhaul`; also fixed `.specify/feature.json` from 019 → 021).
2. `/speckit-specify` — generated `spec.md` (+ `checklists/requirements.md`) from the CONFIRMED
   intake contract. No `[NEEDS CLARIFICATION]` markers → `/speckit-clarify` correctly skipped.
3. `/speckit-plan` — generated `plan.md` (with the explicit DB-migration flag + Phase -1 gates),
   `research.md`, `data-model.md`, `contracts/menu-api.md`, `contracts/i18n-keys.md`, `quickstart.md`;
   updated CLAUDE.md SPECKIT active-feature block.
4. `/speckit-tasks` — generated `tasks.md` (48 tasks across Setup / Foundational / US1–US3 /
   Cleanup / Gates).

### Source of truth
- `specs/_batch-intake/intake.md` (confirmed taxonomy) + `menu-map.md` (current architecture).
  All ambiguity resolved from intake — no human clarification round.

### DB migration decision (flagged in plan.md)
- **YES — ONE additive migration**: `drink_group.display_order integer NOT NULL DEFAULT 0` (the
  table had no ordering column; needed to deterministically order the 6 drink groups after the
  Destilados split). Generated via drizzle-kit, applied to production Neon (no Docker).
- Everything else is **seed / i18n / component** only: Destilados split (free-text `groupKey`, not
  an enum → seed insert + item re-map + `DrinkGroup` TS-union addition), Vaso Sumo consolidation
  (5→1 + reused parameterized `MenuSaucePicker`), Garantías Sumo 11 featured (seed UPDATE; column
  exists), 2x1 promo moved to group-level `promoEs/En` (columns exist), Caguamón-first + Café
  image-first (seed `displayOrder`), curated sets (feature-local typed config, no table per KISS),
  Carta/Menu label + half-width cards + hover-zoom (component + i18n).

### Verified corrections to coordinator relays (did NOT blindly encode)
- Coordinator claim "menu-queries has no modality filter" was checked against code: the LIVE path
  (`server/api/v1/menu/index.get.ts` → `getFullMenu` in `server/utils/menu-queries.ts`) ALREADY
  filters buffet vs carta via `ayceModalityFilter` (`includedInAyce`). NO new filter added.
- Real finding surfaced instead: `server/db/queries/menu.ts` is an ORPHANED duplicate imported
  only by `tests/db/menu-queries.test.ts` and lacks the modality filter → flagged as cleanup
  task T043 (Article I DRY / Article VIII dead code).
- Coordinator's set-membership mapping (buffet/carta/express fall out of `includedInAyce` +
  `locationType`, no recategorization) was verified and encoded in data-model §4.
- Deep-linking requirement (relayed) folded into US1 scenarios 7–10, FR-013a..d, SC-012,
  tasks T010/T011 — consistent with existing `useMenuFilters` URL-sync architecture.

### Main Phase -1 gates (from plan.md)
- **Article I**: all changes stay in `app/features/menu/` + menu data layer; DRY — flavour picker
  reuses parameterized `MenuSaucePicker` (no new component); page template ≤100 lines; Storybook
  per changed component.
- **Article IV**: tests-before-impl for seed/query logic; co-located specs; ≥80% server / ≥70%
  composable coverage.
- **Article V**: `/menu` stays `isr: 3600`; no Drizzle/Neon import in `app/**`; WP untouched;
  hover-zoom is transform-only (Lighthouse-safe).
- **Article VII**: tokens SoT; mobile-first 880/520; hover-zoom under `@media (hover: hover)` +
  `motion-reduce`; Default+variants+responsive stories; logo unmodified.
- **Article VIII/IX/X/XI/XII**: ≤30-line fns, ≤200-line files, no dead code; Biome + vue-tsc +
  Vitest + storybook build green; KISS (no set table, one column); alias imports; error handler
  unchanged.

### Task count: 48. MVP = Setup + Foundational + US1 (3-way nav + deep-linking).

### Open risks / notes for implementer
- Confirm exact seed dish names before setting featured flags ("Burger del Barrio", not "de barrio").
- Decide whether `beers_spirits` `groupKey` is renamed to a `beers` intent or kept (keep TS union +
  i18n key in sync either way).
- Whether `FullMenuResult` needs a minimal group-level (order + promo) surface vs deriving on client
  — decide in T008/T009; prefer extending the result over a second fetch.
- Applying the migration to production Neon has no Docker fallback — coordinate the migrate+seed run.

## Pending
- Feature **015 — loyalty-portal** (`pending`, `sdd: true`) — next candidate.
- Feature **021 — menu-experience-overhaul** is `spec_ready` → awaits HUMAN approval before
  `in_progress`.
- Feature **017 — contact-page** is `done`. Backlog 001–014, 016, 018–020 → `done`.

---

## SPEC_READY: 022 — homepage-hero-promos-contact (consolidated, urgent)

**Feature**: id 022, `homepage-hero-promos-contact` (client folded former 022/023/024 into one).
**Status**: `spec_ready` → awaits HUMAN approval.
**Spec folder**: `specs/022-homepage-hero-promos-contact/`
**Ships on the EXISTING branch** `feat/021-menu-experience-overhaul` as ONE deliverable/PR — no
new git branch was created (speckit-git-feature intentionally skipped; setup-plan kept the branch).

### Skills invoked (in order)
1. `/speckit.specify` → spec.md (+ checklists/requirements.md)
2. `/speckit.clarify` → SKIPPED (requirements fully clarified by the client; 0 `[NEEDS CLARIFICATION]`)
3. `/speckit.plan` → plan.md + research.md + data-model.md + contracts/promotions-wp.md + quickstart.md
4. `/speckit.tasks` → tasks.md (32 tasks, 3 user stories)

### Three parts (one spec)
- **A (P2)** Hero font Titan One → self-hosted Graphik Super (base.css @font-face + .hero-headline,
  nuxt.config preload). Keep white-fill/black-stroke logo treatment + aria key. Source ttf verified.
- **B (P1, MVP)** Promotions: WP ACF already restructured — title from `title.rendered` (HTML-decoded),
  editorial text fields removed, 3 responsive image media IDs with desktop fallback. Old validator
  requires `titulo_es` → currently drops ALL promos; this fixes it. Shared embla carousel
  (`app/components/ui/PromotionsCarousel.vue`) on `/` and `/promociones`.
- **C (P3)** Static i18n "Bolsa de trabajo" contact card + phone/WhatsApp CTA (TEST placeholder), no form.

### Main Phase -1 gates (from plan.md)
- Article I: carousel lifted to `app/components/ui/` (shared), no features/homepage↔features/promotions import.
- Article II: no `any`; `Promotion`/`WpPromotion` types single-sourced.
- Article III/V: WordPress-only (no Neon under app/); `/` ISR 3600, `/promociones` ISR 60 unchanged.
- Article IV: server pipeline TDD (tests before impl); co-located component specs.
- Article VI: Zod validation at the boundary; malformed items dropped individually.
- Article VII: Storybook stories (default + variants + breakpoints) for every changed/new component; reduced-motion respected.
- Article X: `embla-carousel-vue` is a justified NEW dependency; HTML-entity decode is dependency-free.

### Flags / risks
- **New dependency**: `embla-carousel-vue` (must be added to package.json — not present today).
- **Live regression**: no promos currently render; US1 is the fix and the MVP.
- **Stale doc**: `docs/business/wordpress-endpoints.md` documents the OLD promociones ACF contract;
  `contracts/promotions-wp.md` is authoritative. Doc update flagged as follow-up (out of code scope).
- The batch-intake maps named in the request (`homepage-map.md`, `contact-map.md`) do NOT exist —
  only `intake.md` + `menu-map.md` are present; intake.md covered the needed findings.

---

## SPEC_READY: 025 — menu-loading-skeletons

**Feature**: id 25, `menu-loading-skeletons`.
**Spec folder**: `specs/025-menu-loading-skeletons/`
**Branch**: `feat/025-menu-loading-skeletons` (created fresh via speckit-git-feature; branched off
the working tree that was on `fix/023-menu-chip-db-drift-guard` at the time, then renamed from the
script's auto-numbered `feat/024-...` to `feat/025-...` to match this feature's fixed `spec_path`).

### Skills invoked (in order)
1. `/speckit-git-feature` → branch created (`feat/024-menu-loading-skeletons`), then renamed to
   `feat/025-menu-loading-skeletons` to match `feature_list.json`'s `spec_path`.
2. `/speckit.specify` → spec.md (+ checklists/requirements.md). Directory forced to
   `specs/025-menu-loading-skeletons` via `.specify/feature.json` since the branch-numbering script
   would otherwise have picked `024` (next empty slot in `specs/`), which doesn't match this
   feature's assigned `spec_path`.
3. `/speckit.clarify` → SKIPPED. 0 `[NEEDS CLARIFICATION]` markers — both judgment calls flagged in
   the assignment (component placement, prop-drilling vs. page-level loading swap) were resolved
   via existing codebase conventions and recorded in spec.md's Assumptions + research.md Decisions
   1-2, with rationale.
4. `/speckit.plan` → plan.md + research.md (5 decisions) + data-model.md +
   contracts/skeleton-components.md + quickstart.md.
5. `/speckit.tasks` → tasks.md (25 tasks across Setup, Foundational, US1/US2/US3, Polish).

### Design decisions (from research.md)
- **Component placement**: generic `UiSkeleton.vue` primitive → `app/components/ui/` (Article I —
  reusable across future features). Menu-specific compositions (`MenuChipSkeleton`,
  `MenuDishCardSkeleton`, `MenuSkeleton` orchestrator) → `app/features/menu/components/` (Article X
  — only `/menu` needs these exact shapes today).
- **Loading-state ownership**: handled at `app/pages/menu.vue` (new `isLoading` branch alongside
  the existing `error`/`isUnavailable`/`data` branches); `MenuShell.vue` and all its children are
  UNCHANGED — avoids threading a new prop through an already multi-branch presentational component.
- **Chip skeleton count is EXACT, not approximate**: sourced from the existing
  `getCuratedSet(selection, modality)` in `app/features/menu/menu-sets.ts` (already known before the
  fetch resolves, since `activeSelection`/`activeModality` derive from `route.query`) — 8 for
  AYCE·buffet, 11 for AYCE·carta, 8 for Express, 6 for Bebidas, 0 (no chip row) for Kids.
- **Dish-card skeleton count is a fixed 6** (grid-friendly at all breakpoints) — the real
  per-category dish count is unknowable before the fetch resolves.
- **Reduced motion**: Tailwind `animate-pulse motion-reduce:animate-none`, the exact pattern already
  used by `Marquee.vue` — no new JS/keyframes.

### Main Phase -1 gates (from plan.md's Constitution Check)
- Article I: DRY (shared primitive) vs KISS (feature-scoped compositions) placement, justified.
- Article IV: co-located Vitest specs for every new component (no composable introduced).
- Article VII: Storybook stories (Default + reduced-motion/static + Responsive) per new component;
  reduced-motion handling mandatory, matching `Marquee.vue`'s established convention.
- Article VIII: components kept small/single-purpose, well under the 200-line limit.
- Article X: no premature abstraction — the shared primitive stays a minimal box/pill, the
  menu-specific shapes are NOT generalized until a second real use case exists.
- Articles III/V/VI/XII/XIII marked N/A (no routes, no DB, no auth, no server route touched).

### ⚠️ CONFLICT FOUND — needs leader/human reconciliation before this can move forward
While authoring this spec, `feature_list.json` was found being actively rewritten by a concurrent
process (uncommitted working-tree changes, observed mid-session, NOT something I edited):
- Feature **id 25 was removed entirely** from the array.
- Feature **23**'s title/description was rewritten to add a "PART B" folding this exact
  menu-loading-skeletons work into feature 23, with the explicit note "no formal spec — implemented
  directly per client instruction... do not create a separate feature entry for this," and its
  `status` changed from `spec_ready` to `in_progress`.
- This is a live, uncommitted conflict — `git diff HEAD -- feature_list.json` shows it as an
  unstaged modification, not a prior commit. It appears another agent/process is implementing this
  same skeleton work directly on `fix/023-menu-chip-db-drift-guard` without going through the spec
  phase, which contradicts this assignment (formal spec for a standalone id-25 feature) and the
  root `CLAUDE.md` hard rule that any `sdd: true` feature MUST go through `spec_author` first.
- **I did NOT touch `feature_list.json`'s feature-23 entry or re-add id 25** — reconciling which
  track (formal spec-based id 25 vs. direct no-spec PART-B-of-23) is authoritative is a
  leader/human decision, not mine to make unilaterally.

### ✅ RESOLVED (human decision)
Client explicitly instructed: no separate feature entry, everything folds into feature 23 as
PART B, implemented directly on this same branch without a formal spec_author pass, no commit
until told. `feature_list.json` stays as the leader rewrote it (id 25 removed, id 23 covers both
parts, `status: in_progress`). This `specs/025-menu-loading-skeletons/` folder is kept only as
reference research (design decisions above — component placement, loading-state ownership,
exact chip-skeleton counts via `getCuratedSet`, reduced-motion pattern) informing the direct
implementation; it is not an active spec_path.
- The full spec/plan/tasks for id 25 are complete and committed to disk at
  `specs/025-menu-loading-skeletons/` on branch `feat/025-menu-loading-skeletons` regardless of how
  this conflict is resolved.

### Pending
- Leader/human must reconcile the `feature_list.json` conflict above before feature 25 (or the
  folded-in "PART B" of 23) can proceed to `in_progress`.
- Feature **015 — loyalty-portal** (`pending`, `sdd: true`) — next candidate once reconciled.

## IMPLEMENTED: 023 PART B — menu loading skeletons (uncommitted, awaiting review)

Implemented directly on the current branch (`feat/025-menu-loading-skeletons`), no formal
spec_author pass, per explicit client instruction (feature 23's `feature_list.json` description
covers this as "PART B"). Used `specs/025-menu-loading-skeletons/{research,data-model,contracts,
tasks}.md` as reference design/task breakdown only — that folder was NOT modified and is not an
active spec_path. **Nothing was committed** — all changes below are uncommitted working-tree
modifications for the human to review/commit.

### What changed
- New generic primitive `app/components/ui/UiSkeleton.vue` (`shape: 'rect' | 'pill' | 'circle'`,
  default `rect`) — single `<div aria-hidden="true">`, `bg-bg2`, `animate-pulse
  motion-reduce:animate-none` (same reduced-motion pattern as `Marquee.vue`'s track). No
  width/height props — sizing via `class` passthrough.
- New menu-scoped compositions in `app/features/menu/components/`:
  - `MenuChipSkeleton.vue` — one pill `UiSkeleton` sized to `UiChip`'s dimensions/border.
  - `MenuDishCardSkeleton.vue` — `MenuDishCard`'s outer shell classes wrapping exactly 3
    `UiSkeleton`s (image area, title line, description line).
  - `MenuSkeleton.vue` (orchestrator) — props `selection`/`modality`; chip count =
    `getCuratedSet(selection, modality).length` (exact — 8 AYCE·buffet, 11 AYCE·carta, 8 Express,
    6 Bebidas, 0/no-row Kids); dish-card count fixed at 6 (grid-friendly at all breakpoints,
    real per-category count unknowable pre-fetch); root carries `role="status"
    aria-live="polite"` + a `sr-only` bilingual loading label (`menu.skeleton.loading`, added to
    both `i18n/locales/es.json`/`en.json`); individual placeholders stay `aria-hidden="true"`
    (moved off the wrapper rows during implementation so only true leaf placeholders are
    aria-hidden, matching the contract's "root conveys loading state, placeholders are
    decorative" split).
- `app/pages/menu.vue`: destructures `status` from the existing `useAsyncData` call (alongside
  `data`/`error`, unchanged); new `isLoading = computed(() => status.value === 'pending')`; new
  template branch `<MenuSkeleton v-else-if="isLoading" :selection :modality />` inserted AFTER the
  existing `error || isUnavailable` branch and BEFORE the `data`/`MenuShell` branch, so
  error/unavailable always takes precedence over a stale pending indicator. Also added the
  explicit `import { computed } from 'vue'` this file was missing (relies on Nuxt auto-import at
  runtime, but the plain-`@vitejs/plugin-vue` Vitest "app" project has no such auto-import — this
  was blocking the page's first-ever unit test from mounting at all; harmless/no-op under real
  Nuxt, matches the explicit-import convention already used by `promotions.vue`/`branches.vue`).
- `MenuShell.vue` and all of its existing children (`MenuCategoryChips`, `MenuDishGrid`,
  `MenuDishCard`, `MenuTypeToggle`, `MenuModalityToggle`, `MenuDrinkSection`) are UNTOUCHED, per
  the reference research's Decision 2 (loading-state ownership stays at the page level).

### Tests added (co-located, one file per new component + the page)
- `UiSkeleton.spec.ts` — aria-hidden, rounding per shape, animate-pulse +
  motion-reduce:animate-none always present regardless of shape.
- `MenuChipSkeleton.spec.ts` — pill dimensions/border, reduced-motion.
- `MenuDishCardSkeleton.spec.ts` — outer shell classes, exactly 3 nested skeletons, reduced-motion
  on all 3.
- `MenuSkeleton.spec.ts` — exact chip count per (selection, modality) combo incl. 0/no-row for
  Kids; always-6 dish-card skeletons; `role="status"`/`aria-live="polite"`/`sr-only` label;
  reduced-motion holds through composition for both a chip-bearing view and Kids.
- `app/pages/menu.spec.ts` (new file, first test for this page) — cold-load renders `MenuSkeleton`
  with the correct default selection/modality (not `MenuShell`/error); switching (route query
  change) while pending renders `MenuSkeleton` for the destination selection, never stale
  `MenuShell` content; resolved fetch renders `MenuShell`; error and the degraded
  empty-menu ("unavailable") states both take precedence over a stale pending status.

### Storybook
- `UiSkeleton.stories.ts`, `MenuChipSkeleton.stories.ts`, `MenuDishCardSkeleton.stories.ts`,
  `MenuSkeleton.stories.ts` — each with `tags: ['autodocs']`, `satisfies Meta<typeof ...>`,
  Default + shape/selection variants, a composed-row/composed-grid demo story, a documented
  `ReducedMotion` story, and Mobile/Desktop viewport stories. All mount the real component (no
  hand-rolled markup). No `.storybook/preview.ts` changes needed — `UiSkeleton` is picked up by
  the existing `app/components/ui/*.vue` glob (auto-registered as `<UiSkeleton>`); the
  menu-scoped compositions resolve `<UiSkeleton>`/each other the same way `MenuShell`'s stories
  already do (no new global registration required).

### Design tokens / constraints honored
- No arbitrary values, no inline hex — only `bg-bg2`, `rounded-pop-sm`/`rounded-pop-full`,
  `border-pop`/`border-pop-sm`, `border-ink`, `bg-panel`, `shadow-pop-sm`, `animate-pulse
  motion-reduce:animate-none` (all pre-existing Tailwind/design tokens).
- Every new component ≤ ~40 lines (well under the 200-line cap).
- `prefers-reduced-motion` respected end-to-end (primitive + both compositions + the
  orchestrator), verified by Vitest across the full composition, not just the primitive.

### Self-verification
- `./init.sh` → exit 0: Biome OK (371 files), `nuxt typecheck` OK, Vitest 948/948 passed (112
  files), Storybook build OK.
- Secret self-scan on the diff (`git diff -- ':!pnpm-lock.yaml' ...` + the grep pattern from the
  security checklist) → clean, no matches.
- **Nothing committed** — `git status` shows all of the above as unstaged/untracked working-tree
  changes only, per instruction to leave commit to the human.

### Known issues / TODOs
- None.
