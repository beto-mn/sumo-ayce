# Research: Contact Page (`/contact`) — Feature 017

**Date**: 2026-06-22
**Status**: Complete — no NEEDS CLARIFICATION remaining

---

## 1. Fetch strategy for branch list in a prerendered page

**Decision**: `useFetch('/api/v1/branches', { server: false })` inside `ContactForm.vue`.

**Rationale**: The page shell must be served statically from CDN. Any fetch that runs at
prerender time would require a live Neon DB connection during the Vercel build, coupling
the static asset generation to the database. `server: false` ensures the fetch fires only
after hydration in the visitor's browser. This is the documented Nuxt 4 pattern in
`docs/business/rendering-strategy.md` §3.2: "A statically-rendered page MAY call `/api/**`
endpoints from the client (via `useFetch` with `server: false`)."

**Alternatives considered**:
- `onMounted` + `$fetch`: equivalent runtime behaviour but loses Nuxt's built-in `pending`,
  `error`, and `data` reactive refs. Requires manual state management that `useFetch` gives
  for free.
- Server-side fetch at prerender: would require the Neon DB to be reachable during build and
  would embed a point-in-time snapshot of branches in the HTML — defeating the purpose of
  always-fresh branch data.

---

## 2. wa.me URL construction

**Decision**: Pure function `buildWaUrl(phone: string, text: string): string` in
`useContact.ts`. Called from `ContactForm.vue`'s submit handler. URL opened via
`window.open(url, '_blank')` in the component.

**wa.me URL format**:
```
https://wa.me/<phone>?text=<encodeURIComponent(message)>
```
Where `<phone>` is the `BranchPublicRow.phone` value verbatim (maps to
`whatsappReservaciones` in the DB — already stored in consistent format).

**Rationale**: Extracting the URL builder to the composable makes it unit-testable without
any DOM dependency. `window.open` is a side effect that belongs in the component, not in
the composable. This respects the separation of concerns and keeps the composable pure.

**Message template** (i18n key `contact.waMessage`):
```
Hola, soy {name}. Mi WhatsApp es {whatsapp}. {message}
```
Both Spanish and English versions defined in locale files.

---

## 3. Branch filtering and sorting

**Decision**: Client-side in `useContact.ts` as a computed property.

Filter: `branches.filter(b => b.phone !== null)` applied after API response arrives.
Sort: `localeCompare` alphabetical, case-insensitive.

**Rationale**: The existing `GET /api/v1/branches` returns all active branches sorted by
name (already `orderBy asc(branches.name)` in the server route). A secondary client-side
sort is technically redundant but harmless as a defensive measure. Filtering is necessarily
client-side since the API has no `hasPhone` query param (and adding one for a single
consumer would violate KISS — Gate X).

---

## 4. Static contact info storage

**Decision**: i18n locale files (`i18n/locales/es.json` and `i18n/locales/en.json`) under
the `contact.*` namespace.

Keys:
```json
{
  "contact": {
    "globalWhatsapp": "5215512345678",
    "email": "hola@sumo.com.mx",
    "socialInstagram": "https://instagram.com/sumoayce",
    "socialFacebook": "https://facebook.com/sumoayce",
    "socialTiktok": "https://tiktok.com/@sumoayce"
  }
}
```

**Rationale**: Storing these in i18n locale files is the simplest approach. They are
already needed for bilingual support. Putting them in `runtimeConfig.public` would be
appropriate if they varied by environment — they do not. A developer edits the locale file
and redeploys (the page is pre-rendered; a redeploy or on-demand revalidation is needed
for changes to appear).

---

## 5. Form validation strategy

**Decision**: Reactive form validation via a `computed` property in `useContact.ts`.
The CTA button is `disabled` when `isFormValid` returns false.

```ts
const isFormValid = computed(() =>
  state.name.trim() !== '' &&
  state.whatsapp.trim() !== '' &&
  state.branchId !== '' &&
  state.message.trim() !== ''
)
```

HTML5 `required` attributes are also set on all inputs as a progressive enhancement.

**Rationale**: KISS — a single computed property is sufficient for four required fields
with no complex rules (no phone format validation required by spec). The spec explicitly
states that the button is disabled until all four fields are filled (FR-011), not that
field-level error messages must be shown on blur. The simpler approach is chosen.

---

## 6. Rendering strategy update required

`routeRules['/contact'] = { prerender: true }` must be added to `nuxt.config.ts`.

`docs/business/rendering-strategy.md` §4 table must gain:
```
| 017 Contact page | `/contact` | `prerender: true` | No CMS dependency. Shell is 100% static. Branch list fetched client-side. |
```

The §2 table must also be updated with the `/contact` route entry.
