# Review: alacarta-combo-notes-menu-copy (feature 029)

**Status:** APPROVED

## Verifications

### Precondition
- `feature_list.json` id 29 status: `reviewing` (correctly transitioned by leader). Confirmed no other feature simultaneously `in_progress`/`reviewing`.

### Part A — Rice rename
- `server/db/seeds/menuCategories.ts`: `rice.nameEs` = `'Arroces'`, `nameEn` = `'Rice'` (unchanged). Confirmed.

### Part B — À la carte piece-count copy
- Every item in `alaCarta.ts`'s `COLD_ROLLS`, `HOT_ROLLS`, `SWEET_ROLLS` (19 items) has `descriptionEs` ending in `'10 Pzas.'` and `descriptionEn` ending in `'10 pcs.'`. Confirmed by direct read of the file.
- `ayceMenu.ts` / `expressMenu.ts`: zero diff vs `master` (`git diff master...HEAD -- server/db/seeds/ayceMenu.ts server/db/seeds/expressMenu.ts` produces no output) — original 5-piece copy fully untouched.

### Part C — Category split (the critical risk area)
- 4 new rows in `menuCategories.ts`: `burgers_carta`, `hot_dogs_carta`, `cold_rolls_carta`, `hot_rolls_carta`, each with `nameEs`/`nameEn` identical to their shared counterpart and the correct bilingual combo notes (burgers/hot_dogs: fries 100g + soda 400ml; cold/hot rolls: yakimeshi 240g or sweet-kani salad 180g choice + soda 400ml). Matches `data-model.md`.
- `alaCarta.ts`'s `BURGERS`/`HOT_DOGS`/`COLD_ROLLS`/`HOT_ROLLS` items (5+3+8+9 = 25 items) all reassigned to their `_carta` categoryKey variant; `requiredKeys` updated accordingly.
- Original shared categories `burgers`/`hot_dogs`/`cold_rolls`/`hot_rolls` remain in `menuCategories.ts`, untouched, no note fields set — still referenced by `ayceMenu.ts`/`expressMenu.ts` (confirmed via grep, zero diff on those two files).
- `app/features/menu/menu-sets.ts`: `AYCE_CARTA_SET` now uses the 4 `_carta` keys at the same array positions; `AYCE_BUFFET_SET`/`EXPRESS_SET` diff is empty — still reference original shared keys.
- Migration `server/db/migrations/0034_add_ala_carte_category_keys.sql`: exactly 4× `ALTER TYPE "public"."menu_category_key" ADD VALUE IF NOT EXISTS '<key>'` — pure additive enum-value migration, no data mutation, no destructive statement, mirrors `0021`/`0022` precedent exactly.
- `server/utils/menu-queries.ts` and `server/utils/menu-queries.test.ts`: **zero diff** confirmed via `git diff master...HEAD -- server/utils/menu-queries.ts` — the explicit design constraint was honored, no deviation.
- `server/db/schema.ts`: only the 4 new enum values added to `menuCategoryKey`, comment updated (17→21). No column/table change.
- `types/menu.ts`: `MenuCategoryKey` gains the 4 new literal members only; `FullMenuCategory.note` shape unchanged.

### Neon dev-DB migration incident (per implementer's progress notes)
- Migration `0034` was inadvertently also applied to the real Neon dev DB before the `.env`/`.env.local` precedence workaround was found. Verified the migration file itself contains only 4 idempotent `ADD VALUE IF NOT EXISTS` statements — no data mutation, no destructive DDL. This is a genuine non-issue as claimed; the underlying `.env` precedence tooling bug is correctly flagged as a separate, unfixed, out-of-scope follow-up (not blocking this feature).

### Tests — meaningfulness, not tautology
- `tests/db/menu-seeds.test.ts`: asserts actual note *content* (`it.each` block checks `noteEs`/`noteEn` string equality against the exact combo copy for each `_carta` key, plus `nameEs`/`nameEn` equality against the shared counterpart), asserts the shared rows explicitly stay note-less, asserts categoryKey reassignment by checking absence of shared keys and presence of `_carta` keys in `ALA_CARTA_ITEMS`, asserts piece-count copy via `.endsWith()` on real description strings (with a non-empty-array guard against silent false positives), and asserts `AYCE_CARTA_SET`/`AYCE_BUFFET_SET`/`EXPRESS_SET` membership both positively and negatively (contains `_carta` keys / does NOT contain shared keys and vice versa).
- `app/features/menu/menu-sets.spec.ts`: updated `AYCE_CARTA_SET` literal-array assertion to the new `_carta` keys.
- These are substantive assertions on content/behavior, not mere existence checks.

### Acceptance criteria ↔ test traceability
- All User Story 1/2/3 acceptance scenarios have at least one covering assertion, with the exception of a couple of purely structural "confirmed unaffected"/zero-diff claims (US1 scenario 3, US2 scenario 4) which are enforced by the untouched-file guarantee (verified directly via `git diff`) rather than an explicit unit test — acceptable since these are negative/no-op claims about files this feature explicitly does not touch.

### Phase -1 Gates / Constitution
- `plan.md`'s Constitution Check table: all 13 articles marked `✅ Pass` (this repo's established equivalent of Phase -1 gates, consistent with feature 028's plan.md format). Complexity Tracking table is empty (no violations). Article IV (TDD): `tasks.md` orders test tasks (T002, T004, T008–T011) before their paired implementation tasks (T003, T005–T007, T012–T018) in every user story. Article X (KISS): explicitly strengthened by the revision (enum-only migration vs. the original two-nullable-columns + query-branch design).

### Tasks
- All 21 tasks (T001–T021) in `tasks.md` marked `[x]`.

### `[NEEDS CLARIFICATION]`
- None found in `spec.md`.

### Repo state — `./init.sh`
- Exit 0. Biome check OK. Typecheck OK. Tests: 115 files / 1034 tests passed. Storybook build OK.

### Sensitive data scan
- `git diff master...HEAD` secret-pattern grep: no real hits (only false-positive substring matches inside unrelated Spanish/English dish description text, no actual secrets/tokens/credentials).
- `git ls-files | grep '^\.env'`: empty — no env files tracked.
- No PEM blocks, no connection strings, no synthetic/real customer data introduced (this feature only edits copy/category seed data).

### CHECKPOINTS.md C1–C7
- C1: harness files present, `./init.sh` exit 0.
- C2: exactly 1 feature (`29`) in `in_progress`/`reviewing` combined.
- C3 / C3.1: no `app/` component/feature-folder changes at all (this feature stays in `server/db/` + one existing shared file `app/features/menu/menu-sets.ts`); `find app/components -maxdepth 1 -name '*.vue'` returns empty.
- C4: acceptance criteria covered by tests (see above); no filesystem mocks (seed data is a pure in-memory constant, DB client mocked only to allow import, per the test file's own documented rationale); `pnpm test` covers both `server/` and `app/` (menu-sets.spec.ts); `pnpm check`/`pnpm typecheck` pass; no `.vue` files touched by this feature, so the Storybook-sync requirement does not apply (Storybook build itself still passes green).
- C5: N/A until leader closes the session.
- C6: `specs/029-.../` has `spec.md`, `plan.md`, `tasks.md` (+ research/data-model/quickstart); no `[NEEDS CLARIFICATION]`; all tasks `[x]`.
- C7: see sensitive-data scan above — clean.

## Notes (non-blocking)
- Several à la carte dish descriptions have a pre-existing double-period style quirk (e.g. `"...salsa de anguila.. 10 Pzas."`) inherited from the existing seed data's trailing-period convention (already present before this feature, e.g. `"Queso manchego empanizado en panko.."`) — cosmetic, not introduced by this feature, not blocking.
- The `.env`/`.env.local` precedence tooling bug affecting `pnpm db:generate`/`pnpm db:migrate` is correctly flagged as a known, unfixed, out-of-scope issue and does not affect the correctness of this feature's migration.
