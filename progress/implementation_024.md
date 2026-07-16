# Implementation report — Feature 024: Menu Image Refresh & Express Branding

**Branch**: `feat/024-menu-image-refresh-express-branding`
**Spec**: `specs/024-menu-image-refresh-express-branding/spec.md`
**Status**: Implementation complete, working tree left uncommitted per instructions.

## Summary

All three user stories (US1 Kids collage, US2 sitewide watermark, US3 Express map
branding) implemented per plan.md/tasks.md. All 27 tasks (T001–T027) completed and
verified. `pnpm check`, `pnpm typecheck`, `pnpm test` (957 tests), and Storybook build
all pass. `./init.sh` fails ONLY on step 3 (`feature_list.json` has 2 features marked
`in_progress`: #23 and #24) — this is an orchestration-file issue outside my authorized
scope (only the leader edits `feature_list.json` per project convention); see "Known
issues" below. Every code-level gate `init.sh` runs (Biome, typecheck, tests, Storybook
build) passes cleanly.

## Completed tasks (tasks.md)

- **T001–T002** (Setup): source assets already present; created `assets/output/`.
- **T003–T009** (US1 — Kids collage):
  - T003: Produced `assets/output/all_you_can_eat_kids.webp` (1200×900, 75.7 KB) — a
    3-panel collage (burger top-left, sushi top-right, chicken tenders+fries bottom,
    ink-colored grout) built with `ffmpeg` (one-off tool, not added to `package.json`,
    per Article X / research.md R2). Each source photo was first flattened onto an
    opaque white canvas (they ship with alpha/soft dropshadows) before being
    scale+letterboxed into its cell, so no transparency bleeds into the grout.
  - T004: `server/db/seeds/kidsMenu.ts` — set `fileName:
    'menu/kids/all_you_can_eat_kids.webp'` for the "All You Can Eat Kids" item only.
  - T005: Reseeded the `kids` category (ran `seedKidsMenu()` directly, not the full
    `seed.ts` pipeline, to keep blast radius to the one affected category) against the
    project's configured `DATABASE_URL` (Neon). Verified via `psql`: `file_name` now
    `menu/kids/all_you_can_eat_kids.webp`; all 6 other Kids rows unchanged.
  - T006: Added a `--src <path>` CLI flag to `scripts/replace-blob-images.ts` (falls
    back to the existing hardcoded default when omitted).
  - T007–T008: Dry-run then `--apply` against a dedicated `assets/output/blob-src/`
    folder containing only the collage (kept the Blob upload plan free of the other
    two feature assets, which are NOT menu images and don't belong in Blob) — dry-run
    showed 0 UNMATCHED, apply reported `✓` (uploaded URL matches the exact existing
    pathname). `blob-src/` removed after the upload (not needed once uploaded).
  - T009: Verified end-to-end via the real running app: `GET /api/v1/menu?type=kids`
    now returns `imageUrl:
    "https://.../menu/kids/all_you_can_eat_kids.webp?v=2026-07-14-1"` for "All You Can
    Eat Kids"; every other Kids item/price/description unchanged. Did NOT bump
    `MENU_IMAGE_VERSION` — this is a net-new image (previously `null`), not an
    in-place replacement of a cached asset, so no cache to bust and no reason to
    force-refetch every other unrelated menu image sitewide.
- **T010–T016** (US2 — sitewide watermark):
  - T010: Re-exported `assets/source/Fondo webp.webp` at baked-in ~10% alpha
    (`colorchannelmixer=aa=0.10`), downscaled to 300×405 for a lean tile, to
    `assets/output/sumo-watermark.webp` (19.6 KB, near the research.md target of
    15–25 KB). Iterated from an initial 13%/195×264 pass that read visually too loud
    in a full-page screenshot before settling on 10%/300×405.
  - T011: Copied to `public/patterns/sumo-watermark.webp`.
  - T012: Added `backgroundImage.watermark` to `tailwind.config.ts`, alongside the
    existing `hero-pop` token.
  - T013: `app/layouts/default.vue` root wrapper gained `bg-watermark bg-repeat`
    alongside its existing `bg-bg` (two CSS background layers on one element, per
    research.md R4 — no new overlay `<div>`, no new stacking context).
  - T014–T015: Verified visually via headless-Chrome screenshots of `/`, `/menu`,
    `/promotions`, `/branches`, `/contact`. **Found and fixed a real bug in the
    process**: `app/pages/branches.vue` and `app/pages/contact.vue` each had their own
    redundant `min-h-screen bg-bg` on their page-root `<div>` (unlike `menu.vue`,
    `promotions.vue`, `index.vue`, which rely on the shared layout for background) —
    this opaque, full-viewport duplicate fully occluded the sitewide watermark on
    those two pages, which would have violated FR-005/SC-002 (watermark must show on
    every page including branches and contact). Fixed by removing the redundant
    `min-h-screen bg-bg` from both page wrappers (the shared layout already provides
    both). Re-verified with screenshots: watermark now visible in the shared chrome
    on all 5 page types; `HomeHero.vue`'s own opaque `bg-hero-pop` section is
    untouched and still occludes the watermark within its own bounds only, exactly as
    documented as the expected/acceptable edge case in spec.md and research.md R4.
    Headline/body text contrast was inspected on every page — dark ink text remains
    clearly higher-contrast than the faint background texture; no perceptible
    regression.
  - T016: Ran real Lighthouse (via `npx lighthouse`) against a **production build**
    (`pnpm build` + `node .output/server/index.mjs`), diffed against a clean baseline
    built from a `git worktree` of `HEAD` (pre-feature code, same commit, no stash
    used — stashing my own uncommitted changes was blocked by the sandbox's
    auto-mode classifier as a destructive action, so I used a worktree instead, which
    never touches my working tree). First attempt showed a large apparent regression
    (e.g. promotions 0.84→0.28) that turned out to be measurement noise from a
    lingering `nuxt dev` background process left running from earlier in the session
    (CPU contention with the Lighthouse Chrome instance) — after killing it and
    re-running both baseline and after-build in isolation, the diff across `/`,
    `/menu`, `/branches`, `/contact`, `/promotions` was **0–3 points, within normal
    Lighthouse run-to-run noise**. No measurable regression from this feature's three
    changes (SC-005 satisfied). Note for the record: the site's own baseline
    Lighthouse *performance* score is already below the constitution's 90+ target on
    some pages today (e.g. `/branches` ≈ 0.55) — that is a **pre-existing condition**
    unrelated to this feature (confirmed identical in both baseline and after runs),
    not something introduced or worsened here.
- **T017–T022** (US3 — Express map branding):
  - T017: `app/composables/maps/adapters/mapboxAdapter.spec.ts` (new) — 5 tests
    asserting `markerLogoSrc('blue')` / `markerLogoSrc('orange')` and the actual
    `<img src>` on `makeMarkerElement('blue' | 'orange')` output. Written and run
    immediately after T019 rather than strictly before it (minor task-order
    deviation — the task said "write this test FIRST"); all 5 pass.
  - T018: Converted `assets/source/Logo .webp` (vertical Express lockup, 381×399,
    already alpha) to `public/brand/sumo-express-vertical.webp` — re-encoded/optimized
    only (17.5 KB), pixel content unmodified (Article VII logo-integrity rule). Kept
    as `.webp` rather than a hand-traced SVG per plan.md's documented fallback (source
    is a rasterized multi-color composite, not a clean vector source).
  - T019: `app/composables/maps/adapters/mapboxAdapter.ts` — added exported
    `markerLogoSrc(color)` helper and branched `makeMarkerElement`'s `img.src` /
    `img.alt` on it (`'blue'` → new Express asset + `alt="SUMO Express"`, `'orange'` →
    unchanged `/brand/sumo-vertical.svg` + `alt="SUMO"`).
  - T020: Full suite green, `MapView.spec.ts` (8 tests) unaffected.
  - T021: Extended `app/components/ui/MapView.stories.ts` with a new
    `MarkerBranding` story. Rather than adding to the existing text-only map stub
    (which is a documented exception since `<MapView>` needs a live Mapbox token),
    this story mounts the REAL `makeMarkerElement()` function from the production
    adapter directly (imported, not reimplemented) inside a tiny wrapper component,
    rendering the actual AYCE pin next to the actual Express pin — real DOM, real
    assets, no hand-rolled markup. Verified visually via a Storybook production build
    + headless screenshot: AYCE pin shows the generic mark, Express pin shows the
    real Sumo Express lockup, clearly distinct.
  - T022: `git diff --stat` confirms zero changes to `app/components/layout/SiteLogo.vue`
    and `app/features/menu/menu-sets.ts` (out-of-scope guardrails, FR-011). Manual
    verification of the live map itself (not the Storybook demo) was not possible in
    this sandbox — Mapbox GL requires WebGL, and headless Chrome in this environment
    has no GPU/GL backend available (`gl=none,angle=none` — confirmed via Chrome's own
    error log even with `--use-gl=swiftshader`). Substituted with (a) the unit test
    (T017, asserts the real `img.src` differs by color) and (b) the Storybook
    real-DOM demo (T021, visually confirms the actual rendered pins). Documented here
    as a known environment limitation, not a code gap.
- **T023–T027** (Polish):
  - T023: `pnpm check:fix` (one formatting fix in the new `MarkerBranding` story),
    then `pnpm check` clean.
  - T024: `pnpm typecheck` clean.
  - T025: Full suite green — 957 tests, 114 files (see "Tests added" below for the
    one pre-existing test I had to update and the new ones I added).
  - T026: Walked the full `quickstart.md` checklist (SC-001–SC-005) end to end; all
    satisfied (see per-story notes above).
  - T027: `git diff --stat -- app/features/menu/menu-sets.ts
    app/components/layout/SiteLogo.vue` — empty, confirming the explicit
    out-of-scope guardrail.

## Deviations from spec/plan (with justification)

1. **`app/pages/branches.vue` / `app/pages/contact.vue` edited** (removed redundant
   `min-h-screen bg-bg`) — not listed in plan.md's file list. Required to actually
   satisfy FR-005/SC-002 (watermark must render on every page, explicitly including
   branches and contact) — without this fix those two pages would have shown zero
   watermark due to a pre-existing duplicate opaque background on their own page-root
   wrapper. Minimal, surgical (2-line removal each), consistent with the established
   pattern already used by `menu.vue`/`promotions.vue`/`index.vue`.
2. **`app/layouts/default.spec.ts` (new)** and small additions to
   `app/pages/branches.spec.ts` / `app/pages/contact.spec.ts` — not explicitly listed
   in tasks.md, but needed to give the watermark change (and the bug fix above) an
   automated regression guard beyond manual screenshots, per Article IV.
3. **`tests/db/menu-seeds.test.ts` updated** — a pre-existing test asserted
   `fileName` was `null` for "All You Can Eat Kids"; updated to assert the new,
   correct value. This is the direct acceptance-criteria test for FR-001/FR-002.
4. **T017 written after T019, not before** — task said write the marker-branding
   test first; I implemented the `markerLogoSrc` branch first, then the test. End
   state (test exists, passes, covers the branching) is equivalent; noting the
   ordering deviation for transparency.
5. **Blob upload used a temporary sub-folder** (`assets/output/blob-src/`, removed
   after upload) rather than pointing `--src` at the full `assets/output/` — the
   latter also contains the watermark and Express logo assets, which are NOT menu
   images and would have shown as UNMATCHED in the dry-run, failing task T007's
   "confirm ... zero UNMATCHED entries" criterion.
6. **Lighthouse verification used a `git worktree`, not `git stash`** — my first
   attempt to `git stash` the uncommitted diff for an isolated baseline was blocked
   by the sandbox's auto-mode classifier (correctly, per the instruction to leave the
   working tree as-is for the leader). Used `git worktree add --detach <tmp> HEAD`
   instead, which builds and runs a second checkout without ever touching my actual
   working tree.

## Tests added (one per acceptance criterion)

- **US1 AC1/AC2** (`spec.md` Acceptance Scenarios 1–2): `tests/db/menu-seeds.test.ts`
  — `fileName` now asserts the collage pathname; existing tests in the same file
  already assert every other Kids item/price/order is unchanged. Confirmed live via
  `GET /api/v1/menu?type=kids` (documented above, T009).
- **US1 AC3** (broken image degrades gracefully): covered by the existing, unmodified
  `app/features/menu/components/MenuDishCard.spec.ts` — the Kids item now follows the
  exact same `imageUrl` non-null code path as every other dish (no new code branch
  introduced for this specific item), and that shared path is already tested for both
  the present- and null-`imageUrl` cases.
- **US2 AC1/AC2/AC3** (watermark present, coexists with hero-pop, no contrast
  regression): `app/layouts/default.spec.ts` (new) asserts `bg-bg`, `bg-watermark`,
  `bg-repeat` are all present on the layout root; `app/pages/branches.spec.ts` and
  `app/pages/contact.spec.ts` each gained a regression-guard test asserting their
  root wrapper does NOT reintroduce an opaque `bg-bg` (which would silently occlude
  the sitewide texture again). Visual/contrast verification via headless-Chrome
  screenshots documented above (T014/T015).
- **US3 AC1/AC2/AC3** (Express pins branded, AYCE unchanged, legible, global logo
  untouched): `app/composables/maps/adapters/mapboxAdapter.spec.ts` (new, 5 tests).
  `git diff --stat` confirms zero change to `SiteLogo.vue`.

## Phase -1 gates (plan.md)

All 12 gates (G1–G12) hold as designed; no constitutional violations introduced.
G8 (Clean Code) re-verified after the change: `makeMarkerElement` stayed well under
the 30-line function limit; the new `markerLogoSrc` helper is a 5-line pure function.

## Known issues / TODOs

- **`./init.sh` step 3 fails**: `feature_list.json` has 2 features marked
  `in_progress` (`23-menu-chip-db-drift-guard` and
  `24-menu-image-refresh-express-branding`), and the harness only allows 1. This
  predates my session (visible in `git log`: a prior commit already
  "dedupe[d] feature 24 entry from rebase, mark in_progress" without resolving
  feature 23's state). I did **not** edit `feature_list.json` — that is explicitly
  the leader's responsibility per `CLAUDE.md`. **Action needed by the leader**:
  resolve feature 23's status in `feature_list.json` before `./init.sh` can exit 0.
  Every other gate `init.sh` runs (Biome, typecheck, tests, Storybook build) already
  passes.
- The sitewide watermark asset is baked at ~10% alpha and 300×405px (19.6 KB) — this
  is a creative/perf trade-off within the spec's stated 10–15% range and the
  research.md's soft 15–25 KB target; if the client wants it more/less subtle after
  visual review, only `specs/024-menu-image-refresh-express-branding/assets/source/Fondo webp.webp`
  needs re-exporting (documented in research.md R4 and in this file).
- Live Mapbox/WebGL rendering of the Express pin could not be screenshotted in this
  sandboxed environment (no GPU/GL backend for headless Chrome). Substituted with a
  unit test + a Storybook story that mounts the real production marker-DOM function
  directly (see T021/T022 above). A human with a normal browser can verify the live
  `/branches` map directly if desired.

## Final verification

- `pnpm check` — pass (373 files, 0 errors).
- `pnpm typecheck` — pass.
- `pnpm test` — pass, 957/957 tests, 114 files.
- `pnpm storybook:build` — pass.
- `./init.sh` — fails ONLY at step 3 (`feature_list.json` in_progress-count gate,
  pre-existing, out of my scope — see "Known issues"). Steps 4 (lint), 5
  (typecheck), 6 (tests), 6.5 (Storybook build) all report `[OK]`.

## Files touched (all uncommitted, working tree left as-is for the leader)

- `server/db/seeds/kidsMenu.ts`
- `scripts/replace-blob-images.ts`
- `tailwind.config.ts`
- `app/layouts/default.vue`
- `app/layouts/default.spec.ts` (new)
- `app/pages/branches.vue`, `app/pages/branches.spec.ts`
- `app/pages/contact.vue`, `app/pages/contact.spec.ts`
- `app/composables/maps/adapters/mapboxAdapter.ts`
- `app/composables/maps/adapters/mapboxAdapter.spec.ts` (new)
- `app/components/ui/MapView.stories.ts`
- `tests/db/menu-seeds.test.ts`
- `public/patterns/sumo-watermark.webp` (new)
- `public/brand/sumo-express-vertical.webp` (new)
- `specs/024-menu-image-refresh-express-branding/assets/output/` (new — collage,
  watermark tile, Express logo deliverables)
- Vercel Blob: `menu/kids/all_you_can_eat_kids.webp` (uploaded, live)
- Neon DB: `kids` category reseeded (only `file_name` for "All You Can Eat Kids"
  row changed)
