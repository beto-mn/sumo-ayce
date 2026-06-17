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
