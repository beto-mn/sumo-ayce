# Quickstart — Menu Chip / DB Drift Guard (023)

## Verify the bug (before the fix)

1. On `main`/pre-fix, pick a curated category — e.g. `sandwiches` (member of
   `AYCE_BUFFET_SET` only).
2. In `server/db/seeds/menuCategories.ts` (or directly in the Neon content used by your local
   env), deactivate/remove the `sandwiches` category or all of its `menu_items` rows.
3. Reload `/menu?type=ayce&modality=buffet`.
4. Observe: the "Sándwiches" chip still renders. Clicking it shows an empty section (or, if the
   category itself is missing from `FullMenuResult.categories`, the chip label falls back to
   the raw key `sandwiches` instead of a translated label).

## Verify the fix (User Story 1 — runtime guard)

1. Apply the same DB change as above (deactivate/remove a curated category or drink group).
2. Reload the affected view.
3. Confirm: the chip for the missing category/group no longer renders; the remaining chips
   keep their existing order and labels; if the removed key was the active/selected one, the
   view falls back to that set's default category instead of an empty section.
4. Re-activate the category; confirm the chip reappears on the next content read with no code
   change.

## Verify the fix (User Story 2 — regression test)

1. In `app/features/menu/menu-sets.ts`, temporarily add a bogus key (e.g. `'nonexistent_key'`)
   to any of the four curated sets, or rename an existing key so it no longer matches the seed.
2. Run the test suite: `npx vitest run tests/db/menu-seeds.test.ts`.
3. Confirm the new drift-regression test fails, and its failure message names the specific
   missing key and which curated set it belongs to.
4. Revert the change; confirm the test passes again.

## Run the full relevant test surface

```bash
npx vitest run app/features/menu/menu-sets.test.ts
npx vitest run app/features/menu/composables/useMenuFilters.test.ts
npx vitest run tests/db/menu-seeds.test.ts
```

## Storybook check (if `MenuShell.stories.ts` gains a filtered-chip-row variant)

```bash
npm run storybook
```

Navigate to the `MenuShell` story and confirm the new variant renders a chip row with one
fewer chip than the full curated set, with no visual regression to the remaining chips.

## Full quality gate (pre-commit/pre-push parity, Article IX)

```bash
npx biome check .
npx vue-tsc --noEmit
npx vitest run
```
