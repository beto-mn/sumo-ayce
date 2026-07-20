# Current session

> Last closed: **029 — alacarta-combo-notes-menu-copy** (`done`, 2026-07-20).
> Includes the same-day post-approval hotfix delta (double-period bug fix +
> Ramen XL extra-protein simplification), delta-reviewed and **APPROVED** —
> full history moved to `progress/history.md`'s "CLOSED: 029" entry.

## State
- Backlog: 001–014, 016–024, 027, 028, 029 → `done`. 015, 025, 026 → `pending`.
  No feature currently `in_progress`/`reviewing`.
- DB: Neon PostgreSQL (`sumo_ayce_db`, `.env` `DATABASE_URL`) is the production
  source of truth. Local Docker dev DB (`sumo_ayce`) was reset and fully
  reseeded during 029's implementation — migrated through `0034`, no longer
  empty.
- Tests: 1034 passed (115 test files) as of 029's close. `./init.sh` green
  (lint + typecheck + tests + Storybook build).

## ⚠️ Discovered tooling bug (not fixed): `.env.local` does not override `.env` for `pnpm db:*` commands

`drizzle-kit`'s bundled `dotenv` loads `.env` (which has `DATABASE_URL`
pointing at the real Neon dev DB) **before** `drizzle.config.ts`'s
`process.loadEnvFile('.env.local')` ever runs. Node's `loadEnvFile` does
**not** override an already-set `process.env` var, so `.env.local` is
effectively a no-op for `pnpm db:generate`/`pnpm db:migrate` whenever `.env`
is also present with its own `DATABASE_URL` — despite `.env.local`'s
existence being the documented mechanism (`specs/001-db-schema-drizzle`) for
pointing local dev commands at the local Docker DB instead of Neon.
**CORRECTION (2026-07-20, feature 029 revisit): `pnpm db:seed` is NOT
unaffected.** A prior note here claimed `.env.local` wins because it's listed
first in `tsx --env-file-if-exists=.env.local --env-file-if-exists=.env`;
that assumption was wrong and was disproved by a zero-risk empirical test
with synthetic dummy files (`node --env-file-if-exists=a.env
--env-file-if-exists=b.env`, both defining the same key): **Node applies
later `--env-file`/`--env-file-if-exists` flags on top of earlier ones for
the same key — last-listed wins**, not first-listed. Since `.env` is listed
*second* in the `db:seed` script, its Neon `DATABASE_URL` silently overrides
`.env.local`'s `localhost:5433` value, so plain `pnpm db:seed` (with no
override) resolves to **Neon**, not the local Docker DB. **Workaround**:
explicit `DATABASE_URL=postgresql://sumo:sumo@localhost:5433/sumo_ayce`
prefix on `pnpm db:migrate`/`pnpm db:seed` invocations, which wins over both
files since it's set (in the shell) before either loader runs. **Not fixed** —
flag for a future infra/chore ticket (swap the flag order in the `db:seed`
script, or read `.env.local` inside `drizzle.config.ts`/`seed.ts` last).
Confirmed still present as of 2026-07-20 (`drizzle.config.ts` unchanged since
commit `7f9d170`, both `.env` and `.env.local` still exist on disk).

## Follow-up not yet actioned
- **T048 (feature 027)**: Lighthouse spot-check of `/`, `/menu`, `/promotions`
  was not run (no Chrome/Chromium tooling in the implementer/reviewer
  sandbox). Non-blocking — feature is `done`.
- **Pre-existing seed-pipeline FK bug** (introduced by feature 027, surfaced
  during 028's Neon reconciliation): `resetDrinkChildren()` in
  `server/db/seeds/drinkGroups.ts` tries to delete `menu_items` under a
  drink category before option groups referencing them are cleared, causing
  a FK violation on any full `pnpm db:seed` re-run against a DB with live
  option groups. Confirmed dormant during 029's reseed (DB was freshly
  emptied first, so no live option groups existed to conflict) — still
  unfixed in the general case.

## Pending
- Feature **015 — loyalty-portal** (`pending`, `sdd: true`).
- Feature **025 — menu-page-lighthouse-perf-fix** (`pending`, `sdd: true`).
- Feature **026 — google-reviews-and-branches-ux** (`pending`, `sdd: true`).
