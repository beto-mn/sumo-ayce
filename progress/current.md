# Current session

> Last closed: **012 — promotions-page** (`done`, 2026-06-22).

## State
- Backlog: 001–010 → `done`. 011 → `pending`. 012 → `done`. 013 → `done`. 014–015 → `pending`. 016 → `done`.
- DB: Neon PostgreSQL. Migrations 0008–0011 applied to production. Tables: `menu_categories`, `menu_items`, `sauces`.
- Tests: 488 passed (78 test files).

## Feature closed: 012 — promotions-page

**Branch**: `feat/017-promotions-page`
**Route**: `/promotions` (ISR 60 s)

### What was delivered
- `server/api/v1/content/promotions.get.ts` extended with `?all=1` (no home filter, no 3-cap)
- `app/features/promotions/components/PromotionCard.vue` — text-only card, click opens lightbox
- `app/features/promotions/components/PromotionsGrid.vue` — responsive 1→2→3 col grid
- `app/features/promotions/composables/usePromotions.ts` — lightbox state
- `app/pages/promotions.vue` — thin orchestrator, ISR, SEO meta
- `docs/business/promotions-seed.json` — 6 promotions extracted from flyers, ready for WP

### Tests added
- `promotions.get.test.ts` +4 (server `?all=1` path)
- `PromotionCard.spec.ts` 17 tests
- `PromotionsGrid.spec.ts` 6 tests
- `usePromotions.spec.ts` 4 tests
- `promotions.spec.ts` (page) 6 tests

## Next step
- Feature **011 — menu-page** (`pending`, `sdd: true`) — next in sequence. Requires spec phase.
- Note: feature 011 sources from DB (tables added in 016), not WordPress CPT.
