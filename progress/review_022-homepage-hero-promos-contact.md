# Review: homepage-hero-promos-contact (feature 022)

**Status:** APPROVED

## Context

Retroactive formal review, same situation as feature 021: this feature was consolidated onto
the `feat/021-menu-experience-overhaul` branch by explicit design (no new branch — see
`spec.md`/`plan.md` header) and merged to master in the same commit (`cc57041`, 2026-07-14).
`feature_list.json` still shows `status: "spec_ready"` for id 22 and there is no closing
"Feature closed: 022" entry in `progress/history.md`, nor a `progress/review_022-...md` prior to
this one. `progress/current.md` still describes feature 022 as "IN PROGRESS" with T001 (the
Graphik Super woff2 binary) blocked by a macOS TCC permission issue — that note is stale: the
binary (`public/fonts/graphik-super.woff2`, 36KB) IS committed on master (commit `e0a21d2`,
part of the same merge), and `tasks.md` correctly shows T001 as `[x]` with the reconciliation
note explaining it shipped.

## Verifications

- **Acceptance criteria covered by tests**: all 3 user stories' acceptance scenarios have direct
  test coverage:
  - US1 (promotions carousel, 10 scenarios): `server/api/v1/content/validators.spec.ts` (new ACF
    shape accepted, promo without `titulo_es` retained, title from `title.rendered` decoded),
    `server/api/v1/content/promotions.get.spec.ts` (batched media fetch, per-size fallback to
    desktop, retained-if-any-image / dropped-if-none, same `?activa=1` query on both surfaces, no
    cap, graceful degrade on upstream failure), `app/components/ui/PromotionCard.spec.ts`
    (`<picture>` breakpoint sources, decoded alt, badge color incl. unknown→orange fallback, type
    pill), `app/components/ui/PromotionsCarousel.spec.ts` (one slide per promo, single-slide hides
    nav, reduced-motion path, active-slide type-coloured nav), `server/api/v1/content/
    html-entities.spec.ts` (numeric/named entity decode, passthrough, empty input).
  - US2 (hero font, 5 scenarios): grep-verified zero remaining "Titan" references for the hero
    (`public/fonts/titan-one-regular.woff2` and `OFL-TitanOne.txt` removed); `app/assets/css/
    base.css` `@font-face`/`.hero-headline` point at `graphik-super.woff2`; `nuxt.config.ts`
    preload updated; `HomeHero.spec.ts`/`.stories.ts` updated per the merge diff (aria label
    assertion preserved).
  - US3 (contact job card, 4 scenarios): `app/features/contact/components/ContactInfo.spec.ts`
    (ES/EN copy from i18n, `jobs-phone-pill` links correctly, no form fields present).
- **Phase -1 Gates (`plan.md`)**: all gates under Articles I, II, III/V, IV, VI, VII, VIII, IX/XI,
  X are marked `[x]`. The one Complexity Tracking entry (`embla-carousel-vue` new dependency) is
  justified per Article X (>100 lines to hand-roll an accessible drag/snap carousel) and matches
  the intake-confirmed choice.
- **Tasks (`tasks.md`)**: all 32 tasks (T001–T032) are marked `[x]`, including T001 (font woff2,
  confirmed present in the repo) and T002 (`embla-carousel-vue` in `package.json`/lockfile —
  confirmed present via the merge diff and a working `PromotionsCarousel.vue` that imports it).
- **No `[NEEDS CLARIFICATION]` markers** in `spec.md`.
- **`./init.sh`**: exit 0 (same run as feature 021 — Biome 373 files clean, `nuxt typecheck`
  clean, Vitest 957/957 passed across 114 files, Storybook build OK). Both features 021/022 share
  the same working tree state on `master`, so this single green run verifies both.
- **Sensitive-data scan**: the contact job-card phone number `+525584406639` /
  `wa.me/525584406639` is the client's REAL RH (HR) WhatsApp number, explicitly and repeatedly
  documented as such in `spec.md`'s Assumptions/FR-C4 ("real RH number", not a test placeholder).
  This is publicly client-facing business contact information (a company recruiting line meant to
  be called by the public), not a customer/staff personal secret, credential, or private data —
  it is the intended, publicly-displayed content of the feature itself, analogous to a company's
  published phone number elsewhere on the site. No hardcoded API keys/tokens/connection
  strings/PEM blocks were found in the merge diff. No `.env*` files tracked beyond `.env.example`.
  Flagging as reviewed/accepted rather than rejecting, since business-published contact numbers
  are the explicit intended feature output, not committed secrets.
- **Structure / Article I**: the shared carousel primitive lives in `app/components/ui/
  PromotionsCarousel.vue` (+ `PromotionCard.vue`), consumed by BOTH `app/features/homepage/
  components/HomePromotions.vue` and `app/pages/promotions.vue` — no duplication, no cross-feature
  import (`app/features/promotions` does not import from `app/features/homepage` or vice versa;
  `app/features/promotions/` now only contains `Promotions.stories.ts`, confirming the old
  `PromotionsGrid.vue` was correctly retired with no orphaned files left behind).
  `find app/components -maxdepth 1 -name '*.vue'` → empty.
- **File-size limits**: `PromotionsCarousel.vue` 162 lines, `PromotionCard.vue` 125 lines,
  `ContactInfo.vue` 153 lines — all ≤200. `app/pages/promotions.vue` 39 lines ≤100.
- **Storybook coverage**: `PromotionsCarousel.stories.ts`, `PromotionCard.stories.ts`,
  `ContactInfo.stories.ts` all present and co-located; the merge diff shows every changed `.vue`
  paired with an updated `.stories.ts` (`DishCard`, `HomeFeaturedRail`, `HomeHero`,
  `HomePromotions`).
- **Design tokens**: zero default-Tailwind-palette matches, zero arbitrary-value matches, zero
  inline hex outside `tokens.css`/`staff.css` in the scanned diff.
- **i18n key parity**: ES/EN key sets identical (programmatic diff = 0), including the new
  `contact.jobs.*` keys.
- **Rendering strategy**: `/` stays `isr: 3600`, `/promotions` stays `isr: 60` in
  `nuxt.config.ts` — unchanged, no new routes added, matching FR-B11/Article V.
- **CHECKPOINTS C1–C7**: C1 OK. C2 OK. C3/C3.1 OK (shared-primitive placement correct, no
  cross-feature imports, pages thin). C4 OK (component + server tests all green in the same
  `./init.sh` run). C6 — all Phase -1 gates `[x]`, all tasks `[x]`, no `[NEEDS CLARIFICATION]`,
  every acceptance criterion has a test. C7 OK, see the sensitive-data note above re: the
  intentionally-public RH phone number.

## Notes (non-blocking, but should be corrected as housekeeping)

- `feature_list.json` still lists feature 22 as `status: "spec_ready"` and its `description` field
  still says "test phone pill" — both stale relative to the delivered/reconciled spec (real RH
  number). The leader/human should update the status and description, and add a "Feature closed:
  022" entry to `progress/history.md`, as follow-up bookkeeping — not a re-review blocker.
- `progress/current.md` still shows feature 022 as "IN PROGRESS" with the T001 font-binary TCC
  blocker described as unresolved. This is stale: the binary is present and committed. This file
  should be cleared/updated to reflect the closed state of both 021 and 022.
- `docs/business/wordpress-endpoints.md` remains stale (documents the OLD promociones ACF
  contract), as already flagged as a known, accepted follow-up in `plan.md`'s Notes section —
  out of this feature's code scope.
