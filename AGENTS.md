# AGENTS.md — Navigation map for AI agents

> This file is the entry point for any agent working in this repository.
> Read only what you need when you need it.

## 1. Before you start (mandatory)

1. Run `./init.sh` and verify it finishes without errors.
2. Read `progress/current.md` to understand the state of the last session.
3. Read `feature_list.json`.
4. Read `docs/harness/specs.md` before touching any spec or feature with `sdd: true`.
5. Read **all files** in `docs/business/` before drafting a spec or making architectural decisions.

## 2. Repository map

| File / folder                    | What it contains                                                            | When to read it          |
|----------------------------------|-----------------------------------------------------------------------------|--------------------------|
| `feature_list.json`              | List of features with their status                                          | Always, on start         |
| `progress/current.md`            | Current session state                                                       | Always, on start         |
| `progress/history.md`            | Log of previous sessions                                                    | If you need context      |
| `specs/<num>-<name>/`            | spec.md + plan.md + tasks.md + data-model.md + research.md + contracts/     | Before implementing      |
| `.specify/memory/constitution.md`| Architectural principles (source of truth)                                  | Before drafting a spec   |
| `.specify/feature.json`          | Currently active feature in spec-kit                                        | At session start         |
| `docs/business/`                 | Business context: domain, stack, features, branding                         | Before drafting spec or architectural decisions — read ALL files |
| `docs/harness/architecture.md`   | Stub that delegates to `.specify/memory/constitution.md`                    | —                        |
| `docs/harness/conventions.md`    | Stub that delegates to `.specify/memory/constitution.md`                    | —                        |
| `docs/harness/verification.md`   | How to verify your work (init.sh, commands, criteria)                       | Before declaring done    |
| `docs/harness/specs.md`          | SDD process with spec-kit: skills `/speckit.*`, files per spec, Phase -1    | Before drafting a spec   |
| `CHECKPOINTS.md`                 | Objective criteria for "correct final state" (C1-C6)                        | For self-evaluation      |
| `.claude/agents/`                | Subagent definitions: leader, spec_author, implementer, reviewer            | If you orchestrate work  |
| `.claude/skills/speckit-*`       | Installed spec-kit skills (specify, plan, tasks, clarify, analyze, etc.)    | When invoking `/speckit.*` |
| `.specify/extensions.yml`        | spec-kit hooks before/after each phase                                      | If you modify the SDD flow |

## 3. Hard rules (non-negotiable)

- **One feature at a time.** Do not mix changes from multiple features.
- **Do not declare `done` without green tests.** Run `./init.sh` first.
- **Do not skip the spec phase.** Any feature with `"sdd": true` goes through
  `spec_author` and gets human approval before any code is touched.
- **Do not skip `/speckit.clarify`** if `spec.md` contains `[NEEDS CLARIFICATION]` markers.
- **Document in `progress/current.md`** while you work, not at the end.
- **If you don't know something, search in `docs/`, `.specify/memory/` or
  `specs/<num>-<name>/`** before inventing.

## 4. SDD flow with spec-kit

```
pending → [spec_author wrapping speckit.*] → spec_ready → ⏸ HUMAN → in_progress → [implementer → reviewer] → done
```

1. The `leader` detects the first `pending` feature with `"sdd": true`.
2. The `leader` launches `spec_author`, which:
   a. Reads `.specify/memory/constitution.md` (principles)
   b. Reads ALL files in `docs/business/` (business context)
   c. Reads the feature section in `feature_list.json`
   d. Reads previous relevant specs if the feature touches existing modules
   e. Invokes `/speckit.specify` → if `[NEEDS CLARIFICATION]` exists → `/speckit.clarify`
   f. Invokes `/speckit.plan` (generates Phase -1 gates from the constitution)
   g. Invokes `/speckit.tasks` (atomic tasks with `[P]` parallelizable markers)
   h. Changes status to `spec_ready` in `feature_list.json`
   i. Returns reference to the `leader`
3. **Pause.** The human reads `specs/<num>-<name>/` in full and approves (or requests changes).
4. Once approved, the `leader` changes the status to `in_progress` and launches `implementer`.
5. The `implementer` runs `tasks.md` task by task, marking them `[x]`. Writes tests for each acceptance criterion.
6. The `reviewer` verifies acceptance ↔ test traceability, Phase -1 gates `[x]`, all tasks `[x]`, walks through `CHECKPOINTS.md` and runs `./init.sh`.
7. If approved, the `reviewer` marks `done` and the `leader` moves the summary to `progress/history.md`.

## 5. Session close

1. Run `./init.sh` — everything green.
2. If the task is finished: mark `status: "done"` in `feature_list.json`.
3. Move the `progress/current.md` summary to the end of `progress/history.md`.
4. Clear `progress/current.md` leaving only the template.
5. Don't leave temporary files or debug prints.
