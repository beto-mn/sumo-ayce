# Research — Scaffold & Design System (Mercado Pop)

**Feature**: 007 | **Plan**: [plan.md](./plan.md) | **Date**: 2026-06-17

This document records the technical decisions that drive Phase 1 and onward. Each subsection follows the format **Decision / Rationale / Alternatives**.

---

## 1. Tailwind integration: v3 LTS via `@nuxtjs/tailwindcss`

**Decision**: Adopt Tailwind CSS v3.x through the `@nuxtjs/tailwindcss` module. Generate a `tailwind.config.ts` at the repo root that extends the theme with the Mercado Pop tokens.

**Rationale**:
- Tailwind v4 ships a Vite-only engine that, at the time of writing, has uneven coverage for the `@nuxtjs/tailwindcss` module on Nuxt 4. v3 is the LTS path with zero-config Nuxt integration.
- The module auto-generates the PostCSS pipeline, registers the dev playground (`/_tailwind`), and respects Nuxt's `content` globbing — saving us from re-implementing PostCSS configuration.
- Article X (KISS) prefers the path of least configuration. The module gets us Tailwind in one `nuxt.config.ts` line.

**Alternatives considered**:
- **Tailwind v4 + hand-rolled Vite plugin**: cutting-edge but immature with Nuxt 4 modules. Rejected on maturity grounds.
- **Hand-rolled PostCSS with `tailwindcss` directly**: rejected because the module replaces ~50 LOC of PostCSS wiring with a single import.
- **UnoCSS**: a viable alternative engine, but the team has not committed to it elsewhere and switching costs (docs, IDE support) outweigh the marginal benefit.

---

## 2. Token system: dual exposure via CSS variables + Tailwind theme

**Decision**: Define every Mercado Pop token in `app/assets/css/tokens.css` as a CSS custom property on `:root`, then mirror the same values inside `tailwind.config.ts` under `theme.extend`. Authors can use either utility classes (`bg-bg`, `text-ink`, `bg-accent`, `shadow-pop`) or raw CSS (`background: var(--bg)`).

**Rationale**:
- Tailwind utilities are best for layout; CSS variables are required for the per-scope accent swap (`.scope-express { --accent: var(--blue); }`) and for any decorative inline style that the team eventually writes.
- Mirroring (not duplicating) the values means there's a single source of truth (the CSS variables); the Tailwind theme reads from them via `var(--bg)` so changing a token in one place updates both pipelines.
- Article VII explicitly states the design context is the single source of truth — mirroring lets us keep that property while satisfying both consumption patterns.

**Alternatives considered**:
- **Tailwind theme only**: would force every inline style and Storybook decorator to import the theme via JS — clumsy and slow.
- **CSS variables only (no Tailwind theme)**: leaves authors writing `class="bg-[var(--bg)]"` everywhere — kills DX and breaks Tailwind's IntelliSense.

**Implementation note**: The Tailwind theme values are written as `'var(--bg)'`, `'var(--accent)'`, etc., so changing the variable propagates without rebuilding.

**Enforcement rationale**: the Tailwind palette is exposed by **overriding** `theme.colors` (not by `theme.extend.colors`). Overriding makes tokens-only a guarantee, not a hope: with the default palette generated, a typo like `bg-orange-500` or `bg-gray-300` would silently compile to the wrong (or off-brand) color and the drift would only surface at design review. With the override, those classes do not exist — the offending surface goes visually broken, surfacing the gap at the first paint. `transparent` and `currentColor` are kept because they are not colors in the brand sense. The grep gates in `tasks.md` Phase 8 (T108a/b/c) are the runtime backstop.

---

## 3. Accent-scope swap: single `.scope-express` class

**Decision**: Define one CSS class:

```css
.scope-express { --accent: var(--blue); }
```

Every component reads `--accent` (directly, or via a Tailwind utility like `bg-accent`). The Nav-level `accent` prop on `Card`/`Chip`/`Nav` simply adds/removes this class on the rendered wrapper.

**Rationale**:
- Honors Article VII's explicit rule: "Per-type accent (AYCE vs Express) MUST be implemented as an `--accent` swap on a scope/wrapper, NOT by duplicating rules."
- One class, one declaration in the entire codebase. Grep enforcement is trivial.

**Alternatives considered**:
- **Tailwind variants (`express:bg-blue`)**: requires a custom variant plugin and pollutes every utility class with `express:` prefixes. Heavier and harder to audit than a single CSS class.
- **Vue `provide/inject` of a theme object**: pulls accent state into JS, runs counter to the "wrapper" pattern, and complicates Storybook stories.

---

## 4. i18n: `@nuxtjs/i18n` v10 with `prefix_except_default`

**Decision**: Use `@nuxtjs/i18n` v10 (pinned `^10.4.0`) — v10 is the Nuxt 4 line; v9 targeted Nuxt 3. All config options used below (`prefix_except_default`, `vueI18n`, `langDir`, `detectBrowserLanguage`) remain valid across the v9→v10 jump. Config:

```ts
// i18n.config.ts (or nuxt.config.ts inline)
{
  locales: [
    { code: 'es', name: 'Español', file: 'es.json' },
    { code: 'en', name: 'English', file: 'en.json' },
  ],
  defaultLocale: 'es',
  strategy: 'prefix_except_default',
  langDir: 'locales/',
  detectBrowserLanguage: false, // keep ES default explicit
}
```

The Nav language button calls the composable's `setLocale('en' | 'es')` (returned by `useI18n()`) which switches the active locale and updates URLs in-place without a full reload. Focus is preserved by Vue's keyed re-render of i18n-aware nodes only.

**Rationale**:
- ES is the canonical experience (clients in Mexico City + restaurants are Spanish-first).
- EN at `/en/...` is discoverable and shareable for travelers; SEO-friendly.
- `detectBrowserLanguage: false` ensures the user lands on ES by default regardless of browser settings — only an explicit toggle (or visiting `/en/...`) flips to English. This matches the brand intent.

**Alternatives considered**:
- **`no_prefix` + cookie**: URLs never change, harder to share EN content, breaks SEO discoverability.
- **`prefix`** (both prefixed, `/es/...` and `/en/...`): forces a `/` → `/es/` redirect, adds a hop, and changes the canonical URL of every page indexed today.

**Status**: RESOLVED by human on 2026-06-17 — `prefix_except_default` confirmed. ES canonical at `/`, EN discoverable at `/en/...`. See spec.md "Clarifications — Resolved" §Q3.

---

## 5. Typography: Bricolage Grotesque + Hanken Grotesk via `@nuxt/fonts`

**Decision**: Use `@nuxt/fonts` (Nuxt's first-party fonts module) with:

```ts
// nuxt.config.ts
fonts: {
  families: [
    { name: 'Bricolage Grotesque', weights: [800], provider: 'google' },
    { name: 'Hanken Grotesk', weights: [400, 600, 700], provider: 'google' },
  ],
}
```

The module downloads the font files at build, serves them from the same origin, and tree-shakes unused weights. `tokens.css` exposes the families via `--disp` (Bricolage) and `--body` (Hanken); Tailwind exposes them via `font-disp` and `font-body`.

**Rationale**:
- Manually writing `@font-face`, preload links, and subsetting requires ~100 LOC of brittle CSS + Nitro asset handling. `@nuxt/fonts` is one line.
- Self-hosted fonts give predictable first paint without a third-party CDN handshake.
- Article X allows libraries that save >100 LOC; this clears the threshold.

**Alternatives considered**:
- **Google Fonts via `<link>` in `app.head`**: introduces a third-party request on every cold load; against the spirit of Lighthouse 90+ on slow connections.
- **`@nuxtjs/google-fonts`**: a community module that overlaps with the official `@nuxt/fonts`. Rejected on first-party-preferred grounds.
- **Hand-rolled `@font-face`**: rejected on the 100-LOC threshold.

**Status**: RESOLVED by human on 2026-06-17 — Bricolage Grotesque + Hanken Grotesk confirmed; the `families` array above is final. See spec.md "Clarifications — Resolved" §Q2.

---

## 6. `routeRules` and Vercel honoring

**Decision**: Place the exact seven-entry block from `docs/business/rendering-strategy.md` §2 into `nuxt.config.ts`:

```ts
routeRules: {
  '/':             { isr: 3600 },
  '/menu':         { isr: 3600 },
  '/sucursales':   { isr: 3600 },
  '/promociones':  { isr: 60 },
  '/lealtad':      { ssr: true },
  '/staff/**':     { ssr: true },
  '/api/**':       { },
}
```

**Rationale**:
- This block is the canonical, reviewer-enforced contract. Deviation requires updating both this config AND the strategy doc in lockstep (per `rendering-strategy.md` §7).
- Vercel honors Nuxt's `isr` (Incremental Static Regeneration with the given TTL) and `ssr: true` (always render on request) flags natively when Nuxt is deployed via the Vercel adapter — confirmed in Nuxt docs and the existing Vercel deployment for this project.

**Alternatives considered**:
- **Per-page `definePageMeta`**: works but spreads rendering config across page files, making the policy harder to audit. Rejected.
- **Vercel `vercel.json`**: bypasses Nuxt's abstraction and breaks `nuxt generate`. Rejected.

---

## 7. Storybook 10 — sidebar category + autodocs

**Decision**:
1. Update `.storybook/main.ts` `stories` glob to include `app/components/ui/**/*.stories.@(ts|tsx)`.
2. In `.storybook/preview.ts`, `import '~/assets/css/tokens.css'` and `import '~/assets/css/base.css'` so every story renders with the Mercado Pop look.
3. Each story file uses `title: 'UI/Button'` (etc.) to group every base component under a single "UI" sidebar category.
4. Each story exports `tags: ['autodocs']` so Storybook generates auto-doc pages from the `defineProps<>()` types.

**Rationale**:
- Storybook 10's autodocs `tag` mode generates props tables from TypeScript types automatically — zero hand-written docs.
- Grouping under "UI" makes the design system one-click discoverable.

**Alternatives considered**:
- **Hand-written `.mdx` docs per component**: high maintenance, drifts from props. Rejected.

---

## 8. `prefers-reduced-motion` — Decision: CSS-only

**Decision**: No JS composable. The only continuous animation in this feature is `Marquee`, which pauses via a CSS `@media (prefers-reduced-motion: reduce) { animation: none }` rule in its `<style scoped>` block. Micro-hover transitions on Button (hover-lift), Card (hover-bounce), and Sticker (rotation) are <300ms and remain ungated.

**Status**: The composable `usePrefersReducedMotion` was considered and REJECTED on 2026-06-17 by the human — the project will not have enough animations to justify a stateful JS solution.

**Rationale**:
- The only continuous animation that warrants the WCAG 2.3.3 gate is `Marquee` (loops indefinitely). It pauses via `@media (prefers-reduced-motion: reduce) { animation: none }` in the component's scoped CSS — zero JS state, zero runtime cost.
- Micro-hover transitions (Button, Card, Sticker) are <300ms. WCAG 2.3.3 (Animation from Interactions) targets animations that run >5s or repeat indefinitely; sub-300ms hover transitions are explicitly outside that gate.
- Eliminating the composable removes a layer of indirection, one file, and one Vue lifecycle binding from the foundational layer.

**Alternatives considered**:
- **Keep the composable** (`usePrefersReducedMotion` watching `matchMedia`): REJECTED — overkill for a single continuous animation that CSS alone can pause natively, and inconsistent with KISS (Article X).
- **Drop Marquee entirely**: REJECTED — Marquee is part of the Mercado Pop visual signature and stays. Only the reduced-motion mechanism changed (composable → CSS media query).
- **`@vueuse/core`'s `usePreferredReducedMotion`**: REJECTED — adding a dependency for a CSS-native concern is unjustified.

---

## 9. Class-merging without `clsx` or `tailwind-merge`

**Decision**: Provide `app/utils/cx.ts` (≤30 LOC):

```ts
// Joins an array of (string | false | null | undefined) tokens, dropping falsy ones.
export function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ')
}
```

**Rationale**:
- Trivial helper; covers 99% of conditional-class needs in templates.
- `tailwind-merge`-style "last-wins" deduping is unnecessary for our parameterized components because each variant fully owns its class set (no overlapping utilities).
- Stays within Article X's threshold.

**Alternatives considered**:
- **`clsx`**: 200 LOC for a feature we use in one spot. Rejected.
- **`class-variance-authority`**: heavyweight abstraction for variant styling; against KISS. Reject.

---

## 10. Mobile-first breakpoint alignment with Tailwind

**Decision**: Configure Tailwind's `screens` to:

```ts
screens: {
  sm: '520px',  // small mobile collapse threshold (footer / gallery)
  md: '880px',  // nav-burger collapse + grid 2→1 threshold
  lg: '1200px', // container max-width
}
```

**Rationale**:
- Matches `docs/business/overview.md` §9 exactly (520px, 880px).
- Overriding Tailwind's defaults keeps utility names short (`md:flex` instead of inventing `at-880:flex`).

**Alternatives considered**:
- **Keep Tailwind defaults (640/768/1024)**: would force every component author to remember the design context overrides separately. Rejected.

---

## 11. Vitest deferral to feature 008

**Decision**: This feature ships zero Vitest specs under `app/**`. Feature 008 will:
1. Update `vitest.config.ts` to include `app/**/*.test.ts` and `app/**/*.spec.ts`.
2. Wire `happy-dom` + `@vue/test-utils` via `environmentMatchGlobs`.
3. Re-enable the existing `app/composables/useStaff*.test.ts` files.
4. Backfill at least one Vitest spec per base component delivered here.

**Rationale**:
- Writing tests that the current `vitest.config.ts` silently ignores would be worse than no tests (false confidence).
- The backlog (`feature_list.json` id=8) is explicit about the sequencing.

**Alternatives considered**:
- **Fix Vitest config AND ship specs in this feature**: would expand scope into feature 008's spec and double the surface this PR has to defend.

---

## 12. Pre-decisions — RESOLVED (carried from spec.md)

All three pre-decisions were confirmed by the human on 2026-06-17. They are now binding inputs to the plan and tasks:

- **Q1 (brand colors) — RESOLVED**: prototype values. `--orange = #FF6B2B`, `--blue = #2E7CF6`. Encoded in `tokens.css` (T005) and `tailwind.config.ts` (T004).
- **Q2 (typography) — RESOLVED**: Bricolage Grotesque (800) + Hanken Grotesk via `@nuxt/fonts`. Encoded in `nuxt.config.ts` (T003).
- **Q3 (i18n routing) — RESOLVED**: `strategy: 'prefix_except_default'`. Encoded in `nuxt.config.ts` (T009).

---

## 13. Brand-color rationale: prototype values + Express as a peer token

**Decision**: Adopt the prototype hex values verbatim — `--orange = #FF6B2B`, `--blue = #2E7CF6` — and expose them as **peer brand tokens** in the design surface, not as "primary" vs "secondary".

**Rationale (from the human, verbatim)**: "en el prototipo, en la página de Menú cuando se selecciona Express salen los azules; en /sucursales las sucursales SUMO Express también salen en azul. Usa exactamente los colores del prototipo porque el azul se ocupa."

Concretely:

- The blue is **a semantic location-type token** (Express line) — it appears in `/menu` when the Express tab is selected and in `/sucursales` for SUMO Express branches. It is not a one-off decorative accent.
- The orange and blue MUST be exposed as peers in tokens (`--orange` / `--blue`) and in any namespaced brand surface (`brand.ayce` / `brand.express`). Any naming that subordinates Express to orange ("secondary", "alt", "accent-2") is rejected.
- Per-type styling is still implemented via the single `.scope-express` class that swaps `--accent` from `--orange` to `--blue` (see §3). Components NEVER hard-code `var(--blue)` in their accent path — they always read through `--accent`. The peer-token rule applies to the token *names and exposure surface*, not to the per-component code path.
- Downstream features 010 (Menu — Express tab) and 012 (Branches — SUMO Express markers) will toggle this scope based on their own state (selected tab, branch type).

**Alternatives considered**:

- **Brand-manual values (`#F37021`, `#2B3990`)**: rejected by the human because the prototype's higher-saturation values are the ones already in use across the design context, and the blue carries real semantic weight that the duller `#2B3990` would muddle on cream.
- **Hybrid (brand-manual for primary, prototype for decorative)**: rejected — would require documenting two color systems and re-mapping per surface.

---

## 14. Verified library versions (2026-06-17)

**Decision**: Pin the four new libraries (plus Tailwind's transitive engine) at the exact ranges below, confirmed against the npm registry on 2026-06-17. Full per-package notes (release dates, peer-dependency matrix, license check) live in [research-versions.md](./research-versions.md); this section is the canonical pin table for spec/plan/tasks cross-reference.

| Library | Pin | Notes |
|---|---|---|
| `@nuxtjs/tailwindcss` | `^6.14.0` | Adds Tailwind v3 LTS via the Nuxt module. v4 module support is still beta on Nuxt 4 — stay on v3. |
| `tailwindcss` | `^3.4.19` | Transitively pulled by the module; pinned explicitly so we don't drift onto v4 by accident. |
| `@nuxtjs/i18n` | `^10.4.0` | v10 is the Nuxt 4 line (v9 targeted Nuxt 3). All `prefix_except_default` / `vueI18n` config options used in §4 remain valid. |
| `mapbox-gl` | `^3.25.0` | Maps engine. Mapbox proprietary TOS accepted by the human; billing/account assumed for feature 012. We are using `mapbox-gl ^3.25.0`, **not** `maplibre-gl` — license decision documented and closed. |
| `@nuxt/fonts` | `^0.14.0` | Bricolage Grotesque 800 + Hanken Grotesk 400/600/700 confirmed available via the `'google'` provider (§5). |

**Cross-references**:
- `vue-router ^5.0.7` (existing) is correct and required by Nuxt 4 + `@nuxtjs/i18n@10` (peer-requires `vue-router ^5.0.4`). **Not changed by this feature.**
- These pins are mirrored in `plan.md` Technical Context, in `tasks.md` T001/T033, and in `quickstart.md` §1.
- Mapbox license note above is the canonical answer to any "should we use maplibre-gl?" question for this feature.

---

## 15. Token format: RGB channels for opacity modifier support (2026-06-17 migration)

**Decision**: Color tokens in `app/assets/css/tokens.css` are declared as space-separated RGB channels (e.g. `--orange: 255 107 43`) — not as hex literals — and consumed in `tailwind.config.ts` via `rgb(var(--token) / <alpha-value>)`. Non-color tokens (radii, shadows, fonts, max-width, type scale, breakpoints) stay as plain CSS values; the shadow tokens that reference `--ink` are updated to wrap it in `rgb(...)` because `--ink` is now channels.

**Rationale**:
- Per the official Tailwind v3 docs ([Using CSS variables](https://v3.tailwindcss.com/docs/customizing-colors#using-css-variables)), opacity-modifier utilities (`bg-orange/50`, `bg-ink/40`, `hover:bg-accent/90`, disabled states, skeleton/overlay loaders) only compile correctly when theme colors are expressed as `rgb(var(--token) / <alpha-value>)`. The `<alpha-value>` placeholder is Tailwind's canonical syntax — it is replaced at compile time with the modifier value (defaulting to `1`). With the prior `var(--token)` form, any modifier silently fell back to opaque.
- The opacity-modifier ecosystem is a hard requirement for downstream features 010, 011, 013, 014 (modal overlays, disabled states, hover overlays, skeleton loaders).
- shadcn/ui and most production Tailwind v3 design systems use this exact pattern; it is the de-facto industry default.

**Trade-off (documented)**: raw CSS consumers of a color token (`background: var(--bg)`) MUST wrap the call in `rgb(...)`: `background: rgb(var(--bg))`. The bare value `255 247 236` is not a valid CSS color on its own. This trade-off is acceptable because:
- Tailwind utility classes (the dominant consumption pattern across the codebase) are unaffected — authors keep writing `bg-bg`, `text-ink`, `bg-accent`.
- Direct `var(--token)` usage in raw CSS is rare (Marquee/animation-only escape hatches) and is now documented in `tokens.css` itself.
- The dual-surface contract from §2 is preserved: Tailwind utilities and raw CSS still reach the same source of truth; the raw-CSS side just needs the `rgb(...)` wrapper.

**Alternatives considered**:
- **HSL channels (`30 100% 60%`)**: equivalent to RGB for opacity support but harder to verify against the prototype hex source. Rejected on auditability grounds.
- **Keep hex + drop opacity modifiers**: rejected — opacity modifiers are a hard requirement for the downstream feature roadmap.
- **Inline `rgba()` in the Tailwind theme**: would force literal alpha values and break the dynamic modifier substitution entirely. Rejected.

**Status**: Migration applied 2026-06-17. All twelve color tokens flipped; both shadow tokens wrap `--ink` in `rgb()`; `base.css` body rule and the Tokens parity story updated; Tailwind theme uses the `<alpha-value>` form. Verification commands listed in the task body; harness stays green.
