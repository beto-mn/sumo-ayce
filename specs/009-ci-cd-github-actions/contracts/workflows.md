# Contracts — Workflow Files

This document is the formal contract the implementer's four workflow files MUST satisfy. It is consumed by `/speckit.tasks` to derive concrete, verifiable tasks and by the reviewer agent for post-implementation verification.

For the structural shape (top-level YAML keys, job names, step order) see `../data-model.md`. This file lists the **contractual requirements** — the assertions that the reviewer agent will check.

---

## C1. `.github/workflows/ci.yml` contract

The reviewer agent verifies (after implementation):

| # | Contract requirement | Source |
|---|---|---|
| C1.1 | The file exists at `.github/workflows/ci.yml` (path is exact). | FR-001 |
| C1.2 | The `on:` trigger is `pull_request` with NO `branches:` filter (runs on PRs to any base branch). | FR-001 |
| C1.3 | The file declares a top-level `concurrency` block with `group: ${{ github.workflow }}-${{ github.ref }}` and `cancel-in-progress: true`. | FR-006 |
| C1.4 | The file declares `permissions: contents: read` at the top level (read-only). | Article VI, principle of least privilege |
| C1.5 | At least one job runs on `ubuntu-latest`. | R3, R4 |
| C1.6 | A `verify` job runs, in order: `actions/checkout@v4` → `pnpm/action-setup@v4` → `actions/setup-node@v4` (with `node-version: 20` and `cache: 'pnpm'`) → `pnpm install --frozen-lockfile` → `pnpm check` → `pnpm typecheck` → `pnpm test` → `pnpm build`. Step order may not be permuted. | FR-002, FR-004, FR-005, FR-007 |
| C1.7 | The `pnpm install` step uses `--frozen-lockfile` (verifiable by grep). | FR-002, security/repro |
| C1.8 | The Node major version is `20` (verifiable by grep `node-version: 20`). | FR-004 |
| C1.9 | A `storybook` job runs in parallel with `verify` (no `needs:` declaration coupling them). It runs `pnpm storybook:build`. | FR-018 |
| C1.10 | No third-party action (anything not under `actions/*` or `pnpm/action-setup`) appears in the file. | KISS / Article X |
| C1.11 | No `${{ secrets.* }}` reference appears in the file (`ci.yml` requires no Vercel auth). | Scope hygiene |
| C1.12 | The `pnpm test` step does not pass `--passWithNoTests` (the suite is mandatory; a zero-test run must NOT be reported as success). | FR-003 |

---

## C2. `.github/workflows/preview.yml` contract

| # | Contract requirement | Source |
|---|---|---|
| C2.1 | The file exists at `.github/workflows/preview.yml`. | FR-008 |
| C2.2 | The `on:` trigger is `push:` with `branches: [develop]` (exactly one branch). | FR-008 |
| C2.3 | The file declares `concurrency` with `group: ${{ github.workflow }}-${{ github.ref }}` and `cancel-in-progress: true`. | R5 |
| C2.4 | The file declares `permissions: contents: read` and `deployments: write` at the top level. | R4 |
| C2.5 | The file declares top-level `env:` with `VERCEL_ORG_ID: ${{ secrets.VERCEL_ORG_ID }}` and `VERCEL_PROJECT_ID: ${{ secrets.VERCEL_PROJECT_ID }}`. | FR-012 |
| C2.6 | The `deploy` job runs on `ubuntu-latest`. | — |
| C2.7 | Steps include, in order: `actions/checkout@v4` → `pnpm/action-setup@v4` → `actions/setup-node@v4` (`node-version: 20`, `cache: 'pnpm'`) → `pnpm install --frozen-lockfile` → `vercel pull --yes --environment=preview` → `vercel build` → `vercel deploy --prebuilt` → `actions/github-script@v7` (deployment surface). | FR-008, FR-009, R1 |
| C2.8 | Every `vercel` invocation uses `npx vercel@<pinned-major>` with the major version pinned (verifiable by grep — no bare `npx vercel` without `@`). | R1 |
| C2.9 | Every `vercel` invocation passes `--token=${{ secrets.VERCEL_TOKEN }}` (no token in environment alone — explicit on the CLI line for clarity). | FR-011, FR-013 |
| C2.10 | The `vercel deploy` step captures stdout's final line into a step output named `preview_url` (or equivalent). | FR-009 |
| C2.11 | The `actions/github-script@v7` step calls `github.rest.repos.createDeployment` with `environment: 'preview'` and `github.rest.repos.createDeploymentStatus` with `state: 'success'` and `environment_url: <preview_url>`. | FR-009, R4 |
| C2.12 | No literal Vercel token, ORG ID, or PROJECT ID value appears in the file (only `${{ secrets.* }}` references). | FR-013, Article VI |
| C2.13 | No step echoes a secret value to stdout (no `echo $VERCEL_TOKEN` or equivalent). | FR-019 |
| C2.14 | No third-party action other than `actions/checkout`, `actions/setup-node`, `actions/github-script`, `pnpm/action-setup`. | KISS / Article X |
| C2.15 | The `deploy` job declares `environment: dev` (the GitHub Environment scope for the three Vercel secrets). The Deployments-API `environment: 'preview'` value in the `actions/github-script@v7` block is a DIFFERENT namespace and remains `'preview'` (unchanged). | FR-021, FR-022 |

---

## C3. `.github/workflows/production.yml` contract (workflow_call + workflow_dispatch — NOT tag-triggered)

| # | Contract requirement | Source |
|---|---|---|
| C3.1 | The file exists at `.github/workflows/production.yml`. | FR-010 |
| C3.2 | The `on:` block declares EXACTLY two triggers: `workflow_call:` and `workflow_dispatch:`. Each trigger declares a single required `tag` input of type `string`. NO `push:`, NO `tags:`, NO `branches:`, NO `schedule:`, NO `pull_request:` key may appear under `on:`. | FR-010, FR-010-bis, SC-012 |
| C3.2.1 | The `workflow_call:` block declares `inputs: { tag: { description: <human-readable>, type: string, required: true } }`. The `workflow_dispatch:` block declares the SAME `inputs:` shape (same name `tag`, same `type: string`, same `required: true`) so both invocation paths are interchangeable. | FR-010 |
| C3.3 | The file declares `concurrency` with `group: ${{ github.workflow }}-${{ inputs.tag }}` (NOT `github.ref` — the `tag` input is the canonical identifier) and `cancel-in-progress: true`. | R5 |
| C3.4 | The file declares `permissions: contents: read` and `deployments: write` at the top level. | R4 |
| C3.5 | The file declares top-level `env:` with `VERCEL_ORG_ID: ${{ secrets.VERCEL_ORG_ID }}` and `VERCEL_PROJECT_ID: ${{ secrets.VERCEL_PROJECT_ID }}`. | FR-012 |
| C3.6 | The `deploy` job runs on `ubuntu-latest`. | — |
| C3.7 | Steps include, in order: `actions/checkout@v4` (with `ref: ${{ inputs.tag }}` so the tagged commit is checked out — NOT `github.ref`) → `pnpm/action-setup@v4` → `actions/setup-node@v4` (`node-version: 20`, `cache: 'pnpm'`) → `pnpm install --frozen-lockfile` → `vercel pull --yes --environment=production` → `vercel build --prod` → `vercel deploy --prebuilt --prod` → `actions/github-script@v7` (deployment surface, environment `'production'`). | FR-010, R1 |
| C3.8 | Every `vercel` invocation uses `npx vercel@<pinned-major>` with the major version pinned. | R1 |
| C3.9 | Every `vercel` invocation passes `--token=${{ secrets.VERCEL_TOKEN }}`. | FR-011, FR-013 |
| C3.10 | `vercel build` uses `--prod` and `vercel deploy` uses `--prebuilt --prod`. | R1 |
| C3.11 | The `actions/github-script@v7` step calls `github.rest.repos.createDeployment` with `environment: 'production'` and `github.rest.repos.createDeploymentStatus` with `state: 'success'` and `environment_url: <production_url>`. The `ref` passed to `createDeployment` MUST be `inputs.tag` (NOT `github.sha` — the deployment record should point at the tag, not at the workflow's own commit). | R4 |
| C3.12 | No literal Vercel token, ORG ID, or PROJECT ID value appears in the file. | FR-013, Article VI |
| C3.13 | No step echoes a secret value to stdout. | FR-019 |
| C3.14 | No third-party action other than `actions/checkout`, `actions/setup-node`, `actions/github-script`, `pnpm/action-setup`. | KISS / Article X |
| C3.15 | The `deploy` job declares `environment: prd` (the GitHub Environment scope for the three Vercel secrets). | FR-021, FR-022 |
| C3.16 | The `on:` block contains NEITHER a `branches:` key NOR a `tags:` key. Verifiable by `! grep -E '^\s*(branches\|tags):' .github/workflows/production.yml` (returns no match). | FR-010, FR-010-bis, SC-012 |
| C3.17 | The file does NOT contain `push:` anywhere under `on:` (no `push:` key may appear at all). Verifiable by `! grep -E '^\s*push:' .github/workflows/production.yml`. The tag-trigger model is explicitly REJECTED — the workflow runs only when explicitly invoked by `create-release.yml`'s `workflow_call` or by a maintainer's `workflow_dispatch`. | FR-010-bis |

---

## C4. `.github/workflows/create-release.yml` contract (NEW — workflow_dispatch release ceremony)

| # | Contract requirement | Source |
|---|---|---|
| C4.1 | The file exists at `.github/workflows/create-release.yml`. | FR-010a |
| C4.2 | The `on:` trigger is EXACTLY `workflow_dispatch:` (NO `push:`, NO `pull_request:`, NO `schedule:`). | FR-010a |
| C4.3 | The `release` job declares `if: github.ref == 'refs/heads/master'` (branch guard refusing dispatches from any non-master branch). | FR-010c, SC-013 |
| C4.4 | The workflow declares `permissions: contents: write` (at job OR workflow level — sufficient for the built-in `GITHUB_TOKEN` to push commits, push tags, and create GitHub Releases). NO other permission scope is granted (no `actions: write`, no `packages: write`, no `id-token: write`, no `deployments: write`). | FR-010h, R14 |
| C4.5 | The `workflow_dispatch` block declares EXACTLY three inputs with these names and properties: `version_bump` (type `choice`, options exactly `[patch, minor, major]`, required `true`, no default); `release_description` (type `string`, required `true`); `additional_notes` (type `string`, required `false`). | FR-010b |
| C4.6 | The job's quality-gate steps run `pnpm check`, `pnpm typecheck`, `pnpm test`, `pnpm build` in that order, AFTER the install prefix and BEFORE the version-bump step. If ANY of these steps fails, no version bump / commit / tag / Release occurs (automatic via `set -e`). | FR-010d |
| C4.7 | The bump step runs `npm version ${{ inputs.version_bump }} --no-git-tag-version`. The `--no-git-tag-version` flag is REQUIRED (the workflow creates its own annotated tag separately in C4.8). The step captures the new version into a step output named `new_version` via `node -p "require('./package.json').version"` and `>> "$GITHUB_OUTPUT"`. | FR-010e, R11 |
| C4.8 | The commit-and-tag step performs (in order): `git add package.json pnpm-lock.yaml \|\| git add package.json`; `git commit -m "🔖 chore(release): v${{ steps.bump.outputs.new_version }} [skip ci]"` (the `[skip ci]` marker is REQUIRED); `git tag -a "v${{ steps.bump.outputs.new_version }}" -m "Release v..."` (annotated, NOT lightweight); `git push origin master`; `git push origin "v${{ steps.bump.outputs.new_version }}"`. | FR-010f, FR-010i |
| C4.9 | The GitHub Release creation step uses `softprops/action-gh-release@v2` (pinned to major `v2`) with `tag_name: v<new_version>`, `name: <release-title-from-C4.14>`, `body_path: release_body.md` (built by a preceding bash step from the template in C4.15 — note: the path is relative to the workflow's working directory, NOT `/tmp/release_body.md`, so the file lives in the checked-out repo's root during the run), `draft: false`, `prerelease: false`. | FR-010g, R12 |
| C4.10 | The workflow does NOT contain `npx vercel` anywhere (the release ceremony does NOT contact Vercel — the deploy lives in `production.yml`). The `release` job does NOT declare an `environment:` (it does not need Vercel-scoped secrets). | FR-010k |
| C4.11 | The workflow's checkout step uses `fetch-depth: 0` AND `ref: master` AND `token: ${{ secrets.GITHUB_TOKEN }}` (full history for tag operations; explicit `ref: master` defends against branch-guard bypass). | data-model §3a |
| C4.12 | No literal Vercel credential value appears in the `release` job (no `VERCEL_TOKEN`, `VERCEL_ORG_ID`, or `VERCEL_PROJECT_ID` references — the `release` job does not contact Vercel). The `deploy` job (C4.21) is permitted to reference these secrets because they are propagated via `secrets: inherit`. | Article VI |
| C4.13 | No third-party action other than `actions/checkout`, `actions/setup-node`, `pnpm/action-setup`, `softprops/action-gh-release`. | KISS / Article X |
| C4.14 | The GitHub Release `name:` field MUST be EXACTLY `🚀 v${{ steps.bump.outputs.new_version }} - ${{ env.RELEASE_TYPE_TITLE }} Release (Production)`, where `RELEASE_TYPE_TITLE` is computed in a preceding bash step from the `version_bump` input via the map `{patch → Patch, minor → Minor, major → Major}`. Verifiable by `grep -E "🚀 v\$\{\{ steps\.bump\.outputs\.new_version \}\}.*Release \(Production\)" .github/workflows/create-release.yml`. | FR-010g-title |
| C4.15 | The bash step that generates `release_body.md` MUST produce a body matching the template in `spec.md` FR-010g-body literally (with the placeholders substituted). The reviewer runs the bash step locally with sample inputs for the three bump types and confirms the output matches the FR-010g-body template byte-for-byte (modulo the substituted values). | FR-010g-body |
| C4.16 | The `{EMOJI}` and `{Type}` substitutions used in the body MUST follow the FR-010g-emoji map exactly: `patch` → emoji `🐛` and type `Bug fixes`; `minor` → emoji `✨` and type `Minor enhancements`; `major` → emoji `🚨` and type `Major release / breaking changes`. Verifiable by inspecting the bash step's case/if logic in `create-release.yml`. | FR-010g-emoji |
| C4.17 | The bash step MUST compute the commit-history block via `git describe --tags --abbrev=0 HEAD^ 2>/dev/null` (with the `HEAD^` argument REQUIRED — the release commit itself is the latest commit and MUST NOT appear in the history list). When a previous tag exists, the step MUST use `git log "${PREV_TAG}..HEAD^" --pretty=format:'- %s (%h)'`. When NO previous tag exists, the step MUST fall back to `git log HEAD^ --pretty=format:'- %s (%h)' | head -50` (capped at 50 commits) AND use `${{ github.server_url }}/${{ github.repository }}/commits/${NEW_TAG}` for the Full Changelog URL (instead of the `compare/...` URL used for non-first releases). | FR-010g-history |
| C4.18 | The Full Changelog URL MUST be `${{ github.server_url }}/${{ github.repository }}/compare/${PREV_TAG}...${NEW_TAG}` when a previous tag exists, and `${{ github.server_url }}/${{ github.repository }}/commits/${NEW_TAG}` for the first release. The URL is hard-wired into the body template by the bash step. | FR-010g-history |
| C4.19 | The Additional Notes section MUST be conditionally included: when `inputs.additional_notes` is empty, the section MUST be omitted entirely (no empty heading, no stray separator). When non-empty, the section MUST be inserted IMMEDIATELY BEFORE the `---` separator that precedes the bot signature, with the form `\n---\n\n## 📌 Additional Notes\n\n${additional_notes}\n` (a leading `---` separator, then the heading, then the content, then a blank line before the trailing `---` and the bot signature). | FR-010g-additional-notes |
| C4.20 | The Deployment block in the body MUST include only `Environment: prd` and `Service: sumo-ayce`. NO `Region:` line may appear. Verifiable by `! grep -E '^\s*-\s*\*\*Region\*\*' .github/workflows/create-release.yml` (the literal token "Region" must not appear in the body template). | FR-010g-body, research.md "Service name in Deployment block" |
| C4.21 | The workflow declares a SECOND job named `deploy` that runs after `release` via `needs: release` and is defined as `uses: ./.github/workflows/production.yml` with `with: { tag: ${{ needs.release.outputs.tag }} }` and `secrets: inherit`. The `release` job MUST declare `outputs: { tag: ${{ steps.bump.outputs.new_tag }} }` so the called workflow can receive the new tag. Note: `steps.bump.outputs.new_tag` MUST be the string `v<X.Y.Z>` (the `v` prefix is REQUIRED — `production.yml`'s `actions/checkout` uses this string literal as `ref:`). | FR-010, R10 |
| C4.22 | The `deploy` job (C4.21) MUST be a job-level `uses:` reference (calling a reusable workflow). It MUST NOT inline the production deploy steps in `create-release.yml`. Verifiable by `grep -E 'uses: \./\.github/workflows/production\.yml' .github/workflows/create-release.yml`. | FR-010, R10 |
| C4.23 | The `release` job's bump step MUST also expose `new_tag` as a step output (in addition to `new_version`), populated as `new_tag=v${NEW_VERSION}`. This is the value consumed by C4.21's `with: { tag: ... }`. | FR-010, C4.21 |

---

## C5. `.gitignore` contract

| # | Contract requirement | Source |
|---|---|---|
| C5.1 | The file `.gitignore` contains a line matching exactly `.vercel/` (folder pattern, trailing slash). | FR-017, R7 |
| C5.2 | Adding the rule does NOT remove any existing rule (the existing 7 rule groups stay). | Hygiene |

> **Backward-compatibility note**: prior versions of this document referenced this section as "C4" (gitignore). The renumbering to "C5" follows the insertion of the create-release contract above as "C4". The gitignore contract content is unchanged.

---

## C6. `docs/harness/ci-cd.md` contract

| # | Contract requirement | Source |
|---|---|---|
| C6.1 | The file exists at `docs/harness/ci-cd.md`. | FR-014 |
| C6.2 | The file documents the three required GitHub secrets by name (`VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`) and their retrieval steps from the Vercel dashboard. | FR-014, data-model.md §4 |
| C6.3 | The file documents the two GitHub Environments (`dev`, `prd`), how to create them, and how to scope the three secrets per environment. | FR-021, FR-022, data-model.md §4 §5b |
| C6.4 | The file documents the recommended branch-protection rules as a recommendation — NOT as an enforced action. The recommendation notes that branch protection on `master` must allow GitHub Actions (`github-actions[bot]`) to push, because `create-release.yml` itself pushes to `master`. | FR-014, FR-015, R14 |
| C6.5 | The file documents the six-step post-merge verification procedure (create environments → add secrets → no-op PR → push to develop → merge to master → dispatch "Create release"). | research.md R8 (updated) |
| C6.6 | The file documents the "How to ship to production" section (open Actions → "Create release" → pick bump → fill description → run; recovery path: re-run `production.yml` against the same tag if the deploy fails transiently). | spec.md US3, quickstart.md |
| C6.7 | The file documents the secret-rotation procedure (replace `VERCEL_TOKEN` value in the relevant GitHub Environment; no workflow edits needed). | FR-016 |
| C6.8 | The file documents the handover procedure for a new repo owner (create environments, scope secrets, no source edits required). | US4, FR-016 |
| C6.9 | The file contains no actual secret values (use placeholders like `<your-token-here>`). | Article VI |
| C6.10 | The file cites Article VI (sensitive data) and Article IX (verification pipeline) of the constitution at the relevant sections. | Article cross-reference discipline |

> **Backward-compatibility note**: prior versions of this document referenced this section as "C5" (docs contract). The renumbering to "C6" follows the insertion of the create-release contract above.

---

## C7. Cross-file contracts (multi-file constraints)

| # | Contract requirement | Source |
|---|---|---|
| C7.1 | The set of secret names referenced across all four workflow files is exactly `{VERCEL_TOKEN, VERCEL_ORG_ID, VERCEL_PROJECT_ID}` + the built-in `GITHUB_TOKEN`. `ci.yml` references NONE of the Vercel secrets; `preview.yml` and `production.yml` reference all three (each scoped to its GitHub Environment); `create-release.yml` references NONE of the Vercel secrets (only `GITHUB_TOKEN`). | FR-013, FR-016 |
| C7.2 | The Node major version is `20` in every workflow file — including `create-release.yml` — (no version drift across files). | FR-004 |
| C7.3 | The `vercel` CLI major version is pinned to the **same** major value across `preview.yml` and `production.yml` (no version drift between preview and production). | R1 |
| C7.4 | The `concurrency` block is present in `ci.yml`, `preview.yml`, and `production.yml`. In `ci.yml` and `preview.yml` the `group:` is `${{ github.workflow }}-${{ github.ref }}`. In `production.yml` the `group:` is `${{ github.workflow }}-${{ inputs.tag }}` (the `tag` input is the canonical identifier — `github.ref` is meaningless for a `workflow_call` invocation). All three set `cancel-in-progress: true`. `create-release.yml` does NOT require a `concurrency` block (workflow_dispatch runs are serialised by GitHub's default behaviour). | FR-006, R5, C3.3 |
| C7.5 | The `permissions:` block in `preview.yml` and `production.yml` includes `deployments: write`. The `permissions:` block in `ci.yml` does NOT include `deployments: write`. The `permissions:` block in `create-release.yml` includes `contents: write` (and no other write scopes). | R4, R14, principle of least privilege |
| C7.6 | A grep for `vercel_token` (case-insensitive), `vercel_org_id`, `vercel_project_id` across the entire repository (excluding `specs/`, `docs/`, and `.git/`) returns matches ONLY in the form `${{ secrets.VERCEL_*` or as comments. No bare values anywhere. | FR-013, Article VI, SC-006 |
| C7.7 | `production.yml`'s `on:` block contains EXACTLY `workflow_call:` and `workflow_dispatch:` — NO `push:`, NO `tags:`, NO `branches:` may appear anywhere in the file's `on:` block. Verifiable by `grep -E '^\s*workflow_call:' .github/workflows/production.yml`, `grep -E '^\s*workflow_dispatch:' .github/workflows/production.yml`, AND `! grep -E '^\s*(push\|tags\|branches):' .github/workflows/production.yml`. The tag-trigger model is REJECTED. | FR-010, FR-010-bis, SC-012 |
| C7.8 | `preview.yml`'s `deploy` job declares `environment: dev` and `production.yml`'s `deploy` job declares `environment: prd`. `ci.yml` and `create-release.yml` declare NO `environment:` directive. | FR-022 |
| C7.9 | The `release` job in `create-release.yml` does NOT contain `npx vercel` anywhere (cross-check that the release ceremony never calls the Vercel CLI). The `deploy` job (C4.21) MAY appear to "call Vercel" only via the `uses: ./.github/workflows/production.yml` reusable-workflow invocation; the file itself does NOT contain the string `npx vercel` because the deploy steps live exclusively in `production.yml`. Verifiable by `! grep -E 'npx vercel' .github/workflows/create-release.yml`. | FR-010k |
| C7.10 | `create-release.yml` MUST chain to `production.yml` via a `deploy` job that uses `needs: release`, `uses: ./.github/workflows/production.yml`, `with: { tag: ${{ needs.release.outputs.tag }} }`, and `secrets: inherit`. Verifiable by `grep -E 'uses: \./\.github/workflows/production\.yml' .github/workflows/create-release.yml` AND `grep -E 'secrets: inherit' .github/workflows/create-release.yml`. The `secrets: inherit` directive is REQUIRED — without it the called workflow cannot access `VERCEL_TOKEN`, `VERCEL_ORG_ID`, or `VERCEL_PROJECT_ID`. | FR-010, R10 |

> **Backward-compatibility note**: prior versions of this document referenced this section as "C6" (cross-file). The renumbering to "C7" follows the insertion of the create-release contract above.

---

## C8. `package.json` contract (NEW)

| # | Contract requirement | Source |
|---|---|---|
| C8.1 | `package.json` contains a top-level field `"version"`. After this feature ships its initial implementation, the value is exactly `"0.1.0"` (the seed). Subsequent release runs bump it. | FR-010j |
| C8.2 | The `"version"` field is placed between `"name"` and `"private"` (the surrounding fields determine the readable shape of the JSON). | data-model §5a |
| C8.3 | Adding the `"version"` field does NOT alter any other field of `package.json` (no script additions, no dep changes, no key reordering). | data-model §5a |

---

## C9. Reviewer-runnable verification commands

After implementation, the reviewer agent runs these commands and asserts results:

```bash
# C1.1, C2.1, C3.1, C4.1, C5.1, C6.1 — file existence
test -f .github/workflows/ci.yml
test -f .github/workflows/preview.yml
test -f .github/workflows/production.yml
test -f .github/workflows/create-release.yml
test -f docs/harness/ci-cd.md

# C5.1 — gitignore rule
grep -E '^\.vercel/$' .gitignore

# C8.1, C8.2 — package.json version field
node -e 'const p=require("./package.json"); if (!p.version) { process.exit(1) }; console.log(p.version)'
node -e 'const p=require("./package.json"); const k=Object.keys(p); const i=k.indexOf("version"); if (!(k[i-1]==="name" && (k[i+1]==="type" || k[i+1]==="private"))) { process.exit(1) }; console.log("OK")'

# C1.7 — frozen lockfile (all four workflow files)
grep -E 'pnpm install --frozen-lockfile' .github/workflows/ci.yml
grep -E 'pnpm install --frozen-lockfile' .github/workflows/preview.yml
grep -E 'pnpm install --frozen-lockfile' .github/workflows/production.yml
grep -E 'pnpm install --frozen-lockfile' .github/workflows/create-release.yml

# C1.8, C7.2 — Node 20 consistency
grep -c 'node-version: 20' .github/workflows/ci.yml
grep -c 'node-version: 20' .github/workflows/preview.yml
grep -c 'node-version: 20' .github/workflows/production.yml
grep -c 'node-version: 20' .github/workflows/create-release.yml

# C2.8, C3.8, C7.3 — pinned Vercel CLI major (same across preview and production)
grep -E 'npx vercel@[0-9]+' .github/workflows/preview.yml
grep -E 'npx vercel@[0-9]+' .github/workflows/production.yml
diff <(grep -oE 'npx vercel@[0-9]+' .github/workflows/preview.yml | sort -u) \
     <(grep -oE 'npx vercel@[0-9]+' .github/workflows/production.yml | sort -u) && echo "vercel major OK"

# C2.15, C3.15, C7.8 — environment scoping
grep -E '^\s*environment:\s*dev\s*$' .github/workflows/preview.yml
grep -E '^\s*environment:\s*prd\s*$' .github/workflows/production.yml
! grep -E '^\s*environment:\s*(dev|prd)\s*$' .github/workflows/ci.yml
! grep -E '^\s*environment:\s*(dev|prd)\s*$' .github/workflows/create-release.yml

# C3.2, C3.16, C3.17, C7.7 — production.yml is workflow_call + workflow_dispatch, NOT push-triggered
grep -E '^\s*workflow_call:' .github/workflows/production.yml
grep -E '^\s*workflow_dispatch:' .github/workflows/production.yml
! grep -E '^\s*push:' .github/workflows/production.yml
! grep -E '^\s*tags:' .github/workflows/production.yml
! grep -E '^\s*branches:' .github/workflows/production.yml

# C4.21, C4.22, C7.10 — create-release.yml chains to production.yml via workflow_call
grep -E 'uses: \./\.github/workflows/production\.yml' .github/workflows/create-release.yml
grep -E 'secrets: inherit' .github/workflows/create-release.yml
grep -E 'needs: release' .github/workflows/create-release.yml

# C4.14 — Release title format
grep -E 'name:.*🚀 v.*Release \(Production\)' .github/workflows/create-release.yml

# C4.20 — Deployment block has no Region line
! grep -E '^\s*-\s*\*\*Region\*\*' .github/workflows/create-release.yml

# C4.17 — Commit history generation uses HEAD^ (release commit excluded)
grep -E 'git log .*HEAD\^' .github/workflows/create-release.yml
grep -E 'git describe --tags --abbrev=0 HEAD\^' .github/workflows/create-release.yml

# C4.2, C4.3 — create-release.yml workflow_dispatch only, branch-guarded
grep -E 'workflow_dispatch:' .github/workflows/create-release.yml
! grep -E '^\s*(push|pull_request|schedule):' .github/workflows/create-release.yml
grep -E "if:\s*github\.ref\s*==\s*'refs/heads/master'" .github/workflows/create-release.yml

# C4.4 — create-release.yml permissions
grep -E 'contents:\s*write' .github/workflows/create-release.yml
! grep -E '(actions|packages|id-token|deployments):\s*write' .github/workflows/create-release.yml

# C4.7 — npm version bump with --no-git-tag-version
grep -E 'npm version \$\{\{ inputs\.version_bump \}\} --no-git-tag-version' .github/workflows/create-release.yml

# C4.8 — [skip ci] in commit message
grep -E '\[skip ci\]' .github/workflows/create-release.yml

# C4.9 — softprops/action-gh-release pinned to v2
grep -E 'softprops/action-gh-release@v2' .github/workflows/create-release.yml

# C4.10, C7.9 — create-release.yml does NOT call Vercel
! grep -E 'npx vercel' .github/workflows/create-release.yml

# C7.6 — no leaked secret values anywhere outside specs/docs/.git
grep -REn --include='*.yml' --include='*.yaml' --include='*.ts' --include='*.json' --include='*.md' \
  -e 'VERCEL_TOKEN' -e 'VERCEL_ORG_ID' -e 'VERCEL_PROJECT_ID' . \
  | grep -vE '^(\./specs/|\./docs/|\./\.git/)' \
  | grep -vE '\$\{\{\s*secrets\.VERCEL_(TOKEN|ORG_ID|PROJECT_ID)' \
  || echo "OK (no leaks)"

# C1, C2, C3, C4 (structural) — actionlint if available
command -v actionlint >/dev/null && actionlint .github/workflows/*.yml || echo "actionlint not available — falling back to YAML syntax check"

# Closeout — ./init.sh still green
./init.sh
```

The reviewer agent treats any failed assertion as a REJECTED outcome with the specific contract number cited (e.g. "REJECTED: C4.7 violated — `create-release.yml`'s `npm version` invocation missing `--no-git-tag-version` flag").

> **Backward-compatibility note**: prior versions of this document referenced the verification-commands section as "C7". The renumbering to "C9" follows the insertion of the create-release contract (C4) and the package.json contract (C8).
