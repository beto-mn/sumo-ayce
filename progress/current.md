# Current session

> Active: **028 — sauce-thermometer-watermark-refresh**, flipped back to `pending` → now
> `spec_ready` again for a Part D amendment (2026-07-18), on top of the already-amended Part C.
> Branch `feat/028-sauce-thermometer-watermark-refresh` (existing branch, no new branch created —
> in-place spec amendment, same folder/pattern as Part B reversal and Part C addition).

## Feature 028 — Part D amendment (spec_ready)

- **Feature**: id 28, `sauce-thermometer-watermark-refresh`.
- **Spec folder**: `specs/028-sauce-thermometer-watermark-refresh/`.
- **What changed**: Parts A/B/C all remain exactly as previously shipped/
  reviewer-approved (untouched). **Part D (new)**: the client visually
  inspected Part C's own shipped output and found the `category-note` box
  (`MenuDishGrid.vue` ~lines 47-53) too wide — it's a block-level `<div>` with
  no width constraint, so it always stretches full-width, which looked correct
  for the long "kids" paragraph note but rendered as an oversized, mostly-empty
  pill for Part C's short "Escoge tu salsa favorita" text. Fix: append
  `w-fit max-w-full` to the existing class list (no other class changed, no
  template structure change, no new component).
- **Verification done before locking in the fix**: read the current
  `MenuDishGrid.vue` state and confirmed the exact bug (no width-constraining
  class present); grepped `MenuDishGrid.spec.ts`/`.stories.ts` and confirmed
  **no existing test asserts a width-related class on `category-note`** (the
  only existing width assertion in the file targets the unrelated
  `wings-thermometer` image's `w-full` class) — so this fix carries zero
  regression risk to a pinned assertion. Confirmed via CSS/Tailwind semantics
  (Tailwind 3.4, this project's installed version) that `w-fit`
  (`width: fit-content`, standards-defined as
  `min(max-content, max(min-content, available-space))`) already cannot
  exceed the container's available width for ordinary wrapping text — both
  today's note strings are space-separated sentences, not single unbreakable
  tokens — so the long "kids" note's wrapping/appearance is unaffected;
  `max-w-full` is added purely as a zero-cost defensive guard (no behavioral
  effect on either of today's two strings). This did not surface a genuine
  ambiguity requiring `/speckit.clarify`.
- **Skills/process invoked**: No `/speckit-git-feature` (existing branch/spec
  folder reused per leader instruction). `spec.md`, `plan.md`, `tasks.md`
  amended directly by hand (mirroring this feature's own Part B reversal /
  Part C addition precedent), not via `/speckit.specify`/`/speckit.plan`/
  `/speckit.tasks` regeneration.
- **`[NEEDS CLARIFICATION]`**: none introduced or resolved via `/speckit.clarify`
  — the `w-fit` vs. `w-fit`+`max-w-full` question was resolved directly via
  CSS/Tailwind semantics during spec authoring (documented in spec.md's new
  "Part D sizing approach" Assumptions bullet and Revision subsection), not
  left open.
- **New spec content**: User Story 5 (P3), FR-022, SC-009, an Edge Case
  bullet, a Key Entity annotation, and a "Revision 2026-07-18 — Part D"
  Assumptions subsection in `spec.md`; an "AMENDMENT 2026-07-18 — Part D"
  section (with its own mini Constitution re-check: Articles I, IV, VII,
  VIII, X) in `plan.md`; a new "Phase 9" (T057-T061) in `tasks.md` covering
  the class-list change itself (T057), a new Vitest assertion pinning the
  class list contains `w-fit` and not a full-width-forcing class (T058), a
  Storybook-level visual-check callout for both the short (wings) and long
  (kids) cases (T059), and manual/automated verification at desktop + 360px
  mobile (T060-T061).
- **Phase -1 / Constitution gates most relevant to Part D**: Article I (no
  new abstraction — class-list edit on the existing block only), Article IV
  (new test added, no orphaned/broken assertions), Article VII (UX
  consistency — no other visual property changes, mobile-first preserved),
  Article VIII (no dead code), Article X (KISS — smallest possible fix, a
  standard Tailwind utility, no new custom CSS/prop/logic).
- **Next gate**: human approval (`spec_ready` → `in_progress`) per the
  standard SDD gate — this agent does not implement.

## Feature 028 — Part C amendment (spec_ready) — prior round, superseded by Part D above

- **Feature**: id 28, `sauce-thermometer-watermark-refresh`.
- **Spec folder**: `specs/028-sauce-thermometer-watermark-refresh/`.
- **What changed**: Parts A (watermark) and B (thermometer graphic, revised —
  interactive picker/`sauces` table already removed) are untouched and remain
  exactly as previously shipped/reviewer-approved. **Part C (new)**: add the
  copy "Escoge tu salsa favorita" / "Choose your favorite sauce" to the
  "Alitas & Boneless" ("wings") category, reusing the existing
  `menu_categories.noteEs`/`noteEn` mechanism already live for the "kids"
  category — no new schema, no new component, no layout change (verified
  `MenuDishGrid.vue` still renders `category.note` directly below the `<h2>`
  and directly above the wings-gated thermometer image, matching the required
  "instruction before visual guide" order).
- **Skills/process invoked**: No `/speckit-git-feature` (existing branch/spec
  folder reused per leader instruction — in-place amendment). `spec.md`,
  `plan.md`, `tasks.md` amended directly by hand (mirroring this feature's own
  "Revision 2026-07-17" / "AMENDMENT 2026-07-17" precedent for the Part B
  reversal), not via `/speckit.specify`/`/speckit.plan`/`/speckit.tasks`
  regeneration, since this is a small in-place addition on an already-detailed
  existing spec, consistent with prior practice on this feature.
- **`[NEEDS CLARIFICATION]`**: none introduced. The one open judgment call (EN
  translation wording) was resolved directly in spec.md's Assumptions
  ("Choose your favorite sauce", matching the existing `kids` note's
  translation register) rather than via `/speckit.clarify` — not a genuine
  ambiguity per the leader's brief.
- **New spec content**: User Story 4 (P2), FR-020/FR-021, SC-008, a new Key
  Entity ("Wings/Boneless category note"), an Edge Case, and a
  "Revision 2026-07-18" Assumptions subsection in `spec.md`; an
  "AMENDMENT 2026-07-18" section (with its own mini Constitution re-check:
  Articles I, IV, VIII, X) in `plan.md`; a new "Phase 8" (T051-T056) in
  `tasks.md` covering the seed change, the required `menu-seeds.test.ts`
  update (existing `'leaves every non-kids category without a note'` test
  will fail once `wings` gets a note — task explicitly calls this out), a new
  `MenuDishGrid.spec.ts` render-order case, reseeding, and manual/automated
  verification.
- **Phase -1 / Constitution gates most relevant to Part C**: Article I
  (reuse `noteEs`/`noteEn` + `seedMenuCategories()` + `categoryNote()`
  verbatim, zero new abstraction), Article IV (existing test updated + new
  test added, no orphaned assertions), Article VIII (no dead code), Article X
  (KISS — smallest possible change, no new mechanism).
- **Next gate**: human approval (`spec_ready` → `in_progress`) per the
  standard SDD gate — this agent does not implement.

## State (as of last `done` closure, before this reopening)
- Backlog: 001–014, 016–024, 027 → `done`. 028 → reopened to `spec_ready` for Part C. 015, 025, 026 → `pending`.
- DB: Neon PostgreSQL (`sumo_ayce_db`, `.env` `DATABASE_URL`). Latest migration applied:
  `0033_drop_sauces_and_option_group_max_selections.sql`. Local Docker dev DB (`sumo_ayce`)
  is currently empty (see history.md 028 closure note — unauthorized drop during 028 Round 2,
  not yet reseeded; human deprioritized this in favor of the real Neon dev DB).
- Tests: 1017 passed (115 test files). `./init.sh` green.

## Follow-up not yet actioned
- **T048 (feature 027)**: Lighthouse spot-check of `/`, `/menu`, `/promotions` was not run (no
  Chrome/Chromium tooling in the implementer/reviewer sandbox). Non-blocking — feature is `done`.
- **Pre-existing seed-pipeline FK bug** (introduced by feature 027, surfaced during 028's Neon
  reconciliation): `resetDrinkChildren()` in `server/db/seeds/drinkGroups.ts` tries to delete
  `menu_items` under a drink category before option groups referencing them (e.g. Vaso Sumo's
  flavor group) are cleared, causing a FK violation on any full `pnpm db:seed` re-run against a
  DB with live option groups. Worked around manually for 028; still unfixed.
- **Local Docker dev DB (`sumo_ayce`) is empty** — wiped during 028 Round 2 (see history.md for
  the security incident). Restorable via `pnpm db:up && pnpm db:migrate && pnpm db:seed` (subject
  to the FK bug above once option groups exist), but not yet done.

## Pending
- Feature **015 — loyalty-portal** (`pending`, `sdd: true`).
- Feature **025 — menu-page-lighthouse-perf-fix** (`pending`, `sdd: true`).
- Feature **026 — google-reviews-and-branches-ux** (`pending`, `sdd: true`).
