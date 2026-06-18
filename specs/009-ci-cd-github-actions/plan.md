# Implementation Plan: CI/CD via GitHub Actions + Vercel CLI

**Branch**: `feat/009-ci-cd-github-actions` | **Date**: 2026-06-17 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/009-ci-cd-github-actions/spec.md`

## Summary

Stand up a four-workflow GitHub Actions pipeline that owns the project's verification harness on every pull request, deploys preview builds on every push to `develop` (environment `dev`), turns production deploys into a deliberate human ceremony triggered via `workflow_dispatch` from the GitHub UI (`create-release.yml` — bumps `package.json`'s `version`, commits with `[skip ci]`, tags `v<X.Y.Z>`, creates a GitHub Release), and finally deploys to Vercel production (environment `prd`) when that tag is pushed (`production.yml` triggered by `push: tags: ['v*']`). Vercel is contacted exclusively through its CLI, invoked from `ubuntu-latest` runners with three short-lived secrets (`VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`) scoped per GitHub Environment (`dev` / `prd`). The CI workflow remains the cloud formalization of `./init.sh` (one job per local gate). The release workflow re-runs the same quality gate as a pre-condition so a failing build never produces a tag. The handover contract is explicit: the next repository owner inherits a clean repo and only needs to create the two GitHub Environments and swap three secret values in each to keep the pipeline working against their own Vercel workspace.

## Technical Context

**Language/Version**: Node 20 in CI (Vercel's serverless runtime); pnpm 10; Bash 5 (`ubuntu-latest`). Local development runs on Node 22+ but CI deliberately pins to Node 20 to mirror the production runtime exactly.
**Primary Dependencies**: GitHub Actions runner (`ubuntu-latest`), `actions/checkout@v4`, `actions/setup-node@v4` (with `cache: 'pnpm'`), `pnpm/action-setup@v4`, `actions/github-script@v7` (used only in `preview.yml` and `production.yml` for the Deployments API surface), `softprops/action-gh-release@v2` (used only in `create-release.yml` to create the GitHub Release object), Vercel CLI (`npx vercel@<pinned-major>`), and `npm version <patch|minor|major> --no-git-tag-version` (Node-bundled, no third-party action needed for the bump itself).
**Storage**: None directly. Workflows operate on git refs and ephemeral filesystem state in the runner. Secrets live in the GitHub repository's secret store.
**Testing**: Existing Vitest 4 suite (226 tests today across `tests/**`, `server/**`, `app/**`). Workflow YAML correctness is validated structurally via `actionlint` (if available) or `yq`/`yamllint` syntactic validation. End-to-end runtime validation of the workflows themselves is deferred to post-merge human verification (the SDD environment cannot trigger live GitHub Actions runs).
**Target Platform**: GitHub Actions hosted runners (`ubuntu-latest`); Vercel Edge/Serverless production environment.
**Project Type**: CI/CD tooling additive to an existing Nuxt 4 web application. No source-code changes under `app/`, `server/`, `types/`, or `tests/` are required.
**Performance Goals**: PR CI run (warm cache, all jobs) completes in under 5 minutes wall-clock. Preview deploy (push → URL on commit) completes in under 15 minutes. Production deploy completes in under 15 minutes.
**Constraints**: Zero Vercel credentials in source-controlled files. Article IX bans on `--no-verify` and ESLint/Prettier hold in CI. The pipeline must be drop-in portable across repo owners with no file edits.
**Scale/Scope**: Four workflow files (~220 lines YAML total — added `create-release.yml` of ~70 lines), one documentation file (`docs/harness/ci-cd.md`), one `.gitignore` edit, one `package.json` edit (insert `"version": "0.1.0"` between `"name"` and `"private"`). No new app routes, no new tests beyond the existing suite.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Article VI — Security & Sensitive Data (NON-NEGOTIABLE)

**Status**: PASS.

- All four workflows reference Vercel credentials exclusively through `${{ secrets.VERCEL_TOKEN }}`, `${{ secrets.VERCEL_ORG_ID }}`, `${{ secrets.VERCEL_PROJECT_ID }}`. No values appear in source. The two deploy workflows (`preview.yml` and `production.yml`) are scoped to the GitHub Environments `dev` and `prd` respectively, so the secrets are bound at the environment level — not the repository level — making accidental cross-environment exposure (e.g. a `dev` token reaching a `prd` deploy) impossible by construction.
- The local Vercel link folder (`.vercel/`) is added to `.gitignore` so a developer who runs `vercel link` locally cannot accidentally commit `project.json` (which contains the org/project IDs in plaintext).
- GitHub Actions secrets are automatically masked from workflow logs. No workflow step echoes a secret value to stdout (`echo $VERCEL_TOKEN` is forbidden).
- **New permission surface**: `create-release.yml` declares `permissions: contents: write` because it MUST push a `package.json` bump commit, push a tag, and create a GitHub Release on behalf of the built-in `GITHUB_TOKEN`. This scope is the minimum required (no `actions: write`, no `packages: write`, no `id-token: write`); the `GITHUB_TOKEN` is short-lived and scoped to the single workflow run. No PAT is introduced. Article VI is still PASS because the elevated permission (a) is scoped to the smallest possible verb set, (b) operates on the GitHub repository itself, not on sensitive third-party data, and (c) is bounded by the workflow's branch guard (only `master` can dispatch).
- CORS / rate-limiting / Zod validation rules are unaffected by this feature (no server route changes).
- This article is the single most load-bearing gate for this feature: the entire architectural decision (CLI-only, no native integration; manual release ceremony over auto-deploy) flows from the "secrets must not leak, even at handover, and production deploys must be deliberate" rule.

### Article IX — Quality Gates (NON-NEGOTIABLE)

**Status**: PASS.

- The CI workflow's job set is one-to-one with `./init.sh`'s checks:
  - `./init.sh` step 4 `pnpm check` → CI `lint` step
  - `./init.sh` step 5 `pnpm typecheck` → CI `typecheck` step
  - `./init.sh` step 6 `pnpm test` → CI `test` step
  - Local `pnpm build` (Nuxt build runs at `vercel build` time on deploys) → CI `build` step (kept explicit in CI so PRs surface build failures before merge, since deploy workflows do not run on PR events).
- The release workflow (`create-release.yml`) re-runs the same quality gate (`pnpm check && pnpm typecheck && pnpm test && pnpm build`) as a pre-condition before the version bump. This means: a failing build can never produce a tag, and the tag is therefore a stronger contract than a master HEAD commit. Article IX is reinforced, not weakened, by the manual-release model: the quality gate now runs twice (once on PR via `ci.yml`, once at release time via `create-release.yml`).
- Biome remains the sole lint/format tool. No ESLint or Prettier appears in any workflow file.
- Pre-commit, commit-msg, and pre-push hooks (Husky + commitlint) continue to run locally on the contributor's machine; the CI lint/test jobs serve as the cloud-side mirror so a `--no-verify` bypass would still fail the PR.
- The `[skip ci]` marker on the release commit is acceptable: the quality gate already ran inside `create-release.yml` immediately before the bump, so re-running `ci.yml` on the resulting metadata-only commit would be pure waste. Re-running `ci.yml` is NOT skipped on regular commits or PRs.
- Article IX explicitly mandates "the CI pipeline MUST mirror all three gates identically" — this feature is its literal materialization, and the release ceremony extends it to "the same gate must also pass at release time, against the exact `master` HEAD that produces the tag".

### Article X — KISS

**Status**: PASS.

- No custom GitHub Action is written. Only published, version-pinned actions are used (`actions/checkout@v4`, `actions/setup-node@v4`, `pnpm/action-setup@v4`, `actions/github-script@v7`, `softprops/action-gh-release@v2`). The Vercel CLI is invoked via `npx vercel@<major>` with a pinned major version. Version bump uses the Node-bundled `npm version <bump> --no-git-tag-version` — no third-party action.
- The preview-URL surfacing is done through a small inline `actions/github-script@v7` block that calls `repos.createDeployment` + `repos.createDeploymentStatus`. A third-party "deployment-action" alternative was considered and rejected (KISS — one additional supply-chain dependency for a function we can write in ~25 lines of inline JS).
- **Two-workflow split (release vs deploy)**: re-evaluated for KISS. The split is the SIMPLER model, not a more complex one. "Release ceremony" (bump + commit + tag + Release object) and "deploy" (Vercel CLI pull/build/deploy) are two unrelated concerns. Bundling them into a single workflow would (a) couple a deploy failure to a release that already wrote to the git history, and (b) make re-running just the deploy half (because Vercel was flaky for 30 seconds) impossible without re-doing the release ceremony. The tag is the contract between the two workflows — a stable, immutable, human-readable handoff. KISS is preserved: each file does one thing.
- The GitHub Release creation uses `softprops/action-gh-release@v2` (a single well-maintained action with thousands of consumers and an explicit major-version pin) over `actions/github-script@v7` inline JS for this case — see `research.md` for the rationale. This is a deliberate complexity trade (one additional third-party action) for clarity: the inline-JS alternative for the Release body construction (handling the optional `additional_notes` concatenation) would be more lines and harder to review than the declarative action input.
- No orchestration tooling beyond GitHub Actions itself (no Renovate, no Turbo cache server, no remote build cache). pnpm store cache uses only `actions/setup-node@v4`'s built-in `cache: 'pnpm'` mechanism.
- Four workflow files, no shared "common" workflow, no reusable-workflow indirection. The minor duplication across `preview.yml` and `production.yml` is intentional — both files remain individually readable. `create-release.yml` is structurally distinct (no Vercel CLI) and shares only the install prefix with the deploy workflows — that small duplication is acceptable for clarity.

### Article XIII — Environment Validation

**Status**: PASS.

- Article XIII requires runtime env validation via `server/utils/env.ts`. This feature does not modify that file.
- Critically: `pnpm build` (Nuxt build) does NOT boot the runtime env validator — the validator runs at request time, not at build time. CI therefore does not need `DATABASE_URL`, `TWILIO_*`, `GOOGLE_DRIVE_*`, `WORDPRESS_*`, or `MAPBOX_*` to be present as GitHub secrets for the build step to succeed.
- The deployment workflows (`preview.yml`, `production.yml`) likewise don't inject runtime env vars — those are configured per Vercel project (Vercel Dashboard → Project → Settings → Environment Variables) and are pulled into the build via `vercel pull --environment=...`, which writes a `.vercel/.env.<env>.local` file that `vercel build` consumes. The implementer never sees the runtime env values; the human-owned Vercel dashboard is the source of truth.

### Article I — Code Organization & Reusability

**Status**: PASS.

- The three workflow files live under `.github/workflows/` (a new top-level folder distinct from `app/`, `server/`, `tests/`). They are tooling configuration, not application code, so the "feature-folder" rule does not apply.
- The harness doc (`docs/harness/ci-cd.md`) is co-located with the existing harness docs (`architecture.md`, `conventions.md`, `verification.md`, `specs.md`). This is the right folder per Article I's "cross-cutting concerns live in harness docs" implication.
- No new components, composables, or server routes are added — therefore Storybook stories and `*.spec.ts` files are not introduced by this feature (Article VII does not apply at this layer).

### Article VII — UX Consistency

**Status**: N/A.

No UI is added or modified by this feature. The CI Storybook job (US5) **runs** `pnpm storybook:build` but does not add new stories.

### Article IV — Testing

**Status**: PASS (transitively).

This feature ships no new application code, therefore no new test files. It does, however, formalize the regression detection mechanism: the CI test job's enforcement of the ≥226-test baseline (FR-003 in spec.md) is a contractual floor that future features inherit.

### Article VIII — Clean Code Discipline

**Status**: PASS.

YAML files are not bound by the 30-line function / 200-line file rules (those apply to TypeScript / Vue). Workflow files are kept readable through (a) explicit step names, (b) one logical concern per step, (c) no inline shell that exceeds ~5 lines (longer scripts would be lifted into a tracked script file).

### Articles II, III, V, XI, XII

**Status**: N/A. No TypeScript code, no Vue components, no API routes, no rendering decisions, no path-alias-affected imports, no error-handler invocations are introduced.

## Project Structure

### Documentation (this feature)

```text
specs/009-ci-cd-github-actions/
├── plan.md                # This file
├── spec.md                # Feature specification (already exists)
├── research.md            # Phase 0 output (resolved research items)
├── data-model.md          # Phase 1 output (workflow / doc shapes)
├── quickstart.md          # Phase 1 output (5-step implementer walkthrough)
├── contracts/             # Phase 1 output (workflow YAML shape contracts)
│   └── workflows.md       # Contract: required jobs, steps, outputs, secrets for each workflow
├── checklists/
│   └── requirements.md    # Spec quality checklist (already exists)
└── tasks.md               # Phase 2 output (/speckit.tasks — NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
.github/
└── workflows/
    ├── ci.yml                 # NEW — runs on pull_request to any branch (no environment)
    ├── preview.yml            # NEW — runs on push to develop (environment: dev)
    ├── create-release.yml     # NEW — workflow_dispatch only; bumps package.json, commits, tags v<X.Y.Z>, creates GitHub Release (no environment, permissions: contents: write)
    └── production.yml         # NEW — tag-triggered (on: push: tags: ['v*']); NOT push-triggered on master (environment: prd)

docs/
└── harness/
    └── ci-cd.md           # NEW — secret retrieval + GitHub Environments (dev/prd) + release ceremony howto + branch-protection recommendations + post-merge verification

.gitignore                 # MODIFIED — add `.vercel/`
package.json               # MODIFIED — insert `"version": "0.1.0"` between `"name"` and `"private"` (no other field changes)

# Files NOT modified by this feature (verified by absence in tasks.md):
# - app/**
# - server/**
# - types/**
# - tests/**
# - nuxt.config.ts
# - vitest.config.ts
# - biome.json
# - .specify/**
# - .specify/memory/constitution.md
# Note: package.json IS modified (single insertion of the `version` field). No script changes; existing scripts pnpm check / typecheck / test / build / storybook:build are sufficient.
```

**Structure Decision**: This feature is additive at the repo's tooling layer only. The new `.github/workflows/` directory is the first top-level folder this repo introduces for CI configuration — it sits outside the application's feature-folder structure (Article I scope is application code, not CI plumbing). The new harness doc joins the existing `docs/harness/` family. No application source file changes; no test file changes. This minimal surface is deliberate — it keeps the feature contained, makes review trivial, and means a regression in CI/CD plumbing cannot break application correctness.

## Complexity Tracking

No constitutional violations to justify. The Storybook CI job (US5/FR-018) was the only candidate for "complexity that needs justification" — it was kept because Article VII makes Storybook coverage non-negotiable, so a job that catches story regressions in CI is a direct enforcement mechanism for an existing principle, not new complexity.

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|--------------------------------------|
| _(none)_  | —          | —                                    |

## Phase Roadmap (for /speckit.tasks)

The implementation phases below are descriptive — the actual atomic, dependency-ordered task list is produced by `/speckit.tasks`. The phases are intentionally small because the feature surface is small.

| Phase | Scope | User Story |
|-------|-------|------------|
| Phase 1 — Setup | Insert `"version": "0.1.0"` into `package.json`; create `.github/workflows/` directory; add `.vercel/` entry to `.gitignore` | — (groundwork) |
| Phase 2 — CI workflow | Implement `ci.yml` with lint / typecheck / test / build steps, pnpm cache, concurrency | US1 |
| Phase 3 — Preview workflow | Implement `preview.yml` with Vercel CLI sequence + GitHub Deployments surfacing + `environment: dev` | US2 |
| Phase 4 — Release workflow | Implement `create-release.yml` with the three `workflow_dispatch` inputs, branch guard, quality gate, `npm version` bump, commit-and-tag, GitHub Release via `softprops/action-gh-release@v2` | US3 (release half) |
| Phase 5 — Production workflow | Implement `production.yml` triggered on `push: tags: ['v*']`, environment `prd`, Vercel CLI `--prod` sequence | US3 (deploy half) |
| Phase 6 — Harness doc | Write `docs/harness/ci-cd.md` with secret-retrieval steps + GitHub Environments setup (`dev`/`prd`) + release-ceremony howto + branch-protection recommendation + post-merge verification | US4 |
| Phase 7 — Storybook job | Add `storybook-build` parallel job to `ci.yml` | US5 |
| Phase 8 — Polish & verify | `actionlint` (or equivalent) on the four workflow files; rerun `./init.sh` and confirm exit 0; cross-reference Articles VI + IX in the doc | — (closeout) |

Phase 1, 2, 6, 7 are independently testable (per spec.md's user-story independence rule). Phases 3 and 4 are independent of each other (different files). Phase 5 depends on Phase 4 only in the sense that the chosen Vercel CLI major in Phase 3 must be re-used byte-for-byte in Phase 5. The exact atomic, dependency-ordered task list is produced by `/speckit.tasks`.

## Out of Scope (intentional)

The following are explicitly NOT delivered by this feature, even though they are tangentially related:

- Native Vercel↔GitHub integration (the central constraint the feature exists to avoid).
- Branch-protection rule configuration in GitHub repo settings (documented as a recommendation in `docs/harness/ci-cd.md`; the action itself requires a repo administrator and is performed outside this codebase — see FR-015).
- DB migration runners (Drizzle migrations run elsewhere; not part of CI/CD here).
- CDN cache-invalidation hooks.
- Matrix testing across multiple Node versions (CI pins exactly one — Node 20 — to match the Vercel runtime).
- macOS or Windows runners (no platform-specific code paths exist).
- End-to-end live runner validation (deferred to the human's post-merge verification per FR-020).
- Reusable workflow extraction or composite actions (KISS — three flat files is simpler than two flat files plus one reusable workflow).

## Phase 0 — Research

See `research.md` for the resolved investigation items. All decisions are pre-committed; no items remain open.

**Picks finalized in research.md**:

- Version-bump strategy: `npm version <patch|minor|major> --no-git-tag-version` (Node-bundled; verified against a throwaway worktree that it does NOT modify `pnpm-lock.yaml`). Hand-rolled sed/jq rejected — too many edge cases (version-line whitespace, trailing comma, presence of pre-release suffix).
- GitHub Release creation tool: `softprops/action-gh-release@v2` (pinned to major `v2`). Chosen over inline `actions/github-script@v7` because the optional-append logic for `additional_notes` is more readable as a declarative `body:` input with a small bash pre-step that constructs the string, and the action has a stable, long-supported public interface for this exact use case.
- GitHub Environments naming: `dev` and `prd` (matches the human's repo convention). Required-reviewers protection on `prd` available but not enabled by this feature.

## Phase 1 — Design Artifacts

See `data-model.md` for the structural shape of each workflow file and the harness doc's section breakdown.
See `contracts/workflows.md` for the workflow-level contract (required jobs, steps, outputs, secrets) that the implementer must satisfy.
See `quickstart.md` for the 5-step implementer walkthrough.

## Post-Design Re-check

After Phase 1 artifacts were drafted, the Constitution Check was re-evaluated:

- Article VI: still PASS — the contracts reaffirm secret-only references; `data-model.md` lists no plaintext credential surface. The new `contents: write` permission on `create-release.yml` is documented and minimal. Per-environment secret scoping (`dev`/`prd`) strengthens the security posture by preventing accidental cross-environment exposure.
- Article IX: still PASS — the contracts document the four MVP jobs plus the parallel Storybook job, mirroring `./init.sh`. The release workflow re-runs the same quality gate as a pre-condition, reinforcing the article.
- Article X: still PASS — the contracts ban third-party deployment actions and custom JavaScript actions; `actions/github-script@v7` inline JS is permitted only for the Vercel preview-URL Deployments surfacing, and `softprops/action-gh-release@v2` is permitted only for GitHub Release creation in the release workflow. The two-workflow split for release-vs-deploy is the simpler model, not a more complex one.
- Article XIII: still PASS — research item R2 + the Constitution Check above confirm `pnpm build` is build-time-only and does not require runtime env vars in CI.

No new complexity introduced by the design phase.
