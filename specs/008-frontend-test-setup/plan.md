# Implementation Plan: Frontend Unit Test Setup (Vitest + happy-dom + Vue Test Utils)

**Branch**: `feat/008-frontend-test-setup` | **Date**: 2026-06-17 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/008-frontend-test-setup/spec.md`

## Summary

Wire Vitest to discover and execute frontend tests under `app/` against a `happy-dom` environment (server/integration tests stay on node), backfill ten co-located component specs (one per Mercado Pop base UI primitive shipped in feature 007), revive the two dead composable tests from feature 006, document the convention in the harness docs, extend CHECKPOINTS.md C4 to require frontend coverage, and clean up 22 inline hex literals in the staff surface so the project-wide grep gate (`grep -rEn '(style=|: ?)#[0-9a-fA-F]{3,8}\b' app/components/ app/layouts/ app/pages/`) returns zero matches. The deliverable unlocks test-first frontend work for feature 009 onward.

## Technical Context

**Language/Version**: TypeScript strict (Node 22+, `pnpm` 10+), Vue 3.5.34, Nuxt 4.4.6.
**Primary Dependencies**: Vitest 4.1.7 (with `@nuxt/test-utils` 4.0.3 wrapper for `defineVitestConfig`), `@vue/test-utils` (target pin `^2.4.6` — see research.md §3), `happy-dom` (target pin `^15.10.2` or `^17.x` — see research.md §2).
**Storage**: N/A — this feature ships no DB schema changes.
**Testing**: Vitest with two projects (Vitest 4 `test.projects` API): one for `app/` under `happy-dom`, one for `tests/` + `server/` under `node`. `vitest run` is the canonical command (`pnpm test`).
**Target Platform**: Test runs locally + in CI (Vercel pipeline currently runs `pnpm test` on every push). No production runtime impact.
**Project Type**: Internal tooling / infrastructure. Cross-cutting (not a feature folder under `app/features/`).
**Performance Goals**: `pnpm test` exits ≤ 60 s on a developer laptop (~3 GHz, 8 cores) with the new app/ test count. happy-dom is selected over jsdom for ~2× faster Vue mounts.
**Constraints**: Article IV co-location (`Component.vue ↔ Component.spec.ts`); Article VIII spec ≤ 60 lines per file; Article X KISS — no new abstractions on top of `@vue/test-utils` `mount()`; Article XI absolute imports via aliases only.
**Scale/Scope**: 10 component specs + 2 revived composable tests + 22 hex-literal migrations across 8 staff files (5 components + 3 pages) + 2 harness doc updates + 1 CHECKPOINTS update + 1 reviewer-agent prompt update. No new public API surface.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Phase -1 Gates (constitution v3.1.0 — NON-NEGOTIABLE)

| # | Article | Gate | Status |
|---|---------|------|--------|
| -1.1 | I. Code Organization & Reusability | Test files MUST live next to the source they cover (same folder, same basename). No new feature folder created; tests for cross-cutting `app/components/ui/` primitives live where the components live. | [x] |
| -1.2 | I. Code Organization & Reusability | No cross-feature import is introduced by spec files. Component specs import only the colocated `.vue` source + `@vue/test-utils`. | [x] |
| -1.3 | II. TypeScript & Framework Standards | Every spec file is TypeScript strict; no `any`; Composition-API source only. | [x] |
| -1.4 | III. Architecture | No spec touches Drizzle/Neon/Twilio/WordPress. Composable specs mock `$fetch`; component specs are pure render-in/render-out. | [x] |
| -1.5 | IV. Testing (HEAVY) | "Tests MUST be co-located with the code they test" — this feature OPERATIONALIZES that rule for the frontend. Convention `Component.vue ↔ Component.spec.ts` is documented in `docs/harness/verification.md` AND `docs/harness/conventions.md`. | [x] |
| -1.6 | IV. Testing | Behavior-driven test names — every `describe` names the component / composable, every `it` names a behaviour ("renders default state", "emits click on activation"), not a method. | [x] |
| -1.7 | IV. Testing | Centralized mocks in `tests/mocks/` — feature 008 does NOT introduce new mocks. Existing inline `$fetch` mocks in the revived composable tests stay file-local (small scope, no shared surface yet). | [x] |
| -1.8 | IV. Testing | Coverage thresholds (80 % server, 70 % composables) — NOT enforced as a CI gate by this feature. Documented as future work (see research.md §6). | [x] |
| -1.9 | IV. Testing — TDD forward-going | From feature 009 onward, component specs MUST be written alongside (or before) the component. This feature's backfill is the explicit one-time exception, allowed because feature 007 shipped without specs by design (T200 deferral). | [x] |
| -1.10 | V. Performance | No production runtime impact — tests run in CI/dev only. ISR/SSR contract untouched. | [x] |
| -1.11 | VI. Security | No credentials, tokens, or env vars added by this feature. Mocks use synthetic values (`+5215555555555`, `test@example.com`). | [x] |
| -1.12 | VII. UX Consistency | Article VII enforcement vector: 22 inline hex literals migrated to Mercado Pop CSS tokens. After migration, the project-wide T108c grep gate returns zero across `app/components/`, `app/layouts/`, `app/pages/`. Reviewer-agent rule extended to enforce permanently. | [x] |
| -1.13 | VIII. Clean Code | Spec files ≤ 60 lines each (target; hard cap 200 from Article VIII). No dead code, no commented-out blocks. | [x] |
| -1.14 | IX. Quality Gates | `pnpm check`, `pnpm typecheck`, `pnpm test` MUST all exit 0. `./init.sh` exits 0. No `--no-verify` bypass. | [x] |
| -1.15 | X. KISS | `happy-dom` over `jsdom` (lighter); no wrapper layer over `mount()` from `@vue/test-utils`; reuse existing `defineVitestConfig` wrapper from `@nuxt/test-utils`. | [x] |
| -1.16 | XI. Absolute Imports | Component specs use the same import path as production code. No relative `../` across packages — within the same directory, the existing pattern (`./Button.vue`) is acceptable per Article XI. | [x] |
| -1.17 | XII. Error Handling | N/A — this feature ships no server routes. | [x] |
| -1.18 | XIII. Environment Validation | N/A — this feature ships no new env vars. `happy-dom` and `@vue/test-utils` are devDependencies only. | [x] |

**All gates designed pass.** No complexity tracking entries needed — the feature does not violate any article. The two technical "ambiguities" in spec.md (Vitest API choice, error-token resolution) are resolved in research.md as design-time decisions, not constitutional exceptions.

## Project Structure

### Documentation (this feature)

```text
specs/008-frontend-test-setup/
├── plan.md              # This file (/speckit.plan command output)
├── spec.md              # /speckit.specify output (already written)
├── research.md          # Phase 0 output — decisions on Vitest API, happy-dom version, composable-test approach, danger-token resolution
├── data-model.md        # Phase 1 output — light: design-time test contracts (convention, environment, grep rule)
├── quickstart.md        # Phase 1 output — "how to write your first component spec"
├── checklists/
│   └── requirements.md  # /speckit.specify quality checklist
└── tasks.md             # Phase 2 output (/speckit.tasks — NOT created here)
```

No `contracts/` folder — this feature introduces no API endpoints, no DTO contracts. The "contract" of the feature is the file-naming convention (documented in `data-model.md`) and the grep gate (documented in `data-model.md`).

### Source Code (repository root)

```text
sumo-ayce/
├── vitest.config.ts              # UPDATED — adds Vitest 4 test.projects with happy-dom for app/
├── package.json                  # UPDATED — adds happy-dom, @vue/test-utils to devDependencies
├── pnpm-lock.yaml                # UPDATED — pin resolution
│
├── app/
│   ├── components/
│   │   ├── ui/                   # ← feature 007 base primitives
│   │   │   ├── Button.vue
│   │   │   ├── Button.stories.ts
│   │   │   ├── Button.spec.ts    # NEW (T-component-1)
│   │   │   ├── Card.vue
│   │   │   ├── Card.stories.ts
│   │   │   ├── Card.spec.ts      # NEW (T-component-2)
│   │   │   ├── Chip.vue
│   │   │   ├── Chip.stories.ts
│   │   │   ├── Chip.spec.ts      # NEW (T-component-3)
│   │   │   ├── Sticker.vue
│   │   │   ├── Sticker.stories.ts
│   │   │   ├── Sticker.spec.ts   # NEW (T-component-4)
│   │   │   ├── Kicker.vue
│   │   │   ├── Kicker.stories.ts
│   │   │   ├── Kicker.spec.ts    # NEW (T-component-5)
│   │   │   ├── Input.vue
│   │   │   ├── Input.stories.ts
│   │   │   ├── Input.spec.ts     # NEW (T-component-6)
│   │   │   ├── Select.vue
│   │   │   ├── Select.stories.ts
│   │   │   ├── Select.spec.ts    # NEW (T-component-7)
│   │   │   ├── Textarea.vue
│   │   │   ├── Textarea.stories.ts
│   │   │   ├── Textarea.spec.ts  # NEW (T-component-8)
│   │   │   ├── Nav.vue
│   │   │   ├── Nav.stories.ts
│   │   │   ├── Nav.spec.ts       # NEW (T-component-9)
│   │   │   ├── Marquee.vue
│   │   │   ├── Marquee.stories.ts
│   │   │   ├── Marquee.spec.ts   # NEW (T-component-10)
│   │   │   └── Tokens.stories.ts (untouched)
│   │   └── staff/                # ← feature 006 — TOUCHED ONLY to migrate hex literals
│   │       ├── LoginForm.vue            # UPDATED — 2 hex → tokens
│   │       ├── RewardsList.vue          # UPDATED — 1 hex → token
│   │       ├── TransactionTable.vue     # UPDATED — 4 hex → tokens
│   │       ├── VisitButton.vue          # UPDATED — 3 hex → tokens
│   │       └── CustomerCard.vue (no hex; untouched)
│   ├── composables/
│   │   ├── useStaffAuth.ts
│   │   ├── useStaffAuth.test.ts          # REVIVED — runs under new config
│   │   ├── useStaffCustomer.ts
│   │   └── useStaffCustomer.test.ts      # REVIVED — runs under new config
│   ├── pages/staff/              # ← feature 006 — TOUCHED ONLY to migrate hex literals
│   │   ├── customers/[phone].vue        # UPDATED — 4 hex → tokens
│   │   ├── dashboard.vue                # UPDATED — 2 hex → tokens
│   │   ├── admin/index.vue              # UPDATED — 2 hex → tokens
│   │   └── admin/transactions/[id].vue  # UPDATED — 4 hex → tokens
│   └── assets/css/
│       ├── tokens.css            # UNTOUCHED — already correct (feature 007 §15 channel format)
│       └── staff.css             # UNTOUCHED — legacy --color-* system stays
│
├── docs/
│   └── harness/
│       ├── verification.md       # UPDATED — adds "Frontend tests" subsection
│       └── conventions.md        # UPDATED — appends "Testing" cross-reference
│
├── CHECKPOINTS.md                # UPDATED — C4 explicitly requires app/ test coverage
│
└── .claude/agents/
    └── reviewer.md               # UPDATED — adds inline-hex grep rule + frontend-spec presence rule
```

**Structure Decision**: This is **internal tooling / cross-cutting infrastructure** — neither a new feature under `app/features/` (Article I forbids that for a test-convention concern) nor a server-side change. Files are placed where the convention dictates (component specs co-located with components per Article IV); cross-cutting docs are updated in their existing locations. No new top-level folders are introduced. The "frontend / backend" project type from the template does not apply — this is a Nuxt monorepo where `app/` and `server/` are sibling concerns inside one project.

## Complexity Tracking

> **No violations.** This section is empty by design.

The plan does not introduce any new architectural pattern, abstraction, or framework. All choices are the most direct path through the existing constraint set:

- `test.projects` is the supported (non-deprecated) Vitest 4 mechanism for per-glob environments — there is no simpler alternative under Vitest 4.
- `happy-dom` over `jsdom` is the lighter, faster, idiomatic Nuxt 4 + Vitest 4 choice — documented in research.md §2.
- `@vue/test-utils`'s `mount()` is the official, minimal API for Vue component testing — no wrapper added.
- Reusing `--pink` for error states avoids adding a token (zero design-system churn) — documented in research.md §5.

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| *(none)*  | *(n/a)*    | *(n/a)*                              |
