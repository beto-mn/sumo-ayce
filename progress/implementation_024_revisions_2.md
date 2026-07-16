# Revision 2 to feature 024 (menu-image-refresh-express-branding)

Client-provided replacement photo for the "All You Can Eat Kids" menu item, applied
on top of `progress/implementation_024_revisions.md` (which had reverted the item's
`fileName` to `null` after the client disliked the original 3-photo collage).

## Source photo assessment

`specs/024-menu-image-refresh-express-branding/assets/source/AYCE.webp` (33,710
bytes, verified present) is a single illustration — a cartoon kid figurine dipping a
french fry into ketchup, transparent/alpha background, 235×400px (portrait).

Compared against the outgoing collage (`assets/output/all_you_can_eat_kids.webp`,
1200×900, 75.7 KB, landscape 4:3): different aspect ratio and much smaller
resolution, but this is NOT a defect — `app/features/menu/components/MenuDishCard.vue`
renders dish images with `object-contain` (not `object-cover`), so a portrait,
transparent-background illustration fits inside the card without cropping, letterboxed
cleanly. 33.7 KB is well within the size range of other Kids images already in Blob.
No re-encoding or resizing was needed; did a straight copy, content/crop untouched.

## Changes

- **`specs/024-menu-image-refresh-express-branding/assets/output/all_you_can_eat_kids.webp`**
  — replaced (straight copy of `assets/source/AYCE.webp`, no re-encoding).
- **`server/db/seeds/kidsMenu.ts`** — `fileName` for `nameEs: 'All You Can Eat Kids'`
  set back to `'menu/kids/all_you_can_eat_kids.webp'`. Confirmed via `git diff` that no
  other Kids item's `fileName` was touched.
- **`tests/db/menu-seeds.test.ts`** — reverted the assertion for the same item: test
  title changed from `'prices the All You Can Eat Kids item at $179 with no image'` to
  `'prices the All You Can Eat Kids item at $179 with the kids image asset'`, and
  `expect(ayce?.fileName).toBeNull()` → `expect(ayce?.fileName).toBe('menu/kids/all_you_can_eat_kids.webp')`.
  (Note: the exact wording of the very first, pre-revision feature-24 pass was never
  committed to git history, so the title was reconstructed to accurately describe the
  current asset — it no longer says "collage" since the replacement is a single
  illustration, not a 3-panel collage.) No other assertion in the file touched.
- **`server/api/v1/menu/resolveImageUrl.ts`** — bumped `MENU_IMAGE_VERSION` from
  `'2026-07-14-1'` to `'2026-07-15-1'`. This was NOT explicitly listed in the task
  steps but is required by the module's own documented contract: this upload
  overwrites bytes in place at the exact same Blob path
  (`menu/kids/all_you_can_eat_kids.webp`) that was already serving the old collage
  with a 30-day `max-age` cache-control header, unlike the original feature-24 pass
  (net-new image, nothing to bust). Without the bump, browsers/CDN with the old
  collage cached would keep serving stale bytes. No test hardcodes the version string
  (`tests/server/api/v1/menu/resolveImageUrl.test.ts` references the exported
  constant dynamically), so no test changes were needed for this.
- Reseeded the `kids` category: created a temporary `server/db/_reseed-kids-temp.ts`
  invoking `seedKidsMenu()` directly, ran it via
  `pnpm tsx --env-file-if-exists=.env.local --env-file-if-exists=.env server/db/_reseed-kids-temp.ts`
  (output: `✓ 7 kids menu items inserted`), then deleted the temp script (confirmed
  via `git status` — no trace remains).

## Blob upload

Created a dedicated temp folder `specs/024-menu-image-refresh-express-branding/assets/output/blob-src/`
containing only `all_you_can_eat_kids.webp`, then ran:
```
pnpm tsx --env-file-if-exists=.env scripts/replace-blob-images.ts --src specs/024-menu-image-refresh-express-branding/assets/output/blob-src
```
Dry run: `Local webp: 1 | mapped: 1 | skipped: 0 | UNMATCHED: 0`, mapped to
`menu/kids/all_you_can_eat_kids.webp`. Re-ran with `--apply`: `✓ all_you_can_eat_kids.webp → menu/kids/all_you_can_eat_kids.webp`,
`Uploaded 1 blob objects across 1 images.` Removed the temp `blob-src/` folder
afterward (confirmed absent via `ls`/`git status`).

## Verification

- **DB**: direct `psql` query against `DATABASE_URL` confirms `menu_items` row for
  "All You Can Eat Kids" now has `file_name = 'menu/kids/all_you_can_eat_kids.webp'`,
  price 179.00, `included_in_ayce = t`; all 6 other Kids rows unchanged
  (`kid_burger.webp`, `sushi_kids.webp`, `chicken_kids.webp`, `mac_&_cheese.webp`,
  `kawaii_cheese_pizza.webp`, `kawai_pepperoni_pizza.webp`).
- **Blob content**: `curl`'d the resolved `imageUrl`
  (`https://uerqyneaicbcguo1.public.blob.vercel-storage.com/menu/kids/all_you_can_eat_kids.webp?v=2026-07-15-1`)
  and downloaded it — 33,710 bytes, 235×400px, byte-identical to the new source
  photo. Confirms the overwrite replaced the old collage bytes at that path (there is
  no separate delete step in `replace-blob-images.ts`; `put()` uses
  `allowOverwrite: true` on the same path, so this single upload both replaced and
  placed the new photo).
- **End-to-end**: started `pnpm dev`, curled `GET /api/v1/menu?type=kids`. "All You
  Can Eat Kids" now shows `imageUrl` resolving to the Blob URL above (with the bumped
  `?v=2026-07-15-1` cache-busting param — applied sitewide to every menu image URL,
  as expected since the version is a single shared constant). Every other Kids
  item/price/description spot-checked unchanged. Dev server stopped afterward.

## Verification suite

- `pnpm check` → Biome clean, 373 files, no fixes applied.
- `pnpm typecheck` → `nuxt typecheck` clean.
- `pnpm test` → **957/957 tests passed** (114 files) — same count as the original
  APPROVED feature-24 state.
- `./init.sh` → **exit 0**. All steps green: harness files OK, `feature_list.json`
  valid (0 features `in_progress`), Biome clean, typecheck clean, Vitest 957/957
  passed, Storybook build OK.

## Working tree state

Left as-is per instruction — nothing committed. `git status --short` shows the
pre-existing feature 024 diff (uncommitted) plus this revision's edits
(`server/db/seeds/kidsMenu.ts`, `tests/db/menu-seeds.test.ts`,
`server/api/v1/menu/resolveImageUrl.ts`) and the replaced
`assets/output/all_you_can_eat_kids.webp` binary; no stray temp files
(`_reseed-kids-temp.ts`, `blob-src/`), no leftover dev-server processes.

## Known issues / TODOs

None.
