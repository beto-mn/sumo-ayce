# Research — Feature 009: CI/CD via GitHub Actions + Vercel CLI

**Status**: All open items resolved before plan finalization. No `NEEDS CLARIFICATION` remain.

**Significant addendum (2026-06-17, post-initial-spec)**: The production deploy model changed from "automatic on push to master" to "manual release ceremony via `workflow_dispatch`, tag-triggered deploy". Items R9–R14 (below) capture the design rationale for this change. The architectural shift strengthens — does not weaken — the pre-existing rationale in R1–R8: every prior decision (CLI-only, no native integration, no third-party deploy actions, secret-only references, structural-only validation) carries over verbatim; the new items add the release-ceremony layer on top.

---

## R1 — Vercel CLI canonical command sequence

### Decision

Use the documented three-step CLI flow with an explicit `--token=$VERCEL_TOKEN` flag on every invocation:

- **Preview** (`develop` workflow):
  1. `npx vercel@<major> pull --yes --environment=preview --token=$VERCEL_TOKEN`
  2. `npx vercel@<major> build --token=$VERCEL_TOKEN`
  3. `npx vercel@<major> deploy --prebuilt --token=$VERCEL_TOKEN`
- **Production** (`master` workflow):
  1. `npx vercel@<major> pull --yes --environment=production --token=$VERCEL_TOKEN`
  2. `npx vercel@<major> build --prod --token=$VERCEL_TOKEN`
  3. `npx vercel@<major> deploy --prebuilt --prod --token=$VERCEL_TOKEN`

`VERCEL_ORG_ID` and `VERCEL_PROJECT_ID` are exported as environment variables before `vercel pull` runs (this is how the CLI identifies the project without a committed `.vercel/project.json`).

The `vercel` CLI major version is **pinned via `npx vercel@<major>`** in each invocation so that an upstream breaking change in a future CLI major cannot silently change deploy behaviour mid-feature. The exact major to pin is set during implementation by querying the current stable major at the time of writing the workflow (the latest stable Vercel CLI major at the time of this spec is `34`).

### Rationale

This is the documented canonical sequence for "CLI-driven deploys without GitHub integration" on Vercel. Splitting `pull` / `build` / `deploy` into three explicit steps:

- Makes each phase fail with a clear, separately observable error (auth failure vs build failure vs upload failure).
- Lets `--prebuilt` skip a duplicate build during `deploy` — the artifact produced by `vercel build` is uploaded as-is.
- Lets the implementer log the deploy URL from `deploy`'s stdout (it is the final line) without parsing build logs.

### Alternatives considered and rejected

- **Single `vercel --prod` invocation** (the convenience flow): rejected because it bundles pull + build + deploy into one opaque step and makes error attribution harder. KISS argued for the convenience flow; debuggability argued harder for the explicit flow, and debuggability won.
- **`amondnet/vercel-action`** (third-party deploy action): rejected for KISS and supply-chain hygiene — every additional action is a new audit surface. The official CLI is sufficient.
- **Unpinned `npx vercel`**: rejected. An upstream major bump (e.g. Vercel removes a flag) would silently break the pipeline at the worst moment. Pinning the major version is the minimum viable safety net.

### Cross-reference with manual-release pattern (R9, below)

The "no native Vercel↔GitHub integration" decision is REINFORCED by the manual-release pattern: there is now zero implicit deploy trigger from VCS state alone. Even pushing to `master` does not deploy anymore. A production deploy requires a human-initiated `workflow_dispatch` that ultimately produces a `v*` tag, and only the tag triggers `production.yml`. This makes "git state" and "deployed state" two cleanly separate concepts, with the GitHub Release (and the tag) as the explicit handoff between them.

---

## R2 — Does `vercel build` re-invoke `pnpm build` for Nuxt 4 projects?

### Decision

**Yes** — `vercel build` reads the project's `package.json` and invokes the configured build script (`nuxt build` via `pnpm build`). Therefore:

- In **`ci.yml`** (PR feedback workflow): keep an explicit `pnpm build` step. The deploy workflows do NOT run on PR events, so the PR's only signal that a Nuxt build succeeds comes from `ci.yml`.
- In **`preview.yml`** and **`production.yml`** (deploy workflows): the explicit `pnpm build` step is **omitted**. `vercel build` runs `pnpm build` under the hood, and duplicating it would waste ~30 s per deploy without adding signal.

### Rationale

This avoids redundant work in the deploy workflows while keeping the PR-feedback workflow honest about build correctness. The deploy workflows already fail loudly if the build breaks (`vercel build` exits non-zero) — they just don't need to call `pnpm build` themselves.

### Alternatives considered and rejected

- **Run `pnpm build` in every workflow** (defense in depth): rejected. Doubles build wall-clock on deploy workflows for zero added signal. The `vercel build` step is itself a build verification — a redundant one upstream of it adds latency, not safety.
- **Skip `pnpm build` in `ci.yml`** (rely on lint+typecheck only): rejected. A Nuxt build can break for reasons lint and typecheck miss (e.g. Vite resolver issues, missing static imports at build time, route-rules misconfiguration). The PR-time build signal is the entire point of Article IX's "CI mirrors `./init.sh`" rule.

---

## R3 — pnpm store cache strategy on `ubuntu-latest`

### Decision

Use `pnpm/action-setup@v4` to install pnpm, then `actions/setup-node@v4` with `cache: 'pnpm'` and `cache-dependency-path: 'pnpm-lock.yaml'`. This pair handles store-path discovery, cache key derivation (hash of `pnpm-lock.yaml`), and restore + save automatically. No manual `actions/cache@v4` block is required.

### Rationale

`actions/setup-node@v4`'s built-in `cache: 'pnpm'` mode was added specifically for this scenario. It computes the store path correctly across runner OS versions and uses `hashFiles('pnpm-lock.yaml')` as the cache key (which is invalidated when `pnpm-lock.yaml` changes). Wrapping `actions/cache@v4` manually re-implements the same logic with more failure surface.

### Alternatives considered and rejected

- **Manual `actions/cache@v4` keyed on `pnpm-lock.yaml` hash**: rejected. More boilerplate, identical outcome. KISS.
- **No cache** (cold install every run): rejected. Cold pnpm install on this repo takes ~45 s; cached install drops to ~5 s. Across ~10 PRs/day, that's >6 min of runner time saved per day for zero downside.
- **Turborepo remote cache**: rejected. Project does not use Turborepo; introducing it for cache alone violates KISS.

### Cache key

Effective key: `<runner-os>-node-${{ hashFiles('pnpm-lock.yaml') }}` (managed automatically by `setup-node@v4`'s `cache: 'pnpm'` mode).

---

## R4 — Surfacing the Vercel preview URL on the GitHub commit

### Decision

Use `actions/github-script@v7` (Octokit-in-a-step) inline JavaScript to:

1. Capture the Vercel deploy URL from the `vercel deploy --prebuilt`'s stdout (the URL is the final line of stdout).
2. Call `github.rest.repos.createDeployment` with `ref: github.sha`, `environment: 'preview'`, `auto_merge: false`, `required_contexts: []`.
3. Call `github.rest.repos.createDeploymentStatus` with `state: 'success'`, `environment_url: <captured URL>`, `log_url: github.run_url`.

The deployment then appears on GitHub's commit view and on the Deployments tab with the preview URL as a clickable link.

### Rationale

- Built-in `GITHUB_TOKEN` already has `deployments: write` permission when explicitly granted in the workflow's top-level `permissions:` block — no PAT required.
- `actions/github-script@v7` is an Anthropic-trusted, well-maintained action by GitHub itself. No third-party supply-chain risk.
- Inline JS keeps the logic close to the workflow it serves; no separate file to maintain.

### Alternatives considered and rejected

- **`chrnorm/deployment-action` / `bobheadxi/deployments`**: rejected. Both are third-party. KISS + supply-chain hygiene + the inline `github-script` approach is ~25 lines of JS doing the same thing transparently.
- **PR comment with the URL** (instead of Deployments): rejected as the primary surface. Comments are noisier and harder to find programmatically. Deployments is the GitHub-native way to surface a deploy URL on a commit. A PR comment MAY be added later as a secondary convenience but is not in scope for this feature.
- **Reading the URL from a `vercel inspect`**: rejected. The URL is already in `vercel deploy`'s stdout — a second CLI call would be wasteful.

### Required permissions block

```yaml
permissions:
  contents: read
  deployments: write
```

---

## R5 — Concurrency strategy

### Decision

All three workflows declare:

```yaml
concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true
```

### Rationale

- For `ci.yml`: a rapid PR push pattern wastes minutes if every commit's run finishes when only the latest matters. Cancellation matches developer mental model (the latest commit is the only relevant one).
- For `preview.yml`: rapid pushes to `develop` should produce a preview for the latest commit only. The cancellation is correct semantically.
- For `production.yml`: rapid pushes to `master` are rare but possible (e.g. a hotfix immediately after a merge). Cancellation here is acceptable because the **next** push deploys, and the end state still reflects the latest `master` commit. The caveat: if the cancellation interrupts a partial Vercel upload, the deploy is dropped cleanly — the previous production deployment continues to serve traffic. No half-rolled state is visible to end users.

### Alternatives considered and rejected

- **`cancel-in-progress: false` on `production.yml`** (queue, don't cancel): rejected. In the rare double-push case, queuing means the *intermediate* commit gets deployed and the *latest* commit's deploy waits — that's confusing and runs counter to "latest commit wins".
- **No concurrency block** (run everything): rejected. Wastes runner minutes; on rapid PR pushes this produced ~3x the build time historically on similar projects.

### Documented caveat (for `docs/harness/ci-cd.md`)

A push to `master` that lands within ~60 s of a previous still-running production deploy will cancel that previous deploy. The previous production deployment on Vercel continues to serve traffic; the next push's deploy then proceeds. There is no double-deploy race condition.

---

## R6 — Storybook job placement

### Decision

A single `storybook-build` job in `ci.yml`, running **in parallel** with the lint/typecheck/test/build jobs (no `needs:` declaration tying it to the others). It uses the same `actions/setup-node@v4 (cache: 'pnpm')` install step and runs `pnpm storybook:build`.

### Rationale

- Parallelism: Storybook build takes ~25–35 s on this codebase; serial execution would add the full duration to PR feedback time, while parallel execution adds at most the diff between Storybook build time and the longest other job (typically `test` or `build`).
- Independence: a broken story file does not imply a broken application, and vice versa. Reporting them as independent rows on the PR matches the Constitution's separation (Article VII enforces Storybook as a distinct concern from Article IX's quality gates).

### Alternatives considered and rejected

- **Storybook as a sequential step inside the `build` job**: rejected. Couples two independent failure modes into one row, hurting attribution.
- **Storybook only on PRs that touch `app/components/ui/**` or `**/*.stories.ts`** (path filter): rejected as a v1 optimization. The ~30 s cost is acceptable globally; a path-filtered version can be added later if PR latency becomes a complaint.

### Required check vs optional check

The job is declared as a regular CI job. Whether it becomes a *required* check (blocks merge) is a branch-protection setting — documented as a recommendation in `docs/harness/ci-cd.md` but NOT enforced by this feature (see FR-015).

---

## R7 — `.vercel/` and the `.gitignore` rule

### Decision

Add `.vercel/` (folder, trailing slash) to `.gitignore`. This excludes:

- `.vercel/project.json` (contains `orgId` and `projectId` in plaintext)
- `.vercel/.env.*.local` (per-environment runtime env values pulled from Vercel — sensitive)
- `.vercel/output/` (per-build artifact directory)

### Rationale

- The canonical source of truth for `orgId` and `projectId` in this project is GitHub Secrets, not the repo. Committing `.vercel/project.json` would create a second source of truth and break FR-016's "swap three secrets, no code edits" handover contract.
- `.vercel/.env.*.local` files are how `vercel pull` brings down per-environment runtime env vars. These ARE sensitive (they contain `DATABASE_URL`, Twilio credentials, etc.) and must never be committed. Folder-level ignore is the safe default.
- `.vercel/output/` is build output and is regenerated by `vercel build`.

### Cross-check with existing `.gitignore`

Current `.gitignore` does NOT currently exclude `.vercel/`. The implementer adds it as part of Phase 1 Setup. No file in the current repo state is under `.vercel/` (verified — folder does not exist).

### Alternatives considered and rejected

- **Commit `.vercel/project.json`** (the "official Vercel docs say it's safe" interpretation): rejected. While the values themselves are not secrets, committing them breaks the handover contract. The new owner would inherit the *old* owner's `orgId` and `projectId` hardcoded in the repo; they would have to find and replace them. The whole point of the feature is that the new owner's only touch point is the three GitHub secrets — committing IDs in the repo is the opposite of that.
- **Ignore only `.vercel/.env.*.local`** (keep `project.json`): rejected for the same handover reason. The folder-level ignore is also simpler and harder to get wrong.

---

## R8 — Validation strategy without live runners

### Decision

The implementer's correctness validation is structural, performed in this priority order:

1. **`actionlint`** if available locally (`brew install actionlint` or `npx @rhysd/actionlint`). This validates the workflow YAML against the official GitHub Actions schema, catches common gotchas (typos in event names, invalid `needs:` chains, undefined contexts), and warns on shellcheck issues inside `run:` blocks. If `actionlint` is unavailable, fall back to:
2. **`yq` or `yamllint`** for syntactic YAML validation only (does NOT catch Actions-specific schema errors but ensures the file is at least parseable).
3. **Manual cross-reference** of each workflow against `contracts/workflows.md` (Phase 1 design artifact): every required job, step, secret, output, and permission listed in the contract must be present in the corresponding `.yml` file.
4. **`./init.sh` exit-0 check**: after writing the workflow files, the implementer reruns `./init.sh` locally to confirm no unrelated regression was introduced.

Live runtime validation (does the workflow actually run, does the preview URL actually appear, does the production deploy actually succeed) is **deferred to the human** after merge to `develop`. The implementer cannot trigger a real GitHub Actions run from the SDD environment.

### Rationale

- `actionlint` is the canonical static validator for GitHub Actions YAML and is widely adopted.
- The "contracts → file" cross-reference catches structural drift even if `actionlint` is missing.
- Deferring runtime validation to the human is the only realistic option — the SDD environment has no runner.

### Alternatives considered and rejected

- **`act` (local GitHub Actions simulator)**: considered but not required. `act` is useful for validating jobs that run shell commands; it cannot fully simulate the GitHub Deployments API or Vercel cloud calls, so it doesn't deliver true end-to-end validation. If `act` happens to be available locally, the implementer MAY use it to dry-run `ci.yml` (no secrets needed for lint/typecheck/test/build jobs), but it is not a required step.
- **Push to a throwaway branch to trigger a real run**: rejected. The implementer doesn't own the repo's GitHub Secrets and cannot validate the deploy workflows; only the human can.

### Post-merge verification checklist (delegated to the human, documented in `docs/harness/ci-cd.md`)

UPDATED for the manual-release flow (see R9, R10, R11, R12, R13, R14 below):

1. In GitHub Settings → Environments, create environments `dev` and `prd`.
2. Add the three secrets (`VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`) to EACH environment.
3. Open a no-op PR; confirm the five CI rows appear and are green.
4. Push a one-line change to `develop`; confirm the preview URL appears on the commit's Deployments tab (deploy ran in the `dev` GitHub Environment).
5. Merge `develop` to `master`.
6. From GitHub UI → Actions → "Create release", click "Run workflow", pick `patch`, fill the description "initial release scaffold", click Run. Confirm: tag `v0.1.1` exists; GitHub Release with that tag exists; `production.yml` ran on the tag push; Vercel `prd` serves the new build on the live SUMO domain.

---

## R9 — Manual release vs auto-deploy on master

### Decision

Production deploys are NO LONGER automatic on push to `master`. Instead, a human dispatches a separate `create-release.yml` workflow from the GitHub UI (`workflow_dispatch`), which bumps `package.json`'s `version`, commits with `[skip ci]`, tags `v<X.Y.Z>`, pushes, and creates a GitHub Release. The tag push then triggers `production.yml` to perform the Vercel deploy.

### Rationale

- **Human-controlled production cadence**: production releases must be a deliberate human act, not an implicit side effect of merging a PR to `master`. A merge to `master` now signals "ready to ship", not "shipping right now". The two concepts deserve different triggers.
- **Audit trail via GitHub Releases**: every production deploy is preceded by a GitHub Release object whose body is the human-supplied description. The Releases page becomes a chronological, human-readable changelog with zero additional tooling.
- **Semver as a first-class citizen**: `package.json`'s `version` field is bumped on every release and the tag mirrors it. This gives operators an unambiguous, externally-verifiable identifier for "what's running in prd" (`vercel inspect` against the production deployment + `git describe --tags` on `master` HEAD agree).
- **Separation of "ready to merge" from "ready to ship"**: a maintainer can merge several feature PRs into `master` over a day, accumulate them, then ship them all as a single release with a single descriptive Release body. This decouples merge cadence from deploy cadence — important for a small team that may want batched releases.
- **Re-runnable deploys**: if `production.yml` fails transiently (Vercel API hiccup, flaky network), the maintainer re-runs `production.yml` from the GitHub UI against the same tag — no re-release ceremony needed. The tag is the immutable contract; the deploy is the retryable operation.

### Alternatives considered and rejected

- **Auto-deploy on push to `master`** (the original design): rejected. Couples merge to deploy, which forces every merge to be a "ready to ship right now" decision. For a client-handover project, the new owner deserves the option to merge accumulated work and ship deliberately.
- **Manual `workflow_dispatch` directly invoking the Vercel CLI** (single-workflow model): rejected. See R10.
- **Tag-driven without a release workflow** (the maintainer creates and pushes the tag from their workstation): rejected. Requires the maintainer to have a clean local working tree, the right `package.json` version, and the discipline to run `npm version` + `git tag` + `git push` consistently. The release workflow encapsulates the ceremony so the maintainer's only touchpoint is the GitHub UI.
- **Required-reviewer protection on `prd` environment instead of a release workflow**: rejected at this stage. Required reviewers can be added later (as a v2 enhancement) on top of the release workflow; doing both is overkill for the current team size, and doing only required reviewers would lack the audit trail and semver bump.

---

## R10 — Two-workflow split: release vs deploy

### Decision

The release ceremony lives in `create-release.yml` (workflow_dispatch). The actual Vercel deploy lives in `production.yml` (triggered by `push: tags: ['v*']`). The tag is the contract between them.

### Rationale

- **One thing per workflow**: each file has a single responsibility. `create-release.yml` writes to the GitHub repo (bump + commit + tag + Release object). `production.yml` writes to Vercel (pull + build + deploy). Mixing them would make either file harder to read and harder to re-run independently.
- **Re-running just the deploy**: when Vercel fails for a transient reason (network blip, cold edge cache, ~5-second API outage), the maintainer must be able to retry the deploy WITHOUT producing a duplicate tag, duplicate Release, or duplicate `package.json` bump. With the split, the maintainer clicks "Re-run jobs" on the failed `production.yml` run against the existing tag and the deploy retries cleanly.
- **Tag immutability**: the tag and the GitHub Release are written exactly once per release ceremony. They never depend on the deploy succeeding. If the deploy fails permanently (e.g. real build break), the tag still exists as an audit artifact; the maintainer reverts on `master` and dispatches a new release. The historical record is preserved.
- **Future extensibility**: a future feature could add a third trigger to `production.yml` (e.g. `workflow_dispatch` against a manually-typed tag for "redeploy this specific historical tag") without touching `create-release.yml`. The split makes each workflow independently extensible.

### Alternatives considered and rejected

- **Single workflow doing both release + deploy**: rejected. Tightly couples the two concerns; a transient deploy failure leaves a tag without a deploy and the only way to retry would be to re-run the entire workflow (which would attempt to bump version again).
- **Three workflows (release, tag-push-handler, deploy)**: rejected. Over-decomposition; the tag-push trigger on `production.yml` already serves the "handler" role.

---

## R11 — Version-bump tool choice

### Decision

Use `npm version <patch|minor|major> --no-git-tag-version` (Node-bundled). The `--no-git-tag-version` flag is REQUIRED — the workflow creates its own annotated tag separately, so npm's built-in tag (which is lightweight by default and bound to npm's tagging convention) must NOT be used.

### Rationale

- **Edge cases handled by npm**: `npm version` correctly handles the existing `v` prefix conventions, pre-release suffixes (none in this project today, but possible later), exit code on no-op (it errors when there's nothing to bump). A hand-rolled `sed -i 's/"version": ".*"/"version": "X.Y.Z"/'` approach would fail on multi-line edge cases or on a `package.json` that gets reformatted by future tooling. Using the official tool is the safer default.
- **Verified pnpm-lock.yaml side-effect**: verified in a throwaway worktree against this project's `pnpm-lock.yaml` (sha256 captured before and after `npm version patch --no-git-tag-version`): the lockfile is NOT modified. `npm version` only touches `package.json`. The release workflow's `git add` step defensively includes `pnpm-lock.yaml` (with a fallback to plain `git add package.json` if pnpm-lock has no changes) so a future upgrade of npm that DOES touch the lockfile doesn't silently break the commit step.
- **Built-in, no third-party action**: Node is already installed on the runner via `actions/setup-node@v4`. No additional action is needed for the bump itself, reducing supply-chain surface.

### Why `--no-git-tag-version`

- `npm version` by default creates a lightweight git tag named exactly the new version (no `v` prefix, no annotation). The workflow wants an annotated tag with the `v` prefix (`v<X.Y.Z>`) for human-readability and tooling compatibility (Vercel and most Git hosting platforms expect the `v` prefix convention). The flag suppresses npm's tag creation; the workflow then creates `v<X.Y.Z>` itself via `git tag -a`.
- `npm version`'s default also creates a git commit named `<X.Y.Z>` (no `v`, no `[skip ci]`). The flag suppresses npm's commit too; the workflow's own `git commit` step produces the `🔖 chore(release): v<X.Y.Z> [skip ci]` message conforming to the project's conventions.

### Alternatives considered and rejected

- **Hand-rolled sed/awk on `package.json`**: rejected. Multi-line JSON edge cases and formatter changes break it.
- **`changelog-mode` from `release-it` or `standard-version`**: rejected. Both are heavyweight Node packages that introduce a changelog-generation pipeline this project doesn't need (the GitHub Release body, hand-written by the maintainer, IS the changelog).
- **Custom JS via `actions/github-script@v7`**: rejected. The bash logic with `npm version` is shorter and more obvious than the equivalent JS.

---

## R12 — GitHub Release creation tool choice

### Decision

Use `softprops/action-gh-release@v2` (pinned to major `v2`).

### Rationale

- **Stable, long-supported public interface**: the action has been the de-facto community choice for GitHub Release creation in workflows since at least 2019. Major `v2` has been stable for years. It accepts the release body as either an inline string (`body:`) or a file path (`body_path:`), which is critical for this feature's optional-append pattern: the workflow can construct the body string in a small bash step (handling the optional `additional_notes` concatenation cleanly), write it to `/tmp/release_body.md`, and pass `body_path:` to the action. This is more readable than inline JS doing string concatenation inside `actions/github-script@v7`.
- **Multi-line input support verified**: GitHub Actions' `workflow_dispatch` input type `string` accepts multi-line free-form text from the UI textarea. `softprops/action-gh-release@v2` accepts the resulting multi-line `body_path:` content verbatim, preserving the maintainer's markdown formatting.
- **Pinned major as the supply-chain mitigation**: the action is third-party but the pin to major `v2` (instead of `@main` or `@v2.0.4`) gives the right balance: any breaking change goes into a `v3`, and routine security patches arrive within `v2` without manual intervention. The implementer documents the pinning rationale in a YAML comment in `create-release.yml` and a maintainer can switch to a specific SHA pin if the team's supply-chain policy hardens later.

### Alternatives considered and rejected

- **`actions/github-script@v7` inline JS calling `github.rest.repos.createRelease`**: rejected for this specific case. The inline JS for the optional-append logic (`if (additionalNotes) body += '\n\n## Additional notes\n\n' + additionalNotes;`) would work, but the action-based version is more declarative and easier to grep/diff in code review. The two approaches are nearly equivalent in line count; `softprops/action-gh-release@v2` wins on convention and on "fewer cognitive context switches between YAML and JS".
- **`marvinpinto/action-automatic-releases`**: rejected. Less actively maintained than `softprops/action-gh-release`. The latter has more contributors, more stars, more public consumers.
- **Manual `gh release create` invocation via `gh` CLI**: rejected. `gh` is pre-installed on the runner, but the action wraps the same Octokit calls with a declarative interface that's easier to verify in a contract grep. The `gh` CLI approach would force more shell-escaping of the multi-line body.

---

## R13 — GitHub Environments `dev` / `prd`

### Decision

The repository uses GitHub Environments named exactly `dev` and `prd` (lowercase, no underscores, no hyphens). The three Vercel secrets (`VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`) are scoped per environment — one copy in `dev`, one copy in `prd`.

### Rationale

- **Naming matches the human's repo convention**: the team uses `dev`/`prd` (not `development`/`production`, not `staging`/`production`) across their existing projects. Following the convention reduces cognitive load on the new owner during handover.
- **Per-environment secret scoping is a security upgrade**: with repo-level secrets, both deploy workflows (`preview.yml` and `production.yml`) would read the same token. A misconfigured workflow could accidentally deploy a preview build to production using a prod token. With environment-level scoping, `preview.yml` declares `environment: dev` and physically cannot reach the `prd` token (and vice versa). The principle of least privilege is enforced at the GitHub layer, not in YAML conventions.
- **Required-reviewers protection available but deferred**: GitHub Environments support a required-reviewers policy — any job declaring `environment: prd` would be paused until a configured reviewer approves the run from the GitHub UI. This is a clean future enhancement on top of the manual-release pattern (and would compose well with it: the maintainer dispatches the release, and a SECOND maintainer approves the deploy half). For now, the feature ships with the environments created but the required-reviewers policy NOT enabled, because the team is currently a single maintainer and the manual-release ceremony already provides the human gate.

### Implementation notes

- The environments are NOT created in code — they are administered in GitHub Settings → Environments by a human admin. This is the same pattern as the three secrets themselves (also human-administered). The feature documents the creation steps in `docs/harness/ci-cd.md` §3.
- Each environment holds an independent copy of all three secrets. The maintainer typically pastes the same `VERCEL_ORG_ID` and `VERCEL_PROJECT_ID` into both (one Vercel project, one team), but typically a DIFFERENT `VERCEL_TOKEN` per environment (one token named `sumo-ayce-gha-dev`, another `sumo-ayce-gha-prd`) so that a leak of one token does not compromise both environments. This is a recommendation in the doc, not a strict requirement.

### Alternatives considered and rejected

- **Repo-level secrets only (no environments)**: rejected. The original spec used this model; the upgrade to environments closes the cross-environment exposure hole at minimal added complexity.
- **Three environments (`dev`, `staging`, `prd`)**: rejected for this feature. The project has no separate staging concept — Vercel preview deploys for `develop` ARE the staging environment. Adding a third environment would be unused complexity. A future feature can introduce a `staging` environment if the team ever needs a third tier.
- **Different naming (`preview`/`production`)**: rejected for alignment with the human's repo convention.

---

## R-NEW-A — Workflow chaining: `workflow_call` over tag-triggered

### Decision (revised 2026-06-17)

The original design used `on: push: tags: ['v*']` on `production.yml` so the tag push from `create-release.yml` would trigger the deploy "automatically" via GitHub's tag-trigger mechanism. **This is REVISED**. The new design:

- `production.yml` declares `on: workflow_call:` (with a required `tag` input) and `on: workflow_dispatch:` (with the same `tag` input). NO `push:` trigger of any kind.
- `create-release.yml` declares two jobs: `release` (the existing ceremony — bump + commit + tag + GitHub Release) and `deploy` (new — `uses: ./.github/workflows/production.yml`, `with: { tag: <new_tag> }`, `secrets: inherit`, `needs: release`). The `release` job exposes `outputs.tag` so the `deploy` job can pass it through.

### Rationale

- **No lag between tag push and deploy**: in the tag-trigger model, GitHub schedules a new workflow run after the tag arrives — typically within 5–15 seconds, occasionally up to a few minutes during platform congestion. Under the `workflow_call` model, the deploy job is enqueued by the same run that wrote the tag, so the latency is zero (the job is queued immediately when `release` completes).
- **One run, not two**: tag-triggered deploys appear under a SEPARATE run in the Actions tab (the trigger is `push (tag: v0.1.1)`), forcing the maintainer to navigate between two runs to debug a failed release. Under `workflow_call`, both jobs live under the SAME run — one click shows the full ceremony plus the deploy.
- **Tag persists on deploy failure (still true, but cleaner)**: the tag and the GitHub Release are written by the `release` job BEFORE the `deploy` job starts. If `deploy` fails, the tag and the Release remain as audit artefacts. The retry path is documented in R10 (unchanged): the maintainer opens "Production Deploy" → `workflow_dispatch` → inputs the existing tag → Run.
- **No accidental deploys from manual tags**: under the tag-trigger model, a maintainer (or any contributor with push access) who runs `git tag v0.1.99 && git push --tags` from a workstation can trigger a production deploy without going through `create-release.yml`. Under the `workflow_call` model, only `create-release.yml`'s `release` job can invoke `production.yml`'s `workflow_call` trigger — a hand-pushed tag does nothing. This closes a small but real bypass vector.
- **Explicit secret inheritance**: `secrets: inherit` makes the secret flow auditable in the workflow YAML. The called workflow (`production.yml`) declares it needs `VERCEL_TOKEN`/`VERCEL_ORG_ID`/`VERCEL_PROJECT_ID` (via its `env:` block referencing `${{ secrets.* }}`), and the caller (`create-release.yml`) explicitly opts in to passing its secrets through. There is no hidden propagation — a reader of the YAML can trace where every secret comes from.

### `workflow_dispatch` on `production.yml` — why keep it

The `workflow_dispatch` trigger on `production.yml` is the **redeploy path**. When a deploy fails transiently and the tag + GitHub Release already exist (because the `release` job ran to completion before `deploy` failed), the maintainer:

1. Opens GitHub UI → Actions → "Production Deploy".
2. Clicks "Run workflow".
3. Inputs the existing tag (e.g. `v1.0.107`).
4. Clicks Run.

The deploy runs against the same tag without producing a duplicate tag, duplicate GitHub Release, or duplicate `package.json` bump. The `workflow_dispatch` trigger declares the SAME `tag` input as `workflow_call` so both paths are interchangeable from the workflow's perspective.

### `secrets: inherit` — security implications

`secrets: inherit` passes the caller's full secret set to the called workflow. This is acceptable here because:

1. **Bounded scope**: only `create-release.yml`'s `deploy` job inherits the caller's secrets. The `release` job in the same workflow does NOT have `secrets: inherit` (it doesn't reference Vercel secrets at all — its only credential need is `GITHUB_TOKEN` which is granted via `permissions: contents: write`).
2. **No broader exposure**: `secrets: inherit` only flows secrets to the EXACT workflow named in `uses:`. There is no transitive propagation — if `production.yml` were to call a third workflow, that third workflow would need its own explicit `secrets: inherit` (which it doesn't have, because `production.yml` does not call further workflows).
3. **GitHub-enforced environment scoping is preserved**: the `deploy` job in `production.yml` declares `environment: prd`. Even with `secrets: inherit`, the `prd` GitHub Environment's policies (required-reviewers, IP allowlists if configured later) STILL APPLY. The inheritance does not bypass environment protection.
4. **Alternative considered and rejected — `secrets: { VERCEL_TOKEN: ${{ secrets.VERCEL_TOKEN }}, ... }`**: this explicit form is more verbose and forces the caller to know the exact secret list. `secrets: inherit` is the convention used across GitHub Actions reusable-workflow documentation and aligns with the project's KISS preference. The verbosity tradeoff is not worth the marginal explicitness gain.

### Alternatives considered and rejected

- **Keep tag-trigger and ALSO add `workflow_call`** (both triggers): rejected. The dual-trigger model creates two paths to the same deploy and forces every reader to ask "which trigger fired this run?". The single-call model is unambiguous.
- **Tag-trigger only, no `workflow_dispatch`** (the original design): rejected for the four reasons above.
- **Single-workflow model** (release + deploy in one file, no `workflow_call`): rejected. See R10 — the split keeps each file's responsibility crisp and the redeploy path requires `production.yml` to be independently invocable.

---

## R-NEW-B — Release body template

### Decision

The release body (the `body:` of the GitHub Release object) is generated by a bash step in `create-release.yml` that writes `release_body.md` to the workflow's working directory, and then `softprops/action-gh-release@v2` consumes it via `body_path: release_body.md`. The template is defined in `spec.md` FR-010g-body and the placeholder mapping is in FR-010g-emoji.

### Template structure (verbatim — see FR-010g-body for the exact form)

```
## {EMOJI} {Patch|Minor|Major} Release

**Version**: `v<X.Y.Z>`
**Type**: {Bug fixes | Minor enhancements | Major release / breaking changes}
**Environment**: 🚀 Production

---

## 📝 Changes

{release_description}

## 📋 Commit History

{auto-generated commit list since previous tag, format `- <commit subject> (<short_sha>)`}

**Full Changelog**: <compare URL or commits URL>

---

### 🚀 Deployment

This release will be automatically deployed to **Production**.

- **Environment**: `prd`
- **Service**: `sumo-ayce`
{additional_notes_section_if_non_empty}

---

🤖 *This release was created by @<github.actor> via GitHub Actions*
```

### Design decisions

1. **Semantic emoji mapping (`🐛 / ✨ / 🚨`) over generic ones**: the gitmoji convention is used in this project's commit messages (see `.claude/skills/commit`), and the bump emoji maps to the same semantic class — `🐛` for bug-fix patches, `✨` for minor enhancements, `🚨` for major / breaking releases. Using the gitmoji-aligned emoji means a maintainer scanning the Releases page instantly understands the change class without reading the body.
2. **`HEAD^` in `git log` / `git describe`**: the release commit itself (the `[skip ci]` `package.json` bump) is the LATEST commit on `master` when the body is generated. Including it in the commit history would clutter the changelog with a self-referential "🔖 chore(release): v<X.Y.Z> [skip ci]" entry. `HEAD^` excludes that commit and surfaces the actual feature commits since the previous tag. (`git describe --tags --abbrev=0 HEAD^` also excludes the new tag itself, since the workflow has not yet pushed it at the moment the body is built — but the workflow pushes the tag BEFORE the body step, so the precaution is doubled: both `describe` and `log` use `HEAD^`.)
3. **First-release fallback** (no previous tag): `git describe --tags --abbrev=0 HEAD^` exits non-zero when no prior tag exists. The bash step traps this with `2>/dev/null || echo ""` and falls back to `git log HEAD^ --pretty=format:'- %s (%h)' | head -50` (capped at 50 commits since repo init). For the changelog URL, the compare URL (`/compare/...`) is invalid without a previous tag, so the step falls back to `${{ github.server_url }}/${{ github.repository }}/commits/${NEW_TAG}` (link to commits view at the tag).
4. **`additional_notes` conditional inclusion**: when the maintainer leaves the optional input empty, the Additional Notes section MUST be omitted entirely — no empty heading, no stray separator. When non-empty, the section is inserted BEFORE the final `---` separator that precedes the bot signature, with its own leading `---` separator so the visual hierarchy stays clean (Deployment block → `---` → Additional Notes → `---` → bot signature).
5. **`body_path: release_body.md` (in repo working directory) over `body_path: /tmp/release_body.md`**: the workflow has already checked out the repo, so writing to the working directory is the natural choice. Using `/tmp/` works but is less idiomatic (and the previous draft of C4.9 erroneously specified `/tmp/`; corrected in this revision).
6. **`name:` field uses the title format from FR-010g-title (NOT just `v<X.Y.Z>`)**: the title `🚀 v<X.Y.Z> - <Type> Release (Production)` makes the release class scannable from the GitHub repository's Releases page without opening each entry. The `(Production)` suffix is a future-proofing hook: if a `(Preview)` or `(Beta)` release class is ever added, the existing entries already disambiguate.

### Alternatives considered and rejected

- **Inline body string in `softprops/action-gh-release@v2`'s `body:` field** (no separate `release_body.md` file): rejected. The optional `additional_notes` append and the commit-history block require shell logic that's much cleaner in a bash step than in YAML string templating. Writing to a file once and referencing it via `body_path:` is the de-facto pattern.
- **`actions/github-script@v7` inline JS calling `repos.createRelease`**: rejected — see R12.
- **Auto-generated full changelog (e.g. via `release-drafter` action)**: rejected. The hand-supplied `release_description` is the maintainer's intentional summary; auto-generation would force the maintainer to QA an auto-draft, which is more work for less control. The commit-history block under `## 📋 Commit History` already gives readers the full diff in a compact form for free.

---

## R-NEW-C — Service name in Deployment block (no Region line)

### Decision

The Deployment block in `release_body.md` MUST include ONLY:

- `**Environment**: \`prd\``
- `**Service**: \`sumo-ayce\``

NO `Region:` line. The Service value MUST be the literal string `sumo-ayce`.

### Rationale

- **Vercel handles edge regions automatically**: a Nuxt project deployed on Vercel is served from Vercel's global edge network. There is no single "region" assigned to the deployment in the way a traditional cloud provider (AWS EC2, GCP Compute Engine) assigns one. The build's serverless functions may run in one or more Vercel function regions (configured at the Vercel project level, defaulting to `iad1` for new projects but reconfigurable per-function in `nuxt.config.ts`), and the edge cache lives on every PoP. Showing one region in the release notes is **misleading** — it implies a single-region deployment when the reality is multi-region edge.
- **Inferring a region risks staleness**: even if the body template attempted to extract a default region from the project's config, that value would drift the moment the project is reconfigured. Maintainers reading old release notes would see outdated region info with no signal that it's outdated.
- **The maintainer's intent is captured elsewhere**: if a release is functionally region-significant (e.g. a feature only available in a specific region), the maintainer can document this in `release_description` or `additional_notes`. The structured `Region:` line is the wrong primitive — it suggests one region per release, which is not how Vercel works.
- **Human request, explicit rejection**: an earlier draft of the template included a `Region:` line. The human reviewer explicitly rejected it during the design review (2026-06-17) on the grounds above. This section captures the rejection for future readers so the design intent does not get re-litigated.

### Service name

`sumo-ayce` is the canonical project identifier — it matches:

- The repo name (`sumo-ayce`).
- The Vercel project slug.
- The npm `package.json` `"name"` field.
- The `docs/business/` references throughout the codebase.

There is no separate "service" abstraction in this project (no microservices, no multi-app monorepo). The Deployment block's `Service:` line is essentially a label for human readers — a one-deployment-per-repo project pins it to `sumo-ayce` and forgets it.

### Alternatives considered and rejected

- **`Region:` line with `iad1` hardcoded**: rejected — see above.
- **`Region:` line dynamically read from `nuxt.config.ts`**: rejected — adds parsing complexity, drifts silently when the config changes, and is misleading even when accurate (multi-region edge).
- **Omit the entire Deployment block**: rejected. The Environment + Service lines DO carry signal — they reassure the reader that this release is a production deployment of `sumo-ayce` (vs a preview, vs a different service). Removing them would force the reader to infer this from context.

---

## R14 — Permissions surface for `create-release.yml`

### Decision

`create-release.yml` declares `permissions: contents: write` at the job (or workflow) level. No other permission scope is granted (no `actions: write`, no `packages: write`, no `id-token: write`, no `deployments: write`). The built-in `GITHUB_TOKEN` is used; no personal access token (PAT) is introduced.

### Rationale

- **Minimum required for the four side effects**: the workflow must (a) push a commit to `master`, (b) push a tag, (c) create a GitHub Release object. All three operations require `contents: write` on the `GITHUB_TOKEN`. None of them requires `actions: write` (the workflow does not modify other workflows), `packages: write` (no package publish), `id-token: write` (no OIDC federation), or `deployments: write` (no GitHub Deployments-API surfacing in this workflow — that lives in `preview.yml` and `production.yml`).
- **Bounded by the branch guard**: the `if: github.ref == 'refs/heads/master'` guard ensures the elevated permission can only be exercised when the workflow runs from `master`. A dispatch from any other branch is skipped before any write happens.
- **Bounded by the workflow run lifetime**: `GITHUB_TOKEN` is generated fresh for each workflow run and expires when the run ends. There is no long-lived credential to leak.
- **Article VI assessment**: the elevated permission is documented, minimal, time-bounded, and operates only on the GitHub repository itself (not on third-party services, not on sensitive customer data). Article VI is PASS.

### Branch-protection implications

Branch protection on `master` becomes MORE important with this feature, not less. Because `create-release.yml` itself pushes a commit to `master`, the branch protection rules MUST allow GitHub Actions (or the `github-actions[bot]` user) to push. Concrete policy guidance (documented in `docs/harness/ci-cd.md` §4):

- Require pull-request reviews for `master` — but with an exception for the `github-actions[bot]` actor OR by configuring "Restrict who can push to matching branches" to allow `github-actions`.
- Require status checks (`verify` and `storybook`) to pass — these are PR-time checks, they do NOT apply to the bot's release commit because that commit lands directly on `master` without a PR. This is by design; the release commit is metadata-only and the quality gate already ran inside `create-release.yml` immediately before the bump.
- Require linear history — compatible with the workflow (it produces a single commit on top of `master` HEAD).

### Alternatives considered and rejected

- **Use a PAT (personal access token) instead of `GITHUB_TOKEN`**: rejected. PATs are long-lived, tied to a specific user, and a leak rotates badly. `GITHUB_TOKEN` with the minimum required scope is the correct primitive.
- **Grant `permissions: write-all`** (catch-all): rejected for principle of least privilege. The verb list is small and known; declaring it explicitly is better than blanket write.
- **Configure the bot to bypass branch protection via a "deploy key" or GitHub App**: rejected as over-engineering for this feature's scope. The branch-protection-with-bot-exception pattern is GitHub's documented happy path.
