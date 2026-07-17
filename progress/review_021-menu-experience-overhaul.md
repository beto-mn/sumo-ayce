# Review: menu-experience-overhaul (feature 021)

**Status:** APPROVED

## Context

This is a retroactive formal review. The feature was implemented and merged to master
(commit `cc57041`, `feat/021-menu-experience-overhaul` → `master`, together with feature 022
in the same PR/branch, `2026-07-14`) without a closing reviewer pass being recorded — unlike
features 023/024, no `progress/review_021-...md` existed and `progress/history.md` has no
"Feature closed: 021" entry. `feature_list.json` still shows `status: "spec_ready"` for id 21,
which does not match reality. This review verifies the code currently on `master` against
`spec.md`/`plan.md`/`tasks.md` as they stand (both were reconciled on 2026-07-14 to describe
the delivered scope, including the growth from a 3-way to a 4-way nav + Kids view + DB-driven
labels + 3 migrations instead of 1).

## Verifications

- **Acceptance criteria covered by tests**: 20/20 acceptance scenarios across US1 (11), US2 (6),
  US3 (6, one is a duplicate polish/robustness count) have direct test coverage:
  - US1 (curated 4-way nav + deep-linking): `app/features/menu/menu-sets.spec.ts` (membership/order
    per set incl. Kids), `app/features/menu/composables/useMenuFilters.test.ts` (default landing,
    4-way type incl. bebidas/kids, all deep-link forms, omitted-category default, out-of-set
    fallback, replace semantics), `app/features/menu/components/MenuShell.spec.ts`,
    `MenuTypeToggle.spec.ts`, `MenuModalityToggle.spec.ts`, `MenuCategoryChips.spec.ts`.
  - US2 (drinks catalogue): `tests/db/menu-seeds.test.ts` (destilados split, group order,
    Caguamón-first, promo-once, one Vaso Sumo row, image-first coffee),
    `app/features/menu/components/MenuDrinkSection.spec.ts` (destilados single promo,
    Caguamón-first, six-base Vaso Sumo picker incl. Jack Daniel's, half-width cards),
    `MenuSaucePicker.spec.ts` (parameterized reuse), `MenuDrinkCard.spec.ts`.
  - US3 (polish + featured rail): `tests/db/menu-featured.test.ts` (11 named dishes featured on
    all rows, deduped, Sumo Fries not Sumo Bites), `MenuDishCard.spec.ts` (hover-zoom,
    Garantía badge, no sauce picker on wings), `MenuDrinkSection.spec.ts`/`MenuDrinkCard.spec.ts`
    (half-width grid spans).
  - Robustness (FR-024a/b, edge cases): `server/utils/db-retry.ts` + its retry/degradation path
    exercised in the menu-queries/index.get tests (WARN-logged retries visible in the `./init.sh`
    test run output; `DatabaseUnavailableError` → empty menu).
- **Phase -1 Gates (`plan.md`)**: all gates under Articles I, II, IV, V, VII, VIII, IX, X, XI, XII,
  XIII are marked `[x]`. Complexity Tracking table is empty/justified (3 additive single-column
  migrations, justified under Article X).
- **Tasks (`tasks.md`)**: all 52 tasks (T001–T052, including the 4 delivered-scope-addition tasks
  T049–T052) are marked `[x]`. No unchecked boxes.
- **No `[NEEDS CLARIFICATION]` markers** in `spec.md` (confirmed by reading the full file).
- **`./init.sh`**: exit 0. Biome clean (373 files), `nuxt typecheck` clean, Vitest
  **957/957 passed (114 files)**, Storybook build OK, 0 features `in_progress` (feature_list.json
  currently has none `in_progress`, though see Notes below re: stale status field).
- **Sensitive-data scan**: scanned the full `021` merge diff (`git diff e9228d9...cc57041`) for
  secret/credential patterns — zero real hits (only false positives on the words "token"/"secret"
  inside test fixtures like `'ECONNREFUSED secret-host'` and design-token comments, which are
  intentional negative-test strings, not real secrets). No `.env*` files tracked beyond
  `.env.example`.
- **Structure / Article I**: `find app/components -maxdepth 1 -name '*.vue'` → empty (no misplaced
  shell/feature components). All new/changed menu components live under
  `app/features/menu/components/`; no cross-feature imports found (`grep` of
  `@/features/*` imports across `app/features/` shows zero cross-boundary references). No
  `drizzle-orm`/`@neondatabase/serverless` import anywhere under `app/`. `/menu` route rule is
  `ssr: true` (confirmed in `nuxt.config.ts`), matching the reconciled spec/plan (never `isr:3600`).
- **File-size limits**: `MenuShell.vue` 197 lines, `MenuDrinkSection.vue` 161 lines,
  `MenuTypeToggle.vue` 97 lines — all ≤200. `app/pages/menu.vue` 97 lines ≤100.
- **Storybook coverage**: every changed/new menu component has a co-located `.stories.ts`
  (verified for `MenuDrinkCard.vue`, and the merge diff shows story files updated 1:1 with every
  changed `.vue` — `MenuCategoryChips`, `MenuDishCard`, `MenuDishGrid`, `MenuDrinkSection`,
  `MenuModalityToggle`, `MenuSaucePicker`, `MenuShell`, `MenuTypeToggle`).
- **Design tokens**: zero default-Tailwind-palette utility matches, zero arbitrary `[...]` value
  matches (the only 2 hits are negative test assertions `not.toContain('text-[10px]')`, not real
  usage), zero inline hex outside `tokens.css`/`staff.css`.
- **i18n key parity**: ES/EN key sets are identical (programmatic diff = 0). `menu.category.*`
  removed except `menu.category.empty`; `menu.drink_group.*` fully removed (labels are DB-driven),
  matching FR-009a/SC-013.
- **CHECKPOINTS C1–C7**: C1 OK (harness intact, `./init.sh` exit 0). C2 OK (0 features
  `in_progress`; `done`-feature tests pass). C3/C3.1 OK (structure, no cross-feature imports,
  pages thin). C4 OK (tests cover both `server/`/`tests/db` and `app/`; Biome/typecheck/storybook
  green). C6 — all Phase -1 gates `[x]`, all tasks `[x]`, no `[NEEDS CLARIFICATION]`, every
  acceptance criterion has a test. C7 OK — no secrets found.

## Notes (non-blocking, but should be corrected as housekeeping)

- `feature_list.json` still lists feature 21 as `status: "spec_ready"`, which does not reflect
  reality (the code is merged and live on `master`). This review's approval is for the delivered
  code; the leader/human should update the status field (and add a "Feature closed: 021" entry to
  `progress/history.md`) as a follow-up bookkeeping action — not a re-review blocker, since the
  code itself is verified against the reconciled spec/plan/tasks.
- No `progress/impl_021-...md` implementer report exists; the implementation narrative lives
  inline in `progress/history.md` ("Feature spec authored: 021" + the "PRIOR: 021" implementation
  section that was later folded in from `current.md`). This is a documentation-trail gap, not a
  code defect — the reconciliation note at the top of `spec.md`/`plan.md`/`tasks.md`
  (dated 2026-07-14) serves the same purpose.
- Production migration/reseed (0027/0028/0029) is stated as applied to production Neon in the
  spec/plan; this review verified the migration files and seed code exist and are exercised by
  tests, but did not independently re-verify the production Neon database state (out of scope for
  a code review; would require prod DB access).
