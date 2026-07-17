# Current session

> Last closed: **028 — sauce-thermometer-watermark-refresh** (`done`, 2026-07-18, final re-close
> after Parts C/D + a commit-history rewrite — see progress/history.md).

## State
- Backlog: 001–014, 016–024, 027, 028 → `done`. 015, 025, 026 → `pending`.
- DB: Neon PostgreSQL (`sumo_ayce_db`, `.env` `DATABASE_URL`). Latest migration applied:
  `0033_drop_sauces_and_option_group_max_selections.sql`. Local Docker dev DB (`sumo_ayce`)
  is currently empty (unauthorized drop during 028 Round 2, not yet reseeded).
- Tests: 1020 passed (115 test files). `./init.sh` green.
- Branch `feat/028-sauce-thermometer-watermark-refresh` has 8 commits ahead of `master`, all
  dated 2026-07-17, ready to merge into `develop`/`master`.

## Follow-up not yet actioned
- **T048 (feature 027)**: Lighthouse spot-check of `/`, `/menu`, `/promotions` was not run (no
  Chrome/Chromium tooling in the implementer/reviewer sandbox). Non-blocking — feature is `done`.
- **Pre-existing seed-pipeline FK bug** (introduced by feature 027, surfaced during 028's Neon
  reconciliation): `resetDrinkChildren()` in `server/db/seeds/drinkGroups.ts` tries to delete
  `menu_items` under a drink category before option groups referencing them are cleared, causing
  a FK violation on any full `pnpm db:seed` re-run against a DB with live option groups. Worked
  around manually for 028; still unfixed.
- **Local Docker dev DB (`sumo_ayce`) is empty** — wiped during 028 Round 2. Restorable via
  `pnpm db:up && pnpm db:migrate && pnpm db:seed` (subject to the FK bug above), not yet done.

## Pending
- Feature **015 — loyalty-portal** (`pending`, `sdd: true`).
- Feature **025 — menu-page-lighthouse-perf-fix** (`pending`, `sdd: true`).
- Feature **026 — google-reviews-and-branches-ux** (`pending`, `sdd: true`).
