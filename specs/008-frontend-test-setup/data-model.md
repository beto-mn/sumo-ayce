# Data Model — Frontend Unit Test Setup

**Feature**: 008 | **Plan**: [plan.md](./plan.md) | **Date**: 2026-06-17

This feature ships **no persistent entities** — no DB schema, no migration, no Drizzle table. What follows is the set of **design-time contracts** the feature codifies. Each section is canonical; downstream features (009 onward) read from and conform to these contracts.

---

## 1. Test Convention Contract

### 1.1 File pairing

For every Vue source file in `app/`, the test file lives in the same directory with the same base name:

| Source                                  | Test                                             |
|-----------------------------------------|--------------------------------------------------|
| `app/components/ui/Button.vue`          | `app/components/ui/Button.spec.ts`               |
| `app/components/ui/Card.vue`            | `app/components/ui/Card.spec.ts`                 |
| `app/composables/useReservation.ts`     | `app/composables/useReservation.spec.ts`         |
| `app/features/loyalty/components/Foo.vue` | `app/features/loyalty/components/Foo.spec.ts` |

### 1.2 Suffix policy

| Suffix     | New code | Allowed | Notes                                                        |
|------------|----------|---------|--------------------------------------------------------------|
| `.spec.ts` | YES      | YES     | Mandatory for any new test under `app/`                      |
| `.test.ts` | NO       | YES (legacy only) | Pre-existing files (`useStaffAuth.test.ts`, `useStaffCustomer.test.ts`) keep working; renames are out of scope |

The Vitest glob `app/**/*.{spec,test}.ts` matches BOTH suffixes — this is by design so the legacy files keep running without churn.

### 1.3 Spec file anatomy

Each spec MUST contain:

1. **Imports** — explicit (no Nuxt auto-imports inside specs):
   ```ts
   import { mount } from '@vue/test-utils'
   import { describe, expect, it } from 'vitest'
   import Button from './Button.vue'
   ```
2. **One `describe`** named after the component / composable (PascalCase).
3. **At least three `it` blocks** for component specs:
   - (a) Default render — mounts the component with default props and asserts a baseline expectation (e.g. tag name, text content, default class).
   - (b) One significant prop variant — re-mounts with a different prop and asserts the behavioural difference.
   - (c) One accessibility or interaction property — emits, focus state, aria attribute, keyboard nav, or similar.
4. **No filesystem / network mocks** — specs are render-in, render-out. Composable specs MAY stub `$fetch` via `vi.stubGlobal('$fetch', ...)` (existing pattern in `useStaffAuth.test.ts`).

### 1.4 Behaviour-driven naming

Every `it` describes a **behaviour**, never a method or internal function. Per Article IV:

- ✅ `it('renders default state with cream surface and ink border', () => { ... })`
- ✅ `it('emits click when the activation key is pressed', () => { ... })`
- ❌ `it('tests render function', () => { ... })`
- ❌ `it('test1', () => { ... })`

### 1.5 Article VIII discipline

- Spec file ≤ 60 lines (target; hard cap 200 per Article VIII).
- No dead code, no commented-out blocks.
- Helper functions only when 3+ specs would benefit; otherwise inline.

---

## 2. Test Environment Contract

### 2.1 Per-project environment matrix

| Project name | Glob                                                    | Environment | Wraps Nuxt context? |
|--------------|---------------------------------------------------------|-------------|---------------------|
| `app`        | `app/**/*.spec.ts`, `app/**/*.test.ts`                  | `happy-dom` | NO (component-level only; Nuxt wrap optional via `@nuxt/test-utils` when needed) |
| `server`     | `tests/**/*.test.ts`, `server/**/*.test.ts`             | `node`      | N/A                 |

### 2.2 Global API

All test files have access to Vitest globals (`describe`, `it`, `expect`, `vi`) via the `vitest` import. The `globals: true` config is NOT used — explicit imports are preferred (Article XI: explicit > magic).

### 2.3 Setup files

NO global setup files in this feature. If a future feature needs one (e.g. registering a global `IntersectionObserver` polyfill), it MUST be added per-project and documented in this section.

### 2.4 Dependency versions (Phase 0 decisions)

| Package           | Range        | Purpose                              | Decided in   |
|-------------------|--------------|--------------------------------------|--------------|
| `vitest`          | `^4.1.7`     | Test runner (already installed)      | (pre-existing) |
| `@vitest/coverage-v8` | `^4.1.7` | Coverage instrumentation (installed but unused; threshold deferred per research.md §6) | (pre-existing) |
| `@nuxt/test-utils` | `^4.0.3`    | `defineVitestConfig` wrapper, `mountSuspended` (future) | (pre-existing) |
| `@vue/test-utils` | `^2.4.6`     | Component mount utility              | research.md §3 |
| `happy-dom`       | `^15.10.2` (or `^17.x` if peer requires) | DOM environment for `app/` | research.md §2 |

Exact pins decided at install time; tasks.md records the resolved version.

---

## 3. Grep Gate Contract

### 3.1 Inline-hex gate (T108c, extended)

**Regex**: `(style=|: ?)#[0-9a-fA-F]{3,8}\b`

**Scope**: `app/components/`, `app/layouts/`, `app/pages/`

**Command**:
```bash
grep -rEn '(style=|: ?)#[0-9a-fA-F]{3,8}\b' app/components/ app/layouts/ app/pages/
```

**Expected output**: EMPTY (exit 1 — `grep` returns 1 when no matches).

**Origin**: Feature 007 task T108c (limited to `app/pages/` and `app/layouts/`). Feature 008 extends to `app/components/` after clearing existing matches.

**Enforcement**: reviewer-agent rule (`.claude/agents/reviewer.md`) — any PR touching `app/**/*.vue` runs the grep and rejects on non-empty output.

### 3.2 Frontend spec presence gate

**Rule**: any new `.vue` file added under `app/components/ui/` or `app/features/<feature>/components/` MUST ship with a co-located `<Name>.spec.ts` in the same commit.

**Verification**:
```bash
# For every new .vue under app/components/ui/ in the PR diff, the matching .spec.ts must exist
git diff --name-only master...HEAD | grep -E 'app/(components/ui|features/.+/components)/.+\.vue$' | while read vue; do
  spec="${vue%.vue}.spec.ts"
  test -f "$spec" || { echo "Missing spec: $spec"; exit 1; }
done
```

**Enforcement**: reviewer-agent rule, identical to §3.1 — same PR-time check.

---

## 4. Reviewer-Agent Rules (process-level)

Updates to `.claude/agents/reviewer.md` are part of this feature's deliverables. Added rules:

1. **Inline-hex grep**: §3.1 — run on every PR touching `app/`.
2. **Frontend spec presence**: §3.2 — run on every PR adding a new `.vue` under the watched paths.
3. **`.spec.ts` ≤ 60 lines**: soft warning per Article VIII; reject if > 200.
4. **Behaviour-driven naming**: scan `app/**/*.spec.ts` for `it('test\d', ...)` or `it('tests \w+ function', ...)` patterns — reject if present.

---

## 5. Open Follow-Ups (NOT for this feature)

These belong to future features:

- **`--danger` token introduction**: research.md §5 leaves this door open. If feature 011 (Promotions) finds that pink-as-promo + pink-as-error becomes a semantic conflict, a follow-up adds a dedicated `--danger` token and migrates the 7 `#ef4444` → `rgb(var(--danger))` references introduced in this feature.
- **Coverage threshold enforcement**: research.md §6 defers Article IV's 70 % / 80 % thresholds. Wire at the close-out of feature 014 (loyalty portal) when the full surface exists.
- **Storybook test-runner integration**: research.md §8 leaves this open. If the team wants a single command for visual + unit assertions, a follow-up wires `@storybook/test` interaction tests under Vitest.
- **`@testing-library/vue` adoption**: research.md §3 considers this as an alternative for accessibility-first assertions. Adopt if a future feature wants role-based queries.
- **Pre-commit hook for the grep gates**: research.md §7 leaves the gates at the reviewer layer. If the gates fire often, move them into Husky as a 4th stage.
