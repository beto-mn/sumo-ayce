# Data Model: Reservation Page (014)

**Feature**: 014 — Reservation Page (/reservar)
**Scope**: Frontend-only transient state. No new DB tables or server routes.

---

## Entities

### Branch (read-only, from API)

Sourced from `GET /api/v1/branches`. Shape relevant to this feature:

```ts
interface Branch {
  id: string           // UUID
  name: string         // Display name, e.g., "SUMO Polanco"
  type: 'ayce' | 'express'
  schedule: BranchSchedule | null
}

interface BranchSchedule {
  weekdays?: { open: string; close: string }   // "HH:MM" 24h
  weekends?: { open: string; close: string }   // "HH:MM" 24h
}
```

**Constraints**:
- `id` — must be a valid UUID for pre-fill matching (FR-005)
- `schedule` — may be `null`; if so, Hora dropdown shows "Horarios no disponibles" (FR-012, US-5 AC4)
- If only one key (`weekdays` or `weekends`) is present, it is used for all days (spec Assumptions §3)

---

### ReservationDraft (transient client state)

In-progress form values. Never persisted to DB or URL.

```ts
interface ReservationDraft {
  branchId: string | null
  tipo: 'ayce' | 'express'
  date: string            // ISO date "YYYY-MM-DD"
  time: string            // "HH:MM", empty string when unselected
  partySize: number | null
  name: string
  phone: string           // raw input, may include +52 prefix
}
```

**Initial values**:
- `branchId`: from `?branch` query param if valid UUID in branch list, otherwise `null`
- `tipo`: from `?type` query param (`'ayce'` or `'express'`), defaults to `'ayce'`
- `date`, `time`, `name`, `phone`: empty string
- `partySize`: `null`

**Validation rules** (applied on submit, FR-022):

| Field       | Rule                                                                 | Error key                          |
|-------------|----------------------------------------------------------------------|------------------------------------|
| `branchId`  | Must be non-null and in branch list                                  | `reservation.error.branch_required` |
| `date`      | Non-empty; must be today ≤ date ≤ today + 30 days                   | `reservation.error.date_required` / `reservation.error.date_past` / `reservation.error.date_too_far` |
| `time`      | Non-empty; must be in generated slot list                            | `reservation.error.time_required`  |
| `partySize` | 1 ≤ value ≤ 20                                                       | `reservation.error.party_size`     |
| `name`      | 1–100 characters, non-empty after trim                               | `reservation.error.name_required`  |
| `phone`     | After stripping `+52`: exactly 10 digits                             | `reservation.error.phone_invalid`  |

---

### ReservationConfirmation (transient client state)

Held after a successful `POST /api/v1/reservations` (201). Displayed in the confirmation screen. Cleared on "Hacer otra reservación".

```ts
interface ReservationConfirmation {
  folio: string        // From API response, e.g., "SUMO-1234"
  branchName: string   // Resolved from branch list at time of submit
  date: string         // ISO "YYYY-MM-DD"
  time: string         // "HH:MM"
  partySize: number
}
```

---

### CreateReservationPayload (API request body)

Shape sent to `POST /api/v1/reservations`. Matches `CreateReservationSchema` (feature 002).

```ts
interface CreateReservationPayload {
  branchId: string
  contactName: string
  contactPhone: string   // Stripped 10-digit string (no +52)
  partySize: number
  reservationDate: string  // "YYYY-MM-DD"
  reservationTime: string  // "HH:MM"
}
```

---

### FormState (UI machine)

Controls which screen is shown and whether the form is interactive.

```ts
type FormScreen = 'form' | 'confirmation'
type FormStatus = 'idle' | 'submitting' | 'success' | 'error'
```

**State transitions**:

```
idle
  → (user submits valid form) → submitting
    → (API 201) → success  [screen switches to 'confirmation']
    → (API error / network) → error  [fields re-enabled, inline banner shown]

error
  → (user edits any field) → idle  [error banner cleared]

confirmation
  → (user taps "Hacer otra reservación") → idle  [form reset, screen back to 'form']
```

---

## generateSlots Pure Function

```ts
/**
 * Generates 30-minute time slot strings for a given branch schedule and date.
 *
 * @param open  - Opening time "HH:MM" (inclusive)
 * @param close - Closing time "HH:MM" (exclusive; last slot = close - 30 min)
 * @param date  - ISO date string "YYYY-MM-DD" (client timezone)
 * @returns     Array of "HH:MM" strings, filtered for past times if date is today
 */
export function generateSlots(open: string, close: string, date: string): string[]
```

**Algorithm**:
1. If `open` or `close` is empty/null, return `[]`.
2. Parse `open` and `close` to total-minutes integers.
3. Iterate from `open` (inclusive) to `close - 30` (inclusive) in 30-min steps.
4. If `date` equals today (ISO, client timezone), filter out any slot ≤ current local time.
5. Format each surviving slot as `HH:MM` (zero-padded).

---

## Key Reactive Dependencies

```
branch selection change
  → clear time selection
  → recompute slot list from branch.schedule + selected date

date change
  → clear time selection
  → recompute slot list from branch.schedule + new date

tipo change
  → update --accent CSS variable (via :style on wrapper)
  → clear time selection (UX safety reset per edge case §7)
```
