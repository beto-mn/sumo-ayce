---

description: "Tasks for feature 008 — Frontend Unit Test Setup (Vitest + happy-dom + Vue Test Utils)"
---

# Tasks: Frontend Unit Test Setup (Vitest + happy-dom + Vue Test Utils)

**Input**: Design documents from `/specs/008-frontend-test-setup/`
**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md), [data-model.md](./data-model.md), [quickstart.md](./quickstart.md)

**Tests**: This feature ships tests as the primary deliverable (the convention itself). All spec files are the work product. No additional tests-for-the-tests.

**Organization**: Tasks are grouped by user story so each can be implemented independently. User Story 1 (P1 — runner wired up) is the MVP gate; without it the rest cannot run. User Story 2 (P1 — 10 component specs) is the second MVP slice. Stories 3, 4, 5 are P2 finishing work.

## Format: `[ID] [P?] [Story?] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: Which user story this task belongs to (US1, US2, US3, US4, US5)
- Exact file paths included in every task

## Path Conventions

Nuxt 4 monorepo. All paths are repo-relative from `/Users/betonajera/Workspaces/BetoNajera/sumo-ayce/`.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Install the two new test libraries and rewire `vitest.config.ts` to discover `app/`.

- [x] T001 Install the two new libraries at the verified pins from `research.md` §§ 2-3. Run: `pnpm add -D @vue/test-utils@^2.4.6 happy-dom@^15.10.2`. If `pnpm install` reports a peer-dependency conflict for `happy-dom` (likely `@nuxt/test-utils` 4.0.3 wants `^17.x`), bump to `happy-dom@^17.0.0` and document the actual installed version in this task's acceptance note. Acceptance: `package.json` `devDependencies` shows both `@vue/test-utils` and `happy-dom` at the resolved ranges; `pnpm-lock.yaml` updates; `pnpm install --frozen-lockfile` succeeds; existing deps untouched (Vitest 4.1.7, `@nuxt/test-utils` 4.0.3, Vue 3.5.34 unchanged). **Resolved: `@vue/test-utils@2.4.11`, `happy-dom@20.10.6` (bumped from `^15` because `@nuxt/test-utils@4.0.3` requires `happy-dom>=20.0.11`).**
- [x] T002 Rewrite `vitest.config.ts` at the repo root to use the Vitest 4 `test.projects` API per `research.md` §1. Two named projects: `app` (include `app/**/*.spec.ts` AND `app/**/*.test.ts`, environment `happy-dom`) and `server` (include `tests/**/*.test.ts` AND `server/**/*.test.ts`, environment `node`). Keep `defineVitestConfig` from `@nuxt/test-utils/config` as the outer wrapper. Preserve the existing `resolve.alias` for `@/types`. Acceptance: file replaces the prior `test.environment` + `test.include` shape; `pnpm typecheck` passes (no TS errors from the new shape); `pnpm test --list` (or equivalent dry-run) lists at least one file from each project. **Deviation: `defineVitestConfig` cannot be used as outer wrapper when using `projects` (it throws). Switched to `defineConfig` from `vitest/config` with `getVitestConfigFromNuxt()` called per project to bring in Nuxt-resolved aliases / plugins / optimizeDeps. Filtered out `ssr-styles`, `vite:vue`, `vite:vue-jsx` plugins which conflict with the server-side node env.**

**Checkpoint**: Dependencies installed and runner is wired. The two existing dead `app/composables/*.test.ts` files are now visible to the runner but may fail until US3.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Verify the wiring works end-to-end with one trivial assertion before any story-specific work. This is the minimal smoke before backfilling ten specs.

- [x] T003 Smoke-verify the new config by creating a temporary `app/components/ui/__smoke.spec.ts` that mounts a tiny inline component (`{ template: '<div class="smoke">ok</div>' }`) and asserts `wrapper.text()` equals `'ok'`. Run `pnpm test app/components/ui/__smoke.spec.ts`. Acceptance: the spec is picked up by the `app` project, runs under `happy-dom`, and reports 1 passing assertion. Delete the smoke file at the end of this task (it does NOT survive into the commit). If the run fails with "document is not defined", the `app` project's environment did not apply — fix T002 before proceeding. **Smoke passed, file deleted.**

**Checkpoint**: The wiring is proven. All user stories can now begin in parallel.

---

## Phase 3: User Story 1 — Frontend test runner is wired up and discovers `app/` (Priority: P1) 🎯 MVP

**Goal**: From a clean checkout, `pnpm test` discovers the existing files under `app/`, runs them under happy-dom, and exits without silent skips. The two existing dead composable tests come back to life.

**Independent Test**: Run `pnpm test`. Output shows two projects (`app` under happy-dom, `server` under node). Total file count strictly greater than the pre-feature baseline. Server/integration suite results unchanged.

### Implementation for User Story 1

- [x] T004 [US1] Run `pnpm test` and capture baseline output: count of test files discovered per project, count of passing assertions, count of failures, total runtime. Save this to `specs/008-frontend-test-setup/.phase3-baseline.txt` (this file is ephemeral and is removed at the end of US1 — purely a verification scratchpad). Acceptance: baseline written; both projects appear; server count matches pre-feature numbers (no regression). **Recorded inline in `progress/current.md`: pre-feature 32f/188t; after rewiring 34f/194t (2 new app composable files + 6 tests). Server count unchanged. Both projects visible in output.**

**Checkpoint**: User Story 1 is satisfied. The runner sees `app/`; existing tests run (pass or fail visibly); server tests untouched.

---

## Phase 4: User Story 3 — Existing dead composable tests are alive and green (Priority: P2)

> Out-of-order numbering rationale: US3 is dependency-light (just the two existing files) and a cheap sanity gate that confirms the new env doesn't break the legacy `vi.stubGlobal` pattern. Resolving US3 before US2 also means the 10 fresh component specs in US2 know they're not racing a broken environment.

**Goal**: The two files at `app/composables/useStaffAuth.test.ts` and `app/composables/useStaffCustomer.test.ts` execute under the new config and report green.

**Independent Test**: `pnpm test app/composables/` — 6 tests pass across the two files.

### Implementation for User Story 3

- [x] T010 [US3] Run `pnpm test app/composables/useStaffAuth.test.ts` and `pnpm test app/composables/useStaffCustomer.test.ts`. If both pass green (3 tests each = 6 total): record the result and mark this task done. If either fails: proceed to T011. Acceptance: a one-line note added at the bottom of `progress/current.md` recording the pass/fail outcome and the exact error message if any. **Initial run: useStaffCustomer 3/3 green; useStaffAuth 2/3 (logout failed because `navigateTo` was undefined). Proceed to T011.**
- [x] T011 [US3] If T010 reported failures, diagnose per `research.md` §4 fallback: missing globals get `vi.stubGlobal('<name>', ...)` calls added at the top of the failing file. Common candidates: `ref`, `reactive`, `readonly`, `toRef`, `computed`, `unref`, `$fetch`. Do NOT restructure the test logic; only add missing stubs. If a stub fix is insufficient (e.g. an async lifecycle hook is required), document the obstruction in `progress/current.md` and STOP — escalate to leader. Acceptance: after the fix, `pnpm test app/composables/` reports 6 passing tests, 0 failures, 0 skipped. **Added `vi.stubGlobal('navigateTo', vi.fn())` in `useStaffAuth.test.ts`. Both files green, 6/6 tests.**

**Checkpoint**: User Story 3 satisfied. The two legacy composable tests are operational.

---

## Phase 5: User Story 2 — One co-located spec exists for every Mercado Pop base component (Priority: P1) 🎯 MVP

**Goal**: Ten new `.spec.ts` files exist under `app/components/ui/`, one per base UI primitive, each with at least three assertions (default + one variant + one a11y/interaction). The PATTERN is the deliverable — exhaustive variant coverage is OUT OF SCOPE (per spec FR-006 and assumption A-8).

**Independent Test**: `pnpm test app/components/ui/` — at least 10 spec files run, ≥ 30 assertions, all green.

### Implementation for User Story 2

> Each task below is preceded by a **mandatory** read of the corresponding `.vue` source to confirm the exact prop names, default values, and emit signatures. The "variant" and "interaction" suggestions below are starting guidance; the implementer MUST adapt to what each component actually exposes. Spec file ≤ 60 lines target (Article VIII / spec FR-006).

- [x] T020 [P] [US2] **Read `app/components/ui/Button.vue` first**, then create `app/components/ui/Button.spec.ts` with three `it()` blocks: (a) default render — mount Button with a `default` slot text, assert `wrapper.text()` contains the slot content AND the root element has the expected primary-variant classes; (b) variant — mount with a non-default `variant` prop (likely `'ink'` or `'p'`), assert the corresponding class is on the root; (c) interaction — mount, call `wrapper.trigger('click')`, assert `wrapper.emitted('click')` is truthy. Acceptance: file exists, ≤ 60 lines, three assertions pass under `pnpm test app/components/ui/Button.spec.ts`.
- [x] T021 [P] [US2] **Read `app/components/ui/Card.vue` first**, then create `app/components/ui/Card.spec.ts` with three `it()` blocks: (a) default render — mount with default `tone` and a slot, assert the slot content is in the DOM AND the default tone class (`bg-panel`) is on the root; (b) variant — mount with `accent="express"`, assert the root element has the `scope-express` class (per `app/components/ui/Card.vue` line ~30); (c) slot/structure — assert a named slot (likely `default` or `header`) renders its content. Acceptance: file exists, ≤ 60 lines, three assertions pass.
- [x] T022 [P] [US2] **Read `app/components/ui/Chip.vue` first**, then create `app/components/ui/Chip.spec.ts` with three `it()` blocks: (a) default render — mount with default `active: false`, assert the inactive classes (`bg-panel text-ink`); (b) variant — mount with `active: true`, assert the active classes (`bg-ink text-bg`); (c) accessibility — assert `aria-pressed` reflects the `active` prop OR (if not implemented) assert `wrapper.trigger('click')` emits a `click` event. Acceptance: file exists, ≤ 60 lines, three assertions pass.
- [x] T023 [P] [US2] **Read `app/components/ui/Sticker.vue` first**, then create `app/components/ui/Sticker.spec.ts` with three `it()` blocks: (a) default render — mount with text content, assert the yellow background class AND the rotation transform; (b) variant — mount with a different `rotation` prop value (likely `-8deg` default → e.g. `4deg`), assert the inline style or class reflects the change; (c) accessibility — assert the sticker carries an `aria-label` OR `role="img"` if the design treats it as decorative-only. Acceptance: file exists, ≤ 60 lines, three assertions pass.
- [x] T024 [P] [US2] **Read `app/components/ui/Kicker.vue` first**, then create `app/components/ui/Kicker.spec.ts` with three `it()` blocks: (a) default render — mount with slot text, assert the kicker pill class (`bg-ink text-bg` or similar) AND the slot text; (b) variant — if the component accepts an `accent` or `tone` prop, mount with a non-default and assert the swap; otherwise mount inside a `.scope-express` wrapper and assert no break; (c) styling — assert the `-2deg` rotation transform is present (per overview.md §2 kicker spec). Acceptance: file exists, ≤ 60 lines, three assertions pass.
- [x] T025 [P] [US2] **Read `app/components/ui/Input.vue` first**, then create `app/components/ui/Input.spec.ts` with three `it()` blocks: (a) default render — mount with `placeholder="Search"`, assert the rendered `<input>` has the placeholder and the 2.5px ink-border class; (b) variant — mount with `disabled: true`, assert the input has the `disabled` attribute and the disabled-state class; (c) interaction — set the input value via `wrapper.find('input').setValue('hi')`, assert `wrapper.emitted('update:modelValue')` or `wrapper.emitted('input')` is truthy. Acceptance: file exists, ≤ 60 lines, three assertions pass.
- [x] T026 [P] [US2] **Read `app/components/ui/Select.vue` first**, then create `app/components/ui/Select.spec.ts` with three `it()` blocks: (a) default render — mount with an `options` prop of `[{ value: 'a', label: 'A' }, { value: 'b', label: 'B' }]`, assert two `<option>` elements render; (b) variant — mount with a `modelValue: 'b'`, assert the second option is selected; (c) accessibility — assert the `<select>` has an accessible name (via `aria-label`, slotted `<label>`, or the prop the component exposes). Acceptance: file exists, ≤ 60 lines, three assertions pass.
- [x] T027 [P] [US2] **Read `app/components/ui/Textarea.vue` first**, then create `app/components/ui/Textarea.spec.ts` with three `it()` blocks: (a) default render — mount with a placeholder, assert the rendered `<textarea>` has the placeholder; (b) variant — mount with `disabled: true`, assert the `disabled` attribute is set; (c) constraint — mount with `maxlength: 200` (or whatever prop exists), assert the `maxlength` attribute is on the textarea. If the component does not expose `maxlength`, substitute another constraint prop or fall back to an event-emission assertion (`update:modelValue` after `setValue`). Acceptance: file exists, ≤ 60 lines, three assertions pass.
- [x] T028 [P] [US2] **Read `app/components/ui/Nav.vue` first**, then create `app/components/ui/Nav.spec.ts` with three `it()` blocks: (a) default render — mount with a `links` prop of two entries, assert both link texts render; (b) variant — mount with one link marked `active: true`, assert the active link has the active-state class; (c) accessibility — assert the active link has `aria-current="page"` (or `aria-current="true"`); if Nav doesn't set `aria-current`, fall back to asserting `role="navigation"` on the wrapper. Acceptance: file exists, ≤ 60 lines, three assertions pass.
- [x] T029 [P] [US2] **Read `app/components/ui/Marquee.vue` first**, then create `app/components/ui/Marquee.spec.ts` with three `it()` blocks: (a) default render — mount with slot content (or a `text` prop), assert the slot/text is in the DOM AND the marquee container has the animation class; (b) variant — mount with `prefers-reduced-motion` simulated (set the matchMedia mock OR pass a `paused: true` prop if the component exposes one), assert the animation is suspended (class removed OR `animation-play-state: paused`); (c) accessibility — assert the marquee carries `aria-hidden="true"` if purely decorative, OR `role="marquee"`/`aria-live` if it carries content. Acceptance: file exists, ≤ 60 lines, three assertions pass.
- [x] T030 [US2] After T020–T029 land, run `pnpm test app/components/ui/`. Acceptance: 10 spec files execute, ≥ 30 assertions reported, all pass, zero warnings about unresolved auto-imports or unhandled rejections.

**Checkpoint**: User Story 2 satisfied. The pattern is shipped; ten reference files exist. Feature 009+ contributors can copy any of them.

---

## Phase 6: User Story 4 — Convention is documented in the harness docs (Priority: P2)

**Goal**: `docs/harness/verification.md` and `docs/harness/conventions.md` both describe the `Component.vue ↔ Component.spec.ts` co-location rule, the `.spec.ts` vs `.test.ts` policy (legacy allowed; new code uses `.spec.ts`), and the happy-dom environment. `CHECKPOINTS.md` C4 is extended to require frontend coverage. `.claude/agents/reviewer.md` gains two new gates.

**Independent Test**: `grep -i "spec.ts" docs/harness/verification.md docs/harness/conventions.md` returns ≥ 1 match in each file; `grep -nE "app/" CHECKPOINTS.md` returns a match in the C4 block; the reviewer.md file mentions both new gates.

### Implementation for User Story 4 (all four [P] — different files)

- [x] T040 [P] [US4] Update `docs/harness/verification.md`: add a new subsection "Frontend tests" under the existing "Quick verification (during the session)" heading. Content: (a) the convention `Component.vue ↔ Component.spec.ts` co-located, `.spec.ts` for new code, `.test.ts` legacy allowed, glob matches both; (b) the happy-dom environment is automatic for any file under `app/`; (c) the canonical pattern uses `mount()` from `@vue/test-utils`; (d) link to `app/components/ui/Button.spec.ts` as the reference example; (e) link to `specs/008-frontend-test-setup/quickstart.md` for the full guide. Length: 15–25 lines (concise). Acceptance: the new subsection exists; `grep -ni "spec.ts" docs/harness/verification.md` returns ≥ 1; `pnpm check` (biome) passes (the file is markdown but biome may format it).
- [x] T041 [P] [US4] Update `docs/harness/conventions.md`: append a "Testing" subsection. Content: (a) co-location rule (`<Name>.vue` + `<Name>.spec.ts` same directory); (b) suffix policy (`.spec.ts` new, `.test.ts` legacy allowed); (c) cross-reference: "for the runtime details (environment, runner commands, mount patterns), see [`docs/harness/verification.md`](./verification.md#frontend-tests)". Length: 10–15 lines. Acceptance: the new subsection exists; `grep -ni "spec.ts" docs/harness/conventions.md` returns ≥ 1; `pnpm check` passes.
- [x] T042 [P] [US4] Update `CHECKPOINTS.md` — replace the C4 bullet `pnpm test shows > 0 tests and all green` with `pnpm test runs and passes tests under BOTH server/ AND app/ — a feature with frontend changes does not pass C4 if no app/ tests run`. Keep the surrounding C4 bullets untouched. Acceptance: the bullet is replaced; `grep -n "app/" CHECKPOINTS.md` returns the new line in the C4 block; the rest of the file is byte-identical otherwise.
- [x] T043 [P] [US4] Update `.claude/agents/reviewer.md` — append two new gate definitions: (a) **Inline-hex grep gate** — quote the exact command `grep -rEn '(style=|: ?)#[0-9a-fA-F]{3,8}\b' app/components/ app/layouts/ app/pages/` and state "MUST return empty (exit 1). If non-empty, reject the PR citing the offending file:line and refer the author to `docs/business/overview.md` §2 + `specs/007-scaffold-and-design-system/data-model.md` §1 for the Mercado Pop token table"; (b) **Frontend spec presence** — state "any PR adding a new `.vue` file under `app/components/ui/` or `app/features/*/components/` MUST include a co-located `<Name>.spec.ts` in the same commit. Verify via `git diff --name-only master...HEAD`. Reject if absent." Acceptance: both rules are present in the file; `grep -ni "inline-hex\|spec.ts" .claude/agents/reviewer.md` returns ≥ 2 matches; `pnpm check` passes.

**Checkpoint**: User Story 4 satisfied. The convention is enshrined in the harness docs and the reviewer's prompt.

---

## Phase 7: User Story 5 — Staff surface is free of inline hex literals (Priority: P2)

**Goal**: Migrate the 22 inline hex literals across 8 staff files to Mercado Pop tokens. After migration, the project-wide grep returns zero matches across `app/components/`, `app/layouts/`, `app/pages/`.

**Independent Test**: `grep -rEn '(style=|: ?)#[0-9a-fA-F]{3,8}\b' app/components/ app/layouts/ app/pages/` returns no output (exit 1).

> **Token mapping (per research.md §5, assumption A-3)**:
> - `#fff` → `rgb(var(--panel))`
> - `#22c55e` → `rgb(var(--green))`
> - `#ef4444` → `rgb(var(--pink))`
>
> Apply within `<style>` blocks only. Do NOT modify `app/assets/css/staff.css` (legacy `--color-*` system stays untouched per spec FR-007 and out-of-scope §).

### Implementation for User Story 5 (T050–T057 are [P] — different files; T058 is sequential)

- [x] T050 [P] [US5] Migrate `app/components/staff/RewardsList.vue` — replace `color: #fff` on line ~190 with `color: rgb(var(--panel))`. Acceptance: the file no longer contains any literal `#[0-9a-fA-F]{3,8}\b` inside `<style>`; `pnpm dev` renders the rewards list with unchanged visual appearance (panel-white text on the dark surface); `pnpm check` and `pnpm typecheck` pass.
- [x] T051 [P] [US5] Migrate `app/components/staff/LoginForm.vue` — replace `color: #ef4444` (line ~94) with `color: rgb(var(--pink))` AND `color: #fff` (line ~103) with `color: rgb(var(--panel))`. Acceptance: file is hex-free; the login error message renders pink (was red) and any white text remains white via the panel token; `pnpm check` and `pnpm typecheck` pass.
- [x] T052 [P] [US5] Migrate `app/components/staff/TransactionTable.vue` — replace the four hex literals (lines ~164, ~180, ~185, ~192): two `color: #22c55e` → `color: rgb(var(--green))`, two `color: #ef4444` → `color: rgb(var(--pink))`. Acceptance: file is hex-free; transaction rows still show green for earn and pink-was-red for redeem; `pnpm check` and `pnpm typecheck` pass.
- [x] T053 [P] [US5] Migrate `app/components/staff/VisitButton.vue` — replace the three hex literals (lines ~84, ~126, ~132): `color: #fff` → `color: rgb(var(--panel))`; `color: #22c55e` → `color: rgb(var(--green))`; `color: #ef4444` → `color: rgb(var(--pink))`. Acceptance: file is hex-free; visit button success/error states render with the corresponding tokens; `pnpm check` and `pnpm typecheck` pass.
- [x] T054 [P] [US5] Migrate `app/pages/staff/customers/[phone].vue` — replace four hex literals (lines ~194, ~200, ~233, ~282): `color: #22c55e` → `color: rgb(var(--green))`, `color: #ef4444` → `color: rgb(var(--pink))`, two `color: #fff` → `color: rgb(var(--panel))`. Acceptance: file is hex-free; the customer detail page renders with semantic colors preserved; `pnpm check` and `pnpm typecheck` pass.
- [x] T055 [P] [US5] Migrate `app/pages/staff/dashboard.vue` — replace the two `color: #fff` literals (lines ~213, ~274) with `color: rgb(var(--panel))`. Acceptance: file is hex-free; dashboard's white-text-on-dark elements still render white; `pnpm check` and `pnpm typecheck` pass.
- [x] T056 [P] [US5] Migrate `app/pages/staff/admin/index.vue` — replace the two hex literals (lines ~232, ~238): `color: #22c55e` → `color: rgb(var(--green))`, `color: #ef4444` → `color: rgb(var(--pink))`. Acceptance: file is hex-free; admin overview's status cells render with the green/pink tokens; `pnpm check` and `pnpm typecheck` pass.
- [x] T057 [P] [US5] Migrate `app/pages/staff/admin/transactions/[id].vue` — replace the four hex literals (lines ~162, ~168, ~171, ~186): two `color: #ef4444` → `color: rgb(var(--pink))`, `background: #ef4444` → `background: rgb(var(--pink))`, `color: #fff` → `color: rgb(var(--panel))`, `color: #22c55e` → `color: rgb(var(--green))`. Acceptance: file is hex-free; the transaction detail's status / refund button colors are preserved semantically; `pnpm check` and `pnpm typecheck` pass.
- [x] T058 [US5] After T050–T057 complete, run the project-wide grep gate: `grep -rEn '(style=|: ?)#[0-9a-fA-F]{3,8}\b' app/components/ app/layouts/ app/pages/`. Acceptance: command exits with code 1 (no matches) and produces no stdout. If any match remains, identify the offending file, repeat the appropriate T05x migration for that file, then re-run the grep until clean.

**Checkpoint**: User Story 5 satisfied. The full `app/` tree is hex-literal-free.

---

## Phase 8: Polish & Cross-Cutting (final verification)

**Purpose**: Confirm the full harness passes — biome, typecheck, tests, init.sh — before declaring `spec_ready`'s implementation work complete.

- [x] T060 [P] Run `pnpm check --error-on-warnings` (biome). Acceptance: exit 0, zero warnings, zero errors.
- [x] T061 [P] Run `pnpm typecheck` (nuxt typecheck). Acceptance: exit 0, zero TS errors.
- [x] T062 Run `pnpm test`. Acceptance: exit 0; at least 12 frontend test files report under the `app` project (10 component specs + 2 revived composable tests); all server/integration tests under the `server` project still pass; total assertion count strictly greater than the pre-feature baseline captured in T004.
- [x] T063 Run `./init.sh` from the repo root. Acceptance: exit 0; the script's six steps (env check, harness check, JSON validation, biome, typecheck, vitest) all green; no manual intervention required.

**Checkpoint**: Feature 008 is implementation-complete. The leader can flag the human gate for review → merge.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)** — no dependencies; can start immediately. T001 → T002 sequential (config depends on installed deps).
- **Phase 2 (Foundational smoke)** — depends on Phase 1. T003 is the gate before any user-story work.
- **Phase 3 (US1)** — depends on Phase 2. One task; serves as a baseline capture.
- **Phase 4 (US3)** — depends on Phase 2 (NOT on US1; US1's baseline capture is informational only). Can run in parallel with US2 by a separate developer.
- **Phase 5 (US2)** — depends on Phase 2. Ten parallel tasks (T020–T029) followed by a single sequential gate (T030).
- **Phase 6 (US4)** — depends on US2 only for T040 (which links to `Button.spec.ts`); T041–T043 depend only on Phase 1.
- **Phase 7 (US5)** — depends on Phase 2 (independent of US1/2/3/4). Eight parallel tasks (T050–T057) followed by a sequential gate (T058).
- **Phase 8 (Polish)** — depends on ALL user stories. T060 + T061 [P]; T062 + T063 sequential.

### User Story Dependencies

- **US1 (P1)**: depends on Phase 1+2. Cheap and quick.
- **US2 (P1)**: depends on Phase 1+2 AND on US3 being green (so the env is proven on real Vue code before fresh specs are written — soft dependency, not strict).
- **US3 (P2)**: depends on Phase 1+2. Independent of US1, US2.
- **US4 (P2)**: depends on Phase 1+2; T040 has a soft link to US2's `Button.spec.ts` but can be written in parallel and the link verified at the end.
- **US5 (P2)**: depends on Phase 1+2. Fully independent of any test-related story; could be done by a separate developer entirely.

### Parallel Opportunities

- **Phase 5 (US2)**: T020–T029 are 10 fully-independent file creations. All [P].
- **Phase 7 (US5)**: T050–T057 are 8 fully-independent file migrations. All [P].
- **Phase 6 (US4)**: T040–T043 are 4 different documentation files. All [P].
- **Phase 8 (Polish)**: T060 + T061 are independent gate commands. [P].

---

## Parallel Execution Examples

### Example 1 — US2 backfill (all 10 component specs in one parallel sweep)

```bash
# After T002+T003 land, dispatch ten implementer subagents in parallel:
Task: "T020 — write app/components/ui/Button.spec.ts per tasks.md"
Task: "T021 — write app/components/ui/Card.spec.ts per tasks.md"
Task: "T022 — write app/components/ui/Chip.spec.ts per tasks.md"
Task: "T023 — write app/components/ui/Sticker.spec.ts per tasks.md"
Task: "T024 — write app/components/ui/Kicker.spec.ts per tasks.md"
Task: "T025 — write app/components/ui/Input.spec.ts per tasks.md"
Task: "T026 — write app/components/ui/Select.spec.ts per tasks.md"
Task: "T027 — write app/components/ui/Textarea.spec.ts per tasks.md"
Task: "T028 — write app/components/ui/Nav.spec.ts per tasks.md"
Task: "T029 — write app/components/ui/Marquee.spec.ts per tasks.md"
# Then T030 (sequential gate)
```

### Example 2 — US5 hex cleanup (all 8 file migrations in one parallel sweep)

```bash
Task: "T050 — migrate app/components/staff/RewardsList.vue per tasks.md"
Task: "T051 — migrate app/components/staff/LoginForm.vue per tasks.md"
Task: "T052 — migrate app/components/staff/TransactionTable.vue per tasks.md"
Task: "T053 — migrate app/components/staff/VisitButton.vue per tasks.md"
Task: "T054 — migrate app/pages/staff/customers/[phone].vue per tasks.md"
Task: "T055 — migrate app/pages/staff/dashboard.vue per tasks.md"
Task: "T056 — migrate app/pages/staff/admin/index.vue per tasks.md"
Task: "T057 — migrate app/pages/staff/admin/transactions/[id].vue per tasks.md"
# Then T058 (sequential grep gate)
```

### Example 3 — US4 docs sweep

```bash
Task: "T040 — update docs/harness/verification.md per tasks.md"
Task: "T041 — update docs/harness/conventions.md per tasks.md"
Task: "T042 — update CHECKPOINTS.md C4 per tasks.md"
Task: "T043 — update .claude/agents/reviewer.md per tasks.md"
```

---

## Implementation Strategy

### MVP First

1. **Phase 1** (T001, T002) — deps + config.
2. **Phase 2** (T003) — smoke proof.
3. **Phase 4** (T010, T011) — revive composable tests.
4. **Phase 5** (T020–T030) — backfill 10 component specs.
5. **STOP and VALIDATE**: run `pnpm test app/`. ≥ 12 files, ≥ 36 assertions, all green. This is the technical MVP. The convention is live.

### Full Delivery

6. **Phase 3** (T004) — baseline capture (cheap, do anytime after Phase 2).
7. **Phase 6** (T040–T043) — convention docs + reviewer gates.
8. **Phase 7** (T050–T058) — staff hex cleanup.
9. **Phase 8** (T060–T063) — final verification gate.
10. **Hand back to leader** — feature 008 implementation complete; awaiting reviewer.

### Parallel Team Strategy

With 2–3 implementer subagents:

- Agent A: Phase 1 → Phase 2 → Phase 4 (sequential core path).
- Agent B: Phase 5 (10 component specs in parallel) once Phase 2 unblocks.
- Agent C: Phase 6 (docs) + Phase 7 (hex cleanup) — fully independent of A/B once Phase 1 lands.
- All converge at Phase 8.

---

## Notes

- **[P] tasks**: different files, no dependencies on incomplete tasks.
- **[Story] label**: maps each task to a user story for traceability.
- **Tests are the deliverable**: this feature's "implementation" IS writing tests; no separate "test the tests" layer.
- **Spec file size**: each component spec ≤ 60 lines (Article VIII + spec FR-006).
- **Behaviour-driven names**: every `it()` describes a behaviour, never a method name (Article IV).
- **No new mocks**: file-local `vi.stubGlobal` is OK; do NOT create a new file under `tests/mocks/` (research.md §10 / Article IV centralization rule).
- **Token mapping is mechanical**: `#fff → rgb(var(--panel))`, `#22c55e → rgb(var(--green))`, `#ef4444 → rgb(var(--pink))` — do NOT introduce a new `--danger` token (research.md §5).
- **Visual smoke is required for US5**: after migration, manually open each touched staff page in `pnpm dev` to confirm semantic colors are preserved. This is part of the task's acceptance, not a separate task.
- **Commit cadence**: per phase or per logical sweep. Use `/commit` skill (gitmoji + Conventional Commits) at each natural boundary.
- **Anti-patterns to avoid**: don't rename legacy `.test.ts` files; don't touch `app/assets/css/staff.css`; don't add coverage thresholds (deferred per research.md §6); don't wire Storybook test-runner (research.md §8).
