# Implementation Plan: Vercel Blob — Menu Image Storage

**Branch**: `chore/018-vercel-blob-images` | **Date**: 2026-06-29 | **Spec**: [spec.md](./spec.md)  
**Input**: Feature specification from `specs/018-vercel-blob-images/spec.md`

## Summary

Migrate menu image delivery from static `public/` assets to Vercel Blob Storage by changing
the semantic of the existing `file_name` column (no DB migration) and updating
`resolveImageUrl()` to prefix a new `BLOB_BASE_URL` env var. All seed files are updated to
store full Blob-relative paths. No new packages, no admin UI, no new routes.

## Technical Context

**Language/Version**: TypeScript 5.x / Node 20 (Vercel runtime)  
**Primary Dependencies**: Zod (env validation), Drizzle ORM (seed runner), h3/Nitro (server route)  
**Storage**: Neon PostgreSQL — existing `file_name` column (text nullable) in `menu_items`, `menu_categories`, `sauces`. No migration.  
**Testing**: Vitest (already configured for `server/**`)  
**Target Platform**: Vercel edge/serverless (Nitro)  
**Project Type**: Web service (Nuxt 4 server route modification)  
**Performance Goals**: No new latency — URL assembly is a string concat at handler time, not an extra network call.  
**Constraints**: No new npm packages (FR-010). No DB migration (FR-009). `BLOB_BASE_URL` server-side only (not `NUXT_PUBLIC_`).  
**Scale/Scope**: Touches 8 seed files + 1 server handler + 1 env util + 1 new doc.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Article | Rule | Status |
|---------|------|--------|
| I — Code Organization | Change stays within `server/api/v1/menu/` and `server/utils/env.ts`. No new feature folder needed (not a new feature slice). | ✅ Pass |
| II — TypeScript strict | `resolveImageUrl` simplified to 2–3 lines, no `any`, Zod schema typed via `z.infer`. | ✅ Pass |
| III — Architecture | Backend-only change. No ISR/SSG touched. Neon not involved (seed changes only run locally/CI). | ✅ Pass |
| IV — Testing | `resolveImageUrl` MUST have unit test (SC-004: 100% branch coverage). Existing menu route test expanded. | ✅ Pass (tests required) |
| VIII — Clean Code | New `resolveImageUrl` is ≤5 lines. Removes dead routing logic. | ✅ Pass |
| X — KISS | Pure string concatenation, zero abstraction. No library added. | ✅ Pass |
| XIII — Env Validation | `BLOB_BASE_URL` added to `server/utils/env.ts` Zod schema as `z.string().url()`. | ✅ Pass |

**Post-design re-check**: N/A — no new entities or contracts introduced.

## Phase 0: Research

All technical decisions are resolved from existing codebase patterns. No NEEDS CLARIFICATION.

### Decision log

| Decision | Choice | Rationale |
|----------|--------|-----------|
| How to add `BLOB_BASE_URL` | Add to `server/utils/env.ts` Zod schema as `z.string().url().min(1)` | Matches the established pattern for all other env vars; validated at first use (lazy singleton). |
| How `BLOB_BASE_URL` is obtained | Vercel Dashboard → Storage → select the Blob store → the **Public URL** field is the base. Set it in `.env.local` for dev and in Vercel project environment variables for production. Example value: `https://abc123xyz.public.blob.vercel-storage.com` | The base URL is unique per Blob store and never changes; it is safe to commit to `.env.example` as a placeholder but must never contain the real token. |
| How the full image URL is constructed | `resolveImageUrl` concatenates `BLOB_BASE_URL` (stripped of trailing slash) + `'/'` + the `file_name` path stored in DB. Example: `BLOB_BASE_URL=https://abc.public.blob.vercel-storage.com` + `file_name='menu/ayce/wings.webp'` → `https://abc.public.blob.vercel-storage.com/menu/ayce/wings.webp` | The `file_name` column stores the path relative to the blob root, never the full URL. The base is injected at runtime so the client can change the Blob store without a DB migration. |
| Where to strip trailing slash | In `resolveImageUrl`, before concatenation: `baseUrl.replace(/\/$/, '') + '/' + filePath` | Single point of normalization; avoids requiring perfect env var formatting from the client. |
| Blob path convention | Mirror existing `public/menu/` subfolders exactly: `menu/ayce/`, `menu/ala-carta/`, `menu/express/`, `menu/kids/`, `menu/desserts/`, `menu/drinks/`, `menu/sauces/` | Zero new concepts for the client; paths are visually obvious. |
| `resolveImageUrl` signature | Remove `locationType`, `categoryKey`, `includedInAyce` params. New signature: `(filePath: string \| null) => string \| null` | Path is now self-contained in `file_name`. Old params were only needed to compute the folder — that folder is now part of the stored value. |
| `BLOB_BASE_URL` server-side only | Do NOT use `NUXT_PUBLIC_` prefix | Image URLs are assembled server-side in the API handler and returned as strings. The browser only sees the final URL. No Vercel Blob SDK needed client-side. |
| Sauce images folder | Introduce `menu/sauces/` (new subfolder) | No `public/menu/sauces/` exists today because sauces had bare filenames. Consistent with the `menu/<category>/` convention. |
| `menu_categories.file_name` | Leave null in seeds | Category images are not used anywhere in the current UI. Column exists for future use; leaving null is the correct no-op. |

## Phase 1: Design

No new data entities and no external interface contracts are introduced. The API response
shape (`imageUrl: string | null`) is unchanged — only the value changes from a local path to a
Blob URL.

### No data-model.md required

Existing schema is unchanged (`file_name text nullable`). Column semantics shift but types do not.

### No contracts/ required

`GET /api/v1/menu` response shape is unchanged. `imageUrl` remains `string | null`.

### No quickstart.md required

There is no new user-facing flow. The test scenario is documented directly in `spec.md` US1 Independent Test.

## Project Structure

### Documentation (this feature)

```text
specs/018-vercel-blob-images/
├── plan.md              ← this file
├── spec.md              ← feature spec
└── tasks.md             ← task list (generated by /speckit.tasks)
```

### Source Code (files changed by this feature)

```text
server/
  utils/
    env.ts                        ← add BLOB_BASE_URL to Zod schema
  api/v1/menu/
    index.get.ts                  ← update resolveImageUrl() + remove dead params
  db/seeds/
    ayceMenu.ts                   ← update all fileName to 'menu/ayce/<file>'
    alaCarta.ts                   ← update all fileName to 'menu/ala-carta/<file>'
    expressMenu.ts                ← update all fileName to 'menu/express/<file>'
    kidsMenu.ts                   ← update all fileName to 'menu/kids/<file>'
    desserts.ts                   ← update all fileName to 'menu/desserts/<file>'
    drinks.ts                     ← update fileName if any present
    sauces.ts                     ← update all fileName to 'menu/sauces/<file>'
tests/
  server/
    api/v1/menu/
      resolveImageUrl.test.ts     ← new unit test (100% branch coverage, SC-004)
.env.example                      ← add BLOB_BASE_URL entry with comment
docs/harness/
  vercel-blob.md                  ← new: upload workflow + path conventions
```

## Complexity Tracking

> No constitution violations — table not needed.
