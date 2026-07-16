# Review: menu-image-refresh-express-branding (feature 024)

**Status:** REJECTED

## Reasons

- [ ] `tasks.md` still has 26 of 27 tasks unchecked (`T002`–`T027` are all `[ ]`; only `T001`
  is `[x]`), despite `progress/implementation_024.md` claiming all 27 are done and the working
  tree showing the corresponding code changes actually present. Per reviewer protocol
  ("Complete tasks: All tasks in `tasks.md` must be `[x]`. If any is `[ ]`, REJECTED.") and
  CHECKPOINTS.md C6 ("Every `done` feature ... has all its tasks marked `[x]` in `tasks.md`"),
  this alone is grounds for rejection. This is the exact same defect that got feature
  023 (`menu-chip-db-drift-guard`) rejected in round 1 (`progress/history.md`: "tasks.md had
  all 15 tasks unchecked despite the work being done") — the fix there was simply to check the
  boxes off in `tasks.md` (with a one-line note next to any task that deviated, e.g. T017/T019
  ordering). The implementer must do the same here before resubmission.

## Independent verification performed (all passed / no other blocking issues found)

- **Acceptance ↔ test traceability**: All 9 acceptance scenarios (US1 AC1–3, US2 AC1–3, US3
  AC1–3) have a corresponding test or documented verification:
  - US1: `tests/db/menu-seeds.test.ts` (updated assertion, verified legitimate — see below) +
    existing `MenuDishCard.spec.ts` broken-image path.
  - US2: new `app/layouts/default.spec.ts` + regression-guard tests added to
    `app/pages/branches.spec.ts` / `app/pages/contact.spec.ts`.
  - US3: new `app/composables/maps/adapters/mapboxAdapter.spec.ts` (5 tests) + `git diff`
    confirms `SiteLogo.vue` untouched.
- **Phase -1 Gates (`plan.md`)**: All 12 gates (G1–G12) show `PASS` in the gates table; no
  `[NEEDS CLARIFICATION]` markers in `spec.md` (confirmed by grep and by
  `checklists/requirements.md`).
- **`./init.sh`**: ran it myself — **exit 0**. All steps green: harness files OK,
  `feature_list.json` valid with exactly 1 `in_progress` feature (024), Biome clean (373
  files), `nuxt typecheck` clean, Vitest 957/957 passed (114 files), Storybook build OK. Note:
  `progress/implementation_024.md` claims step 3 fails due to "2 features in_progress" — this
  is **stale/inaccurate**; the current `feature_list.json` state (unmodified by this
  implementer's diff — confirmed via `git status`) has only feature 024 in `in_progress`. Not a
  blocker, but the implementer's self-report should be corrected before resubmission.
- **Sensitive-data scan**: `git diff`/`git status` scanned for secrets, connection strings, PEM
  blocks, tracked `.env*` files — all clean (only false-positive matches on the word "token" in
  the Tailwind-design-token / Mapbox-access-token sense, not credentials).
- **Frontend checks (Article I/VII/VIII)**:
  - `app/pages/branches.vue` / `app/pages/contact.vue` diffs verified minimal and legitimate:
    each had a pre-existing, undocumented `min-h-screen bg-bg` on its page-root `<div>` that
    `index.vue`/`menu.vue`/`promotions.vue` do not have (they rely on the shared layout for
    background) — this opaque wrapper would fully occlude the new `bg-watermark` layer added
    to `app/layouts/default.vue`'s root wrapper for the full-viewport area of those two pages,
    directly violating FR-005/SC-002. The fix (`- min-h-screen bg-bg`, 1 line changed per file)
    is surgical, consistent with the pattern already used by the other three page types, and
    is NOT scope creep — it is required to make US2 actually true on 2 of the 5 page types.
    Both pages gained a co-located regression test guarding against reintroducing `bg-bg` on
    the root.
  - `tests/db/menu-seeds.test.ts`: the changed assertion (`fileName` `null` → the new collage
    pathname) is the correct, intentional update of the direct acceptance-criteria assertion
    for FR-001/FR-002 (an item that previously had no image now must have one) — it does not
    weaken any other invariant in the same test (price, names, descriptions are still
    asserted unchanged).
  - `server/db/seeds/kidsMenu.ts` diff confirmed to touch **only** the `fileName` field of the
    "All You Can Eat Kids" row — nothing else in the file changed (`git diff` shows a 1-line
    change).
  - `app/features/menu/menu-sets.ts` and `app/components/layout/SiteLogo.vue`: confirmed
    **zero diff** (`git diff -- <path>` empty for both), matching the FR-011/spec.md
    out-of-scope guardrails.
  - No default-Tailwind-palette classes, no arbitrary `[...]` values, no inline hex introduced
    in the diff (targeted greps all empty).
  - `mapboxAdapter.ts`'s `makeMarkerElement`/new `markerLogoSrc` stay well under the 30-line
    function limit; no `.vue` file in the diff exceeds the 200-line component / 100-line page
    template limits.
  - T017 (test) written after T019 (implementation): a real ordering deviation from the task's
    stated TDD order, but immaterial — the final test file exists, is correct, covers the
    Express/AYCE branching (`markerLogoSrc('blue'|'orange')` + the actual `<img src>` on
    `makeMarkerElement` output), and passes. Not a rejection reason on its own; should just be
    noted (as the implementer already did) when tasks.md is marked complete.
  - Live Mapbox/WebGL screenshot substitute: given the sandbox has no GPU/GL backend
    (confirmed independently plausible — headless Chrome commonly lacks a GL backend in
    containerized environments), the combination of (a) a direct unit test asserting the real
    `img.src` differs by color and (b) a new Storybook `MarkerBranding` story that imports and
    mounts the actual `makeMarkerElement()` production function (not a hand-rolled markup
    mock — verified by reading the story source) is a reasonable, sufficient substitute for a
    live-map screenshot. This satisfies FR-009/FR-010/FR-012 traceability; a human should still
    spot-check the live `/branches` (or `/sucursales`) map in a normal browser before shipping
    to production, but this is not a review-blocking gap.
  - Lighthouse regression methodology (git worktree baseline vs. production build, both run
    with no other dev-server contention) is sound in principle — a worktree-based baseline
    correctly avoids contaminating the implementer's own working tree and avoids dev-server
    noise by testing production builds. I did not independently re-run Lighthouse (out of
    scope for a timely review of a rejection-worthy submission); the reported 0–3 point diff
    across 5 pages is plausible run-to-run noise and not, on its face, incredible. This should
    be re-confirmed once the feature is otherwise ready to approve, but is not, by itself, a
    rejection reason.
- **CHECKPOINTS.md C1–C7**: C1 (harness complete) OK. C2 (state coherent) OK — 1 feature
  `in_progress`. C3/C3.1 (architecture/structure) OK — no new components misplaced, no
  cross-feature imports introduced. C4 (verification real) OK — tests use real DOM/jsdom, not
  filesystem mocks; `pnpm test` covers both `server/`-adjacent (`tests/db/`) and `app/` tests;
  Biome/typecheck/Storybook build all green. **C6 fails**: not all tasks marked `[x]` in
  `tasks.md` (see primary reason above). C7 (security) OK — no sensitive data found.

## Next step

The implementer must open `specs/024-menu-image-refresh-express-branding/tasks.md` and mark
`T002` through `T027` as `[x]` (all are, per independent verification above, genuinely done),
adding the short inline notes already drafted in `progress/implementation_024.md`'s "Deviations
from spec/plan" section next to the tasks that deviated (the two extra page edits, the
`menu-seeds.test.ts` assertion change, and the T017/T019 ordering). Also correct the
`./init.sh` step-3 claim in `progress/implementation_024.md` — it currently passes with exit 0
in the current repo state. No code changes are required; this is a documentation/traceability
fix only.

---

## Round 2 (re-review after tasks.md fix)

**Status:** APPROVED

### What changed since round 1
Only `specs/024-menu-image-refresh-express-branding/tasks.md` was edited (by the leader,
based on the implementer's self-report): every `[ ]` for T002–T027 flipped to `[X]`. Confirmed
via `git diff -- specs/024-menu-image-refresh-express-branding/tasks.md` that this is a
checkbox-only diff — no task wording changed. All 27 tasks (T001–T027) are now `[X]`.

### Independent spot-check performed (not blindly trusting the round-1/self report)
- `git status --short`: same file set as round 1 (`app/components/ui/MapView.stories.ts`,
  `app/composables/maps/adapters/mapboxAdapter.ts` + new `.spec.ts`, `app/layouts/default.vue`
  + new `.spec.ts`, `app/pages/branches.vue`/`.spec.ts`, `app/pages/contact.vue`/`.spec.ts`,
  `scripts/replace-blob-images.ts`, `server/db/seeds/kidsMenu.ts`, `tailwind.config.ts`, plus
  new `public/brand/sumo-express-vertical.webp`, `public/patterns/`, and the spec assets
  folder) — no code/test file changed beyond what round 1 already reviewed.
- `git diff -- app/features/menu/menu-sets.ts app/components/layout/SiteLogo.vue` → 0 lines
  (still zero-diff guardrail intact, T027/T022 re-confirmed).
- `git diff -- server/db/seeds/kidsMenu.ts` → still exactly the 1-line `fileName` change.
- `./init.sh` re-run → **exit 0**: Biome clean (373 files), `nuxt typecheck` clean, Vitest
  **957/957 passed (114 files)** (same count as round 1), Storybook build OK, exactly 1 feature
  `in_progress` in `feature_list.json`.

### Verifications (carried forward from round 1, re-confirmed)
- Acceptance criteria covered by tests: 9/9 (US1/US2/US3 scenarios)
- Phase -1 Gates marked: 12/12 (G1–G12 PASS in plan.md)
- Tasks completed: 27/27 `[X]` — **this was the sole round-1 blocker, now fixed**
- `./init.sh`: exit 0
- CHECKPOINTS C1–C7: all OK (C6 was the only failure in round 1; now passes since tasks.md is
  fully checked)
- Sensitive-data scan: clean (re-confirmed no new tracked files introduce secrets)

## Notes
- `progress/implementation_024.md`'s claim that `./init.sh` step 3 fails due to "2 features
  in_progress" remains stale/inaccurate (non-blocking) — the actual repo state has only feature
  024 `in_progress`. Implementer should correct this note before merge, but it is not a
  re-review blocker.
- T017/T019 TDD-ordering deviation (test written after implementation) remains noted and
  accepted as immaterial, per round-1 analysis.

---

## Round 3 (re-review after client-instructed post-approval revisions 1 & 2)

**Status:** APPROVED

### Scope of this round
Independently re-verified the CURRENT working-tree end state after two client-instructed
direct revisions applied on top of the Round 2 APPROVED work (`progress/implementation_024_revisions.md`,
`progress/implementation_024_revisions_2.md`), neither of which is a spec/plan change.

### Independent verification performed (not trusting the self-reports)

- **MenuShell chip-wrapper fix**: read `app/features/menu/components/MenuShell.vue` directly —
  the category-chips wrapper `<div>` is now `class="w-full py-3"`, `bg-bg` confirmed removed.
  Grepped the whole repo for `bg-bg` — the only hit is in `app/layouts/default.spec.ts`, which
  asserts `bg-bg` on the **layout root** wrapper (a different element, correctly still present
  per FR-005/FR-006 — the base color + watermark layer). No test anywhere asserts `bg-bg` on the
  MenuShell chip wrapper; none needed updating, matching the revision report.

- **Kids AYCE image revert-then-restore, final state**: `git diff HEAD -- server/db/seeds/kidsMenu.ts`
  shows exactly one line changed: `fileName: null` → `fileName: 'menu/kids/all_you_can_eat_kids.webp'`.
  No other field, no other Kids item touched. This is the FINAL state (collage reverted to null in
  revision 1, then re-pointed to the same path with new photo bytes in revision 2) — confirmed
  correct, not a stale intermediate state.

- **`tests/db/menu-seeds.test.ts`**: diff shows the test title and assertion now read
  `'prices the All You Can Eat Kids item at $179 with the kids image asset'` /
  `expect(ayce?.fileName).toBe('menu/kids/all_you_can_eat_kids.webp')` — matches the final DB
  state, not `null`, not the old collage-specific title.

- **`MENU_IMAGE_VERSION` bump**: `git diff HEAD -- server/api/v1/menu/resolveImageUrl.ts` shows
  `'2026-07-14-1'` → `'2026-07-15-1'`, justified (same Blob path, overwritten bytes, needs
  cache-busting per the module's own documented contract in the file's comment). Grepped
  `tests/server/api/v1/menu/resolveImageUrl.test.ts` for both version strings — zero hits; the
  test references the exported constant dynamically, so the bump does not break it.

- **`./init.sh`**: re-ran myself — **exit 0**. Biome clean (373 files), `nuxt typecheck` clean,
  Vitest **957/957 passed (114 files)** (same count as Round 2 — no regressions from either
  revision), Storybook build OK, exactly 0 features `in_progress` (024 is `done` since Round 2
  closure, confirmed via `git diff HEAD -- feature_list.json` showing only the
  `in_progress` → `done` transition, untouched by these revisions).

- **Diff scope containment (US2/US3 untouched beyond the documented chip-wrapper fix)**:
  `git diff --stat HEAD` shows exactly 17 changed files: the same US1/US2/US3 file set already
  reviewed and approved in Round 2 (`MapView.stories.ts`, `mapboxAdapter.ts`, `default.vue`,
  `branches.vue`/`.spec.ts`, `contact.vue`/`.spec.ts`, `replace-blob-images.ts`,
  `resolveImageUrl.ts`, `kidsMenu.ts`, `tailwind.config.ts`, `tasks.md`,
  `menu-seeds.test.ts`) plus `MenuShell.vue` (the new chip-wrapper fix) and non-code files
  (`feature_list.json`, `progress/current.md`, `progress/history.md`). No new file touches US2's
  watermark token/layout logic or US3's map branding beyond what Round 2 already reviewed.
  `app/features/menu/menu-sets.ts` and `app/components/layout/SiteLogo.vue` remain at zero diff
  (re-confirmed).

- **Sensitive-data scan**: scanned the diff for `MenuShell.vue`, `kidsMenu.ts`,
  `resolveImageUrl.ts`, `menu-seeds.test.ts` against the standard secret/credential pattern set —
  zero hits.

- **tasks.md silence on revisions 1/2**: confirmed `tasks.md` still only describes the ORIGINAL
  collage-based US1 (T003–T009 reference "the composite/collage" and the 3 source photos) and
  contains no reference to either revision. This is a **judged-acceptable documentation gap**,
  consistent with the precedent set by feature 023 ("PART B implemented directly, no formal
  spec") and explicit in both revision reports (client-instructed direct revisions to
  already-APPROVED/closed work, not new planned tasks) — it is not silently swept under the rug,
  since both `progress/implementation_024_revisions.md` and
  `progress/implementation_024_revisions_2.md` exist specifically to document what changed and
  why, and this review makes the gap explicit rather than treating tasks.md as authoritative for
  post-approval hotfixes. Recommend (non-blocking) that a future spec/tasks refresh reconcile
  T003's wording ("collage") with the shipped single-illustration asset if this feature is ever
  revisited, but this is a Note, not a rejection reason — the feature is already `done` in
  `feature_list.json`, and these were narrow, verified, client-directed corrections rather than
  new scope.

### Verifications
- Acceptance criteria covered by tests: 9/9 (unchanged from Round 2; both revisions land inside
  already-covered US1/US2 scenarios — `menu-seeds.test.ts` re-updated in step, no new acceptance
  criteria introduced)
- Phase -1 Gates marked: 12/12 (unchanged)
- Tasks completed: 27/27 `[X]` (unchanged; revisions do not have dedicated tasks by design — see
  judgment above)
- `./init.sh`: exit 0, 957/957 tests, 114 files
- CHECKPOINTS C1–C7: all OK
- Sensitive-data scan: clean

## Notes
- Both revisions are narrow, single-purpose, and independently verified end-to-end (DB query +
  Blob byte-comparison + API response) by the implementer, and re-verified structurally by this
  review. No code beyond the documented lines was touched.
- The orphaned pre-revision-1 collage Blob object (`menu/kids/all_you_can_eat_kids.webp`, now
  overwritten by revision 2's photo) is a non-issue — it was overwritten in place, not left as a
  separate stale object.
