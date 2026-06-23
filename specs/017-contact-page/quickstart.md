# Quickstart: Contact Page (`/contact`) — Feature 017

**Date**: 2026-06-22
**Branch**: `feat/017-contact-page`

---

## Prerequisites

- Node 20+, pnpm installed
- `.env.local` with `DATABASE_URL` (Neon), `TWILIO_*`, `GOOGLE_DRIVE_*`,
  `WORDPRESS_API_URL`, `MAPBOX_TOKEN` (see `.env.example`)
- Branch checked out: `git checkout feat/017-contact-page`

---

## Dev server

```bash
pnpm dev
```

Navigate to `http://localhost:3000/contact`.

The page shell renders immediately (static). The branch dropdown populates after the
client-side fetch to `/api/v1/branches` completes (requires the Neon DB to be reachable).

---

## Test the wa.me flow locally

1. Open `http://localhost:3000/contact`
2. Fill all four fields (any values)
3. Select a branch from the dropdown
4. Click "Iniciar chat por WhatsApp"
5. A new tab opens to `https://wa.me/<phone>?text=...`

To test the **error state**, open DevTools → Network → block `GET /api/v1/branches`.
Reload the page. The dropdown should be hidden and an error message shown.

To test the **empty state**, temporarily uncomment the filter override in `useContact.ts`
(see dev note in that file) that forces all branches to have `phone: null`.

---

## Run tests

```bash
# All tests
pnpm test

# Watch mode (contact feature only)
pnpm test app/features/contact
```

---

## Run Storybook

```bash
pnpm storybook
```

Navigate to the `Contact` section. Stories available:
- `ContactForm` — Default, Loading, Error, EmptyBranches, AllFieldsFilled
- `ContactInfo` — Default

---

## Verify prerender

```bash
pnpm build
```

Check `.output/public/contact/index.html` exists and contains the full page shell
(both cards' structural HTML) without any `<script>` that fetches branches at build time.

---

## Key files

| File | Purpose |
|---|---|
| `app/pages/contact.vue` | Route page — thin orchestrator |
| `app/features/contact/components/ContactForm.vue` | Left card: form + wa.me link |
| `app/features/contact/components/ContactInfo.vue` | Right card: static contact info |
| `app/features/contact/composables/useContact.ts` | Form state, validation, URL builder |
| `app/features/contact/types.ts` | `ContactBranch`, `ContactFormState`, `WaLinkConfig` |
| `i18n/locales/es.json` | Spanish copy (`contact.*` keys) |
| `i18n/locales/en.json` | English copy (`contact.*` keys) |
| `nuxt.config.ts` | `routeRules['/contact'] = { prerender: true }` |
| `docs/business/rendering-strategy.md` | §4 table updated with `/contact` row |
| `specs/017-contact-page/contracts/contact-form.md` | Client-side interface contract |
