# Quickstart — Feature 009: CI/CD via GitHub Actions + Vercel CLI

A six-step walkthrough for the implementer. Each step is independently verifiable; do not start the next until the current step's verification passes. The contracts in `contracts/workflows.md` are the authoritative checklist — this file is the suggested order. (Note: the original five-step walkthrough was expanded to six to insert the new `create-release.yml` workflow between `preview.yml` and `production.yml`.)

---

## Step 1 — Setup: insert `package.json` version, create the workflows folder, update `.gitignore`

```bash
# From repo root

# 1a — insert "version": "0.1.0" into package.json (between "name" and "private")
# Use your editor to make this surgical change; do NOT regenerate or reformat the file.

# 1b — create the workflows folder
mkdir -p .github/workflows

# 1c — edit .gitignore and add `.vercel/` next to the other "build/cache output" rules
# (between the `.cache` rule and the `dist` rule is the canonical placement given the current file structure).
```

**Verification**:

```bash
# package.json version field
node -e 'console.log(require("./package.json").version)'  # must print 0.1.0
node -e 'const k=Object.keys(require("./package.json")); const i=k.indexOf("version"); console.log(k[i-1]==="name" && (k[i+1]==="type" || k[i+1]==="private"))'  # must print true

# Workflows folder
test -d .github/workflows && echo OK

# .gitignore rule
grep -E '^\.vercel/$' .gitignore && echo OK
```

All four commands must print their respective success indicator. `package.json` carries `"version": "0.1.0"`; the workflows folder exists; the gitignore rule is present.

---

## Step 2 — Implement `ci.yml`

Write `.github/workflows/ci.yml` per `data-model.md` §1 and contract §C1.

Key checklist (skim — full list in `contracts/workflows.md` §C1):

- `on: pull_request:` with NO `branches:` filter.
- Top-level `permissions: contents: read`.
- Top-level `concurrency: group: ${{ github.workflow }}-${{ github.ref }}` with `cancel-in-progress: true`.
- `verify` job (single job containing all four checks for shared install cache): checkout → pnpm setup → setup-node@v4 (`node-version: 20`, `cache: 'pnpm'`) → `pnpm install --frozen-lockfile` → `pnpm check` → `pnpm typecheck` → `pnpm test` → `pnpm build`.
- `storybook` job (parallel — no `needs:`): same install steps, then `pnpm storybook:build`.

**Verification**:

```bash
# Structural YAML
python3 -c "import yaml; yaml.safe_load(open('.github/workflows/ci.yml'))" && echo OK
# OR if actionlint is installed
actionlint .github/workflows/ci.yml

# Contract grep checks (subset — full list in contracts/workflows.md §C7)
grep -E 'pull_request:' .github/workflows/ci.yml
grep -E 'node-version: 20' .github/workflows/ci.yml
grep -E 'pnpm install --frozen-lockfile' .github/workflows/ci.yml
grep -E 'cancel-in-progress: true' .github/workflows/ci.yml
```

Each contract grep must return at least one match.

---

## Step 3 — Implement `preview.yml`

Write `.github/workflows/preview.yml` per `data-model.md` §2 and contract §C2.

Key checklist:

- `on: push: branches: [develop]`.
- Top-level `permissions: contents: read, deployments: write`.
- Top-level `concurrency` block.
- Top-level `env:` exposing `VERCEL_ORG_ID` and `VERCEL_PROJECT_ID` from secrets.
- `deploy` job declares `environment: dev` (scopes secrets to the `dev` GitHub Environment).
- `deploy` job: checkout → pnpm setup → setup-node@v4 → `pnpm install --frozen-lockfile` → `npx vercel@<major> pull --yes --environment=preview --token=${{ secrets.VERCEL_TOKEN }}` → `npx vercel@<major> build --token=${{ secrets.VERCEL_TOKEN }}` → `npx vercel@<major> deploy --prebuilt --token=${{ secrets.VERCEL_TOKEN }}` (capture stdout's final line as step output `preview_url`) → `actions/github-script@v7` step calling `repos.createDeployment` + `repos.createDeploymentStatus` with `environment: 'preview'` and `environment_url: <preview_url>`.

The Vercel CLI major version: pin to the current stable major (at the time of writing: `34`). Use the exact same major in `production.yml` (contract C7.3).

**Verification**:

```bash
actionlint .github/workflows/preview.yml  # if available, otherwise yaml.safe_load
grep -E 'npx vercel@[0-9]+' .github/workflows/preview.yml
grep -E 'deployments: write' .github/workflows/preview.yml
grep -E 'environment=preview' .github/workflows/preview.yml
grep -E '^\s*environment:\s*dev\s*$' .github/workflows/preview.yml  # GitHub Environment scope
# Confirm token usage is via secrets, not bare:
grep -c 'secrets.VERCEL_TOKEN' .github/workflows/preview.yml  # must be >= 3 (pull + build + deploy)
```

---

## Step 4 — Implement `create-release.yml`

Write `.github/workflows/create-release.yml` per `data-model.md` §3a and contract §C4. This is the manual release ceremony — triggered ONLY by `workflow_dispatch`. It does NOT call Vercel.

Key checklist:

- `on: workflow_dispatch:` with EXACTLY three inputs: `version_bump` (required `choice` `[patch, minor, major]`), `release_description` (required string), `additional_notes` (optional string).
- Top-level `permissions: contents: write` (minimum required for commit + tag + Release creation via `GITHUB_TOKEN`).
- NO top-level `env:` (no Vercel secrets needed in the `release` job; secrets reach `production.yml` via `secrets: inherit` on the `deploy` job).
- The `release` job declares NO `environment:` (it operates on the GitHub repo only). The `deploy` job inherits the `prd` environment from `production.yml` itself.
- TWO jobs total: `release` (the ceremony) and `deploy` (calls `production.yml`).
- `release` job declares `if: github.ref == 'refs/heads/master'` (branch guard refusing dispatches from non-master) AND `outputs: { tag: ${{ steps.bump.outputs.new_tag }} }` so the `deploy` job can consume the new tag.
- `release` job steps: checkout (with `fetch-depth: 0`, `ref: master`) → pnpm setup → setup-node@v4 → `pnpm install --frozen-lockfile` → `pnpm check` → `pnpm typecheck` → `pnpm test` → `pnpm build` → configure git identity → `npm version ${{ inputs.version_bump }} --no-git-tag-version` (capture `new_version` AND `new_tag=v${NEW_VERSION}` as step outputs from `id: bump`) → `git add` + `git commit -m "🔖 chore(release): v<X.Y.Z> [skip ci]"` + `git tag -a v<X.Y.Z> -m ...` + `git push origin master` + `git push origin v<X.Y.Z>` → bash step that generates `release_body.md` (in the checked-out repo's working directory, NOT `/tmp/`) per the FR-010g-body template (with the `{EMOJI}` / `{Type}` mapping from FR-010g-emoji, the commit history block from FR-010g-history using `HEAD^`, and the conditional Additional Notes block from FR-010g-additional-notes) AND derives `RELEASE_TYPE_TITLE` from `inputs.version_bump` for the `name:` field → `softprops/action-gh-release@v2` with `tag_name: v<X.Y.Z>`, `name: 🚀 v<X.Y.Z> - <Patch|Minor|Major> Release (Production)`, `body_path: release_body.md`, `draft: false`, `prerelease: false`.
- `deploy` job: `needs: release`, `uses: ./.github/workflows/production.yml`, `with: { tag: ${{ needs.release.outputs.tag }} }`, `secrets: inherit`. `secrets: inherit` is REQUIRED so the called workflow can access `VERCEL_TOKEN`/`VERCEL_ORG_ID`/`VERCEL_PROJECT_ID`.

**Verification**:

```bash
actionlint .github/workflows/create-release.yml  # if available
# Trigger is workflow_dispatch ONLY
grep -E 'workflow_dispatch:' .github/workflows/create-release.yml
! grep -E '^\s*(push|pull_request|schedule):' .github/workflows/create-release.yml
# Three inputs by name
python3 -c "import yaml; d=yaml.safe_load(open('.github/workflows/create-release.yml')); inputs=d['on']['workflow_dispatch']['inputs']; assert set(inputs.keys())=={'version_bump','release_description','additional_notes'}; print('OK')"
# Branch guard
grep -E "if:\s*github\.ref\s*==\s*'refs/heads/master'" .github/workflows/create-release.yml
# Permissions
grep -E 'contents:\s*write' .github/workflows/create-release.yml
# Quality gate runs before bump
grep -c -E 'run: pnpm (check|typecheck|test|build)' .github/workflows/create-release.yml  # must be 4
# Bump command shape
grep -E 'npm version \$\{\{ inputs\.version_bump \}\} --no-git-tag-version' .github/workflows/create-release.yml
# [skip ci] in commit message
grep -E '\[skip ci\]' .github/workflows/create-release.yml
# GitHub Release creator pinned to v2
grep -E 'softprops/action-gh-release@v2' .github/workflows/create-release.yml
# NO Vercel calls (the release ceremony does NOT contact Vercel directly)
! grep -E 'npx vercel' .github/workflows/create-release.yml
# Workflow chaining: release job exposes tag output, deploy job calls production.yml with that tag
grep -E 'uses: \./\.github/workflows/production\.yml' .github/workflows/create-release.yml
grep -E 'secrets: inherit' .github/workflows/create-release.yml
grep -E 'needs: release' .github/workflows/create-release.yml
# Release name title format
grep -E 'name:.*🚀 v.*Release \(Production\)' .github/workflows/create-release.yml
# Commit history uses HEAD^ (excludes the release commit itself)
grep -E 'git log .*HEAD\^' .github/workflows/create-release.yml
# Deployment block has no Region line
! grep -E '^\s*-\s*\*\*Region\*\*' .github/workflows/create-release.yml
```

---

## Step 5 — Implement `production.yml` (`workflow_call` + `workflow_dispatch`)

Write `.github/workflows/production.yml` per `data-model.md` §3 and contract §C3. Structure mirrors `preview.yml` with these deltas:

1. `on:` declares EXACTLY two triggers — `workflow_call:` and `workflow_dispatch:` — each with a required `tag` input of type `string`. NO `push:`, NO `tags:`, NO `branches:`. Pushing to `master` or pushing a tag directly does NOT trigger this workflow. The tag-trigger model is REJECTED — see `research.md` "Workflow chaining: workflow_call over tag-triggered".
2. `deploy` job declares `environment: prd` (scopes secrets to the `prd` GitHub Environment).
3. Checkout uses `ref: ${{ inputs.tag }}` so the tagged commit is checked out (NOT `github.ref`, NOT master HEAD). The `inputs.tag` value is provided by `create-release.yml`'s `workflow_call` invocation or by a maintainer's `workflow_dispatch` input.
4. `concurrency.group` uses `${{ github.workflow }}-${{ inputs.tag }}` (NOT `github.ref` — the tag is the canonical identifier).
5. `vercel pull --environment=production` (not `preview`).
6. `vercel build --prod` and `vercel deploy --prebuilt --prod`.
7. `actions/github-script@v7` uses Deployments-API value `environment: 'production'` (distinct namespace from the `prd` GitHub Environment); pass `ref: inputs.tag` to `createDeployment` (so the deployment record points at the tag, not at `github.sha`).

**Verification**:

```bash
actionlint .github/workflows/production.yml
# Triggers
grep -E '^\s*workflow_call:' .github/workflows/production.yml
grep -E '^\s*workflow_dispatch:' .github/workflows/production.yml
# NEGATIVE assertions — none of these may appear under on:
! grep -E '^\s*push:' .github/workflows/production.yml
! grep -E '^\s*tags:' .github/workflows/production.yml
! grep -E '^\s*branches:' .github/workflows/production.yml
# Checkout uses inputs.tag
grep -E 'ref:\s*\$\{\{\s*inputs\.tag\s*\}\}' .github/workflows/production.yml
# GitHub Environment scope
grep -E '^\s*environment:\s*prd\s*$' .github/workflows/production.yml
grep -E 'environment=production' .github/workflows/production.yml
grep -E 'vercel build --prod' .github/workflows/production.yml
grep -E 'vercel deploy --prebuilt --prod' .github/workflows/production.yml
# Same CLI major as preview.yml (contract C7.3)
diff <(grep -oE 'npx vercel@[0-9]+' .github/workflows/preview.yml | sort -u) \
     <(grep -oE 'npx vercel@[0-9]+' .github/workflows/production.yml | sort -u) && echo OK
```

---

## Step 6 — Write `docs/harness/ci-cd.md` and verify the whole feature

Write `docs/harness/ci-cd.md` per `data-model.md` §4 and contract §C6. Nine sections in this order: Overview → Required GitHub secrets → Retrieval procedures (×3, one per secret) → Creating the GitHub Environments and adding the secrets → Recommended branch-protection rules (RECOMMENDATION ONLY) → How to ship to production → Post-merge verification procedure → Secret rotation → Handover procedure → Troubleshooting.

The file must:

- Cite Article VI of the constitution where it explains why secrets are not committed.
- Cite Article IX where it explains why CI mirrors `./init.sh`.
- Use placeholder values like `<your-token-here>` — NEVER include a real or example token value.
- Document the `dev` and `prd` GitHub Environment naming convention (these are the names the human's other projects use; reuse them in the secrets-setup section).

---

## How to ship to production (human-facing summary — also documented in the harness doc)

1. Open GitHub → Actions → "Create release" workflow.
2. Click "Run workflow".
3. Confirm the branch dropdown is `master` (the workflow refuses other branches).
4. Pick `version_bump`:
   - `patch` (0.1.0 → 0.1.1) — bug fixes, minor copy tweaks, dependency bumps.
   - `minor` (0.1.0 → 0.2.0) — new pages/features that are backward-compatible.
   - `major` (0.1.0 → 1.0.0 or 1.2.3 → 2.0.0) — breaking changes, post-acceptance promotion to 1.0.0, or any user-visible behavior change that requires migration.
5. Fill `release_description` (required, multi-line, markdown supported) — becomes the body of the `## 📝 Changes` section in the GitHub Release.
6. Optionally fill `additional_notes` (multi-line, markdown supported) — when non-empty, inserted as a `## 📌 Additional Notes` section before the bot signature.
7. Click "Run workflow".
8. Wait for BOTH the `release` job AND the `deploy` job (both inside the same workflow run) to complete. The Actions UI shows both jobs sequentially under one run.

### How to redeploy an existing tag (deploy-only retry)

When the `release` job has already created the tag + GitHub Release but the `deploy` job failed transiently (Vercel API hiccup, edge cache cold start, network blip), the maintainer can redeploy the same tag without re-doing the release ceremony:

1. Open GitHub → Actions → "Production Deploy" workflow.
2. Click "Run workflow" (this is the `workflow_dispatch` trigger of `production.yml`).
3. Input the existing tag value (e.g. `v1.0.107` — the tag that the failed run created).
4. Click "Run workflow".

The deploy runs against the same tag, no new tag is created, no new GitHub Release object is created, and `package.json`'s `version` is not bumped. The tag is the immutable contract; the deploy is the retryable operation.

---

## Example: rendered release note

For a `patch` bump from `v0.1.0` → `v0.1.1`, with `release_description: "Bug fix in checkout flow"` and `additional_notes: "Run pnpm install before deploying."`, the workflow produces:

- **GitHub Release name** (the `name:` field): `🚀 v0.1.1 - Patch Release (Production)`
- **GitHub Release body** (the rendered `release_body.md`):

```markdown
## 🐛 Patch Release

**Version**: `v0.1.1`
**Type**: Bug fixes
**Environment**: 🚀 Production

---

## 📝 Changes

Bug fix in checkout flow

## 📋 Commit History

- fix: handle empty cart in checkout (a1b2c3d)
- chore: bump biome (4e5f6a7)

**Full Changelog**: https://github.com/<owner>/sumo-ayce/compare/v0.1.0...v0.1.1

---

### 🚀 Deployment

This release will be automatically deployed to **Production**.

- **Environment**: `prd`
- **Service**: `sumo-ayce`

---

## 📌 Additional Notes

Run pnpm install before deploying.

---

🤖 *This release was created by @<actor> via GitHub Actions*
```

If `additional_notes` is empty, the Additional Notes section (heading, content, AND its leading `---` separator) is omitted entirely — the body ends directly with the Deployment block, the `---` separator, and the bot signature.

For a `minor` bump the title is `🚀 v<X.Y.Z> - Minor Release (Production)`, the body header is `## ✨ Minor Release`, and the type is `Minor enhancements`. For a `major` bump the title is `🚀 v<X.Y.Z> - Major Release (Production)`, the body header is `## 🚨 Major Release`, and the type is `Major release / breaking changes`.

For the FIRST release ever (no previous tag exists), the `Full Changelog` URL is `https://github.com/<owner>/sumo-ayce/commits/v0.1.0` (link to commits view) and the commit history is the most recent 50 commits since repo init.

---

## Final verification (all of Phase 8)

```bash
# All five files exist (four workflows + harness doc)
test -f .github/workflows/ci.yml && \
test -f .github/workflows/preview.yml && \
test -f .github/workflows/production.yml && \
test -f .github/workflows/create-release.yml && \
test -f docs/harness/ci-cd.md && echo "Files OK"

# package.json has version field
node -e 'if (!require("./package.json").version) process.exit(1); console.log("version OK")'

# .gitignore has .vercel/ rule
grep -E '^\.vercel/$' .gitignore && echo "Gitignore OK"

# Environment scoping is correct
grep -E '^\s*environment:\s*dev\s*$' .github/workflows/preview.yml
grep -E '^\s*environment:\s*prd\s*$' .github/workflows/production.yml
! grep -E '^\s*environment:\s*(dev|prd)\s*$' .github/workflows/ci.yml
! grep -E '^\s*environment:\s*(dev|prd)\s*$' .github/workflows/create-release.yml

# production.yml is workflow_call + workflow_dispatch — NEVER tag-triggered, NEVER branch-triggered
grep -E '^\s*workflow_call:' .github/workflows/production.yml
grep -E '^\s*workflow_dispatch:' .github/workflows/production.yml
! grep -E '^\s*push:' .github/workflows/production.yml
! grep -E '^\s*tags:' .github/workflows/production.yml
! grep -E '^\s*branches:' .github/workflows/production.yml

# create-release.yml does NOT call Vercel directly; instead chains to production.yml
! grep -E 'npx vercel' .github/workflows/create-release.yml
grep -E 'uses: \./\.github/workflows/production\.yml' .github/workflows/create-release.yml
grep -E 'secrets: inherit' .github/workflows/create-release.yml

# No bare secret values anywhere outside specs/, docs/, .git/
grep -REn --include='*.yml' --include='*.yaml' --include='*.ts' --include='*.json' --include='*.md' \
  -e 'VERCEL_TOKEN' -e 'VERCEL_ORG_ID' -e 'VERCEL_PROJECT_ID' . \
  | grep -vE '^(\./specs/|\./docs/|\./\.git/)' \
  | grep -vE '\$\{\{\s*secrets\.VERCEL_(TOKEN|ORG_ID|PROJECT_ID)' \
  || echo "No secret leaks OK"

# actionlint on all four workflows (preferred) or fallback
if command -v actionlint >/dev/null; then
  actionlint .github/workflows/*.yml && echo "actionlint OK"
else
  for f in .github/workflows/*.yml; do python3 -c "import yaml; yaml.safe_load(open('$f'))"; done && echo "yaml.safe_load OK"
fi

# init.sh still passes (the locally-runnable harness must remain green; feature did not touch tests/code)
./init.sh
```

If `./init.sh` reports exit code 0, the feature is implementation-complete from the SDD environment's perspective. The remaining validation (live workflow execution, real preview URL, first manual release ceremony, real production deploy) is the human's post-merge work per FR-020 and is documented in `docs/harness/ci-cd.md` §6.

---

## What this quickstart does NOT do

- Create the `dev` and `prd` GitHub Environments — that is a human-admin step performed in GitHub Settings → Environments, not a code task.
- Add the three GitHub secrets to each environment — also human-admin in the GitHub UI.
- Configure branch protection — recommended in the doc, performed by a repo admin (NOW MORE IMPORTANT because `create-release.yml` itself pushes a commit to `master` via `GITHUB_TOKEN`; branch protection must allow GitHub Actions to push).
- Dispatch the first "Create release" — human-only validation step.
- Trigger a live workflow run — not feasible from the SDD environment.
- Modify `init.sh` itself — CI mirrors it; it does not invoke CI.
- Change `vitest.config.ts`, `biome.json`, or any test file. (Note: `package.json` IS modified — single `version` field insertion in Step 1 — but no scripts, deps, or other fields change.)

If any of the above seem missing during implementation, refer back to `plan.md` §"Out of Scope" — they are deliberately deferred or excluded.
