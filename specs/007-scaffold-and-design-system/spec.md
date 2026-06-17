# Feature Specification: Scaffold & Design System (Mercado Pop)

**Feature Branch**: `feat/007-scaffold-and-design-system`
**Created**: 2026-06-17
**Status**: Draft
**Input**: Feature 7 from `feature_list.json` — establish the foundational scaffolding (libs, design tokens, base reusable UI primitives, default layout, i18n, route rendering rules, Storybook stories) for the SUMO AYCE website redesign so every subsequent feature (008–014) starts from a consistent base.

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Page-author starts a new public page with the shared chassis (Priority: P1)

A developer beginning feature 009 (Homepage) opens a new `.vue` file under `app/pages/`, drops in `<UiButton>`, `<UiCard>`, `<UiKicker>`, `<UiSticker>`, `<UiMarquee>`, picks copy from the i18n locale files, and immediately sees the Mercado Pop look (cream background, 3px black borders, sticker shadows, AYCE-orange accent) without writing any CSS. The page automatically inherits the default layout (Nav + footer), the correct rendering mode (ISR 3600 on `/`), and the language toggle in the navigation.

**Why this priority**: This is the entire reason feature 007 exists — to unblock features 009–014. Without a working shared chassis, every page author re-invents tokens, layouts, and language wiring, and the Article I and Article VII guarantees collapse.

**Independent Test**: A throw-away `app/pages/__scaffold-demo.vue` page composed exclusively of the base components renders the Mercado Pop look correctly on mobile (360px) and desktop (≥1200px), shows both ES and EN copy when the language button is toggled, and passes a manual Storybook visual review of every base component.

**Acceptance Scenarios**:

1. **Given** the new chassis is in place, **When** a developer composes a page using only `<UiButton>`, `<UiCard>`, `<UiChip>`, `<UiSticker>`, `<UiKicker>`, `<UiInput>`, `<UiSelect>`, `<UiTextarea>`, `<UiNav>`, `<UiMarquee>` and the i18n helper, **Then** the page renders the full Mercado Pop visual signature (cream `--bg`, 3px ink borders, `6px 6px 0` shadows, Bricolage display + Hanken body, AYCE-orange `--accent` by default) without any inline CSS or component-local style overrides.
2. **Given** the developer wraps a region in an Express scope, **When** the region renders, **Then** all accented elements inside that region (button fills, active chips, active nav link, ring focus on inputs) switch to the Express blue, while every element outside the scope stays on AYCE orange.
3. **Given** the user toggles the language via the Nav language button, **When** the toggle fires, **Then** every visible i18n string updates without a full reload, the URL prefix changes from `/` (es) to `/en/...` (en), and the previously focused element keeps focus.
4. **Given** the user's OS reports `prefers-reduced-motion: reduce`, **When** the page renders, **Then** the Marquee animation pauses (visually static, layout intact). Micro-hover transitions on Button/Card/Sticker remain active — they are short enough (<300ms) to be outside the WCAG 2.3.3 gate.

---

### User Story 2 — UI primitive is reviewable in isolation in Storybook (Priority: P1)

A reviewer opens `pnpm storybook`, navigates to the "UI" category, and sees every base component (Button, Card, Chip, Sticker, Kicker, Input, Select, Textarea, Nav, Marquee) with stories for: Default, every significant variant (sizes, accent scope AYCE vs Express, states like disabled/loading/error), and mobile + desktop viewports. Each component renders without console errors and respects the design tokens. This is the Article VII enforcement surface: a component without a passing story is not considered merged.

**Why this priority**: Storybook coverage is the constitutional mechanism (Article VII, NON-NEGOTIABLE) that makes the design system auditable and prevents drift between the design context and the codebase. Without it, base components silently fork from the tokens within weeks.

**Independent Test**: `pnpm storybook` boots, the sidebar lists every base component under a "UI" category, and clicking through Default + variants + viewport stories produces no runtime errors in the browser console and no broken visual states.

**Acceptance Scenarios**:

1. **Given** `pnpm storybook` is running, **When** the reviewer opens any base component, **Then** at minimum a `Default` story exists, every significant prop variant has a dedicated story, and the AYCE-vs-Express accent variation is demonstrated for every component that exposes accent.
2. **Given** the reviewer switches the Storybook viewport to mobile (360px) or desktop (1200px), **When** a base component renders, **Then** the component remains visually correct (no overflow, no clipped borders, no shadow leak, hit targets ≥ 44px on mobile).
3. **Given** a base component depends on the SUMO logo, **When** rendered in Storybook, **Then** the logo is shown unmodified (square, orange background, white "SUMO", black "ALL YOU CAN EAT" bar) per Article VII — no recolor, no crop, no shape change.

---

### User Story 3 — Build pipeline honors the rendering strategy (Priority: P2)

When the developer runs `pnpm build`, Nuxt picks up `routeRules` from `nuxt.config.ts` exactly as canonicalized in `docs/business/rendering-strategy.md` §2. The reviewer can verify that no public route silently inherits the default render mode, and that `/lealtad` and `/staff/**` are SSR (per-user), `/promociones` is ISR 60s, and `/`, `/menu`, `/sucursales` are ISR 3600s.

**Why this priority**: Forgetting a `routeRules` entry silently downgrades a page to SSR-on-every-request, breaking the Lighthouse 90+ commitment in Article V. The reviewer enforces this; the scaffold makes it impossible to miss.

**Independent Test**: `pnpm build` succeeds, and the resulting `.output/` includes the expected ISR markers for `/`, `/menu`, `/sucursales`, `/promociones`, plus SSR entries for `/lealtad` and `/staff/**`. A reviewer can grep `nuxt.config.ts` and find the exact route-rule block.

**Acceptance Scenarios**:

1. **Given** the canonical `routeRules` block is in `nuxt.config.ts`, **When** `pnpm build` runs, **Then** the build completes without warnings about unknown or missing route configurations, and the rendered output assigns the expected mode (ISR 3600, ISR 60, SSR) to each route pattern.
2. **Given** a new route is added later under `app/pages/`, **When** no matching `routeRules` entry exists, **Then** the scaffold provides a documented operational checklist (in `quickstart.md` or comparable doc) referencing `rendering-strategy.md` §7 so the next developer knows to update both files in lockstep.

---

### User Story 4 — Dependency install is hermetic and reproducible (Priority: P2)

A new developer (or CI) checks out the branch, runs `pnpm install`, and gets a clean, lockfile-locked install with Tailwind CSS, `@nuxtjs/i18n`, and `mapbox-gl` present as direct dependencies. No previously installed library (Drizzle, Twilio, Storybook 10, Vitest, Biome) is removed, and there are no unresolved peer-dependency warnings that block the dev server from starting.

**Why this priority**: A broken `pnpm install` blocks every downstream feature. Locking and verifying the three new libs once, with the existing toolchain undisturbed, is the only way to make features 008–014 reproducible.

**Independent Test**: From a clean checkout of the feature branch, `pnpm install && pnpm dev` succeeds on a developer machine and on CI. `pnpm-lock.yaml` shows the three new libs at locked versions; `package.json` shows them under `dependencies` (Tailwind under `devDependencies` if that matches the Nuxt module convention).

**Acceptance Scenarios**:

1. **Given** a clean checkout, **When** `pnpm install` runs, **Then** Tailwind CSS, `@nuxtjs/i18n`, and `mapbox-gl` are installed at locked versions and `pnpm-lock.yaml` is updated.
2. **Given** the install completed, **When** `pnpm dev` is started, **Then** the Nuxt dev server boots without missing-module errors, and the existing dependencies (Drizzle ORM, Twilio, Storybook 10, Vitest, Biome) remain functional (i.e., `pnpm test`, `pnpm storybook`, `pnpm check` still succeed).
3. **Given** the installation completes, **When** a developer inspects `package.json`, **Then** no extraneous library has been added beyond Tailwind, `@nuxtjs/i18n`, and `mapbox-gl` (Article X, KISS).

---

### User Story 5 — Design tokens are reachable from both Tailwind utility classes and raw CSS (Priority: P3)

A page author writes both Tailwind utility classes (e.g., `bg-bg text-ink border-ink`) and raw CSS that consumes the same tokens (e.g., `var(--accent)` inside a scoped style block) and gets identical output. The token names and values match `docs/business/overview.md` §2 exactly: changing a token value in one place updates both the Tailwind theme and the CSS custom properties without any silent drift.

**Why this priority**: Dual access (utility classes for fast layout, CSS variables for accent-scope swaps and decorative one-offs) prevents the team from inventing parallel color systems six weeks into development. It is the practical realization of Article VII's "single source of truth" rule.

**Independent Test**: A Storybook story that uses both `class="bg-bg text-ink"` and `style="background: var(--bg); color: var(--ink)"` renders with pixel-identical colors. Changing `--ink` in the global stylesheet propagates everywhere; changing the Tailwind theme value does too.

**Acceptance Scenarios**:

1. **Given** the token system is in place, **When** a developer writes `class="bg-accent"`, **Then** the rendered color matches `var(--accent)` and respects the AYCE/Express scope swap.
2. **Given** an Express scope wraps a subtree, **When** anything inside that subtree reads `var(--accent)` (directly or via a Tailwind utility), **Then** it resolves to `--blue`; everything outside the scope resolves to `--orange`.

---

### Edge Cases

- **Reduced-motion preference**: The `Marquee` component MUST honor `prefers-reduced-motion: reduce` and pause its scroll animation. Micro-hover transitions on Button/Card/Sticker are short enough to be out of scope of this gate.
- **Express accent leak**: if a region nested inside an AYCE page accidentally inherits Express accent (e.g., a developer wraps the wrong element), the visual must remain readable; functionally, the per-type accent rule is enforced via a single scope wrapper, so the failure mode is "wrong color" not "broken contrast".
- **Locale switch mid-form**: toggling EN ↔ ES while a user is filling out a form (Input/Select/Textarea inside a future reservation modal) MUST preserve form values and field focus.
- **Missing token fallback**: if a CSS custom property is referenced before the global stylesheet loads (e.g., FOUC), the fallback color in the Tailwind theme MUST still produce a usable, on-brand result (no neon-pink fallback).
- **Storybook on mobile viewport**: the Nav burger menu MUST be reachable and functional in the 360px viewport story; collapsed nav links must respect Article VII's ≥44px hit target.
- **Logo size at 360px**: the unmodified logo (square, orange background) MUST fit inside the Nav's rounded black box at the smallest viewport without clipping or rescaling that breaks Article VII's "logo unmodified" rule.
- **Tailwind purge on Storybook**: tokens used only inside Storybook stories must not be purged from the production Tailwind build (or, conversely, Storybook must not regress when the production purge runs).
- **i18n key missing**: when an i18n key is referenced but missing in a locale file, the rendered string MUST show the key name (not a blank or runtime error) so the gap is visible during dev.

## Requirements *(mandatory)*

### Functional Requirements

#### FR-100 — Dependency installation

- **FR-101**: System MUST add Tailwind CSS as a direct project dependency at a locked version, integrated with Nuxt via the supported module/Vite pipeline.
- **FR-102**: System MUST add `@nuxtjs/i18n` as a direct project dependency at a locked version, registered as a Nuxt module.
- **FR-103**: System MUST add `mapbox-gl` as a direct project dependency at a locked version, even though no UI consumes it in this feature (consumed by feature 012).
- **FR-104**: System MUST preserve every existing dependency declared in `package.json` (Drizzle ORM, Twilio, Storybook 10, Vitest, Biome, Husky, commitlint, vue-tsc, Pino, etc.) — none MAY be removed or downgraded by this feature.
- **FR-105**: System MUST update `pnpm-lock.yaml` consistently so `pnpm install --frozen-lockfile` succeeds on CI.

#### FR-200 — Route rendering rules

- **FR-201**: System MUST place the exact `routeRules` block from `docs/business/rendering-strategy.md` §2 into `nuxt.config.ts`:
  - `'/'` → `isr: 3600`
  - `'/menu'` → `isr: 3600`
  - `'/sucursales'` → `isr: 3600`
  - `'/promociones'` → `isr: 60`
  - `'/lealtad'` → `ssr: true`
  - `'/staff/**'` → `ssr: true`
  - `'/api/**'` → dynamic (empty rule object)
- **FR-202**: System MUST NOT add `routeRules` entries for routes that do not yet exist in `app/pages/` beyond the seven canonical patterns above (KISS).
- **FR-203**: Documentation (in `quickstart.md` or equivalent) MUST point future page authors to `docs/business/rendering-strategy.md` §7 (operational checklist when adding a route).

#### FR-300 — Design tokens

- **FR-301**: System MUST expose every token from `docs/business/overview.md` §2 as CSS custom properties on `:root` in a global stylesheet loaded by the default layout: `--bg`, `--bg2`, `--panel`, `--ink`, `--soft`, `--orange`, `--blue`, `--pink`, `--yellow`, `--green`, `--line`, `--accent`, `--r`, `--r-sm`, `--shadow`, `--shadow-sm`, `--maxw`, `--disp`, `--body`.
- **FR-302**: System MUST extend the Tailwind theme so the same tokens are reachable via utility classes (`bg-bg`, `text-ink`, `border-ink`, `bg-accent`, `shadow-pop` (the `6px 6px 0` shadow), `shadow-pop-sm` (the `4px 4px 0` shadow), `rounded-pop` (`22px`), `rounded-pop-sm` (`14px`), `max-w-pop` (`1200px`), `font-disp`, `font-body`).
- **FR-303**: System MUST treat `--orange` (`#FF6B2B`, AYCE) and `--blue` (`#2E7CF6`, Express) as **peer brand tokens** — semantic location-type colors, not "primary" vs "secondary". `--accent` MUST default to `--orange` and MUST be swapped to `--blue` by a single scope class (e.g., `.scope-express`). Per-type styling MUST be implemented by applying this scope to a wrapper, NOT by duplicating rules per component (Article VII). Token naming MUST expose Express as a peer (e.g., `brand.express` / `bg-blue` / `--blue`) so downstream features 010 (menu Express tab) and 012 (SUMO Express branches) can switch on it without re-mapping. Token names that hide Express as a "secondary" of orange are PROHIBITED.
- **FR-304**: System MUST set up the typography pipeline so Bricolage Grotesque (display, weight 800) and Hanken Grotesk (body) are loaded once globally — self-hosted via `@nuxt/fonts` (Nuxt's official, zero-config font module) so the font files are downloaded at build, served from the same origin, and the unused weights are tree-shaken. The display family MUST be reachable via `--disp` and the Tailwind utility `font-disp`; the body family via `--body` and `font-body`.
- **FR-305**: System MUST provide a documented type-scale set (h-xl, h-lg, body, kicker) matching `docs/business/overview.md` §2 either as Tailwind utilities (`text-h-xl`, `text-h-lg`, `text-body`, `text-kicker`) or as reusable CSS classes — exposed consistently so authors do not invent their own scales.
- **FR-306**: System MUST follow mobile-first breakpoints aligned with `docs/business/overview.md` §9: collapse rules at 880px and 520px. Tailwind's default `sm` (640px) MAY be overridden or supplemented to expose `md` (≥880px collapse-up breakpoint) and `sm` (≥520px) names that match the design context. The exact mapping is recorded in `research.md`.
- **FR-307** *(Token enforcement — requested as "FR-304" in the token-enforcement directive; renumbered to FR-307 because the original FR-304 already covers typography. Same intent, same enforcement.)*: System MUST enforce a tokens-only color contract by **overriding** Tailwind's `theme.colors` in `tailwind.config.ts` (not extending it). The Tailwind default palette (`slate`, `gray`, `zinc`, `neutral`, `stone`, `red`, `orange`, `amber`, `yellow`, `lime`, `green`, `emerald`, `teal`, `cyan`, `sky`, `blue`, `indigo`, `violet`, `purple`, `fuchsia`, `pink`, `rose` × steps `50…950`) MUST NOT be generated by the build. Only `transparent`, `currentColor`, and the project tokens (`bg`, `bg2`, `panel`, `ink`, `soft`, `orange`, `blue`, `pink`, `yellow`, `green`, `line`, `accent`) are valid color names. Authors MUST NOT use Tailwind arbitrary-value syntax for colors (e.g., `bg-[#FF6B2B]`, `text-[var(--ink)]` are PROHIBITED) and MUST NOT embed inline hex colors in `app/components/`, `app/layouts/`, or `app/pages/` (the only place raw hex values live is `app/assets/css/tokens.css`). A new color requires a token addition in BOTH `tokens.css` AND the override map in `tailwind.config.ts` before any component may consume it. Enforcement: T004 (override contract + acceptance that `bg-orange-500`/`bg-gray-300` do NOT compile while `bg-orange`/`bg-accent`/`shadow-pop` DO) and T108a/T108b/T108c (Phase 8 grep gates over `app/**` and `.storybook/**`).

#### FR-400 — Base reusable UI primitives

- **FR-401**: System MUST deliver these PascalCase components under `app/components/ui/`: `Button.vue`, `Card.vue`, `Chip.vue`, `Sticker.vue`, `Kicker.vue`, `Input.vue`, `Select.vue`, `Textarea.vue`, `Nav.vue`, `Marquee.vue`. Each MUST live as exactly one file (Article I — DRY): no per-variant file duplication.
- **FR-402**: Every component MUST declare its props via `defineProps<>()` with strict TypeScript types (no `any`, no `unknown` without narrowing). Variants (size, accent, state, tone, etc.) MUST be expressed as props, NOT as separate files.
- **FR-403**: `Button.vue` MUST expose: `variant: 'primary' | 'ink' | 'ghost'`, `size: 'sm' | 'md' | 'lg'`, `disabled?: boolean`, `loading?: boolean`, `type?: 'button' | 'submit' | 'reset'`. Visual rules: 3px ink border, pill, `4px 4px 0` shadow; hover lifts `translate(-2px,-2px)` and the shadow grows by 2px on each axis; active state sinks. Disabled removes the lift, loading shows a spinner inside the button without changing width.
- **FR-404**: `Card.vue` MUST expose: `accent?: 'ayce' | 'express'` (controls the local scope), `tone?: 'panel' | 'bg2'` (background), `shadowSize?: 'lg' | 'sm'`. Visual rules: `--panel` background, 3px ink border, 22px radius, `6px 6px 0` shadow by default.
- **FR-405**: `Chip.vue` MUST expose: `active?: boolean`, `accent?: 'ayce' | 'express'`, `as?: 'button' | 'span'`. Visual rules: pill, 2.5px border; active state fills with ink and switches text to cream.
- **FR-406**: `Sticker.vue` MUST expose: `tone?: 'yellow' | 'pink'`, `rotate?: number` (default -8). Visual rules: yellow fill by default, 3px border, rotated -8°; rendered as `<span>` so it can be absolutely positioned by its parent.
- **FR-407**: `Kicker.vue` MUST expose: `tone?: 'ink' | 'accent'` (default `'ink'`), `rotate?: number` (default -2). Visual rules: black pill, cream text, rotated -2°, slot for label.
- **FR-408**: `Input.vue`, `Select.vue`, `Textarea.vue` MUST each expose: `modelValue: string`, `label?: string`, `hint?: string`, `error?: string`, `name: string`, `required?: boolean`, `disabled?: boolean`, `placeholder?: string`. `Input.vue` adds `type?: 'text' | 'email' | 'tel' | 'number' | 'password'`. `Select.vue` adds `options: { value: string; label: string }[]`. All three: 2.5px ink border, 14px radius; focus state shows a `4px 4px 0` sticker shadow. They MUST emit `update:modelValue` for v-model compatibility.
- **FR-409**: `Nav.vue` MUST render a sticky top bar with: cream background, 3px bottom ink border, a logo slot (rounded black box around the unmodified SUMO logo), a center slot for pill links (active link = filled accent), a right slot for a square yellow language toggle button and an optional CTA slot. On viewports < 880px the center links collapse into a burger overlay. Slots: `#logo`, `#links`, `#actions`.
- **FR-410**: `Marquee.vue` MUST expose: `speed?: 'slow' | 'normal' | 'fast'` (default `normal`), `direction?: 'left' | 'right'` (default `left`), `pauseOnHover?: boolean` (default `true`). It MUST render a horizontally scrolling band whose animation is paused (visually static, content duplicated for seamless loop) when `prefers-reduced-motion: reduce` is set. The pause MUST be implemented via a CSS `@media (prefers-reduced-motion: reduce)` rule in the component's scoped style block — NOT via a JS composable.
- **FR-411**: No component MAY exceed 200 lines, and no function inside a component MAY exceed 30 lines (Article VIII).
- **FR-412**: No component MAY contain a `console.log`, commented-out code, or TODO comments on the merge target (Article VIII).
- **FR-413**: No component under `app/components/ui/` MAY import from `drizzle-orm`, `@neondatabase/serverless`, or any path under `server/` (Article V — backend logic is never static, hard constraint).
- **FR-414**: All imports inside `app/components/ui/` MUST use the configured aliases (`@/components`, `@/composables`, `@/types`, `@/utils`) — no `../../..` relative chains across directories (Article XI).

#### FR-500 — Default layout

- **FR-501**: System MUST provide `app/layouts/default.vue` composed of `<UiNav>`, `<slot />`, and a footer region; container width capped at `var(--maxw)` (1200px) with mobile-first horizontal padding.
- **FR-502**: The default layout MUST be applied to every public page that does NOT explicitly opt into a different layout. Loyalty (`/lealtad`) and staff (`/staff/**`) MAY override later; this feature only ships the default.
- **FR-503**: The default layout MUST render correctly at 360px, 520px, 880px, and 1200px viewports.

#### FR-600 — Internationalization (i18n)

- **FR-601**: System MUST register `@nuxtjs/i18n` with two locales: `es` (default) and `en`.
- **FR-602**: System MUST use the routing strategy `prefix_except_default`: ES at `/` (no prefix), EN at `/en/...`.
- **FR-603**: System MUST place locale files at `i18n/locales/es.json` and `i18n/locales/en.json`, each seeded with keys for: navigation labels (`nav.menu`, `nav.promociones`, `nav.sucursales`, `nav.lealtad`, `nav.contacto`, `nav.reservar`), common buttons (`common.cta.reserve`, `common.cta.viewMenu`, `common.cta.findBranch`, `common.lang.toggle`), and brand-copy rules (`brand.tagline` = "Estilo americano-japonés" / "American-Japanese style"; `brand.ayceBadge` = "All You Can Eat"). The seed key list MUST be considered the minimum and MUST NOT include any "Buffet" string.
- **FR-604**: The `<UiNav>` language button MUST toggle between locales without a full reload using the i18n module's locale-switching API; the previously focused element MUST keep focus, and form input values MUST be preserved across the switch.
- **FR-605**: When a locale key is missing in a file, the rendered fallback MUST be the key name (not a blank string and not a runtime error), so the gap is visible in dev.

#### FR-700 — Storybook coverage (Article VII enforcement)

- **FR-701**: Every component delivered under `app/components/ui/` MUST have a co-located `*.stories.ts` (Article VII).
- **FR-702**: Each story file MUST include at minimum: a `Default` story; one story per significant variant (sizes for Button, accents for Card/Chip/Nav/Kicker, states for Input/Select/Textarea); and a viewport-annotated or dedicated mobile (360px) and desktop (1200px) story.
- **FR-703**: Storybook MUST group every base component under a single "UI" category in the sidebar (e.g., `title: 'UI/Button'`).
- **FR-704**: `pnpm storybook` MUST boot without errors; every story MUST render without runtime errors in the browser console.
- **FR-705**: Storybook autodocs (`autodocs: 'tag'`) MUST remain enabled so components tagged with `@satisfies Meta` get automatic doc pages.

#### FR-800 — Constitutional guardrails

- **FR-801**: System MUST NOT introduce any third-party library beyond Tailwind CSS, `@nuxtjs/i18n`, `mapbox-gl` (Article X — KISS, 100-LOC threshold). If any helper is needed (e.g., class-merging utility), it MUST be a single small file under `app/utils/` (no library).
- **FR-802**: System MUST NOT add code under `server/` or `types/` as part of this feature; it is frontend-only except for `nuxt.config.ts`.
- **FR-803**: Every commit on this branch MUST pass Husky pre-commit hooks (Biome lint, Biome format, vue-tsc type-check) and commitlint Conventional Commit format with allowed prefixes — Article IX, no `--no-verify`.
- **FR-804**: The SUMO logo MUST be used unmodified anywhere it appears (Nav, Storybook stories, layout) per Article VII — no recolor, no crop, no shape change.
- **FR-805**: Mobile-first responsive discipline MUST be enforced: every component story renders correctly at the documented breakpoints (520px, 880px) and hit targets are ≥44px on touch surfaces.

### Key Entities *(include if feature involves data)*

This feature is configuration- and component-only; it introduces no persistent entity. The "entities" it formalizes are design contracts:

- **Design Token Set** — the named tokens from `docs/business/overview.md` §2 (colors, radii, shadows, max width, typography families, type scale). The token set is the contract between the Tailwind theme and the global CSS custom properties; both must resolve to identical values.
- **Accent Scope** — a CSS scope (`.scope-express`) that locally swaps `--accent` from orange to blue. Every per-type styling rule in the codebase MUST read through `--accent` to honor the scope.
- **i18n Locale File** — a JSON keyed by feature/section/component, present in two languages (es default, en optional). Missing keys fall back to the key name.
- **UI Base Component** — a single-file Vue component under `app/components/ui/` with strictly typed props, a co-located `*.stories.ts`, no DB imports, no cross-feature imports, no internal file <30 lines or component file <200 lines violations.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: From a clean checkout, `pnpm install` followed by `pnpm dev` succeeds in under 60 seconds on a developer machine, with no missing-module or peer-dependency errors blocking startup.
- **SC-002**: 100% of the ten base components (Button, Card, Chip, Sticker, Kicker, Input, Select, Textarea, Nav, Marquee) ship with a co-located `*.stories.ts` that covers Default + every significant variant + mobile (360px) + desktop (1200px) viewports.
- **SC-003**: `pnpm storybook` boots without errors and lists every base component under the "UI" category; zero console errors are observed during a full sweep of every story.
- **SC-004**: 100% of the seven canonical routes (`/`, `/menu`, `/sucursales`, `/promociones`, `/lealtad`, `/staff/**`, `/api/**`) have the exact `routeRules` entries from `docs/business/rendering-strategy.md` §2 in `nuxt.config.ts`.
- **SC-005**: The full token set from `docs/business/overview.md` §2 (12 colors, 2 radii, 2 shadows, max width, 2 font families, 4 type-scale entries) is reachable both via Tailwind utility classes and via CSS custom properties; a smoke test that reads each token both ways produces identical computed values.
- **SC-006**: The Express accent swap is implemented as a single CSS scope; the codebase contains zero per-component duplicated rules for the Express line (verified by grep showing only one `--accent: var(--blue)` declaration scoped to `.scope-express`).
- **SC-007**: Toggling the language via the Nav language button switches every visible i18n string within the next render frame; no full page reload occurs (verified by absence of `window` navigation events during the toggle).
- **SC-008**: When `prefers-reduced-motion: reduce` is set, the Marquee animation pauses. Other components remain visually correct and unchanged.
- **SC-009**: `pnpm build` completes with no warnings about unconfigured route rendering modes, and the resulting output contains ISR markers for `/`, `/menu`, `/sucursales`, `/promociones` and SSR markers for `/lealtad`, `/staff/**`.
- **SC-010**: A grep over `app/components/ui/` returns zero matches for `drizzle-orm`, `@neondatabase/serverless`, or any `server/` import path (Article V enforcement).
- **SC-011**: Every base component file is under 200 lines; no function inside a component exceeds 30 lines (Article VIII, verified by line counts).
- **SC-012**: Every commit on the feature branch passes Husky pre-commit hooks and commitlint without using `--no-verify` (Article IX).
- **SC-013** *(Token enforcement — requested as "SC-009" in the token-enforcement directive; renumbered to SC-013 because the original SC-009 already covers `pnpm build`. Same intent, same enforcement.)*: The codebase enforces a tokens-only color contract end-to-end: (a) `tailwind.config.ts` overrides `theme.colors` so Tailwind's default palette (`*-50…*-950` across `slate/gray/zinc/neutral/stone/red/orange/amber/yellow/lime/green/emerald/teal/cyan/sky/blue/indigo/violet/purple/fuchsia/pink/rose`) is not generated, and only `transparent`, `currentColor`, and the project tokens are valid color names (verified by T004 acceptance: `bg-orange-500` and `bg-gray-300` do NOT compile; `bg-orange`, `bg-accent`, `shadow-pop` DO); (b) the grep gates T108a (default-palette leak), T108b (arbitrary-value color/shadow/gradient utilities like `bg-[…]`, `shadow-[…]`, `from-[…]`), and T108c (inline hex outside `tokens.css`) ALL return zero matches across `app/**` and `.storybook/**`. The combination of the override (compile-time) and the greps (review-time) makes "tokens only" a guarantee, not a convention.

## Assumptions

- **Tailwind integration via `@nuxtjs/tailwindcss`** — assumed the supported Nuxt-Tailwind module is the path of least resistance; if the project prefers a hand-rolled PostCSS pipeline, this can be revisited during `/speckit.plan`.
- **Self-hosted fonts via `@nuxt/fonts`** — assumed the Nuxt fonts module (Bricolage Grotesque + Hanken Grotesk) is the simplest reliable way to ship the chosen typography without third-party CDN dependencies. Article X (KISS) allows this since `@nuxt/fonts` is a first-party Nuxt module that replaces ~100 LOC of manual `@font-face` + preload + tree-shaking.
- **i18n routing = `prefix_except_default` — CONFIRMED**: ES at `/` (no prefix), EN at `/en/...`; locale persistence across reloads via the module's default cookie behavior.
- **Brand colors — CONFIRMED (prototype values)**: `--orange = #FF6B2B` (AYCE primary, default `--accent`) and `--blue = #2E7CF6` (Express, peer brand token). The blue is a real, used semantic token (location type = Express, e.g., `/menu` switched to Express, SUMO Express branches on `/sucursales`) and MUST be exposed as a peer brand token — e.g., `brand.express` — never as a subordinate "secondary" of orange. Downstream features 010 (menu) and 012 (branches) switch on it.
- **Typography — CONFIRMED**: Bricolage Grotesque (display, weight 800) + Hanken Grotesk (body), self-hosted via `@nuxt/fonts`.
- **No new feature folder** — assumed everything lands in `app/components/ui/`, `app/layouts/`, `app/assets/css/`, `i18n/locales/`, `nuxt.config.ts`, `tailwind.config.ts` (or equivalent), `package.json`. No `app/features/<name>/` folder is created by this feature.
- **Storybook configuration** — assumed the existing `.storybook/` setup (`@storybook/vue3-vite` + `@storybook/addon-docs`, Storybook 10) already supports the autodocs `tag` mode and only needs path/glob updates to discover the new stories under `app/components/ui/**`.
- **No tests under `app/`** — assumed test setup for `app/**` is feature 008 (frontend-test-setup) per the feature backlog. This feature ships components without Vitest specs; specs will be backfilled in 008.
- **No backend or DB schema changes** — assumed Article V's hard constraint is honored by keeping every file in this feature outside `server/`, `types/`, and any DB-importing path.
- **Existing app/composables/useStaff*.ts files remain untouched** — they belong to feature 006 and will be picked up by feature 008's test re-enablement work.
- **Husky / Biome / commitlint pipeline is already correct** — assumed Article IX gates are functional from prior features; this feature does not modify them.

## Clarifications — Resolved

The three pre-decisions originally surfaced as Q1/Q2/Q3 were confirmed by the human on 2026-06-17. The decisions below are now binding inputs to `/speckit.plan` and downstream features.

### Q1 — Brand color values — RESOLVED: prototype values

- `--orange` (AYCE, default `--accent`) = `#FF6B2B`
- `--blue` (Express, peer brand token) = `#2E7CF6`

**Reasoning (human, verbatim)**: "en el prototipo, en la página de Menú cuando se selecciona Express salen los azules; en /sucursales las sucursales SUMO Express también salen en azul. Usa exactamente los colores del prototipo porque el azul se ocupa." Express is a real, used variant — not a decorative one-off. Both colors are peer brand tokens scoped by location type. The token surface MUST expose them as peers (e.g., `brand.ayce` / `brand.express`, or `--orange` / `--blue` with `--accent` defaulting to orange and swapping to blue inside `.scope-express`). Any naming that hides Express as a "secondary of orange" is REJECTED.

### Q2 — Typography stack — RESOLVED: Bricolage + Hanken

- Display: Bricolage Grotesque, weight `800`.
- Body: Hanken Grotesk.
- Loaded once via `@nuxt/fonts` (self-hosted, tree-shaken at build).

### Q3 — i18n routing strategy — RESOLVED: `prefix_except_default`

- ES at `/` (no prefix), EN at `/en/...`.
- Configured in `@nuxtjs/i18n` accordingly (`strategy: 'prefix_except_default'`, `defaultLocale: 'es'`).

## Dependencies & Integration Points

- **Constitution** — `.specify/memory/constitution.md` (version 3.1.0) — Articles I, II, V, VII, VIII, IX, X, XI are the load-bearing constraints for this feature.
- **Design context** — `docs/business/overview.md` §2 (tokens), §3 (base components), §6 (per-type accent), §9 (responsive breakpoints).
- **Rendering strategy** — `docs/business/rendering-strategy.md` §2 (canonical `routeRules`), §7 (operational checklist).
- **Feature backlog** — `feature_list.json` id=7. This feature unblocks features 008 (frontend-test-setup) and 009–014 (page implementations).
- **Existing repo state** — Nuxt 4 monorepo with Storybook 10, Vitest, Biome, Husky, Drizzle, Twilio already installed; `app/components/staff/` already populated from feature 006; `app/composables/useStaff*.ts` co-located tests are currently inert (to be re-enabled by feature 008).
