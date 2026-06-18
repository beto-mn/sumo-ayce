# Quickstart — Frontend Unit Test Setup

**Feature**: 008 | **Plan**: [plan.md](./plan.md) | **Date**: 2026-06-17

This is the practical "how to use the new test pipeline" guide. Read it once after feature 008 lands; revisit when writing your first component spec.

---

## 1. Run the tests

```bash
# Full suite (app/ + tests/ + server/) — happy-dom for app/, node for the rest
pnpm test

# Just the app/ project
pnpm test --project app

# Just the server/integration project
pnpm test --project server

# Watch mode while writing a spec
pnpm test:watch app/components/ui/Button.spec.ts
```

Expected first-run output: ≥ 12 frontend test files discovered under `app/`, all green.

---

## 2. Write your first component spec

You're adding a new component `app/components/ui/Badge.vue`. The convention says: ship a co-located `Badge.spec.ts` in the same commit.

### Step 1 — Create the spec file

```ts
// app/components/ui/Badge.spec.ts
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import Badge from './Badge.vue'

describe('Badge', () => {
  it('renders default state with the provided label', () => {
    const wrapper = mount(Badge, { props: { label: 'Promo' } })
    expect(wrapper.text()).toContain('Promo')
    expect(wrapper.classes()).toContain('bg-pink') // default decorative color
  })

  it('switches surface color when variant="success" is set', () => {
    const wrapper = mount(Badge, { props: { label: 'Confirmed', variant: 'success' } })
    expect(wrapper.classes()).toContain('bg-green')
  })

  it('exposes the label via aria-label for screen readers', () => {
    const wrapper = mount(Badge, { props: { label: 'New' } })
    expect(wrapper.attributes('aria-label')).toBe('New')
  })
})
```

### Step 2 — Run it

```bash
pnpm test:watch app/components/ui/Badge.spec.ts
```

Three tests pass. The reviewer sees the spec; the PR can land.

### Step 3 — If the component uses a Nuxt auto-import (e.g. `useI18n`)

Use `mountSuspended` from `@nuxt/test-utils/runtime`:

```ts
import { mountSuspended } from '@nuxt/test-utils/runtime'
// ...
const wrapper = await mountSuspended(Badge, { props: { label: 'Promo' } })
```

`mountSuspended` is the heavier mount that spins up the Nuxt runtime context (i18n, router, runtimeConfig). Use it ONLY when needed; default to plain `mount()` from `@vue/test-utils`.

---

## 3. Write your first composable spec

You're adding `app/composables/useFoo.ts`. The convention says: ship `useFoo.spec.ts` next to it.

```ts
// app/composables/useFoo.spec.ts
import { describe, expect, it, vi, beforeEach } from 'vitest'

const mockFetch = vi.fn()
vi.stubGlobal('$fetch', mockFetch)

describe('useFoo', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  it('returns the data from the API on success', async () => {
    mockFetch.mockResolvedValue({ data: { value: 42 } })
    const { useFoo } = await import('./useFoo')
    const result = await useFoo().getValue()
    expect(result).toBe(42)
  })

  it('throws a typed error when the API returns 401', async () => {
    mockFetch.mockRejectedValue({ statusCode: 401 })
    const { useFoo } = await import('./useFoo')
    await expect(useFoo().getValue()).rejects.toMatchObject({ statusCode: 401 })
  })
})
```

The `vi.stubGlobal('$fetch', ...)` + dynamic `import('./useFoo')` pattern is established by `app/composables/useStaffAuth.test.ts` — copy that file as your starting point if you want a working reference.

---

## 4. The two grep gates

Before you push, run:

```bash
# Gate 1: no inline hex literals in the app/ tree
grep -rEn '(style=|: ?)#[0-9a-fA-F]{3,8}\b' app/components/ app/layouts/ app/pages/
# Expected: empty output (exit 1)

# Gate 2: every new .vue under app/components/ui/ has a co-located .spec.ts
git diff --name-only master...HEAD | grep -E 'app/(components/ui|features/.+/components)/.+\.vue$' | while read vue; do
  spec="${vue%.vue}.spec.ts"
  test -f "$spec" || { echo "Missing spec: $spec"; exit 1; }
done
```

The reviewer-agent runs these automatically; running them locally catches the issue before review.

---

## 5. What NOT to do

- ❌ Don't put a frontend test file outside `app/` — it'll run under node, not happy-dom, and DOM globals (`document`, `window`) will be undefined.
- ❌ Don't write `it('test1', ...)` or `it('tests render function', ...)` — Article IV requires behaviour-driven names.
- ❌ Don't import from `mapbox-gl` in a component spec — it's browser-only and will throw on import. Mock the dependency or shim the surface.
- ❌ Don't introduce a new mock file under `tests/mocks/` for a one-off `$fetch` stub — keep it inline in the spec until 3+ specs need the same mock.
- ❌ Don't rename `useStaffAuth.test.ts` → `useStaffAuth.spec.ts`. Legacy `.test.ts` is allowed; renames are churn-only.

---

## 6. Common pitfalls

| Symptom                                          | Cause / Fix                                                                |
|--------------------------------------------------|----------------------------------------------------------------------------|
| `document is not defined`                        | Spec file is outside `app/` — move it under `app/` to get the happy-dom env. |
| `Cannot read property 'mount' of undefined`      | Missing `import { mount } from '@vue/test-utils'`.                          |
| `Module './Foo.vue' has no default export`       | Vue SFC missing `<script setup>` or `defineComponent`. Check the source.    |
| `ReferenceError: ref is not defined` in a composable test | The test needs `vi.stubGlobal('ref', (v) => ({ value: v }))` (see `useStaffCustomer.test.ts`). |
| Test passes locally, fails in CI                 | Likely a non-determinism (Date.now, Math.random) — pin the value via `vi.useFakeTimers()` or seed. |
| `pnpm test` reports 0 files                      | The glob isn't matching — confirm your file ends in `.spec.ts` or `.test.ts` and lives under `app/`, `tests/`, or `server/`. |

---

## 7. Reference files (live examples)

After this feature lands, these are the canonical references for each pattern:

- **Component spec, simple**: `app/components/ui/Button.spec.ts`
- **Component spec, accent variant**: `app/components/ui/Card.spec.ts`
- **Component spec, accessibility-focused**: `app/components/ui/Input.spec.ts`
- **Component spec, event-emission**: `app/components/ui/Chip.spec.ts`
- **Composable spec with `$fetch` mock**: `app/composables/useStaffAuth.test.ts` (legacy filename, current pattern)
- **Token consumption inside CSS / Tailwind**: `app/components/ui/Tokens.stories.ts` (no test file — it's a story; consult for the token surface).

---

## 8. Feedback loop

If you hit a friction not covered above, open a docs PR against `docs/harness/verification.md` or `docs/harness/conventions.md`. The convention should evolve at the harness layer, not in tribal knowledge.
