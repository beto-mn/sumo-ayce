# Implementation Notes: Feature 018 — Vercel Blob Images

**Branch**: `chore/018-vercel-blob-images`  
**All tests**: 754 passed, 0 failed  
**init.sh exit code**: 0

## Tasks completed

- **T001**: Added `BLOB_BASE_URL: z.string().url().min(1)` to the Zod schema in `server/utils/env.ts`. Startup validation now rejects missing or non-URL values.
- **T002**: Added `BLOB_BASE_URL` entry with inline comment to `.env.example`.
- **T003**: Created `tests/server/api/v1/menu/resolveImageUrl.test.ts` — 4 tests covering all branches: non-null path, null, trailing slash normalization, leading slash normalization. All 4 pass.
- **T004**: Extracted `resolveImageUrl(filePath: string | null)` into `server/api/v1/menu/resolveImageUrl.ts` — 10-line module using `env.BLOB_BASE_URL`.
- **T005**: Updated `server/api/v1/menu/index.get.ts` to import and call the new single-argument `resolveImageUrl`. Removed dead routing logic (`locationType`, `categoryKey`, `includedInAyce` params).
- **T006**: All new tests (and all 754 existing tests) pass green.
- **T007**: Created `tests/server/utils/env.test.ts` — 4 tests: missing BLOB_BASE_URL fails, empty string fails, non-URL fails, all present succeeds. All pass.
- **T008**: Confirmed no additional code needed — `resolveEnv()` lazy singleton already throws with the variable name on first access.
- **T009**: Updated `server/db/seeds/ayceMenu.ts` — all non-null fileNames prefixed with `menu/ayce/`. Null items unchanged.
- **T010**: Updated `server/db/seeds/alaCarta.ts` — all non-null fileNames prefixed with `menu/ala-carta/`. Null items unchanged.
- **T011**: Updated `server/db/seeds/expressMenu.ts` — all non-null fileNames prefixed with `menu/express/`. Null items unchanged.
- **T012**: Updated `server/db/seeds/kidsMenu.ts` — all fileNames prefixed with `menu/kids/`.
- **T013**: Updated `server/db/seeds/desserts.ts` — all fileNames prefixed with `menu/desserts/`.
- **T014**: Updated `server/db/seeds/drinks.ts` — all non-null fileNames prefixed with `menu/drinks/`.
- **T015**: Updated `server/db/seeds/sauces.ts` — all fileNames prefixed with `menu/sauces/`.
- **T016**: Created `docs/harness/vercel-blob.md` — covers path convention, folder table, BLOB_BASE_URL setup, Dashboard/CLI/bulk upload options, DB update procedure via psql/Drizzle Studio/re-seed.
- **T017**: Deleted `public/menu/` directory. Updated `server/utils/menu-queries.ts` to remove `resolveFeaturedImageUrl` (old local-path logic) and use the new `resolveImageUrl` helper instead. Updated `server/utils/menu-queries.test.ts` to mock `resolveImageUrl` and reflect the new expected URL format. No remaining production code constructs `/menu/` local paths.

## Additional changes (not in tasks but required)

- `server/utils/menu-queries.ts`: Removed `resolveFeaturedImageUrl` (had same local-path routing logic as the old `index.get.ts`). Replaced with import of `resolveImageUrl`. Removed `locationType` and `includedInAyce` from `FeaturedQueryRow` interface and DB select (no longer needed for image routing). Updated corresponding test mocks.

## Tests added

| Test file | Acceptance criterion covered |
|---|---|
| `tests/server/api/v1/menu/resolveImageUrl.test.ts` | SC-004: 100% branch coverage on resolveImageUrl |
| `tests/server/utils/env.test.ts` | SC-002: server fails on missing/empty BLOB_BASE_URL |
