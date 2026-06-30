# Storybook coverage cleanup — 020-storybook-full-coverage

Branch: `chore/021-storybook-coverage`

Scoped cleanup fixing two Storybook anti-patterns from the best-practices review:
duplicate-`title` split story files, and hand-maintained static "index" story pages.

## Task 1 — Merge `.variants.stories.ts` into main files, then delete variants

### MapView

- Merged `app/components/ui/MapView.variants.stories.ts` into
  `app/components/ui/MapView.stories.ts`.
- Carried over exports: `AYCEPinsOnly`, `ExpressPinsOnly`, `MixedPins`,
  `FallbackState`, `Loading`.
- No export-name collisions (main had `Default`, `Mobile`, `Desktop`).
- `mapStub` helper already existed in the main file — deduped (not re-added).
- Discarded the variants `meta` (kept the main file's `title`, `tags`, `argTypes`).
- Deleted the variants file.

### ReservationForm

- Merged `app/features/reservation/components/ReservationForm.variants.stories.ts`
  into `app/features/reservation/components/ReservationForm.stories.ts`.
- Carried over exports: `Loading` (submitting state), `WithApiError`.
- No export-name collisions (main had `Default`, `AYCEPreFilled`,
  `ExpressPreFilled`, `NoBranches`, `Mobile`, `Desktop`).
- The `Branch` fixtures (`AYCE_BRANCH`, `EXPRESS_BRANCH`, `BRANCHES`) already
  existed identically in the main file — deduped, not re-added.
- Discarded the variants `meta` (kept the main file's `satisfies Meta<...>`
  with `component`, `tags`, `argTypes`).
- Deleted the variants file.

## Task 2 — Delete 7 hand-maintained "index" story files

Deleted:

- `app/features/homepage/Homepage.stories.ts`
- `app/features/menu/Menu.stories.ts`
- `app/features/branches/Branches.stories.ts`
- `app/features/contact/Contact.stories.ts`
- `app/features/promotions/Promotions.stories.ts`
- `app/features/reservation/Reservation.stories.ts`
- `app/components/ui/UIPrimitives.stories.ts`

`app/components/ui/Tokens.stories.ts` (`UI/_Tokens`) left untouched as instructed.

Note: all deleted/merged variant + index files were untracked (`??` in git),
so removal used `rm` (git rm errors on untracked pathspecs). The merged main
files are tracked and show as modified.

## Verification

- `pnpm check`: fails only on the untracked `app/assets/css/tailwind.css`
  (`@tailwind` at-rules) plus pre-existing `info`-level
  `useVueMultiWordComponentNames` notices. None of the touched/deleted story
  files produce any diagnostic. Unrelated to this cleanup.
- `pnpm typecheck`: fails in this environment because Nuxt's typecheck needs
  `typescript` hoisted to top-level `node_modules`, which pnpm does not do
  (it's a peer of `vue-tsc`, not a direct devDependency). Pre-existing setup
  gap, not caused by this change. Verified independently by running
  `vue-tsc --noEmit -p tsconfig.json` directly (uses the store-resolved
  typescript@5.9.3): **zero errors**, including in both merged story files.
- `pnpm storybook:build`: **exit 0**. Merged `ReservationForm.stories.ts` and
  `MapView.stories.ts` build cleanly with no duplicate-title warnings.

## Known issues / TODOs

- None from this cleanup. The `tailwind.css` check failure and the
  `typescript` hoisting gap are pre-existing and out of scope.
