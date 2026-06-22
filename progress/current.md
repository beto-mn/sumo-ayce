# Current session

> Last closed: **016 — menu-schema-db** (`done`, 2026-06-20). Last spec written: **013 — branches-page** (`spec_ready`, 2026-06-21).

## State
- Backlog: 001–010 → `done`. 011–012 → `pending`. 013 → `spec_ready`. 014–015 → `pending`. 016 → `done`.
- DB: Neon PostgreSQL. Migrations 0008–0011 applied to production. Tables: `menu_categories`, `menu_items`, `sauces`.

## Pending human approval gate
- **013 — branches-page** spec is ready at `specs/013-branches-page/`. Human must read and approve before implementation.
- Key decisions in spec: backend delta adds `type`, `schedule`, `phone` to `GET /api/v1/branches` (no migration); Mapbox abstraction (`MapView`, `mapboxAdapter`) materialised per `docs/business/maps-strategy.md`; ISR 3600; client-side haversine sort; CP geocoding via Mapbox Geocoding API.

## Next step (after approval)
- Per SDD flow: HUMAN approves 013 → `leader` marks `in_progress` → `implementer` runs `tasks.md`.
- Feature 011 (menu-page, `pending`) is next in sequence after 013 is done or in parallel if capacity allows.
