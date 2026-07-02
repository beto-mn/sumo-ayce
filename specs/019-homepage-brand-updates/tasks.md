---
description: "Task list for Homepage & Global Brand/Copy Updates"
---

# Tasks: Homepage & Global Brand/Copy Updates

**Input**: Design documents from `specs/019-homepage-brand-updates/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/i18n-keys.md, quickstart.md
**Source of truth for copy**: [client-brief.md](./client-brief.md) · exact strings in [contracts/i18n-keys.md](./contracts/i18n-keys.md)

**Tests**: REQUIRED by constitution Article IV (co-located Vitest spec per changed component)
and Article VII (co-located Storybook story per changed component, ≤200 lines).

**Organization**: Tasks grouped by user story (US1, US2, US3 from spec.md). US1 is the MVP.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependency on an incomplete task)
- **[Story]**: US1 / US2 / US3 (Setup, Foundational, Polish have no story label)

## Path Conventions

Nuxt 4 single repo. Components under `app/features/homepage/components/` and
`app/components/layout/`; pages under `app/pages/`; i18n under `i18n/locales/`; assets under
`public/`; seed under `server/db/seeds/`. Co-located tests/stories sit next to each component.

---

## Phase 1: Setup

**Purpose**: Confirm environment before any edits.

- [x] T001 Confirm branch `feat/019-homepage-brand-updates` is checked out and the dev server, Vitest, `vue-tsc`, Biome and Storybook all run clean on a baseline (no pre-existing failures) before making changes.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Assets, font, and all i18n copy must exist before component/page edits and their tests can assert against them.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [x] T002 [P] Optimize and add the hero-frame logo: take `/Users/betonajera/Documents/Projects/Clients/SUMO/Assets/Logo/sumo.webp` (~1.76MB), resize to the rendered frame dimensions (retina 2× max) and recompress to `< ~200KB` WITHOUT altering the artwork, then save to `public/brand/sumo.webp`. (research.md R4)
- [x] T003 [P] Add the self-hosted Anton font: download Anton Regular (Google Fonts, OFL) as `woff2`, commit it to `public/fonts/anton-regular.woff2`, add a scoped `@font-face` (`font-family: "Anton"; font-display: swap;`) in the global stylesheet plus a headline utility class that uses ONLY `--ink` (box) and `--orange` (text) tokens, and add `<link rel="preload" as="font" type="font/woff2" crossorigin>` for the font. Do NOT change the global `--disp`/Bricolage usage. (research.md R1/R3)
- [x] T004 Update `i18n/locales/es.json` AND `i18n/locales/en.json` with ALL copy from `contracts/i18n-keys.md`: ADD `home.seo.title`, `home.seo.description`, `home.featured.heading`; UPDATE `home.hero.kicker`, `home.hero.subtitle`, `home.marquee` (7-item array, order per contract), `home.typeSelector.kicker`, `home.typeSelector.title`, `home.typeSelector.ayce.desc`, `home.typeSelector.express.desc` and the AYCE/Express card name/badge keys so cards read "All You Can Eat" / "Express" prominently, `home.featured.title`, `home.featured.subtitle`, `home.branches.title`, `footer.brand.blurb`, `brand.tagline`, `footer.brand.tagline`, `branches.page.heading`, `branches.page.title`, `promotions.page.heading`, `promotions.seo.title`, `reservation.page_title`, `menu.category.drinks`; REMOVE every "Estilo americano-japonés"/"American-Japanese style". Keep exact ES verbatim and EN per contract; keep ES↔EN key parity and equal `home.marquee` array length. Do NOT touch `home.hero.headline` or `home.hero.logoAlt`.

**Checkpoint**: Assets, font, and bilingual copy are in place — user stories can now proceed in parallel.

---

## Phase 3: User Story 1 — Refreshed hero (Priority: P1) 🎯 MVP

**Goal**: Hero renders the styled real-text "ALL YOU CAN EAT" headline (Anton flat treatment), the new kicker/subtitle, and the new illustrated hero-frame logo.

**Independent Test**: Load `/` at 360px and desktop in ES and EN; headline is selectable real text, screen reader announces the full phrase once, reduced-motion disables rotation animation, hero frame shows `sumo.webp`, nav/footer still show `sumo-horizontal.svg`, kicker/subtitle read the new copy.

### Implementation for User Story 1

- [x] T005 [US1] Edit `app/features/homepage/components/HomeHero.vue`: render the `<h1>` as CSS-styled real text using the Anton headline utility — two staggered lines "ALL YOU" / "CAN EAT", each an `--ink` box with `--orange` text, uppercase, second line offset right, slight OPPOSITE static rotation per line, NO border, NO drop-shadow; expose the full `home.hero.headline` string as the accessible name (aria-label or sr-only full string with the visual split `aria-hidden`); disable rotation *animation* under `@media (prefers-reduced-motion: reduce)`; bind kicker to `home.hero.kicker` and subtitle to `home.hero.subtitle`; swap the hero-frame logo `src` to `/brand/sumo.webp` keeping the existing tilted/rounded frame slot and `home.hero.logoAlt`, with explicit `width`/`height` to avoid CLS. Composition API, tokens only, no inline hex, ≤200 lines, functions ≤30 lines.
- [x] T006 [US1] Update/extend co-located `app/features/homepage/components/HomeHero.spec.ts` (Vitest + @vue/test-utils): assert the `<h1>` accessible name equals the `home.hero.headline` text; assert the headline text is present as real text (not an `<img>`); assert reduced-motion behavior (no rotation-animation class/style when reduced motion is set); assert hero logo `src` is `/brand/sumo.webp` with the correct alt; assert kicker and subtitle render the ES and EN values. Behavior-named tests; all green.
- [x] T007 [US1] Update/extend co-located `app/features/homepage/components/HomeHero.stories.ts`: Default story, a reduced-motion variant, and mobile (360/520) + desktop viewport annotations. ≤200 lines.

**Checkpoint**: US1 hero fully functional and independently testable.

---

## Phase 4: User Story 2 — Homepage section copy (Priority: P1)

**Goal**: Marquee, type selector, featured rail, branches CTA and footer show the refreshed bilingual copy.

**Independent Test**: Scroll `/` in ES and EN; each section matches `contracts/i18n-keys.md` exactly (marquee 7 items in order, type-selector cards read "All You Can Eat"/"Express", featured rail has 3 lines, branches CTA and footer blurb updated).

### Implementation for User Story 2

- [x] T008 [P] [US2] Edit `app/components/layout/SiteMarquee.vue` to render the 7 new `home.marquee` items (unchanged tm()/rt() pattern, orange-star separator kept); then update `app/components/layout/SiteMarquee.spec.ts` to assert the 7 item texts and order per locale, and `app/components/layout/SiteMarquee.stories.ts` with Default + responsive. Tokens only, ≤200 lines each.
- [x] T009 [P] [US2] Edit `app/features/homepage/components/HomeTypeSelector.vue`: kicker `home.typeSelector.kicker` ("AYCE - EXPRESS"), title `home.typeSelector.title`, re-map existing name/badge keys so the AYCE card reads "All You Can Eat" and the Express card reads "Express" prominently (ONE component — no duplication, Article I), bind descriptions to `home.typeSelector.ayce.desc` / `home.typeSelector.express.desc`; then update `HomeTypeSelector.spec.ts` to assert both card prominent titles and descriptions per locale, and `HomeTypeSelector.stories.ts` with a Default showing both cards + responsive. ≤200 lines each.
- [x] T010 [P] [US2] Edit `app/features/homepage/components/HomeFeaturedRail.vue` to add a heading slot so the section shows three lines — label `home.featured.title`, heading `home.featured.heading` ("Garantía Sumo"), subtitle `home.featured.subtitle`; then update `HomeFeaturedRail.spec.ts` to assert all three lines per locale, and `HomeFeaturedRail.stories.ts` with Default + responsive. ≤200 lines each.
- [x] T011 [P] [US2] Edit `app/features/homepage/components/HomeBranchesCta.vue` to bind the title to the updated `home.branches.title`; then update `HomeBranchesCta.spec.ts` to assert the title per locale, and `HomeBranchesCta.stories.ts` with Default + responsive. ≤200 lines each.
- [x] T012 [P] [US2] Edit `app/components/layout/SiteFooter.vue` to bind the blurb to `footer.brand.blurb` and tagline to `footer.brand.tagline` ("Buffet preparado al instante"), leaving the nav/footer logo as `/brand/sumo-horizontal.svg` unchanged; then update `SiteFooter.spec.ts` to assert blurb + tagline per locale AND that the logo `src` is still `sumo-horizontal.svg`, and `SiteFooter.stories.ts` with Default + responsive. ≤200 lines each.

**Checkpoint**: US1 + US2 both work independently; the homepage reads fully refreshed in both locales.

---

## Phase 5: User Story 3 — Site-wide tagline, page titles, SEO, drinks label (Priority: P2)

**Goal**: Consistent tagline site-wide, correct H1 + SEO/tab titles on Branches/Promotions/Reserve, dedicated homepage SEO keys, and the updated menu drinks label.

**Independent Test**: Visit `/branches`, `/promotions`, `/reserve`, `/menu` and `/`'s `<head>` in both locales; verify H1s, tab titles, homepage SEO, drinks chip/section, and zero stale tagline.

### Implementation for User Story 3

- [x] T013 [P] [US3] Edit `app/pages/index.vue` so `useSeoMeta` sources title from `home.seo.title` and description from `home.seo.description` (stop deriving from `home.hero.headline` / `home.hero.kicker`).
- [x] T014 [P] [US3] Edit `app/pages/branches.vue` so the visible H1 uses `branches.page.heading` and the SEO/tab title uses `branches.page.title` (both "Sucursales Sumo" / "Sumo Branches").
- [x] T015 [P] [US3] Edit `app/pages/promotions.vue` so the visible H1 uses `promotions.page.heading` and the SEO/tab title uses `promotions.seo.title` (both "Promociones Sumo" / "Sumo Promotions").
- [x] T016 [P] [US3] Edit `app/pages/reserve.vue` so the visible H1 and the SEO/tab title (`reservation.page_title`) both read "Reservas Sumo" / "Sumo Reservations".
- [x] T017 [P] [US3] Align `server/db/seeds/menuCategories.ts` drinks category: `nameEs: 'Bebidas y coctelería'`, `nameEn: 'Drinks & cocktails'` (seed-only consistency, NO migration, NO prod DB write). The runtime label is already i18n-driven via `menu.category.drinks` (updated in T004).

**Checkpoint**: All three user stories independently functional.

---

## Phase 6: Polish & Cross-Cutting Gates

**Purpose**: Verify constitution gates and success criteria before merge. Sequential.

- [x] T018 Verify WCAG AA contrast for the headline: confirm `--orange` on `--ink` = 6.30:1 (documented in research.md R2) still holds with the final tokens (SC-003, gate G8).
- [x] T019 Grep guard: `grep -rin "americano-jap\|American-Japanese" i18n/ app/` returns zero matches (SC-004).
- [x] T020 i18n key-parity check: `i18n/locales/es.json` and `en.json` have identical key paths and equal `home.marquee` array length; every value present in both (gate G12).
- [x] T021 Performance: run Lighthouse on `/` (mobile) — perf ≥90 after adding the font + webp; confirm `public/brand/sumo.webp` is `< ~200KB` and Anton is preloaded with `font-display: swap` (SC-008, gate G5).
- [x] T022 Run all quality gates green: `biome check .`, `vue-tsc --noEmit`, `vitest run`; confirm every changed component has a passing co-located `.spec.ts` and a `.stories.ts` ≤200 lines, each component file ≤200 lines, no `console.log`/dead code (SC-010, gates G7/G10/G13).
- [x] T023 Run `quickstart.md` verification checklist end-to-end (SC-001, SC-002, SC-005, SC-006, SC-007, SC-009) in ES and EN.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: no dependencies.
- **Foundational (Phase 2)**: T002/T003 parallel; T004 (i18n) blocks all component/page tests. BLOCKS all user stories.
- **User Stories (Phases 3–5)**: all depend on Phase 2. US1, US2, US3 are independent of each other and can proceed in parallel once Phase 2 is done.
- **Polish (Phase 6)**: depends on all user stories complete.

### Within Each User Story

- Component edit → its co-located spec → its co-located story (or edit+spec+story together per bundled task).
- No cross-story file conflicts: each component/page is touched by exactly one task.

### Parallel Opportunities

- T002 and T003 in parallel; both before T004's dependents.
- Once Phase 2 is complete: T005 (US1), T008–T012 (US2), T013–T017 (US3) are all `[P]` — different files, no shared-file conflicts.

---

## Parallel Example: after Foundational

```bash
# US2 section-copy components (different files, run together):
Task: "Edit + spec + story SiteMarquee.vue"       # T008
Task: "Edit + spec + story HomeTypeSelector.vue"  # T009
Task: "Edit + spec + story HomeFeaturedRail.vue"  # T010
Task: "Edit + spec + story HomeBranchesCta.vue"   # T011
Task: "Edit + spec + story SiteFooter.vue"        # T012

# US3 pages + seed (different files, run together):
Task: "Edit index.vue SEO keys"        # T013
Task: "Edit branches.vue H1+SEO"       # T014
Task: "Edit promotions.vue H1+SEO"     # T015
Task: "Edit reserve.vue H1+SEO"        # T016
Task: "Align menuCategories.ts seed"   # T017
```

---

## Implementation Strategy

### MVP First (User Story 1)

1. Phase 1 Setup.
2. Phase 2 Foundational (assets + font + i18n) — CRITICAL, blocks everything.
3. Phase 3 US1 (hero) → validate independently → demo the new hero.

### Incremental Delivery

1. Setup + Foundational → foundation ready.
2. US1 (hero) → test → demo (MVP).
3. US2 (section copy) → test → demo.
4. US3 (tagline/titles/SEO/drinks) → test → demo.
5. Phase 6 gates → merge.

---

## Notes

- [P] = different files, no dependency on an incomplete task.
- Copy is transcribed once in `contracts/i18n-keys.md`; tasks reference keys, not restated strings.
- Tokens only — no inline hex anywhere; headline uses `--ink`/`--orange`.
- No new routes, no DB migration; drinks label is i18n-only (seed alignment only).
- Every changed component MUST end with a passing co-located spec and a ≤200-line story.
- Commit per task or logical group; never `--no-verify`.
