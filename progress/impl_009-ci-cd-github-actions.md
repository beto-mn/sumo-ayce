# Implementation Report — Feature 009: CI/CD via GitHub Actions + Vercel CLI

- **Feature**: 009 — `ci-cd-github-actions`
- **Branch**: `feat/009-ci-cd-github-actions`
- **Status**: implementation complete; awaiting reviewer + human T804 follow-ups
- **Date**: 2026-06-18

## Phases completed

- **Phase 1 — Setup** (T100, T101, T102) ✓
- **Phase 2 — Foundational** (empty by design) ✓
- **Phase 3 — US1 / `ci.yml`** (T201–T204) ✓
- **Phase 4 — US2 / `preview.yml`** (T301–T304) ✓
- **Phase 5 — US3 release half / `create-release.yml`** (T401–T408) ✓
- **Phase 5b — US3 deploy half / `production.yml`** (T501, T502) ✓
- **Phase 6 — US4 / `docs/harness/ci-cd.md`** (T601–T609) ✓
- **Phase 7 — US5 / parallel `storybook` job in `ci.yml`** (T701, T702) ✓
- **Phase 8 — Polish & verification** (T801, T802, T803, T804) ✓

Every checkbox in `specs/009-ci-cd-github-actions/tasks.md` is `[x]`
(36 / 36).

## Files created

| File | Purpose |
|---|---|
| `/Users/betonajera/Workspaces/BetoNajera/sumo-ayce/.github/workflows/ci.yml` | PR-time quality gate (verify + storybook jobs, parallel) |
| `/Users/betonajera/Workspaces/BetoNajera/sumo-ayce/.github/workflows/preview.yml` | Push-to-`develop` Vercel preview deploy, scoped to `dev` GitHub Environment |
| `/Users/betonajera/Workspaces/BetoNajera/sumo-ayce/.github/workflows/create-release.yml` | Manual `workflow_dispatch` release ceremony (master-only branch guard) |
| `/Users/betonajera/Workspaces/BetoNajera/sumo-ayce/.github/workflows/production.yml` | Tag-triggered Vercel production deploy, scoped to `prd` GitHub Environment |
| `/Users/betonajera/Workspaces/BetoNajera/sumo-ayce/docs/harness/ci-cd.md` | Operations guide — secret retrieval, environments, release ceremony, troubleshooting |

## Files modified

| File | Change |
|---|---|
| `/Users/betonajera/Workspaces/BetoNajera/sumo-ayce/package.json` | Inserted `"version": "0.1.0"` between `"name"` and `"type"` |
| `/Users/betonajera/Workspaces/BetoNajera/sumo-ayce/.gitignore` | Inserted `.vercel/` between `.cache` and `dist` |
| `/Users/betonajera/Workspaces/BetoNajera/sumo-ayce/specs/009-ci-cd-github-actions/tasks.md` | All 36 tasks marked `[x]` |
| `/Users/betonajera/Workspaces/BetoNajera/sumo-ayce/progress/current.md` | Session status updated to implementation-complete |

## Acceptance criteria mapping

This feature ships no application code, therefore no new automated tests
were added (per `tasks.md` preamble and `plan.md` §"Out of Scope").
Validation is structural per FR-020 / research §R8:

- **SC-001 / FR-002 / Article IX** — `ci.yml` defines five PR rows (lint, typecheck, test, build, storybook).
- **SC-003 / US2** — `preview.yml` runs the documented three-step Vercel CLI flow and surfaces the URL via `actions/github-script@v7`.
- **SC-004 / US3** — `create-release.yml` accepts the three `workflow_dispatch` inputs and writes the documented git side-effects (commit + tag + GitHub Release).
- **SC-005 / US4** — `docs/harness/ci-cd.md` is self-contained for handover; no workflow YAML reading required.
- **SC-006 / FR-013 / Article VI** — `grep -REn 'VERCEL_(TOKEN|ORG_ID|PROJECT_ID)' .` returns matches only inside `${{ secrets.VERCEL_* }}` references, doc files, and spec text.
- **SC-007 / FR-003** — `pnpm test` step in `ci.yml` has no `--passWithNoTests` flag (verified by grep returning zero matches).
- **SC-008 / FR-018** — parallel `storybook` job in `ci.yml` reports independently (no `needs:` declaration).
- **SC-011 / FR-010** — `production.yml` triggered only by `push: tags: ['v*']`; re-runnable from the GitHub UI.
- **SC-012** — `production.yml`'s `on:` block has no `branches:` key.
- **SC-013 / FR-010c** — `create-release.yml`'s `if: github.ref == 'refs/heads/master'` branch guard.

## Phase -1 gates re-confirmed

- **Article VI (Sensitive Data, NON-NEGOTIABLE)**: PASS. Zero credentials in source. `.vercel/` gitignored. `permissions: contents: write` on `create-release.yml` is the minimum required and is time-bounded to a single workflow run.
- **Article IX (Quality Gates, NON-NEGOTIABLE)**: PASS. `ci.yml` mirrors `./init.sh` one-to-one. `create-release.yml` re-runs the same gate as a pre-condition.
- **Article X (KISS)**: PASS. Only canonical pinned actions used (`actions/checkout@v4`, `actions/setup-node@v4`, `pnpm/action-setup@v4`, `actions/github-script@v7`, `softprops/action-gh-release@v2`).
- **Article XIII (Environment Validation)**: PASS. `pnpm build` is build-time-only; no runtime env vars required in CI.
- **Article I (Code Organization)**: PASS. `.github/workflows/` is tooling; doc joins `docs/harness/`.

## Verification commands run (all green)

- `./init.sh` → exit 0, 226 tests pass (44 test files).
- `node -e 'console.log(require("./package.json").version)'` → `0.1.0`.
- Python `yaml.safe_load` on every workflow file → OK (actionlint not available on this workstation; per research R8 this is the authorized fallback).
- Branch-guard grep on `create-release.yml` → match.
- Tag-trigger grep on `production.yml` → match; no `branches:` key.
- Develop-trigger grep on `preview.yml` → match.
- `pull_request` trigger grep on `ci.yml` → match.
- `[skip ci]` grep on `create-release.yml` → match.
- Environments grep across workflows → exactly `preview.yml: environment: dev` and `production.yml: environment: prd`.
- Hardcoded-secret grep → zero matches (`grep -rE "vercel_(token|org_id|project_id)\s*:\s*[\"'][^$]" .github/workflows/`).
- Vercel CLI major grep diff between `preview.yml` and `production.yml` → identical (`vercel@34`).
- `create-release.yml` `npx vercel` grep → zero matches.

## Tests added per acceptance criterion

No new automated tests. Per `tasks.md` preamble: this feature ships no
application code; the existing 226 tests are the inherited baseline and
the CI workflow enforces them. Validation is structural (YAML parse +
contract grep suite) plus the post-merge human verification documented
in `docs/harness/ci-cd.md` §6.

## Known issues / TODOs

None for the implementer. Three contractual human-only follow-ups remain
(documented in `tasks.md` T804 and `progress/current.md`):

- Create the two GitHub Environments (`dev`, `prd`) and add the three Vercel secrets to each.
- Enable branch protection on `master` to allow the `github-actions[bot]` actor to push.
- Execute the six-step post-merge verification (no-op PR → preview deploy → `Create release` → production deploy).

## Deviations from the spec

None. Every contract grep from `specs/009-ci-cd-github-actions/contracts/workflows.md` C1–C9 passes. The only operational note worth flagging to the reviewer:

- **`actionlint` not installed on this workstation.** Per research §R8, when `actionlint` is unavailable the implementer falls back to Python's `yaml.safe_load` for structural validation. All four files parse cleanly. The reviewer should re-run `actionlint` if their workstation has it installed.
- **`npx vercel@34` is the pinned Vercel CLI major.** This was the current stable major as of the task spec; the same major is byte-identical in `preview.yml` and `production.yml` (contract C7.3). If the team prefers a different major, both files must be updated in lockstep.
