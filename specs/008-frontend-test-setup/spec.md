# Feature Specification: Frontend Unit Test Setup (Vitest + happy-dom + Vue Test Utils)

**Feature Branch**: `feat/008-frontend-test-setup`
**Created**: 2026-06-17
**Status**: Draft
**Input**: User description: Feature 8 in `feature_list.json` — establish frontend unit testing infrastructure before any homepage / content-page work begins (feature 009 onward). Today `vitest.config.ts` only globs `tests/**` and `server/**` — every test file under `app/` is silently ignored (two dead `*.test.ts` files in `app/composables/` from feature 006 staff portal never run). This feature unlocks test-first development for Vue components and composables, backfills one spec per base UI primitive shipped in feature 007, and clears tech-debt carried over from feature 007 (22 inline hex literals in the staff surface).

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Frontend test runner is wired up and discovers `app/` (Priority: P1)

A contributor writes a unit test next to a Vue component (or revives a composable test) and runs `pnpm test`. The test is discovered, executed under a DOM environment, and either passes or fails on its own merit — it is never silently skipped.

**Why this priority**: This is the MVP of the feature. Without the runner discovering `app/`, none of the other scope items have a destination. The existing pipeline (`tests/**`, `server/**`) MUST keep working untouched so feature 001–006 regression coverage stays intact.

**Independent Test**: From a clean checkout, run `pnpm test`. The test count goes from "N (server-only)" to "N + ≥12 frontend tests"; output shows two distinct environments (DOM for `app/`, node for everything else); previously-dead composable tests now produce visible pass/fail signal.

**Acceptance Scenarios**:

1. **Given** the repo on `feat/008-frontend-test-setup`, **When** the contributor runs `pnpm test`, **Then** the runner reports at least 12 test files discovered under `app/` (10 component specs + 2 composable tests) plus all pre-existing tests under `tests/` and `server/`, and the suite exits 0.
2. **Given** a contributor creates a new file `app/components/ui/Foo.spec.ts` that mounts a component, **When** they run `pnpm test`, **Then** the file is picked up automatically (no config edit), executes under the DOM environment, and a passing assertion is reported.
3. **Given** the contributor runs `pnpm test` on a file under `server/api/**` that uses `node:fs`, **When** the test executes, **Then** it runs under the node environment (no DOM globals leak) and continues to pass exactly as it did before this feature.
4. **Given** a contributor writes a frontend test that uses `document.querySelector(...)` or `window.matchMedia`, **When** they run `pnpm test`, **Then** the test executes against a real DOM implementation (no `document is not defined` error).

---

### User Story 2 — One co-located spec exists for every Mercado Pop base component (Priority: P1)

A contributor opens any of the ten base UI primitives shipped in feature 007 (`Button`, `Card`, `Chip`, `Sticker`, `Kicker`, `Input`, `Select`, `Textarea`, `Nav`, `Marquee`). Next to the `Component.vue` and `Component.stories.ts` files, they find a `Component.spec.ts` file that:

1. Mounts the component in its default state and asserts the expected render.
2. Mounts the component with one significant prop variant and asserts the behavioural difference (e.g. accent swap, disabled state, sticker rotation, modality toggle).
3. Asserts one accessibility or interaction property (e.g. emits `click`, focus ring, aria attribute, keyboard navigation).

**Why this priority**: This is the second half of MVP. The pattern is the deliverable — feature 009+ contributors will look at these ten files as the reference shape for every future component spec. Without concrete examples, the convention degrades into folklore.

**Independent Test**: Verify `app/components/ui/` has ten files matching `*.spec.ts`, each importing `@vue/test-utils` and the matching `.vue` file. Run `pnpm test app/components/ui/` — at least ten test files execute, ≥30 assertions run, suite exits 0.

**Acceptance Scenarios**:

1. **Given** `app/components/ui/Button.vue` exists, **When** a contributor inspects the folder, **Then** they find `app/components/ui/Button.spec.ts` co-located next to it (same directory, same base name).
2. **Given** the ten base components, **When** a contributor runs `pnpm test`, **Then** each spec file contributes at least three independent assertions (default render + one variant + one accessibility/interaction).
3. **Given** a contributor reads `Button.spec.ts`, **When** they want to write a spec for a new component, **Then** the file is short enough (≤60 lines), uses no project-specific helpers beyond `@vue/test-utils`'s `mount`, and is structurally copy-pasteable.
4. **Given** the ten specs run, **When** the suite finishes, **Then** all assertions pass without warnings about missing Vue runtime, unresolved auto-imports, or unhandled promise rejections.

---

### User Story 3 — Existing dead composable tests are alive and green (Priority: P2)

The two pre-existing test files at `app/composables/useStaffAuth.test.ts` and `app/composables/useStaffCustomer.test.ts` (shipped with feature 006 but never executed because the config did not glob `app/`) are now picked up, executed and pass.

**Why this priority**: These two files represent test intent that already existed in the codebase. Leaving them dead would signal that test files in `app/` are decorative. Reviving them validates the new pipeline against real composable code, not fresh fixtures.

**Independent Test**: Run `pnpm test app/composables/`. Both files execute, all assertions pass, no skipped tests.

**Acceptance Scenarios**:

1. **Given** the two existing `.test.ts` files in `app/composables/`, **When** the new vitest config is applied, **Then** both files are matched by the glob and execute against the DOM environment.
2. **Given** the files stub Vue auto-imports manually (`vi.stubGlobal('ref', ...)`, `vi.stubGlobal('reactive', ...)`), **When** they run under the new environment, **Then** they either (a) keep working with the manual stubs OR (b) are reworked to use the Vue runtime exposed by `@nuxt/test-utils` — the choice is documented in `research.md`.
3. **Given** the two files run, **When** the suite finishes, **Then** the test count reports at least 6 passing tests (3 per file, matching the existing `describe` blocks).

---

### User Story 4 — Convention is documented in the harness docs (Priority: P2)

A new contributor reads `docs/harness/verification.md` or `docs/harness/conventions.md` and learns the rule for placing a frontend test file: same directory as the source, suffix `.spec.ts` (not `.test.ts`) for new files, matched by both globs so the existing staff `.test.ts` files keep working.

**Why this priority**: A convention not written down rots into folklore within two features. Documenting it in the harness docs is what makes the reviewer agent's grep gate enforceable in future features.

**Independent Test**: Open `docs/harness/verification.md` and `docs/harness/conventions.md`. Both files mention the `Component.vue ↔ Component.spec.ts` rule and the `.spec.ts` vs `.test.ts` distinction (legacy `.test.ts` allowed, new code uses `.spec.ts`).

**Acceptance Scenarios**:

1. **Given** a contributor opens `docs/harness/verification.md`, **When** they search for "spec.ts" or "co-located", **Then** they find a section describing the convention.
2. **Given** a contributor opens `docs/harness/conventions.md`, **When** they search for "test", **Then** they find a reference (either inline or as a delegated note to verification.md) describing the `.spec.ts` ↔ `Component.vue` rule.
3. **Given** the documentation is published, **When** a contributor opens a new Vue file, **Then** the docs unambiguously tell them what filename to use for the test (`MyComponent.spec.ts`, NOT `MyComponent.test.ts` for new code).

---

### User Story 5 — Staff surface is free of inline hex literals (Priority: P2)

The 22 inline hex literals (`#fff`, `#22c55e`, `#ef4444`, `#fff`) currently appearing in `app/components/staff/*.vue` and `app/pages/staff/*.vue` are replaced with values drawn from the Mercado Pop unified palette (`var(--ink)`, `var(--bg)`, `var(--panel)`, `var(--green)` for success, `var(--pink)` or a status-error token for danger, etc.). After migration the project-wide grep gate `grep -rEn '(style=|: ?)#[0-9a-fA-F]{3,8}\b' app/components/ app/layouts/ app/pages/` returns ZERO matches.

**Why this priority**: This is the carried-over tech debt the feature 007 reviewer explicitly deferred. It blocks the T108c grep gate from being a clean repo-wide check and undermines the Mercado Pop token contract (Article VII — design context is single source of truth).

**Independent Test**: Run the exact grep from feature 007's T108c (`grep -rEn '(style=|: ?)#[0-9a-fA-F]{3,8}\b' app/components/ app/layouts/ app/pages/`) — output is empty. Visual smoke: open each touched staff page in `pnpm dev`; semantic meaning preserved (success states still look like success, error states like error, white surfaces still white).

**Acceptance Scenarios**:

1. **Given** the staff files currently contain 22 hex literals, **When** the migration is complete, **Then** the grep gate returns zero matches across `app/components/`, `app/layouts/`, and `app/pages/`.
2. **Given** a `color: #22c55e` (success green) used in `TransactionTable.vue`, **When** the migration is complete, **Then** the file uses the Mercado Pop success token (`var(--green)` wrapped as `rgb(var(--green))` per feature 007 §15 channel-format migration) or a Tailwind utility (`text-green`).
3. **Given** a `color: #fff` used in `VisitButton.vue` for white text on a dark surface, **When** the migration is complete, **Then** the file uses `var(--panel)` (white) wrapped as `rgb(var(--panel))` or the Tailwind utility `text-panel`.
4. **Given** a `color: #ef4444` (status error red) used in `LoginForm.vue`, **When** the migration is complete, **Then** the file uses an existing Mercado Pop status token — see Assumption A-3 for which token represents "error" in the unified palette.
5. **Given** the legacy `--color-*` token system at `app/assets/css/staff.css`, **When** the migration is complete, **Then** the legacy token file remains untouched — only the inline hex literals are migrated; restyling the staff portal to the Mercado Pop direction is explicitly out of scope.

---

### Edge Cases

- A contributor writes both a `Component.test.ts` AND a `Component.spec.ts` file for the same source file — both run; this is allowed (legacy + new). Linting/review surfaces this only if it becomes a recurring pattern.
- A contributor places `Foo.spec.ts` outside `app/` (e.g. `tests/integration/Foo.spec.ts`) — the file runs but under the node environment (no DOM). This is the desired behaviour; the DOM environment is opt-in by location.
- A composable test uses `process.env.*` (e.g. reading `DATABASE_URL`) — happy-dom keeps `process` available; tests under `app/` MAY access node globals when needed.
- A component spec imports a Nuxt auto-imported function (e.g. `useState`, `navigateTo`) — the spec MUST resolve those via `@nuxt/test-utils`'s `mountSuspended` or an explicit import; bare auto-import expectations are out of scope for this feature (covered case-by-case in feature 009+ specs).
- The grep gate runs over a file that contains a legitimate hex literal inside a comment (e.g. `/* was #ef4444 */`). The gate's regex `(style=|: ?)#[0-9a-fA-F]{3,8}\b` should NOT match comments; if it does, the offending comment is rewritten or removed.
- A future feature adds a new base component to `app/components/ui/` — the convention requires it to ship with a `.spec.ts`. Reviewer agent enforces this via grep, not via this spec.
- `happy-dom` and `jsdom` are both available in the dependency tree (transitive). The vitest config MUST select `happy-dom` explicitly so the choice is deterministic regardless of resolution order.
- A test imports `mapbox-gl` (which executes browser-only code on import). This feature does NOT need to solve that; the maps adapter lives in feature 012 and will carry its own mocking strategy.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The test runner (Vitest) MUST discover and execute test files matching `app/**/*.spec.ts` AND `app/**/*.test.ts`, in addition to the existing `tests/**/*.test.ts` and `server/**/*.test.ts` globs. No previously-passing test MAY regress.
- **FR-002**: Test files under `app/` MUST execute against a browser-like DOM environment (`happy-dom`). Test files under `tests/` and `server/` MUST execute against `node` (no DOM globals). The environment selection MUST be expressed using the Vitest 4 API in current use (`test.projects` or per-glob environment, whichever is the supported mechanism in the installed Vitest version — to be confirmed in research.md).
- **FR-003**: `happy-dom` and `@vue/test-utils` MUST be declared as `devDependencies` at versions compatible with the installed Vue (3.5.34), Vitest (4.1.7), and `@nuxt/test-utils` (4.0.3) versions. Exact pins are decided in research.md.
- **FR-004**: The two existing files `app/composables/useStaffAuth.test.ts` and `app/composables/useStaffCustomer.test.ts` MUST be picked up by the new config and MUST execute green. Whether they are reworked or kept-as-is is a research-driven decision; the outcome is a green run.
- **FR-005**: The convention `Component.vue ↔ Component.spec.ts` (co-located, same directory, same base name, `.spec.ts` suffix for new code, `.test.ts` legacy allowed) MUST be documented in BOTH `docs/harness/verification.md` AND `docs/harness/conventions.md`. The two locations MAY cross-reference each other but MUST both mention the rule.
- **FR-006**: Exactly ten new spec files MUST be created, one per base UI primitive shipped in feature 007: `app/components/ui/{Button,Card,Chip,Sticker,Kicker,Input,Select,Textarea,Nav,Marquee}.spec.ts`. Each spec MUST contain at minimum three assertions: (a) default render via `mount()`, (b) one significant prop variant, (c) one accessibility or interaction property.
- **FR-007**: The 22 inline hex literals currently appearing under `app/components/staff/*.vue` and `app/pages/staff/*.vue` MUST be migrated to either Mercado Pop CSS custom properties (`rgb(var(--token))`) or Tailwind utility classes mapped to those tokens. The legacy `--color-*` token system at `app/assets/css/staff.css` MUST NOT be modified — only inline hex literals are migrated.
- **FR-008**: After migration, the grep `grep -rEn '(style=|: ?)#[0-9a-fA-F]{3,8}\b' app/components/ app/layouts/ app/pages/` MUST return zero matches. This becomes a permanent reviewer-agent gate (carried over from feature 007's T108c, now extended to the full `app/` tree).
- **FR-009**: `CHECKPOINTS.md` C4 ("Verification is real") MUST be extended so the `pnpm test` checkpoint explicitly requires coverage of `app/` (not only `server/`). The exact wording is decided in plan.md, but the intent is unambiguous: a feature with frontend changes does NOT pass C4 if `pnpm test` runs zero tests under `app/`.
- **FR-010**: The verification pipeline (`./init.sh`) MUST continue to exit with code 0 after all the above changes are applied. `pnpm check`, `pnpm typecheck`, and `pnpm test` MUST all pass.
- **FR-011**: No new external service, network call, or filesystem fixture MAY be introduced by the component specs. Mounts MUST be self-contained — props in, render out — per Article IV ("State-independent tests").

### Key Entities

This feature ships no persistent entities (no DB schema, no migration, no API endpoint). What follows are the design-time contracts the feature codifies:

- **Frontend test convention**: A pair of files in the same directory — `<Name>.vue` (the source) and `<Name>.spec.ts` (the test). The spec imports the source via the same alias the production code uses; mounts it via `@vue/test-utils`; asserts at least three properties (default + variant + a11y/interaction). The contract is documented in `docs/harness/verification.md` and `docs/harness/conventions.md`.
- **Frontend test environment**: A DOM emulation (`happy-dom`) applied automatically to every file under `app/`. The environment exposes `document`, `window`, `HTMLElement`, etc. — sufficient for component-level assertions without launching a real browser.
- **Inline-hex grep gate**: A reviewer-agent rule (regex `(style=|: ?)#[0-9a-fA-F]{3,8}\b`) that scans `app/components/`, `app/layouts/`, and `app/pages/` and rejects any new feature that introduces a non-token color. This was T108c in feature 007 (limited to `app/pages/` and `app/layouts/`); this feature extends it to `app/components/` after clearing the existing matches.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: After this feature lands, running `pnpm test` from a clean checkout reports at least 12 frontend test files discovered under `app/` (≥10 component specs + ≥2 composable tests), in addition to all pre-existing server/integration tests. Total suite count strictly grows; nothing regresses.
- **SC-002**: All discovered tests pass. The `pnpm test` command exits with code 0 in under 60 seconds on a developer laptop (~3 GHz, 8 cores). The 60-second budget is informational — it is not a hard cap; pre-existing tests already constrain the lower bound.
- **SC-003**: Every base UI primitive shipped in feature 007 (Button, Card, Chip, Sticker, Kicker, Input, Select, Textarea, Nav, Marquee — exactly ten components) has exactly one co-located `.spec.ts` file with at least three independent assertions covering default, one variant, and one accessibility or interaction property.
- **SC-004**: The grep `grep -rEn '(style=|: ?)#[0-9a-fA-F]{3,8}\b' app/components/ app/layouts/ app/pages/` returns zero output (exit 1 — no matches). This stays true permanently — any reintroduction is rejected by reviewer-agent.
- **SC-005**: A contributor unfamiliar with the project can read one of the ten component specs and replicate the pattern in a new spec within 15 minutes — measured by the time-to-first-passing-test on a new component spec written by feature 009's author.
- **SC-006**: `./init.sh` exits 0 from a clean checkout on `feat/008-frontend-test-setup`. No quality gate is bypassed.
- **SC-007**: Both `docs/harness/verification.md` and `docs/harness/conventions.md` mention the `Component.vue ↔ Component.spec.ts` rule. Verifiable by `grep -i "spec.ts" docs/harness/verification.md docs/harness/conventions.md` returning at least one match in each file.

## Assumptions

- **A-1 (Vitest 4 environment API)**: Vitest 4 deprecated `environmentMatchGlobs` in favor of `test.projects` (per the Vitest 4 migration notes). The plan/research phases will confirm and pick the exact supported mechanism. If `test.projects` is the chosen path, each project (one for `app/`, one for `tests/`+`server/`) gets its own environment declaration. If `environmentMatchGlobs` still works in 4.1.x (deprecation-warning only), it MAY be used as a stopgap — but the spec target is the non-deprecated API.
- **A-2 (`happy-dom` choice over `jsdom`)**: Selected for being ~2× faster on Vue component mounts, smaller install size, and Nuxt 4 + Vitest 4 community standard. `jsdom` would also work but is rejected in favor of the lighter option for a project of this scale. Documented in research.md.
- **A-3 (Error/danger token for hex migration)**: The Mercado Pop token set in `docs/business/overview.md` §2 includes `--green` for success but does NOT include a dedicated error/danger token. The 22-literal migration MUST decide: (a) use `--pink` (already in the palette, decorative role) for error states, OR (b) introduce a new `--danger` token in `tokens.css` + `tailwind.config.ts`. Plan.md selects one; spec stays neutral. Best guess: (a) — reuse `--pink`, since it's already in the palette and "danger pink" is brand-consistent. If (b) is chosen, the plan MUST update `tokens.css` and `tailwind.config.ts` and document the addition.
- **A-4 (`.test.ts` legacy allowed)**: The two existing `app/composables/*.test.ts` files use the `.test.ts` suffix. Renaming them to `.spec.ts` would be a churn-only change and risks losing the original feature 006 intent. The glob MUST match both suffixes; the convention for NEW code is `.spec.ts`; renames are out of scope.
- **A-5 (No Storybook integration)**: This feature does NOT wire Storybook's test-runner, interaction tests, or play functions into Vitest. The two systems coexist; each owns its own surface. Storybook stays the visual-review surface (Article VII); Vitest specs are the unit-assertion surface (Article IV).
- **A-6 (No E2E)**: Playwright / Cypress / Nuxt's `@nuxt/test-utils-e2e` are out of scope for this feature. E2E coverage is owned by a future feature when content pages exist.
- **A-7 (No coverage threshold enforcement yet)**: Constitution Article IV requires 70 % composable coverage and 80 % server-route coverage. Those numbers are not enforced as a hard gate by this feature — they apply once feature 009+ pages start writing tests. This feature ships the infrastructure, not the coverage target. The `@vitest/coverage-v8` package is already installed; wiring the threshold is a follow-up.
- **A-8 (Pattern coverage, not exhaustive)**: Each of the ten component specs covers default + one variant + one a11y/interaction. Exhaustive variant coverage (every prop, every state) is explicitly out of scope. Feature 009+ pages will write additional specs as needed.
- **A-9 (Staff hex migration is mechanical)**: The 22 hex literals are migrated by 1:1 token replacement, not by restyling. Visual semantics MUST be preserved (success still green, error still red, white still white). The legacy `--color-*` token system at `app/assets/css/staff.css` is NOT touched — restyling the staff portal to the Mercado Pop direction is a future feature.
- **A-10 (Reviewer rule scope)**: After this feature, the inline-hex grep gate becomes a permanent reviewer-agent rule applied to every PR touching `app/`. This is a process change in the reviewer's prompt, not a code change shipped here — but the reviewer's instructions document gets updated as part of plan.md.

## Dependencies

- **Feature 007 (Scaffold & Design System)** — MUST be done. The ten base UI components and the Mercado Pop token system are the inputs to user stories 2, 4, 5.
- **Feature 006 (Staff Portal)** — MUST be done. The two existing composable tests and the staff hex literals come from this feature's output.
- **`@nuxt/test-utils` 4.0.3** — already installed. The Vitest config currently uses `defineVitestConfig` from this package; this feature continues to use it (Nuxt auto-imports may matter for component specs).
- **`vitest` 4.1.7**, **`@vitest/coverage-v8` 4.1.7** — already installed.
- **`vue` 3.5.34** — already installed. `@vue/test-utils` MUST match this Vue major.
- **Vercel deployment pipeline** — unaffected by this feature. CI must run `pnpm test` on every push; that path is unchanged.

## Out of Scope

- Storybook test-runner / interaction tests / play functions.
- Playwright / Cypress / E2E coverage.
- Reaching constitution Article IV coverage thresholds (70 % composables, 80 % server routes) as a hard CI gate.
- Restyling the staff portal to Mercado Pop visual direction.
- Migrating the legacy `--color-*` token system at `app/assets/css/staff.css` into the Mercado Pop unified palette.
- Adding a new `--danger` token (assumption A-3 picks the simpler path of reusing `--pink`; if plan.md disagrees, it is the plan's call, not this spec's).
- Mocking strategy for Mapbox / Twilio / Drizzle in component specs — feature-specific and deferred to the feature that introduces the integration.
