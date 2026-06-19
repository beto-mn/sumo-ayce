---
description: "Task list for feature 010 — Homepage (/)"
---

# Tasks: Homepage (`/`)

**Input**: Design documents from `specs/010-homepage/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/home-content.md, contracts/components.md

**Tests**: REQUIRED. Constitution Article IV mandates unit tests for every composable + server route; Article VII mandates a Storybook story for every UI component; feature 008 establishes co-located `Component.spec.ts`. Server-side logic is TDD (tests written first).

> **Content-sourcing (built state, reconciled 2026-06-20):** promotions → WordPress
> `promociones` endpoint via a Nitro route (the only live source; two-step home-flag →
> active fallback selection, 4s/3s fetch timeouts, Zod validation, `acf.imagen` media-ID
> resolution → lightbox); featured dishes/drinks → **static committed fixture** via
> `useFeaturedDishes` (route-compatible shape, swappable later — NOT a DB route); reviews →
> static committed fixture. There is **no** Drizzle/Neon import anywhere for this feature.

**Organization**: Grouped by user story (US1–US4 from spec.md) so each is independently testable.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies).
- **[Story]**: US1 (hero/MVP), US2 (type selector → menu), US3 (featured content), US4 (branches CTA), or `INFRA`/`POLISH`.

---

## Phase 1: Setup (Shared Infrastructure)

- [x] T001 [INFRA] Create the feature slice folders: `app/features/homepage/components/`, `app/features/homepage/composables/`, `app/features/homepage/utils/`, and `server/api/v1/content/`. (Article I.1)
- [x] T002 [P] [INFRA] Confirm `routeRules['/'] = { isr: 3600 }` is present and unchanged in `nuxt.config.ts`; do NOT modify it (Gate V.1).
- [x] T003 [P] [INFRA] Confirm the `WORDPRESS_API_URL` env var is declared in `server/utils/env.ts` Zod schema and present in `.env.example`; add if missing (Gate XIII). Consumed by the promotions route only. (No `DATABASE_URL` needed — featured dishes are a static fixture as built.)

---

## Phase 2: Foundational (Blocking Prerequisites)

**⚠️ CRITICAL**: blocks all user stories. Shared types, content endpoint, content composable, and the reservation trigger must exist before sections can render real data.

### Shared types

- [x] T004 [INFRA] Define normalized view types in `types/content.ts`: `Bilingual`, `SumoType`, `FeaturedDish`, `Promotion`, `Review`, `HomeContent`, `FeaturedDishesResult`, `PromotionsResult`, `HeroConfig` (per data-model.md §1). Strict TS, no `any` (Gate II). (Replaces the old `HomeContentResult`.)

### Promotions endpoint — WordPress (TDD — tests first)

- [x] T005 [P] [INFRA] Create centralized WordPress `promociones` fixture/mock in `tests/mocks/wordpress.ts` (valid + invalid + empty + unreachable cases). (Gate IV.3)
- [x] T006 [INFRA] Write Zod validators in `server/api/v1/content/validators.ts` for the upstream `promociones` shape (per data-model.md §2a). Drop invalid items individually.
- [x] T007 [INFRA] Write the failing server test `tests/.../promotions.spec.ts` (node env): route returns ≤3 newest active promos on valid WP data (PRIMARY `?activa=1&home=1`), falls back to `?activa=1` only when PRIMARY is empty, drops invalid items, resolves `acf.imagen` media IDs to URLs (null on media failure), returns `{ promotions: [], ok: false }` HTTP 200 on upstream failure/timeout, never leaks upstream error bodies (per contracts/home-content.md). Tests MUST fail first.
- [x] T008 [INFRA] Implement `server/api/v1/content/promotions.get.ts`: fetch the WP `promociones` endpoint server-side with timeouts (4s list / 3s media), validate via T006, map to `Promotion[]`, apply the two-step selection (PRIMARY `?activa=1&home=1&per_page=100` capped to 3 newest → FALLBACK `?activa=1&per_page=100` capped to 3 newest only if PRIMARY empty), resolve each `acf.imagen` media ID to a URL, delegate failures to `server/utils/error-handler.ts` as `ExternalServiceError`, return graceful `{ promotions, ok }`. NO Neon/Drizzle import. Make T007 pass. (Gates VI.1, XII.1, V.3)

### Featured dishes — static fixture

- [x] T008a [INFRA] Featured-dishes rail backed by a static fixture (`app/features/homepage/data/featured-dishes.ts`) shaped to the `FeaturedDish` view contract. No DB/Drizzle import under `app/` (Gate V.2 holds — the fixture is plain typed data). (Gate IV.3)
- [x] T008b [INFRA] `useFeaturedDishes.spec.ts` covers the fixture-backed contract (`dishes`/`ok`/`pending`) so a future swap to a real data source is drop-in.
- [x] T008c [INFRA] `useFeaturedDishes.ts` reads the static fixture and returns the route-compatible `{ dishes, ok, pending }` shape, carrying a `// TODO:` marker for a future real data source. (Gates V.2/V.3)

### Promotions selection (pure, TDD)

- [x] T009 [P] [INFRA] Write failing `app/features/homepage/utils/select-promotions.spec.ts`: filter `active` (any `tipo`, incl. express), sort publish-date desc, slice 3 (per research.md R3). This is the page-side **defensive** pass; the route already does the home-flag selection.
- [x] T010 [INFRA] Implement `app/features/homepage/utils/select-promotions.ts` to pass T009 (function ≤ 30 lines).

### Composables

- [x] T011 [P] [INFRA] Write failing `app/features/homepage/composables/usePromotions.spec.ts` (happy-dom): returns `promotions` + `ok` + `pending`; uses `useFetch('/api/v1/content/promotions')`; empty array when `ok===false`; imports no DB/dishes composable (Gate V.3).
- [x] T012 [INFRA] Implement `app/features/homepage/composables/usePromotions.ts` to pass T011 (per contracts/home-content.md). Aliased imports only (Gate XI).
- [x] T012a [P] [INFRA] Write failing `app/features/homepage/composables/useFeaturedDishes.spec.ts` (happy-dom): returns `dishes` + `ok` + `pending`; uses `useFetch('/api/v1/content/featured-dishes')`; empty array when `ok===false`; imports no Drizzle/Neon nor the promotions composable (Gates V.2/V.3).
- [x] T012b [INFRA] Implement `app/features/homepage/composables/useFeaturedDishes.ts` to pass T012a (per contracts/home-content.md). Aliased imports only (Gate XI).
- [x] T012c [P] [INFRA] Author the static reviews fixture `app/features/homepage/data/reviews.ts` (or `reviews.json`) typed as `Review[]` from `@/types/content` (FR-017, R5). 3–5 realistic entries; structured so a later feature can swap the source. No fetch.
- [x] T013 [P] [INFRA] Write failing `app/composables/useReservationModal.spec.ts`: `useState`-backed `isOpen`, `openReservation()`/`closeReservation()`, no-op-safe with no mounted consumer.
- [x] T014 [INFRA] Implement `app/composables/useReservationModal.ts` (cross-feature, NOT in a feature folder) to pass T013 (Gate I.2, R6).

### Hero price config

- [x] T015 [P] [INFRA] Expose the configurable hero price (default `"$269"`) via runtime config / env mapped to `HeroConfig` so it is editable without code change (FR-007).

### i18n scaffolding

- [x] T016 [INFRA] Add the `home.*` namespace skeleton (keys for hero headline/kicker, section titles, CTA labels, fallback strings) to `i18n/locales/es.json` (ES) and `i18n/locales/en.json` (EN). Honor brand copy rules: "All You Can Eat", "Estilo americano-japonés" (FR-021).

**Checkpoint**: Data layer (promotions route + dishes route + reviews fixture) + triggers + i18n keys exist. Sections can now consume real (mockable) content.

---

## Phase 3: User Story 1 — Land and understand the offer (P1) 🎯 MVP

**Goal**: A fast, legible hero with headline, kicker, configurable price sticker, photo, and marquee.
**Independent Test**: Load `/` @360px on throttled 4G; headline/kicker/price legible, no horizontal overflow, interactive < 2s.

- [x] T017 [P] [US1] Write failing `app/features/homepage/components/HomeHero.spec.ts`: renders headline "ALL YOU CAN EAT", renders kicker via `Kicker`, renders price from prop via `Sticker`, renders marquee; ES default copy.
- [x] T018 [US1] Implement `app/features/homepage/components/HomeHero.vue` reusing `Kicker`, `Sticker`, `Marquee`; rotated photo frame; hero image prioritized (eager + `fetchpriority`); legible/no-overflow @360px; tokens only, no inline hex; file ≤ 200 lines (FR-006/007/008/024).
- [x] T019 [P] [US1] Add `app/features/homepage/components/HomeHero.stories.ts`: Default + price-variant + responsive (360/mobile/desktop) + reduced-motion note (Gate VII.5).
- [x] T020 [US1] Create `app/pages/index.vue` rendering `HomeHero` (price from `HeroConfig`); add bilingual SEO meta via `useSeoMeta`; template ≤ 100 lines (Gate I.5). MVP page renders.

**Checkpoint**: `/` loads with a working, legible, fast hero — standalone MVP.

---

## Phase 4: User Story 2 — Choose a SUMO type and head to the menu (P1)

**Goal**: Two accent-correct cards routing to the menu pre-filtered by type.
**Independent Test**: AYCE card → `/menu?type=ayce`; Express card → `/menu?type=express`; blue appears only on the Express card.

- [x] T021 [P] [US2] Write failing `app/features/homepage/components/HomeTypeSelector.spec.ts`: two cards; AYCE links `/menu?type=ayce` (orange/`accent="ayce"`), Express links `/menu?type=express` (blue/`accent="express"`); keyboard-focusable; accessible names (FR-009/010/011, FR-023).
- [x] T022 [US2] Implement `app/features/homepage/components/HomeTypeSelector.vue` reusing `Card` (`accent` prop) + `NuxtLink`; blue confined to the Express card via `scope-express` (Gate VII.4); tokens only.
- [x] T023 [P] [US2] Add `HomeTypeSelector.stories.ts`: Default + AYCE/Express side-by-side + responsive.
- [x] T024 [US2] Wire `HomeTypeSelector` into `app/pages/index.vue` (section order position 2). Keep template ≤ 100 lines.

**Checkpoint**: Visitors can route into the menu by type. US1 + US2 independently functional.

---

## Phase 5: User Story 3 — Browse featured content (P2)

**Goal**: Featured dishes rail (static fixture), top-3 selected promotions (WordPress, with flyer lightbox), and reviews (static fixture); the promotions section self-hides when empty / on outage; dishes + reviews always render.
**Independent Test**: With seeded WordPress promotions → rail scrolls (styled scrollbar), ≤3 selected promos render and flyers open in the lightbox, reviews render; with WP unreachable → all static sections (incl. dishes + reviews) still render, promotions section hidden.

### Reusable leaf cards (extracted per Article I.4)

- [x] T025 [P] [US3] `DishCard`: failing `DishCard.spec.ts` (name+image, null image → placeholder) → implement `DishCard.vue` (reuse `Card`/`Sticker`) → `DishCard.stories.ts` (Default + no-image + badge). (FR-013)
- [x] T026 [P] [US3] `PromoCard`: failing `PromoCard.spec.ts` (bilingual fields w/ ES fallback; badge tone from `acf.color` w/ orange fallback; type-bar from `acf.tipo` express→blue/ayce→orange/all→ink; interactive + emits `open` flyer payload when `imageUrl` set, non-interactive otherwise; neutral validity text) → implement `PromoCard.vue` (reuse `Card`/`Sticker`) → `PromoCard.stories.ts` (Default + colors + express type-bar + long-text + missing-EN + with/without flyer). (FR-015/016/016a)
- [x] T026a [P] [US3] `Lightbox` (reusable UI primitive, `app/components/ui/Lightbox.vue`): failing `Lightbox.spec.ts` (teleported dialog; opens on `open && src`; Esc/backdrop close; focus trap to close button; body scroll lock) → implement → `Lightbox.stories.ts`. Used by `HomePromotions` to show the promo flyer. (FR-016a)
- [x] T027 [P] [US3] `ReviewCard`: failing `ReviewCard.spec.ts` (author, rating stars, text) → implement `ReviewCard.vue` (reuse `Card`) → `ReviewCard.stories.ts` (Default + 1-star/5-star). Renders a single `Review` from the static fixture. (FR-017)

### Sections

- [x] T028 [P] [US3] `HomeFeaturedRail`: failing spec (horizontal scroll-snap track with a visible styled scrollbar + adaptive card width; `dishes:[]` → renders nothing) → implement `HomeFeaturedRail.vue` (uses `DishCard`) → stories (Default + empty + responsive). (FR-012)
- [x] T029 [P] [US3] `HomePromotions`: failing spec (renders ≤3 `PromoCard`; `[]` → hidden; opening a promo flyer mounts `UiLightbox` with the flyer src/alt) → implement `HomePromotions.vue` (owns the lightbox state, listens to `PromoCard @open`) → stories (Default 3 + fewer + empty + with-flyer). (FR-014/016/016a)
- [x] T030 [P] [US3] `HomeReviews`: failing spec (renders `ReviewCard`s from the static fixture; `[]` → hidden defensively) → implement `HomeReviews.vue` → stories (Default + empty + responsive). (FR-017)
- [x] T031 [US3] Wire `HomeFeaturedRail` (fed by `useFeaturedDishes` static fixture), `HomePromotions` (fed by `usePromotions`, passed through `select-promotions` defensively), and `HomeReviews` (fed by the static reviews fixture) into `app/pages/index.vue` (positions 3/4/5); the promotions section self-hides on empty; dishes and reviews always render from their fixtures (FR-002/025). Keep template ≤ 100 lines.
- [x] T032 [US3] Add the graceful-degradation spec `app/features/homepage/components/home-degradation.spec.ts`: WordPress-promotions outage/empty → page renders all static sections (hero, type selector, featured dishes, reviews, branches CTA), promotions section hidden, no error surfaced (SC-006, FR-025).

**Checkpoint**: Full editorial content renders and degrades gracefully. US1–US3 functional.

---

## Phase 6: User Story 4 — Convert to a branch visit or reservation (P2)

**Goal**: A CTA band linking to branches and triggering the reservation overlay (open-intent only).
**Independent Test**: branches CTA → `/sucursales`; reserve CTA → `openReservation()` called (no error with no modal mounted).

- [x] T033 [P] [US4] Write failing `HomeBranchesCta.spec.ts`: branches control links `/sucursales`; reserve control calls `useReservationModal().openReservation()`; no-op-safe (FR-018/019).
- [x] T034 [US4] Implement `app/features/homepage/components/HomeBranchesCta.vue` reusing `Button` + `NuxtLink`; calls `openReservation()` via `@/composables`; tokens only.
- [x] T035 [P] [US4] Add `HomeBranchesCta.stories.ts`: Default + responsive.
- [x] T036 [US4] Wire `HomeBranchesCta` into `app/pages/index.vue` (position 6). Final section order verified (FR-002). Keep template ≤ 100 lines.

**Checkpoint**: All four stories functional end-to-end.

---

## Phase 7: Polish & Cross-Cutting

- [x] T037 [P] [POLISH] Finalize ES + EN `home.*` copy in both locale files; verify language toggle updates every string with no mixed-language state (SC-009, FR-020).
- [x] T038 [P] [POLISH] Reduced-motion pass: confirm marquee static and all reveal/bounce disabled under `prefers-reduced-motion`; reveals animate `transform` only (SC-008, FR-022).
- [x] T039 [P] [POLISH] Accessibility pass: keyboard operability + visible focus on all type cards/CTAs/toggle; alt text on images; hit targets ≥ 44px (FR-023, Gate VII.3).
- [x] T040 [POLISH] No-inline-hex grep over new files must return zero:
      `grep -rEn '(style=|: ?)#[0-9a-fA-F]{3,8}\b' app/features/homepage/ app/pages/index.vue` (Gate VIII, feature 008 T108c).
- [x] T041 [POLISH] Run `pnpm check && pnpm typecheck && pnpm test && pnpm build`; all green; new specs counted (Gate IX).
- [~] T042 [POLISH] DEFERRED — Lighthouse on `/` (≥ 90 all metrics; interactive < 2s on throttled 4G) requires a running deployment/preview and is verified post-deploy on the CI preview link (feature 009), not in this implementation pass. Performance affordances are in place (hero image `loading=eager` + `fetchpriority=high`, below-fold images `loading=lazy`, ISR 3600, tokens-only CSS). (SC-001/SC-002, Gate V)
- [x] T043 [POLISH] Run quickstart.md verification table; update `docs/business/rendering-strategy.md` §4 only if anything about `/`'s row changed (it should not).

---

## Dependencies & Execution Order

### Phase dependencies
- **Setup (P1)** → no deps.
- **Foundational (P2)** → after Setup. BLOCKS all user stories (types, endpoint, composables).
- **US1 (P3)** → after Foundational. MVP.
- **US2 (P4)** → after Foundational; independent of US1 (different files; both touch `index.vue` sequentially — T024 after T020).
- **US3 (P5)** → after Foundational; needs `usePromotions` + `useFeaturedDishes` (static fixture) + reviews fixture + `select-promotions` (T010/T012/T012b/T012c) + leaf cards + `Lightbox` (T026a).
- **US4 (P6)** → after Foundational; needs `useReservationModal` (T014).
- **Polish (P7)** → after all desired stories.

### Within each story
- Tests written and FAILING before implementation (Article IV).
- Leaf cards (DishCard/PromoCard/ReviewCard) before the sections that use them.
- Sections before their `index.vue` wiring task.
- Shared `index.vue` edits (T020, T024, T031, T036) are sequential — same file, not `[P]` against each other.

### Parallel opportunities
- T002/T003 (Setup) in parallel.
- T005, T008a, T009, T011, T012a, T012c, T013, T015 (Foundational, different files) in parallel.
- The promotions route (T006–T008) and the featured-dishes static fixture + composable (T008a–T008c) are independent (different files) and may proceed in parallel.
- All `*.spec.ts` writing tasks marked [P] in parallel within a story.
- T025/T026/T027 (leaf cards) fully parallel; T028/T029/T030 (sections) parallel once their cards exist.
- Polish tasks T037/T038/T039 parallel.

---

## Implementation Strategy

### MVP first
1. Setup (T001–T003) → Foundational (T004–T016, incl. T008a–c / T012a–c) → US1 (T017–T020).
2. STOP & VALIDATE: `/` hero loads, legible @360px, < 2s on 4G.

### Incremental delivery
US1 (MVP) → US2 (menu routing) → US3 (editorial content + graceful degradation) → US4 (reservation/branches CTA) → Polish. Each adds value without breaking the prior.

---

## Notes
- [P] = different files, no dependencies. Shared `app/pages/index.vue` edits are never mutually [P].
- Every new component ships `.vue` + `.spec.ts` + `.stories.ts` (no merge without a story — Gate VII.5).
- Verify each spec FAILS before implementing.
- Commit per task or logical group; Conventional Commits, no `--no-verify` (Gate IX).
- NEVER import a Neon/Drizzle client under `app/` (none is imported anywhere for this feature). Promotions via `usePromotions` → `/api/v1/content/promotions` (WordPress, the only live source); featured dishes via `useFeaturedDishes` (static fixture, route-compatible shape — no DB route); reviews from the static fixture (Gates V.2/V.3, III.2).
