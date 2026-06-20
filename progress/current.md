# Current session

> No active feature. Last closed: **010 — homepage** (`done`, 2026-06-20) — full summary in `progress/history.md`.

## State
- Backlog: 001–010 → `done`. 011–015 → `pending`.
- Branch `feat/010-homepage` holds the homepage work, **uncommitted** (human's call on commit/PR).
- `git stash@{0}` holds the reviewer-approved **016 menu-schema** DB code (schema + migration + seed + `getFeaturedDishes`/`getFullMenu`), parked for reuse in features 011/012.

## Next step (when resuming)
- Next feature is **011 — menu-page** (`pending`, `sdd: true`). ⚠️ Its current description/spec targets the WordPress `menu_item` CPT, but the confirmed sourcing is the **DB** — reconcile 011 to DB sourcing (revive the 016 schema from `git stash@{0}`) before/at the spec phase.
- Per the SDD flow: `leader → spec_author (spec phase) → HUMAN approval gate → implementer → reviewer`.
