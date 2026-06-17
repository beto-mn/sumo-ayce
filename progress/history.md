# Session history

> Append-only log. Closed sessions are moved here from `progress/current.md`.

---

## 2026-06-17 — Feature 007: `scaffold-and-design-system` (Scaffold & Design System — Mercado Pop)

**Branch**: `feat/007-scaffold-and-design-system`
**Status**: `done`
**Spec**: `specs/007-scaffold-and-design-system/`
**Agents**: `spec_author` → human review → `implementer` → `reviewer` → human close.

### Pre-decisions (resolved by human before implementation)

- **Q1 — Brand colors**: prototype values. `--orange: #FF6B2B` (AYCE, default `--accent`), `--blue: #2E7CF6` (Express, peer brand token — NOT secondary). Both exposed in `tokens.css` and `tailwind.config.ts`.
- **Q2 — Typography**: Bricolage Grotesque (display, weight 800) + Hanken Grotesk (body 400/600/700), self-hosted via `@nuxt/fonts` (provider `'google'`).
- **Q3 — i18n routing**: `prefix_except_default` — ES at `/`, EN at `/en/...`.

### Other architectural decisions made this session

- **Reduced-motion handling**: CSS-only (`@media (prefers-reduced-motion: reduce)`) on `Marquee` only. The `usePrefersReducedMotion` composable was eliminated as overkill — micro-hover transitions on Button/Card/Sticker are short enough (<300ms) to be outside WCAG 2.3.3.
- **Mapbox license**: accepted (proprietary TOS, billing-aware). `mapbox-gl ^3.25.0` installed as install-only — provider-agnostic `<MapView>` abstraction will land in feature 012. Architecture documented in `docs/business/maps-strategy.md`.
- **Token enforcement (3 layers)**:
  - Layer 1 — `tailwind.config.ts` **overrides** `theme.colors` (default palette intentionally not compiled).
  - Layer 2 — Phase 8 greps T108a (default palette leak), T108b (arbitrary values), T108c (inline hex) — zero matches in new files.
  - Layer 3 — `reviewer.md` updated with "Design token enforcement" section that rejects PRs on the same patterns.
- **Token format**: migrated to RGB channels (`255 107 43`) consumed via `rgb(var(--token) / <alpha-value>)` per Tailwind v3 docs — unlocks opacity modifier (`bg-orange/50`, `bg-ink/40`, `hover:bg-accent/90`) used downstream in modals/overlays/hovers.

### Library pins (verified against npm registry)

- `@nuxtjs/tailwindcss ^6.14.0`
- `tailwindcss ^3.4.19` (pinned explicitly — v3 LTS, v4 module still beta)
- `@nuxtjs/i18n ^10.4.0` (Nuxt 4 line; original spec said v9, corrected during research)
- `@nuxt/fonts ^0.14.0`
- `mapbox-gl ^3.25.0`
- `@vitejs/plugin-vue ^6.0.7` (added during implementation — Storybook 10.4 needed it)

### Implementation summary

- **47 tasks**: 46 `[x]`, T012 `[REMOVED]` (composable eliminated).
- **46/46 Phase -1 gates** `[x]`.
- **10 base UI components** delivered with co-located stories (Button, Card, Chip, Sticker, Kicker, Input, Select, Textarea, Nav, Marquee) plus `Tokens` parity story.
- **Default layout**, i18n locales (`es.json`, `en.json`), `cx` utility, `tokens.css`, `base.css`, `tailwind.config.ts`, route rules wired.

### Reviewer verification

- Initial review: **APPROVED** with deviations accepted (`@vitejs/plugin-vue` 5th library, `.npmrc` workstation workaround, `@/utils` alias repoint, extra Tailwind tokens for `borderWidth`/`ringWidth`/`fontSize`).
- Delta re-review (after channel migration): **APPROVED** — all 9 checks pass, opacity modifier confirmed compiling to `rgb(var(--token) / 0.5)`.
- `./init.sh` exit 0, 188/188 tests, lint OK, typecheck OK, Storybook build OK, zero sensitive-data hits, zero copy-rule violations.
- Full review: `progress/review_scaffold-and-design-system.md`.

### Carryovers for future features

- **Feature 008** (frontend-test-setup) — scope expanded to include cleanup of 21 inline hex literals in `app/components/staff/*.vue` and `app/pages/staff/*.vue` (legacy feature 006 territory; pre-dated the token enforcement). T108c grep must return zero matches across the entire `app/` tree after feature 008 ships.
- **Feature 012** (`/sucursales`) — must implement the provider-agnostic `<MapView>` + `mapboxAdapter` per `docs/business/maps-strategy.md`. Reviewer agent will reject direct `mapbox-gl` imports outside `app/composables/maps/adapters/`.

### Operational changes (outside source code)

- `.gitignore` extended with `storybook-static/`.
- `feature_list.json` id=8 description extended with the staff hex cleanup point (8).
- `docs/business/maps-strategy.md` created (new — provider abstraction rule).
- `docs/business/features.md`, `overview.md`, `rendering-strategy.md` updated with cross-references to maps-strategy.
- `.claude/agents/reviewer.md` updated with "Design token enforcement" section.
