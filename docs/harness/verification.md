# Verification

> How to confirm your work works before declaring a task `done`.

## Quick verification (during the session)

```bash
pnpm test          # Vitest tests
pnpm check         # biome lint + format
pnpm typecheck     # nuxt typecheck
```

All three must exit with code 0 before marking a task as `[x]`.

### Frontend tests

`pnpm test` runs two Vitest projects:

- `app` — globs `app/**/*.spec.ts` and `app/**/*.test.ts`, executes under
  `happy-dom` for component and composable assertions.
- `server` — globs `tests/**/*.test.ts` and `server/**/*.test.ts`, executes
  under `node` for server-route and integration tests.

The convention is `Component.vue ↔ Component.spec.ts` co-located in the
same directory with the same base name. New tests MUST use the `.spec.ts`
suffix; the legacy `.test.ts` suffix is still matched so the two
`app/composables/useStaff*.test.ts` files keep running unchanged.

The canonical pattern uses `mount()` from `@vue/test-utils`. Reference example:
`app/components/ui/Button.spec.ts`. Full how-to in
`specs/008-frontend-test-setup/quickstart.md`.

## Full verification (session close and before `done`)

```bash
./init.sh
```

`init.sh` runs:
1. Verify environment (Node 22+, pnpm 10+)
2. Verify harness base files exist
3. Validate `feature_list.json` (valid JSON, ≤1 in_progress, complete specs)
4. `pnpm check`
5. `pnpm typecheck`
6. `pnpm test`

**If `./init.sh` does not exit with code 0, DO NOT declare done.**

## "Feature done" criteria

A feature is only marked `done` when:

- [ ] All tasks in `tasks.md` are `[x]`
- [ ] All Phase -1 gates in `plan.md` are `[x]`
- [ ] Each acceptance criterion in `spec.md` has at least one test covering it
- [ ] `spec.md` has no unresolved `[NEEDS CLARIFICATION]`
- [ ] `./init.sh` exits with code 0
- [ ] The `reviewer` approved (file `progress/review_<feature>.md` with `APPROVED`)
- [ ] The `progress/current.md` summary was moved to `progress/history.md`

## Manual UI verification (frontend)

For features with UI changes:

```bash
pnpm dev           # starts Nuxt on localhost
pnpm storybook     # starts Storybook for isolated components
```

The constitution (Article VII) requires stories for every new UI component
with default + significant variants + mobile/desktop breakpoints.

## Database verification

```bash
pnpm db:up         # docker compose up -d (local postgres)
pnpm db:generate   # drizzle-kit generate (after changing schema.ts)
pnpm db:migrate    # apply migrations
pnpm db:studio     # Drizzle Studio UI
```

## Verification anti-patterns

- ❌ Tests with filesystem or DB mocks → use real resources.
- ❌ "Works on my machine" without `./init.sh` green.
- ❌ Skipping `pnpm check` because "I only changed a comment".
- ❌ Marking done with unresolved `[NEEDS CLARIFICATION]`.
