# Tasks: Vercel Blob — Menu Image Storage

**Input**: Design documents from `specs/018-vercel-blob-images/`  
**Prerequisites**: `plan.md` ✅ `spec.md` ✅

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1–US4)

---

## Phase 1: Foundational (Blocking Prerequisite)

**Purpose**: Add `BLOB_BASE_URL` to env validation — required by all user stories.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [x] T001 Add `BLOB_BASE_URL: z.string().url().min(1)` to the Zod schema in `server/utils/env.ts`
- [x] T002 Add `BLOB_BASE_URL` entry with inline comment to `.env.example` (comment: "Public base URL of the Vercel Blob store — Dashboard → Storage → your store → Public URL")

**Checkpoint**: `env.BLOB_BASE_URL` is accessible in server code and fails fast when unset.

---

## Phase 2: User Story 1 — Menu images load from Vercel Blob (Priority: P1) 🎯 MVP

**Goal**: `GET /api/v1/menu` returns fully-qualified Blob URLs for every dish with a non-null `file_name`.

**Independent Test**: Set `BLOB_BASE_URL=https://abc123.public.blob.vercel-storage.com`, call `GET /api/v1/menu?type=ayce&modality=buffet`, verify every dish with non-null `file_name` returns `imageUrl` starting with that base URL.

### Tests for User Story 1

- [x] T003 [US1] Create `tests/server/api/v1/menu/resolveImageUrl.test.ts` with unit tests covering: non-null path → full URL, null → null, trailing-slash in BLOB_BASE_URL → no double slash in result, leading-slash in path → no double slash in result (SC-004: 100% branch coverage)

### Implementation for User Story 1

- [x] T004 [US1] Refactor `resolveImageUrl` in `server/api/v1/menu/index.get.ts`: simplify signature to `(filePath: string | null) => string | null`, remove `locationType`/`categoryKey`/`includedInAyce` params, implement as `env.BLOB_BASE_URL.replace(/\/$/, '') + '/' + filePath` (strip trailing slash before concat)
- [x] T005 [US1] Update all call sites of `resolveImageUrl` in `server/api/v1/menu/index.get.ts` to use the new single-argument signature (remove `locType`, `category.key`, `includedInAyce` args)
- [x] T006 [US1] Verify tests written in T003 now pass with the updated implementation

**Checkpoint**: Unit tests green. Call `GET /api/v1/menu?type=ayce&modality=buffet` and confirm `imageUrl` values are fully-qualified HTTPS URLs (or null for items without images).

---

## Phase 3: User Story 2 — Application refuses to start without BLOB_BASE_URL (Priority: P1)

**Goal**: Server exits with a non-zero code and a clear error message when `BLOB_BASE_URL` is absent or empty.

**Independent Test**: Unset `BLOB_BASE_URL`, run `pnpm dev` or `node .output/server/index.mjs`, confirm process exits non-zero with a message containing `BLOB_BASE_URL`.

### Tests for User Story 2

- [x] T007 [US2] Add test cases to `tests/server/utils/env.test.ts` (create if absent) verifying: missing `BLOB_BASE_URL` → `safeParse` failure with path `BLOB_BASE_URL`; empty string → same failure; all vars present including `BLOB_BASE_URL` → `safeParse` success

### Implementation for User Story 2

- [x] T008 [US2] Confirm the Zod schema change in T001 is the sole implementation needed — the lazy singleton in `resolveEnv()` already throws `"Missing or invalid environment variables: BLOB_BASE_URL"` on first access. No additional code required.

**Checkpoint**: Running `BLOB_BASE_URL= pnpm dev` produces a startup error naming `BLOB_BASE_URL`. Tests in T007 pass.

---

## Phase 4: User Story 3 — Re-seeding populates correct Blob paths (Priority: P2)

**Goal**: `pnpm db:seed` stores full Blob-relative paths in all `file_name` columns. No bare filenames remain.

**Independent Test**: Run `pnpm db:seed`, query `menu_items` and `sauces`, verify every non-null `file_name` matches `^menu/[a-z-]+/.+\.(webp|jpg|png|svg)$`.

### Implementation for User Story 3

All tasks below are independent — different files, safe to run in parallel.

- [x] T009 [P] [US3] Update every `fileName` in `server/db/seeds/ayceMenu.ts` to `'menu/ayce/<filename>'` (e.g., `'mixed_yakimeshi.webp'` → `'menu/ayce/mixed_yakimeshi.webp'`). Items with null `fileName` stay null.
- [x] T010 [P] [US3] Update every `fileName` in `server/db/seeds/alaCarta.ts` to `'menu/ala-carta/<filename>'`.
- [x] T011 [P] [US3] Update every `fileName` in `server/db/seeds/expressMenu.ts` to `'menu/express/<filename>'`.
- [x] T012 [P] [US3] Update every `fileName` in `server/db/seeds/kidsMenu.ts` to `'menu/kids/<filename>'`.
- [x] T013 [P] [US3] Update every `fileName` in `server/db/seeds/desserts.ts` to `'menu/desserts/<filename>'`.
- [x] T014 [P] [US3] Update every `fileName` in `server/db/seeds/drinks.ts` to `'menu/drinks/<filename>'` (skip if no `fileName` fields exist in this seed).
- [x] T015 [P] [US3] Update every `fileName` in `server/db/seeds/sauces.ts` to `'menu/sauces/<filename>'`.

**Checkpoint**: `pnpm db:seed` runs without errors. SQL query `SELECT file_name FROM menu_items WHERE file_name IS NOT NULL` returns only paths matching `^menu/`.

---

## Phase 5: User Story 4 — Developer/client image management documentation (Priority: P3)

**Goal**: `docs/harness/vercel-blob.md` is self-contained — a developer or the client can manage images without asking for help.

**Independent Test**: Follow the doc step-by-step in a fresh environment; confirm a new image becomes visible in the menu without code changes.

### Implementation for User Story 4

- [x] T016 [US4] Create `docs/harness/vercel-blob.md` covering: (1) path convention (`menu/<folder>/<filename>` — no leading slash, no base URL), folder table mirroring `public/menu/` subfolders; (2) bulk initial upload via `scripts/upload-blob.mjs` (install `@vercel/blob`, set `BLOB_READ_WRITE_TOKEN`, run `node scripts/upload-blob.mjs`); (3) upload a single new image via Vercel Dashboard (Storage → Blob → Upload) or via the SDK; (4) DB update procedure — update `file_name` in Neon via psql or Drizzle Studio after uploading; (5) env vars — `BLOB_READ_WRITE_TOKEN` (for uploads, never committed), `BLOB_BASE_URL` (public read URL, set in `.env.local` and Vercel project settings).
- [x] T017 Delete the `public/menu/` directory and all its contents — images are now served from Vercel Blob and the static folder is no longer needed. Verify no remaining code references `/menu/` as a local asset path after deletion.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Foundational)**: No dependencies — start immediately.
- **Phase 2 (US1)**: Depends on Phase 1 (needs `env.BLOB_BASE_URL`).
- **Phase 3 (US2)**: Depends on Phase 1 (schema must include `BLOB_BASE_URL` to test validation).
- **Phase 4 (US3)**: Independent of Phases 2–3 (seed changes are pure data, no runtime env needed).
- **Phase 5 (US4)**: Independent of all implementation phases (documentation only).

### Parallel Opportunities

- **Phases 2 and 3** can run in parallel once Phase 1 is done.
- **Phases 4 and 5** can run in parallel at any time after Phase 1.
- **All T009–T015** (seed file updates) can run in parallel within Phase 4.

---

## Implementation Strategy

### MVP (P1 stories only)

1. Phase 1: Add `BLOB_BASE_URL` to `env.ts` + `.env.example`
2. Phase 2: Update `resolveImageUrl()` + unit test
3. Phase 3: Confirm startup validation behavior + test
4. **STOP and VALIDATE**: Blob URLs served correctly, startup fails cleanly without env var.

### Incremental Delivery

1. Phases 1–3 → P1 stories done → Blob URLs live in API
2. Phase 4 → Seeds updated → Dev environments use correct paths after re-seed
3. Phase 5 → Client can self-serve image management

---

## Notes

- **No DB migration**: `file_name` column shape is unchanged — only stored values change.
- **No new npm packages**: All URL assembly is plain string concat.
- **Sauce images**: `menu/sauces/` is a new Blob subfolder (no `public/menu/sauces/` exists today) — this is expected; the client creates it when uploading sauce images.
- **`menu_categories.file_name`**: Remains null — categories have no images in the current UI.
