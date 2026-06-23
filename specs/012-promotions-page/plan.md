# Implementation Plan: Promotions Page (`/promociones`)

**Feature ID**: 012
**Branch**: `feat/017-promotions-page`
**Date**: 2026-06-22
**Spec**: [spec.md](./spec.md)

---

## Summary

Build the public promotions page at `/promociones` as an ISR-cached Nuxt 4 page (60 s interval).
All active WordPress promotions are fetched at revalidation time via a new dedicated Nitro route
`GET /api/v1/content/promotions-page`. The page renders a responsive grid of `PromotionCard`
components (text-only). Clicking a card with a resolved flyer image opens the existing
`<UiLightbox>`.

The feature has three main workstreams:

1. **Server route** — `server/api/v1/content/promotions-page.get.ts`. Calls
   `?activa=1` (no home filter, no 3-cap). Reuses `parsePromotions` and image-resolution logic
   from `validators.ts`. Returns `PromotionsResult`. Does NOT modify the homepage route.

2. **Feature slice** — `app/features/promotions/` with `PromotionCard.vue`,
   `PromotionsGrid.vue`, `usePromotions.ts` composable, and co-located tests + stories.

3. **Page** — `app/pages/promociones.vue` as a thin orchestrator (≤ 100 lines template) wiring
   `useAsyncData` + `<PromotionsGrid>` + `<UiLightbox>`.

---

## Technical Context

| Item | Value |
|---|---|
| Language | TypeScript strict, no `any`, Composition API only |
| Nuxt | 4 |
| Key deps | `@nuxtjs/i18n`, `@nuxtjs/tailwindcss`, `zod` (already present) |
| Rendering | ISR 60 — already in `nuxt.config.ts`; MUST NOT be changed |
| Content source | WordPress `promociones` CPT via `GET /api/v1/content/promotions-page` |
| Shared types | `Promotion`, `PromotionsResult` from `types/content.ts` (feature 010, existing) |
| Shared route | `server/api/v1/content/validators.ts` — `parsePromotions`, `mapPromotion` (reuse) |
| Shared component | `app/components/ui/Lightbox.vue` (feature 010, existing — MUST NOT be modified) |
| Test stack | Vitest + happy-dom (`app/`), Vitest + node (`server/`) |
| Storybook | `@storybook/vue3-vite` — story required per component |
| Performance | Lighthouse 90+; content in ISR shell; no client-side WP fetch |

---

## Phase -1: Constitution Check

*GATE: All gates must be satisfied before implementation begins. A violation blocks merge.*

### Gate I — Code Organization & Reusability (NON-NEGOTIABLE)
- [x] **G-I.1** The feature is a vertical slice under `app/features/promotions/` (components +
      composable + `types.ts`). It MUST NOT spread into other feature folders.
- [x] **G-I.2** No cross-feature import. `<UiLightbox>` is in `app/components/ui/` (cross-feature
      primitive) — imported there, not from `app/features/homepage/`.
- [x] **G-I.3** Shared parsing logic (`parsePromotions`, `resolveImages`) lives in
      `server/api/v1/content/validators.ts`. If `resolveMediaUrl` is not yet exported, it is
      extracted to `server/api/v1/content/media.ts` — a cross-feature content utility.
- [x] **G-I.4** `PromotionCard` is parameterized via props for `tipo`, `color`, `imageUrl`,
      and localized strings. No duplicate card files.
- [x] **G-I.5** `app/pages/promociones.vue` template ≤ 100 lines.
- [x] **G-I.6** Every new component has a co-located `.stories.ts`.

### Gate II — TypeScript & Framework Standards
- [x] **G-II.1** Strict TS, no `any`. Composition API only.
- [x] **G-II.2** `Promotion` and `PromotionsResult` are already in `types/content.ts`.
      No new shared types are required for this feature. Feature-local state types live in
      `app/features/promotions/types.ts`.

### Gate III — Architecture
- [x] **G-III.1** Promotion data reaches `app/` only via `GET /api/v1/content/promotions-page`.
      No Drizzle/Neon import under `app/`.
- [x] **G-III.2** `useAsyncData` in `promociones.vue` fetches at ISR time (server-side).
      No client-side `$fetch` or `useFetch` is triggered by user interaction for the grid.
- [x] **G-III.3** WordPress is fetched once per ISR interval (not per visitor request).
      `useAsyncData` with a stable key ensures Nitro caches the result.
- [x] **G-III.4** The homepage route (`promotions.get.ts`) is NOT modified. The new route
      (`promotions-page.get.ts`) is a separate file.

### Gate IV — Testing
- [x] **G-IV.1** `server/api/v1/content/promotions-page.spec.ts`: successful response
      (all active promos returned), WordPress error returns `ok: false`, media resolution
      failure degrades to `imageUrl: null` for that card only.
- [x] **G-IV.2** `PromotionCard.spec.ts`: badge/title/desc/validity render in current locale;
      Express card uses blue accent class; non-Express uses `acf.color` token class; card with
      `imageUrl` is interactive (click opens lightbox); card with `imageUrl: null` is
      non-interactive; reduced-motion state.
- [x] **G-IV.3** `PromotionsGrid.spec.ts`: renders one `PromotionCard` per promotion;
      empty-state message when `promotions` is empty; `ok === false` triggers empty state.
- [x] **G-IV.4** No test depends on another's state.

### Gate V — Performance (rendering strategy)
- [x] **G-V.1** `routeRules['/promociones'] = { isr: 60 }` is already present — MUST NOT be
      modified.
- [x] **G-V.2** No Drizzle/Neon import under `app/` (zero grep match).
- [x] **G-V.3** WordPress is hit at most once per 60 s via `useAsyncData` (ISR revalidation),
      never on every visitor request.

### Gate VI — Security
- [x] **G-VI.1** The route returns HTTP 200 in all cases, never exposing internal stack traces
      or WordPress API details to the client.
- [x] **G-VI.2** `ExternalServiceError` is logged server-side via `handleError`; the client
      receives only `{ promotions: [], ok: false }`.

### Gate VII — UX Consistency & Component Documentation
- [x] **G-VII.1** Visual specifics follow `docs/business/overview.md` (tokens, type scale,
      component anatomy). No inline hex; Tailwind tokens only.
- [x] **G-VII.2** Express blue (`--blue`) is applied via `--accent` swap on the card wrapper,
      not by setting a hard blue class. Blue is Express-exclusive (Article VII).
- [x] **G-VII.3** Mobile-first; fully responsive at 520px (2 cols) and 880px (3 cols).
      Hit targets ≥ 44px.
- [x] **G-VII.4** Every new component ships Default + significant-variant + responsive
      Storybook stories.

### Gate VIII — Clean Code Discipline
- [x] **G-VIII.1** Functions ≤ 30 lines; component files ≤ 200 lines; no dead code, no bare
      `console.log`.
- [x] **G-VIII.2** Composable: `use` prefix. Vue files: PascalCase. Server route: kebab-case.

### Gate IX — Quality Gates
- [x] **G-IX.1** Biome lint + format pass; `vue-tsc --noEmit` passes; Conventional Commits;
      pre-push tests pass. No `--no-verify`.

### Gate X — KISS
- [x] **G-X.1** No new libraries. `parsePromotions` and `resolveImages` are reused from
      `validators.ts`. `<UiLightbox>` is reused from `app/components/ui/`. No new abstraction
      for a single concrete use case.
- [x] **G-X.2** No client-side fetching or reactive sort — the full list is delivered in the
      ISR shell. Client-side state is limited to the currently open lightbox image URL.

### Gate XI — Absolute Imports
- [x] **G-XI.1** All imports use aliases (`@/components`, `@/composables`, `@/features`,
      `@/types`); no `../` except same-directory.

### Gate XII — Error Handling
- [x] **G-XII.1** WordPress fetch error MUST be caught in the route and converted to an
      `ExternalServiceError` logged via `handleError`. The route returns `ok: false`, not a
      thrown exception.
- [x] **G-XII.2** Per-media fetch failures are caught individually (same pattern as
      `resolveMediaUrl` in the homepage route). No media failure may abort the list response.

### Gate XIII — Environment Validation
- [x] **G-XIII.1** `WORDPRESS_API_URL` is already validated at startup in
      `server/utils/env.ts`. No new env vars are introduced by this feature.

---

## Project Structure

### Documentation (this feature)

```text
specs/012-promotions-page/
├── spec.md            # This feature's specification
├── plan.md            # This file
└── tasks.md           # Atomic tasks
```

### Source Code

```text
app/
├── pages/
│   └── promociones.vue                             # Route page — thin orchestrator (≤100 lines)
│
└── features/
    └── promotions/
        ├── components/
        │   ├── PromotionCard.vue + .spec.ts + .stories.ts
        │   └── PromotionsGrid.vue + .spec.ts + .stories.ts
        ├── composables/
        │   └── usePromotions.ts + .spec.ts
        └── types.ts

server/
└── api/v1/content/
    ├── promotions-page.get.ts                      # NEW — dedicated promotions page route
    ├── promotions-page.spec.ts                     # NEW — route unit tests
    ├── validators.ts                               # EXISTING — reused (parsePromotions, etc.)
    └── media.ts                                    # NEW (if resolveMediaUrl not yet exported)
                                                    # — extract resolveMediaUrl here if needed

i18n/locales/
├── es.json                                         # + promotions.* keys
└── en.json                                         # + promotions.* keys
```

---

## Complexity Tracking

No constitutional violations. The separation of the promotions-page route from the homepage
route is required by the distinct query semantics (no cap, no home filter) — not over-engineering.
Reusing `parsePromotions` and `<UiLightbox>` keeps the implementation DRY. No new abstractions
are introduced.

| Potential Violation | Assessment | Decision |
|---|---|---|
| New server route vs. reusing homepage route | Homepage route has incompatible home-flag and 3-cap logic | Justified — different query semantics require a separate route |
| Possible extraction of `resolveMediaUrl` | Only if it is not already exported; a shared content utility is the correct DRY move per Article I | Justified if needed — concrete second use case exists (homepage already uses it) |
