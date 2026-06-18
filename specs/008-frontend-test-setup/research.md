# Research — Frontend Unit Test Setup (Vitest + happy-dom + Vue Test Utils)

**Feature**: 008 | **Plan**: [plan.md](./plan.md) | **Date**: 2026-06-17

This document records the technical decisions that drive Phase 1 onward. Each subsection follows the format **Decision / Rationale / Alternatives**.

---

## 1. Vitest 4 environment-selection API

**Decision**: Use the Vitest 4 **`test.projects`** API to declare two test projects in `vitest.config.ts`:

1. Project `app` — `include: ['app/**/*.spec.ts', 'app/**/*.test.ts']`, `environment: 'happy-dom'`.
2. Project `default` (or `server-and-tests`) — `include: ['tests/**/*.test.ts', 'server/**/*.test.ts']`, `environment: 'node'`.

Both projects continue to use `defineVitestConfig` from `@nuxt/test-utils/config` as the wrapper (it merges Nuxt's Vite resolution so `@/*` aliases keep working).

**Rationale**:
- Vitest 4 moved the per-glob environment selection out of the deprecated `test.environmentMatchGlobs` and into `test.projects` — the same primitive that powers monorepo test isolation. `environmentMatchGlobs` still emits a deprecation warning in 4.1.7 but is slated for removal in a future minor. Picking `test.projects` now avoids a forced rewrite when the deprecated path is removed.
- Each project carries its own `environment`, `setupFiles`, `globals`, etc. — full isolation, which matches the spec's requirement that `app/` runs under happy-dom AND `server/` keeps running under node without contamination.
- The `defineVitestConfig` wrapper is preserved at the OUTER config level; project entries inherit from it (Vitest merges).

**Alternatives considered**:
- **`environmentMatchGlobs`**: still works in 4.1.7 but emits deprecation warnings → fails `--error-on-warnings` style policies and forces a follow-up migration. Rejected on tech-debt grounds.
- **Two separate config files** (`vitest.app.config.ts`, `vitest.server.config.ts`) invoked via two `pnpm` scripts: doubles the surface; `pnpm test` would have to run both; CI complexity grows. Rejected.
- **Single config with `environment: 'happy-dom'` globally**: would force server tests to drag in DOM globals (mostly harmless but inverts the constraint — node tests would no longer be deterministic node). Rejected on correctness.

**Implementation note**: the `defineVitestConfig` call shape becomes:

```ts
import { fileURLToPath } from 'node:url'
import { defineVitestConfig } from '@nuxt/test-utils/config'

export default defineVitestConfig({
  resolve: {
    alias: {
      '@/types': fileURLToPath(new URL('./types', import.meta.url)),
    },
  },
  test: {
    projects: [
      {
        test: {
          name: 'app',
          include: ['app/**/*.spec.ts', 'app/**/*.test.ts'],
          environment: 'happy-dom',
        },
      },
      {
        test: {
          name: 'server',
          include: ['tests/**/*.test.ts', 'server/**/*.test.ts'],
          environment: 'node',
        },
      },
    ],
  },
})
```

If `test.projects` requires a separate `defineProject` import (Vitest 4 may export it from `vitest/config`), the implementer adopts that — the shape is non-load-bearing; the decision is "two named projects, two environments".

---

## 2. `happy-dom` version pin

**Decision**: Pin `happy-dom` to `^15.10.2` as devDependency. Verify at install time against Vitest 4.1.7 peer ranges and the Nuxt 4 ecosystem; if `^17.x` is required by `@nuxt/test-utils` 4.0.3's peer dep, bump to that range.

**Rationale**:
- `happy-dom` 15.x is the most widely deployed major across Vitest 4 + Vue 3 projects as of cutoff (Jan 2026). It includes the DOM APIs commonly used in Vue component mounts (`customElements`, `IntersectionObserver` polyfill, `matchMedia`, ResizeObserver shim).
- `happy-dom` 17.x is the latest major; performance improvements but smaller install base. If `@nuxt/test-utils` 4.0.3 requires 17.x (peer), follow that. If both work, prefer 15.x for the wider community signal.
- The pin uses a caret range (`^15.x`) so security patches flow in without intervention; the major is locked.

**Alternatives considered**:
- **`jsdom`**: spec-rejected. Slower for Vue mounts (~2× per the published benchmarks the Nuxt team cites), heavier install, and the Nuxt 4 + Vitest 4 community has standardized on happy-dom. `jsdom` has a more complete W3C compliance surface, but for component-level unit tests that completeness is overkill.
- **`@happy-dom/global-registrator`**: registers happy-dom globals at module level for non-Vitest contexts (e.g. Bun, raw scripts). Not needed — Vitest's `environment: 'happy-dom'` does the same job inside the runner.
- **Custom DOM shim**: would violate Article X (KISS) — a maintained library is the right tradeoff.

**Verification step in tasks.md**: install + run a tiny smoke (`mount({ template: '<div>hi</div>' })`) to confirm the environment is wired before the 10 component specs are written.

---

## 3. `@vue/test-utils` version pin

**Decision**: Pin `@vue/test-utils` to `^2.4.6` as devDependency.

**Rationale**:
- `@vue/test-utils` 2.x is the Vue 3 line (1.x was Vue 2). 2.4.6 is the most recent patch at cutoff and has the bug fixes for Vue 3.5's reactivity changes.
- The library is the **official** Vue testing utility (maintained by the Vue core team), so the pin is the canonical one. Article X (KISS) — no wrapping needed.

**Alternatives considered**:
- **Testing Library (`@testing-library/vue`)**: a userland alternative that nudges authors toward accessibility-first assertions. Strong case, but the project doesn't have an a11y-test discipline yet and the bigger API surface adds learning overhead. Rejected for this feature; **may be reconsidered** if a future feature wants TDD-by-role assertions for the user-facing pages.
- **Hand-rolled `createApp` + `mount` shim**: rejected — `@vue/test-utils` exists for this exact reason.

---

## 4. Approach for the two existing composable tests

**Decision**: **Keep the manual `vi.stubGlobal('ref', ...)` shims as-is** in `app/composables/useStaffAuth.test.ts` and `app/composables/useStaffCustomer.test.ts`. Do NOT rework to use `@nuxt/test-utils`'s `mockNuxtImport` or `mountSuspended` in this feature.

**Rationale**:
- The two composables under test (`useStaffAuth.ts`, `useStaffCustomer.ts`) call `$fetch` and use Nuxt auto-imports (`ref`, `reactive`, `readonly`, `toRef`). The existing tests manually stub each auto-import via `vi.stubGlobal(...)`. This works because Vue's `ref` etc. are JS-only — once stubbed at the global scope before the `import('./useStaffAuth')` (the existing files use dynamic import after stub), the composable code resolves them at call time.
- Reworking them to use `mockNuxtImport` would require running them under `@nuxt/test-utils`'s Nuxt runtime, which is heavier and may not even be necessary for happy-dom + auto-imports.
- The minimal change — extend the Vitest glob — is the KISS path. If the tests turn out to be flaky under happy-dom, the **fallback** is to add `vi.stubGlobal('ref', ...)` to the stubs that aren't already there OR rework to `mockNuxtImport`. The fallback is documented but not pre-emptively executed.
- Article X (KISS) and Article IV ("Tests MUST NOT depend on each other's state") favor leaving working code alone.

**Alternatives considered**:
- **Rework to `mockNuxtImport`**: would require the test to bootstrap a Nuxt context. Heavier than needed; the existing tests are correct, just unreachable. Rejected on KISS grounds.
- **Rework to `mountSuspended`**: this API is for component tests, not composable tests. Misapplied here. Rejected.
- **Delete the dead tests**: rejected — they encode real feature-006 intent. Reviving them is the explicit AC-3 of the spec.

**Verification step in tasks.md**: after wiring the glob, run `pnpm test app/composables/` and verify both files report 3 passing tests each (matching the existing `describe` blocks).

**Fallback documented**: if either file fails under happy-dom due to a missing global, the implementer adds the missing `vi.stubGlobal('<name>', ...)` call. No structural rewrite.

---

## 5. Error/danger token resolution (spec Assumption A-3)

**Decision**: **Reuse `--pink` (`#FF2D6F`) for error states** in the staff hex-literal migration. Do NOT introduce a new `--danger` token in this feature.

**Rationale**:
- The Mercado Pop palette already exposes `--pink` as a decorative token (used in promos and badges per `docs/business/overview.md` §2). Pink is a brand-consistent "attention / alert" color in the design direction (the prototype uses it for "Promo" stickers).
- Path (a) is **zero-change to the token set** — `tokens.css` stays as-shipped, `tailwind.config.ts` stays as-shipped, feature 007's `data-model.md` stays as-shipped. No data-model divergence, no constitutional amendment, no surface-area increase.
- Path (b) — introducing `--danger` — would require: (i) adding the token to `tokens.css` (RGB channels), (ii) adding `danger` to `tailwind.config.ts` `theme.colors` (per the override pattern), (iii) updating feature 007's `data-model.md` §1 (or accepting divergence — bad), (iv) reasoning about Express-context behaviour (does `.scope-express` override `--danger`? Probably no — danger should stay danger). Net: 4 files changed, 1 new design token, all for a 3-literal use case (`#ef4444` appears 7 times total across the 22 hex matches).
- Path (a) is the KISS choice (Article X). The design direction tolerates pink-as-danger — the prototype actually does this (the "Borrar" button in the dashboard prototype is pink-tinted).

**Door left open for future feature**: if feature 011 (Promotions) finds that promos use pink heavily AND the staff portal's "delete confirmation" pink starts to clash semantically, a follow-up feature MAY introduce `--danger`. The spec for that follow-up would migrate the 7 `#ef4444` callsites once the new token exists. This is documented in `data-model.md` §3 (Open Follow-Ups).

**Alternatives considered**:
- **Path (b) — add `--danger`**: rejected for the reasons above. Reopen if feature 011 produces a semantic conflict.
- **Reuse `--orange` for error**: rejected — orange is the AYCE brand color; conflating it with "error" would be a brand violation under Article VII.
- **Reuse `--ink` (black) for error**: rejected — ink is the universal text color; using it for error would erase the visual distinction.

---

## 6. Coverage threshold enforcement

**Decision**: **Do NOT wire `@vitest/coverage-v8` thresholds** in this feature. The package is already installed but the gate is deferred.

**Rationale**:
- Article IV's coverage thresholds (80 % server, 70 % composables) are aspirational targets for the project as a whole — at this point the frontend has zero meaningful coverage and the staff portal's composables have 6 unit tests against ~50 LOC each. Threshold enforcement would either (a) reject every PR until coverage catches up, or (b) require a pragmatic ramp curve that this feature has no business defining.
- The right place to wire thresholds is at the END of feature 014 (loyalty portal), when the bulk of the production surface exists. By then, coverage data on every feature's actual code is in hand.
- This feature ships the infrastructure that makes coverage measurement work; it does NOT ship the policy.

**Alternatives considered**:
- **Wire thresholds at 0 %**: pointless — no signal, configures the surface twice.
- **Wire thresholds at the Article IV targets immediately**: would block CI on day one of feature 009. Rejected.
- **Pick a project-specific intermediate threshold** (e.g. 40 %): arbitrary, no data to support the number. Rejected.

**Documented follow-up**: a future feature ("test-coverage-thresholds" or absorbed into the feature 014 close-out spec) is the canonical place to enable thresholds. Logged in `data-model.md` §3.

---

## 7. Reviewer-agent rule extension

**Decision**: Update `.claude/agents/reviewer.md` to add two new rules tied to this feature's deliverables:

1. **Inline-hex grep gate**: any PR touching `app/**/*.vue` MUST run `grep -rEn '(style=|: ?)#[0-9a-fA-F]{3,8}\b' app/components/ app/layouts/ app/pages/` and the output MUST be empty. Reject if non-empty, citing the offending file:line and the Mercado Pop token table from `docs/business/overview.md` §2 + feature 007 `data-model.md` §1.
2. **Frontend spec presence**: any PR adding a new `.vue` file under `app/components/ui/` or `app/features/<feature>/components/` MUST include a co-located `<Name>.spec.ts` with at least one default-render assertion. Reject if absent.

**Rationale**:
- Conventions only stay alive if the reviewer enforces them. Article IX makes Husky enforcement non-negotiable for lint/format/typecheck; the spec convention is the spiritual analog at the review layer.
- The two rules are surgical (run two greps + count files); they don't expand the reviewer's mandate beyond what plan.md already promises.
- This is a **process change**, not a code change inside the runtime — but it ships in the same PR so the rules go live the moment the gates do.

**Alternatives considered**:
- **Wire as a pre-commit Husky hook**: tempting, but the Husky chain is already at 3 stages (lint, format, typecheck) per Article IX and adding a 4th risks slowing every commit. Reviewer-side enforcement is sufficient for a soft convention.
- **CI script that runs the grep**: viable as a follow-up; the reviewer rule is the immediate, zero-infra-cost gate.

---

## 8. Storybook coexistence

**Decision**: `.spec.ts` and `.stories.ts` coexist in the same directory. No Storybook test-runner / interaction tests / play functions are wired into Vitest by this feature.

**Rationale**:
- Article VII mandates Storybook coverage for visual review; Article IV mandates Vitest coverage for unit assertion. They have different jobs:
  - Storybook stories show the component visually across viewports / variants — the design-review surface.
  - Vitest specs make logical assertions about render output, emitted events, prop variant behaviour — the regression-test surface.
- Coexistence in the same folder is the simplest mental model. The reviewer can grep `app/components/ui/Button.*` and see all surfaces at once.
- Storybook 10.4.1's test-runner is mature but adds another runner to the pipeline (`storybook test`) and another setup file. KISS (Article X) — defer to a future feature if needed.

**Alternatives considered**:
- **Wire Storybook's play functions to Vitest via `@storybook/test`**: would unify the two surfaces but adds setup complexity and a new dependency tree. Rejected; revisit if the project wants a single source of truth for both visual and unit assertions.

---

## 9. Auto-imports inside component specs

**Decision**: Component specs do NOT depend on Nuxt auto-imports. Each spec explicitly imports what it needs:

```ts
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import Button from './Button.vue'
```

If a component itself uses an auto-imported utility (e.g. `useI18n` from `@nuxtjs/i18n`), the spec either stubs the call site or wraps the mount in `@nuxt/test-utils`'s `mountSuspended` — decided per-component when the spec is written.

**Rationale**:
- Article XI (Absolute Imports) — explicit `import` is always clearer than auto-import in test contexts.
- Auto-imports are a runtime convenience for production code; in tests, the dependency graph should be explicit so failures point at real causes.
- For the ten base components, none of them depend on `useI18n` or other heavy auto-imports (verified by reading the component sources in feature 007). The simple `mount()` path applies to all ten.

**Alternatives considered**:
- **Use `@nuxt/test-utils` `mountSuspended` everywhere**: heavier mount path (spins up partial Nuxt context); only needed when the component actually depends on Nuxt runtime. Reserve for the cases that need it (feature 009+).

---

## 10. Test naming convention (behavior-driven)

**Decision**: Every spec follows this shape:

```ts
describe('Button', () => {
  it('renders default state with cream surface and ink border', () => { ... })
  it('switches to blue accent when wrapped in .scope-express', () => { ... })
  it('emits click when the activation key is pressed', () => { ... })
})
```

`describe` names the component (PascalCase). Each `it` describes a **behaviour**, not a method ("renders default state" — not "tests render function"). This matches Article IV.

**Rationale**:
- Failing test names should self-explain in CI logs. "Button > emits click when the activation key is pressed FAILED" is immediately diagnosable; "Button > test1 FAILED" is not.
- Article IV explicitly requires behavior-driven naming; this is the operationalization for the frontend.

**Alternatives considered**: none — this is a constitutional requirement, not a design choice.
