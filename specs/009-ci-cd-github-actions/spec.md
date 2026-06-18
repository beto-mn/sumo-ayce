# Feature Specification: CI/CD via GitHub Actions + Vercel CLI (develop preview, manual release → master production)

**Feature Branch**: `feat/009-ci-cd-github-actions`
**Created**: 2026-06-17
**Status**: Draft
**Input**: User description: Feature 9 in `feature_list.json` — stand up CI/CD entirely from GitHub Actions (NOT the native Vercel↔GitHub integration) so the repository never has to grant Vercel direct access to the source code. Central constraint: this is a client project; at handover the developer will be removed from the Vercel workspace. The repo must stay clean of Vercel coupling — the new owner only needs to add three GitHub secrets (`VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`) to keep the pipeline working with their own Vercel workspace. Four workflows: `ci.yml` (every PR — formalizes `./init.sh`), `preview.yml` (push to `develop` — Vercel preview, environment `dev`), `create-release.yml` (manual `workflow_dispatch` from GitHub UI on `master` — bumps `package.json` version, commits, tags `v<X.Y.Z>`, creates a GitHub Release), and `production.yml` (tag push `v*` triggers Vercel production deploy, environment `prd`). Production deploys are NO LONGER automatic on push to `master` — they require an explicit human release ceremony. Must land before feature 010 (homepage) so every page PR from 010 onward ships with a working preview URL.

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Pull-request CI gates merge on the same checks `./init.sh` runs locally (Priority: P1)

A contributor opens a pull request against any branch in the repository. Within minutes, an automated quality pipeline runs in the cloud and reports five distinct status rows on the PR: linting, type-checking, unit tests, application build, and (optionally — see US5) Storybook build. The contributor cannot merge the PR until every required row is green. The set of checks is byte-for-byte the same checks the contributor runs locally via `./init.sh` — so a passing local run is a strong predictor of a passing CI run, and a failing CI run never surprises the contributor with a check that does not exist in their local environment.

**Why this priority**: This is the MVP of the feature. Without it, every other piece (preview deploys, production deploys) ships untested code straight to a hosted environment. The constitution's Article IX (Quality Gates) is explicit that "the CI pipeline MUST mirror all three gates identically" — this user story is the literal materialization of that rule. It also makes the test floor (≥226 tests today) auditable: a regression that deletes coverage fails CI loudly.

**Independent Test**: From a fresh checkout of the repo, open a pull request that modifies a single file (any file). Within five minutes, the PR view shows five check rows (lint, typecheck, test, build, storybook) and each is either green or red. Introducing a deliberate Biome violation in a follow-up commit flips the lint row red and blocks the merge button.

**Acceptance Scenarios**:

1. **Given** a contributor opens a PR against the `master` branch, **When** the workflow runs to completion, **Then** the PR view shows distinct check rows for linting, type-checking, unit tests, and application build, each reporting pass or fail independently.
2. **Given** a contributor opens a PR against a non-default branch (e.g. `develop` or a feature branch), **When** the workflow runs, **Then** the same five check rows appear — branch name is not a filter.
3. **Given** the test suite reports fewer than the documented baseline of 226 passing tests, **When** the CI run completes, **Then** the test row is reported as failed (regression detected) and the merge button is blocked.
4. **Given** a contributor pushes a follow-up commit to the same PR while a previous run is still in flight, **When** the new commit arrives, **Then** the in-flight run is cancelled and only the latest commit's run is reported as the PR status.
5. **Given** the contributor ran `./init.sh` locally and saw exit code 0, **When** they push that exact commit to a PR branch, **Then** the corresponding CI run reports the same outcome (no checks present in CI that are absent from `./init.sh`).

---

### User Story 2 — Push to `develop` deploys a Vercel preview and surfaces the URL (Priority: P1)

After a PR is merged into `develop`, the integration branch is automatically deployed to a Vercel preview environment. The preview URL is visible on the resulting commit and on the GitHub Deployments tab without the contributor having to open the Vercel dashboard. The preview reflects the latest `develop` HEAD and is safe to share with the client for review before production promotion.

**Why this priority**: This is the second leg of the MVP. The preview environment is how the client validates UI work before promotion. Without an automated preview URL surfaced on the commit, the contributor would have to manually deploy from a workstation — defeating the "the repo is sufficient" handover goal. It is also the precondition for feature 010 onward, which expects every PR (after eventually being merged to `develop`) to produce a preview link.

**Independent Test**: Merge a one-line change (e.g. a copy tweak) into `develop`. Within ten minutes, the commit in GitHub shows a green "Deployment" annotation linking to a `*.vercel.app` URL; opening that URL serves the updated content.

**Acceptance Scenarios**:

1. **Given** a commit lands on `develop`, **When** the preview workflow runs, **Then** a Vercel preview deploy succeeds and the resulting URL is reported back to the GitHub commit view (via the Deployments API or an equivalent status entry).
2. **Given** the preview workflow completes, **When** the human opens the reported URL, **Then** the site reflects the code at the deployed commit (no stale content from a prior run).
3. **Given** the workflow runs with the expected secrets present, **When** it completes, **Then** no Vercel credential value appears in the workflow logs (secrets are masked).
4. **Given** two pushes to `develop` arrive within seconds of each other, **When** the second arrives, **Then** the still-running first preview is cancelled and only the latest is deployed (preview URL of the latest commit is what surfaces).

---

### User Story 3 — Production deploys happen only after an explicit `create-release` workflow_dispatch from GitHub UI (Priority: P1)

A maintainer with admin access to the repository opens the GitHub UI → Actions → "Create release" workflow → Run workflow. They pick a semver bump (`patch | minor | major`), fill a required `release_description` (multi-line) and an optional `additional_notes` (multi-line), and click Run. The release workflow validates it is running from the `master` branch (refusing otherwise), checks out master with full history, runs the full quality gate (`pnpm check && pnpm typecheck && pnpm test && pnpm build`), bumps the version in `package.json` via `npm version <bump> --no-git-tag-version`, commits the change with `[skip ci]`, pushes the commit to `master`, creates an annotated git tag `v<X.Y.Z>` pointing at that commit, pushes the tag, generates the structured release-notes body (title `🚀 v<X.Y.Z> - <Type> Release (Production)`, body following the template in FR-010g-body with the commit history since the previous tag and the optional Additional Notes block), and creates a GitHub Release with that body. The same workflow then invokes `production.yml` via `workflow_call` with the new tag as an input, and `production.yml` performs the actual Vercel production deploy (environment `prd`). Both jobs (release + deploy) appear under the SAME workflow run in the Actions tab, so the maintainer sees the full ceremony as one unit. No manual `vercel --prod` invocation from a workstation is required, and no production deploy happens automatically on push to `master`. If a deploy needs to be retried for an existing tag (transient Vercel failure), the maintainer opens GitHub UI → Actions → "Production Deploy" → Run workflow, inputs the existing tag, and clicks Run — no new release ceremony, no second version bump, no second tag.

**Why this priority**: Final leg of the MVP. Production releases must be a deliberate human act, not an implicit side effect of a merge. The two-workflow split (release ceremony vs deploy) gives the maintainer a single GitHub-UI button for ship-to-prod, an auditable trail (release notes + tag + Release object), semver as a first-class citizen, and the ability to re-run a deploy from an existing tag if `production.yml` ever fails transiently. The release path must still be reproducible from secrets alone — no developer-local Vercel install is required.

**Independent Test**: From the GitHub UI Actions tab, open "Create release". Pick `patch`, fill `release_description` with "initial release scaffold", leave `additional_notes` empty, click Run. Within ~5 minutes confirm: (a) `package.json`'s `version` was bumped on `master`, (b) the commit message contains `[skip ci]`, (c) a `v<X.Y.Z>` tag exists, (d) a GitHub Release with that tag exists, its name is `🚀 v<X.Y.Z> - Patch Release (Production)` and its body matches the template (header with `🐛 Patch Release`, Version/Type/Environment block, the description under `## 📝 Changes`, an auto-generated commit history under `## 📋 Commit History`, NO Additional Notes block since the input was empty, a `Deployment` block citing `Environment: prd` and `Service: sumo-ayce` and NO Region line, and the bot signature), (e) within the SAME workflow run, the `deploy` job (invoked via `workflow_call`) ran against the new tag and the Vercel dashboard shows a fresh production deployment attributed to a CI token, (f) the live SUMO domain serves the new build.

**Acceptance Scenarios**:

1. **Given** a maintainer opens the Actions tab and selects the "Create release" workflow, **When** they click "Run workflow", **Then** they see exactly three inputs: `version_bump` (required dropdown with values `patch | minor | major`), `release_description` (required multi-line text), and `additional_notes` (optional multi-line text).
2. **Given** the "Create release" workflow is dispatched from a branch other than `master` (e.g. `develop` or a feature branch), **When** the workflow starts, **Then** the very first step fails with a clear "release must run from master" message and no version bump, no commit, no tag, and no GitHub Release is produced.
3. **Given** the "Create release" workflow runs from `master`, **When** any of `pnpm check`, `pnpm typecheck`, `pnpm test`, or `pnpm build` fails inside the workflow, **Then** the workflow exits non-zero before the version-bump step runs (no half-released state: no commit, no tag, no Release).
4. **Given** the quality gate passes inside "Create release", **When** the bump + commit + tag + Release steps run, **Then** `package.json` has the new version, the commit message follows the pattern `🔖 chore(release): v<X.Y.Z> [skip ci]`, the tag is annotated and matches `v<X.Y.Z>`, and the GitHub Release's body is the `release_description` input followed by `\n\n## Additional notes\n\n${additional_notes}` if (and only if) `additional_notes` is non-empty.
5. **Given** the "Create release" workflow has created the tag and the GitHub Release object, **When** the workflow's `deploy` job runs (invoked from the SAME workflow run via `workflow_call` with the new tag as an input), **Then** `production.yml` checks out the tag (NOT `master` HEAD) using the `tag` input value, runs the Vercel CLI production sequence against the Vercel `production` environment (`prd` GitHub Environment), and both jobs appear under the same Actions run.
6. **Given** `production.yml` runs to completion, **When** a visitor loads the production domain, **Then** they receive the build corresponding to the tagged commit.
7. **Given** the `production.yml` job runs, **When** it completes, **Then** the Vercel dashboard attributes the deploy to a CI token (not to a personal Vercel user), and no Vercel credential value appears in the workflow logs.
8. **Given** the `deploy` job in the release workflow fails (e.g. build error, Vercel API error) for the new tag, **When** the workflow reports failure, **Then** the previous production deployment continues to serve traffic (no half-rolled state), the tag and the GitHub Release remain in place as audit artefacts, AND a maintainer can open GitHub UI → Actions → "Production Deploy" → Run workflow (the `workflow_dispatch` trigger of `production.yml`), input the existing tag, and click Run to retry the deploy alone — no second tag, no second `package.json` bump, no new GitHub Release.
9. **Given** the commit produced by "Create release" lands on `master` with `[skip ci]` in its subject line, **When** GitHub evaluates `ci.yml`'s triggers, **Then** `ci.yml` is NOT re-run for that commit (the release commit is purely a metadata bump and the quality gate already ran inside `create-release.yml` as a pre-condition).

---

### User Story 4 — Future repo owners can reuse the pipeline by swapping only the three GitHub secrets (Priority: P2)

A new owner takes over the repository (the original developer is removed from the Vercel workspace). The new owner clones the repo, creates their own Vercel project, retrieves three values from the Vercel dashboard, pastes them into the GitHub repo's secret settings, and pushes a commit to `develop`. A preview deploy succeeds against the new owner's Vercel workspace. No edits to any workflow YAML file, no changes to the source code, and no changes to repo settings are required for the handover.

**Why this priority**: This is the architectural raison d'être of the feature, explicitly stated by the client-facing constraint. If the handover required any code edit, the feature has failed its central goal. The three secrets are the entire decoupling surface.

**Independent Test**: A clean GitHub clone of the repo plus a fresh Vercel account: add the three secrets, push to `develop`, observe a successful preview deploy. Zero file modifications in the repo.

**Acceptance Scenarios**:

1. **Given** the new owner has admin access to a fresh GitHub repo clone and a fresh Vercel team, **When** they add `VERCEL_TOKEN`, `VERCEL_ORG_ID`, and `VERCEL_PROJECT_ID` as repository secrets and push to `develop`, **Then** the preview workflow runs to completion and a preview URL is returned — without any file in the repo being modified.
2. **Given** documentation exists for retrieving the three secret values, **When** a non-author follows it, **Then** they obtain all three values in under fifteen minutes without reading the workflow files.
3. **Given** the repo has been transferred to the new owner, **When** the prior owner's Vercel access is revoked, **Then** subsequent workflow runs continue to succeed using only the secrets configured by the new owner.
4. **Given** the repo at any point in history, **When** a reviewer inspects it, **Then** no Vercel-issued credentials, project IDs, or org IDs appear in source-controlled files (workflows reference secrets by name only).

---

### User Story 5 — Storybook build runs as a parallel CI job so broken stories surface in PR review (Priority: P3)

When a PR modifies a Storybook story or a component referenced by a story, the CI pipeline runs `pnpm storybook:build` as a separate parallel job alongside lint/typecheck/test/build. A broken story (unresolved import, runtime error during build, missing story export) fails this job in isolation while the other four jobs may remain green, signaling specifically that the design-system documentation surface is broken.

**Why this priority**: P3, not MVP. The system survives without it, but Article VII makes Storybook coverage non-negotiable and Article I makes Storybook the enforcement surface for component reuse. A broken story file is a Constitution violation that would otherwise slip past CI until the next manual `pnpm storybook:build` run. The cost (~30 seconds added to PR feedback) is small relative to the regression class it catches.

**Independent Test**: On a feature branch, introduce a syntax error in any `.stories.ts` file. Open a PR. The Storybook job reports red while lint/typecheck/test/build are green (because the story file is excluded from `vue-tsc` and is not a runtime entry). Fix the story, push again, the Storybook job goes green.

**Acceptance Scenarios**:

1. **Given** every PR triggers the CI workflow, **When** the workflow runs, **Then** a Storybook build job runs in parallel with the lint/typecheck/test/build jobs (not sequentially after them).
2. **Given** a contributor breaks a single story file, **When** they open a PR, **Then** the Storybook job fails and identifies the offending file in its log, while the other CI jobs continue to report independently.
3. **Given** the Storybook job passes, **When** the PR is otherwise green, **Then** all five check rows are green and the merge button is enabled.

---

### Edge Cases

- **A secret is missing or revoked.** The preview/production workflow fails fast at the `vercel pull` step with a clear "authentication failed" error. The previous deployment continues to serve traffic. The fix is to rotate the secret in the relevant GitHub Environment (`dev` or `prd`) — no code changes.
- **`create-release.yml` is dispatched from a non-master branch.** The branch guard (`if: github.ref == 'refs/heads/master'`) skips the job, producing no version bump, no commit, no tag, no Release. The Actions tab shows the run with a "skipped" status; the maintainer re-dispatches from `master`.
- **The `deploy` job in the release run fails (e.g. transient Vercel API error).** The tag and the GitHub Release still exist (they are written by the `release` job before `deploy` runs). The previous production deployment continues to serve traffic. A maintainer opens GitHub UI → Actions → "Production Deploy" → Run workflow, inputs the existing tag, and clicks Run — `production.yml`'s `workflow_dispatch` trigger redeploys the same tag without re-doing the release ceremony. If the failure is a real build break, the maintainer reverts the offending commit on `master` and dispatches a new release; the broken tag remains in the history as an audit artifact.
- **A second maintainer dispatches "Create release" while a previous release is still mid-run.** GitHub serializes `workflow_dispatch` runs of the same workflow on the same ref by default; the second dispatch queues. If the first dispatch produced a tag bump, the second dispatch's quality gate runs against the bumped `package.json` — version conflicts cannot occur because each successful run bumps to the next semver position.
- **A maintainer manually edits `package.json`'s `version` field outside the release workflow.** The next "Create release" run will bump FROM that manual value (since `npm version` reads the current value). This is acceptable but discouraged; the release ceremony is the authoritative path.
- **GitHub Actions outage / pnpm registry outage.** The workflow fails with a transient error. Re-running the job from the GitHub UI succeeds once upstream recovers. No retry policy is encoded in the workflow itself (kept simple).
- **A contributor pushes a 50-commit batch to `develop` in one go.** Each push triggers preview workflow, but the concurrency rule cancels in-flight runs; only the final commit's preview is deployed. Preview URLs of intermediate commits never materialize.
- **The pnpm lockfile is out of date relative to `package.json`.** `pnpm install --frozen-lockfile` fails fast in CI with a clear error — preventing silent dependency drift. Contributor fixes by regenerating the lockfile locally.
- **The Storybook job times out but the four MVP jobs pass.** If Storybook is configured as a non-required check (recommended in `docs/harness/ci-cd.md`), merge is still possible but the PR shows the failure visibly. If configured as required, merge is blocked.
- **Vercel CLI version drift.** The workflows use `npx vercel@<pinned-version>` (or an explicit major version) so a Vercel CLI breaking change cannot silently change the deployment behaviour mid-feature-development.
- **A workflow YAML file itself contains a syntax error.** GitHub Actions rejects the file at parse time and reports a clear error on the PR that introduced the change, before any job runs. This protects against accidental destruction of the pipeline.
- **The repo is forked and a fork opens a PR.** Pull-request workflows run with restricted permissions and no access to repository secrets — the lint/typecheck/test/build/storybook jobs still execute and report status; the preview/production workflows are not triggered by forks (they trigger on `push` to `develop`/`master`, which forks cannot perform).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The repository MUST publish a continuous-integration workflow that runs on every pull-request event regardless of the target branch.
- **FR-002**: The CI workflow MUST execute the following operations and report each as an independently observable status: install dependencies with a locked dependency manifest, lint, type-check, unit tests, and application build.
- **FR-003**: The CI workflow MUST verify that the unit-test job reports at least 226 passing tests (the baseline established by features 001–008); a regression below this floor MUST fail the workflow.
- **FR-004**: The CI workflow MUST pin the Node.js major version to the major version Vercel's serverless runtime currently supports (Node 20 at the time of writing) so that CI and the production runtime do not diverge.
- **FR-005**: The CI workflow MUST cache the package manager's content-addressable store between runs to reduce wall-clock install time on repeat runs.
- **FR-006**: The CI workflow MUST cancel in-flight runs on the same git ref when a newer commit arrives (concurrency group keyed by workflow + ref, `cancel-in-progress: true`).
- **FR-007**: The CI workflow MUST be the formalization of the locally-runnable `./init.sh` verification harness — the set of checks executed MUST be a one-to-one mapping with the checks `./init.sh` performs, so a passing local run is a faithful predictor of a passing CI run.
- **FR-008**: The repository MUST publish a preview-deployment workflow triggered by pushes to the `develop` branch; this workflow MUST deploy the codebase to a Vercel preview environment by invoking the Vercel CLI from the GitHub Actions runner, NOT via any GitHub-app or native source-control integration. The job MUST declare `environment: dev` so it is scoped to the `dev` GitHub Environment for secret access.
- **FR-009**: The preview workflow MUST surface the resulting preview URL on the corresponding GitHub commit (via the Deployments API or an equivalent status surface), so that a reviewer can open the preview without leaving GitHub.
- **FR-010**: The repository MUST publish a production-deployment workflow at `.github/workflows/production.yml` triggered EXCLUSIVELY by `workflow_call` (invoked by `create-release.yml` after the tag and GitHub Release have been created) and by `workflow_dispatch` (for re-deploying an existing tag without re-doing the release ceremony). Both triggers MUST declare a required `tag` input of type `string` describing the exact git tag to deploy (e.g. `v1.0.107`). The workflow MUST check out the codebase at that input tag (NOT the workflow's `github.ref`) and deploy to the Vercel production environment using the same CLI-only mechanism as the preview workflow.
- **FR-010-bis**: The `production.yml` workflow MUST NOT declare a `push: tags` trigger. The tag-trigger model is REJECTED. The contract between `create-release.yml` and `production.yml` is the explicit `workflow_call` invocation with the tag as an input — NOT an implicit tag-push. Verifiable by `! grep -E '^\s*tags:' .github/workflows/production.yml` (no `tags:` key may appear under `on:` or anywhere else in the file).
- **FR-010a**: The repository MUST publish a release-ceremony workflow at `.github/workflows/create-release.yml` triggered EXCLUSIVELY by `workflow_dispatch` (i.e. a human-initiated run from the GitHub UI Actions tab). The workflow MUST NOT have any automatic trigger (no `push`, no `schedule`, no `pull_request`).
- **FR-010b**: The `create-release.yml` workflow MUST declare exactly three `workflow_dispatch` inputs: (a) `version_bump` — required, type `choice`, options exactly `[patch, minor, major]`, no default; (b) `release_description` — required, type `string`, multi-line free-form text describing what changed in this release; (c) `additional_notes` — optional, type `string`, multi-line free-form text for breaking changes, migration guidance, or similar appendices.
- **FR-010c**: The `create-release.yml` workflow MUST refuse to run from any branch other than `master`. The refusal MUST be enforced at the job level using `if: github.ref == 'refs/heads/master'` (or an equivalent first step that exits non-zero with a clear "release must run from master" message). A run from a non-master branch MUST NOT bump the version, commit, tag, or create a GitHub Release.
- **FR-010d**: The `create-release.yml` workflow MUST run the complete quality gate `pnpm check && pnpm typecheck && pnpm test && pnpm build` as a pre-condition. If any of these commands fails, the workflow MUST exit non-zero before any of the bump/commit/tag/Release steps execute, so a failing build never produces a tag.
- **FR-010e**: The `create-release.yml` workflow MUST bump the `package.json` version using `npm version <version_bump> --no-git-tag-version` (the workflow creates its own annotated tag separately; `npm version`'s built-in tag must NOT be used). The bump operates on the `package.json` field `"version"`.
- **FR-010f**: The `create-release.yml` workflow MUST commit the resulting `package.json` change (and `pnpm-lock.yaml` if `npm version` happens to touch it — verified during research to not be the case in this project's pnpm version, but the workflow MUST still `git add` both paths defensively) with a commit message matching the pattern `🔖 chore(release): v<X.Y.Z> [skip ci]`, push that commit to `master`, then create an annotated git tag `v<X.Y.Z>` pointing at that commit, then push the tag. The `[skip ci]` marker in the commit message MUST prevent `ci.yml` from re-running on the release commit.
- **FR-010g**: The `create-release.yml` workflow MUST create a GitHub Release object via the `softprops/action-gh-release@v2` action (version pinned to the exact major `v2`) with `tag_name: v<X.Y.Z>`, `name: <release title — see FR-010g-title>`, `draft: false`, `prerelease: false`, and `body_path: release_body.md` (where `release_body.md` is the file produced by a preceding bash step from the template defined in FR-010g-body and the commit-history block from FR-010g-history). The rationale for choosing this action over `actions/github-script@v7` inline is captured in `research.md`.
- **FR-010g-title**: The GitHub Release name (the `name:` field passed to `softprops/action-gh-release@v2`) MUST follow this exact format: `🚀 v<X.Y.Z> - <Patch|Minor|Major> Release (Production)`. The `<Patch|Minor|Major>` segment is derived from the `version_bump` input via the case-sensitive map `{patch → Patch, minor → Minor, major → Major}`. The trailing ` (Production)` suffix is literal and is included on every release name regardless of bump type.
- **FR-010g-body**: The `create-release.yml` workflow MUST generate `release_body.md` in a bash step (with the body in the form below) before the `softprops/action-gh-release@v2` step runs. The body template is, exactly:
  ```
  ## {EMOJI} {Patch|Minor|Major} Release

  **Version**: `v<X.Y.Z>`
  **Type**: {Bug fixes|Minor enhancements|Major release / breaking changes}
  **Environment**: 🚀 Production

  ---

  ## 📝 Changes

  {release_description}

  ## 📋 Commit History

  {commit_history_block_from_FR-010g-history}

  **Full Changelog**: {changelog_url_from_FR-010g-history}

  ---

  ### 🚀 Deployment

  This release will be automatically deployed to **Production**.

  - **Environment**: `prd`
  - **Service**: `sumo-ayce`
  {additional_notes_section_if_non_empty}

  ---

  🤖 *This release was created by @{github.actor} via GitHub Actions*
  ```
  The `Deployment` block MUST include only the `Environment` and `Service` lines — NO `Region` line (rationale in `research.md` "Service name in Deployment block"). The `Service` value MUST be the literal string `sumo-ayce`.
- **FR-010g-emoji**: The `{EMOJI}` and `{Type}` placeholders in FR-010g-body MUST be derived from the `version_bump` input via the case-sensitive map below. The mapping is exhaustive (every valid `version_bump` value has a row); any other input value MUST be rejected by GitHub Actions' built-in `choice` validation before the bash step runs.

  | `version_bump` | `{EMOJI}` | `{Patch\|Minor\|Major}` | `{Type}` |
  |---|---|---|---|
  | `patch` | 🐛 | Patch | Bug fixes |
  | `minor` | ✨ | Minor | Minor enhancements |
  | `major` | 🚨 | Major | Major release / breaking changes |
- **FR-010g-history**: The bash step that generates `release_body.md` MUST compute the commit-history block and the full-changelog URL as follows:
  - **Determine the previous tag**: `PREV_TAG=$(git describe --tags --abbrev=0 HEAD^ 2>/dev/null || echo "")`. The `HEAD^` argument is REQUIRED because the release commit itself (the `[skip ci]` version bump) is the latest commit on `master` after FR-010f's commit-push step; we do not want it in the commit-history list.
  - **If `PREV_TAG` is non-empty** (i.e. at least one prior release exists): `COMMIT_HISTORY=$(git log "${PREV_TAG}..HEAD^" --pretty=format:'- %s (%h)')` and `CHANGELOG_URL="${{ github.server_url }}/${{ github.repository }}/compare/${PREV_TAG}...${NEW_TAG}"`.
  - **If `PREV_TAG` is empty** (first release ever on this repository): `COMMIT_HISTORY=$(git log HEAD^ --pretty=format:'- %s (%h)' | head -50)` (capped at 50 commits since repo init) and `CHANGELOG_URL="${{ github.server_url }}/${{ github.repository }}/commits/${NEW_TAG}"` (link to commits view instead of compare).
  - Each commit line MUST be formatted exactly `- <commit subject> (<short_sha>)` (Git's `--pretty=format:'- %s (%h)'`).
- **FR-010g-additional-notes**: The optional Additional Notes section MUST be conditionally included in `release_body.md` based on the `additional_notes` input:
  - **If `additional_notes` is empty or unset**: the entire section MUST be omitted. No empty heading, no trailing separator, no whitespace artefact.
  - **If `additional_notes` is non-empty**: the section MUST be inserted IMMEDIATELY BEFORE the `---` separator that precedes the bot signature (i.e. between the `Deployment` block and the final ` 🤖 *This release was created by ...*` line). The inserted block MUST be exactly:
    ```
    ---

    ## 📌 Additional Notes

    {additional_notes}
    ```
    Note: the new block STARTS with its own `---` separator so the resulting body keeps a clean visual hierarchy (Deployment block → `---` → Additional Notes → `---` → bot signature).
- **FR-010h**: The `create-release.yml` workflow MUST declare `permissions: contents: write` at the job (or workflow) level — sufficient to push a commit, push a tag, and create a GitHub Release using the built-in `GITHUB_TOKEN`. No personal access token (PAT) MAY be required for the release ceremony.
- **FR-010i**: The git tag format produced by `create-release.yml` MUST be `v<X.Y.Z>` (lowercase `v` prefix, then the major/minor/patch from `package.json`). The tag MUST be annotated (not lightweight) to preserve metadata about the release. Tag glob in `production.yml`'s trigger MUST match exactly `v*`.
- **FR-010j**: `package.json` MUST carry a `"version"` field. Its initial value at the moment this feature ships is `"0.1.0"` (seed for the semver bump scheme; pre-1.0 territory until the client formally accepts the launch, at which point a `major` bump promotes to `1.0.0`). The `"version"` field MUST be placed between the `"name"` and `"private"` fields, and adding it MUST NOT alter any other `package.json` field.
- **FR-010k**: The `create-release.yml` workflow MUST NOT call the Vercel CLI. Its only responsibility is the release ceremony (quality gate + version bump + commit + tag + GitHub Release). The Vercel CLI deploy lives exclusively in `production.yml` and is reached only via the tag-push trigger.
- **FR-011**: Both deployment workflows (preview and production) MUST authenticate to Vercel using a short-lived token stored as a GitHub repository secret (`VERCEL_TOKEN`); the deployments MUST never rely on a native GitHub↔Vercel app installation.
- **FR-012**: Both deployment workflows MUST identify the target Vercel project and team via the GitHub repository secrets `VERCEL_ORG_ID` and `VERCEL_PROJECT_ID`; these MUST NOT be hardcoded in any workflow file.
- **FR-013**: All three workflows MUST reference Vercel credentials exclusively via the `${{ secrets.* }}` mechanism — no Vercel credentials, project identifiers, or organization identifiers MAY appear in committed source files.
- **FR-014**: The repository MUST publish a new documentation file at `docs/harness/ci-cd.md` that describes (a) where in the Vercel dashboard to retrieve each of the three required secret values, (b) the recommended branch-protection rules to apply to `master` (and optionally `develop`), and (c) the manual verification procedure to follow after the first merge into `develop` (since live workflow execution cannot be validated in the SDD environment).
- **FR-015**: The branch-protection configuration itself is OUT of scope for this feature — `docs/harness/ci-cd.md` documents the recommendation but the action of enabling it is performed by a GitHub repository administrator outside of this codebase.
- **FR-016**: The pipeline MUST be portable across owners: a new owner taking over the repository MUST be able to make the pipeline work end-to-end against their own Vercel workspace by adding only three secret values in GitHub repository settings — no edits to any file under `.github/workflows/` or to any source-controlled file MAY be required for handover.
- **FR-017**: A `.gitignore` rule MUST exclude any local Vercel link file (`.vercel/`) from the repository if such a file is created during local development; this prevents per-developer Vercel project identifiers from leaking into source control (the canonical values live in GitHub secrets).
- **FR-018**: The CI workflow MUST run a Storybook build job in parallel with the lint/typecheck/test/build jobs (priority P3 — the four MVP jobs MUST be independent of this job's success unless a repository administrator promotes it to "required" via branch protection).
- **FR-019**: Workflow logs MUST mask all secret values; introducing a value derived from a secret into log output without explicit masking is a defect.
- **FR-020**: The implementer MUST validate workflow correctness using only structural means available without live runner access (YAML syntax validation, `actionlint` or equivalent if available locally, and reference comparison against documented GitHub Actions schemas); end-to-end validation is performed by the human after merge to `develop`.
- **FR-021**: The repository's GitHub Environments MUST be exactly `dev` and `prd` (NOT `development`/`production` or `staging`/`production`). The naming matches the human's repo convention. Each environment is the scope at which the three Vercel secrets (`VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`) are configured. Required-reviewers protection on the `prd` environment is available in GitHub Settings → Environments but is NOT enabled by this feature (deferred to a human admin per FR-015).
- **FR-022**: Every workflow job that needs access to environment-scoped secrets MUST declare `environment: dev` or `environment: prd` accordingly. Mapping: `ci.yml` declares NO `environment:` (it does not contact Vercel); `preview.yml`'s `deploy` job declares `environment: dev`; `production.yml`'s `deploy` job declares `environment: prd`; `create-release.yml` declares NO `environment:` (it does not contact Vercel — it only operates on the GitHub repo itself and uses the built-in `GITHUB_TOKEN`).

### Key Entities

- **CI Workflow**: A GitHub Actions workflow file at `.github/workflows/ci.yml`. Triggered by pull-request events. Owns one job per quality gate (install/lint/typecheck/test/build, plus a parallel Storybook build job). Inputs: the PR commit. Outputs: per-job pass/fail status visible on the PR. Declares no `environment:`.
- **Preview Workflow**: A GitHub Actions workflow file at `.github/workflows/preview.yml`. Triggered by pushes to `develop`. Owns the sequence of Vercel CLI invocations that pull the preview environment, build, and deploy. Inputs: latest `develop` commit, the three Vercel secrets (scoped to the `dev` GitHub Environment). Outputs: a Vercel preview URL surfaced on the commit. Job declares `environment: dev`.
- **Release Workflow**: A GitHub Actions workflow file at `.github/workflows/create-release.yml`. Triggered by `workflow_dispatch` only (manual run from GitHub UI). Inputs: `version_bump` (required choice `patch|minor|major`), `release_description` (required multi-line string), `additional_notes` (optional multi-line string). Side effects: a single new commit on `master` bumping `package.json`'s `version` (subject `🔖 chore(release): v<X.Y.Z> [skip ci]`), an annotated tag `v<X.Y.Z>` on that commit, a GitHub Release object with the description as its body. Declares no `environment:` (does not contact Vercel; only writes to the GitHub repository via `GITHUB_TOKEN` with `contents: write`).
- **Production Workflow**: A GitHub Actions workflow file at `.github/workflows/production.yml`. Triggered EXCLUSIVELY by `workflow_call` (invoked by `create-release.yml` after the tag and Release are written) and by `workflow_dispatch` (manual re-deploy of an existing tag from the GitHub UI). Both triggers declare a required `tag` input (type `string`). The workflow checks out the codebase at that input tag (NOT `github.ref`). Owns the sequence of Vercel CLI invocations that pull the production environment, build with `--prod`, and deploy with `--prebuilt --prod`. Inputs: the tag string from the trigger, the three Vercel secrets (scoped to the `prd` GitHub Environment; when invoked via `workflow_call`, secrets are passed in via `secrets: inherit` in the caller). Outputs: a Vercel production deployment. Job declares `environment: prd`.
- **CI/CD Operations Doc**: A new file at `docs/harness/ci-cd.md`. Owns the human-facing instructions for retrieving secrets, configuring the `dev` and `prd` GitHub Environments, performing a release via "Create release", recommended branch-protection rules (now MORE important on `master` because the release workflow pushes a commit there), and the post-merge verification procedure.
- **GitHub Repository Secrets**: Three entries in the GitHub repo's secret store — `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID` — scoped to the GitHub Environments `dev` and `prd` (one copy per environment). These are administered by a human with repository admin access; they are referenced (never read) by the workflows.
- **GitHub Environments `dev` and `prd`**: Two GitHub Environments in repo Settings → Environments. `dev` is the scope for `preview.yml`'s `deploy` job; `prd` is the scope for `production.yml`'s `deploy` job. Both hold their own copy of the three Vercel secrets. Required-reviewers protection on `prd` is available but not enabled by this feature.
- **`package.json` `version` field**: A new top-level field added by this feature, seed value `"0.1.0"`, located between `"name"` and `"private"`. The release workflow bumps it via `npm version <patch|minor|major> --no-git-tag-version` and uses the resulting value to derive the tag and GitHub Release name. No other field in `package.json` changes as a side effect of this feature.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A contributor opening a pull request sees the full CI status (five rows: lint, typecheck, test, build, storybook) reported on the PR within ten minutes of the PR being opened.
- **SC-002**: A contributor running `./init.sh` locally and seeing exit code 0 sees the corresponding PR's CI pipeline report all required rows green at least 95% of the time (the remaining 5% is reserved for legitimate environmental divergence — e.g. a developer's machine has a stale dependency lockfile not yet committed).
- **SC-003**: A commit landing on `develop` produces an accessible Vercel preview URL (scoped to the `dev` GitHub Environment) on the corresponding GitHub commit within fifteen minutes.
- **SC-004**: A maintainer can perform the entire production-release flow from the GitHub UI (open Actions → "Create release" → pick `patch|minor|major` → fill description → optionally fill additional notes → click Run) in under 5 minutes of human time, with no local CLI invocation. Within ~15 minutes of clicking Run, the `v<X.Y.Z>` tag exists, the GitHub Release exists, `production.yml` has been triggered by the tag push, and the live SUMO domain serves the new build.
- **SC-005**: A new repository owner can complete the handover (creating the two GitHub Environments `dev` and `prd`, adding the three Vercel secrets to each environment, pushing a test commit to `develop` to confirm the preview deploy, then dispatching a test release via "Create release" to confirm production deploy) in under sixty minutes following only the instructions in `docs/harness/ci-cd.md`, without reading any workflow YAML file.
- **SC-006**: An audit of the repository at any commit returns zero matches for any Vercel token, organization ID, or project ID in source-controlled files (workflows reference secrets by name only).
- **SC-007**: A regression that drops the unit-test count below 226 fails the CI workflow's test job (verified by introducing a deliberate skip on a real test on a throwaway branch).
- **SC-008**: A broken Storybook story file fails the Storybook job in CI while the four MVP jobs remain accurately green (verified by introducing a deliberate syntax error in a story file on a throwaway branch).
- **SC-009**: The total wall-clock time for a typical PR CI run (warm cache, no infrastructure failure) stays under five minutes from "workflow started" to "all jobs reported".
- **SC-010**: At the moment of feature 010's first PR, the preview pipeline operates correctly — feature 010's PR (the homepage) ships with a working Vercel preview URL surfaced on its commit without any further configuration work being required on feature 009's deliverables.
- **SC-011**: After `create-release.yml` creates the tag and the GitHub Release, the `deploy` job (invoked via `workflow_call`) runs in the SAME workflow run without any further human input. If the deploy fails transiently, a maintainer opens GitHub UI → Actions → "Production Deploy" → Run workflow, inputs the existing tag, and clicks Run; `production.yml`'s `workflow_dispatch` trigger redeploys the tag without producing a duplicate tag, duplicate GitHub Release, or duplicate `package.json` bump.
- **SC-012**: Pushing a commit directly to `master` (e.g. via a force-push, an admin override, or a non-release commit) does NOT trigger a production deploy. Pushing a tag matching `v*` directly to the repository (bypassing `create-release.yml`) does NOT trigger a production deploy either — `production.yml` has NO `push: tags` trigger. The only paths that run `production.yml` are (a) `create-release.yml`'s `workflow_call` invocation with the new tag and (b) a maintainer's explicit `workflow_dispatch` from the GitHub UI with a tag input. Verified by inspecting `production.yml`'s `on:` block: it MUST contain only `workflow_call:` and `workflow_dispatch:` keys, NEVER `push:`.
- **SC-013**: Dispatching "Create release" from a branch other than `master` (e.g. `develop` or a feature branch) refuses to produce any side effect: no version bump, no commit, no tag, no GitHub Release, no production deploy. Verified by attempting to dispatch from `develop` on a throwaway branch and observing the workflow fail at the branch-guard step.

## Assumptions

- The active Vercel runtime supports Node 20 as documented at the time of writing; if Vercel changes its supported runtime to a different major version, the pinned Node major in the three workflows MUST be updated in lockstep.
- The Vercel CLI's documented commands (`vercel pull`, `vercel build`, `vercel deploy`) and flags (`--yes`, `--environment`, `--token`, `--prebuilt`, `--prod`) are the stable, supported public interface for CLI-driven deploys.
- A human administrator with access to both the GitHub repository's secret settings and the Vercel dashboard will perform the one-time secret-registration step; the implementer does not require access to either dashboard.
- The pnpm major version (10) and Node major version (22 locally / 20 in CI) currently used in the repository are the versions CI is expected to support; CI does not need to test against multiple Node versions in a matrix.
- pnpm's content-addressable store path on Linux GitHub-hosted runners is well-defined and cacheable using the standard `actions/cache` action (or the cache integration of `pnpm/action-setup`).
- The Vercel CLI on `develop`/`master` runs in the same `ubuntu-latest` image as the CI workflow; no Windows or macOS runners are required.
- The repository's `.npmrc` (currently pinning `registry=https://registry.npmjs.org/`) is acceptable in CI as-is and does not require override.
- Live end-to-end validation of preview and production deployments is performed by the human after the spec is implemented and merged; the implementer's responsibility ends at structural validation of the workflow YAML.
- Branch-protection rule configuration is performed manually by a repository administrator after this feature lands; the spec documents the recommendation but does not enforce it programmatically.
- The implementer will pin specific major versions for third-party actions (e.g. `actions/checkout@v4`, `actions/setup-node@v4`, `pnpm/action-setup@v4`) rather than using `@main` or unpinned references, to keep workflow behavior deterministic across runs.
- Storybook coverage (Article VII) is already enforced by feature 007; the CI Storybook job in US5 catches regressions but does not enforce coverage rules itself.
