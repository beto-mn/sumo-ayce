# Implementation Summary — Feature 008 (frontend-test-setup)

**Feature**: 008 — frontend-test-setup
**Branch**: `feat/008-frontend-test-setup`
**Status**: implementation complete → awaiting reviewer

## Phases completed

- Phase 1 (Setup) — T001, T002. Installed `@vue/test-utils@2.4.11` and `happy-dom@20.10.6` (bumped from `^15.10.2` to `^20.0.11` to satisfy the `@nuxt/test-utils@4.0.3` peer dep). Rewrote `vitest.config.ts` to use Vitest 4 `test.projects`. Deviation from plan: `defineVitestConfig` from `@nuxt/test-utils/config` cannot be used as the outer wrapper when `projects` is set (it throws). Switched to `defineConfig` from `vitest/config`, called `getVitestConfigFromNuxt()` and merged its resolve.alias / define / optimizeDeps / server / deps into the `server` project. The `app` project uses `@vitejs/plugin-vue` directly (filtered out of the server project alongside `ssr-styles` to keep node tests clean).
- Phase 2 (Foundational smoke) — T003. Smoke spec mounted under happy-dom; file deleted.
- Phase 3 (US1 baseline) — T004. Captured pre/post baseline inline in `progress/current.md` (32 files / 188 tests → 34 files / 194 tests after rewiring; +12 files / +38 tests after the 10 component specs).
- Phase 4 (US3 revive composable tests) — T010, T011. Added `vi.stubGlobal('navigateTo', vi.fn())` to `useStaffAuth.test.ts` (the only missing stub). Both composable test files (6 tests total) now green.
- Phase 5 (US2 ten component specs) — T020 through T030. Ten co-located `*.spec.ts` files under `app/components/ui/`: Button, Card, Chip, Sticker, Kicker, Input, Select, Textarea, Nav, Marquee. 32 assertions, all green. Each spec ≤ 60 lines, behaviour-driven names, no Nuxt auto-import dependency, no centralized mocks.
- Phase 6 (US4 docs + reviewer gates) — T040, T041, T042, T043. Added "Frontend tests" subsection to `docs/harness/verification.md`; "Testing" subsection to `docs/harness/conventions.md`; updated CHECKPOINTS.md C4 to require `pnpm test` coverage of `app/`; appended the **Frontend spec presence** rule to `.claude/agents/reviewer.md` (the inline-hex grep gate was already present in the file).
- Phase 7 (US5 staff hex migration) — T050 through T058. Migrated 22 inline hex literals across 8 staff files using the spec mapping (`#fff → rgb(var(--panel))`, `#22c55e → rgb(var(--green))`, `#ef4444 → rgb(var(--pink))`). Also opportunistically fixed one extra hex literal in `TransactionTable.vue` line 190 (`border: 1px solid #ef4444` → `1px solid rgb(var(--pink))`) that fell outside the grep regex but inside the spirit of the migration. `app/assets/css/staff.css` left untouched per FR-007.
- Phase 8 (Polish) — T060, T061, T062, T063. `pnpm check` clean (biome auto-fixed import-sort + format on `vitest.config.ts`). `pnpm typecheck` exit 0. `pnpm test` 44 files / 226 tests green. `./init.sh` exit 0.

## Final harness results

- Baseline (before feature 008): **32 files / 188 tests** passing.
- After feature 008: **44 files / 226 tests** passing. (+12 files / +38 tests.)
- `./init.sh` exits 0 (all six steps green).
- T108c grep gate (`grep -rEn '(style=|: ?)#[0-9a-fA-F]{3,8}\b' app/components/ app/layouts/ app/pages/`): **0 matches** — exit code 1.
- Full `app/` tree (minus `app/assets/css/`) grep: **0 matches**.

## Phase -1 gates

All **18 gates** in `plan.md` are now `[x]`. The 18 gates cover Articles I, II, III, IV (heavy), V, VI, VII, VIII, IX, X, XI, XII, XIII. None required complexity-tracking entries.

## Tests added per acceptance criterion

- **US1 AC1–AC4** (runner wired up, two environments) — verified by the test output itself: 44 files split across the `app` (happy-dom) and `server` (node) projects.
- **US2 AC1–AC4** (ten co-located specs, behaviour-driven, ≤ 60 lines) — `app/components/ui/{Button,Card,Chip,Sticker,Kicker,Input,Select,Textarea,Nav,Marquee}.spec.ts`. Each contains ≥ 3 `it()` blocks (default + variant + interaction/a11y).
- **US3 AC1–AC3** (legacy composable tests revived green, ≥ 6 tests pass) — `app/composables/useStaffAuth.test.ts` and `useStaffCustomer.test.ts` produce 6 green tests under the `app` project.
- **US4 AC1–AC3** (docs mention spec.ts ↔ component.vue convention) — `docs/harness/verification.md` Frontend tests subsection + `docs/harness/conventions.md` Testing subsection both mention the rule. `grep -i "spec.ts"` returns matches in both.
- **US5 AC1–AC5** (22 hex literals migrated; legacy `staff.css` untouched; grep returns 0) — all 22 lines migrated; one extra literal opportunistically fixed; legacy `staff.css` token system byte-identical to pre-feature; grep gate clean.

## Anti-broken-telephone notes for the reviewer

- **`vitest.config.ts` deviates from the plan.md research §1 footnote.** Per that footnote, `defineVitestConfig` was the intended outer wrapper. In practice it throws when `test.projects` is set, so the implementation uses `defineConfig` from `vitest/config` with `getVitestConfigFromNuxt()` called once and its resolved Vite config merged into the `server` project only. The `app` project loads `@vitejs/plugin-vue` directly. The Nuxt plugins `ssr-styles`, `vite:vue`, and `vite:vue-jsx` are filtered from the server project (they expect rollup input that we don't provide in test mode). This is documented inline in `tasks.md` T002's acceptance note.
- The `@/utils` alias was added to the `vitest.config.ts` resolve.alias map because the base UI components (e.g. `Button.vue`) import `@/utils/cx` and the test runner needs to resolve it without going through Nuxt's auto-import layer. This is consistent with Article XI (absolute imports) and adds no new convention.
- One extra hex literal beyond the spec's 22-line list was migrated (`TransactionTable.vue` line ~190, `border: 1px solid #ef4444`). It fell outside the grep regex but was visually adjacent to a real match; leaving it would have created a "split brain" file with one literal half-tokenized. The migration uses the same `rgb(var(--pink))` value as the adjacent `color`.

## Known issues / TODOs

- None.

## Outcomes NOT done in this feature

- `feature_list.json` id=8 status was **NOT** flipped to `done`. Per the leader's hard rules, only the reviewer authorizes that and only the leader flips it (after `APPROVED → progress/review_<feature>.md`).
- `progress/current.md` was NOT moved to `progress/history.md`. Per `docs/harness/verification.md`, that move happens after the reviewer's `APPROVED` lands.

## Return

implementation complete → progress/impl_008-frontend-test-setup.md
