# Review: menu-chip-db-drift-guard

**Status:** APPROVED

## Verifications
- Acceptance criteria covered by tests: 9/9 (US1 scenarios 1-5 -> `menu-sets.spec.ts` `filterAvailableKeys`/`resolveActiveKey` drift-guard tests + `useMenuFilters.test.ts` "drift guard (feature 023)" block; US2 scenarios 1-4 -> `tests/db/menu-seeds.test.ts` "menu-sets.ts curated keys match the active seed" block)
- Phase -1 Gates marked: all PASS/N-A in `plan.md`'s Constitution Check table, re-confirmed post-implementation ("Post-Phase 1 re-check" note)
- Tasks completed: 15/15 — `tasks.md` T001-T015 all `[x]`. T003's file-naming deviation (tests added to pre-existing `menu-sets.spec.ts` instead of a new `menu-sets.test.ts`) is documented inline with an explicit note; verified no `menu-sets.test.ts` file exists (no duplicate/competing test file) and coverage is equivalent (order preservation, drop-missing, never-adds-a-key, empty/full availableKeys, resolveActiveKey fallback — all present)
- `./init.sh`: exit 0 — Biome (358 files) OK, `vue-tsc --noEmit` OK, Vitest 918/918 passed (107 files), Storybook build OK
- CHECKPOINTS C1-C7: all OK (see detail below)

## Detail

### MenuShell.vue file-size fix (round-1 blocker #2)
- `wc -l app/features/menu/components/MenuShell.vue` = 197 lines (was 203) — under the Article VIII 200-line cap.
- Diffed against the pre-fix version: the only change is the `availableKeys` JSDoc trimmed from a multi-line block to a 2-line comment. No logic, props, computed, or template changes — no functional regression.
- Confirmed `availableKeys` is still built from `props.menuData.categories`/`.drinkGroups` keys and passed into `useMenuFilters(...)` exactly as before.

### tasks.md fix (round-1 blocker #1)
- All 15 tasks (T001-T015) now marked `[x]`.
- T003 carries an inline, reviewer-facing deviation note explaining the file-naming change; verified truthful (no `app/features/menu/menu-sets.test.ts` exists; the described coverage is genuinely present in `menu-sets.spec.ts`).

### Full re-verification (not just the 2 prior items)
- `spec.md`: no `[NEEDS CLARIFICATION]` markers. FR-001..FR-012 all traced to at least one test.
- `plan.md`: Constitution Check table — no violations, Complexity Tracking empty, both gates re-affirmed post-implementation.
- `constitution.md`: Article I (feature-folder boundaries, no cross-feature imports) — all runtime changes confined to `app/features/menu/**` + `tests/db/menu-seeds.test.ts`. Article VIII (200-line file cap, 30-line function cap) — `filterAvailableKeys` is a 3-line pure function; `MenuShell.vue` at 197 lines. Article VII (Storybook) — `MenuShell.stories.ts` updated in the same changeset with two new variants (`FilteredMissingCategory`, `FilteredMissingDrinkGroup`), meta mounts the real `MenuShell` component with `tags: ['autodocs']`, no phantom argTypes.
- Code-level check of the actual diff:
  - `menu-sets.ts`: new pure `filterAvailableKeys(keys, availableKeys)` (order-preserving filter, never adds a key); `resolveActiveKey` gained an optional 4th `availableKeys?` param, backward-compatible (3-arg call sites unaffected — FR-012 no-regression).
  - `useMenuFilters.ts`: `useMenuFilters(...)` gained an optional `availableKeys?: Set<string>` param; `curatedSet` computed and the initial `activeCategory` ref / `setCategory` now route through the filter/fallback when supplied; omitted preserves pre-023 behavior exactly.
  - `MenuShell.vue`: builds `availableKeys` from the current request's `menuData.categories`/`.drinkGroups` keys and passes it through — the fallback-to-raw-key branch in `foodCategoryLabel()`/`drinkGroupLabel()` is no longer reachable for any rendered chip.
  - `tests/db/menu-seeds.test.ts`: new `describe` block asserts every `AYCE_BUFFET_SET`/`AYCE_CARTA_SET`/`EXPRESS_SET` key exists among active `CATEGORIES`, and every `DRINKS_SET` key exists among `DRINK_GROUPS`; failure messages name both the key and the set (FR-009); does not import `sauces`/`drinkSubGroups` for this guard (FR-010).
- `feature_list.json`: feature 023 correctly still `in_progress` (reviewer does not mark `done`).
- `progress/current.md`: documents the round-1 rejection and both fixes accurately; matches what's actually in the diff.

### Structure / security scans (CHECKPOINTS C3.1, C7)
- `find app/components -maxdepth 1 -name '*.vue'` → empty (no misplaced components).
- Secret-pattern scan on the full diff (`git diff master...HEAD` + working-tree diff) → only match is the implementer's own changelog line "Secret self-scan on the diff → clean (no matches)" in `progress/current.md` — a false positive from the word "scan", not a secret.
- `git ls-files | grep -E '^\.env($|\.)' | grep -v '\.example$'` → empty.
- Design-token scan (default-palette classes, arbitrary `[...]` values, inline hex) on the touched files → empty.
- `sauces` / `drinkSubGroups` untouched, confirmed by grep (only pre-existing describe block still imports `SUB_GROUPS`, unrelated to the new guard).

## Notes
- Non-blocking observation (already present since round 1, not a regression introduced by this fix): `setSelection`/`setModality` reset `activeCategory` via `getDefaultKey(...)`, which is not itself re-validated against `availableKeys`. In the extreme edge case where a curated set's *default* (first) key is the one missing, switching type/modality could land on a still-unavailable default before the next render's data refresh. This matches spec Edge Case "a curated set loses every one of its members" (FR-006, empty-state fallback) rather than a partial-drift case, and is not covered by an explicit test, but it is not a regression from this PR's scope (the deep-link and `setCategory` paths — the primary spec scenarios — are correctly guarded). Consider a follow-up test/guard if this edge becomes a real concern.
