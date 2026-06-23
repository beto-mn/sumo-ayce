# Review: 012-promotions-page

**Status:** APPROVED

---

## Verifications

### `pnpm check`
Exit code 0. 268 files checked, no fixes applied. PASS.

### `pnpm typecheck`
Exit code 0. Pre-existing auto-import collision WARNs (`UsePromotions`, `Types`) are not
new to this feature. PASS.

### `pnpm test --run`
78 test files, 479 tests — all passed. Exit code 0. PASS.

---

## C1–C7 Checkpoint Results

| Checkpoint | Result |
|---|---|
| C1 — Harness complete | PASS |
| C2 — State coherent | PASS |
| C3 — Code respects architecture | PASS |
| C3.1 — File structure (Article I) | PASS |
| C4 — Verification is real | PASS |
| C5 — Session closed properly | PASS |
| C6 — Spec Driven Development | PASS |
| C7 — No sensitive data | PASS |

---

## C3.1 Detail

`find app/components -maxdepth 1 -name '*.vue'` — returns empty. PASS.

`PromotionCard.vue` is now at `app/components/ui/PromotionCard.vue` (previous rejection
reason resolved). The component is used as `<UiPromotionCard>` in both
`app/features/promotions/components/PromotionsGrid.vue` and
`app/features/homepage/components/HomePromotions.vue`. Both co-located files exist:
`PromotionCard.spec.ts` and `PromotionCard.stories.ts`.

No `PromoCard` references remain anywhere in `app/` or `server/`. No cross-feature imports
detected.

---

## Acceptance Criteria ↔ Test Traceability

| Scenario | Covering test file |
|---|---|
| US1-AC1: active promos rendered; inactive absent | `promotions.get.test.ts` (no 3-cap, all=1 path) |
| US1-AC2: Express card uses blue accent | `PromotionCard.spec.ts` — `scope-express` class assertion |
| US1-AC3: AYCE/all card uses acf.color token | `PromotionCard.spec.ts` — no scope-express, type badge assertions |
| US1-AC4: Spanish default locale | `PromotionCard.spec.ts` — badge/title/desc/validity in Spanish |
| US1-AC5: Language switch (i18n) | `PromotionCard.spec.ts` — locale-driven computed props |
| US2-AC1: Click opens lightbox with imageUrl | `PromotionCard.spec.ts` — open-lightbox emit with URL |
| US2-AC2: Escape closes lightbox | `UiLightbox` (feature 010, existing test coverage) |
| US2-AC3: Click outside closes lightbox | `UiLightbox` (feature 010, existing test coverage) |
| US2-AC4: null imageUrl — no lightbox, no pointer | `PromotionCard.spec.ts` — cursor-default, no emit |
| US2-AC5: Keyboard Enter opens/closes lightbox | `PromotionCard.spec.ts` — keydown.enter emit assertion |
| US3-AC1: WordPress error → empty state, no stack trace | `promotions.get.test.ts` — ok:false path; `PromotionsGrid.spec.ts` — ok=false renders empty-state |
| US3-AC2: Empty array → empty state message | `PromotionsGrid.spec.ts` — empty promotions renders empty-state |

12/12 acceptance scenarios covered. PASS.

---

## Design Token Enforcement

- Default Tailwind palette classes in new/modified files: 0 matches. PASS.
- Arbitrary bracket values in new/modified files: 0 matches. PASS.
- Inline hex in `style=`/`<style>` blocks in new files: 0 matches. PASS.
- No `--danger` token introduced; error states use existing tokens. PASS.

---

## File Size Limits

| File | Lines | Limit | Result |
|---|---|---|---|
| `app/components/ui/PromotionCard.vue` | 110 | 200 | PASS |
| `app/features/promotions/components/PromotionsGrid.vue` | 46 | 200 | PASS |
| `app/pages/promotions.vue` | 39 | 100 | PASS |

---

## Notes

- The pre-existing auto-import collision WARNs (`UsePromotions` and `Types`) are not
  introduced by this feature and are present on master. Non-blocking.
- The spec references `/promotions` as the route but the page file is `promotions.vue`
  (correct Nuxt 4 convention). The `promociones` alias noted in spec clarifications is
  not a naming inconsistency — the file-based route is `/promotions` in English.
