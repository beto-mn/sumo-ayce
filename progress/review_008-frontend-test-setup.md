# Review: 008-frontend-test-setup

**Status:** APPROVED

## Verifications

- Acceptance criteria covered by tests: **5/5 user stories, all ACs traced**
  - US1 (runner wired up, env-per-project): verified by `pnpm test` output — 44 files / 226 tests split across `app` (happy-dom) and `server` (node) projects.
  - US2 (10 co-located base UI specs): verified by `app/components/ui/{Button,Card,Chip,Sticker,Kicker,Input,Select,Textarea,Nav,Marquee}.spec.ts` — each ≤ 60 lines, ≥ 3 behaviour-driven `it()` blocks (default + variant + interaction/a11y). Spec sizes: 29–44 lines, total 349 lines across 10 files.
  - US3 (legacy composable tests revived): `app/composables/useStaffAuth.test.ts` and `useStaffCustomer.test.ts` now report 6 green tests under the `app` project (per impl report; `pnpm test` exit 0 confirms).
  - US4 (convention documented): `docs/harness/verification.md` "Frontend tests" subsection AND `docs/harness/conventions.md` "Testing" subsection both name the `Component.vue ↔ Component.spec.ts` rule and `.spec.ts` vs `.test.ts` policy. `CHECKPOINTS.md` C4 extended (line 31: "pnpm test runs and passes tests under BOTH server/ AND app/"). `.claude/agents/reviewer.md` carries Frontend spec presence + inline-hex grep gates.
  - US5 (staff hex-free): `grep -rEn '(style=|: ?)#[0-9a-fA-F]{3,8}\b' app/components/ app/layouts/ app/pages/` exits 1 (zero matches). Whole-`app/` scan (excluding `assets/`) also exits 1.

- Phase -1 Gates marked: **18/18 [x]** in `plan.md`.
- Tasks completed: **27/27 [x]** in `tasks.md` (T001–T063; no unchecked boxes).
- No `[NEEDS CLARIFICATION]` markers in `spec.md`.
- `./init.sh`: **exit 0** — all six steps green (Node 24.12, pnpm 10.27, harness files, JSON validation, biome 151 files clean, typecheck clean, 44 files / 226 tests in 1.38 s).
- Sensitive-data scan (Article VI): diff scan returns no matches; no `.env*` files tracked beyond `.env.example`.

## Per-deviation rulings

1. **`vitest.config.ts` shape diverged from research §1 (`defineConfig` + per-project `getVitestConfigFromNuxt()` merge, filtering `ssr-styles`/`vite:vue`/`vite:vue-jsx`)** — **ACCEPTED.** Research §1 itself acknowledged the shape was non-load-bearing ("the decision is 'two named projects, two environments'"). The constraint that matters (FR-002: env-per-project, `app/` under happy-dom, `tests/`+`server/` under node) is satisfied verbatim. The test count (44 files / 226 tests = baseline 32/188 + 12 files / 38 tests) matches the spec target exactly. Deviation is documented in `tasks.md` T002 acceptance note (lines 32) and `progress/impl_008-frontend-test-setup.md` §"Anti-broken-telephone notes". Defensible as "research's assumption about `defineVitestConfig` interop was wrong; the fix is the simplest path under the real constraint".
2. **`@/utils` alias added to vitest config (`app/utils`)** — **ACCEPTED.** Scope is correct (only `@/utils`, alongside the pre-existing `@/types`); points at `app/utils/` which is where feature 007 §15 repointed `cx`. Necessary because Vitest does not run Nuxt's auto-import resolver, and `Button.vue` (and others) imports `@/utils/cx`. Matches Article XI. Zero regression — server project inherits the full Nuxt alias map via `getVitestConfigFromNuxt()`.
3. **23rd hex literal migrated in `TransactionTable.vue` line ~190 (`border: 1px solid #ef4444` → `rgb(var(--pink))`)** — **ACCEPTED.** `--pink` is the correct semantic mapping per research §5 ("reuse `--pink` for error states; do NOT introduce a new `--danger`"). The migration co-locates with adjacent `color: rgb(var(--pink))` on the same selector — leaving the literal would have produced a half-tokenized "split brain" rule. The spec's "22" was an inventory at draft time; FR-008 / SC-004 target is "zero across `app/`", and T108c grep now returns zero. Strict adherence to the count would have left the file in a worse state. Not opportunistic scope creep — strictly required to satisfy the project-wide gate.

## Token & convention enforcement

- **T108c (inline hex) — full `app/` tree**: **0 matches**, exit 1. Including `app/components/staff/*`, `app/pages/staff/*`, `app/components/ui/*`, `app/layouts/*`. Carryover gate from feature 007 is now permanently clean.
- **T108a (default Tailwind palette)**: 0 matches across `app/` and `.storybook/`, exit 1.
- **T108b (arbitrary Tailwind values)**: 0 matches across `app/` and `.storybook/`, exit 1.
- **Convention documented in both harness docs**: YES. `docs/harness/verification.md` carries the runtime details + `Button.spec.ts` reference link; `docs/harness/conventions.md` carries the file-naming policy + cross-link.
- **CHECKPOINTS.md C4 extended**: YES (line 31). Wording matches T042 acceptance.
- **Frontend spec co-location**: 10 base components → 10 co-located `.spec.ts` files in `app/components/ui/`, verified by `ls`. Filenames match `<Name>.vue` ↔ `<Name>.spec.ts`.

## Article IV deep-dive (heaviest constraint)

- Previously-dead composable tests now run: confirmed by impl report (6 green) and overall test count delta (+38 tests = 32 from 10 new specs + 6 revived composable tests). `pnpm test` exit 0.
- Component specs test behaviour, not implementation: spot-checked `Button.spec.ts` (renders slot, switches variant, emits click, exposes `aria-busy`) and `Card.spec.ts` (renders slot + surface class, applies `scope-express`, switches tone + shadow size). Behaviour-driven `it()` names throughout.
- No mocks for DB/Twilio/WordPress in component specs (none imported).
- No `any` types in any spec file (grep returned nothing).
- Test names are behaviour-driven (e.g., "switches to ink surface when variant=\"ink\" is set", "emits click when the user activates the button").

## CHECKPOINTS C1–C7

- C1 (harness complete): OK — all base files, 4 harness docs, agents, `init.sh` green.
- C2 (state coherent): OK — feature 008 still `in_progress` (correct; implementer did not flip to `done`).
- C3 (architecture respected): OK — no stray debug prints; specs live next to source; imports use aliases.
- C4 (verification real): OK — `pnpm test` covers `app/` + `server/` (the explicit new requirement); biome + typecheck pass; no filesystem mocks introduced.
- C5 (session): n/a — session still open by design.
- C6 (SDD): OK — `spec.md` / `plan.md` / `tasks.md` complete, no unresolved clarifications, every AC has at least one covering test.
- C7 (security): OK — sensitive-data scan clean; no tracked env files; no real customer data in fixtures.

## Test count delta

- Baseline (pre-008): 32 files / 188 tests.
- After 008: 44 files / 226 tests.
- Delta: **+12 files / +38 tests** — matches the spec target exactly (10 component specs + 2 revived composable tests).

## Notes (non-blocking)

- Spec line-length budget held: largest spec is `Marquee.spec.ts` at 44 lines (target ≤ 60, hard cap 200 per Article VIII).
- Three Datadog tool advisories appeared in the runtime context but are unrelated to this review (Datadog MCP server prompt). No action.
- One follow-up worth noting for feature 011 (Promotions): if pink-as-promo and pink-as-danger end up clashing semantically, introducing `--danger` becomes a real candidate. Research §5 already flags this. No action required now.

