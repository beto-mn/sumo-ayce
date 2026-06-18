# Data Model — Feature 009: CI/CD via GitHub Actions + Vercel CLI

This feature does not introduce any domain entities (no database tables, no API resources, no Vue components). The "data" of this feature is the structural shape of the four workflow YAML files, the one new harness documentation file, the `package.json` `version` field, the `.gitignore` rule, and the two GitHub Environments. They are documented here as structural artifacts so the implementer has a single source for the shape they need to produce.

For the runtime contract (required jobs, steps, secrets, outputs), see `contracts/workflows.md`.

---

## 1. Workflow file: `.github/workflows/ci.yml`

### Purpose

The cloud formalization of `./init.sh`. Runs on every pull-request event, reports lint / typecheck / test / build / storybook-build status on the PR.

### Top-level structure

| Field | Value |
|---|---|
| `name` | `CI` |
| `on` | `pull_request:` (no branch filter — runs against any base branch) |
| `permissions` | `contents: read` (read-only; no deployment, no PR comment write) |
| `concurrency` | group=`${{ github.workflow }}-${{ github.ref }}`, cancel-in-progress=`true` |
| `jobs` | `verify` (lint+typecheck+test+build, single job for shared install cache), `storybook` (parallel) |

### Jobs

#### `verify`

- `runs-on: ubuntu-latest`
- Steps (in order):
  1. `actions/checkout@v4`
  2. `pnpm/action-setup@v4` (no `run_install` flag — install runs explicitly below)
  3. `actions/setup-node@v4` with `node-version: 20`, `cache: 'pnpm'`
  4. `pnpm install --frozen-lockfile`
  5. `pnpm check` (Biome lint + format check)
  6. `pnpm typecheck` (vue-tsc)
  7. `pnpm test` (Vitest — must report ≥226 passing tests; below floor → fail)
  8. `pnpm build` (Nuxt build — surfaces PR-time build failures since deploy workflows do not run on PR events; see research.md R2)

#### `storybook`

- `runs-on: ubuntu-latest`
- Does NOT declare `needs: [verify]` — runs in parallel.
- Steps (in order):
  1. `actions/checkout@v4`
  2. `pnpm/action-setup@v4`
  3. `actions/setup-node@v4` with `node-version: 20`, `cache: 'pnpm'`
  4. `pnpm install --frozen-lockfile`
  5. `pnpm storybook:build`

### Required secrets

**None.** `ci.yml` does not contact Vercel. It runs entirely against public dependencies.

---

## 2. Workflow file: `.github/workflows/preview.yml`

### Purpose

On every push to `develop`, deploys the codebase to a Vercel preview environment and surfaces the preview URL on the GitHub commit. Scoped to the `dev` GitHub Environment.

### Top-level structure

| Field | Value |
|---|---|
| `name` | `Preview Deploy` |
| `on` | `push:` to `branches: [develop]` |
| `permissions` | `contents: read`, `deployments: write` |
| `concurrency` | group=`${{ github.workflow }}-${{ github.ref }}`, cancel-in-progress=`true` |
| `env` | `VERCEL_ORG_ID: ${{ secrets.VERCEL_ORG_ID }}`, `VERCEL_PROJECT_ID: ${{ secrets.VERCEL_PROJECT_ID }}` |
| `jobs` | `deploy` (declares `environment: dev`) |

### Jobs

#### `deploy`

- `runs-on: ubuntu-latest`
- `environment: dev` (scopes secret access to the `dev` GitHub Environment)
- Steps (in order):
  1. `actions/checkout@v4`
  2. `pnpm/action-setup@v4`
  3. `actions/setup-node@v4` with `node-version: 20`, `cache: 'pnpm'`
  4. `pnpm install --frozen-lockfile`
  5. `npx vercel@<major> pull --yes --environment=preview --token=${{ secrets.VERCEL_TOKEN }}`
  6. `npx vercel@<major> build --token=${{ secrets.VERCEL_TOKEN }}`
  7. `npx vercel@<major> deploy --prebuilt --token=${{ secrets.VERCEL_TOKEN }}` — capture stdout's final line as job output `preview_url`
  8. `actions/github-script@v7` — create GitHub Deployment + DeploymentStatus with `environment: 'preview'` and `environment_url: ${{ needs.deploy.outputs.preview_url }}` (or the equivalent intra-job reference if no separate job is used)

### Required secrets

- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`

### Outputs

- `preview_url` — string, the Vercel preview URL (e.g. `https://sumo-ayce-abc123-team.vercel.app`).

---

## 3. Workflow file: `.github/workflows/production.yml`

### Purpose

When `create-release.yml` pushes a tag matching `v*` to the repo, deploys the codebase at that tag to the Vercel production environment. Triggered EXCLUSIVELY by tag pushes — NOT by branch pushes (including `master`). Scoped to the `prd` GitHub Environment.

### Top-level structure

| Field | Value |
|---|---|
| `name` | `Production Deploy` |
| `on` | `push:` to `tags: ['v*']` (NO `branches:` key — branch pushes do NOT trigger this workflow) |
| `permissions` | `contents: read`, `deployments: write` |
| `concurrency` | group=`${{ github.workflow }}-${{ github.ref }}`, cancel-in-progress=`true` |
| `env` | `VERCEL_ORG_ID: ${{ secrets.VERCEL_ORG_ID }}`, `VERCEL_PROJECT_ID: ${{ secrets.VERCEL_PROJECT_ID }}` |
| `jobs` | `deploy` (declares `environment: prd`) |

### Jobs

#### `deploy`

- `runs-on: ubuntu-latest`
- `environment: prd` (scopes secret access to the `prd` GitHub Environment)
- Steps (in order):
  1. `actions/checkout@v4` with `ref: ${{ github.ref }}` (checks out the tag, not master HEAD)
  2. `pnpm/action-setup@v4`
  3. `actions/setup-node@v4` with `node-version: 20`, `cache: 'pnpm'`
  4. `pnpm install --frozen-lockfile`
  5. `npx vercel@<major> pull --yes --environment=production --token=${{ secrets.VERCEL_TOKEN }}`
  6. `npx vercel@<major> build --prod --token=${{ secrets.VERCEL_TOKEN }}`
  7. `npx vercel@<major> deploy --prebuilt --prod --token=${{ secrets.VERCEL_TOKEN }}` — capture stdout's final line as job output `production_url`
  8. `actions/github-script@v7` — create GitHub Deployment + DeploymentStatus with `environment: 'production'` (the Deployments-API value, distinct namespace from the `prd` GitHub Environment) and `environment_url: ${{ outputs.production_url }}` (mainly useful for the Deployments tab; production URL is the live domain anyway)

### Required secrets

Read from the `prd` GitHub Environment:

- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`

### Outputs

- `production_url` — string, the canonical Vercel production URL (typically aliased by Vercel to the custom domain).

---

## 3a. Workflow file: `.github/workflows/create-release.yml`

### Purpose

Manual release ceremony triggered from the GitHub UI via `workflow_dispatch`. Bumps `package.json`'s `version`, commits with `[skip ci]`, tags `v<X.Y.Z>`, pushes both, and creates a GitHub Release object. Does NOT contact Vercel — the tag push triggers `production.yml` separately. The maintainer's only touchpoint is the GitHub UI.

### Top-level structure

| Field | Value |
|---|---|
| `name` | `Create release` |
| `on` | `workflow_dispatch:` with three inputs (NO other triggers — no `push`, no `pull_request`, no `schedule`) |
| `permissions` | `contents: write` (sufficient to push commit + push tag + create GitHub Release via `GITHUB_TOKEN`) |
| `concurrency` | (none required — `workflow_dispatch` runs are explicitly initiated and serialised by GitHub's default) |
| `env` | (none — no Vercel secrets needed) |
| `jobs` | `release` |

### `workflow_dispatch` inputs

| Input | Type | Required | Default | Description |
|---|---|---|---|---|
| `version_bump` | `choice` (`patch`, `minor`, `major`) | yes | (none — maintainer picks) | The semver position to bump in `package.json`. |
| `release_description` | `string` (multi-line) | yes | (none) | "What changed in this release." Becomes the GitHub Release body. Markdown supported. |
| `additional_notes` | `string` (multi-line) | no | `""` (empty) | "Breaking changes, migration guide." If non-empty, appended under `## Additional notes` in the Release body. |

### Jobs

#### `release`

- `runs-on: ubuntu-latest`
- `if: github.ref == 'refs/heads/master'` (FR-010c — branch guard refusing dispatches from non-master)
- NO `environment:` declared (the workflow does not contact Vercel; secrets come from `GITHUB_TOKEN` only)
- Steps (in order):
  1. `actions/checkout@v4` with `fetch-depth: 0`, `ref: master`, `token: ${{ secrets.GITHUB_TOKEN }}` (full history for tag operations; explicit `ref: master` defends against branch-guard bypass)
  2. `pnpm/action-setup@v4`
  3. `actions/setup-node@v4` with `node-version: 20`, `cache: 'pnpm'`
  4. `pnpm install --frozen-lockfile`
  5. `pnpm check` (quality gate — fail = no release)
  6. `pnpm typecheck`
  7. `pnpm test`
  8. `pnpm build`
  9. Configure git identity (`user.name: "github-actions[bot]"`, `user.email: "41898282+github-actions[bot]@users.noreply.github.com"`)
  10. `npm version ${{ inputs.version_bump }} --no-git-tag-version` (the flag is REQUIRED — workflow creates its own annotated tag). Capture the new version as step output `new_version` (`NEW_VERSION=$(node -p "require('./package.json').version")`, `echo "new_version=$NEW_VERSION" >> "$GITHUB_OUTPUT"`). Give the step `id: bump`.
  11. Stage + commit + tag + push: `git add package.json pnpm-lock.yaml || git add package.json`, `git commit -m "🔖 chore(release): v${{ steps.bump.outputs.new_version }} [skip ci]"`, `git tag -a "v${{ steps.bump.outputs.new_version }}" -m "Release v${{ steps.bump.outputs.new_version }}"`, `git push origin master`, `git push origin "v${{ steps.bump.outputs.new_version }}"`
  12. Build the release body via a small bash step: `body="${{ inputs.release_description }}"; if [ -n "${{ inputs.additional_notes }}" ]; then body+=$'\n\n## Additional notes\n\n'"${{ inputs.additional_notes }}"; fi; echo "$body" > /tmp/release_body.md`. Give the step `id: body`.
  13. Create the GitHub Release via `softprops/action-gh-release@v2` with `tag_name: v${{ steps.bump.outputs.new_version }}`, `name: v${{ steps.bump.outputs.new_version }}`, `body_path: /tmp/release_body.md`, `draft: false`, `prerelease: false`.

### Required secrets

- `GITHUB_TOKEN` (built-in, automatically populated by GitHub Actions when `permissions: contents: write` is declared)
- NO Vercel secrets (the workflow does not deploy)

### Outputs

- `new_version` (intermediate step output, not exported at job level) — the bumped version string (e.g. `0.1.1`).

### Side effects (written to the GitHub repository)

- One new commit on `master` modifying `package.json` (and `pnpm-lock.yaml` if `npm version` ever touches it — verified to NOT touch it in R11) with commit message `🔖 chore(release): v<X.Y.Z> [skip ci]`.
- One new annotated git tag `v<X.Y.Z>` pointing at that commit.
- One new GitHub Release object with `tag_name: v<X.Y.Z>`, body constructed from inputs.

### What's NOT written

- No Vercel calls.
- No package publishes.
- No changes to `app/**`, `server/**`, `types/**`, `tests/**`, `nuxt.config.ts`, `vitest.config.ts`, `biome.json`, or `.specify/**`.
- No changes to other workflow files.

---

## 4. Documentation file: `docs/harness/ci-cd.md`

### Purpose

Single source for everything a human needs to operate or hand over this pipeline.

### Section breakdown (the implementer renders these in this order)

| Section | Content |
|---|---|
| **1. Overview** | Brief: four workflows, CLI-only Vercel coupling, three GitHub secrets scoped to two GitHub Environments (`dev` and `prd`), manual release ceremony for production. State the handover contract explicitly. |
| **2. Required GitHub secrets** | Table of three secrets with: name, type (string), purpose, where to retrieve, and the environments each is scoped to (every secret has one copy in `dev` and one in `prd`). |
| **2.1 Retrieving `VERCEL_TOKEN`** | Steps: navigate to `https://vercel.com/account/tokens` → Create Token → scope to "Full Account" (Personal) or to the team workspace owning this project → name it `sumo-ayce-gha-dev` (for the `dev` copy) and `sumo-ayce-gha-prd` (for the `prd` copy; two distinct tokens recommended, same token also acceptable) → set expiry per the team's secret-rotation policy → copy and paste into GitHub repo Settings → Environments → `dev` (or `prd`) → Environment secrets → Add secret named `VERCEL_TOKEN`. |
| **2.2 Retrieving `VERCEL_ORG_ID`** | Two options: (a) run `vercel link` locally and read `.vercel/project.json`'s `orgId` field, then `rm -rf .vercel/` (since this folder is gitignored, removal is for safety); (b) in the Vercel dashboard, navigate to Team → Settings → General → Team ID. Same value typically pasted into both `dev` and `prd` GitHub Environments. |
| **2.3 Retrieving `VERCEL_PROJECT_ID`** | Two options: (a) `.vercel/project.json`'s `projectId` field after `vercel link`; (b) Vercel dashboard → Project → Settings → General → Project ID. Same value typically pasted into both `dev` and `prd` GitHub Environments. |
| **3. Creating the GitHub Environments and adding the secrets** | Step-by-step: (a) GitHub repo → Settings → Environments → New environment → name exactly `dev` (lowercase) → save; (b) repeat for `prd`; (c) for each environment, add the three secrets via Environment secrets → Add secret (NOT Repository secrets — the workflows reference environment-scoped secrets via `environment: dev` / `environment: prd`); (d) note that secret values cannot be read back after saving — store the originals in the team password manager; (e) note that required-reviewers protection on `prd` is available in the environment settings but is NOT enabled by this feature. |
| **4. Recommended branch-protection rules (RECOMMENDATION ONLY)** | Recommend: require status checks `verify` and `storybook` to pass before merging into `master` (and optionally `develop`); require linear history on `master`; restrict pushes to `master` to approved PRs only AND to the `github-actions[bot]` actor (because `create-release.yml` itself pushes a commit to `master` via `GITHUB_TOKEN` — branch protection must allow this); do not require signed commits unless the team already uses them. This is a recommendation — enabling it requires repo admin permissions and is performed manually by the repo owner, outside this codebase. |
| **5. How to ship to production** | Step-by-step: (1) open GitHub → Actions → "Create release"; (2) click "Run workflow"; (3) confirm branch is `master`; (4) pick `version_bump` (`patch | minor | major` — guidance on each); (5) fill `release_description` (markdown supported); (6) optionally fill `additional_notes` (markdown — appended under `## Additional notes`); (7) click "Run workflow". Within ~15 minutes confirm the tag `v<X.Y.Z>` exists, the GitHub Release exists, `production.yml` was triggered by the tag push, and Vercel `prd` serves the new build. Recovery path: if `production.yml` fails on the tag, re-run `production.yml` from the GitHub UI against the same tag — no new release ceremony needed. |
| **6. Post-merge verification procedure** | The six-step checklist from research.md R8 (UPDATED for the manual-release flow): (1) create `dev` + `prd` environments, (2) add three secrets to EACH environment, (3) open no-op PR + see five CI rows green, (4) push one-line change to `develop` + see preview URL on commit, (5) merge `develop` to `master`, (6) dispatch "Create release" with patch + description → confirm tag, GitHub Release, `production.yml` triggered on tag, live SUMO domain serves new build. |
| **7. Secret rotation** | Procedure to rotate `VERCEL_TOKEN` (the most-rotated of the three): generate a new token in the Vercel dashboard, update the secret value in EACH GitHub Environment that uses it (`dev`, `prd`), no workflow edits required. Old token can be revoked from the Vercel dashboard immediately. ORG and PROJECT IDs rotate only on Vercel project migration (rare). |
| **8. Handover to a new owner** | Step-by-step: (a) new owner is added to the GitHub repo as admin; (b) they create a Vercel project (or use an existing one) and retrieve the three values per §2; (c) they create the `dev` and `prd` GitHub Environments per §3 and overwrite the secrets in each; (d) original owner is removed from the Vercel team; (e) new owner pushes a test commit to `develop` and confirms a working preview URL; (f) new owner dispatches "Create release" once to confirm the production path. State: no source-controlled files need to change (including no changes to `package.json` — the `version` field already exists; the release workflow bumps from whatever value is current). |
| **9. Troubleshooting** | Common failure modes (auth failed, build failed, deploy timed out, preview URL not appearing, `create-release.yml` skipped because dispatch was from a non-master branch, tag exists but `production.yml` did not trigger) and the immediate fix or escalation path. The "authentication failed" fix is "rotate `VERCEL_TOKEN` in the relevant GitHub Environment per §7". |

### Constraints

- The doc MUST NOT contain any actual secret values, even illustrative ones. Use the placeholder convention `<your-token-here>`.
- The doc MUST cite Article VI of the constitution where it explains why secrets are not committed.
- The doc MUST cite Article IX where it explains why CI mirrors `./init.sh`.

---

## 5. `.gitignore` modification

Add a new line:

```
.vercel/
```

Place it next to the other "build/cache output" rules (between `.cache` and `dist` is the canonical location given the existing file structure). Rationale documented in research.md R7.

---

## 5a. `package.json` modification (NEW)

Insert a new top-level field `"version": "0.1.0"` between `"name"` and `"private"` (so the top-level field order becomes `"name"`, `"version"`, `"type"`, `"private"`, `"scripts"`, ...).

- **Seed value**: `"0.1.0"` (pre-1.0; promotes to `"1.0.0"` via a `major` bump when the client formally accepts the launch).
- **No other field changes**: no script additions, no dependency changes, no key reordering except the new field's insertion point.
- **Owner of further changes**: from this point onward, ONLY `create-release.yml` writes to the `version` field (via `npm version <patch|minor|major> --no-git-tag-version`). Manual edits are technically allowed but discouraged (a manual edit is silently observed by the next release as the new baseline).
- **Verification**:
  - `node -e 'console.log(require("./package.json").version)'` → prints `0.1.0`
  - `node -e 'const p=require("./package.json"); const keys=Object.keys(p); const i=keys.indexOf("version"); console.log(keys[i-1]==="name" && (keys[i+1]==="type" || keys[i+1]==="private"))'` → prints `true`
  - `./init.sh` → exits 0

---

## 5b. GitHub Environments (NEW)

The feature introduces two GitHub Environments in repo Settings → Environments. They are administered by a human admin; the workflows reference them by name.

| Environment | Used by | Required secrets |
|---|---|---|
| `dev` | `preview.yml`'s `deploy` job (declares `environment: dev`) | `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID` |
| `prd` | `production.yml`'s `deploy` job (declares `environment: prd`) | `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID` |

- **Both environments hold the same three secret names**, each with their own value (typically the same `ORG_ID` and `PROJECT_ID`; ideally a DIFFERENT `VERCEL_TOKEN` per environment so a leak does not compromise both tiers).
- **Required-reviewers protection** is available on `prd` (deferred to a future feature per FR-021).
- **No environment** is declared by `ci.yml` (no Vercel access required) or `create-release.yml` (only operates on the GitHub repo via `GITHUB_TOKEN`).

---

## 5c. Fields the workflows commit back to the repo (NEW)

`create-release.yml` is the ONLY workflow that writes to the repo. Its writes are scoped to:

| File | Field / area | Change shape | When |
|---|---|---|---|
| `package.json` | `version` (top-level field) | Bumped by `npm version <patch|minor|major> --no-git-tag-version` | Every successful "Create release" run |
| `pnpm-lock.yaml` | (entire file — staged defensively) | Expected: NO change (verified in research.md R11 via sha256 comparison on a throwaway worktree). Staged in the commit step purely as a defensive belt-and-suspenders measure in case a future npm version DOES touch it. | Same step |

Both files are added via `git add package.json pnpm-lock.yaml || git add package.json` (the `|| git add package.json` fallback handles the case where `pnpm-lock.yaml` has no changes — though `git add` on a non-modified file is a no-op in practice). The resulting commit is therefore exactly one file (`package.json`) under normal conditions and two files (`package.json` + `pnpm-lock.yaml`) only if a future npm version mutates the lockfile.

No other workflow writes to the repo. `ci.yml` is read-only (`permissions: contents: read`). `preview.yml` and `production.yml` are read-only (`permissions: contents: read, deployments: write` — `deployments: write` writes to the GitHub Deployments API surface, NOT to repository contents).

---

## 6. Files explicitly NOT modified by this feature

These are listed to make code review trivial and to prevent scope creep:

- `app/**` — no Vue component, page, or composable changes.
- `server/**` — no API route changes.
- `types/**` — no shared type changes.
- `tests/**` — no test changes; the existing 226 tests are the baseline the CI gate references.
- `pnpm-lock.yaml` — not regenerated; expected to be untouched by `create-release.yml`'s `npm version` (verified R11).
- `nuxt.config.ts` — no `routeRules` or other changes.
- `biome.json` — Biome config is untouched; CI runs the same `pnpm check` as locally.
- `vitest.config.ts` — Vitest config is untouched; CI runs the same `pnpm test` as locally.
- `.specify/**` — including `.specify/memory/constitution.md`.
- `init.sh` — not modified. CI mirrors it; it does not invoke CI.
- `CHECKPOINTS.md` — not modified by this feature (a future feature may add a CI-related checkpoint, but that is out of scope here).

Note: `package.json` IS modified by this feature (single insertion of the `version` field per §5a). No other field changes.
