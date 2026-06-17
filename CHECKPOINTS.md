# CHECKPOINTS — Final state evaluation

> In multi-agent systems we don't evaluate the path, we evaluate the destination.
> Walk through these checkpoints before declaring a feature `done`.

## C1 — The harness is complete

- [ ] Base files exist: `AGENTS.md`, `init.sh`, `feature_list.json`, `progress/current.md`, `progress/history.md`
- [ ] The 4 harness docs exist: `docs/harness/architecture.md`, `docs/harness/conventions.md`, `docs/harness/verification.md`, `docs/harness/specs.md`
- [ ] `docs/business/` exists with at least one business context file
- [ ] `.specify/memory/constitution.md` exists with real principles (not an empty template)
- [ ] The 4 agents in `.claude/agents/` exist: `leader.md`, `spec_author.md`, `implementer.md`, `reviewer.md`
- [ ] `./init.sh` ends with exit code 0

## C2 — State is coherent

- [ ] At most 1 feature in `in_progress` in `feature_list.json`
- [ ] Every `done` feature has associated tests that pass
- [ ] `progress/current.md` is empty (session closed) or describes the active session

## C3 — Code respects the architecture

- [ ] `app/`, `server/`, `types/` only contain modules described in the constitution
- [ ] No stray debug prints nor `TODO` without context in production code
- [ ] Import conventions and barrel exports defined in the constitution are honored

## C4 — Verification is real

- [ ] There is at least one test per acceptance criterion of the feature
- [ ] Tests use real resources or consistent fixtures (no filesystem mocks)
- [ ] `pnpm test` shows > 0 tests and all green
- [ ] `pnpm check` (biome) passes with `--error-on-warnings`
- [ ] `pnpm typecheck` passes without errors

## C5 — The session was closed properly

- [ ] `progress/history.md` has an entry for the last closed session
- [ ] The last worked feature is in its correct state in `feature_list.json`
- [ ] No leftover temp files (`*.log`, `*.tmp`) uncommitted

## C6 — Spec Driven Development (spec-kit)

- [ ] Every feature with `sdd: true` in state `spec_ready`, `in_progress` or `done`
      has its `specs/<num>-<name>/` folder with at least `spec.md`, `plan.md` and `tasks.md`
- [ ] `plan.md` has all Phase -1 Gates marked `[x]` for `done` features
- [ ] `spec.md` has no unresolved `[NEEDS CLARIFICATION]` markers
- [ ] Every `done` feature with `sdd: true` has all its tasks marked `[x]` in `tasks.md`
- [ ] Each acceptance criterion in `spec.md` is covered by at least one concrete test
