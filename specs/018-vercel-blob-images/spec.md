# Feature Specification: Vercel Blob — Menu Image Storage

**Feature Branch**: `chore/018-vercel-blob-images`  
**Feature ID**: 018  
**Created**: 2026-06-29  
**Status**: Draft  
**Input**: Migrate menu image delivery from static public/ assets to Vercel Blob Storage. Change file_name semantic in menu_items, menu_categories, and sauces to store Blob-relative paths. Add BLOB_BASE_URL env var. Update resolveImageUrl() to prefix BLOB_BASE_URL. Update all seed files with full Blob paths. No DB migration needed. No admin upload UI.

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Menu images load from Vercel Blob (Priority: P1)

A visitor browsing the SUMO AYCE menu page sees dish images served from Vercel Blob Storage instead of local public/ assets. The dish photos, sauce images, and drink photos all render correctly. Items without photos (wings, boneless) show no image — same as before.

**Why this priority**: This is the core delivery goal. Without it, no image is served from Blob and the migration has zero effect. All other stories depend on this path working.

**Independent Test**: With `BLOB_BASE_URL` set to a valid Vercel Blob store URL and `file_name` values updated to Blob-relative paths in the DB, call `GET /api/v1/menu?type=ayce&modality=buffet` and verify that every dish with a non-null `file_name` returns an `imageUrl` that begins with the configured `BLOB_BASE_URL`.

**Acceptance Scenarios**:

1. **Given** `BLOB_BASE_URL=https://abc123.public.blob.vercel-storage.com` is set and a dish has `file_name='menu/ayce/mixed_yakimeshi.webp'` in the DB, **When** the menu API is called, **Then** the dish's `imageUrl` is `https://abc123.public.blob.vercel-storage.com/menu/ayce/mixed_yakimeshi.webp`.
2. **Given** a dish has `file_name=null` in the DB (e.g., Alitas, Boneless), **When** the menu API is called, **Then** the dish's `imageUrl` is `null`.
3. **Given** `BLOB_BASE_URL` has a trailing slash (edge case input), **When** the menu API resolves the URL, **Then** the resulting URL does not contain a double slash (`//`).
4. **Given** a sauce has `file_name='menu/sauces/bbq.webp'`, **When** the sauces are returned, **Then** the sauce's `imageUrl` is `https://abc123.public.blob.vercel-storage.com/menu/sauces/bbq.webp`.

---

### User Story 2 — Application refuses to start without BLOB_BASE_URL (Priority: P1)

A developer or CI runner tries to start the application without `BLOB_BASE_URL` set. The server fails immediately at startup with a clear error message identifying the missing variable — no request is ever processed in a misconfigured state.

**Why this priority**: Silent misconfiguration (serving `null` URLs or broken images without warning) is worse than a startup crash. Startup validation is the agreed pattern in this codebase (Article XIII of the Constitution).

**Independent Test**: Remove `BLOB_BASE_URL` from the environment, start the server, and confirm it exits immediately with an error that names `BLOB_BASE_URL` specifically.

**Acceptance Scenarios**:

1. **Given** `BLOB_BASE_URL` is absent from the environment, **When** the server starts, **Then** it exits with a non-zero code and prints a message containing `BLOB_BASE_URL`.
2. **Given** `BLOB_BASE_URL` is set to an empty string, **When** the server starts, **Then** it exits with a non-zero code and prints a message containing `BLOB_BASE_URL`.
3. **Given** all required environment variables including `BLOB_BASE_URL` are set, **When** the server starts, **Then** it starts successfully and accepts requests.

---

### User Story 3 — Re-seeding the database populates correct Blob paths (Priority: P2)

A developer runs `pnpm db:seed` and the `file_name` columns in `menu_items`, `menu_categories`, and `sauces` are populated with full Blob-relative paths (e.g., `menu/ayce/mixed_yakimeshi.webp`). No bare filenames remain.

**Why this priority**: The seeds are the ground-truth data for development and staging environments. If they store bare filenames, every developer environment would serve broken images after the migration.

**Independent Test**: Run `pnpm db:seed`, then query the DB and verify that every non-null `file_name` value in `menu_items` and `sauces` starts with `menu/` and contains no base URL or leading slash.

**Acceptance Scenarios**:

1. **Given** the seed files have been updated with Blob-relative paths, **When** `pnpm db:seed` is run, **Then** every non-null `file_name` in `menu_items` starts with `menu/` and is a valid relative path (no `https://`, no leading `/`).
2. **Given** AYCE menu items are seeded, **When** the DB is queried, **Then** AYCE items have `file_name` values prefixed with `menu/ayce/`.
3. **Given** à-la-carte items are seeded, **When** the DB is queried, **Then** à-la-carte items have `file_name` values prefixed with `menu/ala-carta/`.
4. **Given** sauce records are seeded, **When** the DB is queried, **Then** sauce `file_name` values are prefixed with `menu/sauces/`.
5. **Given** wings and boneless items (which have no image), **When** the DB is queried, **Then** their `file_name` is `null`.

---

### User Story 4 — New developers can configure and upload images via documented workflow (Priority: P3)

A developer or the restaurant client can follow `docs/harness/vercel-blob.md` to: (a) find `BLOB_BASE_URL` in the Vercel Dashboard, (b) upload a new image using the Vercel CLI, (c) update the `file_name` field in Neon directly. No code change is needed for routine image management.

**Why this priority**: Without clear documentation, the client cannot manage images independently, defeating the purpose of a CMS-free image workflow.

**Independent Test**: Follow the `docs/harness/vercel-blob.md` instructions step-by-step in a fresh environment and verify a new image becomes visible in the menu without code changes.

**Acceptance Scenarios**:

1. **Given** `docs/harness/vercel-blob.md` exists, **When** a developer reads it, **Then** they can find: the Blob path convention, the upload command, the DB update procedure, and the env var setup — all in one document.
2. **Given** the document describes the path convention, **When** a developer uploads an image, **Then** the path they choose follows the `menu/<category>/<filename>` format and works without code changes.

---

### Edge Cases

- What happens when `BLOB_BASE_URL` has a trailing slash? The URL resolver must strip or absorb it to avoid double-slash URLs (e.g., `https://blob.example.com//menu/ayce/wings.jpg`).
- What happens when a `file_name` has a leading slash? The resolver must strip it or document that leading slashes are prohibited in the path convention.
- What happens when the Vercel Blob store is unreachable? The API returns the constructed URL (it does not validate reachability) — the browser handles the broken image gracefully.
- What happens when `BLOB_BASE_URL` is set but a `file_name` contains the full URL already? The path convention forbids storing full URLs; this is a data-entry error documented in the Blob guide.

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST resolve menu image URLs by concatenating `BLOB_BASE_URL` with the Blob-relative path stored in `file_name`, separated by a single `/`.
- **FR-002**: The system MUST return `null` for `imageUrl` when a menu item's `file_name` is `null`.
- **FR-003**: The URL resolution logic MUST NOT contain any folder-routing logic based on `locationType`, `categoryKey`, or `includedInAyce` — the path stored in `file_name` is self-contained.
- **FR-004**: The system MUST validate `BLOB_BASE_URL` at startup and refuse to start if the variable is absent or empty.
- **FR-005**: `BLOB_BASE_URL` MUST be documented in `.env.example` with an inline comment explaining where to obtain the value (Vercel Dashboard → Storage → Blob store → Public URL).
- **FR-006**: All seed files MUST store `file_name` as a Blob-relative path (e.g., `menu/ayce/mixed_yakimeshi.webp`) — no bare filenames, no base URLs, no leading slashes.
- **FR-007**: The path convention for Blob storage MUST mirror the existing `public/menu/` folder structure: `menu/ayce/`, `menu/ala-carta/`, `menu/express/`, `menu/kids/`, `menu/desserts/`, `menu/drinks/`, `menu/sauces/`.
- **FR-008**: The documentation file `docs/harness/vercel-blob.md` MUST cover: Blob path conventions, upload workflow (Vercel Dashboard and CLI), DB update procedure (psql / Drizzle Studio), and `BLOB_BASE_URL` configuration for development and production.
- **FR-009**: No DB migration file MUST be added — the `file_name` column shape (text nullable) is unchanged; only stored values change via seed updates.
- **FR-010**: No new npm packages MUST be added — image URLs are plain HTTPS strings assembled at runtime.

### Key Entities

- **Blob-relative path**: A string in the format `menu/<folder>/<filename>` (no leading slash, no base URL). Stored in `file_name` on `menu_items`, `menu_categories`, and `sauces`. Example: `menu/ayce/mixed_yakimeshi.webp`.
- **BLOB_BASE_URL**: A runtime environment variable containing the public base URL of the Vercel Blob store (e.g., `https://abc123.public.blob.vercel-storage.com`). Never stored in the DB.
- **Absolute image URL**: The result of joining `BLOB_BASE_URL` + `/` + Blob-relative path. Returned in API responses as `imageUrl`. Example: `https://abc123.public.blob.vercel-storage.com/menu/ayce/mixed_yakimeshi.webp`.

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Every menu item with a non-null `file_name` returns an `imageUrl` that is a fully-qualified HTTPS URL beginning with the configured `BLOB_BASE_URL` — zero items with a partial or local path.
- **SC-002**: The server fails to start (non-zero exit code, human-readable error) within 1 second of launch if `BLOB_BASE_URL` is missing or empty.
- **SC-003**: After running the seed script, 100% of non-null `file_name` values in `menu_items` and `sauces` match the pattern `^menu/[a-z-]+/.+\.(webp|jpg|png|svg)$` — no bare filenames remain.
- **SC-004**: The `resolveImageUrl` function has a unit test with 100% branch coverage (non-null path → full URL, null → null, trailing-slash normalization).
- **SC-005**: `docs/harness/vercel-blob.md` is self-contained — a developer who has never worked on the project can upload a new image and see it on the menu without asking for help.

---

## Assumptions

- The Vercel Blob store is already provisioned for the project (or will be provisioned by the client before going live). This spec does not cover Blob store creation.
- Images currently in `public/menu/` will be uploaded to Vercel Blob by the client manually, following the upload workflow documented in `docs/harness/vercel-blob.md`. This upload is out of scope for this feature.
- The `file_name` column in `menu_categories` is not populated in the current seed (categories have no images). This remains null after the migration; the column exists for future use.
- `BLOB_BASE_URL` is treated as a required server-side environment variable. It is not exposed to the browser (not prefixed with `NUXT_PUBLIC_`), since image URLs are assembled server-side in the API handler.
- The URL format returned by the API is a plain HTTPS string. The frontend renders it as a standard `<img src>` attribute — no Vercel Blob SDK is needed on the client.
- Seeds for `drinkGroups` and `drinkSubGroups` do not have `file_name` fields and are unaffected.
- The path convention (`menu/<folder>/`) exactly mirrors the existing `public/menu/` subfolder names: `ayce`, `ala-carta`, `express`, `kids`, `desserts`, `drinks`. A new `sauces` subfolder is introduced for sauce images (currently stored as bare filenames in the seed).
- Trailing-slash normalization in `BLOB_BASE_URL` is handled at the point of URL assembly (the resolver strips a trailing slash from `BLOB_BASE_URL` if present), not at environment validation time.
