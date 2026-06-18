---
description: "Task list for feature 009 — CI/CD via GitHub Actions + Vercel CLI"
---

# Tasks: CI/CD via GitHub Actions + Vercel CLI (develop staging, master production)

**Input**: Design documents from `/specs/009-ci-cd-github-actions/`
**Prerequisites**: plan.md (loaded), spec.md (loaded), research.md (loaded), data-model.md (loaded), contracts/workflows.md (loaded), quickstart.md (loaded)

**Tests**: This feature ships no application code, therefore no automated test tasks are generated. Validation is structural (YAML lint + contract grep suite) and runtime-validated by the human after merge per FR-020.

**Organization**: Tasks are grouped by user story (US1–US5) and by the seven implementation phases enumerated in `plan.md`. Each task references its contract number in `contracts/workflows.md`.

## Format: `[ID] [P?] [Story?] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks).
- **[Story]**: US1–US5 maps to the user stories in `spec.md`; phases without a story label are setup/closeout.
- Each task carries an exact file path and an exact verification command.

## Cross-cutting constraints (apply to every task)

- NO real secret value may be written into any source-controlled file. All Vercel credentials are referenced via `${{ secrets.* }}` only.
- NO task may invoke `vercel link` against the workstation and commit the resulting `.vercel/` folder (gitignored as part of T102).
- The Vercel CLI major version chosen in T302/T303 MUST be reused identically in T501 (cross-file constraint C6.3 in contracts/workflows.md — note: production-workflow task ID is now T501, not T401, after the renumbering for the release-workflow split).
- Every contract verification task cites a specific contract number (e.g. `C2.7`) and lives in this file as a runnable command.
- The release workflow (`create-release.yml`) MUST NOT call the Vercel CLI. The production workflow (`production.yml`) MUST NOT trigger on push to a branch — only on push of a tag matching `v*`.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Create the on-disk skeleton (package.json `version` seed + workflows folder + gitignore line) so subsequent tasks have a place to write to. **T100 MUST be the first task executed in this feature — every release-workflow task (T401–T408) depends on `package.json` carrying a parseable `version` field.**

- [x] T100 Insert `"version": "0.1.0"` into `package.json` as a new top-level field, placed between `"name"` and `"private"` (so the resulting top fields read in order: `"name"`, `"version"`, `"type"`, `"private"`, `"scripts"`, ...). Do NOT alter any other field, ordering, key casing, or trailing newline of `package.json`. Rationale: this is the seed for the semver bump scheme used by `create-release.yml` (T401–T408); `0.1.0` indicates pre-1.0 territory until the client formally accepts the launch, at which point a `major` bump promotes to `1.0.0`. Reference contract C8.1 (NEW — `package.json` version field). Verify with: `node -e 'console.log(require("./package.json").version)'` prints exactly `0.1.0`; `node -e 'const p=require("./package.json"); const keys=Object.keys(p); const i=keys.indexOf("version"); console.log(keys[i-1]==="name" && (keys[i+1]==="type" || keys[i+1]==="private"))'` prints `true`; `./init.sh` exits 0; `git diff --stat package.json` shows exactly 1 file changed with +1/-0 (or +1 with an adjusted line if the JSON formatter normalises trailing comma).
- [x] T101 Create the `.github/workflows/` directory at repo root by running `mkdir -p .github/workflows`. Verify with `test -d .github/workflows && echo OK`.
- [x] T102 [P] Add `.vercel/` (with trailing slash) to `.gitignore`, placed between the `.cache` rule and the `dist` rule of the existing "Nuxt dev/build outputs" group. Reference contract C4.1. Verify with `grep -E '^\.vercel/$' .gitignore && echo OK`.

**Checkpoint**: `package.json` carries `"version": "0.1.0"`; `.github/workflows/` exists; `.gitignore` has the `.vercel/` rule. No workflow files yet.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: None. This feature has no shared foundational artifact across user stories beyond Phase 1 — every workflow file is independent. This phase is intentionally empty; user-story phases start immediately after Phase 1.

(No tasks in this phase. Document its absence so future readers know it was considered and dropped, not skipped.)

---

## Phase 3: User Story 1 — Pull-request CI gates merge on the same checks `./init.sh` runs locally (Priority: P1) MVP

**Goal**: Every PR triggers an automated CI run that gates merge on `pnpm check`, `pnpm typecheck`, `pnpm test`, `pnpm build`, mirroring `./init.sh`. (Storybook job lands in Phase 6 as US5.)

**Independent Test**: Open a no-op PR; the GitHub PR view shows a `verify` job (containing four checks) reporting status. Introduce a Biome violation in a follow-up commit; the `verify` job fails. Reference: spec.md US1.

### Implementation for User Story 1

- [x] T201 [US1] Scaffold `.github/workflows/ci.yml` with the top-level structure required by contracts C1.1–C1.4: `name: CI`, `on: pull_request:` (no `branches:` filter), `permissions: contents: read`, `concurrency: { group: ${{ github.workflow }}-${{ github.ref }}, cancel-in-progress: true }`. Do NOT add jobs yet. Verify with `python3 -c "import yaml; yaml.safe_load(open('.github/workflows/ci.yml'))" && echo OK` and `grep -E 'pull_request:' .github/workflows/ci.yml`.

- [x] T202 [US1] In `.github/workflows/ci.yml`, add a single `verify` job running on `ubuntu-latest`. Add the install steps in this exact order (contract C1.6 prefix): (1) `actions/checkout@v4`, (2) `pnpm/action-setup@v4` (no `run_install`), (3) `actions/setup-node@v4` with `node-version: 20` and `cache: 'pnpm'`, (4) `run: pnpm install --frozen-lockfile`. Verify with `grep -E 'node-version: 20' .github/workflows/ci.yml && grep -E 'pnpm install --frozen-lockfile' .github/workflows/ci.yml`.

- [x] T203 [US1] In the same `verify` job in `.github/workflows/ci.yml`, append the four quality-gate steps in this exact order (contract C1.6 suffix, contract C1.12): `run: pnpm check`, `run: pnpm typecheck`, `run: pnpm test` (no `--passWithNoTests` flag), `run: pnpm build`. Each step has a clear human-readable `name:`. Verify with `grep -c -E 'run: pnpm (check|typecheck|test|build)' .github/workflows/ci.yml` returning `4`.

- [x] T204 [US1] Run the contract C1 verification grep suite against `.github/workflows/ci.yml`. Required passing commands: `grep -E 'pull_request:' .github/workflows/ci.yml`; `grep -E 'permissions:\s*$' .github/workflows/ci.yml` and the following two lines contain `contents: read`; `grep -E 'cancel-in-progress: true' .github/workflows/ci.yml`; `grep -E 'node-version: 20' .github/workflows/ci.yml`; `grep -c 'run: pnpm' .github/workflows/ci.yml` ≥ 4. If `actionlint` is available locally, also run `actionlint .github/workflows/ci.yml` and confirm zero issues. Reference: contracts/workflows.md §C1.

**Checkpoint**: US1 MVP — `ci.yml` exists with the four verify steps, no Storybook job yet (T601 adds it). The pull-request gate is operational from the workflow's perspective (live-runner validation deferred per FR-020).

---

## Phase 4: User Story 2 — Push to `develop` deploys a Vercel preview and surfaces the URL (Priority: P1) MVP

**Goal**: A push to `develop` triggers a Vercel preview deploy via the Vercel CLI; the resulting URL is posted to the commit's Deployments tab via `actions/github-script@v7`.

**Independent Test**: After the human adds the three secrets in GitHub repo settings, a one-line push to `develop` produces a clickable preview URL on the commit's Deployments view. Reference: spec.md US2.

### Implementation for User Story 2

- [x] T301 [US2] Scaffold `.github/workflows/preview.yml` with the top-level structure required by contracts C2.1–C2.5: `name: Preview Deploy`, `on: push: branches: [develop]`, `permissions: { contents: read, deployments: write }`, `concurrency: { group: ${{ github.workflow }}-${{ github.ref }}, cancel-in-progress: true }`, top-level `env:` with `VERCEL_ORG_ID: ${{ secrets.VERCEL_ORG_ID }}` and `VERCEL_PROJECT_ID: ${{ secrets.VERCEL_PROJECT_ID }}`. Do NOT add jobs yet. Verify with `python3 -c "import yaml; yaml.safe_load(open('.github/workflows/preview.yml'))" && echo OK` and `grep -E 'deployments: write' .github/workflows/preview.yml`.

- [x] T302 [US2] In `.github/workflows/preview.yml`, add a single `deploy` job on `ubuntu-latest`. The job MUST declare `environment: dev` (FR-022, contract C2.15) so its access to the three Vercel secrets is scoped to the `dev` GitHub Environment. Add steps in this exact order (contract C2.7 prefix and C2.8 / C2.9): (1) `actions/checkout@v4`, (2) `pnpm/action-setup@v4`, (3) `actions/setup-node@v4` (`node-version: 20`, `cache: 'pnpm'`), (4) `run: pnpm install --frozen-lockfile`, (5) `run: npx vercel@<MAJOR> pull --yes --environment=preview --token=${{ secrets.VERCEL_TOKEN }}`, (6) `run: npx vercel@<MAJOR> build --token=${{ secrets.VERCEL_TOKEN }}`, (7) `run: npx vercel@<MAJOR> deploy --prebuilt --token=${{ secrets.VERCEL_TOKEN }} | tee /tmp/vercel_deploy.txt && echo "preview_url=$(tail -n 1 /tmp/vercel_deploy.txt)" >> "$GITHUB_OUTPUT"`. Replace `<MAJOR>` with the current stable Vercel CLI major (at time of writing: `34`); record the chosen major in a YAML comment near the top of the file. Give step (7) an `id:` like `deploy` so its output is referenceable. Verify with `grep -cE 'npx vercel@[0-9]+' .github/workflows/preview.yml` returning at least `3`, `grep -c 'secrets.VERCEL_TOKEN' .github/workflows/preview.yml` returning at least `3`, and `grep -E '^\s*environment:\s*dev\s*$' .github/workflows/preview.yml` returning one match.

- [x] T303 [US2] In the same `deploy` job in `.github/workflows/preview.yml`, append a final step using `actions/github-script@v7` that calls `github.rest.repos.createDeployment` (with `ref: context.sha`, `environment: 'preview'`, `auto_merge: false`, `required_contexts: []`) followed by `github.rest.repos.createDeploymentStatus` (with `state: 'success'`, `environment_url: '${{ steps.deploy.outputs.preview_url }}'`, `log_url: \`https://github.com/\${{ github.repository }}/actions/runs/\${{ github.run_id }}\``). Reference contract C2.11. Verify with `grep -E 'actions/github-script@v7' .github/workflows/preview.yml` and `grep -E "environment: 'preview'" .github/workflows/preview.yml`.

- [x] T304 [US2] Run the contract C2 verification grep suite against `.github/workflows/preview.yml`. Required: every `vercel` invocation is `npx vercel@<MAJOR>` (no bare `npx vercel`), every `vercel` invocation includes `--token=${{ secrets.VERCEL_TOKEN }}`, `--environment=preview` appears exactly once, `cancel-in-progress: true` is present, `environment: dev` is declared on the `deploy` job (contract C2.15), and a grep for any literal token-shaped value (`grep -E '[A-Za-z0-9_-]{20,}' .github/workflows/preview.yml | grep -vE 'secrets\.|github\.|\${{|^\s*#'`) returns no token-shaped match (only structural strings remain). If `actionlint` is available, run `actionlint .github/workflows/preview.yml`. Reference: contracts/workflows.md §C2.

**Checkpoint**: US2 MVP — `preview.yml` exists, structurally validated against contract C2. Live preview deploy is gated on the human adding the three secrets in repo settings (T704.1).

---

## Phase 5: User Story 3 (release half) — Manual `workflow_dispatch` release ceremony via `create-release.yml` (Priority: P1) MVP

**Goal**: A maintainer can dispatch `create-release.yml` from the GitHub UI on `master`, pick a semver bump, fill a description (and optional additional notes), and the workflow runs the full quality gate, bumps `package.json`'s `version`, commits with `[skip ci]`, tags `v<X.Y.Z>`, pushes, and creates a GitHub Release. The release ceremony is auditable, deliberate, and does NOT contact Vercel.

**Independent Test**: From the GitHub UI Actions tab, open "Create release" on `master`, pick `patch`, fill description "initial release scaffold", click Run. Confirm `package.json`'s `version` was bumped to `0.1.1` on `master`, the commit message is `🔖 chore(release): v0.1.1 [skip ci]`, the tag `v0.1.1` exists, and the GitHub Release object exists with the description as its body. Reference: spec.md US3.

### Implementation for User Story 3 (release half)

- [x] T401 [US3] Scaffold `.github/workflows/create-release.yml` with the top-level structure required by contract C4 (NEW in `contracts/workflows.md`): `name: Create release`, `on: workflow_dispatch:` with the three required inputs (`version_bump` — required `choice` with options `[patch, minor, major]`, no default; `release_description` — required string; `additional_notes` — optional string). Do NOT add jobs yet. Verify with `python3 -c "import yaml; d=yaml.safe_load(open('.github/workflows/create-release.yml')); inputs=d['on']['workflow_dispatch']['inputs']; assert set(inputs.keys())=={'version_bump','release_description','additional_notes'}; assert inputs['version_bump']['required'] is True; assert inputs['release_description']['required'] is True; assert inputs['additional_notes'].get('required', False) is False; print('OK')"`.

- [x] T402 [US3] In `.github/workflows/create-release.yml`, add a single `release` job on `ubuntu-latest` with `permissions: contents: write` (declared at job or workflow level — see contract C4.4) and the branch guard `if: github.ref == 'refs/heads/master'` (FR-010c, contract C4.3). Do NOT add Vercel CLI calls, do NOT declare any `environment:` (contract C4.10). Verify with `grep -E "if:\s*github\.ref\s*==\s*'refs/heads/master'" .github/workflows/create-release.yml && grep -E 'contents:\s*write' .github/workflows/create-release.yml`.

- [x] T403 [US3] In the `release` job, add the install prefix steps in this exact order (contract C4.5): (1) `actions/checkout@v4` with `fetch-depth: 0` AND `ref: master` AND `token: ${{ secrets.GITHUB_TOKEN }}` (full history needed for accurate tag operations; explicit `ref: master` defends against a dispatch from a different branch even though the `if:` guard already covers this), (2) `pnpm/action-setup@v4`, (3) `actions/setup-node@v4` (`node-version: 20`, `cache: 'pnpm'`), (4) `run: pnpm install --frozen-lockfile`. Verify with `grep -E 'fetch-depth:\s*0' .github/workflows/create-release.yml && grep -E 'ref:\s*master' .github/workflows/create-release.yml`.

- [x] T404 [US3] In the `release` job, append the quality-gate steps in this exact order (FR-010d, contract C4.6): `run: pnpm check`, `run: pnpm typecheck`, `run: pnpm test`, `run: pnpm build`. Each step has a clear human-readable `name:`. If ANY step fails, the workflow MUST exit non-zero before the version-bump step runs (this is automatic — `set -e` is GitHub Actions default for `run:` steps). Verify with `grep -c -E 'run: pnpm (check|typecheck|test|build)' .github/workflows/create-release.yml` returning exactly `4`.

- [x] T405 [US3] In the `release` job, append a step that configures git identity and bumps the version (FR-010e, FR-010f, contract C4.7). The step's `run:` block: `git config user.name "github-actions[bot]"`, `git config user.email "41898282+github-actions[bot]@users.noreply.github.com"`, `npm version ${{ inputs.version_bump }} --no-git-tag-version` (the `--no-git-tag-version` flag is REQUIRED — the workflow creates its own annotated tag in T406), then capture the new version: `NEW_VERSION=$(node -p "require('./package.json').version")` and `echo "new_version=$NEW_VERSION" >> "$GITHUB_OUTPUT"`. Give the step an `id: bump` so the output is addressable. Verify with `grep -E 'npm version \$\{\{ inputs\.version_bump \}\} --no-git-tag-version' .github/workflows/create-release.yml && grep -E 'id: bump' .github/workflows/create-release.yml`.

- [x] T406 [US3] In the `release` job, append a step that commits the bumped `package.json` (and `pnpm-lock.yaml` defensively — verified during research to not change on `npm version` but staged anyway), tags, and pushes. The `run:` block: `git add package.json pnpm-lock.yaml || git add package.json` (the `|| git add package.json` fallback covers the case where `pnpm-lock.yaml` is unchanged and git refuses to add a non-modified file — though `git add` on a clean file is a no-op in practice), then `git commit -m "🔖 chore(release): v${{ steps.bump.outputs.new_version }} [skip ci]"`, then `git tag -a "v${{ steps.bump.outputs.new_version }}" -m "Release v${{ steps.bump.outputs.new_version }}"`, then `git push origin master && git push origin "v${{ steps.bump.outputs.new_version }}"`. Verify with `grep -E '\[skip ci\]' .github/workflows/create-release.yml && grep -E 'git tag -a' .github/workflows/create-release.yml && grep -E 'git push origin master' .github/workflows/create-release.yml && grep -E 'git push origin "v\$' .github/workflows/create-release.yml`.

- [x] T407 [US3] **Re-opened 2026-06-17: design changed — release body now uses the FR-010g-body template (with `{EMOJI}`/`{Type}` mapping, commit history, conditional Additional Notes section) instead of the simple `release_description` + optional append. Body lives at `release_body.md` in the working directory, not `/tmp/release_body.md`. The detailed implementation is split into T901 (template + bash step) and T904 (verification).** Original task (now superseded — see T901, T904): In the `release` job, append a step that constructs the GitHub Release body via a small `run:` block writing to `$GITHUB_OUTPUT` (or to a file) so the body string can carry the optional `additional_notes` append. The bash logic: `body="${{ inputs.release_description }}"; if [ -n "${{ inputs.additional_notes }}" ]; then body+=$'\n\n## Additional notes\n\n'"${{ inputs.additional_notes }}"; fi; echo "$body" > /tmp/release_body.md`. Give the step `id: body`. Reference contract C4.8. Then append the GitHub Release creation step using `softprops/action-gh-release@v2` (pinned major; FR-010g, contract C4.9) with `tag_name: v${{ steps.bump.outputs.new_version }}`, `name: v${{ steps.bump.outputs.new_version }}`, `body_path: /tmp/release_body.md`, `draft: false`, `prerelease: false`. Verify with `grep -E 'softprops/action-gh-release@v2' .github/workflows/create-release.yml && grep -E 'body_path: /tmp/release_body\.md' .github/workflows/create-release.yml && grep -E 'draft: false' .github/workflows/create-release.yml && grep -E 'prerelease: false' .github/workflows/create-release.yml`.

- [x] T408 [US3] **Re-opened 2026-06-17: contract C4 grew (C4.14–C4.23) for the new title format, body template, chaining job, and emoji/history/additional-notes mapping. The grep suite must be expanded accordingly.** Run the contract C4 verification grep suite against `.github/workflows/create-release.yml` per the UPDATED contract. Required: `on:` contains ONLY `workflow_dispatch:` (no `push:`, no `schedule:`, no `pull_request:`); the three input names exist exactly as `version_bump`/`release_description`/`additional_notes`; the branch guard `if: github.ref == 'refs/heads/master'` is present; `permissions: contents: write` is present; the quality-gate sequence (check/typecheck/test/build) runs BEFORE `npm version`; `npm version` carries `--no-git-tag-version`; the commit message contains `[skip ci]`; the tag format is `v<...>`; the release body is generated by a bash step writing to `release_body.md` (NOT `/tmp/release_body.md`) per the FR-010g-body template; the `name:` field uses the title format `🚀 v<X.Y.Z> - <Patch|Minor|Major> Release (Production)` (C4.14); the body has NO `Region:` line (C4.20); the commit-history bash step uses `HEAD^` in `git log` and `git describe` (C4.17); the `release` job exposes `outputs.tag` (C4.23); a SECOND job named `deploy` exists with `needs: release`, `uses: ./.github/workflows/production.yml`, `with: { tag: ... }`, and `secrets: inherit` (C4.21, C4.22); `softprops/action-gh-release@v2` is the GitHub Release creator (pinned major); the `release` job does NOT contain `npx vercel` (C4.10); the `release` job does NOT declare `environment:` (C4.10). If `actionlint` is available, run `actionlint .github/workflows/create-release.yml`. Reference: contracts/workflows.md §C4 (UPDATED).

**Checkpoint**: US3 release half — `create-release.yml` exists, structurally validated against contract C4. The first live dispatch is gated on T804.1 (the human-only follow-ups).

---

## Phase 5b: User Story 3 (deploy half) — Tag push triggers `production.yml` Vercel deploy (Priority: P1) MVP

**Goal**: When `create-release.yml` pushes a tag matching `v*`, `production.yml` (triggered ONLY by `on: push: tags: ['v*']`) deploys the codebase at that tag to Vercel production (environment `prd`). The live SUMO domain serves the new build.

**Independent Test**: After the human creates the two GitHub Environments (`dev`, `prd`) and scopes the three Vercel secrets per environment (T804.1), a dispatch of `create-release.yml` produces a tag, the tag push triggers `production.yml`, the Vercel dashboard shows a fresh production deployment attributed to a CI token, and the live domain serves the new build. Reference: spec.md US3.

### Implementation for User Story 3 (deploy half)

- [x] T501 [US3] **Re-opened 2026-06-17: design changed from `on: push: tags: ['v*']` to `on: { workflow_call, workflow_dispatch }` with a required `tag` input. The tag-trigger model is REJECTED — superseded by T902.** Original task (now superseded): Create `.github/workflows/production.yml` by mirroring `.github/workflows/preview.yml` with these deltas: (a) `name: Production Deploy`, (b) `on:` is EXACTLY `push: tags: ['v*']` (NO `branches:` key; explicitly NOT triggered by push to master — contract C3.2), (c) the `deploy` job declares `environment: prd` (instead of `dev`; contract C3.15, FR-022), (d) the checkout step uses `ref: ${{ github.ref }}` so it checks out the tag, not master HEAD, (e) `npx vercel@<MAJOR> pull --yes --environment=production --token=...` (instead of `preview`), `npx vercel@<MAJOR> build --prod --token=...`, `npx vercel@<MAJOR> deploy --prebuilt --prod --token=...` (capture stdout's final line into output `production_url`), (f) the `actions/github-script@v7` step uses `environment: 'production'` (the GitHub Deployments-API value, NOT the GitHub Environment name — the two namespaces are distinct) and reads `${{ steps.deploy.outputs.production_url }}`. CRITICAL: the `<MAJOR>` value MUST match the value chosen in T302 byte-for-byte (contract C6.3). All other structural elements (permissions, concurrency, env, install steps) are identical to `preview.yml`. Reference: contracts/workflows.md §C3. Verify with `diff <(grep -oE 'npx vercel@[0-9]+' .github/workflows/preview.yml | sort -u) <(grep -oE 'npx vercel@[0-9]+' .github/workflows/production.yml | sort -u) && echo OK` and `grep -E 'environment=production' .github/workflows/production.yml` and `grep -E 'vercel deploy --prebuilt --prod' .github/workflows/production.yml` and `grep -E "tags:\s*\['v\*'\]" .github/workflows/production.yml` and `grep -E '^\s*environment:\s*prd\s*$' .github/workflows/production.yml` and `! grep -E '^\s*branches:' .github/workflows/production.yml`.

- [x] T502 [US3] **Re-opened 2026-06-17: contract C3 grew (C3.2 now requires `workflow_call` + `workflow_dispatch` and explicit NEGATIVE assertions on `push:`/`tags:`/`branches:`; C3.7 now requires `ref: ${{ inputs.tag }}`; C3.16 broadened; C3.17 added; C3.3 changed concurrency group to use `inputs.tag`). Original assertions about `tags: ['v*']` are now FALSE-positives — the suite must be rewritten. Superseded by T903.** Original task (now superseded): Run the contract C3 verification grep suite against `.github/workflows/production.yml`. Required: `on:` is `push: tags: ['v*']` (exactly), NO `branches:` key appears anywhere in `on:`; both `--prod` flags present on `build` and `deploy`; every `vercel` invocation uses `--token=${{ secrets.VERCEL_TOKEN }}`; `environment: prd` declared on the `deploy` job (contract C3.15); no literal token-shaped string anywhere in the file (`grep -E '[A-Za-z0-9_-]{20,}' .github/workflows/production.yml | grep -vE 'secrets\.|github\.|\${{|^\s*#'` returns no token-shaped match); `actions/github-script@v7` uses `environment: 'production'` (Deployments-API value). If `actionlint` is available, run `actionlint .github/workflows/production.yml`. Reference: contracts/workflows.md §C3.

**Checkpoint**: US3 deploy half — `production.yml` exists, tag-triggered (NOT push-to-master), structurally validated against contract C3. Live production deploy is gated on the human creating the GitHub Environments and adding the secrets (T804.1) AND on the first successful dispatch of `create-release.yml`.

---

## Phase 6: User Story 4 — Future repo owners can reuse the pipeline by swapping only the three GitHub secrets (Priority: P2)

**Goal**: Ship `docs/harness/ci-cd.md` that lets a non-author owner make the pipeline work end-to-end by adding only three secrets in GitHub repo settings, with zero file edits.

**Independent Test**: A non-author reading only `docs/harness/ci-cd.md` retrieves the three secret values, creates the two GitHub Environments (`dev`/`prd`), and performs a first release in under sixty minutes (per SC-005) without opening any workflow YAML. Reference: spec.md US4, contract C5.

Tasks T601–T609 each write one section of the doc. Because they all touch the same file (`docs/harness/ci-cd.md`), they are NOT marked `[P]` — they execute sequentially in section order. T601 creates the file with section 1; subsequent tasks append.

### Implementation for User Story 4

- [x] T601 [US4] Create `docs/harness/ci-cd.md` with sections 1 and 2 from data-model.md §4: "Overview" (four workflows, CLI-only Vercel coupling, three GitHub secrets scoped to two GitHub Environments `dev` and `prd`, manual-release ceremony for production, the handover contract) and "Required GitHub secrets" (a table listing `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID` with type, purpose, retrieval pointer, AND the GitHub Environment each is scoped to — every secret has one copy in `dev` and one copy in `prd`). Cite Article VI of the constitution where the rationale for "no secrets in source" is explained. Reference contract C5.2, C5.7, C5.8. Verify with `test -f docs/harness/ci-cd.md && grep -c -E 'VERCEL_(TOKEN|ORG_ID|PROJECT_ID)' docs/harness/ci-cd.md` returning at least `3` and `grep -ciE 'dev.*prd|prd.*dev' docs/harness/ci-cd.md` returning ≥ 1.

- [x] T602 [US4] Append section "2.1 Retrieving `VERCEL_TOKEN`" to `docs/harness/ci-cd.md` per data-model.md §4: dashboard path `https://vercel.com/account/tokens`, "Create Token", scope selection (full account vs team), naming convention `sumo-ayce-gha-dev` for the `dev` copy and `sumo-ayce-gha-prd` for the `prd` copy (two distinct tokens recommended; same token also acceptable if the team uses one), expiry guidance per the team's rotation policy, copy-paste destination (GitHub Settings → Environments → `dev` (or `prd`) → Environment secrets → Add secret, name `VERCEL_TOKEN`). Use placeholder `<your-token-here>` — NEVER a real or example token value (contract C5.7). Verify with `grep -E '2\.1' docs/harness/ci-cd.md && grep -E 'vercel\.com/account/tokens' docs/harness/ci-cd.md`.

- [x] T603 [US4] Append section "2.2 Retrieving `VERCEL_ORG_ID`" to `docs/harness/ci-cd.md` per data-model.md §4: option A (`vercel link` locally, read `.vercel/project.json`'s `orgId`, then `rm -rf .vercel/` — note the folder is gitignored per T102, removal is a safety belt) and option B (Vercel dashboard → Team → Settings → General → Team ID). Note: the same `VERCEL_ORG_ID` value is typically pasted into both the `dev` and `prd` GitHub Environments unless the team uses different Vercel orgs per environment. Verify with `grep -E '2\.2' docs/harness/ci-cd.md && grep -E 'orgId' docs/harness/ci-cd.md`.

- [x] T604 [US4] Append section "2.3 Retrieving `VERCEL_PROJECT_ID`" to `docs/harness/ci-cd.md` per data-model.md §4: option A (`.vercel/project.json`'s `projectId` after `vercel link`) and option B (Vercel dashboard → Project → Settings → General → Project ID). Verify with `grep -E '2\.3' docs/harness/ci-cd.md && grep -E 'projectId' docs/harness/ci-cd.md`.

- [x] T605 [US4] Append sections "3. Creating the GitHub Environments and adding the secrets" and "4. Recommended branch-protection rules (RECOMMENDATION ONLY)" to `docs/harness/ci-cd.md`. Section 3 MUST cover: (a) Settings → Environments → New environment → name exactly `dev` (lowercase), repeat for `prd`; (b) for each environment, add the three secrets via Environment secrets → Add secret (NOT Repository secrets — the workflows reference environment-scoped secrets via `environment: dev`/`environment: prd`); (c) note that secret values cannot be read back after saving — store the originals in the team password manager; (d) note that required-reviewers protection on `prd` is available but not enabled by this feature. Section 4 MUST be framed as a recommendation, not an action (contract C5.3): recommend `verify` and `storybook` jobs as required status checks before merging into `master`, linear history on `master`, restricted pushes to `master` (now MORE important because `create-release.yml` itself pushes a commit to `master` via `GITHUB_TOKEN` — branch protection must explicitly allow GitHub Actions or use the `Restrict who can push to matching branches → Include administrators` carve-out). Explicitly state that enabling branch protection requires repo-admin access and is NOT performed by this feature (FR-015). Verify with `grep -E '^## 3\.|^### 3\.' docs/harness/ci-cd.md && grep -E 'RECOMMENDATION ONLY' docs/harness/ci-cd.md && grep -ciE 'environment secrets' docs/harness/ci-cd.md` returning ≥ 1.

- [x] T606 [US4] **Re-opened 2026-06-17: the "How to ship" section referenced the old "tag push triggers production.yml" model. Under the new model, the `deploy` job runs in the SAME workflow run as `release` (via `workflow_call`); the recovery path is "Production Deploy" `workflow_dispatch` with the existing tag input. Original assertions remain true (the section name, the create-release dispatch flow); the recovery sub-section must be rewritten. See T905.** Original task (now superseded): Append section "5. How to ship to production" to `docs/harness/ci-cd.md` per quickstart.md "How to ship": (1) open GitHub → Actions → "Create release", (2) click "Run workflow", (3) confirm branch is `master` (the workflow refuses other branches), (4) pick `version_bump` (`patch | minor | major` — guidance on each), (5) fill `release_description` (markdown supported, becomes the GitHub Release body), (6) optionally fill `additional_notes` (markdown — appended under `## Additional notes`), (7) click "Run workflow". Document the recovery path: if `production.yml` fails on the tag push (e.g. transient Vercel API error), the maintainer can re-run `production.yml` from the GitHub UI against the same tag — no new release ceremony needed. Verify with `grep -E '^## 5\.|^### 5\.' docs/harness/ci-cd.md && grep -ciE 'create release' docs/harness/ci-cd.md` returning ≥ 1 and `grep -ciE 'recovery|re-run' docs/harness/ci-cd.md` returning ≥ 1.

- [x] T607 [US4] **Re-opened 2026-06-17: post-merge verification step 6 said "production.yml ran on the tag push"; under the new model, `production.yml` runs via `workflow_call` from `create-release.yml` within the same workflow run. The checklist phrasing must reflect the new chaining. See T905.** Original task (now superseded): Append section "6. Post-merge verification procedure" to `docs/harness/ci-cd.md` per research.md R8 (UPDATED for the new release flow): a six-step checklist — (1) create the two GitHub Environments `dev` and `prd`, (2) add the three secrets to EACH environment, (3) open a no-op PR and confirm the five CI rows appear green, (4) push a one-line change to `develop` and confirm a preview URL appears on the commit's Deployments tab (preview deploy ran in `dev` environment), (5) merge `develop` to `master`, (6) dispatch "Create release" → `patch` → description "initial release scaffold" → confirm `v0.1.1` tag exists, the GitHub Release exists, `production.yml` ran on the tag push, and the Vercel `prd` environment serves the new build on the live SUMO domain. Cite Article IX where it explains why CI mirrors `./init.sh` (contract C5.8). Verify with `grep -E '^## 6\.|^### 6\.' docs/harness/ci-cd.md && grep -ciE 'article ix' docs/harness/ci-cd.md` returning ≥ 1.

- [x] T608 [US4] Append sections "7. Secret rotation" and "8. Handover to a new owner" to `docs/harness/ci-cd.md` per data-model.md §4. Section 7: how to rotate `VERCEL_TOKEN` (create new token in Vercel dashboard, update the secret value in EACH GitHub Environment that uses it, revoke old token — no workflow edits required). Section 8: six-step handover procedure (admin add, retrieve three values per §2, create `dev` + `prd` GitHub Environments and overwrite their secrets, remove prior owner from Vercel team, push test commit to `develop`, perform first release via "Create release"). The doc MUST explicitly state that no source-controlled file needs to change for handover (FR-016) — including no changes to `package.json` (the `version` field already exists; the release workflow will bump it from whatever value is current). Verify with `grep -E '^## 7\.|^### 7\.' docs/harness/ci-cd.md && grep -E '^## 8\.|^### 8\.' docs/harness/ci-cd.md && grep -ciE 'no .*file.*change' docs/harness/ci-cd.md` returning ≥ 1.

- [x] T609 [US4] Append section "9. Troubleshooting" to `docs/harness/ci-cd.md` per data-model.md §4: common failure modes (authentication failed, build failed, deploy timed out, preview URL not appearing, `create-release.yml` skipped because dispatch was from a non-master branch, tag exists but `production.yml` did not trigger) each paired with an immediate fix or escalation path. The "authentication failed" fix is "rotate `VERCEL_TOKEN` in the relevant GitHub Environment per §7". Verify with `grep -E '^## 9\.|^### 9\.' docs/harness/ci-cd.md && grep -ciE 'authentication failed' docs/harness/ci-cd.md` returning ≥ 1.

**Checkpoint**: US4 — `docs/harness/ci-cd.md` exists with nine sections, cites Articles VI and IX, contains no real secret values, frames branch protection as recommendation only, and includes the "how to ship to production" walkthrough.

---

## Phase 7: User Story 5 — Storybook build runs as a parallel CI job (Priority: P3)

**Goal**: `ci.yml` runs a `storybook` job in parallel with `verify` so broken stories fail independently of lint/typecheck/test/build.

**Independent Test**: Introduce a syntax error in any `.stories.ts` file. On the resulting PR, the `storybook` job reports red while `verify` reports green. Reference: spec.md US5.

### Implementation for User Story 5

- [x] T701 [US5] In `.github/workflows/ci.yml`, add a second job named `storybook` (parallel to `verify` — does NOT declare `needs:`). It runs on `ubuntu-latest` and contains the install prefix steps (`actions/checkout@v4`, `pnpm/action-setup@v4`, `actions/setup-node@v4` with `node-version: 20` + `cache: 'pnpm'`, `pnpm install --frozen-lockfile`) followed by a single step `run: pnpm storybook:build`. Reference contract C1.9. Verify with `grep -c '^\s*storybook:' .github/workflows/ci.yml` returning ≥ 1 and `grep -E 'pnpm storybook:build' .github/workflows/ci.yml`.

- [x] T702 [US5] Run the contract C1.9 + C1.10 verification commands: `grep -E 'pnpm storybook:build' .github/workflows/ci.yml` (job exists), `grep -E 'needs:' .github/workflows/ci.yml` returns nothing (job is parallel, not sequential — IMPORTANT: confirm no `needs:` keyword appears in the file at all), and `grep -E 'uses:' .github/workflows/ci.yml | grep -vE 'actions/checkout@v4|actions/setup-node@v4|pnpm/action-setup@v4'` returns no match (no third-party actions snuck in). If `actionlint` is available, rerun `actionlint .github/workflows/ci.yml`. Reference: contracts/workflows.md §C1.9, §C1.10.

**Checkpoint**: US5 — `ci.yml` now runs both `verify` and `storybook` jobs in parallel on every PR.

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Cross-file structural validation, harness re-verification, and an explicit, non-task record of the human-only follow-ups required to make this feature production-functional.

- [x] T801 [P] Run the canonical YAML/Actions structural validator across all four workflow files. Preferred: `actionlint .github/workflows/*.yml` (zero issues). Fallback if `actionlint` is unavailable: `for f in .github/workflows/*.yml; do python3 -c "import yaml; yaml.safe_load(open('$f'))"; done` — all four files parse. Reference: research.md R8.

- [x] T802 **Re-opened 2026-06-17: cross-file C7 contract expanded (C7.4 concurrency-group format diverged for `production.yml`; C7.7 now requires `workflow_call` + `workflow_dispatch` and rejects `push:`/`tags:`/`branches:`; C7.10 added — the `create-release.yml` → `production.yml` chaining via `uses: ./.github/workflows/production.yml` + `secrets: inherit`).** Run the cross-file grep suite from contracts/workflows.md §C7 (UPDATED). All commands must succeed (every grep returns ≥ 1 match where required, and the secret-leak grep returns no leaks). Concretely: file-existence checks (C1.1, C2.1, C3.1, C4.1 — `.gitignore`, C5.1, AND the NEW `.github/workflows/create-release.yml` existence check, AND `package.json`'s `version` field present) all pass; `node-version: 20` count is 1 in each of the four workflow files; `npx vercel@<N>` major is identical in `preview.yml` and `production.yml`; `create-release.yml` does NOT contain `npx vercel` (only the chained call to `production.yml`); `production.yml`'s `on:` contains EXACTLY `workflow_call:` and `workflow_dispatch:` (verified by `grep -E '^\s*workflow_call:' .github/workflows/production.yml`, `grep -E '^\s*workflow_dispatch:' .github/workflows/production.yml`, `! grep -E '^\s*push:' .github/workflows/production.yml`, `! grep -E '^\s*tags:' .github/workflows/production.yml`, `! grep -E '^\s*branches:' .github/workflows/production.yml`); `create-release.yml` chains via `uses: ./.github/workflows/production.yml` with `secrets: inherit` and `needs: release` (verified by `grep -E 'uses: \./\.github/workflows/production\.yml' .github/workflows/create-release.yml`, `grep -E 'secrets: inherit' .github/workflows/create-release.yml`, `grep -E 'needs: release' .github/workflows/create-release.yml`); the multi-file secret-leak grep returns "OK (no leaks)".

- [x] T803 [P] Rerun `./init.sh` from the repo root. Confirm it exits with code 0 — the feature must not have introduced any regression in the existing 226-test suite, type-checking, or linting (the harness has zero dependency on the new workflow files; this is a safety check that no unrelated change slipped in, INCLUDING the `package.json` `version` insertion in T100).

- [x] T804 Record the **human-only follow-ups** that this feature deliberately does NOT execute. These are NOT tasks for the implementer — they are a contract with the human, documented here so nothing is forgotten between merge and live operation:
  - **T804.1 (human-only — repo admin)**: In GitHub Settings → Environments, create two environments named exactly `dev` and `prd` (lowercase). For EACH environment, add the three secrets via Environment secrets → Add secret: `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`. Retrieval steps live in `docs/harness/ci-cd.md` §2.1–§2.3. Until this is done, `preview.yml` will fail at the `vercel pull` step in the `dev` environment, and `production.yml` will fail at the `vercel pull` step in the `prd` environment, both with authentication errors.
  - **T804.2 (human-only — repo admin, STRONGLY RECOMMENDED, NOT required)**: Enable branch protection on `master` per the recommendation in `docs/harness/ci-cd.md` §4. Required status checks: `verify` and `storybook`. This is NOW MORE IMPORTANT than before because `create-release.yml` itself pushes a commit to `master` via the built-in `GITHUB_TOKEN` (with `contents: write` permission); branch protection must allow GitHub Actions to push (configured via "Restrict who can push to matching branches" → leave actions/bot exclusions in place, or via "Include administrators" if the team prefers a simpler policy). Also recommend branch protection on `develop` (less critical). The implementer cannot configure this from code — it requires repo-admin access in the GitHub UI.
  - **T804.3 (human-only — post-merge validation)**: Execute the six-step verification checklist in `docs/harness/ci-cd.md` §6 after this feature is merged to `master`. KEY NEW STEP: dispatch "Create release" → `patch` → description "initial release scaffold" → confirm tag `v0.1.1` appears, GitHub Release exists, `production.yml` triggers on the tag push, and Vercel `prd` serves the new build. The SDD environment cannot trigger live runners; only the human can confirm end-to-end behavior. Document the outcome in `progress/current.md` or a session log.
  - **T804.4 (human-only — forward-compat checkpoint)**: When feature 010 (homepage) opens its first PR, confirm that a Vercel preview URL appears on the resulting commit after the PR is merged to `develop`. If not, the human escalates with the runner logs; the implementer of feature 010 is not on the hook for this signal.

---

## Phase 9: Reconciliation (post-implementation design revision — added 2026-06-17)

**Purpose**: Apply the design changes introduced after the initial implementation passed reviewer approval but before the human signed off: (1) replace `production.yml`'s tag-trigger with `workflow_call` + `workflow_dispatch`; (2) chain `create-release.yml` → `production.yml` via a new `deploy` job within the same workflow run; (3) rewrite the GitHub Release body to follow the FR-010g-body template (semantic emoji + commit history + conditional Additional Notes + Deployment block with `Environment: prd` / `Service: sumo-ayce` and NO Region line). The reopened tasks (T407, T408, T501, T502, T606, T607, T802) document the gaps these new tasks close.

- [x] T901 [US3] In `.github/workflows/create-release.yml`, replace the existing release-body step (originally T407's `/tmp/release_body.md` simple-append logic) with a bash step that generates `release_body.md` (in the workflow's working directory — NOT `/tmp/`) per the FR-010g-body template. The bash step MUST:
  1. Read `NEW_VERSION` from the `bump` step's output (`steps.bump.outputs.new_version`).
  2. Set `NEW_TAG="v${NEW_VERSION}"`.
  3. Map `inputs.version_bump` to `EMOJI`, `RELEASE_TYPE_TITLE`, and `RELEASE_TYPE` via case/if logic exactly as in FR-010g-emoji (`patch` → `🐛` / `Patch` / `Bug fixes`; `minor` → `✨` / `Minor` / `Minor enhancements`; `major` → `🚨` / `Major` / `Major release / breaking changes`).
  4. Determine the previous tag: `PREV_TAG=$(git describe --tags --abbrev=0 HEAD^ 2>/dev/null || echo "")`. If non-empty, compute `COMMIT_HISTORY=$(git log "${PREV_TAG}..HEAD^" --pretty=format:'- %s (%h)')` and `CHANGELOG_URL="${{ github.server_url }}/${{ github.repository }}/compare/${PREV_TAG}...${NEW_TAG}"`. If empty (first release), compute `COMMIT_HISTORY=$(git log HEAD^ --pretty=format:'- %s (%h)' | head -50)` and `CHANGELOG_URL="${{ github.server_url }}/${{ github.repository }}/commits/${NEW_TAG}"`.
  5. Determine the Additional Notes block: if `inputs.additional_notes` is empty, the block is the empty string. If non-empty, the block is `\n---\n\n## 📌 Additional Notes\n\n${ADDITIONAL_NOTES}\n` (leading `---` separator included so the block plugs into the body between the Deployment block and the bot signature without leaving an empty heading when absent).
  6. Write `release_body.md` using a heredoc with the exact template from FR-010g-body. The Deployment block MUST include ONLY `Environment: \`prd\`` and `Service: \`sumo-ayce\`` — NO Region line.
  7. Also export `RELEASE_TITLE="🚀 ${NEW_TAG} - ${RELEASE_TYPE_TITLE} Release (Production)"` to `$GITHUB_OUTPUT` (via `id: body` — `steps.body.outputs.release_title`) so the next step can use it as `name:`.
  Reference: contracts/workflows.md §C4.14, §C4.15, §C4.16, §C4.17, §C4.18, §C4.19, §C4.20; spec.md FR-010g-body, FR-010g-emoji, FR-010g-history, FR-010g-additional-notes; research.md "Release body template" and "Service name in Deployment block".
  Then update the existing `softprops/action-gh-release@v2` step to use `tag_name: v${{ steps.bump.outputs.new_version }}`, `name: ${{ steps.body.outputs.release_title }}`, `body_path: release_body.md`, `draft: false`, `prerelease: false`.
  Also update the `bump` step (originally T405) to expose `new_tag` as an additional output via `echo "new_tag=v${NEW_VERSION}" >> "$GITHUB_OUTPUT"` (this satisfies C4.23 — the chained `deploy` job in T902 needs this).
  Verify with: `grep -E 'body_path: release_body\.md' .github/workflows/create-release.yml` returns a match; `! grep -E 'body_path: /tmp/release_body\.md' .github/workflows/create-release.yml` returns no match; `grep -E 'name:.*🚀 v.*Release \(Production\)' .github/workflows/create-release.yml` returns a match (the literal must include the rocket emoji and the literal " Release (Production)" segment); `! grep -E '^\s*-\s*\*\*Region\*\*' .github/workflows/create-release.yml`; `grep -E 'git log .*HEAD\^' .github/workflows/create-release.yml`; `grep -E 'git describe --tags --abbrev=0 HEAD\^' .github/workflows/create-release.yml`; `grep -E 'new_tag=v\$' .github/workflows/create-release.yml`.

- [x] T902 [US3] Replace `.github/workflows/production.yml` with the new triggers and tag-input model. Concretely: (a) replace the entire `on:` block with EXACTLY two triggers — `workflow_call:` and `workflow_dispatch:` — each declaring a single required input `tag` of type `string` (descriptions: `workflow_call` says "Git tag to deploy (e.g. v1.0.107)"; `workflow_dispatch` says "Existing tag to redeploy (e.g. v1.0.107)"); (b) change the `concurrency.group` from `${{ github.workflow }}-${{ github.ref }}` to `${{ github.workflow }}-${{ inputs.tag }}`; (c) change the checkout step's `ref:` from `${{ github.ref }}` to `${{ inputs.tag }}`; (d) change the `actions/github-script@v7` step's `createDeployment` call to pass `ref: '${{ inputs.tag }}'` (instead of `context.sha`). All other elements of the workflow (permissions, env, install steps, Vercel CLI invocations, deploy environment `prd`, GitHub Deployments-API environment `'production'`) are unchanged. Reference: contracts/workflows.md §C3 (UPDATED — C3.2, C3.2.1, C3.3, C3.7, C3.11, C3.16, C3.17); spec.md FR-010, FR-010-bis; research.md "Workflow chaining: workflow_call over tag-triggered". Verify with: `grep -E '^\s*workflow_call:' .github/workflows/production.yml`; `grep -E '^\s*workflow_dispatch:' .github/workflows/production.yml`; `! grep -E '^\s*push:' .github/workflows/production.yml`; `! grep -E '^\s*tags:' .github/workflows/production.yml`; `! grep -E '^\s*branches:' .github/workflows/production.yml`; `grep -E 'ref:\s*\$\{\{\s*inputs\.tag\s*\}\}' .github/workflows/production.yml`; `grep -E 'group:.*inputs\.tag' .github/workflows/production.yml`.

- [x] T903 [US3] In `.github/workflows/create-release.yml`, add a new top-level job named `deploy` AFTER the `release` job. The `deploy` job MUST be a job-level reusable-workflow call with `needs: release`, `uses: ./.github/workflows/production.yml`, `with: { tag: ${{ needs.release.outputs.tag }} }`, `secrets: inherit`. The `release` job MUST declare `outputs: { tag: ${{ steps.bump.outputs.new_tag }} }` at the JOB level so `needs.release.outputs.tag` is reachable from `deploy`. (Note: the `new_tag` step output was added to the `bump` step in T901; T903 only wires the job-level output and the new `deploy` job.) Reference: contracts/workflows.md §C4.21, §C4.22, §C4.23, §C7.10; spec.md FR-010; research.md R10 (cross-reference). Verify with: `grep -E 'uses: \./\.github/workflows/production\.yml' .github/workflows/create-release.yml`; `grep -E 'secrets: inherit' .github/workflows/create-release.yml`; `grep -E 'needs: release' .github/workflows/create-release.yml`; `python3 -c "import yaml; d=yaml.safe_load(open('.github/workflows/create-release.yml')); assert d['jobs']['release']['outputs']['tag'], 'release outputs.tag missing'; assert d['jobs']['deploy']['uses'].endswith('/production.yml'), 'deploy uses production.yml'; print('OK')"`.

- [x] T904 [US3] Verify the body-generation bash step from T901 by dry-running it locally with the SIX input combinations (three bump types × two notes states). For each combination, run the bash logic in isolation (export `inputs.version_bump`, `inputs.release_description`, `inputs.additional_notes`, and stub `steps.bump.outputs.new_version`/`github.server_url`/`github.repository`/`github.actor` as shell variables), capture the produced `release_body.md`, and confirm the output matches the FR-010g-body template byte-for-byte for the substituted values:
  | # | bump  | additional_notes | Expected output features                                                                        |
  |---|-------|------------------|--------------------------------------------------------------------------------------------------|
  | 1 | patch | empty            | Header `## 🐛 Patch Release`; Type `Bug fixes`; NO Additional Notes section                       |
  | 2 | patch | non-empty        | Same as #1 + an `## 📌 Additional Notes` block before the bot signature with its own `---`        |
  | 3 | minor | empty            | Header `## ✨ Minor Release`; Type `Minor enhancements`; NO Additional Notes section              |
  | 4 | minor | non-empty        | Same as #3 + Additional Notes block                                                              |
  | 5 | major | empty            | Header `## 🚨 Major Release`; Type `Major release / breaking changes`; NO Additional Notes        |
  | 6 | major | non-empty        | Same as #5 + Additional Notes block                                                              |
  In ALL six cases the Deployment block MUST contain `Environment: prd` and `Service: sumo-ayce` and NO Region line; the title (computed for the `name:` field) MUST be `🚀 v<X.Y.Z> - <Patch|Minor|Major> Release (Production)`; the commit history block MUST be present (use a stub `PREV_TAG` of an actual previous tag in this repo if one exists, otherwise stub it as empty to exercise the first-release fallback). Record the six expected outputs as inline fixtures in a local validation script (the implementer's choice of `tests/manual/release-body-fixtures/` or similar — not committed to the repo unless the implementer prefers to). Reference: contracts/workflows.md §C4.15, §C4.16, §C4.19, §C4.20.

- [x] T905 [US4] Update `docs/harness/ci-cd.md` sections 5 (How to ship) and 6 (Post-merge verification) to reflect the new chaining model and the redeploy path:
  - In section 5, after the existing 7-step "Create release" walkthrough, add a "Wait for the deploy job" note: "After clicking Run, BOTH the `release` job AND the `deploy` job run within the SAME workflow run in the Actions UI. The deploy job is invoked via `workflow_call` and consumes the new tag as its input. Wait for both jobs to report success."
  - In section 5, REPLACE the recovery path paragraph (which referenced "re-run `production.yml` from the GitHub UI against the same tag" generically) with the explicit `workflow_dispatch` flow: "If the `deploy` job fails transiently (Vercel API hiccup, edge cache cold start), open GitHub UI → Actions → "Production Deploy" workflow → click "Run workflow" → input the existing tag value (e.g. `v1.0.107`) → click "Run workflow". This redeploys the same tag via `production.yml`'s `workflow_dispatch` trigger — no new release ceremony, no second tag, no second `package.json` bump."
  - In section 6, REPLACE step 6 (originally "`production.yml` ran on the tag push") with: "`production.yml` ran via `workflow_call` from `create-release.yml` within the SAME workflow run; the Actions tab shows both `release` and `deploy` jobs under one entry. The Vercel `prd` environment serves the new build on the live SUMO domain."
  - Also add a brief callout in section 5 describing the rendered release body — title `🚀 v<X.Y.Z> - <Type> Release (Production)`, sections `## 📝 Changes`, `## 📋 Commit History`, optional `## 📌 Additional Notes`, Deployment block with `Environment: prd` / `Service: sumo-ayce` and NO Region. Refer maintainers to `specs/009-ci-cd-github-actions/quickstart.md` "Example: rendered release note" for the full rendered fixture.
  Verify with: `grep -ciE 'workflow_call|workflow_dispatch.*tag' docs/harness/ci-cd.md` returning ≥ 1; `grep -ciE 'Production Deploy.*workflow_dispatch|workflow_dispatch.*Production Deploy' docs/harness/ci-cd.md` returning ≥ 1; `grep -ciE 'within the same workflow run' docs/harness/ci-cd.md` returning ≥ 1; `! grep -ciE 'tag push triggers production' docs/harness/ci-cd.md` returning 0 (the old phrasing is removed); `grep -ciE 'Service.*sumo-ayce' docs/harness/ci-cd.md` returning ≥ 1.

- [x] T906 Re-run the full contract verification suite (per T408 reopened, T502 reopened, T802 reopened) plus the new C7.10 chaining check. All commands must succeed. This task is the closeout of Phase 9 and gates the implementer's hand-back to the reviewer. Concretely: run `actionlint .github/workflows/*.yml` if available; run every `grep` / `! grep` listed in T408, T502, T802, T901, T902, T903 and confirm each succeeds; run `./init.sh` and confirm exit 0; confirm `package.json`'s `version` is unchanged at `0.1.0` (the design changes do NOT touch `package.json`).

**Checkpoint**: Phase 9 — production.yml now chains via `workflow_call`/`workflow_dispatch`; create-release.yml owns both the ceremony AND the deploy invocation; the release body matches the FR-010g-body template (semantic emoji, commit history, conditional Additional Notes, Deployment block without Region). The reviewer can re-verify the contracts; the human can then perform the live "Create release" dispatch per T804.3.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies — runs first. T100 is the absolute first task (every release-workflow task in Phase 5 depends on `package.json` having a `version` field).
- **Phase 2 (Foundational)**: empty by design.
- **Phase 3 (US1 — `ci.yml`)**: Depends on T101 (the workflows folder must exist).
- **Phase 4 (US2 — `preview.yml`)**: Depends on T101. INDEPENDENT of Phase 3 in principle. May run in parallel with Phase 3 if the implementer has the bandwidth.
- **Phase 5 (US3 release half — `create-release.yml`)**: Depends on T100 (the `version` field must exist in `package.json` for `npm version` to operate on it) and T101 (the workflows folder must exist). INDEPENDENT of Phases 3, 4 in principle.
- **Phase 5b (US3 deploy half — `production.yml`)**: Depends on T302 + T303 having landed (`production.yml` is built by mirroring `preview.yml`; mirroring requires the source to exist) AND uses the same Vercel CLI major as T302.
- **Phase 6 (US4 — harness doc)**: Depends on Phases 3, 4, 5, 5b completing so the doc can reference real workflow filenames without lying. Internally sequential (T601 → T602 → ... → T609) because all tasks edit the same file.
- **Phase 7 (US5 — Storybook job)**: Depends on Phase 3 completing (modifies `ci.yml`). Can run in parallel with Phase 6 since they touch different files.
- **Phase 8 (Polish)**: Depends on all prior phases. T801 and T803 are independent of each other (`[P]`); T802 must run after T801 because it references the same workflow files; T804 is documentation-only.
- **Phase 9 (Reconciliation — added 2026-06-17)**: Depends on Phase 5, Phase 5b, and Phase 6 having already produced files for Phase 9 to MUTATE. T901 mutates `create-release.yml` (the release-body step); T902 mutates `production.yml` (`on:` block, concurrency, checkout `ref:`); T903 adds a new `deploy` job to `create-release.yml` and a job-level `outputs:` to `release`; T904 verifies T901's bash logic offline; T905 mutates `docs/harness/ci-cd.md` sections 5 and 6; T906 reruns the contract grep suite (which the reopened T408, T502, T802 had marked stale).

### Task-level Dependencies

| Task | Depends on |
|------|------------|
| T100 | (none — absolute first task) |
| T101 | (none — `[P]` with T100 and T102) |
| T102 | (none — `[P]` with T100 and T101) |
| T201 | T101 |
| T202 | T201 |
| T203 | T202 |
| T204 | T203 |
| T301 | T101 |
| T302 | T301 |
| T303 | T302 |
| T304 | T303 |
| T401 | T100 (needs `version` in package.json), T101 |
| T402 | T401 |
| T403 | T402 |
| T404 | T403 |
| T405 | T404 |
| T406 | T405 |
| T407 | T406 |
| T408 | T407 |
| T501 | T302, T303 (mirrors preview.yml) — and Vercel major from T302 |
| T502 | T501 |
| T601 | T204, T304, T408, T502 (doc references workflows existing) |
| T602 | T601 |
| T603 | T602 |
| T604 | T603 |
| T605 | T604 |
| T606 | T605 |
| T607 | T606 |
| T608 | T607 |
| T609 | T608 |
| T701 | T204 |
| T702 | T701 |
| T801 | T204, T304, T408, T502, T702 |
| T802 | T801 |
| T803 | T100, T101, T102 (no app code change is asserted) |
| T804 | (documentation only; no code dependency) |
| T901 | T405 (bump step needs to exist before its outputs are extended), T407 (replaces the release-body step) |
| T902 | T501 (replaces the file's `on:` block and the checkout `ref:`) |
| T903 | T901 (the `release` job's `new_tag` step output must exist), T902 (the called workflow `production.yml` must accept the `tag` input) |
| T904 | T901 (verifies the bash step the task installs) |
| T905 | T606, T607 (replaces phrasing introduced by those tasks) |
| T906 | T901, T902, T903, T905; reopens T408, T502, T802 (this task is the gate after Phase 9 is complete) |

### Parallel Opportunities

- **Within Phase 1**: T100, T101, T102 are mutually `[P]` — they touch different paths (`package.json` vs `.github/workflows/` vs `.gitignore`).
- **Phase 3 ↔ Phase 4 ↔ Phase 5**: independent in principle (different files: `ci.yml` vs `preview.yml` vs `create-release.yml`). All three can run truly concurrently after Phase 1. Phase 5b (`production.yml`) must wait for Phase 4 because T501 mirrors `preview.yml`.
- **Phase 6 ↔ Phase 7**: different files (`docs/harness/ci-cd.md` vs `.github/workflows/ci.yml`). Can interleave freely.
- **Phase 8 internal**: T801 and T803 are `[P]`.

---

## Parallel Example: After Phase 1, kick off Phases 3, 4, and 5 concurrently

```bash
# After T100 + T101 + T102 complete:
Track A (Phase 3 — ci.yml — US1):
  Task: T201 → T202 → T203 → T204
Track B (Phase 4 — preview.yml — US2):
  Task: T301 → T302 → T303 → T304
Track C (Phase 5 — create-release.yml — US3 release half):
  Task: T401 → T402 → T403 → T404 → T405 → T406 → T407 → T408
# Tracks A, B, and C touch different files and can run truly concurrently.
# Phase 5b (production.yml — T501, T502) waits for Track B to finish.
```

---

## Implementation Strategy

### MVP First (US1 + US2 + US3 — all are P1)

1. Complete Phase 1 (T100, T101, T102).
2. Complete Phase 3 (T201–T204) — `ci.yml` MVP shipped.
3. Complete Phase 4 (T301–T304) — `preview.yml` MVP shipped.
4. Complete Phase 5 (T401–T408) — `create-release.yml` MVP shipped.
5. Complete Phase 5b (T501, T502) — `production.yml` MVP shipped.
6. **STOP and VALIDATE**: the three MVP user stories are now structurally complete. The human can begin the T804.1 + T804.3 verification at this point if desired (set up `dev`/`prd` environments, then dispatch the first "Create release").

### Incremental Delivery

1. MVP (above) → Test independently → Demo to the human for first-pass review.
2. Add Phase 6 (US4 — doc) → Hand the doc to the human for retrieval-procedure dry-run.
3. Add Phase 7 (US5 — Storybook job) → Verify the parallel job reports independently.
4. Complete Phase 8 → Ready for merge.

### Parallel Team Strategy

This feature is small enough that a single implementer is the right shape. If the implementer chooses to parallelize, Tracks A (Phase 3), B (Phase 4), and C (Phase 5) can all run concurrently after Phase 1 because they touch four distinct files (`ci.yml`, `preview.yml`, `create-release.yml`).

---

## Notes

- The implementer NEVER sees or types a Vercel credential. The closest reference is `${{ secrets.VERCEL_TOKEN }}` in YAML.
- The Vercel CLI major chosen in T302 MUST be re-used byte-for-byte in T501. If the CLI major has changed by the time T501 is reached, the implementer updates BOTH `preview.yml` and `production.yml` and notes the choice in a YAML comment at the top of each file.
- `create-release.yml` MUST NOT call the Vercel CLI. Its responsibilities end at "create the tag + GitHub Release"; the deploy lives in `production.yml`, which is triggered exclusively by the tag push.
- `production.yml`'s `on:` block MUST contain EXACTLY `workflow_call:` and `workflow_dispatch:` (each with a required `tag` input). It MUST NOT contain `push:`, `tags:`, or `branches:`. The tag-trigger model was REJECTED in the 2026-06-17 design revision (see research.md "Workflow chaining: workflow_call over tag-triggered"). Pushing a commit directly to `master` does NOT trigger a production deploy. Pushing a tag directly to the repository does NOT trigger a production deploy either — the deploy runs only via `create-release.yml`'s chained `deploy` job (which uses `workflow_call`) or via a maintainer's explicit `workflow_dispatch` from the GitHub UI.
- Tasks T601–T609 all edit the same file (`docs/harness/ci-cd.md`); none of them are marked `[P]`. The doc is built one section at a time in section order.
- Each implementation task carries its own verification command — the implementer runs the verification command before checking off the task.
- The T804 follow-ups are deliberately NOT tasks. They are documented here so a future reader (the human, a reviewer, a new implementer) sees the full "what was done vs what remains" picture at a glance.
- After all tasks complete, the spec author flips `feature_list.json` id=9 status from `spec_ready` to `done` ONLY after the human signs off on T804.3 (live verification, including the first "Create release" dispatch). The implementer never flips the status to `done` themselves — per the leader-agent contract in `CLAUDE.md`.
