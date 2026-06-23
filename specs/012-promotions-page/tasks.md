---
description: "Task list for feature 012 — Promotions Page (/promotions)"
---

# Tasks: Promotions Page (`/promotions`)

**Feature ID**: 012
**Input**: Design documents from `specs/012-promotions-page/`
**Prerequisites**: spec.md, plan.md

**Tests**: REQUIRED. Constitution Article IV mandates unit tests for every server route and
composable; Article VII mandates Storybook coverage for every UI component. Server-side
logic is TDD (tests written first, implementation makes them pass).

**Organization**: Grouped by workstream. Each workstream is independently deliverable.

## Format: `[ID] [P?] [WS] Description`

- **[P]**: Can run in parallel (no file dependency on other P-marked tasks in the same phase).
- **[WS]**: Workstream — `SERVER` | `FEAT` | `PAGE` | `POLISH`.

---

## Phase 1: Setup

- [x] T001 [SERVER] Verify `routeRules['/promotions'] = { isr: 60 }` is present in
      `nuxt.config.ts` (already confirmed at line 85). Do NOT modify it.
- [x] T002 [P] [FEAT] Create feature slice folders:
      `app/features/promotions/components/`,
      `app/features/promotions/composables/`. (Article I)

---

## Phase 2: Shared Types & Utilities (blocks SERVER and FEAT workstreams)

- [x] T003 [SERVER] Confirm `Promotion`, `PromotionsResult`, and `BilingualString` are exported
      from `types/content.ts` (created in feature 010). If any are missing, add them without
      modifying existing exports. (spec FR-010, Gate II.2)
- [x] T004 [P] [FEAT] Create `app/features/promotions/types.ts` — export `LightboxState`
      (`{ open: boolean, imageUrl: string | null }`) for the page-level lightbox reactive state.
      Strict TS, no `any`. (Gate II.1)

**Checkpoint**: `Promotion`, `PromotionsResult` types compile.
No workstream can proceed without T003 resolved.

---

## Phase 3: Server Route (workstream SERVER — TDD)

- [x] T006 Add failing tests to `server/api/v1/content/promotions.spec.ts` for the `?all=1`
      code path (add to the existing test file — do NOT create a new one):
      - `GET /api/v1/content/promotions?all=1` with 5 active promos (no home flag) → returns
        all 5, `ok: true`. (Verifies no 3-cap is applied.)
      - `GET /api/v1/content/promotions?all=1` with WP error → `{ promotions: [], ok: false }`.
      - `GET /api/v1/content/promotions?all=1` with media failure on one promo → `ok: true`,
        that promo has `imageUrl: null`, others unaffected.
      - Existing homepage tests MUST still pass (regression guard). (Gate IV.1, FR-005–FR-010)
      Tests MUST fail first.

- [x] T007 Extend `server/api/v1/content/promotions.get.ts` to support `?all=1`:
      - Read `const { all } = getQuery(event)` at the top of the handler.
      - When `all === '1'`: fetch `activePromocionesUrl()` directly (already defined), skip
        `capActiveNewest`, call `resolveImages` on all active items, and return.
      - Default path (no param or `all !== '1'`): existing homepage logic unchanged.
      - No new helpers, no new files. File stays ≤ 200 lines. (FR-005–FR-006, Gate VIII)

- [x] T008 Make T006 tests pass.

- [x] T009 Run the full test suite (`pnpm test`) — ALL existing promotions tests MUST still
      pass with zero regressions. (Gate I.4)

---

## Phase 4: Feature Slice (workstream FEAT — can proceed after T003/T004)

### `PromotionCard` component

- [x] T010 [P] Write failing `app/features/promotions/components/PromotionCard.spec.ts`
      (happy-dom):
      - Renders badge (localized), title (localized), description (localized), validity (localized).
      - Express card (`tipo='express'`) has the blue-accent wrapper class / CSS variable swap.
      - Non-express card uses the `acf.color` mapped token class (not blue).
      - Card with `imageUrl` set: has pointer cursor; click emits `open-lightbox` with the URL.
      - Card with `imageUrl: null`: has default cursor; click does NOT emit `open-lightbox`.
      - Keyboard: Enter on focused interactive card emits `open-lightbox`.
      Tests MUST fail first. (Gate IV.2, FR-013–FR-016)

- [x] T011 Implement `app/features/promotions/components/PromotionCard.vue`:
      - Props: `promotion: Promotion` (from `types/content.ts`), locale string resolved
        externally (use `useI18n()` + `promotion.badge.es/en`, etc.).
      - Emits: `open-lightbox(imageUrl: string)` — only when `promotion.imageUrl !== null`.
      - Type-indicator bar: `tipo=express` → blue token, `tipo=ayce` → orange token,
        `tipo=all` → ink token. Implemented via a computed class, no inline hex.
      - Card accent: `--accent` CSS variable swap on the wrapper. `tipo=express` → `--blue`;
        others → token derived from `promotion.color` (default: `--orange`). Tokens only.
      - Interactive state: `tabindex="0"`, `role="button"` (or `<button>`), `@click` and
        `@keydown.enter` only when `promotion.imageUrl !== null`.
      - Non-interactive state: no `tabindex`, no `@click`.
      - Uses `UiCard`, `UiKicker` (or `UiSticker` for the badge) from design system.
      - File ≤ 200 lines; functions ≤ 30 lines; no inline hex. (FR-013–FR-016, Gate VIII)

- [x] T012 Make T010 tests pass.

- [x] T013 [P] Add `app/features/promotions/components/PromotionCard.stories.ts`:
      - Default (AYCE, with image — interactive).
      - Express (blue accent, with image).
      - No image (non-interactive, default cursor).
      - `tipo=all` (ink type-indicator bar).
      - Long title/description (wrap test).
      - Responsive (360px / 520px / 880px). (Gate VII.4)

### `PromotionsGrid` component

- [x] T014 [P] Write failing `app/features/promotions/components/PromotionsGrid.spec.ts`
      (happy-dom):
      - Renders one `PromotionCard` per item in `promotions` prop.
      - `promotions = []` → empty-state message rendered, no cards.
      - `ok = false` → empty-state message rendered.
      - Forwards `open-lightbox` emit from child card to parent.
      Tests MUST fail first. (Gate IV.3, FR-011–FR-012)

- [x] T015 Implement `app/features/promotions/components/PromotionsGrid.vue`:
      - Props: `promotions: Promotion[]`, `ok: boolean` (default `true`).
      - Shows empty-state message when `promotions.length === 0 || !ok`
        (i18n key `promotions.empty`).
      - CSS grid: 1 col < 520px, 2 cols 520–879px, 3 cols ≥ 880px (Tailwind responsive
        prefixes, no inline style). (FR-018)
      - Forwards `open-lightbox(imageUrl)` up from `PromotionCard`.
      - File ≤ 200 lines. (FR-011–FR-012, FR-018, Gate VIII)

- [x] T016 Make T014 tests pass.

- [x] T017 [P] Add `app/features/promotions/components/PromotionsGrid.stories.ts`:
      - Default (6 mixed promotions).
      - Empty state (0 promotions).
      - Error state (`ok = false`).
      - Responsive (1 col → 2 cols → 3 cols). (Gate VII.4)

### `usePromotions` composable

- [x] T018 [P] Write failing `app/features/promotions/composables/usePromotions.spec.ts`
      (happy-dom):
      - `openLightbox(url)` sets `lightboxState.open = true` and `lightboxState.imageUrl = url`.
      - `closeLightbox()` sets `lightboxState.open = false` and `lightboxState.imageUrl = null`.
      - Initial state: `open = false`, `imageUrl = null`.
      Tests MUST fail first. (Gate IV.4)

- [x] T019 Implement `app/features/promotions/composables/usePromotions.ts`:
      - Manages `LightboxState` as reactive state using `ref`.
      - Exports: `lightboxState`, `openLightbox(url: string)`, `closeLightbox()`.
      - `use` prefix; file ≤ 200 lines; functions ≤ 30 lines. (Gate VIII.2, Gate X.1)

- [x] T020 Make T018 tests pass.

---

## Phase 5: i18n (can start after Phase 1, parallel with Phase 3/4)

- [x] T021 [P] Add `promotions.*` keys to `i18n/locales/es.json`:
      `page.title` ("Promociones | SUMO AYCE"),
      `page.description` ("Descubre todas las promociones activas de SUMO All You Can Eat."),
      `empty` ("No hay promociones disponibles en este momento."),
      `seo.title`, `seo.description`. (FR-020, FR-022)

- [x] T022 [P] Add the same keys to `i18n/locales/en.json` with English translations:
      `page.title` ("Promotions | SUMO AYCE"),
      `page.description` ("Discover all active SUMO All You Can Eat promotions."),
      `empty` ("No promotions available at the moment."),
      `seo.title`, `seo.description`. (FR-020, FR-022)

---

## Phase 6: Page Assembly (workstream PAGE — after Phase 3, 4, 5)

- [x] T023 Write failing `app/pages/promotions.spec.ts` (happy-dom):
      - Page fetches promotions via `useAsyncData` calling `GET /api/v1/content/promotions-page`.
      - Passes `promotions` and `ok` props to `PromotionsGrid`.
      - Clicking a card with an image opens `<UiLightbox>` with the correct `imageUrl`.
      - `UiLightbox` emits `close` → lightbox closes.
      Tests MUST fail first. (FR-001–FR-004, FR-015–FR-017)

- [x] T024 Implement `app/pages/promotions.vue`:
      - `useAsyncData('promotions-page', () => $fetch<PromotionsResult>('/api/v1/content/promotions?all=1'))`.
      - `usePromotions()` composable for lightbox state.
      - Template: `<PromotionsGrid :promotions="data?.promotions ?? []" :ok="data?.ok ?? false"
        @open-lightbox="openLightbox" />` + `<UiLightbox :image-url="lightboxState.imageUrl"
        :open="lightboxState.open" @close="closeLightbox" />`.
      - SEO: `useSeoMeta` with `promotions.seo.title` / `promotions.seo.description` (FR-022).
      - Template ≤ 100 lines. No inline hex. (FR-001–FR-004, FR-019, FR-022)
      - Route served at `/promotions` (driven by the filename in `app/pages/`).

- [x] T025 Make T023 tests pass.

---

## Phase 7: Polish & Cross-Cutting

- [x] T026 [P] [POLISH] Reduced-motion pass: `PromotionCard` entrance animations respect
      `prefers-reduced-motion: reduce` — card transitions are instant. No transform
      animation on card hover under reduced motion. (spec edge cases)

- [x] T027 [P] [POLISH] Accessibility pass:
      - Interactive cards have `tabindex="0"`, `role="button"`, `aria-label` with the
        promotion title.
      - Non-interactive cards have no `tabindex` or `role="button"`.
      - `<UiLightbox>` handles focus trap and return focus (existing behavior — verify it
        works with `PromotionCard` as the trigger). (FR-023–FR-024)

- [x] T028 [P] [POLISH] No-inline-hex grep over new files:
      ```
      grep -rEn '(style=|: ?)#[0-9a-fA-F]{3,8}\b' \
        app/features/promotions/ \
        app/pages/promotions.vue \
        server/api/v1/content/promotions-page.get.ts
      ```
      Result MUST be zero. (SC-009)

- [x] T029 [POLISH] Run `pnpm check && pnpm typecheck && pnpm test && pnpm build`; all
      green. All new spec files counted. (Gate IX)

---

## Dependencies & Execution Order

### Phase dependencies

```
Phase 1 (Setup)
  └─→ Phase 2 (Shared Types & Utilities)   [T003/T005 block Phase 3; T004 blocks Phase 4]
        ├─→ Phase 3 (Server Route)          [T006–T009, independent of FEAT]
        └─→ Phase 4 (Feature Slice)         [T010–T020, independent of SERVER]
              └─→ Phase 6 (Page Assembly)   [T023–T025, needs Phase 3 + 4]
                    └─→ Phase 7 (Polish)

Phase 5 (i18n) — can start after Phase 1, parallel with Phase 3/4.
```

### Within each phase

- Tests written and FAILING before implementation (Article IV).
- TDD order per task group: spec → implement → pass.
- P-marked tasks within the same phase share no file dependencies.
- `promociones.vue` (T024) is written after all components (T011/T015/T019) are done.

### Parallel opportunities

- T002 and T004 in parallel (Phase 1–2).
- T003, T004, T005 in parallel (Phase 2 — different files).
- Phase 3 (SERVER) and Phase 4 (FEAT) in parallel once T003/T005 are done.
- T010/T014/T018 (failing specs) all in parallel within Phase 4.
- T013/T017 (stories) in parallel after their respective components pass.
- T021/T022 (i18n) parallel with all of Phase 3/4.
- T026/T027/T028 (polish) parallel within Phase 7.

---

## Notes

- **[P]** = different files, no same-file dependency. Tasks touching `promociones.vue` are
  sequential.
- Every new component ships `.vue` + `.spec.ts` + `.stories.ts` — no merge without a story
  (Gate VII.4).
- Verify each spec FAILS before implementing.
- Commit per task or logical group; Conventional Commits format (Gate IX).
- The server route IS `server/api/v1/content/promotions.get.ts` — extend it with `?all=1`,
  do NOT create `promotions-page.get.ts`.
- The promotions page calls `GET /api/v1/content/promotions?all=1`.
- NEVER import Drizzle/Neon under `app/` (Gate V.2, FR-004).
- NEVER use inline hex colors in `.vue` files (SC-009).
- `<UiLightbox>` (`app/components/ui/Lightbox.vue`) MUST be used as-is — no modifications.
- WP seed data is in `docs/business/promotions-seed.json` — 6 promotions ready to enter.
