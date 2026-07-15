---
description: "Task list for feature 022 — Homepage hero font + Promotions carousel + Contact job card"
---

# Tasks: Homepage hero font + Promotions carousel + Contact job card (022)

**Input**: Design documents from `specs/022-homepage-hero-promos-contact/`
**Prerequisites**: plan.md, spec.md, data-model.md, contracts/promotions-wp.md, research.md, quickstart.md
**Branch**: `feat/021-menu-experience-overhaul` (consolidated — no new branch)

**Tests**: REQUIRED. Server-side pipeline is TDD (Article IV — tests before implementation). Every changed/new component has a co-located Vitest spec + Storybook story (Article VII).

> **Reconciled 2026-07-14.** As delivered: the Graphik Super `woff2` binary was shipped (T001 done);
> media is resolved in a SINGLE batched request; BOTH surfaces use `?activa=1` with NO cap (the
> `home=1` filter + homepage 3-cap were removed); each slide overlays a type pill (AYCE/Express/Ambos)
> and the carousel nav is coloured by the active slide's type; the homepage shows the "Promociones"
> title with no "ver todas" link; the Bolsa de trabajo card uses the real RH number
> `wa.me/525584406639` (display `+52 55 8440 6639`). Task lines still mentioning the 3-newest cap or a
> TEST placeholder should be read against these delivered decisions (captured in the updated spec/plan/data-model).

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependency on an incomplete task)
- **[Story]**: US1 = Promotions carousel + WP model (P1), US2 = Hero font (P2), US3 = Contact job card (P3)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: One-time assets/dependencies the stories depend on.

- [x] T001 [P] Converted the client font to woff2 and committed it: `public/fonts/graphik-super.woff2` + `public/fonts/GRAPHIK-SUPER-LICENSE.txt` (client-licensed note).
- [x] T002 [P] Add `embla-carousel-vue` to `package.json` dependencies and install (verify it appears in the lockfile). Justified under Article X (see plan Complexity Tracking).

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Shared types + decode util that the promotions story builds on. No user story UI can be built before the types are updated.

**⚠️ CRITICAL**: Complete before US1.

- [x] T003 [P] Update `types/wordpress.ts`: rewrite `WpPromotionAcf` to the new fields (`badge_es`, `badge_en?`, `color`, `tipo`, `activa`, `home?`, `imagen_desktop`, `imagen_tablet`, `imagen_movil`); remove `titulo_*`/`descripcion_*`/`vigencia_*`/`imagen`; add `title.rendered` to `WpPromotion`. Keep `WpPromotionsResponse`.
- [x] T004 [P] Update `types/content.ts` `Promotion`: `title: string`; remove `description`, `validity`, `imageUrl`; add `imageDesktopUrl`, `imageTabletUrl`, `imageMovilUrl` (`string | null`). Update any `HomeContent`/result types referencing removed fields.
- [x] T005 [US1] Write failing spec `server/api/v1/content/html-entities.spec.ts` covering numeric (`&#215;`→`×`, `&#8211;`→`–`, hex `&#x2715;`), named (`&amp;`, `&#039;`, `&quot;`, `&lt;`, `&gt;`, `&nbsp;`), plain-string passthrough, and empty input.
- [x] T006 [US1] Implement dependency-free `server/api/v1/content/html-entities.ts` decode util to make T005 pass (Article X — no new dep).

**Checkpoint**: Types + decode util ready.

---

## Phase 3: User Story 1 — Promotions carousel + WP new model (Priority: P1) 🎯 MVP

**Goal**: Restore promotions (currently all dropped) using the restructured WP model, and present them as a shared responsive carousel on `/` and `/promociones`.

**Independent Test**: With the restructured payload, `/` and `/promociones` render active promotions as carousel slides — correct image per breakpoint (desktop fallback), decoded title, color badge, working drag/dots/arrows.

### Tests first (TDD — write and see them FAIL)

- [x] T007 [US1] Update/extend `server/api/v1/content/validators.spec.ts`: new acf shape accepted; promo WITHOUT `titulo_es` is NOW retained; `title` taken from `title.rendered` and decoded; three media IDs parsed via `toMediaId`; removed-field-only payloads no longer required; malformed items still dropped individually.
- [x] T008 [US1] Update `server/api/v1/content/promotions.get.spec.ts`: batched media resolution; tablet/mobile fall back to desktop when id is null/unresolved, desktop falls back to any resolved size; promos with any configured image retained, no-image promos dropped; BOTH surfaces use the same `?activa=1` all-active list (NO cap; `home=1` removed); graceful `{ promotions: [], ok: false }` + `ExternalServiceError` (WARN + 502) on upstream failure.
- [x] T009 [P] [US1] Write `app/components/ui/PromotionCard.spec.ts`: renders `<picture>` with mobile (≤520)/tablet (≤880)/desktop sources; `img` alt = decoded title (generic fallback when empty); badge text bilingual; badge accent driven by `color` (unknown→orange); missing-size falls back to desktop src.
- [x] T010 [P] [US1] Write `app/components/ui/PromotionsCarousel.spec.ts`: renders one slide per promotion; single-promotion hides/inerts dots+arrows; reduced-motion path disables autoplay; mounts cleanly in happy-dom (embla behind client guard).

### Implementation

- [x] T011 [US1] Rewrite `server/api/v1/content/validators.ts`: new `acfSchema` (drop removed, add three `imagen_*` media-ID coercion via existing `toMediaId`, keep `badge`/`color`/`tipo`/`activa`/`home`); add `title.rendered` to `rawPromotionSchema`; `ParsedPromotion` carries `desktopMediaId`/`tabletMediaId`/`movilMediaId`; `mapPromotion` sets `title = decodeHtmlEntities(title.rendered.trim())`, drops desc/validity; keep `_AcfFieldsMatchUpstream` guard valid. Make T007 pass.
- [x] T012 [US1] Rewrote `server/api/v1/content/promotions.get.ts`: SINGLE batched media fetch (`/wp/v2/media?include=…`) → `projectPromotion` with desktop/any-resolved fallback; keep promos with any configured image; BOTH surfaces query `?activa=1&per_page=100` (NO cap, `home=1` removed, `?all=1` kept for logging only); `ExternalServiceError` (WARN + 502) → `{ promotions: [], ok: false }`. Make T008 pass.
- [x] T013 [P] [US1] Create `app/components/ui/PromotionCard.vue` (per-slide): full-bleed `<picture>` (`<source media>` at ≤520 / ≤880 / desktop baseline), `img` alt = decoded title (generic fallback), colour **badge sticker top-RIGHT** (`promo.color`, default orange) + **type pill top-LEFT** (`promo.type`: AYCE orange / Express blue / Ambos gradient, labelled), tokens only. Make T009 pass. (Replaces the old text-only card.)
- [x] T014 [US1] Create `app/components/ui/PromotionsCarousel.vue` (`Ui`-prefixed shared primitive): props `promotions: Promotion[]`; embla-carousel-vue (`loop`, `align:start`); touch/drag, dots, prev/next arrows synced via embla api; nav arrows + active dot COLOURED by the active slide's `type`; reduced-motion re-inits `duration:0`; renders `UiPromotionCard` per slide; nav hidden for a single slide. Make T010 pass.
- [x] T015 [P] [US1] Add `app/components/ui/PromotionCard.stories.ts`: Default + each color variant + missing-image fallback + long/decoded title + mobile/desktop viewports.
- [x] T016 [P] [US1] Add `app/components/ui/PromotionsCarousel.stories.ts`: Default (multi-slide) + single-slide + reduced-motion note + mobile/desktop viewports.
- [x] T017 [US1] Update `app/features/homepage/utils/select-promotions.ts` (+ `select-promotions.spec.ts`) for the new `Promotion` shape (title:string, image URLs); NO cap (delivered decision — homepage shows all active, same as the promotions page).
- [x] T018 [P] [US1] Update `app/features/homepage/composables/usePromotions.ts` (+ spec) and `app/features/promotions/composables/usePromotions.ts` (+ spec) for the new type; no field references to removed `description`/`validity`/`imageUrl`.
- [x] T019 [US1] Rewrote `app/features/homepage/components/HomePromotions.vue` (+ `HomePromotions.stories.ts` + `.spec.ts`) to render the "Promociones" title (no "ver todas" link) + `UiPromotionsCarousel` over ALL active promos (no cap). No cross-feature import.
- [x] T020 [US1] Retired `PromotionsGrid.vue`; `app/pages/promotions.vue` renders `UiPromotionsCarousel` (all active, no cap) under the "Promociones Sumo" page header; specs/stories updated. Template ≤ 100 lines.

**Checkpoint**: Promotions render on `/` and `/promociones` as a working carousel; server pipeline green.

---

## Phase 4: User Story 2 — Hero headline font Graphik Super (Priority: P2)

**Goal**: Hero "ALL YOU CAN EAT" renders in self-hosted Graphik Super with the logo-style treatment preserved.

**Independent Test**: Hero renders in Graphik Super at 360/768/1280; white-fill + black-stroke + shadow preserved; preload points at the new woff2; no Titan One reference remains for the hero; aria key unchanged.

- [x] T021 [US2] Edit `app/assets/css/base.css`: replace the Titan One `@font-face` with a Graphik Super one (`src: url("/fonts/graphik-super.woff2") format("woff2")`, `font-display: swap`) and set `.hero-headline { font-family: "Graphik Super", system-ui, sans-serif }`; keep white fill (`--panel`), `-webkit-text-stroke` (`--ink`), paint-order, drop shadow. (Depends on T001.)
- [x] T022 [US2] Edit `nuxt.config.ts`: change the hero font preload `href` from `/fonts/titan-one-regular.woff2` to `/fonts/graphik-super.woff2`.
- [x] T023 [P] [US2] Delete `public/fonts/titan-one-regular.woff2` and `public/fonts/OFL-TitanOne.txt` (no remaining consumer); grep the repo to confirm no `Titan` reference remains for the hero.
- [x] T024 [US2] Update the hero component spec/story if it asserts the font family/aria key (e.g. `HomeHero.spec.ts` / `HomeHero.stories.ts`); confirm the i18n aria key is unchanged and the a11y note stays accurate.

**Checkpoint**: Hero font swapped, look preserved.

---

## Phase 5: User Story 3 — Contact "Bolsa de trabajo" card (Priority: P3)

**Goal**: Static i18n job card + phone CTA on the contact page. No form, no backend.

**Independent Test**: Contact page shows exact ES copy in Spanish and EN translations in English; phone pill links via WhatsApp/tel; no form fields.

- [x] T025 [P] [US3] Add `contact.jobs.*` keys to the ES locale file (heading "Bolsa de trabajo"; lead and body verbatim per spec Assumptions; phone label; `phone`=`+525584406639`, `phoneDisplay`=`+52 55 8440 6639` — real RH number).
- [x] T026 [P] [US3] Add matching `contact.jobs.*` keys to the EN locale file (translated heading/lead/body/label; same real phone/phoneDisplay) — strict key parity with ES.
- [x] T027 [US3] Update `app/features/contact/components/ContactInfo.vue`: add the static job-card `<section data-testid="jobs-card">` (i18n-sourced) + a phone pill mirroring `whatsapp-pill` linking `https://wa.me/525584406639` (digits-only from `contact.jobs.phone`) with visible `phoneDisplay`. No form fields. Keep the component ≤ 200 lines.
- [x] T028 [P] [US3] Update `app/features/contact/components/ContactInfo.spec.ts`: asserts job card renders heading/lead/body from i18n and the `jobs-phone-pill` links correctly; and `ContactInfo.stories.ts`: add a story showing the job card (ES + EN, mobile/desktop).

**Checkpoint**: Contact job card live in both locales.

---

## Phase 6: Polish & Cross-Cutting

- [x] T029 [P] Run the ES/EN i18n key-parity check (identical key sets in both locale files); fix any drift introduced by `contact.jobs.*`.
- [x] T030 Run full gate suite: `vue-tsc --noEmit`, Biome lint+format, and all Vitest specs; ensure Storybook builds. Fix failures.
- [x] T031 Ran `quickstart.md` verification for all three parts (hero font at 3 breakpoints with the delivered `graphik-super.woff2`; promos render on `/` and `/promociones` with correct per-breakpoint image + decoded title + colour badge + type pill + type-coloured carousel nav; contact card ES/EN + `wa.me/525584406639` CTA). Promos pipeline/carousel + contact card also covered by automated specs.
- [x] T032 Confirm every Phase -1 gate in `plan.md` is satisfied and check each box; note the stale `docs/business/wordpress-endpoints.md` as a flagged follow-up (out of code scope).

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: no dependencies (T001, T002 parallel).
- **Foundational (Phase 2)**: T003/T004 parallel; T005→T006 (decode TDD). Blocks US1.
- **US1 (Phase 3)**: after Phase 2. Server tests (T007, T008) before server impl (T011, T012). Component tests (T009, T010) before component impl (T013, T014). T013 before T014 (carousel renders card). T017–T020 after T004/T011.
- **US2 (Phase 4)**: after T001. Independent of US1/US3.
- **US3 (Phase 5)**: independent of US1/US2. T025/T026 before T027/T028.
- **Polish (Phase 6)**: after all desired stories.

### User Story Independence

- **US1 (P1 / MVP)**: fixes the live regression + delivers the carousel. Self-contained (server + shared UI + both pages).
- **US2 (P2)**: CSS/config only; can ship without US1/US3.
- **US3 (P3)**: additive static content; can ship without US1/US2.

### Parallel Opportunities

- T001, T002 in parallel.
- T003, T004 in parallel.
- Within US1: T009/T010 (component tests) parallel; T015/T016 (stories) parallel; T018 pair parallel.
- Whole stories US1/US2/US3 can be built by different developers in parallel after Phase 2 (US2/US3 need only Phase 1).

---

## Parallel Example: User Story 1 tests

```text
Task: "PromotionCard.spec.ts — picture sources + alt + badge color"   (T009)
Task: "PromotionsCarousel.spec.ts — slides + single-slide + reduced-motion" (T010)
```

---

## Implementation Strategy

### MVP First (US1 only)

1. Phase 1 (Setup) → Phase 2 (Foundational) → Phase 3 (US1).
2. STOP and validate: promos render on `/` and `/promociones`, carousel works, server pipeline green.
3. Ship/demo the regression fix as the MVP.

### Incremental Delivery

US1 (fix + carousel) → US2 (hero font) → US3 (contact card). Each adds value without breaking the others. All three land in the single 021-branch PR.

---

## Notes

- [P] = different files, no dependency on an incomplete task.
- Server-side rewrites follow Red→Green (Article IV): T005/T007/T008 before their implementations.
- Every changed/new component ends with a passing spec + a Storybook story (Article VII).
- Shared carousel lives in `app/components/ui/` (Article I) — no `features/promotions` ↔ `features/homepage` import.
- No new routes → no `nuxt.config.ts` routeRules / rendering-strategy changes.
