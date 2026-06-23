# Contract: Contact Form — Feature 017

**Date**: 2026-06-22
**Type**: Client-side interface contract (no new server endpoint)

---

## 1. Consumed API — `GET /api/v1/branches`

The contact form consumes the **existing** branches endpoint. No modifications to this
endpoint are permitted by this feature.

### Request

```
GET /api/v1/branches
```

No query parameters. No authentication.

### Response (success)

```ts
{
  data: BranchPublicRow[]   // array of active branches, sorted by name ASC
}
```

Where `BranchPublicRow` (from `types/branches.ts`) includes:

```ts
{
  id: string
  name: string
  address: string
  lat: string | null
  lng: string | null
  isActive: boolean
  type: 'ayce' | 'express'
  schedule: object | null
  phone: string | null    // maps to whatsappReservaciones — may be null
}
```

### Contact form usage contract

The contact form uses only these three fields:

| Field | Usage |
|---|---|
| `id` | `<option value>` in the branch select |
| `name` | `<option>` label displayed to the visitor |
| `phone` | wa.me path segment on submit (only branches where `phone !== null` appear) |

### Error handling

| Condition | UI behaviour |
|---|---|
| Network error / non-2xx | Dropdown hidden; error message shown; CTA disabled |
| Empty response (`data: []`) | Empty state message shown; CTA disabled |
| All branches have `phone: null` | Same as empty — "No hay sucursales disponibles" |

---

## 2. Produced link — `wa.me` deep-link

The contact form produces a `wa.me` URL opened in a new tab. This is NOT a server
endpoint — it is a browser navigation to the WhatsApp deep-link service.

### URL structure

```
https://wa.me/<phone>?text=<encodedText>
```

| Component | Value |
|---|---|
| `<phone>` | `ContactBranch.phone` verbatim (no transformation) |
| `<encodedText>` | `encodeURIComponent(buildMessageText(state, t))` |

### Message text template

Built from i18n key `contact.waMessage`. Spanish default:

```
Hola, soy {name}. Mi WhatsApp es {whatsapp}. {message}
```

Where:
- `{name}` → `ContactFormState.name` (raw, no encoding yet — encoding applied to the whole text)
- `{whatsapp}` → `ContactFormState.whatsapp`
- `{message}` → `ContactFormState.message`

**Example** (given state `{ name: "Ana", whatsapp: "+52 55 1234 5678", message: "¿Tienen mesa para 4?" }`):

```
Raw text:   Hola, soy Ana. Mi WhatsApp es +52 55 1234 5678. ¿Tienen mesa para 4?
Encoded:    Hola%2C%20soy%20Ana.%20Mi%20WhatsApp%20es%20%2B52%2055%201234%205678.%20%C2%BFTienen%20mesa%20para%204%3F
Full URL:   https://wa.me/5215512345678?text=Hola%2C%20soy%20Ana.%20...
```

### Preconditions for link to fire

All four form fields must be non-empty AND a branch with a non-null phone must be selected.
If any precondition fails, the CTA button is `disabled` and no URL is opened.

---

## 3. Static right card — i18n values

The right card renders static values sourced from i18n locale files. No server call.

| Value | i18n key | Link target |
|---|---|---|
| Global WhatsApp pill | `contact.globalWhatsapp` | `https://wa.me/{contact.globalWhatsapp}` |
| Email | `contact.email` | `mailto:{contact.email}` |
| Instagram | `contact.socialInstagram` | `{contact.socialInstagram}` |
| Facebook | `contact.socialFacebook` | `{contact.socialFacebook}` |
| TikTok | `contact.socialTiktok` | `{contact.socialTiktok}` |

All external links open in `target="_blank"` with `rel="noopener noreferrer"`.
