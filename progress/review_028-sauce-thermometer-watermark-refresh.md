# Review: sauce-thermometer-watermark-refresh

**Status:** APPROVED

## Context

Re-review after a REJECTED first pass whose ONLY blocking issue was
`tasks.md` showing 0/50 tasks checked despite the work being genuinely done.
No code changed since that review — only `progress/review_...md` (prior
rejection) and `specs/028-sauce-thermometer-watermark-refresh/tasks.md`
(commit `6f45968`) were touched. Confirmed via `git show --stat 6f45968` that
this commit modifies exactly one file (`tasks.md`, +104/-27 lines of
checkbox/annotation changes) — no production code, tests, or migrations were
touched in the fix-up commit.

## Verifications

- **Precondition**: `feature_list.json` id 28 status is `reviewing`. OK.
- **`tasks.md` now 50/50 `[x]`**: `grep -c '^\- \[ \]'` → 0, `grep -c '^\- \[x\]'`
  → 50. All of Phases 1-6 (T001-T027, historical `df3a13c`) and Phase 7
  (T028-T050, the revert in `aa4460b`) are checked.
- **Spot-checks against actual code/DB (not a rubber stamp)**:
  - **T008** (watermark `background-size` sizing): confirmed
    `app/layouts/default.vue` line 5 carries
    `bg-bg bg-watermark bg-repeat bg-[length:300px_405px]` — the explicit
    sizing pinning the new higher-res tile to the old 300×405 on-screen
    footprint, exactly as the task describes. (Same arbitrary-value note as
    the prior review — non-blocking, `research.md` R1 pre-authorized it.)
  - **T013** (thermometer gating): confirmed
    `app/features/menu/components/MenuDishGrid.vue` — `showThermometer()`
    returns `category.key === 'wings'` (line 29-30), and the `<img
    data-testid="wings-thermometer">` is gated with `v-if="showThermometer(category)"`,
    mounted once per category section (not per-dish), matching the task
    description precisely.
  - **T033/T039** (drop migration): `server/db/migrations/0033_drop_sauces_and_option_group_max_selections.sql`
    exists, is a NEW additive-only migration (does not edit `0016` or `0032`),
    and drops exactly the three things both tasks specify: the
    `max_selections` CHECK constraint + column on `menu_item_option_groups`,
    the `requires_sauce` column on `menu_items`, and the `sauces` table
    itself. `_journal.json` correctly appends idx 33
    (`0033_drop_sauces_and_option_group_max_selections`) after idx 32
    (`0032_add_menu_item_option_group_max_selections`) — sequential, no gaps,
    no rewritten history.
  - **Dead-code re-confirmation**: fresh repo-wide grep for
    `maxSelections`/`max_selections` and
    `SAUCES`/`querySauces`/`FullMenuSauce`/`requiresSauce`/`requires_sauce`
    across `server/`, `app/`, `types/`, `tests/` (`.ts`/`.vue`, excluding
    `migrations/`) returns **zero hits** — confirms the removal is complete
    and matches the prior review's dead-code sweep finding.
- **`./init.sh`: exit 0** — Biome (374 files, 0 errors), `nuxt typecheck`
  clean, `vitest run` 115 files / 1017 tests passing (the logged transient-DB
  retry/error lines are expected noise from resilience tests, not failures),
  Storybook build succeeds. No regression since the prior review.
- **CHECKPOINTS C1-C7**: all pass (re-confirmed C2: exactly one feature, id
  28, in `reviewing`, per `init.sh` step 3).
- Everything else (acceptance↔test traceability, Constitution Check gates,
  sensitive-data scan, frontend checks) already passed cleanly in the prior
  review and is unaffected by a tasks.md-only diff — not re-swept per the
  leader's instruction.

## Notes (non-blocking, carried over from prior review)

- `MenuDishCard.spec.ts`/`.stories.ts` still cite stale "FR-021" instead of
  "FR-006-REV" — cosmetic, behavior is correctly covered regardless.
- `bg-[length:300px_405px]` in `app/layouts/default.vue` is an arbitrary
  Tailwind value that technically matches the "no arbitrary values" scan
  pattern, but it's a raster-asset-specific background-tile dimension with
  no equivalent design token (color/radius/shadow/type-scale), and
  `research.md` R1 explicitly pre-authorized this exact approach as one of
  two viable options. Worth a named Tailwind theme key in a future pass, not
  blocking here.

## Next step

None — ready for the implementer to mark `done`.

---

# Review: sauce-thermometer-watermark-refresh — Part C (2026-07-18)

**Status:** APPROVED

## Scope of this review
Part C only (User Story 4 / FR-020 / FR-021 / SC-008 / Phase 8, T051-T056),
layered on top of the already-shipped, previously-approved Parts A/B. Changes
are uncommitted working-tree diffs on `feat/028-sauce-thermometer-watermark-refresh`
per this round's convention (verified via `git status`/`git diff`, not a new
commit hash).

## Verifications

- **Precondition**: `feature_list.json` id 28 status = `reviewing`. Confirmed.
- **Acceptance ↔ test traceability (User Story 4)**:
  - AC1 (note renders once, below `<h2>`, above thermometer) →
    `app/features/menu/components/MenuDishGrid.spec.ts` new case
    `'renders the wings category note ABOVE the thermometer graphic (feature 028, Part C)'`
    — asserts both node existence and HTML-position ordering (`noteIdx < thermometerIdx`). Pass.
  - AC2 (no other category shows the note) →
    `tests/db/menu-seeds.test.ts` renamed/updated test
    `'leaves every category other than kids/wings without a note'` — loops all
    categories except `kids`/`wings` asserting null notes. Pass.
  - AC3 (same visual treatment, no new note style) → satisfied by construction:
    `MenuDishGrid.vue` was NOT modified (verified — only `.spec.ts` changed),
    so `wings` renders through the exact same `category-note` block/class list
    already used by `kids`. No separate test needed; confirmed by inspection.
  - FR-020/FR-021 covered by the above two tests plus the seed data itself
    (`tests/db/menu-seeds.test.ts`'s new `'carries the sauce-choice note
    (bilingual) on the wings category'` test, asserting `noteEs`/`noteEn` content).
  - SC-008 (100% of Wings sections show the note once, 0% of others) — covered
    by the combination of the two tests above; live/DB-level confirmation was
    performed directly by the leader (T054/T055) per the task description and
    is not independently re-verified here per instruction.
  3/3 acceptance scenarios covered by tests. 0 gaps.
- **Phase -1 / Constitution gates**: This plan uses a "Constitution Check" /
  "Constitution Re-Check" table format rather than a literal "Phase -1 Gates"
  checklist; the Part C-specific table in `plan.md`'s "AMENDMENT 2026-07-18"
  section (Articles I, IV, VIII, X) shows all 4 rows `✅ Pass`, consistent with
  the actual diff (zero new schema/component/abstraction). No `[ ]` rows found.
- **`[NEEDS CLARIFICATION]`**: `grep -n "NEEDS CLARIFICATION" spec.md` → zero
  hits. The one open judgment call (EN translation wording) is resolved
  in-line in the Assumptions section, not left as an open marker. Acceptable.
- **Tasks.md (Phase 8, T051-T056)**: All 6 marked `[x]`. Spot-checked against
  the actual diff:
  - T051 (seed data) — matches exactly (`noteEs`/`noteEn` added to `wings` entry).
  - T052 (test update) — matches exactly (rename + exclusion-list update + new dedicated test).
  - T053 (MenuDishGrid.spec.ts case) — present, asserts real ordering, not a rubber-stamp.
  - T054/T055 — explicitly annotated in tasks.md as done by the leader directly
    against the real Neon dev DB / local dev server (not the implementer), matching
    this round's stated division of labor to avoid repeating the prior destructive-DB
    incident on this branch. Consistent with `progress/impl_...md`'s own account
    (which candidly states T054/T055 were left `[ ]` by the implementer and
    deferred to the leader) and with the task's own annotation. No contradiction found.
  - T056 (`vitest run`) — re-ran independently: `tests/db/menu-seeds.test.ts` +
    `MenuDishGrid.spec.ts` → 2 files / 46 tests pass.
  Whole-file grep for any remaining `- [ ]` in tasks.md → zero hits (Phases 1-7
  historical tasks are also all `[x]`, consistent with the "already shipped" claim).
- **`MenuDishGrid.vue` correctly untouched**: confirmed via `git diff --stat`
  (not listed) and by reading the file directly — render order is exactly
  `<h2>` → `category-note` (v-if on `categoryNote()`, generic for any category)
  → `wings`-gated thermometer `<img>` → dish grid. No layout change was needed
  or made, matching the spec's explicit claim.
- **Repo state / `./init.sh`**: exit 0. Biome clean (374 files), typecheck
  clean, full test suite 115 files / 1019 tests pass, Storybook build clean.
- **Sensitive data scan**: `git diff` grep for secret/token/key/PEM/JWT
  patterns → only false-positive hits inside `feature_list.json`'s narrative
  description text (the word "token" used in unrelated design/UI prose) and
  a self-referential mention inside `progress/impl_...md`'s own verification
  log describing the scan it ran. No actual secrets, no `.env*` files tracked
  (`git ls-files` check empty). Clean.
- **CHECKPOINTS.md C1-C7**: C1 (harness files, `./init.sh` exit 0) OK. C2
  (exactly 1 feature in `in_progress`/`reviewing`, feature_list.json confirms
  028 is the only one in `reviewing`) OK. C3/C3.1 (no `app/` folder-structure
  violation — no new component, no new file at `app/components/` root) OK.
  C4 (test-per-acceptance-criterion satisfied above; `pnpm test` runs both
  `server/` and `app/` tests; Biome/typecheck/Storybook all pass; no `.vue`
  file was touched this round so the "Storybook sync" bullet is vacuously
  satisfied — no `.stories.ts` update was owed) OK. C5/C6 n/a to this
  mid-review check (session not being closed yet). C7 (no secrets) OK, per
  scan above.
- **Frontend feature verification (Article I/VII)**: N/A this round — zero
  `.vue` files created or modified (only two `.spec.ts` test files and one
  seed-data `.ts` file changed). No new components, no folder-structure
  question, no Storybook obligation.

## Notes (non-blocking)
- The pre-existing `menu-seeds.test.ts` test name change
  (`'leaves every non-kids category without a note'` →
  `'leaves every category other than kids/wings without a note'`) is a clean,
  minimal rename that keeps the test's original intent intact while extending
  its exclusion list — no concerns.
- Per the task's own framing, this review does not re-verify the live Neon
  DB/dev-server state directly (T054/T055) — that was performed by the leader
  per explicit instruction, and tasks.md's own annotations are internally
  consistent with `progress/impl_...md`'s account of what the implementer
  did vs. did not do.

---

# Review: sauce-thermometer-watermark-refresh — Part D (2026-07-18)

**Status:** APPROVED

## Scope of this review
Part D only (User Story 5 / FR-022 / Phase 9, T057-T061) — a CSS-only fix
to Part C's own `category-note` box, layered on top of the already-shipped,
previously-approved Parts A/B/C. Changes are uncommitted working-tree diffs
on `feat/028-sauce-thermometer-watermark-refresh` (verified via `git status`/
`git diff`, not a new commit hash). Pre-existing uncommitted Part C changes
(`server/db/seeds/menuCategories.ts`, `tests/db/menu-seeds.test.ts`) were
already reviewer-APPROVED in the prior round and are not re-flagged here.

## Verifications

- **Precondition**: `feature_list.json` id 28 status = `reviewing`. Confirmed.
- **Exact class change**: `git diff -- app/features/menu/components/MenuDishGrid.vue`
  shows exactly `w-fit max-w-full` appended to the `category-note` div's
  existing class list (`mb-6 rounded-pop border-pop border-ink bg-yellow
  px-4 py-3 font-disp font-extrabold text-kicker shadow-pop-sm`), plus a
  clarifying code comment. No class removed, no other class added, no
  template/logic change — confirmed via `git diff --stat` (1 file, +5/-2,
  all within the comment block and the single `class` attribute).
- **New pinning test is meaningful (T058)**: `MenuDishGrid.spec.ts`'s
  `'sizes the category-note box to fit its content instead of stretching
  full-width (feature 028, Part D)'` mounts a real `kids` category with the
  long inclusions note and asserts `note.classes()` contains `w-fit` AND
  does NOT contain `w-full` — a genuine two-sided assertion, not vacuous.
  Ran standalone (`npx vitest run` scoped to this file): 19/19 tests pass,
  including this one and the Part C ordering test.
- **CSS/Tailwind semantics verified independently** (not just trusting
  plan.md's claim): confirmed in the installed package
  (`node_modules/tailwindcss/stubs/config.full.js`, `tailwindcss: ^3.4.19`
  per `package.json`) that `fit` maps to `width: fit-content`. `fit-content`
  is the standards-defined keyword `min(max-content, max(min-content,
  available-space))` — for both current note strings this cannot exceed the
  parent's available width, so: the long "kids" paragraph still
  wraps/fills up to the container width exactly as the old `w-full`-like
  block div did (no regression), while the short "wings" text now hugs
  tightly. `max-w-full` (`max-width: 100%`) is a no-op safety cap for both
  current strings, consistent with plan.md's own reasoning. No regression
  to the kids case confirmed.
- **No unrelated template/logic changes**: full line-level diff of
  `MenuDishGrid.vue` reviewed — the only non-comment change is the single
  `class` attribute edit. Confirmed.
- **Acceptance ↔ test traceability (User Story 5 / FR-022)**:
  - AC1 (wings note hugs short text, not full-width) → `MenuDishGrid.spec.ts`
    new class-list test (asserts `w-fit` present) + `.stories.ts`
    `WingsSectionWithThermometer` manual-QA callout. Automated assertion
    exists (T058); visual confirmation documented for T061.
  - AC2 (kids note unchanged, no regression) → same class-list test uses the
    `kids` fixture with the long note text, asserting `w-fit` (not `w-full`)
    on that exact long-text case — directly tests the no-regression claim,
    not just the short-text case. Plus `KidsList` story's manual-QA callout.
  - AC3 (never overflows on 360px mobile) → not independently re-tested at
    the automated level (jsdom does not lay out CSS), consistent with this
    being a visual/manual-QA acceptance criterion per the spec's own
    "Independent Test" wording (desktop/mobile visual check) — covered by
    T061's manual confirmation step and the CSS reasoning above (`max-w-full`
    caps at 100% of container regardless of viewport width).
  3/3 acceptance scenarios have at least one associated verification
  (2 automated + 1 CSS-reasoning-backed manual-QA, matching the spec's own
  framing of this as a cosmetic/visual criterion). No gap.
- **Phase -1 / Constitution gates**: This plan uses a "Constitution Check" /
  "Constitution Re-Check" table format (not a literal "Phase -1 Gates"
  checklist), consistent with every prior round on this feature. The Part D
  table in `plan.md`'s "AMENDMENT 2026-07-18 — Part D" section (Articles I,
  IV, VII, VIII, X) shows all 5 rows `✅ Pass`, consistent with the actual
  diff (zero new schema/component/abstraction, single class-list edit).
- **`[NEEDS CLARIFICATION]`**: `grep -n "NEEDS CLARIFICATION" spec.md` →
  zero hits.
- **Tasks.md (Phase 9, T057-T061)**: All 5 marked `[x]`. Spot-checked
  against the actual diff (this branch has a documented history of a
  rejection for tasks marked done without matching reality — re-verified
  here, not rubber-stamped):
  - T057 (add `w-fit max-w-full` to `MenuDishGrid.vue`) — matches exactly,
    no other class touched.
  - T058 (spec.ts class-list assertion) — present, asserts both a positive
    (`toContain('w-fit')`) and a negative (`not.toContain('w-full')`), on
    the long-text `kids` fixture — meaningfully tests the no-regression
    claim, not a rubber stamp.
  - T059 (stories.ts visual-QA callout) — present on both `KidsList` and
    `WingsSectionWithThermometer`, cross-referencing each other's expected
    behavior; `WingsSectionWithThermometer`'s fixture was also updated to
    give the wings category a real note (`note: null` → the actual bilingual
    text), needed for the visual-QA callout to be meaningfully checkable in
    Storybook.
  - T060 (`npx vitest run` full suite) — independently re-ran via `./init.sh`:
    115 files / 1020 tests pass (up from 1019 in the Part C review, +1 for
    the new T058 test).
  - T061 (manual Storybook/dev visual confirmation at desktop + 360px) —
    a manual step; not independently re-performed in this review session,
    but consistent with the CSS-semantics verification above (which
    predicts no regression) and with the task's own framing as a
    human/visual-QA step layered on top of the automated T058 test.
  Whole-file grep for any remaining `- [ ]` in tasks.md → zero hits.
- **Repo state / `./init.sh`**: exit 0. Biome clean (374 files,
  `--error-on-warnings`), `nuxt typecheck` clean, full suite 115 files /
  1020 tests pass (transient-DB retry log lines are expected resilience-test
  noise, not failures), Storybook build succeeds.
- **Sensitive data scan**: `git diff` (scoped to this round's 4 changed
  files) grepped for secret/token/key/PEM/JWT/connection-string patterns →
  zero hits. `git ls-files` env-file check → zero hits (no `.env*` tracked
  besides `.env.example`, which is unchanged this round).
- **Design token enforcement**: `grep` for default-Tailwind-palette utility
  classes and arbitrary-value (`-[...]`) utilities across the 3 changed
  frontend files → zero hits. The only classes added (`w-fit`, `max-w-full`)
  are standard Tailwind sizing utilities, not color/radius/shadow tokens —
  no token-contract violation.
- **CHECKPOINTS.md C1-C7**: C1 (`./init.sh` exit 0) OK. C2 (feature 028 is
  the only one in `reviewing`) OK. C3/C3.1 (no new file, no folder-structure
  question — existing component edited in place, correct feature-owned
  location) OK. C4 (test-per-acceptance-criterion satisfied above; `pnpm test`
  covers `app/` via the `.spec.ts` update; Biome/typecheck/Storybook all pass;
  Storybook sync — `.stories.ts` updated in the same round as the `.vue`
  change, satisfying the co-located-story-update rule) OK. C5/C6 n/a to this
  mid-review checkpoint (session not being closed yet; tasks.md fully `[x]`
  as verified above). C7 (no secrets, per scan above) OK.
- **Frontend feature verification (Article I/VII)**: `MenuDishGrid.vue` was
  modified (class-list only) → `.stories.ts` correctly updated in the same
  round (not stale) with visual-QA callouts covering both the short and
  long note cases, satisfying the "modified component ⇒ story updated"
  rule. No new component created, so no new-component Storybook/spec
  obligation applies. No folder-structure, cross-feature-import, DRY, or
  design-token violation found.

## Notes (non-blocking)
- T061's manual desktop/360px visual confirmation was not independently
  re-performed by this review (no browser/Storybook visual pass run in this
  session) — accepted on the strength of (a) the CSS-semantics verification
  above, which predicts the exact behavior T061 describes, and (b) the
  automated T058 test covering the class-list mechanism that drives that
  behavior. If the leader wants an independently-verified screenshot pass
  before closing the session, that would be the one remaining manual step.
- Carried over from prior rounds: `MenuDishCard.spec.ts`/`.stories.ts` still
  cite stale "FR-021" instead of "FR-006-REV" (cosmetic); `bg-[length:300px_405px]`
  in `app/layouts/default.vue` remains a pre-authorized arbitrary value
  (research.md R1) — neither touched or affected by Part D.

## Next step
None — ready for the implementer to mark `done` once the leader/human
confirms T061's manual visual pass (or accepts the CSS-reasoning-based
verification above as sufficient).
