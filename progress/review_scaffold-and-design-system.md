# Review: scaffold-and-design-system

**Feature**: 007 — Scaffold & Design System (Mercado Pop)
**Branch**: `feat/007-scaffold-and-design-system`
**Status:** APPROVED

## Verifications

- **Acceptance criteria ↔ surrogate coverage** (Storybook + grep gates, per Article IV exception):
  - SC-002 / FR-701 / FR-702: 10 components + 10 co-located `.stories.ts` + 1 `Tokens.stories.ts` present in `app/components/ui/`.
  - SC-004 / FR-201: 7 canonical routeRules verified in `nuxt.config.ts`.
  - SC-005 / FR-301 / FR-302: tokens dual-surface confirmed (`tokens.css` ↔ `tailwind.config.ts`); `Tokens.stories.ts` is the smoke story.
  - SC-006 / FR-303: single `--accent: var(--blue)` declaration (T106 grep returns 1 match in `tokens.css:43`).
  - SC-009 / FR-201: `pnpm build` exits 0 with ISR/SSR markers.
  - SC-010 / FR-413: `grep -rn "drizzle-orm|@neondatabase/serverless" app/` → 0 matches.
  - SC-011 / FR-411 / Article VIII: every UI file < 200 lines (largest is `Tokens.stories.ts` at 109; `default.vue` at 19).
  - SC-013 / FR-307: tokens-only color contract verified (T108a/b → 0 matches; T108c → 0 matches against new files).
- **Phase -1 gates**: 46/46 marked `[x]` in `plan.md`.
- **Tasks**: 46/47 marked `[x]`; T012 stays `[REMOVED]` per spec — the original composable was eliminated when reduced-motion handling moved to a CSS media query inside `Marquee.vue`.
- **`[NEEDS CLARIFICATION]`**: 0 occurrences in spec/plan/tasks.
- **`./init.sh`**: exit 0 (Biome ✓ • vue-tsc ✓ • Vitest 32 files / 188 tests ✓).
- **Sensitive data scan**: 0 hits across diff (`api_key`, `secret`, `token`, `password`, `bearer`, `private_key`, `AKIA`, Twilio SID, postgres URLs, PEM blocks). `git ls-files` shows no tracked `.env*` files. `.npmrc` contents are a single `registry=https://registry.npmjs.org/` line — no auth tokens, no AWS CodeArtifact creds.
- **CHECKPOINTS C1–C7**: all OK.
- **Design token enforcement (4 sub-checks)**:
  1. Default-palette utility leak (T108a) → 0 matches.
  2. Arbitrary-value Tailwind utilities (T108b) → 0 matches.
  3. Inline hex outside `tokens.css` (T108c) → 0 matches in NEW files (`app/components/ui/`, `app/layouts/`). 21 matches in legacy `app/components/staff/*` and `app/pages/staff/*` shipped by feature 006 — see ruling below.
  4. Dual-surface mirror (`tokens.css` ↔ `tailwind.config.ts`) verified — every CSS custom property has its Tailwind theme counterpart and vice versa.
- **Copy rules**: 0 "buffet" matches, 0 "comida japonesa" matches; `brand.tagline` = "Estilo americano-japonés"; `brand.ayceBadge` = "All You Can Eat".

## Ruling on T108c legacy violations

**Interpretation (c) — APPROVE feature 007 + track legacy cleanup separately.** The token-enforcement contract (FR-307 / SC-013) was specified IN this feature and did not exist when feature 006 was implemented. The implementer correctly refused to modify out-of-scope code per the hard rule "DO NOT touch features other than the one assigned". T108c returns 0 matches against the in-scope new files. The 21 pre-existing hex literals in `app/components/staff/*.vue` and `app/pages/staff/*.vue` are real tech debt against the now-binding rule, but it would be unsafe and out-of-process to fix them inside this feature without a fresh spec/plan/tasks cycle.

## Implementer deviations — disposition

1. **`@vitejs/plugin-vue@^6.0.7` pinned (5th library)** — **ACCEPTED**. Verified the implementer's peer-dep claim: `node_modules/@storybook/vue3-vite@10.4.1/package.json` shows `dependencies: ['@storybook/builder-vite', '@storybook/vue3', 'magic-string', 'typescript', 'vue-component-meta', 'vue-docgen-api']` and `peerDependencies: ['storybook', 'vite']` — no `@vitejs/plugin-vue`. Without an explicit pin, `pnpm storybook:build` cannot compile Vue SFCs. The plugin is the official Vue team SFC plugin; clears Article X's 100-LOC threshold trivially (SFC compilation is not feasible to hand-roll).
2. **`.npmrc` workstation workaround** — **ACCEPTED**. Contains a single safe line `registry=https://registry.npmjs.org/`. No tokens, no `_auth`, no `authToken`. Pins the project to the public npm registry; behaves identically in CI (no behavior change). Not a sensitive-data leak.
3. **`@/utils` alias repointed to `app/utils/`** — **ACCEPTED**. The root `utils/` only held `.gitkeep`. The spec mandates `app/utils/cx.ts` (FR-801 + plan.md file tree) AND the constitution mandates the `@/utils` alias (Article XI). Repointing was the only consistent resolution. `pnpm typecheck` confirms no broken imports.
4. **Extra Tailwind tokens (`borderWidth.pop`, `borderWidth.pop-sm`, `ringWidth.pop`, `fontSize.micro`)** — **ACCEPTED**. They are themselves named tokens with deterministic values (`3px`, `2.5px`, `9px`) backing the Mercado Pop 3px/2.5px border discipline described in `docs/business/overview.md` §3. Without them, the components would have needed `border-[3px]` arbitrary values that trip T108b. They extend the data-model.md §1 surface but do not violate the "tokens only" rule — they ARE tokens.

## Notes (non-blocking)

- `storybook-static/` is a build artifact left in the working tree (untracked, not committed). Consider adding it to `.gitignore` as a follow-up.
- `i18n.config.ts` lives at `i18n/i18n.config.ts` while `nuxt.config.ts` references `./i18n.config.ts`. This works because `@nuxtjs/i18n` v10 resolves the path relative to its module root — `pnpm build` confirms.
- `T027` throw-away demo page was never created (Storybook served the same validation purpose); `T113` deletion is therefore a no-op. The implementer documented this.

## Follow-ups for the human / leader

- **Create a tech-debt entry** for cleaning up the 21 legacy hex literals in `app/components/staff/*` and `app/pages/staff/*` to bring feature 006 into compliance with FR-307 / SC-013. Suggested as a small dedicated cleanup feature OR rolled into the feature 008 (`frontend-test-setup`) scope since it already touches the staff components.
- **Optional**: add `storybook-static/` to `.gitignore` (one-line cleanup, leader can do this directly).

## Delta re-review — 2026-06-17 token-format migration

**Status:** APPROVED

### Per-check results

1. **`tokens.css` RGB channels** — PASS. All 11 color vars on `:root` are space-separated channels with no `rgb()`/`#`/commas. Conversions verified exact: `--orange: 255 107 43` (`#FF6B2B`), `--blue: 46 124 246` (`#2E7CF6`), `--ink: 26 18 9` (`#1A1209`), and the rest of the palette (bg/bg2/panel/soft/pink/yellow/green/line) match their commented hex values byte-for-byte.

2. **Shadow rules wrap `--ink`** — PASS. `tokens.css:40-41` declare `--shadow: 6px 6px 0 rgb(var(--ink))` and `--shadow-sm: 4px 4px 0 rgb(var(--ink))`. No bare `var(--ink)` in shadow values.

3. **`tailwind.config.ts` `<alpha-value>` form** — PASS. Every one of the 11 color entries (bg, bg2, panel, ink, soft, orange, blue, pink, yellow, green, line, accent) is `rgb(var(--<token>) / <alpha-value>)`. `transparent` and `currentColor` correctly preserved as the only non-token entries. No `var(--token)` bare, no `rgb(var(--token))` without placeholder.

4. **`base.css` colors wrapped** — PASS. `background: rgb(var(--bg))` and `color: rgb(var(--ink))` on lines 15-16; non-color `font-family: var(--body)` (17) and `max-width: var(--maxw)` (23) correctly stay bare.

5. **Scoped CSS in components/layouts** — PASS. `grep -rEn 'var\(--(bg|bg2|panel|ink|soft|orange|blue|pink|yellow|green|line|accent)\b' app/components/ui/ app/layouts/ | grep -v 'rgb('` returns zero matches. Implementer's claim about `Marquee.vue` only using a non-color custom prop holds.

6. **`Tokens.stories.ts` parity story** — PASS. The raw-CSS side now uses `background: 'rgb(var(--bg))'`, `color: 'rgb(var(--ink))'`, `borderColor: 'rgb(var(--ink))'`, and the accent demo block uses `background: 'rgb(var(--accent))'`. Non-color `boxShadow: 'var(--shadow)'` and `borderRadius: 'var(--r)'` correctly stay bare. Both surfaces resolve identically.

7. **Opacity modifier compile test** — PASS. `pnpm dlx tailwindcss` is unavailable in the v4 npm registry default, so the test was run programmatically via Tailwind's PostCSS plugin (`tw(cfg)` + `postcss` v8.5.15 from `node_modules/.pnpm`) against the project's `tailwind.config.ts` with inline content `<div class='bg-orange/50 bg-ink/40 hover:bg-accent/90'></div>`. Result:
   - `rgb(var(--ink) / 0.4)`
   - `rgb(var(--orange) / 0.5)`
   - `rgb(var(--accent) / 0.9)`
   All three compile exactly as expected — the migration is structurally correct end-to-end.

8. **Regressions** — PASS. `./init.sh` exits 0. Biome ✓ • vue-tsc ✓ • Vitest **32 files / 188 tests** ✓ (matches the pre-migration baseline from the initial review, line 21).

9. **Spec updates** — PASS. `tasks.md` T004 (lines 48-80) prescribes the `rgb(var(--token) / <alpha-value>)` form with explicit rationale link to the Tailwind v3 docs; T005 (lines 81-113) prescribes RGB channels with hex-comment shape and the `rgb()`-wrap requirement on shadows + raw-CSS consumers. `research.md` §15 (lines 297-316) documents the migration as a Decision/Rationale/Trade-off/Alternatives/Status block.

### `feature_list.json` status

Confirmed: id=7 (`scaffold-and-design-system`) `status: "in_progress"`. NOT marked `done` — that remains the human approval step.
