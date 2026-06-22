# Review: 013-branches-page (Second Pass)

**Status:** REJECTED

## Reasons

### R1 — FR-003 / Gate III.2 violated: `useBranches` triggers additional API calls on user interaction

**File**: `app/features/branches/composables/useBranches.ts`

FR-003 states: "Client-side distance sorting MUST operate on this cached list — no additional API call is triggered by user geolocation or CP input."

Gate III.2 states: "Client-side interactions operate on `ref` state derived from that fetch — no second `$fetch` or `useFetch` call triggered by user interaction."

The implementation does the opposite:
- `requestGeolocation()` (lines 95–112) calls `await fetchBranches(lat, lng)` on success, which issues `$fetch('/api/v1/branches', { query: { lat, lng } })`.
- `geocodePostalCode()` (lines 114–131) calls `await fetchBranches(lat, lng)` after resolving coordinates.

The `useBranches.spec.ts` tests explicitly verify this behaviour (e.g. "requestGeolocation calls fetchBranches with geo coords on success" confirms `$fetch` is called with coords after geo permission).

**Fix required**: Remove `fetchBranches(lat, lng)` calls from geolocation and CP handlers. Instead, sort `branches.value` in memory using the client-side `haversineKm` utility already present at `app/features/branches/utils/haversine.ts`. The `branches` ref is populated from `useAsyncData` in `branches.vue` — the composable should accept it as a prop/parameter and derive `sortedBranches` as a computed ref that applies haversine sorting when coordinates are available.

The `fetchBranches()` function should remain only for the initial load (called from `branches.vue` via `useAsyncData`) and for the "clear" path when reverting to the full unfiltered list.

### R2 — `BranchCard.stories.ts` missing `Default` story

**File**: `app/features/branches/components/BranchCard.stories.ts`

The constitution Article VII (NON-NEGOTIABLE) and the reviewer protocol both mandate: "Each story file MUST include: A Default story showing the component in its baseline state."

`BranchCard.stories.ts` exports `AYCECard`, `ExpressCard`, `WithDistance`, `WithoutDistance`, `WithSchedule`, `WithoutSchedule`, `PhoneNull`, `Highlighted`, `Mobile`, `Desktop` — but no `Default` export.

**Fix required**: Add `export const Default: Story = { args: { branch: AYCE_BRANCH } }` (or equivalent) as the first named export.

## Observations (non-blocking)

- **`MapView.spec.ts` line 12**: The `useRuntimeConfig` stub sets `mapboxToken: 'pk.test-token'` but the component reads `runtimeConfig.public.mapboxAccessToken`. Since the entire adapter is mocked via `useMapProvider`, the token is never forwarded to `createMap` in tests and all tests pass. However the stub key is semantically wrong — it should be `mapboxAccessToken` to align with the actual runtime config shape. Does not block, but should be corrected for clarity.

- **`BranchCard.vue` type chip**: The AYCE chip class is `'bg-accent'` (no scope class), and the Express chip has `'scope-express bg-accent'`. Because `--accent` is swapped by `scope-express`, both render correctly. This matches the spec's `--accent` swap pattern.

## Verification results

| Check | Result |
|---|---|
| `./init.sh` | Exit 0 |
| `pnpm test` (75 files, 455 tests) | All pass |
| All tasks `[x]` in tasks.md | Yes (46/46) |
| All Phase -1 gates `[x]` in plan.md | Yes (all gates) |
| No `.env` files tracked | Clean |
| No hardcoded secrets in diff | Clean |
| No cross-feature imports | Clean |
| No `mapbox-gl` outside adapter | Clean |
| No Drizzle under `app/` | Clean |
| No inline hex in Vue/CSS files | Clean |
| No default-palette Tailwind utilities | Clean |
| `app/components/` root has no stray `.vue` | Clean |
| Page template ≤ 100 lines | 91 lines (lines 119–209) |
| Component files ≤ 200 lines | All compliant |

## Next step

The implementer must fix R1 and R2 before this feature can be approved.
