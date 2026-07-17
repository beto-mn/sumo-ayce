# Session history

> Append-only log. Closed sessions are moved here from `progress/current.md`.

---

## 2026-06-17 — Feature 007: `scaffold-and-design-system` (Scaffold & Design System — Mercado Pop)

**Branch**: `feat/007-scaffold-and-design-system`
**Status**: `done`
**Spec**: `specs/007-scaffold-and-design-system/`
**Agents**: `spec_author` → human review → `implementer` → `reviewer` → human close.

### Pre-decisions (resolved by human before implementation)

- **Q1 — Brand colors**: prototype values. `--orange: #FF6B2B` (AYCE, default `--accent`), `--blue: #2E7CF6` (Express, peer brand token — NOT secondary). Both exposed in `tokens.css` and `tailwind.config.ts`.
- **Q2 — Typography**: Bricolage Grotesque (display, weight 800) + Hanken Grotesk (body 400/600/700), self-hosted via `@nuxt/fonts` (provider `'google'`).
- **Q3 — i18n routing**: `prefix_except_default` — ES at `/`, EN at `/en/...`.

### Other architectural decisions made this session

- **Reduced-motion handling**: CSS-only (`@media (prefers-reduced-motion: reduce)`) on `Marquee` only. The `usePrefersReducedMotion` composable was eliminated as overkill — micro-hover transitions on Button/Card/Sticker are short enough (<300ms) to be outside WCAG 2.3.3.
- **Mapbox license**: accepted (proprietary TOS, billing-aware). `mapbox-gl ^3.25.0` installed as install-only — provider-agnostic `<MapView>` abstraction will land in feature 012. Architecture documented in `docs/business/maps-strategy.md`.
- **Token enforcement (3 layers)**:
  - Layer 1 — `tailwind.config.ts` **overrides** `theme.colors` (default palette intentionally not compiled).
  - Layer 2 — Phase 8 greps T108a (default palette leak), T108b (arbitrary values), T108c (inline hex) — zero matches in new files.
  - Layer 3 — `reviewer.md` updated with "Design token enforcement" section that rejects PRs on the same patterns.
- **Token format**: migrated to RGB channels (`255 107 43`) consumed via `rgb(var(--token) / <alpha-value>)` per Tailwind v3 docs — unlocks opacity modifier (`bg-orange/50`, `bg-ink/40`, `hover:bg-accent/90`) used downstream in modals/overlays/hovers.

### Library pins (verified against npm registry)

- `@nuxtjs/tailwindcss ^6.14.0`
- `tailwindcss ^3.4.19` (pinned explicitly — v3 LTS, v4 module still beta)
- `@nuxtjs/i18n ^10.4.0` (Nuxt 4 line; original spec said v9, corrected during research)
- `@nuxt/fonts ^0.14.0`
- `mapbox-gl ^3.25.0`
- `@vitejs/plugin-vue ^6.0.7` (added during implementation — Storybook 10.4 needed it)

### Implementation summary

- **47 tasks**: 46 `[x]`, T012 `[REMOVED]` (composable eliminated).
- **46/46 Phase -1 gates** `[x]`.
- **10 base UI components** delivered with co-located stories (Button, Card, Chip, Sticker, Kicker, Input, Select, Textarea, Nav, Marquee) plus `Tokens` parity story.
- **Default layout**, i18n locales (`es.json`, `en.json`), `cx` utility, `tokens.css`, `base.css`, `tailwind.config.ts`, route rules wired.

### Reviewer verification

- Initial review: **APPROVED** with deviations accepted (`@vitejs/plugin-vue` 5th library, `.npmrc` workstation workaround, `@/utils` alias repoint, extra Tailwind tokens for `borderWidth`/`ringWidth`/`fontSize`).
- Delta re-review (after channel migration): **APPROVED** — all 9 checks pass, opacity modifier confirmed compiling to `rgb(var(--token) / 0.5)`.
- `./init.sh` exit 0, 188/188 tests, lint OK, typecheck OK, Storybook build OK, zero sensitive-data hits, zero copy-rule violations.
- Full review: `progress/review_scaffold-and-design-system.md`.

### Carryovers for future features

- **Feature 008** (frontend-test-setup) — scope expanded to include cleanup of 21 inline hex literals in `app/components/staff/*.vue` and `app/pages/staff/*.vue` (legacy feature 006 territory; pre-dated the token enforcement). T108c grep must return zero matches across the entire `app/` tree after feature 008 ships.
- **Feature 012** (`/sucursales`) — must implement the provider-agnostic `<MapView>` + `mapboxAdapter` per `docs/business/maps-strategy.md`. Reviewer agent will reject direct `mapbox-gl` imports outside `app/composables/maps/adapters/`.

### Operational changes (outside source code)

- `.gitignore` extended with `storybook-static/`.
- `feature_list.json` id=8 description extended with the staff hex cleanup point (8).
- `docs/business/maps-strategy.md` created (new — provider abstraction rule).
- `docs/business/features.md`, `overview.md`, `rendering-strategy.md` updated with cross-references to maps-strategy.
- `.claude/agents/reviewer.md` updated with "Design token enforcement" section.

---

## 2026-06-17 — Feature 008: `frontend-test-setup` (Vitest + happy-dom + Vue Test Utils)

**Branch**: `feat/008-frontend-test-setup`
**Status**: `done`
**Spec**: `specs/008-frontend-test-setup/`
**Agents**: `spec_author` → human review → `implementer` → `reviewer` → human close.

### Decisions baked in (research.md)

- **Vitest 4 env API**: `test.projects` (idiomatic v4; `environmentMatchGlobs` deprecated). Two named projects: `app` (happy-dom) and `server` (node).
- **`happy-dom`** `^15.10.2` initial pin; ended at `^20.0.11` after the `@nuxt/test-utils` peer-dep was bumped during install.
- **`@vue/test-utils`** `^2.4.6` (resolved to `2.4.11`).
- **Test convention**: `Component.vue ↔ Component.spec.ts` co-located (not `.test.ts`).
- **Composable tests legacy**: kept `vi.stubGlobal` shims as-is. Only added `vi.stubGlobal('navigateTo', vi.fn())` to fix the previously-broken `useStaffAuth` logout test.
- **Error/danger token**: reused `--pink` for error states. NO new tokens added — door left open for a future `--danger` if feature 011 forces a semantic conflict.
- **Coverage thresholds**: DEFERRED to feature 014 close-out.

### Implementation summary

- **27/27 tasks** `[x]` across 8 phases.
- **18/18 Phase -1 gates** `[x]`.
- **10 component specs** added under `app/components/ui/` (Button, Card, Chip, Sticker, Kicker, Input, Select, Textarea, Nav, Marquee) — behavior-driven, ≤ 60 lines each, Default + variant + accessibility/interaction assertion per file.
- **2 dead composable tests revived** (`useStaffAuth.test.ts`, `useStaffCustomer.test.ts`) — both now run under `app` project.
- **22 hex literals migrated** across 8 staff files to Mercado Pop tokens (`var(--ink)`, `rgb(var(--orange))`, etc.) — plus 1 extra (`#ef4444` in `TransactionTable.vue:190` → `rgb(var(--pink))`).
- **`vitest.config.ts` rewritten** to use `defineConfig` from `vitest/config` with two `test.projects`. `defineVitestConfig` from `@nuxt/test-utils/config` was rejected after research §1 footnote — it throws when `test.projects` is set. Fix: merge `getVitestConfigFromNuxt()` into the `server` project only; `app` project loads `@vitejs/plugin-vue` directly; filter `ssr-styles`, `vite:vue`, `vite:vue-jsx` from server-project plugin list. Documented in `tasks.md` T002 acceptance.
- **`@/utils` alias** added to vitest config to resolve `@/utils/cx` without Nuxt auto-import resolution.
- **`docs/harness/verification.md` + `conventions.md`** extended with the Frontend tests / Testing subsections.
- **`CHECKPOINTS.md` C4 extended** to require `pnpm test` coverage of `app/` (not only `server/`).
- **`.claude/agents/reviewer.md`** gained a Frontend spec-presence rule.

### Reviewer verification

- **APPROVED** — all 3 implementer deviations accepted (vitest.config shape, `@/utils` alias, the +1 hex migration).
- `./init.sh` exit 0; lint, typecheck OK.
- `pnpm test`: **226 tests** across 44 files (baseline 188/32; delta +38 tests / +12 files — exact spec target).
- T108a, T108b, T108c → zero matches across the full `app/` tree (T108c gate from feature 7 carryover satisfied).
- Sensitive data scan: zero hits.
- Full review: `progress/review_008-frontend-test-setup.md`.

### Carryovers for future features

- None blocking. From feature 009 onward, every new `app/components/ui/<Name>.vue` MUST ship with co-located `<Name>.spec.ts`. From feature 009+, **TDD applies forward-going** per Article IV.

---

## Feature 010 — Homepage (`/`) — DONE (2026-06-20)

Public homepage in the "Mercado Pop" visual language, ISR 3600. Branch `feat/010-homepage` (work uncommitted — human's call on commit/PR).

### What shipped
- **Sections**: hero (cream + 22px diagonal stripes + yellow radial "sun"; transparent logo frame with the official vertical SUMO SVG; orange `$269` sticker), type selector ("Dos formatos…" + AYCE/Express cards with badges/dots/chips/Ver-menú), featured-dishes rail, promotions, Google reviews, branches CTA. Global shell: `SiteHeader` (logo + nav + EN/ES + Reservar), ink `SiteMarquee` band, `SiteFooter`.
- **Content sourcing**: promotions from WordPress `promociones` (server-side, ISR) with a **two-step selection** — PRIMARY `?activa=1&home=1` (active + home-flagged) capped to 3 newest, FALLBACK `?activa=1` (all active) capped to 3 if primary empty, else section hides; 4s/3s fetch timeouts + graceful degradation. Featured dishes and reviews are **static fixtures** (route-compatible shape, swappable later). Hero price from runtime config.
- **PromoCard**: badge color from `acf.color`; small type bar (express→blue, ayce→orange, all→ink); the `acf.imagen` flyer opens large in a reusable **`UiLightbox`** on click (not inline).
- **Marquee**: adaptive repetition (gap-free at any width via measured copies), ink band, orange ✺ separator, i18n phrases, `speed="slow"`.
- **Favicon**: official vertical SUMO SVG + PNG fallback (Nuxt default favicon removed).
- **Footer**: ink band, official social URLs (IG/FB/TikTok), WhatsApp removed from social, Contacto→`/contacto`, compacted link heights (28px).

### Key decisions
- Featured dishes = static fixture, NOT a Neon DB route (the earlier `016 menu-schema-drizzle` detour was created+approved then **removed**; its DB code is parked in `git stash@{0}`). The reviewer-approved 016 schema can be revived for features 011/012.
- **Tailwind-only**: no `<style>` blocks in homepage/chrome; tokens only; no arbitrary color/inline-hex values. `hover:` is desktop-only (`hoverOnlyWhenSupported`).
- **Structure codified**: created `docs/harness/structure.md` (canonical by-feature layout) + `CHECKPOINTS.md` C3.1 gate + reviewer structure check; moved shell components to `app/components/layout/`.
- Fonts: Bricolage Grotesque (display) + Hanken Grotesk (body) via `@nuxt/fonts`.
- `WORDPRESS_API_URL` = bare origin `https://cms.sumo.com.mx` (env-driven; queries documented in `docs/business/wordpress-endpoints.md`; raw shape typed in `types/wordpress.ts`).

### Reviewer verification
- First pass **REJECTED** — one blocking defect: Express-exclusive blue used on the non-Express Google-reviews kicker (Article VII / FR-011). Fixed (kicker → `yellow`; `UiKicker` gained a yellow tone). Re-review **APPROVED**, flipped id=10 → `done`.
- `./init.sh` exit 0 — **352 tests** (65 files), biome, typecheck, build. `pnpm check` clean. All grep gates (default-palette / arbitrary-value / inline-hex / `<style>`) zero. Full record: `progress/review_010-homepage.md`.

### Carryovers
- **T042** (Lighthouse ≥90 / interactive <2s) deferred to post-deploy verification on the feature-009 CI preview.
- **Feature 011 (menu page)** is still specced for the WordPress `menu_item` CPT — must be reconciled to DB sourcing (revive the `016` schema from `git stash@{0}`) before it is worked on.
- `git stash@{0}` holds the reviewer-approved 016 menu-schema DB code (schema + migration + seed + `getFeaturedDishes`/`getFullMenu` helpers). Restore it for 011/012, or drop it if redoing.

---

## Feature 023 — Menu Chip / DB Drift Guard — DONE (2026-07-15)

**Branch**: `fix/023-menu-chip-db-drift-guard`

### The bug
`app/features/menu/menu-sets.ts` hardcoded curated per-view category/drink-group membership (`AYCE_BUFFET_SET`, `AYCE_CARTA_SET`, `EXPRESS_SET`, `DRINKS_SET`) consumed by `useMenuFilters.ts` to build `MenuShell.vue`'s chip row, never cross-checked against `server/utils/menu-queries.ts`'s live DB read. A category removed/deactivated in the DB without updating `menu-sets.ts` still rendered a chip — `foodCategoryLabel()` fell back to the raw untranslated key, `activeFoodCategory` fell back to an empty `{ dishes: [] }` section — a silent dead/blank chip.

### What shipped
- **Runtime guard (US1)**: new pure `filterAvailableKeys(keys, availableKeys)` in `menu-sets.ts`; `resolveActiveKey` and `useMenuFilters` gained an optional `availableKeys?: Set<string>` param (backward-compatible, existing 3-arg call sites unaffected) so a chip only renders when its key exists in the fetched `FullMenuResult.categories`/`drinkGroups`; the existing out-of-set fallback is reused for the active-key-becomes-unavailable case. `MenuShell.vue` builds `availableKeys` from `props.menuData` and passes it through.
- **CI regression guard (US2)**: new `describe` block in `tests/db/menu-seeds.test.ts` asserting every curated-set key exists among the active seed's `menu_categories`/`drink_group` keys, failing with a message naming the offending key + set. Verified live to fail on an injected drift, then reverted clean.
- Storybook: `MenuShell.stories.ts` expanded fixture + two new variants (`FilteredMissingCategory`, `FilteredMissingDrinkGroup`).
- Explicitly out of scope (confirmed untouched): `sauces` and `drinkSubGroups` tables/seeds — both still in active use (drinkSubGroups fully live in `MenuDrinkSection.vue`; sauces catalog intentionally retained per specs/021 FR-021 "for any future use").

### Reviewer round 1 → REJECTED (2 reasons), fixed, round 2 → APPROVED
1. `tasks.md` had all 15 tasks unchecked despite the work being done — fixed, T001-T015 marked `[x]` (T003 documents the file-naming deviation: tests went into the pre-existing `menu-sets.spec.ts` instead of a new file).
2. `MenuShell.vue` was 203 lines, over the 200-line Article VIII cap — trimmed to 197 lines, no functionality/coverage lost.

### Final state
- `./init.sh` exit 0 — 918/918 tests, Biome + typecheck + Storybook build all green. Sensitive-data scan clean.
- Full review record: `progress/review_menu-chip-db-drift-guard.md`.
- Homepage branch `feat/010-homepage` is uncommitted — commit/PR per the CI flow when ready.

## Feature closed: 021 — menu-experience-overhaul (2026-07-16, retroactive)

**Branch**: `feat/021-menu-experience-overhaul` (merged `--no-ff` to master, commit `cc57041`,
and to develop, commit `8a7534c`, on 2026-07-14).

### Retroactive closure note
Implementation was completed and merged to master on 2026-07-14, but `feature_list.json` was
left at `spec_ready` and no closure entry was written at the time — a bookkeeping gap, not a
missing/incomplete feature. Discovered 2026-07-16 when the human asked to double-check features
21/22. `reviewer` ran a full formal verification against `spec.md`/`plan.md`/`tasks.md`/
`constitution.md`/`CHECKPOINTS.md` on the current master state and returned **APPROVED**: all 52
tasks `[x]`, all Phase -1 gates `[x]`, no `[NEEDS CLARIFICATION]` markers, full acceptance-criteria
traceability across US1–US3, `./init.sh` exit 0 (957/957 tests, Biome/typecheck/Storybook clean),
no cross-feature imports or token violations, no secrets. Full record:
`progress/review_021-menu-experience-overhaul.md`. `feature_list.json` flipped `spec_ready` → `done`.

## Feature closed: 022 — homepage-hero-promos-contact (2026-07-16, retroactive)

**Branch**: `feat/021-menu-experience-overhaul` (022 shipped as one PR with 021 per plan; same
merge commits as above).

### Retroactive closure note
Same situation as 021 above — including the previously-blocked T001 (Graphik Super `woff2`,
stuck on a macOS TCC file-read permission per `progress/current.md`'s working notes): the asset
was in fact produced and committed (`e0a21d2`), and `public/fonts/graphik-super.woff2` is present
on master. `reviewer` verification on 2026-07-16 returned **APPROVED**: all 32 tasks `[x]`
(including T001), all Phase -1 gates `[x]`, full acceptance-criteria traceability across the three
parts (promotions carousel, hero font, contact job card), same clean `./init.sh` run, no
cross-import/token violations. One judgment call confirmed: the real WhatsApp number in the
contact card is intended public business content per spec, not a committed secret. Full record:
`progress/review_022-homepage-hero-promos-contact.md`. `feature_list.json` flipped `spec_ready` →
`done`.

## Feature closed: 024 — menu-image-refresh-express-branding (2026-07-15)

**Branch**: `feat/024-menu-image-refresh-express-branding` (rebased onto master post-023;
uncommitted, awaiting human commit/merge).

### Flow
- Human approved spec → leader flipped `spec_ready` → `in_progress`, launched implementer.
- Implementer: all 27 tasks (T001-T027) done. Round-1 reviewer REJECTED solely because
  `tasks.md` checkboxes weren't updated (implementer's prior session had no live transcript to
  resume); leader corrected `tasks.md` directly (docs/tracking, not source code) and re-ran the
  reviewer. Round-2 reviewer → **APPROVED** (`progress/review_menu-image-refresh-express-branding.md`).
  A follow-up implementer instance marked `done` in `feature_list.json` per convention.

### What was delivered (3 independent user stories)
- **US1 — Kids AYCE collage**: `server/db/seeds/kidsMenu.ts` sets `fileName:
  'menu/kids/all_you_can_eat_kids.webp'` for the "All You Can Eat Kids" item; a new 3-panel
  composite (burger/sushi/tenders+fries) was uploaded to Vercel Blob at that path via
  `scripts/replace-blob-images.ts` (added `--src` CLI flag). DB reseeded; every other Kids row
  unchanged.
- **US2 — Sitewide watermark**: new `backgroundImage.watermark` Tailwind token
  (`public/patterns/sumo-watermark.webp`, ~10% baked-in alpha, 300×405) applied on
  `app/layouts/default.vue`'s root wrapper alongside the existing `bg-bg`. Bug found + fixed
  in the process: `app/pages/branches.vue` and `app/pages/contact.vue` each had a redundant
  opaque `min-h-screen bg-bg` on their own page-root that fully occluded the new watermark —
  removed (matches the pattern already used by `menu.vue`/`promotions.vue`/`index.vue`).
  Lighthouse re-verified via a `git worktree` production-build baseline: 0-3 point diff
  (no regression).
- **US3 — Express map branding**: `app/composables/maps/adapters/mapboxAdapter.ts` gained a
  `markerLogoSrc(color)` helper; Express (`blue`) markers now use
  `public/brand/sumo-express-vertical.webp`, AYCE (`orange`) unchanged. Live Mapbox/WebGL
  screenshot wasn't possible in the sandbox (no GPU/GL backend); verified instead via a new
  `mapboxAdapter.spec.ts` (5 tests) plus a Storybook story mounting the real
  `makeMarkerElement()` function.

### Guardrails confirmed
- Zero diff on `app/features/menu/menu-sets.ts` and `app/components/layout/SiteLogo.vue`
  (explicit out-of-scope requirement).
- `./init.sh` — exit 0: Biome (373 files), typecheck, 957/957 tests (114 files), Storybook
  build all green.

### Known issues / TODOs
- None blocking. Working tree left uncommitted for the human to commit/merge.

---

## CLOSED: 027 — promo-flip-menu-card-tweaks (done, 2026-07-16)

**Branch**: `feat/027-promo-flip-menu-card-tweaks`
**Spec folder**: `specs/027-promo-flip-menu-card-tweaks/`
**Final status**: `done` (reviewer APPROVED, implementer marked done)

Consolidated client-requested visual/UX changes, went through **two mid-flight
amendment rounds** after initial approval — see
`specs/027-promo-flip-menu-card-tweaks/SPEC_AUTHOR_SUMMARY.md` for the full
"## Amendment" / "## Amendment 2" trail. Final delivered scope:

- **Part A** — promo cards in the shared `PromotionsCarousel.vue`/`PromotionCard.vue`
  (homepage + `/promotions`) flip on click to reveal WordPress-sourced bilingual
  Terms & Conditions (`tyc_es`/`tyc_en` ACF fields, client-confirmed field names
  from a live WP admin screenshot). Flip requires BOTH languages non-empty — no
  same-language fallback (client-mandated correction after first review). Resets
  on carousel navigation; respects `prefers-reduced-motion`.
- **Part B** — Garantía Sumo star badge on `MenuDishCard.vue` enlarged `size-16` →
  `size-24`, confirmed clear of the top-right pink sticker.
- **Part C** (client scrapped the original "hero image" approach mid-implementation
  and replaced it with this) — Ramen XL renders as a **normal** `MenuDishCard` with
  a DB-driven "build your own" options selector: "Base de fideo" (4 choices) +
  "Proteína" (3 choices) + "Añade extra proteína" (+$29, modeled as a 2-choice
  group) — all sourced from two new generic tables, `menu_item_option_groups` /
  `menu_item_option_choices` (migration `0031`), attachable to any dish, editable
  from the DB with no code change (matches the `sauces` table precedent, NOT
  Vaso Sumo's old i18n-hardcoded pattern).
- **Part D** — "All You Can Eat Kids" gets an orange→blue gradient behind its
  image panel, via a standalone `menu_items.highlight_background` boolean
  (migration `0030`, reclaimed slot after the abandoned hero-column was deleted).
- **Part E** (added during the second amendment) — Vaso Sumo's 6 flavors, previously
  hardcoded via i18n keys `menu.vaso_sumo.flavor.*`, migrated onto the SAME
  option-groups system as Part C — now DB-editable, zero hardcoded flavor list
  left in code.

### Mid-flight scope change (important precedent)
After the spec was first approved and implementation began, the client changed
Part C's approach entirely (scrap hero image → normal card + DB options) and
added Part E. The leader stopped the in-progress implementer
(`TaskStop`), had `spec_author` amend `spec.md`/`plan.md`/`data-model.md`/
`research.md`/`tasks.md` in place (not a restart from scratch), got fresh human
approval, then relaunched a new implementer round. The first round's abandoned
artifacts (`MenuDishHero.vue`/`.spec.ts`/`.stories.ts`,
`server/db/migrations/0030_add_menu_item_display_variant.sql`, an in-progress
`displayVariant` column) were explicitly deleted, not adapted — confirmed zero
remaining references via grep before reviewer approval.

### Reviewer verdict
**APPROVED** (`specs/027-promo-flip-menu-card-tweaks/REVIEW.md`) — full
traceability, Constitution Check gates, 49/50 tasks `[x]`, CHECKPOINTS C1–C7,
`./init.sh` green (115 test files / 1002 tests), sensitive-data scan clean.
One non-blocking flagged follow-up: **T048 (Lighthouse spot-check)** could not
be run in the implementer/reviewer sandbox (no Chrome/Chromium binary) — a
human with real browser tooling should spot-check `/`, `/menu`, `/promotions`
before considering SC-007 fully closed. Not a rejection reason.

---

## Superseded — original (pre-amendment) 027 spec summary, kept for history only

The section below describes feature 027 as spec'd in the FIRST round, before
the client's mid-flight Part C rescope. Superseded by the closure entry above;
kept verbatim for the audit trail.

## SPEC READY: 027 — promo-flip-menu-card-tweaks

**Branch**: `feat/027-promo-flip-menu-card-tweaks`
**Spec folder**: `specs/027-promo-flip-menu-card-tweaks/`
**Status**: `spec_ready` (awaiting human approval gate before `in_progress`)

Consolidated client-requested visual/UX tweaks, 4 independent parts (all
client-instructed 2026-07-16):
- **Part A (P1)** — promo cards in the shared `PromotionsCarousel.vue`/`PromotionCard.vue`
  (homepage + `/promotions`) flip on click to reveal WordPress-sourced bilingual
  Terms & Conditions; resets on carousel navigation; respects
  `prefers-reduced-motion`; click-vs-drag is handled for free by Embla's
  existing internal click-suppression (verified against the installed
  `embla-carousel@8.6.0` source, no manual pointer-tracking needed).
- **Part B (P2)** — Garantía Sumo star badge on `MenuDishCard.vue` enlarged
  (client feedback: "no se nota"), confirmed clear of the top-right pink sticker.
- **Part C (P3)** — "Ramen XL" renders as a new `MenuDishHero.vue` component
  (large showcase visual) instead of a standard card, via a new additive
  `menu_items.display_variant` column (`'hero' | 'highlight' | null`) and a
  Vercel Blob asset at `menu/ala-carta/ramen_xl_hero.webp` (existing
  `BLOB_BASE_URL`/`resolveImageUrl()`/`replace-blob-images.ts` convention, no
  new upload pipeline).
- **Part D (P4)** — "All You Can Eat Kids" gets an orange→blue gradient behind
  its image panel (client's own stated fallback over introducing a new,
  non-token purple color), via the same `display_variant` column (`'highlight'`),
  as a prop on the existing `MenuDishCard.vue` (no new component needed).

**Skills invoked in order**: `/speckit-git-feature` → `/speckit.specify` →
`/speckit.plan` → `/speckit.tasks`. `/speckit.clarify` was **not** invoked —
`spec.md` had zero `[NEEDS CLARIFICATION]` markers (all ambiguous points had
reasonable defaults resolvable from the feature's own instructions and were
documented in the Assumptions section instead).

**Coordination dependency flagged (not silently assumed ready)**: Part A
requires a NEW bilingual WordPress ACF field pair (`terminos_es`/`terminos_en`)
on the `promociones` CPT that does **not exist yet** upstream — WP admin/ACF
configuration is out of this repo's scope per `docs/business/features.md` §9.
This repo's parse/type/UI plumbing ships regardless (every promo safely
projects `terms: null` until the field is added), but live end-to-end content
requires that out-of-repo step. Documented in `spec.md` Assumptions,
`research.md` R4, `data-model.md`, and `plan.md` Constitution Check.

**Main Phase -1 / Constitution Check gates** (full table in `plan.md`):
Article I (new `MenuDishHero.vue` stays in the `menu` feature folder; Part D
reuses `MenuDishCard.vue` via a prop instead of duplicating it); Article III
(WP terms stay WP-only, `display_variant` stays Neon-only — sources not
mixed); Article IV/VII (co-located Vitest specs + Storybook stories required
for every new/changed component, tracked per-task in `tasks.md`); Article V
(no new routes/routeRules — confirmed in `research.md` R7); Article X KISS
(no new npm package — flip is CSS `transform` only, click/drag handled by
Embla already; one shared enum-like `display_variant` column instead of two
booleans or a join table). No Complexity Tracking entries needed — no
violations.

Branch numbering note: the git-feature script auto-incremented to `028`
(because `specs/027-promo-flip-menu-card-tweaks/` already existed, pre-seeded
by the leader with `assets/source/ramen-xl-reference.jpg`); the branch was
renamed to `feat/027-promo-flip-menu-card-tweaks` to match the existing spec
folder and `feature_list.json`'s `spec_path`.

---

## CLOSED: 024 — menu-image-refresh-express-branding (see progress/history.md)

## CLOSED: 021 — menu-experience-overhaul (retroactive, 2026-07-16 — see progress/history.md)

## CLOSED: 022 — homepage-hero-promos-contact (retroactive, 2026-07-16 — see progress/history.md)

### Outstanding, unrelated to the 021/022 closure
- **PENDING production steps for 021** (human must run — coordinated, no Docker fallback):
  1. Apply migration: `pnpm db:migrate` (adds `drink_group.display_order` — additive).
  2. Reseed menu data: `pnpm db:seed` (rename `beers_spirits`→`beers`, split Destilados,
     consolidate Vaso Sumo, re-map `non_alcoholic`→sodas, 11 featured, wings no sauce).
  Do NOT run against production Neon until coordinated with the human.

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
