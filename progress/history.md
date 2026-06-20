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

---

## 2026-06-17 — Feature 008: `frontend-test-setup` (Vitest + happy-dom + Vue Test Utils)

**Branch**: `feat/008-frontend-test-setup`
**Status**: `done`
**Spec**: `specs/008-frontend-test-setup/`
**Agents**: `spec_author` → human review → `implementer` → `reviewer` → human close.

### Decisions baked in (research.md)

- **Vitest 4 env API**: `test.projects` (idiomatic v4; `environmentMatchGlobs` deprecated). Two named projects: `app` (happy-dom) and `server` (node).
- **`happy-dom`** `^15.10.2` initial pin; ended at `^20.0.11` after the `@nuxt/test-utils` peer-dep was bumped during install.
- **`@vue/test-utils`** `^2.4.6` (resolved to `2.4.11`).
- **Test convention**: `Component.vue ↔ Component.spec.ts` co-located (not `.test.ts`).
- **Composable tests legacy**: kept `vi.stubGlobal` shims as-is. Only added `vi.stubGlobal('navigateTo', vi.fn())` to fix the previously-broken `useStaffAuth` logout test.
- **Error/danger token**: reused `--pink` for error states. NO new tokens added — door left open for a future `--danger` if feature 011 forces a semantic conflict.
- **Coverage thresholds**: DEFERRED to feature 014 close-out.

### Implementation summary

- **27/27 tasks** `[x]` across 8 phases.
- **18/18 Phase -1 gates** `[x]`.
- **10 component specs** added under `app/components/ui/` (Button, Card, Chip, Sticker, Kicker, Input, Select, Textarea, Nav, Marquee) — behavior-driven, ≤ 60 lines each, Default + variant + accessibility/interaction assertion per file.
- **2 dead composable tests revived** (`useStaffAuth.test.ts`, `useStaffCustomer.test.ts`) — both now run under `app` project.
- **22 hex literals migrated** across 8 staff files to Mercado Pop tokens (`var(--ink)`, `rgb(var(--orange))`, etc.) — plus 1 extra (`#ef4444` in `TransactionTable.vue:190` → `rgb(var(--pink))`).
- **`vitest.config.ts` rewritten** to use `defineConfig` from `vitest/config` with two `test.projects`. `defineVitestConfig` from `@nuxt/test-utils/config` was rejected after research §1 footnote — it throws when `test.projects` is set. Fix: merge `getVitestConfigFromNuxt()` into the `server` project only; `app` project loads `@vitejs/plugin-vue` directly; filter `ssr-styles`, `vite:vue`, `vite:vue-jsx` from server-project plugin list. Documented in `tasks.md` T002 acceptance.
- **`@/utils` alias** added to vitest config to resolve `@/utils/cx` without Nuxt auto-import resolution.
- **`docs/harness/verification.md` + `conventions.md`** extended with the Frontend tests / Testing subsections.
- **`CHECKPOINTS.md` C4 extended** to require `pnpm test` coverage of `app/` (not only `server/`).
- **`.claude/agents/reviewer.md`** gained a Frontend spec-presence rule.

### Reviewer verification

- **APPROVED** — all 3 implementer deviations accepted (vitest.config shape, `@/utils` alias, the +1 hex migration).
- `./init.sh` exit 0; lint, typecheck OK.
- `pnpm test`: **226 tests** across 44 files (baseline 188/32; delta +38 tests / +12 files — exact spec target).
- T108a, T108b, T108c → zero matches across the full `app/` tree (T108c gate from feature 7 carryover satisfied).
- Sensitive data scan: zero hits.
- Full review: `progress/review_008-frontend-test-setup.md`.

### Carryovers for future features

- None blocking. From feature 009 onward, every new `app/components/ui/<Name>.vue` MUST ship with co-located `<Name>.spec.ts`. From feature 009+, **TDD applies forward-going** per Article IV.

---

## Feature 010 — Homepage (`/`) — DONE (2026-06-20)

Public homepage in the "Mercado Pop" visual language, ISR 3600. Branch `feat/010-homepage` (work uncommitted — human's call on commit/PR).

### What shipped
- **Sections**: hero (cream + 22px diagonal stripes + yellow radial "sun"; transparent logo frame with the official vertical SUMO SVG; orange `$269` sticker), type selector ("Dos formatos…" + AYCE/Express cards with badges/dots/chips/Ver-menú), featured-dishes rail, promotions, Google reviews, branches CTA. Global shell: `SiteHeader` (logo + nav + EN/ES + Reservar), ink `SiteMarquee` band, `SiteFooter`.
- **Content sourcing**: promotions from WordPress `promociones` (server-side, ISR) with a **two-step selection** — PRIMARY `?activa=1&home=1` (active + home-flagged) capped to 3 newest, FALLBACK `?activa=1` (all active) capped to 3 if primary empty, else section hides; 4s/3s fetch timeouts + graceful degradation. Featured dishes and reviews are **static fixtures** (route-compatible shape, swappable later). Hero price from runtime config.
- **PromoCard**: badge color from `acf.color`; small type bar (express→blue, ayce→orange, all→ink); the `acf.imagen` flyer opens large in a reusable **`UiLightbox`** on click (not inline).
- **Marquee**: adaptive repetition (gap-free at any width via measured copies), ink band, orange ✺ separator, i18n phrases, `speed="slow"`.
- **Favicon**: official vertical SUMO SVG + PNG fallback (Nuxt default favicon removed).
- **Footer**: ink band, official social URLs (IG/FB/TikTok), WhatsApp removed from social, Contacto→`/contacto`, compacted link heights (28px).

### Key decisions
- Featured dishes = static fixture, NOT a Neon DB route (the earlier `016 menu-schema-drizzle` detour was created+approved then **removed**; its DB code is parked in `git stash@{0}`). The reviewer-approved 016 schema can be revived for features 011/012.
- **Tailwind-only**: no `<style>` blocks in homepage/chrome; tokens only; no arbitrary color/inline-hex values. `hover:` is desktop-only (`hoverOnlyWhenSupported`).
- **Structure codified**: created `docs/harness/structure.md` (canonical by-feature layout) + `CHECKPOINTS.md` C3.1 gate + reviewer structure check; moved shell components to `app/components/layout/`.
- Fonts: Bricolage Grotesque (display) + Hanken Grotesk (body) via `@nuxt/fonts`.
- `WORDPRESS_API_URL` = bare origin `https://cms.sumo.com.mx` (env-driven; queries documented in `docs/business/wordpress-endpoints.md`; raw shape typed in `types/wordpress.ts`).

### Reviewer verification
- First pass **REJECTED** — one blocking defect: Express-exclusive blue used on the non-Express Google-reviews kicker (Article VII / FR-011). Fixed (kicker → `yellow`; `UiKicker` gained a yellow tone). Re-review **APPROVED**, flipped id=10 → `done`.
- `./init.sh` exit 0 — **352 tests** (65 files), biome, typecheck, build. `pnpm check` clean. All grep gates (default-palette / arbitrary-value / inline-hex / `<style>`) zero. Full record: `progress/review_010-homepage.md`.

### Carryovers
- **T042** (Lighthouse ≥90 / interactive <2s) deferred to post-deploy verification on the feature-009 CI preview.
- **Feature 011 (menu page)** is still specced for the WordPress `menu_item` CPT — must be reconciled to DB sourcing (revive the `016` schema from `git stash@{0}`) before it is worked on.
- `git stash@{0}` holds the reviewer-approved 016 menu-schema DB code (schema + migration + seed + `getFeaturedDishes`/`getFullMenu` helpers). Restore it for 011/012, or drop it if redoing.
- Homepage branch `feat/010-homepage` is uncommitted — commit/PR per the CI flow when ready.
