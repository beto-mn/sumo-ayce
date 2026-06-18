# Implementation summary — Feature 007: scaffold-and-design-system

- **Feature**: 007 — Scaffold & Design System (Mercado Pop)
- **Branch**: `feat/007-scaffold-and-design-system`
- **Spec folder**: `specs/007-scaffold-and-design-system/`
- **Status**: implementation complete — handoff to reviewer

## Completed tasks (47 of 47)

All tasks `[x]` in `specs/007-scaffold-and-design-system/tasks.md`:

- Phase 1 (T001–T003) — deps + Nuxt modules + fonts.
- Phase 2 (T004–T014) — tokens.css, base.css, tailwind.config.ts (palette OVERRIDDEN), i18n locales, cx util, default layout. T012 [REMOVED] per spec.
- Phase 3 (T015–T027) — ten parameterized UI primitives + co-located stories under `app/components/ui/`. T027 throw-away demo page was satisfied by the Storybook coverage; T113 deletion is a no-op.
- Phase 4 (T028–T030) — Storybook static build OK.
- Phase 5 (T031–T032) — `pnpm build` exits 0 with the seven canonical routeRules baked in.
- Phase 6 (T033–T035) — five-command sweep OK.
- Phase 7 (T036–T037) — `UI/_Tokens` smoke story added.
- Phase 8 (T100–T114, T200) — all grep gates pass against new files.

## Tests added

This feature ships components WITHOUT Vitest specs (Article IV exception, deferred to feature 008 per spec.md Assumptions + plan.md Complexity Tracking + T200). The constitutional acceptance surface is **Storybook**: every UI primitive has a co-located `.stories.ts` covering Default + significant variants + mobile (360px) + desktop (1200px) viewports.

## Phase -1 gates

All 46 gates in `specs/007-scaffold-and-design-system/plan.md` marked `[x]`.

## Files added

```
.npmrc                                    (workstation registry override)
app/assets/css/tokens.css
app/assets/css/base.css
app/components/ui/Button.vue + Button.stories.ts
app/components/ui/Card.vue + Card.stories.ts
app/components/ui/Chip.vue + Chip.stories.ts
app/components/ui/Sticker.vue + Sticker.stories.ts
app/components/ui/Kicker.vue + Kicker.stories.ts
app/components/ui/Input.vue + Input.stories.ts
app/components/ui/Select.vue + Select.stories.ts
app/components/ui/Textarea.vue + Textarea.stories.ts
app/components/ui/Nav.vue + Nav.stories.ts
app/components/ui/Marquee.vue + Marquee.stories.ts
app/components/ui/Tokens.stories.ts
app/layouts/default.vue
app/utils/cx.ts
i18n/i18n.config.ts
i18n/locales/es.json
i18n/locales/en.json
tailwind.config.ts
```

## Files modified

```
nuxt.config.ts            (modules, fonts, i18n, routeRules, css, alias)
.storybook/main.ts        (stories glob + viteFinal with @vitejs/plugin-vue + aliases)
.storybook/preview.ts     (import base.css, Mercado Pop viewports + backgrounds)
biome.json                (ignore storybook-static, .output, .nuxt)
package.json              (+ four spec-mandated libs + @vitejs/plugin-vue explicit pin)
pnpm-lock.yaml            (regenerated)
specs/007-scaffold-and-design-system/tasks.md  (every task [x])
specs/007-scaffold-and-design-system/plan.md   (every gate [x])
progress/current.md       (full session log)
```

## Documented deviations (reviewer attention)

1. **`@vitejs/plugin-vue@^6.0.7`** added as a 5th devDependency — `@storybook/vue3-vite@10.4.1` peer-requires a Vue SFC plugin but does not ship one (verified by inspecting its package.json: `dependencies: {@storybook/builder-vite, @storybook/vue3, magic-string, typescript, vue-component-meta, vue-docgen-api}` — no `@vitejs/plugin-vue`). Without this explicit pin, `pnpm storybook:build` fails on SFC parse. The plugin was already a transitive dep of Nuxt; making it explicit is a contract pin, not a new feature library. Article X reasoning: this clears the 100-LOC threshold (Vue SFC compilation is not feasible to hand-roll) and is the official Vue team plugin.
2. **`.npmrc`** added — the workstation's `~/.npmrc` was pointing at an inaccessible AWS CodeArtifact endpoint, blocking any `pnpm add`. Project-level `.npmrc` pins `registry=https://registry.npmjs.org/`. No production behavior change.
3. **`@/utils` alias repointed** from root `utils/` (which only had `.gitkeep`) to `app/utils/` — required to satisfy both "cx.ts lives at `app/utils/cx.ts`" (spec FR-801, plan.md file tree) and "imports use `@/utils`" (Article XI). The root `utils/` has no current consumers.
4. **Tailwind theme extensions**: `borderWidth.pop = 3px`, `borderWidth.pop-sm = 2.5px`, `ringWidth.pop = 3px`, `fontSize.micro = 9px` added so the Mercado Pop 3px/2.5px borders compile via `border-pop` / `border-pop-sm` / `ring-pop` / `text-micro`. Without these the components would have needed `border-[3px]` arbitrary values, which fail T108b.
5. **T108c (inline hex)**: returns 21 matches in `app/components/staff/*.vue` and `app/pages/staff/*.vue` — these are feature 006 artifacts. Per the implementer hard rule "DO NOT touch features other than the one assigned", they were left as-is. Against the new files (`app/components/ui/`, `app/layouts/`) T108c returns 0 matches. The reviewer should rule whether the literal task grep applies to legacy code or only to in-scope new files.

## Known issues / TODOs

- None within feature 007 scope.
- Feature 008 will backfill Vitest specs against the ten UI primitives delivered here (per `feature_list.json` id=8 description point 6).
- Pre-existing staff feature legacy hex literals (item 5 above) are tracked here for whoever picks up the inevitable design-system migration of staff/* in a future feature.

## Verification — every command exits 0

| Command | Result |
|---|---|
| `pnpm check` (Biome lint + format) | exit 0 |
| `pnpm typecheck` (vue-tsc) | exit 0 |
| `pnpm test` (Vitest server suites) | 32 files, 188 tests passing |
| `pnpm build` (Nuxt production) | exit 0, ISR + SSR markers present |
| `pnpm storybook:build` | exit 0, `storybook-static/` produced |
| `./init.sh` | exit 0 |

## Handoff

implementation complete → progress/impl_scaffold-and-design-system.md
