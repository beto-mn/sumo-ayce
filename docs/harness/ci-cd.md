# CI/CD Operations Guide

> The single source for everything a human needs to operate, rotate, or hand
> over the GitHub Actions + Vercel CLI pipeline shipped by feature 009.

This doc is the only thing a non-author owner needs to read to make the
pipeline work end-to-end. None of the workflow YAML files need to be opened
or edited as part of handover — the three GitHub Secrets and two GitHub
Environments are the entire decoupling surface (FR-016).

---

## 1. Overview

The repository ships **four** GitHub Actions workflows under
`.github/workflows/`:

| File | Trigger | GitHub Environment | What it does |
|---|---|---|---|
| `ci.yml` | `pull_request` (any base branch) | — (none) | Cloud formalization of `./init.sh`. Runs Biome lint, vue-tsc typecheck, Vitest unit tests, Nuxt build, and Storybook build. Five independent rows on the PR. |
| `preview.yml` | `push` to `develop` | `dev` | Pulls Vercel `preview` env, builds, deploys, and posts the preview URL on the commit's Deployments tab. |
| `create-release.yml` | `workflow_dispatch` from the GitHub UI (master only) | — (none) | Manual release ceremony. Re-runs the full quality gate, bumps `package.json`'s `version`, commits with `[skip ci]`, tags `v<X.Y.Z>`, pushes both, and creates a GitHub Release object. **Does NOT contact Vercel.** |
| `production.yml` | `workflow_call` (chained from `create-release.yml`) + `workflow_dispatch` (redeploy an existing tag) | `prd` | Pulls Vercel `production` env, builds with `--prod`, deploys with `--prebuilt --prod`. Checks out the codebase at the input `tag`. Has NO `push:` trigger — production deploys never happen automatically. |

Vercel is contacted **exclusively through its CLI**, invoked from
`ubuntu-latest` runners with short-lived secrets. No native Vercel↔GitHub
integration is used or required. This is a deliberate Article VI (sensitive
data) decision: the repo never grants Vercel direct access to its source.

Production deploys are deliberate human acts. A merge to `master` signals
"ready to ship"; a `Create release` dispatch performs the act. The
dispatch runs two jobs within the SAME workflow run: a `release` job that
owns the ceremony (quality gate + version bump + commit + tag + GitHub
Release), and a `deploy` job invoked via `workflow_call` that runs
`production.yml` against the new tag. The split gives the team a clean
audit trail (GitHub Releases page is the chronological changelog), semver
as a first-class citizen, and a `workflow_dispatch` redeploy path on
`production.yml` if Vercel hiccups — no new release ceremony required to
retry the deploy.

**Handover contract**: a new repo owner makes the pipeline work against
their own Vercel workspace by adding three secrets to the two GitHub
Environments. No file under `.github/workflows/`, no source file, no
`package.json` field needs to change.

---

## 2. Required GitHub secrets

The three Vercel secrets below are scoped per **GitHub Environment**
(`dev` and `prd`). Each environment holds its own copy of every secret —
six secret values total in `Settings → Environments`. Article VI of the
constitution forbids committing any of these values to source; the
workflows reference them only via `${{ secrets.VERCEL_* }}`.

| Secret name | Type | Purpose | Where to retrieve | Scoped to |
|---|---|---|---|---|
| `VERCEL_TOKEN` | string | Vercel CLI authentication. Short-lived, scoped to a single team/account. | Vercel dashboard → Account → Tokens → Create Token. See §2.1. | `dev` AND `prd` (typically a different token per env so a leak does not compromise both tiers) |
| `VERCEL_ORG_ID` | string | Identifies which Vercel team/account owns the project. | `vercel link` then read `.vercel/project.json`'s `orgId`, OR Vercel dashboard → Team → Settings → General → Team ID. See §2.2. | `dev` AND `prd` (same value in both for a single Vercel org) |
| `VERCEL_PROJECT_ID` | string | Identifies the specific Vercel project to deploy to. | `.vercel/project.json`'s `projectId` after `vercel link`, OR Vercel dashboard → Project → Settings → General → Project ID. See §2.3. | `dev` AND `prd` (same value in both for a single Vercel project) |

> Article VI rationale: these values, even though `ORG_ID` and `PROJECT_ID`
> are not strictly "credentials" by Vercel's own docs, are still
> repo-coupling identifiers. Committing them would break the handover
> contract — a new owner would inherit the prior owner's Vercel identifiers
> baked into the repo. Routing everything through environment-scoped
> secrets keeps the source clean.

### 2.1 Retrieving `VERCEL_TOKEN`

1. Open <https://vercel.com/account/tokens>.
2. Click **Create Token**.
3. Choose the scope — typically "Full Account" if you administer the team
   yourself, or restrict to the SUMO team workspace.
4. Name the token by environment for traceability — recommended:
   - `sumo-ayce-gha-dev` for the `dev` GitHub Environment copy
   - `sumo-ayce-gha-prd` for the `prd` GitHub Environment copy
   Two distinct tokens are recommended so that a leak of the `dev` token
   cannot compromise production (and vice versa). Reusing one token across
   both environments is acceptable for a small team that accepts the trade.
5. Set the expiry per the team's secret-rotation policy (90 days is a
   reasonable default). Calendar the rotation date.
6. Copy the value (Vercel shows it only once).
7. In GitHub: `Settings → Environments → dev → Environment secrets →
   Add secret`. Name: `VERCEL_TOKEN`. Paste `<your-token-here>`.
8. Repeat step 7 for the `prd` environment with the production-scoped
   token.

### 2.2 Retrieving `VERCEL_ORG_ID`

Two options:

- **Option A (CLI)**: from a clean workspace clone, run `vercel link`
  interactively. Pick the team and project. After it completes, open
  `.vercel/project.json` and copy the `orgId` value. **Delete the
  `.vercel/` folder afterwards** (`rm -rf .vercel/`) — it is gitignored by
  this feature, but removing it is a safety belt against accidental
  partial commits.
- **Option B (dashboard)**: Vercel dashboard → Team picker → **Settings**
  → **General** → **Team ID**. Copy the value.

Paste the value into both the `dev` and `prd` GitHub Environments as a
secret named `VERCEL_ORG_ID`. The same value is used in both unless the
team uses separate Vercel orgs per environment.

### 2.3 Retrieving `VERCEL_PROJECT_ID`

Two options:

- **Option A (CLI)**: after `vercel link` (see §2.2), `.vercel/project.json`
  contains a `projectId` field. Copy that value. Delete `.vercel/`
  afterwards.
- **Option B (dashboard)**: Vercel dashboard → Project → **Settings** →
  **General** → **Project ID**. Copy the value.

Paste the value into both the `dev` and `prd` GitHub Environments as a
secret named `VERCEL_PROJECT_ID`.

---

## 3. Creating the GitHub Environments and adding the secrets

This is the **only** human-admin step required to make the pipeline
functional after a fresh clone or owner change.

1. In GitHub, navigate to `Settings → Environments`.
2. Click **New environment**. Name it exactly `dev` (lowercase, no
   hyphens, no underscores). Click **Configure environment**.
3. Under **Environment secrets**, click **Add secret** three times,
   adding:
   - `VERCEL_TOKEN` (the `sumo-ayce-gha-dev` value from §2.1)
   - `VERCEL_ORG_ID` (from §2.2)
   - `VERCEL_PROJECT_ID` (from §2.3)
4. Repeat steps 2–3 for a second environment named exactly `prd`
   (lowercase). Use the production-scoped `VERCEL_TOKEN` here.
5. Save and confirm both environments appear in
   `Settings → Environments`.

> **CRITICAL**: secrets must be added under **Environment secrets**, NOT
> under **Repository secrets**. The workflows reference environment-scoped
> secrets via `environment: dev` and `environment: prd`. A repo-level
> secret with the same name will NOT be read by jobs that declare an
> `environment:`.

> **CRITICAL**: secret values cannot be read back after saving. Store the
> originals in the team password manager (or in a sealed envelope) before
> pasting into GitHub.

**Required-reviewers protection on `prd`** is available in
`Settings → Environments → prd → Required reviewers`. This is **NOT
enabled** by this feature (FR-021) — the manual release ceremony already
provides the human gate. A future feature can add this on top.

---

## 4. Recommended branch-protection rules (RECOMMENDATION ONLY)

> This section is a recommendation, not an action this feature performs.
> Enabling branch protection requires repo-admin access in the GitHub UI
> and is performed manually by the repo owner (FR-015).

Recommended protection for `master`:

- **Require a pull request before merging** — yes.
- **Required status checks before merging**:
  - `verify` (from `ci.yml`)
  - `storybook` (from `ci.yml`)
- **Require linear history** — yes (compatible with the release
  workflow, which produces a single commit on top of `master` HEAD).
- **Restrict who can push to matching branches** — keep it tight, BUT
  ensure GitHub Actions can push. Because `create-release.yml` itself
  pushes a commit to `master` via the built-in `GITHUB_TOKEN` (with
  `contents: write` permission), branch protection must allow the
  `github-actions[bot]` actor. GitHub's "Include administrators" toggle
  is one way to express this; another is to leave the actor exclusions in
  place. This requirement is **MORE important** than before — without
  it, the release workflow's `git push origin master` step will fail.
- **Require signed commits** — only if the team already uses them. Not
  required by this feature.

Recommended protection for `develop` (lower stakes):

- **Require a pull request before merging** — optional but recommended.
- **Required status checks** — same as `master` (`verify` and
  `storybook`).

---

## 4.1 Pull-request title → commit subject (manual repo setting)

> This is a repo-settings configuration that lives in GitHub Dashboard
> (not committable). Apply it once after enabling the workflows; the
> setting persists with the repo.

When a PR is squashed or merged via the GitHub UI, GitHub proposes a
default commit message. By default it uses an auto-generated message
like `Merge pull request #N from <branch>`. We override this so the
**PR title becomes the commit subject**, which keeps the master log
consistent with the project's commit convention (gitmoji + type +
scope, validated by `.husky/commit-msg`).

### Setting to apply

Navigate to:

```
Repo → Settings → General → Pull Requests
```

For each merge button you allow, set:

| Merge button       | Default commit message              |
|--------------------|--------------------------------------|
| Squash merging     | **Pull request title**               |
| Merge commits      | **Pull request title**               |
| Rebase merging     | (no commit message produced)         |

### Enforcement

A new workflow `.github/workflows/pr-title.yml` validates every PR
title against the same convention `.husky/commit-msg` uses for
commits. Required status check on `master`. Fails if:

- The title doesn't match `<type>(<scope>): <description>`.
- A gitmoji prefix is present but doesn't match the type mapping
  (`feat`→✨, `fix`→🐛, `chore`→🔧, `release`→🔖, etc.).

This means: a PR with a non-compliant title is unmergeable. By the
time the maintainer clicks "Squash and merge", the title is
guaranteed valid → the proposed commit subject is guaranteed valid →
the convention propagates automatically with zero manual editing.

### Convention reminder

```
<gitmoji> <type>(<scope>): <description>

Examples:
  ✨ feat(homepage): add hero section
  🐛 fix(api): handle missing phone in reservations
  🔖 release: v0.1.2
  🔧 chore(deps): bump pnpm to 10.27.0
```

The full type → gitmoji mapping is in `.husky/commit-msg`. The PR
template (`.github/PULL_REQUEST_TEMPLATE.md`) also includes a
reminder at the top.

---

## 5. How to ship to production

The release ceremony is a five-click flow in the GitHub UI:

1. Open GitHub → **Actions** → **Create release**.
2. Click **Run workflow** (top right).
3. Confirm the **Use workflow from** dropdown is `master`. (The workflow's
   internal branch guard refuses dispatches from any other ref — see §9.)
4. Pick `version_bump`:
   - `patch` (e.g. 0.1.0 → 0.1.1) — bug fixes, copy tweaks, dependency
     bumps, anything user-invisible.
   - `minor` (0.1.0 → 0.2.0) — new backward-compatible pages/features.
   - `major` (0.1.0 → 1.0.0; 1.2.3 → 2.0.0) — breaking changes, the
     post-acceptance promotion to 1.0.0, or any user-visible behaviour
     change that requires migration.
5. Fill `release_description` (required, multi-line, markdown supported)
   — this becomes the GitHub Release body and is the changelog entry
   future readers will see.
6. Optionally fill `additional_notes` (multi-line, markdown supported)
   — appended under `## 📌 Additional Notes` in the Release body when
   non-empty. Use this for breaking-change call-outs, migration guides,
   etc.
7. Click **Run workflow**.

### Wait for the deploy job

After clicking Run, BOTH the `release` job AND the `deploy` job run
within the SAME workflow run in the Actions UI. The `deploy` job is
invoked via `workflow_call` from `create-release.yml` and consumes the
new tag as its `tag` input. Wait for both jobs to report success. The
Actions tab shows them stacked under one entry — there is no separate
"Production Deploy" run on the timeline; both jobs are children of the
`Create release` run.

### The rendered release body

The GitHub Release object created by the `release` job has a structured
body. The title (the `name:` field) is:

```
🚀 v<X.Y.Z> - <Patch|Minor|Major> Release (Production)
```

The body contains:

- A header `## 🐛 Patch Release` / `## ✨ Minor Release` /
  `## 🚨 Major Release` (semantic emoji from `version_bump`).
- A Version / Type / Environment metadata block.
- `## 📝 Changes` — the verbatim `release_description` input.
- `## 📋 Commit History` — `git log` between the previous tag and the
  release commit, formatted `- <subject> (<short-sha>)`. A
  `**Full Changelog**` link to GitHub's compare view follows.
- A `### 🚀 Deployment` block citing `Environment: prd` and
  `Service: sumo-ayce`. NO Region line.
- An optional `## 📌 Additional Notes` block (only present when
  `additional_notes` is non-empty).
- A bot signature attributing the release to the dispatcher.

A full rendered fixture lives in
`specs/009-ci-cd-github-actions/quickstart.md` under "Example: rendered
release note".

### What to verify

Within ~15 minutes you can verify:

- `package.json`'s `version` is bumped on `master`.
- The commit message is `🔖 chore(release): v<X.Y.Z> [skip ci]` — the
  `[skip ci]` marker prevents `ci.yml` from re-running on this metadata
  commit (the quality gate already ran inside `create-release.yml`).
- The tag `v<X.Y.Z>` exists.
- A GitHub Release with that tag exists, the title is
  `🚀 v<X.Y.Z> - <Type> Release (Production)`, and the body matches the
  template above.
- The `deploy` job inside the same workflow run completed against the
  new tag.
- The Vercel `prd` environment serves the new build on the live SUMO
  domain.

### Recovery path

If the `deploy` job fails transiently (Vercel API hiccup, edge cache
cold start, network blip):

1. Open GitHub → **Actions** → **Production Deploy** workflow (this is
   the standalone entry for `production.yml`, distinct from the
   `Create release` entry).
2. Click **Run workflow**.
3. Input the existing tag value (e.g. `v1.0.107`) in the `tag` field.
4. Click **Run workflow**.

This redeploys the same tag via `production.yml`'s `workflow_dispatch`
trigger — no new release ceremony, no second tag, no second
`package.json` bump. The tag and the GitHub Release remain in place;
only the deploy step is retried.

If the failure is a real build break (not transient), do NOT redeploy
the same tag. Revert the offending commit on `master`, dispatch a fresh
`Create release`, and let the new tag's chained `deploy` job produce
the correct deploy. The broken tag remains in history as an audit
artifact.

---

## 6. Post-merge verification procedure

The SDD environment cannot trigger live workflow runs, so this checklist
is the human's responsibility after feature 009 lands on `master`.
Article IX of the constitution mandates that the CI pipeline mirrors
`./init.sh`'s checks — the steps below are the live confirmation of that
mirror.

1. **Create the two GitHub Environments.** Per §3, create `dev` and
   `prd` (lowercase) in `Settings → Environments`.
2. **Add the three secrets to EACH environment.** Per §3, paste
   `VERCEL_TOKEN` / `VERCEL_ORG_ID` / `VERCEL_PROJECT_ID` under
   **Environment secrets** in both environments.
3. **Open a no-op PR** against `master` (or any base). Within ~5
   minutes, confirm the PR view shows the five check rows (lint,
   typecheck, test, build, storybook). Per Article IX, these are the
   same checks `./init.sh` runs locally.
4. **Push a one-line change to `develop`** (e.g. a copy tweak in a
   page). Within ~15 minutes, confirm the commit's Deployments tab on
   GitHub shows a preview URL pointing to a `*.vercel.app` host. Open
   the URL — the change should be live.
5. **Merge `develop` to `master`.** No production deploy happens
   automatically.
6. **Dispatch `Create release`.** From the Actions tab, run
   `Create release` with `version_bump=patch`,
   `release_description="initial release scaffold"`,
   `additional_notes` empty, on the `master` branch. Within ~15
   minutes, confirm:
   - The tag `v0.1.1` exists in the repo.
   - A GitHub Release titled
     `🚀 v0.1.1 - Patch Release (Production)` exists, with the
     description rendered under `## 📝 Changes`, a `## 📋 Commit
     History` block listing the commits between the previous tag (if
     any) and the release commit, a `### 🚀 Deployment` block citing
     `Environment: prd` and `Service: sumo-ayce` (NO Region line), and
     no `## 📌 Additional Notes` block (since the input was empty).
   - `production.yml` ran via `workflow_call` from `create-release.yml`
     within the SAME workflow run; the Actions tab shows both
     `release` and `deploy` jobs under one entry. The Vercel `prd`
     environment serves the new build on the live SUMO domain.

If any step fails, see §9 (Troubleshooting).

---

## 7. Secret rotation

`VERCEL_TOKEN` is the most-rotated of the three (it expires per the
team's policy). To rotate:

1. In the Vercel dashboard, create a new token per §2.1 with the same
   naming convention (`sumo-ayce-gha-dev` or `sumo-ayce-gha-prd`).
2. In GitHub `Settings → Environments → dev → Environment secrets`,
   click `VERCEL_TOKEN` → **Update**. Paste the new value.
3. Repeat for `prd` if you rotate that token too.
4. Revoke the old token in the Vercel dashboard.

**No workflow edits required** — the workflows reference the secret by
name, not by value. The next workflow run picks up the new value
automatically.

`VERCEL_ORG_ID` and `VERCEL_PROJECT_ID` rotate only on Vercel project
migration (rare). Follow §2.2 and §2.3 to retrieve fresh values, then
update both GitHub Environments.

---

## 8. Handover to a new owner

The handover is the architectural raison d'être of this feature. It
requires **no source-controlled file changes** — no edits under
`.github/workflows/`, no edits to `package.json` (the `version` field
already exists; the release workflow bumps it from whatever value is
current), no edits to `nuxt.config.ts` or any other config.

1. **Repo admin grants access.** The prior owner adds the new owner as
   an admin on the GitHub repo. The new owner accepts.
2. **Vercel setup.** The new owner creates (or claims) a Vercel project
   for SUMO AYCE in their own Vercel workspace.
3. **Retrieve the three values per §2.** Token from Vercel
   `Account → Tokens`. Org ID and Project ID from the Vercel dashboard
   or via `vercel link`.
4. **Create the GitHub Environments per §3.** Two environments
   (`dev`, `prd`), three secrets each, all under **Environment secrets**.
5. **Remove the prior owner from the Vercel team.** The new owner is now
   the sole controller of the Vercel side. The prior owner's GitHub
   secrets (if any) become inert.
6. **Smoke test.** Push a test commit to `develop`. Confirm a preview
   URL appears on the commit (per §6 step 4). Then dispatch
   `Create release` per §5 to confirm the production path.

Per SC-005, the handover should take under sixty minutes following only
this doc, without reading any workflow YAML file.

---

## 9. Troubleshooting

| Symptom | Most likely cause | Immediate fix |
|---|---|---|
| `preview.yml` or `production.yml` fails at the `vercel pull` step with "authentication failed" | `VERCEL_TOKEN` is missing, expired, or scoped to the wrong team | Rotate `VERCEL_TOKEN` in the relevant GitHub Environment per §7. The previous deployment continues to serve traffic; no rollback needed. |
| `vercel pull` succeeds but `vercel build` fails | Real build break in the codebase OR Vercel runtime env vars (DATABASE_URL etc.) missing in the Vercel project | If the build failure is reproducible locally via `pnpm build`, fix the codebase. If only `vercel build` fails, check `Vercel dashboard → Project → Settings → Environment Variables` for the relevant Vercel environment (Preview/Production). |
| Preview deploy succeeds but no URL appears on the commit's Deployments tab | The `actions/github-script@v7` step failed silently OR `deployments: write` permission was removed | Check the workflow run log for the "Surface preview URL on commit" step. Confirm `permissions: deployments: write` is present in `preview.yml`. |
| `Create release` finishes the `release` job but the `deploy` job is missing or skipped | `production.yml`'s `on:` block lost its `workflow_call:` trigger OR the chained `deploy` job in `create-release.yml` lost `secrets: inherit` / `needs: release` | Verify `production.yml`'s `on:` block contains both `workflow_call:` and `workflow_dispatch:` (no `push:`, no `tags:`). Verify `create-release.yml`'s `deploy` job has `uses: ./.github/workflows/production.yml`, `needs: release`, and `secrets: inherit`. If the structure is correct, open the failed `deploy` job log for the underlying error. |
| `Create release` is dispatched but the run is "skipped" or fails fast | Dispatch was performed from a branch other than `master`. The branch guard `if: github.ref == 'refs/heads/master'` refused the run (FR-010c) | From the GitHub UI Actions tab, re-dispatch with the **Use workflow from** dropdown set to `master`. |
| `Create release` fails at `git push origin master` | Branch protection on `master` is too strict and does not allow the `github-actions[bot]` actor to push | Adjust branch protection per §4 to permit GitHub Actions to push. The `[skip ci]` marker on the release commit prevents `ci.yml` from re-running, so the metadata commit is safe. |
| `pnpm install --frozen-lockfile` fails in CI but works locally | Local `pnpm-lock.yaml` is out of sync with `package.json` and was not committed | Regenerate the lockfile locally (`pnpm install`), commit it, push. The frozen-lockfile gate is intentional — it prevents silent dependency drift. |
| CI build wall-clock time spikes from ~3 min to ~6 min on every run | pnpm store cache is being missed (e.g. lockfile changed, runner OS changed) | Inspect the `actions/setup-node@v4` step log. The cache key is derived from `pnpm-lock.yaml`'s hash; intentional lockfile changes invalidate the cache for one run, then it warms up again. |
| Tag exists, GitHub Release exists, but the `deploy` job failed or was not invoked | Transient Vercel error, or the chained `workflow_call` did not start | Open GitHub → **Actions** → **Production Deploy** → **Run workflow** → input the existing tag (e.g. `v0.1.1`) → **Run workflow**. This dispatches `production.yml` against the same tag without re-doing the release ceremony. |

When in doubt, the workflow run logs in the GitHub Actions tab are the
authoritative source. The Vercel CLI is verbose by default; build and
deploy errors are typically in the last 30 lines of the relevant step.

---

## Cross-references

- Article VI (Sensitive Data): `.specify/memory/constitution.md` — the
  rationale for "no secrets in source-controlled files" and the
  per-environment secret-scoping decision.
- Article IX (Quality Gates): `.specify/memory/constitution.md` — the
  rationale for "the CI pipeline MUST mirror all three gates
  identically", which is what `ci.yml` implements.
- Feature 009 spec: `specs/009-ci-cd-github-actions/spec.md`.
- Feature 009 contracts: `specs/009-ci-cd-github-actions/contracts/workflows.md`.
