# Review: 009-ci-cd-github-actions

**Status:** APPROVED

## Verifications

### Spec / planning hygiene
- All 36/36 tasks in `tasks.md` marked `[x]`; zero `[ ]`.
- All Constitution Check gates in `plan.md` marked PASS (Articles VI, IX, X, XIII, I — others N/A).
- Zero `[NEEDS CLARIFICATION]` markers in `spec.md`.

### Repo state
- `./init.sh` exits 0; 44/44 test files, 226/226 tests passing.

### Article VI — Sensitive-data scan (NON-NEGOTIABLE)
- `grep -rEi '(vercel.?(token|org.?id|project.?id))\s*[:=]\s*["\047][^$]' .github/workflows/` → zero hardcoded credentials.
- Every `vercel` CLI invocation reads `--token=${{ secrets.VERCEL_TOKEN }}` (no literals).
- No PAT-shaped strings (`ghp_`, `github_pat_`, `gho_`, `ghs_`, `ghu_`) anywhere in workflows.
- `.env*` files: not tracked; only `.env.example` style allowed.
- `.gitignore` contains `.vercel/`.
- C7.6 multi-file leak scan: only `feature_list.json` mentions the secret NAMES (in a descriptive prose block, identical class to specs/docs mentions). No bare values. ACCEPTED.
- `docs/harness/ci-cd.md` uses placeholder `<your-token-here>` (no real values).

### Trigger correctness
- `ci.yml`: `on: pull_request:` only (no `push:`). C1.2 OK.
- `preview.yml`: `on: push: branches: [develop]`. C2.2 OK.
- `production.yml`: `on: push: tags: ['v*']`; zero `branches:` keys. C3.2 / C3.16 / C7.7 OK.
- `create-release.yml`: `on: workflow_dispatch:` only with the three required inputs (`version_bump` choice required, `release_description` required, `additional_notes` optional). C4.2 / C4.5 OK.

### Branch-guard (US3 acceptance / C4.3)
- `create-release.yml` declares `if: github.ref == 'refs/heads/master'` on the `release` job. OK.

### Release-commit hygiene
- Commit message in `create-release.yml` contains `[skip ci]` (C4.8). OK.
- Annotated tag created with `v${{ steps.bump.outputs.new_version }}` (C4.8 `git tag -a`). OK.
- `npm version ${{ inputs.version_bump }} --no-git-tag-version` present (C4.7). OK.
- `softprops/action-gh-release@v2` pinned to major (C4.9). OK.
- `create-release.yml` contains zero `npx vercel` invocations (C4.10 / C7.9). OK.

### GitHub Environments
- `preview.yml` → `environment: dev` on `deploy` job (C2.15).
- `production.yml` → `environment: prd` on `deploy` job (C3.15).
- `ci.yml` and `create-release.yml` declare no `environment:` (C7.8). All four exactly per spec.

### Permissions (least-privilege)
- `ci.yml`: `contents: read` only.
- `preview.yml`: `contents: read` + `deployments: write`.
- `production.yml`: `contents: read` + `deployments: write`.
- `create-release.yml`: `contents: write` only (no `actions: write`, no `packages: write`, no `id-token: write`, no `deployments: write`). C4.4 / C7.5 OK.

### Cross-file consistency (C7)
- Node major `20` in every workflow (C7.2 OK).
- Vercel CLI major identical between `preview.yml` and `production.yml`: `vercel@34` byte-identical (C7.3 OK).
- `concurrency` blocks present in `ci.yml`, `preview.yml`, `production.yml`; `create-release.yml` correctly omits it (C7.4 OK).

### YAML structural validation
- `actionlint`: NOT available on this workstation (matches implementer note; research §R8 authorizes the fallback).
- Python `yaml.safe_load` ran on all four workflow files → all parse cleanly.

### Frontend token-enforcement gates (still green from feature 008)
- T108a (default-palette utility scan on `app/` + `.storybook/`): zero matches.
- T108b (arbitrary Tailwind values on `app/` + `.storybook/`): zero matches.
- T108c (inline hex colors in `app/components/`, `app/layouts/`, `app/pages/`, excluding `staff.css`): zero matches.

### Frontend feature verification
- N/A — this feature touches `.github/workflows/`, `docs/harness/`, `package.json`, `.gitignore`. No `app/` files modified.

### `package.json` (C8)
- `version: "0.1.0"` present, placed between `"name"` and `"type"`/`"private"`. C8.1 / C8.2 OK.

## Notes

- The implementer's two flagged deviations are both spec-authorized and verified:
  1. `actionlint` fallback to `yaml.safe_load` is sanctioned by research §R8 when `actionlint` is unavailable. All four workflows parsed cleanly.
  2. `npx vercel@34` pinned in lockstep across `preview.yml` and `production.yml`; matches contract C7.3.
- Human-only follow-ups (T804.1–T804.4) are documented in `docs/harness/ci-cd.md` §6 and `tasks.md` T804. These remain pending the human admin's GitHub UI work post-merge — not blocking for this review.
- One operational nuance for the human: branch protection on `master` (T804.2) must permit `github-actions[bot]` to push, or `create-release.yml` will fail at the `git push origin master` step. Documented in `docs/harness/ci-cd.md` §4.

---

## Delta re-review — Phase 9 Reconciliation

**Status:** APPROVED

### Per-check results

| Check | Result |
|---|---|
| Trigger correctness (`production.yml`: `workflow_call` + `workflow_dispatch`, both with required `tag` input; no `push:`) | PASS — lines 20–31; checkout `ref: ${{ inputs.tag }}` at line 54 |
| Chaining (`create-release.yml` `deploy` job: `needs: release`, `uses: ./.github/workflows/production.yml`, `with.tag: needs.release.outputs.tag`, `secrets: inherit`) | PASS — lines 191–197; `release` job exposes `outputs.tag: ${{ steps.bump.outputs.new_tag }}` at line 47 |
| Concurrency (`production.yml` keyed on `inputs.tag`) | PASS — `group: ${{ github.workflow }}-${{ inputs.tag }}` at line 38 |
| Body template (emoji 🐛/✨/🚨, title `🚀 v… - <Patch\|Minor\|Major> Release (Production)`, Service `sumo-ayce`, NO Region, `body_path: release_body.md`, `git log HEAD^ -n 50`, Additional Notes guarded by `if [ -n "$ADDITIONAL_NOTES" ]`) | PASS — all present; zero `Region` matches |
| Dry-run fixtures (6 `.md` + 6 `.title`; titles regex-match; Additional Notes present in 02/04/06 only; no Region) | PASS — 3 files with count=1, 3 with count=0; titles conform |
| YAML parse (all 4 workflows) | PASS |
| `./init.sh` | PASS — exit 0, 226/226 tests |
| Tasks all `[x]` | PASS — 42 checked, 0 unchecked |
| No `[NEEDS CLARIFICATION]` | PASS |

### Ruling on `git log HEAD^ -n 50` vs `| head -50`

**ACCEPTED.** Semantics identical (first 50 commits); `-n 50` avoids `SIGPIPE`
under `set -o pipefail` in the bash step. Strictly more robust than the
spec's literal form. No deviation from intent.

### Notes / observations (non-blocking)

- Dry-run fixtures all carry `v0.1.1` regardless of bump type — the implementer
  fixed `NEW_TAG` to demonstrate the templating only. Workflow itself reads
  `NEW_TAG` from `npm version`'s actual output; not a defect.
- Human-only follow-ups (T804.1–T804.4) remain pending the GitHub UI work
  post-merge, as in the original review. Unchanged.

### Feature status

`feature_list.json` id=9 confirmed `in_progress` (line 91). NOT flipped to
`done` — the human approval gate after spec_ready and the implementer's
own `done` mark are both preserved.
