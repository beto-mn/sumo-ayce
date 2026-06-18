# Implementation Plan: Scaffold & Design System (Mercado Pop)

**Branch**: `feat/007-scaffold-and-design-system` | **Date**: 2026-06-17 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/007-scaffold-and-design-system/spec.md`

## Summary

Establish the shared frontend chassis the rest of the SUMO AYCE redesign depends on. Concretely:

1. Install four new libraries (`@nuxtjs/tailwindcss`, `@nuxtjs/i18n`, `mapbox-gl`, `@nuxt/fonts`) and wire them into `nuxt.config.ts`.
2. Configure the canonical `routeRules` block from `docs/business/rendering-strategy.md` §2.
3. Materialize the Mercado Pop design tokens from `docs/business/overview.md` §2 in two places that resolve to the same values: CSS custom properties (`app/assets/css/tokens.css`) and a Tailwind theme extension (`tailwind.config.ts`).
4. Ship ten parameterized base UI components under `app/components/ui/` (Button, Card, Chip, Sticker, Kicker, Input, Select, Textarea, Nav, Marquee), each with a co-located Storybook story covering Default + significant variants + mobile/desktop viewports.
5. Provide a default layout (`app/layouts/default.vue`) composed of Nav + slot + footer.
6. Set up bilingual ES/EN i18n with ES default at `/` and EN at `/en/...` (strategy `prefix_except_default`).
7. Skip Vitest specs for `app/**` — feature 008 owns the frontend test setup and will backfill specs against the components delivered here.

Technical approach is the simplest path that satisfies the constitution: lean on first-party Nuxt modules (Tailwind, i18n, fonts) wherever they save more than 100 LOC of hand-rolled wiring (Article X), keep all token values readable from BOTH a Tailwind theme and CSS variables so accent-scope swaps work via a single `.scope-express` class (Article VII), and produce zero server-side code so Article V's "backend never static" hard constraint remains intact.

## Technical Context

**Language/Version**: TypeScript 5.x (strict mode), Node.js 20 (Vercel runtime).
**Primary Dependencies (new — pinned versions verified 2026-06-17, see [research-versions.md](./research-versions.md) and research.md §14)**: `@nuxtjs/tailwindcss ^6.14.0` (Tailwind v3 LTS via the Nuxt module — see research.md §1) + `tailwindcss ^3.4.19` (pinned explicitly so we don't drift onto v4), `@nuxtjs/i18n ^10.4.0` (v10 is the Nuxt 4 line; v9 targeted Nuxt 3), `mapbox-gl ^3.25.0` (install-only; consumed by feature 012; Mapbox proprietary TOS accepted by the human), `@nuxt/fonts ^0.14.0` (self-hosted Bricolage Grotesque 800 + Hanken Grotesk 400/600/700 via the `'google'` provider).
**Primary Dependencies (existing, untouched by this feature)**: Nuxt 4.4.x, Vue 3.5, Drizzle ORM, `@neondatabase/serverless`, Twilio, Storybook 10.4 (`@storybook/vue3-vite` + `@storybook/addon-docs`), Vitest 4.1, Biome 2.4, Husky 9, commitlint, vue-tsc 3.3.
**Storage**: N/A — this feature is frontend-only. Neon and any backend store are untouched.
**Testing**: Storybook 10 (visual / interactive sweep of every base component). Vitest specs for `app/**` are explicitly deferred to feature 008. Existing server-side tests (Vitest under `tests/**` and `server/**`) remain green.
**Target Platform**: Web — public pages on Vercel (mobile-first, 360px–1200px range), with breakpoints at 520px and 880px per `docs/business/overview.md` §9.
**Project Type**: Frontend chassis layer of the Nuxt 4 monorepo.
**Performance Goals**: Foundation supports Lighthouse 90+ on the future public pages (Article V). Direct in-feature budget: every base component renders in <16ms on mobile (60fps). No runtime JS larger than what Tailwind, i18n, and fonts already require.
**Constraints**: Mobile-first, hit targets ≥44px, respects `prefers-reduced-motion: reduce` for Marquee (CSS media query); micro-hover transitions out of scope of the gate. No DB import under `app/`, no library beyond the four new ones, no server-side code added.
**Scale/Scope**: Ten base UI primitives, one default layout, one global stylesheet, one Tailwind config, one i18n config, two seed locale files. No persistent entity. Approximate LOC budget: ≤ 2,000 LOC frontend + config.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

This section is Phase -1 of the plan and is NON-NEGOTIABLE. Each box is verified by the reviewer before any task is closed.

### Phase -1: Pre-Implementation Gates (derived from constitution v3.1.0)

#### Article I — Code Organization & Reusability (NON-NEGOTIABLE)

- [x] All ten base components live under `app/components/ui/`. No component shipped in a feature folder.
- [x] Every component declares props via `defineProps<>()` with TypeScript types — no `any`.
- [x] No per-variant duplicate component file exists (e.g., no `PrimaryButton.vue` AND `InkButton.vue`; variants live as props on `Button.vue`).
- [x] No cross-feature import (no file under `app/components/ui/` imports from `app/components/staff/`, `app/features/*/`, or any other feature folder).
- [x] Every UI component file is < 200 lines.
- [x] Every function inside a UI component is < 30 lines.
- [x] Inline `v-if/v-else-if` chains never exceed 3 branches (lifted into a sub-component or composable when they do).

#### Article II — TypeScript & Framework Standards

- [x] TypeScript strict mode remains enabled in `tsconfig.json`.
- [x] No `any` and no unsafe casts anywhere in the new code.
- [x] Every Vue file uses `<script setup lang="ts">` — Composition API only, no Options API.
- [x] Shared types live in `/types/` only when they cross the frontend/backend boundary; this feature introduces NONE because it is frontend-only and component prop types live next to their components.

#### Article III — Architecture

- [x] Project remains a single Nuxt 4 repository — no new package, no monorepo split.
- [x] No DB import (`drizzle-orm`, `@neondatabase/serverless`) appears anywhere under `app/` (grep enforcement).
- [x] No WordPress fetch composable is introduced (those land with the features that consume them).

#### Article IV — Testing — EXCEPTION DOCUMENTED (see Complexity Tracking)

- [x] **Exception**: this feature ships components WITHOUT Vitest specs. Feature 008 (`frontend-test-setup`) is the immediate next milestone and will backfill specs co-located as `Component.spec.ts`. See Complexity Tracking row "Test-first deferred to feature 008".
- [x] Existing server-side test suite (under `tests/**` and `server/**`) remains green after this feature.
- [x] Storybook stories provide the interim "Red→Green" visual review surface (Article VII makes this non-optional anyway).

#### Article V — Performance

- [x] `nuxt.config.ts` contains the EXACT `routeRules` block from `docs/business/rendering-strategy.md` §2 (the seven canonical patterns).
- [x] No public route added by this feature inherits the default render mode silently — the seven canonical patterns cover every route the codebase exposes at the time of merge.
- [x] Hard constraint: no DB client import under `app/`. Verified by grep.
- [x] Hard constraint: no top-level `await $fetch('https://cms.sumo.com.mx/...')` from a setup script (no WordPress fetches in this feature anyway).
- [x] Self-hosted fonts via `@nuxt/fonts` so first paint does not block on a third-party CDN handshake.

#### Article VI — Security

- [x] N/A — this feature ships no authentication, no public API endpoint, and no user input handling reaches a backend. Inputs in `Input/Select/Textarea` are stub components without form submission wiring.

#### Article VII — UX Consistency & Component Documentation (NON-NEGOTIABLE)

- [x] Every component under `app/components/ui/` has a co-located `*.stories.ts`.
- [x] Every story file includes: a `Default` story, a story per significant variant, and a viewport-annotated or dedicated mobile (360px) + desktop (1200px) story.
- [x] SUMO logo is used unmodified everywhere it appears (Nav, Storybook stories, any layout chrome).
- [x] Per-type accent is implemented as a single `.scope-express` class on a wrapper that swaps `--accent` to `--blue`. No per-component rule duplication (grep shows exactly ONE `--accent: var(--blue)` declaration).
- [x] Express accent is exclusive to Express-scoped regions — never used as a base color.
- [x] Mobile-first discipline: each component renders correctly at 360px, 520px, 880px, 1200px (verified in Storybook viewport stories).
- [x] Hit targets are ≥ 44px on every interactive base component.

#### Article VIII — Clean Code

- [x] Every UI component file < 200 lines.
- [x] Every function < 30 lines.
- [x] No `console.log` survives into the merge commit.
- [x] No commented-out code and no TODO comments on the merge target.
- [x] Variable / function names are self-documenting; no abbreviations.
- [x] No composables introduced in this feature.

#### Article IX — Quality Gates (NON-NEGOTIABLE)

- [x] Every commit on this branch passes Husky pre-commit (Biome lint + Biome format + vue-tsc) with no `--no-verify`.
- [x] Every commit message conforms to Conventional Commits with the allowed prefixes.
- [x] Pre-push hook (unit + integration tests + type-check) passes — server-side tests remain green; the feature contributes no new failing tests.

#### Article X — KISS

- [x] Exactly four new libraries are added at the verified pinned ranges: `@nuxtjs/tailwindcss ^6.14.0` (+ `tailwindcss ^3.4.19` as the transitive engine pinned explicitly), `@nuxtjs/i18n ^10.4.0`, `mapbox-gl ^3.25.0`, `@nuxt/fonts ^0.14.0`. Each is justified in `research.md` against the 100-LOC threshold; pins are recorded in `research-versions.md`.
- [x] No `clsx`, no `tailwind-merge`, no `class-variance-authority`. A tiny ≤30-LOC helper `app/utils/cx.ts` covers class-merging needs.
- [x] No abstraction layer is introduced for "future use" (e.g., no `BaseComponent` wrapper, no design-system meta-config).

#### Article XI — Absolute Imports via Alias

- [x] No `../../..` relative chain appears inside `app/components/ui/` — all cross-directory imports use `@/components`, `@/composables`, `@/types`, `@/utils`, `@/layouts`.
- [x] `nuxt.config.ts` aliases are preserved as-is (no rename, no deletion).

#### Article XII — Error Handling

- [x] N/A — no server route added. Components render error states declaratively via props (`error?: string` on Input/Select/Textarea) but do not call any API.

#### Article XIII — Environment Validation

- [x] N/A — no new environment variable required. Mapbox public token is consumed by feature 012, not by this feature. `mapbox-gl` is install-only here; no client is instantiated.

## Project Structure

### Documentation (this feature)

```text
specs/007-scaffold-and-design-system/
├── plan.md              ← this file
├── research.md          ← Phase 0 output
├── data-model.md        ← Phase 1 output (design-time contracts only — no persistent entities)
├── quickstart.md        ← Phase 1 output
├── contracts/
│   └── README.md        ← explains why this folder is empty for this feature
├── checklists/
│   └── requirements.md  ← spec-quality checklist (created by /speckit.specify)
└── tasks.md             ← Phase 2 output (created by /speckit.tasks — NOT this command)
```

### Source Code (repository root)

```text
# New / touched files in this feature (FRONTEND-ONLY)
nuxt.config.ts                       ← register modules + add routeRules block
tailwind.config.ts                   ← NEW — extend theme with Mercado Pop tokens
i18n.config.ts                       ← NEW — locales, defaultLocale='es', strategy='prefix_except_default'
package.json                         ← +4 deps (@nuxtjs/tailwindcss, @nuxtjs/i18n, mapbox-gl, @nuxt/fonts)
pnpm-lock.yaml                       ← regenerated

app/
├── assets/css/
│   ├── tokens.css                   ← NEW — :root design tokens + .scope-express
│   └── base.css                     ← NEW — global resets, body bg/font defaults
├── layouts/
│   └── default.vue                  ← NEW — Nav + slot + footer
├── components/
│   ├── staff/                       ← UNCHANGED (feature 006)
│   └── ui/                          ← NEW BASE PRIMITIVES (Article I, Article VII)
│       ├── Button.vue + Button.stories.ts
│       ├── Card.vue + Card.stories.ts
│       ├── Chip.vue + Chip.stories.ts
│       ├── Sticker.vue + Sticker.stories.ts
│       ├── Kicker.vue + Kicker.stories.ts
│       ├── Input.vue + Input.stories.ts
│       ├── Select.vue + Select.stories.ts
│       ├── Textarea.vue + Textarea.stories.ts
│       ├── Nav.vue + Nav.stories.ts
│       └── Marquee.vue + Marquee.stories.ts
├── composables/
│   ├── useStaffAuth.ts              ← UNCHANGED (feature 006)
│   └── useStaffCustomer.ts          ← UNCHANGED (feature 006)
└── utils/
    └── cx.ts                        ← NEW — ≤30 LOC class-merging helper

i18n/
└── locales/
    ├── es.json                      ← NEW — ES default seed (nav, common CTAs, brand)
    └── en.json                      ← NEW — EN seed mirroring es.json

.storybook/
├── main.ts                          ← TOUCHED — extend stories glob to include app/components/ui/**
└── preview.ts                       ← TOUCHED — import tokens.css + base.css so stories show Mercado Pop look

# Explicitly NOT touched (constitutional guardrails)
server/**                            ← Article V — backend untouched
types/**                             ← frontend-only feature; no cross-boundary type added
app/components/staff/**              ← feature 006 territory
app/composables/useStaff*.ts         ← feature 006 territory (re-enabled by 008)
.husky/, biome.json, commitlint.config.ts  ← Article IX pipeline is already correct
```

**Structure Decision**: This feature adds a `ui/` subdirectory under `app/components/` for shared primitives (per Article I's split between `ui/` reusable primitives and `features/<name>/components/` feature-scoped components) plus three new top-level config files (`tailwind.config.ts`, `i18n.config.ts`, locale JSON). The `staff/` folder under `app/components/` is left alone; future features will follow Article I and either add to `ui/` for shared primitives or to a new `app/features/<name>/components/` folder for feature-scoped UI.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified.**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| **Article IV — Test-first deferred to feature 008** | The backlog (`feature_list.json` id=8 "frontend-test-setup") explicitly sequences Vitest setup AFTER this scaffold. The current `vitest.config.ts` only globs `tests/**` and `server/**`, so any `app/**/*.test.ts` we write here would silently never run. Writing tests that don't execute would violate the spirit of Article IV more than deferring them by one feature. | Wiring up `happy-dom` + `@vue/test-utils` + `environmentMatchGlobs` here would expand scope into feature 008's territory and conflate two specs. The clean fix is the ordering already encoded in the backlog: 007 → 008 → 009+. Feature 008 will backfill at least one Vitest spec per base component delivered here (per `feature_list.json` id=8 description point 6). |
| **Adding `@nuxt/fonts` (4th library)** | Self-hosting Bricolage Grotesque + Hanken Grotesk by hand requires writing `@font-face` declarations, preload hints, subsetting, and tree-shaking unused weights — easily >100 LOC of brittle CSS + Nitro asset wiring. `@nuxt/fonts` is a first-party Nuxt module that does this with one line in `nuxt.config.ts`. | A hand-rolled font pipeline would burn budget without payoff and is more likely to drift than a maintained module. Article X allows libraries that save >100 LOC; this clears the threshold. |

## Phase 0 — Outline & Research

See [research.md](./research.md) for the full decisions. Headline picks (all three pre-decisions resolved 2026-06-17 — see research.md §12, §13):

1. **Tailwind v3 LTS via `@nuxtjs/tailwindcss`** (not v4 yet) — module maturity on Nuxt 4 is the deciding factor. Pins: `@nuxtjs/tailwindcss ^6.14.0` + `tailwindcss ^3.4.19`.
2. **`@nuxtjs/i18n` v10** (`^10.4.0`) with `strategy: 'prefix_except_default'` (RESOLVED), `defaultLocale: 'es'`, runtime locale switch via `setLocale()` (no full reload). v10 is the Nuxt 4 line; v9 targeted Nuxt 3 (`prefix_except_default` / `vueI18n` config options remain valid across the v9→v10 jump).
3. **`@nuxt/fonts`** (`^0.14.0`) for Bricolage Grotesque (display, weight 800) + Hanken Grotesk (body, weights 400/600/700) — self-hosted, tree-shaken at build, both confirmed available via the `'google'` provider (RESOLVED).
4. **Brand colors (RESOLVED — prototype values)**: `--orange = #FF6B2B` (AYCE, default `--accent`) and `--blue = #2E7CF6` (Express). Both exposed as **peer brand tokens** in `tokens.css` and `tailwind.config.ts` (`bg-orange`, `bg-blue`); Express styling triggered by `.scope-express` swapping `--accent` to `--blue`. Token names MUST NOT subordinate Express (no "secondary").
5. **Reduced-motion** handled via CSS `@media (prefers-reduced-motion: reduce)` in `Marquee.vue` only; micro-hover animations are not gated.
6. **Class-merging** via a 20-line `app/utils/cx.ts` (template + Tailwind-class deduper); no `clsx`, no `tailwind-merge`.

## Phase 1 — Design & Contracts

- [data-model.md](./data-model.md) — design-time contracts (Design Token Set, Accent Scope, i18n Locale File, UI Base Component prop tables).
- [contracts/README.md](./contracts/README.md) — explanation of why no API contracts exist for this feature.
- [quickstart.md](./quickstart.md) — how to install, run Storybook, add a new UI component / route / i18n key.

Agent context (`CLAUDE.md`) **Active Feature** section will be updated post-Phase-1 to point at this plan.

## Phase 2 — Tasks (deferred to `/speckit.tasks`)

`tasks.md` will be generated by `/speckit.tasks` with atomic, dependency-ordered tasks (e.g., "install deps → wire modules → write tokens.css → write tailwind.config.ts → ship `Button.vue` + story → ..."). `[P]` markers will identify the components that can be built in parallel once tokens and Tailwind config are in place.
