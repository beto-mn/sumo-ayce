# Quickstart — Scaffold & Design System (Mercado Pop)

**Feature**: 007 | **Plan**: [plan.md](./plan.md) | **Date**: 2026-06-17

How to work with the shared frontend chassis after this feature lands.

---

## 1. First-time setup on a new clone or branch checkout

```bash
git checkout feat/007-scaffold-and-design-system
# Verified pinned ranges (npm registry, 2026-06-17 — see research.md §14):
pnpm add -D @nuxtjs/tailwindcss@^6.14.0 tailwindcss@^3.4.19 @nuxtjs/i18n@^10.4.0 @nuxt/fonts@^0.14.0
pnpm add mapbox-gl@^3.25.0
pnpm install                 # locks the additions and refreshes existing deps
pnpm dev                     # boots the Nuxt dev server (http://localhost:3000)
```

> On a fresh clone where the four pins are already present in `package.json`, you only need `pnpm install` (or `pnpm install --frozen-lockfile`). The two `pnpm add` lines above are for the implementer who introduces the deps for the first time.

Expectations:
- `pnpm install` finishes in under 60 seconds with no missing-peer-dependency warnings that block startup.
- `pnpm dev` boots without missing-module errors.
- Visiting `/` shows the cream `--bg` background, Bricolage display font, and the Nav with the SUMO logo and language button.

---

## 2. Storybook (visual review surface)

```bash
pnpm storybook               # starts Storybook on http://localhost:6006
pnpm storybook:build         # produces a static build under storybook-static/
```

The sidebar must show a "UI" category with every base component:

```
UI/
├── Button
├── Card
├── Chip
├── Sticker
├── Kicker
├── Input
├── Select
├── Textarea
├── Nav
└── Marquee
```

Each component MUST have at minimum:
- A `Default` story.
- One story per significant prop variant (sizes for Button, accent for Card/Chip/Nav/Kicker, states for Input/Select/Textarea).
- A mobile viewport story (360px) and a desktop viewport story (1200px).

If a story fails to render or the browser console shows runtime errors, the component is NOT mergeable (Article VII enforcement).

---

## 3. How to write a new UI base component

When you need a primitive that crosses multiple features (Button, Card, Modal, etc.), it belongs under `app/components/ui/`. Follow these conventions:

1. **PascalCase filename**: `app/components/ui/Modal.vue`.
2. **`<script setup lang="ts">`** — Composition API only, no Options API.
3. **Props via `defineProps<>()`** with strict TypeScript types — no `any`:

   ```vue
   <script setup lang="ts">
   interface Props {
     open: boolean
     size?: 'sm' | 'md' | 'lg'
   }
   const props = withDefaults(defineProps<Props>(), { size: 'md' })
   </script>
   ```

4. **No DB imports** — never import from `drizzle-orm`, `@neondatabase/serverless`, or `server/**`. (Grep enforcement; Article V.)
5. **No cross-feature imports** — never reach into `app/components/staff/` or `app/features/*/`. If something needs to be shared, lift it into `app/components/ui/`, `app/composables/`, or `app/utils/`.
6. **Use design tokens** — never hard-code colors. Use `bg-bg`, `text-ink`, `bg-accent` (for per-type accent), `shadow-pop`, `rounded-pop`, etc. For non-Tailwind one-offs, use `var(--bg)`, `var(--accent)`, etc.
7. **Stay under the line limits** — component file < 200 lines, every function < 30 lines (Article VIII).
8. **Co-located Storybook story** — `Modal.stories.ts` next to `Modal.vue`. At minimum: Default + variants + mobile/desktop viewport.

   ```ts
   import type { Meta, StoryObj } from '@storybook/vue3-vite'
   import Modal from './Modal.vue'

   const meta = {
     title: 'UI/Modal',
     component: Modal,
     tags: ['autodocs'],
   } satisfies Meta<typeof Modal>

   export default meta
   type Story = StoryObj<typeof meta>

   export const Default: Story = { args: { open: true } }
   export const Small: Story  = { args: { open: true, size: 'sm' } }
   export const Mobile: Story = {
     args: { open: true },
     parameters: { viewport: { defaultViewport: 'mobile1' } },
   }
   ```

---

## 4. How to add a new route to `app/pages/`

Every public route MUST have a matching entry in `nuxt.config.ts > routeRules`. Follow the operational checklist in `docs/business/rendering-strategy.md` §7:

1. Decide the rendering mode: ISR 3600 (rare-change content), ISR 60 (frequently-edited content), SSR (per-user), or dynamic API (`/api/**`).
2. Add the entry to `nuxt.config.ts > routeRules`. Example:
   ```ts
   routeRules: {
     '/':             { isr: 3600 },
     '/menu':         { isr: 3600 },
     '/sucursales':   { isr: 3600 },
     '/promociones':  { isr: 60 },
     '/lealtad':      { ssr: true },
     '/staff/**':     { ssr: true },
     '/api/**':       { },
     // NEW: '/contacto': { isr: 3600 },
   }
   ```
3. If ISR: every WordPress fetch in the page MUST use `useFetch` / `useAsyncData` so Nitro caches it within the ISR window.
4. If SSR: ensure per-user data uses fresh request context (cookies, session); never cache across visitors.
5. If `/api/**`: ensure no caching headers; the route runs on every call.
6. **Update `docs/business/rendering-strategy.md` §4 table with the new route**. The doc is the single source of truth — keep it in lockstep.
7. Write a Storybook story for the page-level component (Article VII).

A reviewer will reject any PR that adds a route without the matching `routeRules` entry.

---

## 5. How to add a new i18n key

1. Open `i18n/locales/es.json` and add the key under the appropriate section (e.g., `nav.contacto`).
2. Open `i18n/locales/en.json` and add the same key with the English translation.
3. Consume the key in a component via the i18n composable:
   ```vue
   <script setup lang="ts">
   const { t } = useI18n()
   </script>

   <template>
     <span>{{ t('nav.contacto') }}</span>
   </template>
   ```
4. **Brand-copy locked values** — these MUST NOT change:
   - `brand.tagline` (es) = `"Estilo americano-japonés"` — never "Comida japonesa".
   - `brand.ayceBadge` (es) = `"All You Can Eat"` — never "Buffet".
5. **Missing-key fallback** — when a key is referenced but missing in the target locale, the rendered output is the key name itself (e.g., `nav.unknownKey`). This is intentional and makes gaps visible during dev; never paper over a missing key with a hard-coded string in the template.
6. **Toggling locale** in code:
   ```ts
   const { locale, setLocale } = useI18n()
   await setLocale(locale.value === 'es' ? 'en' : 'es')
   ```
   This switches without a full page reload, preserves focus, and updates URLs in place.

---

## 6. Token enforcement — why `bg-orange-500` will not work

This scaffold ships a tokens-only color contract. `tailwind.config.ts` **overrides** `theme.colors` (it does NOT extend), so Tailwind's default palette (`slate`, `gray`, `red`, `orange-500`, `blue-700`, every `*-50…*-950` step across every default hue) is **not generated** by the build. The only non-token color names that survive are `transparent` and `currentColor`.

What this means in practice:

- `class="bg-orange-500"` → does NOT exist. The element renders with no background.
- `class="bg-gray-300 text-red-700"` → both classes are missing. Both properties stay at their default.
- `class="bg-[#FF6B2B]"` → arbitrary-value syntax is also blocked (see T108b). Use a token.
- `style="background: #FF6B2B"` → inline hex outside `tokens.css` is blocked by T108c.

**Use tokens instead**:

- Tailwind utility classes backed by the override map: `bg-orange`, `bg-blue`, `bg-accent`, `text-ink`, `text-soft`, `border-ink`, `shadow-pop`, `shadow-pop-sm`, `rounded-pop`, `rounded-pop-sm`, `rounded-pop-full`, `max-w-pop`, `font-disp`, `font-body`, `text-h-xl`, `text-h-lg`, `text-body`, `text-kicker`.
- Raw CSS where utilities don't fit: `var(--bg)`, `var(--ink)`, `var(--accent)`, `var(--shadow)`, `var(--r)`, `var(--maxw)`, `var(--disp)`, etc.

**Adding a new color** (a new neutral, a status color, a decorative one-off) requires two edits, in this order:

1. Declare the variable in `app/assets/css/tokens.css` on `:root` (e.g., `--teal: #0FB5A3`).
2. Add the same name to the override map in `tailwind.config.ts > theme.colors` (e.g., `teal: 'var(--teal)'`).

Only then may a component reference `bg-teal` / `var(--teal)`. Pre-merge, the grep gates (T108a default-palette leak, T108b arbitrary values, T108c inline hex) will catch every shortcut. Treat them as compile-time errors: a single match means the PR is not mergeable.

---

## 7. How to use the Per-Type Accent (AYCE vs Express)

The Express line uses blue (`--blue = #2E7CF6`), the AYCE line uses orange (`--orange = #FF6B2B`). These are **peer brand tokens** — Express is a real semantic location-type color (it surfaces on `/menu` when the Express tab is selected and on `/sucursales` for SUMO Express branches), NOT a "secondary" of orange. Implement per-type styling by adding the `.scope-express` class on a wrapper (or by passing `accent="express"` to `Card`/`Chip`/`Nav`):

```vue
<template>
  <!-- AYCE region: uses --orange by default -->
  <UiCard>...</UiCard>

  <!-- Express region: --accent becomes --blue inside this wrapper only -->
  <div class="scope-express">
    <UiCard>...</UiCard>     <!-- Card's accent path renders blue here -->
    <UiButton>Reservar</UiButton>
  </div>
</template>
```

**Do not** hard-code `bg-blue` / `var(--blue)` inside any component's accent path. Always read through `--accent` (or its Tailwind utilities `bg-accent`/`text-accent`/`border-accent`). Express blue is exclusive to Express-scoped regions — never use it as a base color elsewhere.

---

## 8. Reduced-motion compliance

The only continuous animation in this feature is `Marquee`, which pauses via a CSS media query in its `<style scoped>` block:

```css
.marquee-track { animation: marquee 20s linear infinite; }
@media (prefers-reduced-motion: reduce) {
  .marquee-track { animation: none; }
}
```

If you add a new component with a continuous or long animation (>5s or repeating), gate it the same way. Micro-hover transitions <300ms don't need the gate (WCAG 2.3.3 targets animations that run >5s or repeat indefinitely).

---

## 9. Common commands

| Command            | Purpose                                                    |
|--------------------|------------------------------------------------------------|
| `pnpm install`     | Install dependencies (locks via pnpm-lock.yaml).           |
| `pnpm dev`         | Boot the Nuxt dev server.                                  |
| `pnpm storybook`   | Boot Storybook for visual component review.                |
| `pnpm storybook:build` | Build a static Storybook bundle.                       |
| `pnpm test`        | Run Vitest (server-side suites only until feature 008).    |
| `pnpm typecheck`   | Run `vue-tsc --noEmit`.                                    |
| `pnpm check`       | Run Biome lint + format check (Article IX gate).           |
| `pnpm check:fix`   | Auto-fix Biome lint + format issues.                       |
| `pnpm build`       | Production build (validates `routeRules` end-to-end).      |

---

## 10. What to do next (after this feature merges)

1. **Feature 008** — `frontend-test-setup`. Update `vitest.config.ts` to include `app/**`, wire `happy-dom` + `@vue/test-utils`, re-enable `useStaff*.test.ts`, backfill at least one Vitest spec per base component delivered here.
2. **Feature 009** — `Homepage`. First page that consumes the chassis end-to-end.
3. Pages 010–014 follow.

If you're starting feature 009+ and a primitive feels missing, lift it into `app/components/ui/` as a parameterized component with its story — never create a one-off variant file.
