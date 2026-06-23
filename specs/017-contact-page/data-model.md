# Data Model: Contact Page (`/contact`) — Feature 017

**Feature ID**: 017
**Date**: 2026-06-22

> All entities here are **client-side only**. No database schema changes.
> No Drizzle/Neon involvement. The server contract is the existing
> `GET /api/v1/branches` endpoint (read-only).

---

## Entities

### `ContactBranch`

A client-side projection of `BranchPublicRow` (from `types/branches.ts`) that
keeps only the fields the contact form needs.

```ts
// app/features/contact/types.ts
export interface ContactBranch {
  id: string      // branch UUID — used as <option> value in the select
  name: string    // displayed to the visitor in the dropdown
  phone: string   // wa.me path segment — verbatim from API response (non-null guaranteed)
}
```

**Derivation rule**: Filter `BranchPublicRow[]` where `phone !== null`, then project
`{ id, name, phone }`. Sort alphabetically by `name` (case-insensitive).

**Source**: `GET /api/v1/branches` response → `data.value.data` array.

---

### `ContactFormState`

Ephemeral reactive state owned by `useContact.ts`. Never persisted to any store
or server.

```ts
// app/features/contact/types.ts
export interface ContactFormState {
  name: string       // visitor's display name — pre-filled into wa.me message
  whatsapp: string   // visitor's own WhatsApp number — pre-filled into wa.me message
  branchId: string   // selected ContactBranch.id — resolves to phone on submit
  message: string    // freeform message body — included verbatim in wa.me text
}
```

**Initial value**: all fields empty string `''`.
**Reset policy**: fields are NOT reset after submit (FR-015 — visitor may send to another branch).

---

### `WaLinkConfig`

Static contact info for the right card. Sourced exclusively from i18n locale files.

```ts
// app/features/contact/types.ts
export interface WaLinkConfig {
  globalWhatsapp: string    // i18n key: contact.globalWhatsapp
  email: string             // i18n key: contact.email         — always hola@sumo.com.mx
  socialInstagram: string   // i18n key: contact.socialInstagram
  socialFacebook: string    // i18n key: contact.socialFacebook
  socialTiktok: string      // i18n key: contact.socialTiktok
}
```

**Read via**: `const { t } = useI18n()` in `ContactInfo.vue`.
No reactive updates needed — values do not change at runtime.

---

## State Transitions

### Branch fetch state (in `ContactForm.vue`)

```
IDLE
  │ (on mount — useFetch fires)
  ▼
LOADING          ← dropdown replaced by loading indicator
  │
  ├─ success + branches with phone > READY        ← dropdown populated
  ├─ success + no branches with phone  > EMPTY    ← empty-state message shown; CTA disabled
  └─ network/HTTP error                > ERROR    ← error message shown; CTA disabled
```

### Form validation state (in `useContact.ts`)

```
INVALID   ← any of the four fields is empty / no branch selected
  │ (visitor fills all fields)
  ▼
VALID     ← CTA button enabled
  │ (visitor clicks CTA)
  ▼
SUBMITTED ← window.open(waUrl, '_blank') fires; fields NOT reset
```

---

## i18n Key Contract

All keys under `contact.*` must exist in both `i18n/locales/es.json` and
`i18n/locales/en.json`.

| Key | Type | Used by | Example (ES) |
|---|---|---|---|
| `contact.seo.title` | string | `useSeoMeta` in `contact.vue` | `"Contacto | SUMO AYCE"` |
| `contact.seo.description` | string | `useSeoMeta` in `contact.vue` | `"Contáctanos por WhatsApp..."` |
| `contact.page.title` | string | `UiPageHeader` | `"Contacto"` |
| `contact.page.badge` | string | `UiPageHeader` badge | `"Escríbenos"` |
| `contact.form.title` | string | Form card heading | `"Envíanos un mensaje"` |
| `contact.form.name.label` | string | Input label | `"Tu nombre"` |
| `contact.form.name.placeholder` | string | Input placeholder | `"Nombre completo"` |
| `contact.form.whatsapp.label` | string | Input label | `"Tu WhatsApp"` |
| `contact.form.whatsapp.placeholder` | string | Input placeholder | `"+52 55 0000 0000"` |
| `contact.form.branch.label` | string | Select label | `"Elige sucursal"` |
| `contact.form.branch.placeholder` | string | Select default option | `"Selecciona una sucursal"` |
| `contact.form.message.label` | string | Textarea label | `"Tu mensaje"` |
| `contact.form.message.placeholder` | string | Textarea placeholder | `"¿En qué podemos ayudarte?"` |
| `contact.form.cta` | string | Submit button | `"Iniciar chat por WhatsApp"` |
| `contact.form.loading` | string | Loading state | `"Cargando sucursales..."` |
| `contact.form.error` | string | Error state | `"No pudimos cargar las sucursales. Por favor intenta de nuevo."` |
| `contact.form.empty` | string | Empty state | `"No hay sucursales disponibles en este momento."` |
| `contact.waMessage` | string | wa.me text template | `"Hola, soy {name}. Mi WhatsApp es {whatsapp}. {message}"` |
| `contact.info.title` | string | Right card heading | `"También puedes encontrarnos en"` |
| `contact.info.whatsappLabel` | string | WhatsApp pill label | `"WhatsApp Global"` |
| `contact.info.emailLabel` | string | Email link label | `"Correo"` |
| `contact.info.socialTitle` | string | Social section heading | `"Síguenos"` |
| `contact.globalWhatsapp` | string | `ContactInfo.vue` | `"5215512345678"` |
| `contact.email` | string | `ContactInfo.vue` | `"hola@sumo.com.mx"` |
| `contact.socialInstagram` | string | `ContactInfo.vue` | `"https://instagram.com/sumoayce"` |
| `contact.socialFacebook` | string | `ContactInfo.vue` | `"https://facebook.com/sumoayce"` |
| `contact.socialTiktok` | string | `ContactInfo.vue` | `"https://tiktok.com/@sumoayce"` |
