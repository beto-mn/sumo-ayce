# Implementation Report: Feature 020 — Closure-Review Fixes

**Feature**: storybook-full-coverage (020)
**Fix branch**: `chore/021-storybook-coverage-fixes`
**Base**: `master` (feature 020 already merged)
**Review addressed**: `specs/020-storybook-full-coverage/review.md` (REJECTED)

---

## Blocking gaps fixed

### Gap 1 — 7 missing ComponentDocs slice-index story files (T126–T132, FR-016/FR-017, US6)

Created all 7 docs-only CSF3 index stories. Each uses `@storybook/vue3-vite`
imports, `tags: ['autodocs']`, a docs-only `Meta` (no `component`), and a single
`Overview` story rendering a summary of the slice's components:

- `app/features/branches/Branches.stories.ts` — `Features/Branches`
- `app/features/contact/Contact.stories.ts` — `Features/Contact`
- `app/features/homepage/Homepage.stories.ts` — `Features/Homepage`
- `app/features/menu/Menu.stories.ts` — `Features/Menu`
- `app/features/promotions/Promotions.stories.ts` — `Features/Promotions`
- `app/features/reservation/Reservation.stories.ts` — `Features/Reservation`
- `app/components/ui/UIPrimitives.stories.ts` — `UI Primitives`

Verified in the built `storybook-static/index.json`: each produces a `docs`
entry plus an `Overview` story entry. Component lists match the actual `.vue`
files on disk per slice (cross-checked against `data-model.md`).

### Gap 2 — ReservationForm.stories.ts exceeded 200 lines (Article VIII, T116)

`app/features/reservation/components/ReservationForm.stories.ts` was 253 lines.
Split per Article VIII / T116:

- Base file reduced to **113 lines** (Default, pre-filled, no-branches, mobile,
  desktop).
- `Loading` + `WithApiError` play-function stories extracted to
  `app/features/reservation/components/ReservationForm.variants.stories.ts`
  (**127 lines**). The duplicated fill-and-submit play logic was factored into a
  single `fillAndSubmit()` helper to stay within the limit.

No `MapView.variants.stories.ts` was created — `MapView.stories.ts` is 161 lines
and never exceeded the limit (the original impl report's claim was incorrect and
has been corrected).

### Gap 3 — tasks.md / impl report accuracy

- `tasks.md` T116 and T126–T132 remain `[x]` and now correspond to real
  deliverables on disk.
- `progress/impl_020-storybook-full-coverage.md` corrected: removed the false
  `MapView.variants.stories.ts` split claim, and annotated that the 7 index
  files + the ReservationForm split were actually delivered in this fix branch.

---

## Files created (8)

- `app/features/branches/Branches.stories.ts`
- `app/features/contact/Contact.stories.ts`
- `app/features/homepage/Homepage.stories.ts`
- `app/features/menu/Menu.stories.ts`
- `app/features/promotions/Promotions.stories.ts`
- `app/features/reservation/Reservation.stories.ts`
- `app/components/ui/UIPrimitives.stories.ts`
- `app/features/reservation/components/ReservationForm.variants.stories.ts`

## Files changed (2)

- `app/features/reservation/components/ReservationForm.stories.ts` (253 → 113 lines)
- `progress/impl_020-storybook-full-coverage.md` (corrected false claims)

---

## Verification results

- `pnpm check` (biome) — exit 0
- `pnpm typecheck` — exit 0
- `pnpm test` — exit 0 (759 passed / 101 files)
- `pnpm storybook:build` — exit 0, "Storybook build completed successfully",
  zero errors, zero `/menu/**.webp` refs in output
- `find app -name '*.stories.ts' -exec wc -l {} + | awk '$1>200'` — returns
  nothing (no story file exceeds 200 lines)
- All 7 new ComponentDocs files present in `storybook-static/index.json` as
  `docs` + `Overview` entries
- Security self-scan on `master...HEAD` diff — clean
