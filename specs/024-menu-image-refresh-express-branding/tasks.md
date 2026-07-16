---

description: "Task list for Menu Image Refresh & Express Branding"
---

# Tasks: Menu Image Refresh & Express Branding

**Input**: Design documents from `/specs/024-menu-image-refresh-express-branding/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, quickstart.md

**Tests**: Included per Article IV of the constitution (every composable/server-utility change
gets a co-located test); no new server route or page is introduced by this feature.

**Organization**: Tasks are grouped by user story (US1 = Kids collage, US2 = sitewide
watermark, US3 = Express map branding). The three stories touch disjoint files and can be
implemented, tested, and shipped independently and in any order.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: US1, US2, or US3
- File paths are exact and relative to the repository root

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Confirm the source assets this whole feature depends on are in place before any
story starts.

- [X] T001 Copy the 6 client source assets into `specs/024-menu-image-refresh-express-branding/assets/source/` and verify all 6 are present and non-zero size (already done — see `assets/source/`)
- [X] T002 Create `specs/024-menu-image-refresh-express-branding/assets/output/` as the staging folder for produced deliverables (composite image, converted logo, watermark tile)

**Checkpoint**: Source assets confirmed durable in-repo; ready for all three stories.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: None required — the three user stories touch disjoint files (seed data + ops
script vs. Tailwind config + layout vs. map adapter) with no shared new infrastructure. Skip
directly to user story phases.

**Checkpoint**: N/A — proceed to Phase 3.

---

## Phase 3: User Story 1 - Kids AYCE Dish Photo Collage (Priority: P1) 🎯 MVP

**Goal**: The "All You Can Eat Kids" menu item shows a single composite image combining the 3
client-provided dish photos, uploaded to Vercel Blob, with no other Kids data changed.

**Independent Test**: Reseed the `kids` category, run `/menu` → Kids view, and confirm the
"All You Can Eat Kids" card shows the new composite image (previously blank).

### Implementation for User Story 1

- [X] T003 [US1] Produce the composite/collage `webp` from the 3 source photos (`assets/source/KIDS BURGER_B.webp`, `assets/source/DSC02525 copia.webp`, `assets/source/SEB08252 copia.webp`) using a one-off, non-project-dependency image tool (per research.md R2); save the result to `specs/024-menu-image-refresh-express-branding/assets/output/all_you_can_eat_kids.webp`
- [X] T004 [US1] Update `server/db/seeds/kidsMenu.ts`: set `fileName: 'menu/kids/all_you_can_eat_kids.webp'` for the `KIDS_ITEMS` entry with `nameEs: 'All You Can Eat Kids'` (leave every other field on this item and every other Kids item untouched)
- [X] T005 [US1] Reseed the `kids` menu category against the target database (run the project's existing seed command for `kidsMenu.ts`) and confirm via a DB query that the row's `file_name` column now equals `menu/kids/all_you_can_eat_kids.webp`
- [X] T006 [US1] Add a `--src <path>` CLI flag to `scripts/replace-blob-images.ts` (falls back to the existing hardcoded default path when omitted) per research.md R3 — no other behavior of the script changes
- [X] T007 [US1] Dry-run the upload: `pnpm tsx --env-file-if-exists=.env scripts/replace-blob-images.ts --src specs/024-menu-image-refresh-express-branding/assets/output`; confirm the plan output maps `all_you_can_eat_kids.webp` → `menu/kids/all_you_can_eat_kids.webp` with zero UNMATCHED entries
- [X] T008 [US1] Apply the upload: re-run the same command with `--apply`; verify the script reports a successful upload (`✓`, not `⚠ URL≠path`)
- [X] T009 [US1] Manually verify in the running app (`/menu` → Kids view) that the "All You Can Eat Kids" card now renders the new composite image and every other Kids item/price/description is unchanged

**Checkpoint**: User Story 1 is fully functional and independently verifiable (SC-001).

---

## Phase 4: User Story 2 - Sitewide Watermark Background (Priority: P2)

**Goal**: A low-opacity (~10–15%) tiled pop-art watermark pattern is visible across every page
of the site, coexisting with existing per-section backgrounds (notably the homepage's
`hero-pop` treatment) without harming contrast or performance.

**Independent Test**: Load `/`, `/menu`, `/promotions`, `/sucursales` (or `/branches`), and
`/contact`; confirm the watermark texture is visible at low opacity on every page and that the
homepage hero section still reads correctly with its existing `hero-pop` backdrop.

### Implementation for User Story 2

- [X] T010 [P] [US2] Re-export `assets/source/Fondo webp.webp` at a pre-baked ~10–15% opacity (blended against transparent) and compressed, saving the result to `specs/024-menu-image-refresh-express-branding/assets/output/sumo-watermark.webp` (per research.md R4)
- [X] T011 [US2] Copy the produced asset to `public/patterns/sumo-watermark.webp` (create the `public/patterns/` directory if it doesn't exist)
- [X] T012 [US2] Add a `watermark` entry to `backgroundImage` in `tailwind.config.ts`, alongside the existing `hero-pop` entry, referencing `url('/patterns/sumo-watermark.webp')` with `background-repeat: repeat` semantics
- [X] T013 [US2] Edit `app/layouts/default.vue`'s root wrapper `div` to add the new `bg-watermark` utility (or equivalent Tailwind class from T012) alongside the existing `bg-bg`, so both the solid color and the tiled pattern paint together on the same element
- [X] T014 [US2] Visually verify on `/` that the watermark is visible in the header/marquee/footer chrome and does not visually clash with `HomeHero.vue`'s own `bg-hero-pop` section (per research.md R4 — occlusion inside the Hero section is expected and acceptable)
- [X] T015 [US2] Spot-check text/content contrast on at least one section per page type (home, menu, promotions, branches, contact) against the pre-feature baseline; confirm no perceptible regression
- [X] T016 [US2] Run a Lighthouse pass on `/` (or the project's existing Lighthouse check) to confirm the score stays ≥90 after the new watermark asset ships (SC-005)

**Checkpoint**: User Story 2 is fully functional and independently verifiable (SC-002, SC-003).

---

## Phase 5: User Story 3 - Sumo Express Branch Map Branding (Priority: P3)

**Goal**: Express-type branch pins on the branch-finder map show the actual Sumo Express
vertical logo lockup; AYCE pins and the global header/footer logo are unchanged.

**Independent Test**: Open the branch map with at least one AYCE and one Express branch
visible; confirm only the Express pin shows the new brand mark and the AYCE pin and the site
header/footer logo are pixel-identical to before.

### Tests for User Story 3

- [X] T017 [P] [US3] Create `app/composables/maps/adapters/mapboxAdapter.spec.ts`: assert that the marker element produced for `color: 'blue'` has an `<img>` `src` pointing at the new Express asset, and the marker element produced for `color: 'orange'` still points at `/brand/sumo-vertical.svg`; mock `mapbox-gl` via the existing centralized mock convention (do not add a new ad-hoc mock) — write this test FIRST so it fails before T019

### Implementation for User Story 3

- [X] T018 [P] [US3] Convert/optimize `assets/source/Logo .webp` (the vertical Express lockup) into `public/brand/sumo-express-vertical.svg` (or `.webp` if vector conversion isn't feasible), used unmodified per Article VII — save the intermediate/converted file first to `specs/024-menu-image-refresh-express-branding/assets/output/`
- [X] T019 [US3] In `app/composables/maps/adapters/mapboxAdapter.ts`, export `makeMarkerElement` (or extract an equivalently testable seam) and branch its `img.src` assignment: `color === 'blue'` → `/brand/sumo-express-vertical.svg`, `color === 'orange'` → unchanged `/brand/sumo-vertical.svg` (depends on T018; makes T017 pass)
- [X] T020 [US3] Run the full test suite and confirm `mapboxAdapter.spec.ts` passes and no existing `MapView.spec.ts` test regresses
- [X] T021 [P] [US3] Add (or extend) a fixture/variant in `app/components/ui/MapView.stories.ts` and/or `app/features/branches/components/BranchCard.stories.ts` demonstrating an Express-branded marker next to an AYCE marker, per Article VII Storybook coverage
- [X] T022 [US3] Manually verify on the branch map that Express pins show the new mark, AYCE pins are unchanged, and `app/components/layout/SiteLogo.vue` (or equivalent global logo component) has zero diff (`git diff` shows no changes to it)

**Checkpoint**: User Story 3 is fully functional and independently verifiable (SC-004).

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final gates across all three stories.

- [X] T023 [P] Run Biome lint + format across all changed files
- [X] T024 [P] Run `vue-tsc --noEmit` and confirm no new type errors
- [X] T025 Run the full Vitest suite and confirm 100% pass, including the new `mapboxAdapter.spec.ts`
- [X] T026 Run through the full `quickstart.md` verification checklist (SC-001 through SC-005) end-to-end
- [X] T027 Confirm via `git diff` that `menu-sets.ts` and any other menu category/chip logic have zero changes (explicit out-of-scope guardrail from spec.md)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — source assets already copied (T001 done); only T002 (create output folder) remains.
- **Foundational (Phase 2)**: None — skipped, see note above.
- **User Stories (Phase 3–5)**: Each depends only on Phase 1 (T002) being done. The three stories touch fully disjoint files and can proceed in parallel or in any priority order.
- **Polish (Phase 6)**: Depends on all desired user stories being complete.

### User Story Dependencies

- **User Story 1 (P1)**: No dependency on US2 or US3.
- **User Story 2 (P2)**: No dependency on US1 or US3.
- **User Story 3 (P3)**: No dependency on US1 or US2.

### Within Each User Story

- US1: T003 → T004 → T005 → T006 → T007 → T008 → T009 (mostly sequential — each step's output feeds the next).
- US2: T010 → T011 → T012 → T013 → T014/T015/T016 (T014–T016 can run in parallel once T013 lands).
- US3: T017 and T018 can start in parallel; T019 depends on both; T020–T022 follow T019.

### Parallel Opportunities

- T010 (US2 asset prep) and T017/T018 (US3 test + asset prep) can run in parallel with any step of US1 — different files entirely.
- Within US3: T017 (test) and T018 (asset conversion) are parallelizable with each other.
- Within Phase 6: T023 and T024 are parallelizable with each other.

---

## Parallel Example: Cross-story kickoff

```bash
# These can all start at the same time (different files, independent stories):
Task: "Produce the composite collage webp (US1, T003)"
Task: "Re-export the watermark tile at pre-baked opacity (US2, T010)"
Task: "Write mapboxAdapter.spec.ts for the Express/AYCE branching (US3, T017)"
Task: "Convert the Express vertical logo asset (US3, T018)"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1 (T001–T002).
2. Complete Phase 3 (User Story 1 — Kids collage).
3. **STOP and VALIDATE**: Confirm the Kids AYCE menu item shows the new image and no other menu data changed.
4. Ship/demo if ready — this alone closes the most visible content gap (a priced item with zero image).

### Incremental Delivery

1. Setup → Phase 1 done.
2. Add User Story 1 → validate independently → ship.
3. Add User Story 2 → validate independently → ship.
4. Add User Story 3 → validate independently → ship.
5. Phase 6 polish gates run once, covering whichever stories have shipped by then.

---

## Notes

- [P] tasks touch different files with no dependency on an incomplete task.
- [Story] labels map every user-story-phase task back to spec.md's US1/US2/US3.
- No new feature folder, no new pages/routes, no DB migration — this feature only edits
  existing seed data, an existing ops script, one Tailwind token + one layout file, and one
  function inside an existing Mapbox adapter (plus its new co-located test).
- Global `SiteLogo.vue` and `menu-sets.ts` are explicitly out of scope — T022 and T027 verify
  this via `git diff`.
