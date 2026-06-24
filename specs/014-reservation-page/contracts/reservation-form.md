# Contract: Reservation Form (Feature 014)

**Type**: UI component contract + API call contract
**Feature**: 014 — Reservation Page (/reservar)

---

## 1. Page Route Contract

| Property        | Value                      |
|-----------------|----------------------------|
| Route           | `/reservar`                |
| Rendering mode  | `ssr: true`                |
| Auth required   | No                         |
| Query params    | `branch` (UUID), `type` (`ayce`\|`express`) |

**Server-side data fetch** (via `useAsyncData`):
- Calls `GET /api/v1/branches`
- Result hydrated into the form's Sucursal dropdown
- On failure: inline error state in branch dropdown with retry option; rest of form rendered

---

## 2. Component Interface

### `ReservationForm.vue`

```ts
// Props
defineProps<{
  branches: Branch[]           // From server-side useAsyncData
  initialBranchId?: string     // From ?branch query param
  initialTipo?: 'ayce' | 'express'  // From ?type query param
}>()

// Emits
defineEmits<{
  confirmed: [confirmation: ReservationConfirmation]
}>()
```

**Responsibilities**:
- Owns `ReservationDraft` reactive state
- Runs client-side validation on submit
- Calls `POST /api/v1/reservations`
- Switches to confirmation screen on success
- Displays inline error banner on failure
- Renders `ReservationConfirmation.vue` on success

---

### `ReservationConfirmation.vue`

```ts
// Props
defineProps<{
  confirmation: ReservationConfirmation
}>()

// Emits
defineEmits<{
  reset: []   // User tapped "Hacer otra reservación"
}>()
```

---

### `useReservationSlots.ts` — exported pure function

```ts
export function generateSlots(
  open: string,
  close: string,
  date: string
): string[]
```

**Contract guarantees**:
- Returns `[]` when `open` or `close` is empty/null/undefined
- Returns `HH:MM` strings only
- Last slot is `close` minus 30 minutes (close itself is never a slot)
- When `date` is today (client timezone), slots at or before current time are excluded
- Output is always sorted ascending
- Pure — no side effects, no Vue reactivity dependencies

---

## 3. API Calls (client → server)

### GET /api/v1/branches

- **When**: Server-side render (via `useAsyncData`)
- **Response shape**: `Branch[]` (id, name, type, schedule)
- **Error handling**: Branch dropdown shows retry option; form still renders

### POST /api/v1/reservations

- **When**: On valid form submit (client-side)
- **Request body**:

```json
{
  "branchId": "uuid",
  "contactName": "string (1–100 chars)",
  "contactPhone": "string (exactly 10 digits, no +52)",
  "partySize": 4,
  "reservationDate": "YYYY-MM-DD",
  "reservationTime": "HH:MM"
}
```

- **Success (201)**:

```json
{
  "folio": "SUMO-1234",
  ...other fields
}
```

- **Error (4xx/5xx)**: Inline error banner; form fields re-enabled

---

## 4. i18n Keys (required in both `es` and `en` locales)

```
reservation.page_title
reservation.form.label.branch
reservation.form.label.tipo
reservation.form.label.date
reservation.form.label.time
reservation.form.label.party_size
reservation.form.label.name
reservation.form.label.phone
reservation.form.placeholder.branch
reservation.form.placeholder.time_no_branch
reservation.form.placeholder.time_no_schedule
reservation.form.submit
reservation.form.submitting
reservation.error.branch_required
reservation.error.date_required
reservation.error.date_past
reservation.error.date_too_far
reservation.error.time_required
reservation.error.party_size
reservation.error.name_required
reservation.error.phone_invalid
reservation.error.api_generic
reservation.error.branch_unavailable
reservation.confirmation.title
reservation.confirmation.folio_label
reservation.confirmation.branch_label
reservation.confirmation.date_label
reservation.confirmation.time_label
reservation.confirmation.party_size_label
reservation.confirmation.whatsapp_note
reservation.confirmation.reset_button
```

---

## 5. Accessibility Contract

- Every form field: associated `<label>` or `aria-label`
- Every error message: linked via `aria-describedby` to its field
- Submit button: `aria-busy="true"` during submitting state
- All interactive elements: keyboard-navigable, visible focus ring, ≥ 44×44 px hit target
- Reduced motion: form entrance animations disabled via `@media (prefers-reduced-motion: reduce)`
