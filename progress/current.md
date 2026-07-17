# Current session

> Last closed: **027 — promo-flip-menu-card-tweaks** (`done`, 2026-07-16 — see progress/history.md).

## State
- Backlog: 001–014, 016–024, 027 → `done`. 015, 025, 026 → `pending`.
- DB: Neon PostgreSQL. Latest migrations: `0030_add_menu_item_highlight_background.sql`,
  `0031_add_menu_item_option_groups.sql` (both additive; not yet confirmed applied to production —
  coordinate with the human before running against Neon).
- Tests: 1002 passed (115 test files). `./init.sh` green.

## Follow-up not yet actioned
- **T048 (feature 027)**: Lighthouse spot-check of `/`, `/menu`, `/promotions` was not run (no
  Chrome/Chromium tooling in the implementer/reviewer sandbox). A human with real browser tooling
  should confirm no perf regression from the new option-groups query before considering SC-007
  fully closed. Non-blocking — feature is `done`.
- **Production migration/seed steps for feature 027**: `0030`/`0031` and the new
  `menu_item_option_groups`/`menu_item_option_choices` seed data (Ramen XL + Vaso Sumo) have not
  been confirmed applied to production Neon. Do NOT run against production until coordinated with
  the human.

## Pending
- Feature **015 — loyalty-portal** (`pending`, `sdd: true`).
- Feature **025 — menu-page-lighthouse-perf-fix** (`pending`, `sdd: true`).
- Feature **026 — google-reviews-and-branches-ux** (`pending`, `sdd: true`).
