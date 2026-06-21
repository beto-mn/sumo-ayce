# Current session

> Last closed: **016 — menu-schema-db** (`done`, 2026-06-20). Next: **011 — menu-page**.

## State
- Backlog: 001–010 → `done`. 011–015 → `pending`. 016 → `done`.
- Branch `chore/chore/016-menu-schema-db` holds all feature 016 work (ready to merge).
- DB: Neon PostgreSQL. Migrations 0008–0011 applied to production. Tables: `menu_categories`, `menu_items`, `sauces`.
- Stash cleared (stash was consumed during implementation).

## Next step
- Next feature is **011 — menu-page** (`pending`, `sdd: true`).
- Feature 011 description targets WordPress CPT `menu_item`, but confirmed sourcing is DB (tables added in 016). Reconcile 011 spec to DB sourcing at spec phase.
- Per SDD flow: `leader → spec_author (spec phase) → HUMAN approval gate → implementer → reviewer`.
