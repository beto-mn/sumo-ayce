# Review: vercel-blob-images (018)

**Status:** APPROVED

---

## Verifications

### Acceptance criteria covered by tests: 9/9 (all user stories)

| AC | Test |
|----|------|
| US1 SC1 — non-null path → full HTTPS URL | `resolveImageUrl.test.ts` "returns full URL when filePath is non-null" |
| US1 SC2 — null path → null imageUrl | `resolveImageUrl.test.ts` "returns null when filePath is null" |
| US1 SC3 — trailing slash in BLOB_BASE_URL → no double slash | `resolveImageUrl.test.ts` "strips trailing slash from BLOB_BASE_URL to avoid double slash" |
| US1 SC4 — sauce imageUrl is fully-qualified | `menu-queries.test.ts` "resolves sauce imageUrl to a fully-qualified URL when fileName is non-null" |
| SC-001 — dish imageUrl is fully-qualified HTTPS | `menu-queries.test.ts` "resolves dish imageUrl to a fully-qualified URL when fileName is non-null" |
| US2 SC1 — missing BLOB_BASE_URL → startup failure | `env.test.ts` "fails validation when BLOB_BASE_URL is missing" |
| US2 SC2 — empty BLOB_BASE_URL → startup failure | `env.test.ts` "fails validation when BLOB_BASE_URL is an empty string" |
| US2 SC3 — all vars present → starts successfully | `env.test.ts` "succeeds when all required variables including BLOB_BASE_URL are present" |
| US3 SC1–SC5 — seed paths use `menu/<folder>/` convention | Seed files spot-checked: `ayceMenu.ts` (menu/ayce/*), `sauces.ts` (menu/sauces/*), null items remain null |
| US4 SC1–SC2 — documentation self-contained | `docs/harness/vercel-blob.md` exists (203 lines), covers path convention, upload workflow, DB update, env var setup |

### Constitution check (plan.md): 7/7 marked ✅ Pass

All articles checked in plan.md (I, II, III, IV, VIII, X, XIII) — all `✅ Pass`.

### Tasks completed: 17/17

All tasks T001–T017 in `specs/018-vercel-blob-images/tasks.md` are `[x]`.

### No `[NEEDS CLARIFICATION]` markers

`spec.md` is fully resolved.

### `./init.sh`: exit 0

- Biome check: OK (338 files, no warnings)
- Typecheck: OK
- Tests: 759 passed (101 test files)

### C7 — Security scan: CLEAN

- Secret-pattern diff scan: empty (no API keys, tokens, passwords, PEM blocks)
- `git ls-files | grep \.env`: no tracked env files beyond `.env.example`
- `BLOB_BASE_URL=` in `.env.example` with empty placeholder (compliant)

### CHECKPOINTS C1–C7: all OK

| Checkpoint | Result | Notes |
|------------|--------|-------|
| C1 (harness complete) | PASS | All base files present; `./init.sh` exits 0 |
| C2 (state coherent) | PASS | 1 feature in_progress; matches active session |
| C3 (architecture) | PASS | `resolveImageUrl` extracted to `server/api/v1/menu/resolveImageUrl.ts`; `env.ts` updated in `server/utils/`; no layer violations |
| C3.1 (structure) | PASS | No `*.vue` at `app/components/` root; `app/` changes scoped to `app/features/menu/` |
| C4 (tests) | PASS | 759/759 pass; biome clean; typecheck clean; all branches covered |
| C5 (session closure) | PASS | `progress/history.md` has entries |
| C6 (SDD gates) | PASS | All 17 tasks `[x]`; constitution check all `✅`; no `[NEEDS CLARIFICATION]` |
| C7 (security) | PASS | No secrets committed; no tracked env files; all values are synthetic in tests |

### Frontend verification (app/ files modified)

- No `*.vue` at `app/components/` root — PASS
- No default Tailwind palette classes (`bg-orange-500` etc.) — PASS
- No arbitrary Tailwind values (`bg-[#...]`) — PASS
- No inline hex colors in style= or `<style>` blocks — PASS
- `app/pages/menu.vue` is 53 lines (≤ 100 limit) — PASS
- `MenuDishCard.vue` is 66 lines (≤ 200 limit) — PASS

---

## Notes

- The three fixes from this round are all clean: `result?.replace(` (non-null assertion removed), `resolveImageUrl` moved to query layer in `menu-queries.ts`, and the new `menu-queries.test.ts` test asserting `dish?.imageUrl` matches `^https://` end-to-end.
- `resolveImageUrl` is now a standalone exported module (`server/api/v1/menu/resolveImageUrl.ts`), making it importable by the test without module gymnastics.
- 759 tests pass vs. 746 in the prior feature-011 review — net +13 tests added across features 018 and the env validation suite.
