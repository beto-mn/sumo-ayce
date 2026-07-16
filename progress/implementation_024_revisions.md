# Revisions to feature 024 (menu-image-refresh-express-branding)

Client-requested fixes applied on top of the already-reviewed/APPROVED (still uncommitted)
feature 024 work, per direct instruction (not a spec/plan/tasks change — both fixes are
targeted corrections to already-approved work, so `tasks.md`/`spec.md` were left untouched).

## Fix 1 — Watermark seam behind the menu category chips

**Change**: `app/features/menu/components/MenuShell.vue` line 158 — removed the `bg-bg` class
from the category-chips wrapper `<div>`, leaving `class="w-full py-3"`. That opaque `bg-bg`
was painting a solid-color band over the chip row, occluding the `bg-bg bg-watermark bg-repeat`
combination already applied on the root wrapper in `app/layouts/default.vue`. With `bg-bg`
removed, the layout's shared background (color + watermark pattern) shows through
continuously in that section, same as the rest of the page.

**Test check**: grepped `app/features/menu/components/MenuShell.spec.ts` for `bg-bg`/
`bg-watermark` — no hits, so no existing test asserted on that class; none needed updating.

**Visual verification**: started `pnpm dev` (landed on `localhost:3001`, port 3000 was already
occupied by an unrelated pre-existing process), navigated to `/menu` with a category selected
(AYCE → Entradas, the default landing state), and captured a full-page headless-Chrome
screenshot (`Google Chrome.app --headless --disable-gpu --screenshot=... --window-size=1440,1400
--virtual-time-budget=8000`). Confirmed visually: the pop-art watermark pattern is now
continuous across the chip-row band and the rest of the page — no seam, no opaque band. Chips
themselves remain individually bordered/pill-filled components (bg-panel/bg-accent per chip),
so their legibility/contrast is unaffected by removing the wrapper's background.

## Fix 2 — Revert the Kids AYCE collage image

**Changes**:
- `server/db/seeds/kidsMenu.ts`: `fileName` for the `nameEs: 'All You Can Eat Kids'` entry
  reverted from `'menu/kids/all_you_can_eat_kids.webp'` back to `null`. Confirmed via
  `git diff` that this is the only change to the file (it now exactly matches the committed
  `HEAD` version, since HEAD predates feature 024's uncommitted work — `git status` shows zero
  diff for this file). Every other Kids item's `fileName` (Kid Burger, Sushi Kids, Chicken Kids,
  Mac & Cheese, both Kawaii pizzas) untouched.
- `tests/db/menu-seeds.test.ts`: reverted the "All You Can Eat Kids" price/image assertion back
  to `expect(ayce?.fileName).toBeNull()` (test title also reverted to "...with no image"). No
  other assertion in the file touched.
- Reseeded the `kids` category against the project's configured `DATABASE_URL` by running
  `seedKidsMenu()` directly (same approach as the original T005): created a temporary
  `server/db/_reseed-kids-temp.ts` importing and invoking `seedKidsMenu()`, ran it via
  `pnpm tsx --env-file-if-exists=.env.local --env-file-if-exists=.env server/db/_reseed-kids-temp.ts`
  (output: `✓ 7 kids menu items inserted`), then deleted the temp script (confirmed via
  `git status` that no trace of it remains).

**DB verification**: ran a direct `psql` query against `DATABASE_URL` (read from `.env`):
```sql
SELECT mi.name_es, mi.file_name, mi.price, mi.included_in_ayce
FROM menu_items mi JOIN menu_categories mc ON mi.category_id = mc.id
WHERE mc.key='kids' ORDER BY mi.display_order;
```
Result: "All You Can Eat Kids" row has `file_name` = NULL (empty column, price 179.00,
included_in_ayce = t); all 6 other Kids rows unchanged with their pre-existing `file_name`
values (`kid_burger.webp`, `sushi_kids.webp`, `chicken_kids.webp`, `mac_&_cheese.webp`,
`kawaii_cheese_pizza.webp`, `kawai_pepperoni_pizza.webp`).

**End-to-end verification**: started `pnpm dev`, curled `GET /api/v1/menu?type=kids`. Response
confirms `"All You Can Eat Kids"` now has `"imageUrl": null`; every other Kids item, price, and
description unchanged (spot-checked the raw JSON payload).

**Orphaned Blob object**: per instruction, did NOT delete the already-uploaded Vercel Blob
object at `menu/kids/all_you_can_eat_kids.webp` — no delete tooling exists in
`scripts/replace-blob-images.ts` and building one for a single orphaned object is out of scope.
It remains in Blob storage, simply no longer referenced by any menu item.

**Spec assets untouched**: did not touch
`specs/024-menu-image-refresh-express-branding/assets/output/all_you_can_eat_kids.webp` or the
source photos in `assets/source/` — left as historical spec-folder artifacts (confirmed via
`git status`, both still present/untracked as before).

## Verification suite (after both fixes)

- `pnpm check` → Biome clean, 373 files, no fixes applied.
- `pnpm typecheck` → `nuxt typecheck` clean.
- `pnpm test` → 957/957 tests passed (114 files) — same count as the pre-revision APPROVED
  state; no regressions, no new failures.
- `./init.sh` → **exit 0**. All steps green: harness files OK, `feature_list.json` valid with 0
  features `in_progress` (feature 024 is still the active branch's target but not yet flagged
  `in_progress` in this repo state), Biome clean, typecheck clean, Vitest 957/957 passed,
  Storybook build OK.

## Working tree state

Left as-is per instruction — nothing committed. `git status --short` shows exactly the
pre-existing feature 024 diff (uncommitted) plus these two additional edits
(`app/features/menu/components/MenuShell.vue`, `server/db/seeds/kidsMenu.ts`,
`tests/db/menu-seeds.test.ts`); no stray temp files, no leftover dev-server processes.

## Known issues / TODOs

None. Both fixes are complete, verified, and green across `pnpm check`/`typecheck`/`test`/
`init.sh`.
