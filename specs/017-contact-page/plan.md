# Implementation Plan: Contact Page (`/contact`)

**Feature ID**: 017
**Branch**: `feat/017-contact-page` | **Date**: 2026-06-22 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `specs/017-contact-page/spec.md`

---

## Summary

Build the public contact page at `/contact` as a fully static pre-rendered Nuxt 4 page
(`prerender: true`). The HTML shell has no server-side fetch dependency (no WordPress, no
Neon). The only dynamic piece is the branch dropdown, which is populated client-side
(after the shell is served) by calling the existing `GET /api/v1/branches` endpoint with
`server: false`.

On a valid form submission the browser opens a `wa.me` deep-link to the selected branch's
WhatsApp number with the visitor's name and message pre-encoded — no backend call is made,
no data is stored. The right card shows the selected branch's WhatsApp number dynamically
(updates as the visitor picks a branch), a pre-filled `mailto:` link for
`contacto@sumo.com.mx`, and social links sourced from i18n config.

The feature has two workstreams:

1. **Feature slice** — `app/features/contact/` with `ContactForm.vue`,
   `ContactInfo.vue`, `useContact.ts` composable, and co-located tests + stories.

2. **Page** — `app/pages/contact.vue` as a thin orchestrator (≤ 100 lines template)
   wiring `useFetch(server:false)` + `<ContactForm>` + `<ContactInfo>`. The page also
   owns the `selectedBranch` ref that is passed as a prop to `ContactInfo` and emitted
   from `ContactForm`, so both components share the same selected-branch state.

---

## Technical Context

| Item | Value |
|---|---|
| Language | TypeScript strict, no `any`, Composition API only |
| Nuxt | 4 |
| Key deps | `@nuxtjs/i18n`, `@nuxtjs/tailwindcss` (already present) |
| Rendering | `prerender: true` — static HTML served from CDN; MUST be added to `nuxt.config.ts` |
| Content source | None — shell is fully static. Branch list via `GET /api/v1/branches` (existing route) |
| Branch fetch | Client-side only (`server: false`); triggered on mount, not at prerender time |
| Shared types | `BranchPublicRow` from `types/branches.ts` (existing); feature-local `ContactBranch`, `ContactFormState` in `app/features/contact/types.ts` |
| Shared component | None required from other features; `UiPageHeader`, `UiButton`, `UiCard`, `UiInput`, `UiSelect`, `UiTextarea` from design system |
| Test stack | Vitest + happy-dom (`app/`) |
| Storybook | `@storybook/vue3-vite` — story required per component |
| Performance | Lighthouse 90+; shell served statically (no SSR cost); branch list renders within 2s on 4G |
| wa.me integration | Client-only; `encodeURIComponent` for query param; phone used verbatim from API response |

---

## Phase -1: Constitution Check

*GATE: All gates must be satisfied before implementation begins. A violation blocks merge.*

### Gate I — Code Organization & Reusability (NON-NEGOTIABLE)
- [x] **G-I.1** The feature is a vertical slice under `app/features/contact/` (components +
      composable + `types.ts`). It MUST NOT spread into other feature folders.
- [x] **G-I.2** No cross-feature import. Design system primitives (`UiCard`, `UiButton`,
      `UiInput`, `UiSelect`, `UiTextarea`, `UiPageHeader`) are in `app/components/ui/` — imported
      from there, not from any feature folder.
- [x] **G-I.3** No shared parsing logic is needed server-side — this feature introduces no new
      server routes. The existing `GET /api/v1/branches` is consumed as-is.
- [x] **G-I.4** `ContactForm` and `ContactInfo` are independently parameterized via props/emits.
      No duplicate component files for variants.
- [x] **G-I.5** `app/pages/contact.vue` template ≤ 100 lines.
- [x] **G-I.6** Every new component has a co-located `.stories.ts`.

### Gate II — TypeScript & Framework Standards
- [x] **G-II.1** Strict TS, no `any`. Composition API only (`<script setup lang="ts">`).
- [x] **G-II.2** `BranchPublicRow` is already exported from `types/branches.ts`. No new
      shared types are required. Feature-local state types (`ContactBranch`, `ContactFormState`,
      `WaLinkConfig`) live in `app/features/contact/types.ts`.

### Gate III — Architecture
- [x] **G-III.1** Branch data reaches `app/` only via `GET /api/v1/branches`. No
      Drizzle/Neon import under `app/`.
- [x] **G-III.2** The branch fetch uses `useFetch('/api/v1/branches', { server: false })`
      (or equivalent `useAsyncData` with `server: false`) so it fires client-side only and
      does not execute during prerender.
- [x] **G-III.3** The page shell (both cards' structural HTML) is included in the static
      prerender output. Only the branch options are missing until the client fetch resolves.
- [x] **G-III.4** No existing routes or server files are modified. This feature is additive only.

### Gate IV — Testing
- [x] **G-IV.1** `ContactForm.spec.ts`: dropdown shows only branches with non-null phone;
      CTA disabled until all three fields filled; correct wa.me URL constructed on submit
      (name + message, no user phone); loading state renders; error state renders;
      empty-branch-list state renders.
- [x] **G-IV.2** `ContactInfo.spec.ts`: WhatsApp section shows prompt when no branch prop
      provided; WhatsApp pill appears with correct `wa.me` URL when a branch is passed;
      email renders as `mailto:contacto@sumo.com.mx` with reactive subject/body; three
      social pills render with their configured hardcoded URLs.
- [x] **G-IV.3** `useContact.spec.ts`: form state is initialized correctly; `buildWaUrl`
      produces a correctly encoded URL; `isFormValid` computed returns false when any field
      is empty.
- [x] **G-IV.4** No test depends on another's state.

### Gate V — Performance (rendering strategy)
- [x] **G-V.1** `routeRules['/contact'] = { prerender: true }` MUST be added to
      `nuxt.config.ts`. `docs/business/rendering-strategy.md` §4 table MUST be updated.
- [x] **G-V.2** No Drizzle/Neon import under `app/` (zero grep match).
- [x] **G-V.3** Branch list is fetched client-side after the static shell is served.
      No per-visitor server cost.

### Gate VI — Security
- [x] **G-VI.1** No data is stored anywhere. The wa.me link is built entirely in the browser
      with user-supplied input. No XSS risk beyond standard Vue template escaping (which applies
      automatically).
- [x] **G-VI.2** The branch API error path exposes no stack trace or internal detail — the
      component renders a friendly message and hides the dropdown.

### Gate VII — UX Consistency & Component Documentation
- [x] **G-VII.1** Visual specifics follow `docs/business/overview.md` (tokens, type scale,
      component anatomy). No inline hex; Tailwind tokens only (CSS variables from design context).
- [x] **G-VII.2** Form inputs, select, textarea, and button use existing design system
      primitives (`UiInput`, `UiSelect`, `UiTextarea`, `UiButton`) — no inline reimplementation.
- [x] **G-VII.3** Mobile-first layout. On viewports < 880px: cards stack vertically. On
      viewports ≥ 880px: side-by-side two-column layout. Hit targets ≥ 44px for all
      interactive elements (FR-022).
- [x] **G-VII.4** Every new component ships Default + significant-variant + responsive
      Storybook stories.

### Gate VIII — Clean Code Discipline
- [x] **G-VIII.1** Functions ≤ 30 lines; component files ≤ 200 lines; no dead code, no bare
      `console.log`.
- [x] **G-VIII.2** Composable: `use` prefix (`useContact`). Vue files: PascalCase
      (`ContactForm.vue`, `ContactInfo.vue`). No new server routes introduced.

### Gate IX — Quality Gates
- [x] **G-IX.1** Biome lint + format pass; `vue-tsc --noEmit` passes; Conventional Commits;
      pre-push tests pass. No `--no-verify`.

### Gate X — KISS
- [x] **G-X.1** No new libraries. The wa.me URL is built with `encodeURIComponent` (built-in).
      The branch list is a native `<select>` (≤ 29 options — no need for a custom combobox).
      `useFetch` with `server: false` is the idiomatic Nuxt pattern for client-only fetches.
- [x] **G-X.2** No client-side state beyond the three form fields + selected branch ref +
      fetch status. No Pinia store, no global reactive state. The selected-branch ref lives
      in `contact.vue` and is passed down as a prop — no store needed.

### Gate XI — Absolute Imports
- [x] **G-XI.1** All imports use aliases (`@/components`, `@/composables`, `@/features`,
      `@/types`); no `../` except same-directory.

### Gate XII — Error Handling
- [x] **G-XII.1** Branch fetch error is caught in `ContactForm` (via the `error` ref returned
      by `useFetch`). The component renders a user-friendly message in place of the dropdown.
      No stack trace is exposed to the visitor.
- [x] **G-XII.2** An empty branch list (all branches have `phone === null`) is treated as a
      distinct state with its own message ("No hay sucursales disponibles en este momento").

### Gate XIII — Environment Validation
- [x] **G-XIII.1** No new env vars are introduced. Global WhatsApp number, email, and social
      URLs are stored in i18n locale files (or `runtimeConfig.public`) — not in `.env`.

---

## Project Structure

### Documentation (this feature)

```text
specs/017-contact-page/
├── spec.md            # Feature specification
├── plan.md            # This file
├── research.md        # Phase 0 findings
├── data-model.md      # Phase 1 entity definitions
├── contracts/         # Phase 1 API contracts
│   └── contact-form.md
├── quickstart.md      # Phase 1 dev quickstart
└── tasks.md           # Phase 2 atomic tasks
```

### Source Code

```text
app/
├── pages/
│   └── contact.vue                          # Route page — thin orchestrator (≤100 lines)
│
└── features/
    └── contact/
        ├── components/
        │   ├── ContactForm.vue              # Left card — form + wa.me link construction
        │   ├── ContactForm.spec.ts
        │   ├── ContactForm.stories.ts
        │   ├── ContactInfo.vue              # Right card — static global contact info
        │   ├── ContactInfo.spec.ts
        │   └── ContactInfo.stories.ts
        ├── composables/
        │   ├── useContact.ts                # Form state, validation, wa.me URL builder
        │   └── useContact.spec.ts
        └── types.ts                         # ContactBranch, ContactFormState, WaLinkConfig

i18n/locales/
├── es.json                                  # + contact.* keys
└── en.json                                  # + contact.* keys

nuxt.config.ts                               # + routeRules['/contact'] = { prerender: true }
docs/business/rendering-strategy.md         # + /contact row in §4 table
```

---

## Phase 0: Research Findings

### Decision 1 — Fetch strategy for branch list
**Decision**: `useFetch('/api/v1/branches', { server: false })` inside `ContactForm.vue`
(not in the page). This keeps the component self-contained and the page file thin.

**Rationale**: `server: false` prevents the fetch from running at prerender time (which
would require a live Neon DB connection at build). The static HTML shell is served
immediately; the branch list fills in after hydration. This is the documented pattern in
`docs/business/rendering-strategy.md` §3.2.

**Alternatives considered**: `onMounted` + `$fetch` — equivalent behaviour but bypasses
Nuxt's built-in loading/error state management from `useFetch`.

### Decision 2 — wa.me URL construction location
**Decision**: Pure function `buildWaUrl(phone, text)` in `useContact.ts`. Called from
`ContactForm.vue` on valid submit. Opens the URL via `window.open(url, '_blank')`. The
`text` parameter contains name + message only (no user phone number).

**Rationale**: Keeps the composable unit-testable (no DOM dependency for the URL
construction itself). `window.open` is called in the component event handler where it
belongs. The composable exports the builder; the component owns the side effect.

**Alternatives considered**: Inline in template (`<a :href="...">`) — not usable for a
`<button>` CTA with disabled state; would also skip the single-fire guard.

### Decision 3 — Branch filtering and sorting
**Decision**: Filter (`phone !== null`) and sort (alphabetical, case-insensitive) are
applied client-side in `ContactForm.vue` (or `useContact.ts`) after the API response
arrives.

**Rationale**: The API returns all active branches. The contact page only needs branches
with a WhatsApp number. Applying this client-side keeps the existing API contract intact
and avoids adding a query parameter that only the contact page uses (KISS — Gate X).

### Decision 4 — Contact info source
**Decision**: Email (`contacto@sumo.com.mx`) and social URLs live in i18n locale files
under `contact.*` keys. The branch WhatsApp number is dynamic — it comes from the
`ContactBranch` selected in the form dropdown and is passed as a prop to `ContactInfo`.
There is no global SUMO WhatsApp number on the contact page.

**Rationale**: Already required for i18n support (FR-023/FR-024). Storing static values
in locale files is simpler than `runtimeConfig.public` and keeps all copy in one location.
The branch phone is runtime data and must flow from the API response, not from config.

---

## Phase 1: Design Artifacts

### Data Model

See `data-model.md` for full entity definitions. Summary:

- **`ContactBranch`** — client-side projection of `BranchPublicRow`; fields: `id`, `name`,
  `phone` (non-null string). Derived from API response by filtering `phone !== null`.
- **`ContactFormState`** — ephemeral reactive state: `name`, `branchId`, `message`. Never
  persisted.
- **`WaLinkConfig`** — i18n-sourced static values: `email`, `socialInstagram`,
  `socialFacebook`, `socialTiktok`. No global WhatsApp — the branch phone is dynamic.

### Interface Contract

See `contracts/contact-form.md`. The contact form has no server contract (no new
endpoint). The contract document covers:
- The wa.me URL shape expected by the browser
- The `GET /api/v1/branches` response subset used by the form (existing contract, read-only)
- i18n key contracts (`contact.*` namespace)

---

## Complexity Tracking

No constitutional violations. The client-side-only fetch pattern with `server: false` is
the documented and idiomatic approach for static pages that need live data
(`docs/business/rendering-strategy.md` §3.2). No new abstractions are introduced.

| Potential Violation | Assessment | Decision |
|---|---|---|
| Fetch inside a component (not in the page) | `useFetch` with `server: false` in `ContactForm.vue` to keep the fetch co-located with the UI it drives | Justified — the page stays thin (≤100 lines); the component owns its own data dependency |
| Client-side filter/sort of branch list | API returns all active branches; filter+sort applied in composable | Justified — avoids a query-param that only this page uses; list is ≤29 items (KISS) |
