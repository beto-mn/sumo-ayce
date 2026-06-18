# Code conventions

> **Stub.** The project's conventions live in
> `.specify/memory/constitution.md` (linting, formatting, imports,
> folder structure, naming, etc.).
>
> Don't edit this file to add rules — modify the constitution via
> `/speckit.constitution`.

## Tooling that enforces conventions

- **Biome** — lint + format (`pnpm check`, `pnpm check:fix`). Config in `biome.json`.
- **TypeScript strict** — `pnpm typecheck` (delegates to `nuxt typecheck`).
- **Vitest** — tests (`pnpm test`).
- **Husky + pre-commit hooks** — already configured in `package.json`.

## Quick commands

```bash
pnpm check        # lint + format in read-only mode (error-on-warnings)
pnpm check:fix    # apply safe fixes
pnpm typecheck    # Nuxt project typecheck
pnpm test         # Vitest tests
```

## Testing

- Unit tests are **co-located** with their source: `<Name>.vue` and
  `<Name>.spec.ts` live in the same directory and share the same base name.
- New tests MUST use the `.spec.ts` suffix. The legacy `.test.ts` suffix is
  still matched by the Vitest glob so pre-existing files (notably the two
  `app/composables/useStaff*.test.ts`) keep working; renames are out of scope.
- Files under `app/` run under `happy-dom`; files under `tests/` and
  `server/` run under `node`. For the runtime details (environment,
  runner commands, `mount()` pattern), see
  [`verification.md`](./verification.md#frontend-tests).
