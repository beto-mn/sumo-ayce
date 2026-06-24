# Feature Specification: Reservation Page (/reserve)

**Feature ID**: 014  
**Feature Branch**: `feat/018-reservation-page`  
**Created**: 2026-06-23  
**Status**: Draft  
**Depends on**: 002 (reservations CRUD API, done), 003 (Twilio WhatsApp, done), 004 (branches API, done), 007 (design system, done), 008 (frontend test setup, done), 013 (branches page, done)  

---

## Overview

The Reservation Page is a dedicated, full-page form at `/reserve` that allows visitors to book a
table at any SUMO branch. It replaces the previously planned modal approach. The full-page layout
provides a better mobile experience and allows shareable/bookmarkable URLs with pre-filled context
via query parameters (e.g., `/reserve?branch=<id>&type=ayce`).

The backend (API, validation, Twilio WhatsApp notifications, Neon persistence) is fully implemented
in features 002 and 003. This feature is **frontend only** — no new server routes are created.

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Arrive with pre-filled context from branch card (Priority: P1)

A visitor taps "Reservar" on a branch card at `/sucursales`. The link navigates to
`/reserve?branch=<id>&type=ayce`. On arrival, the Sucursal dropdown is pre-selected to that
branch and the Tipo dropdown shows "AYCE". The visitor only needs to pick a date, time, party size,
name, and phone — two fields are already filled.

**Why this priority**: This is the primary reservation entry point in the product flow.
Pre-fill reduces friction from 7 choices to 5. It is the baseline happy path.

**Independent Test**: Navigate to `/reserve?branch=<valid-uuid>&type=ayce`. Confirm the Sucursal
dropdown shows the matching branch name selected, Tipo shows "AYCE", and the page accent is orange.

**Acceptance Scenarios**:

1. **Given** a valid `?branch=<uuid>` query param, **When** the page loads, **Then** the Sucursal
   dropdown pre-selects the branch with that ID.
2. **Given** `?type=ayce` in the URL, **When** the page loads, **Then** Tipo shows "AYCE" and
   the page `--accent` is `var(--orange)`.
3. **Given** `?type=express` in the URL, **When** the page loads, **Then** Tipo shows "Express"
   and the page `--accent` is `var(--blue)`.
4. **Given** no query params, **When** the page loads, **Then** Sucursal is unselected, Tipo
   defaults to "AYCE", and the form is fully editable.
5. **Given** an unknown `?branch` value (not in the branch list), **When** the page loads,
   **Then** the Sucursal dropdown remains unselected (no crash, no error shown on load).

---

### User Story 2 — Complete and submit the reservation form (Priority: P1)

A visitor fills in all seven fields and submits the form. The system posts the reservation, shows
a confirmation screen with the folio number and a note that a WhatsApp confirmation is on its way.
No navigation occurs — the confirmation replaces the form in place.

**Why this priority**: This is the terminal action of the entire reservation flow. Without a
successful submit path the feature has no value.

**Independent Test**: Fill all fields with valid data. Submit. Confirm the form disappears, a
confirmation panel appears with a folio number (e.g., "SUMO-XXXX"), and the message "Recibirás
una confirmación por WhatsApp" (ES) / "You'll receive a WhatsApp confirmation" (EN).

**Acceptance Scenarios**:

1. **Given** all fields are valid, **When** the visitor submits, **Then** the submit button enters
   a loading state and the form fields are disabled.
2. **Given** a successful API response (201), **When** the response arrives, **Then** the form is
   replaced with a confirmation screen showing the folio number returned by the API.
3. **Given** the confirmation screen is shown, **When** the visitor reads it, **Then** it includes:
   folio number, branch name, date, time, party size, and the WhatsApp-confirmation reminder.
4. **Given** the confirmation screen, **When** the visitor taps "Hacer otra reservación",
   **Then** the form is reset and shown again (no full navigation).

---

### User Story 3 — Handle API or network error gracefully (Priority: P1)

The API call fails (network error, 422 validation error, 500). The visitor sees an inline error
message below the form. The form remains fully editable so they can correct and resubmit.

**Why this priority**: Error handling is part of the P1 submit flow. A broken error state
blocks corrections and causes abandoned reservations.

**Independent Test**: Mock the `POST /api/v1/reservations` to return 500. Submit the form.
Confirm an error banner appears, the form fields are re-enabled, and the submit button is
restored to its default state.

**Acceptance Scenarios**:

1. **Given** the API returns a 4xx or 5xx, **When** the response arrives, **Then** the submit
   button returns to its default state and an inline error message appears below the form.
2. **Given** the API returns 422, **When** the error is displayed, **Then** the message indicates
   the reservation could not be created (no technical detail exposed to the user).
3. **Given** a network failure, **When** the fetch throws, **Then** an inline error message
   appears (same UX as an API error); no unhandled rejection surfaces.
4. **Given** an error state, **When** the visitor edits any field, **Then** the error message
   is cleared.

---

### User Story 4 — Validate form fields before submit (Priority: P1)

Each field has client-side validation. The visitor cannot submit until all fields pass. Errors
appear field-by-field inline (not as a single alert).

**Why this priority**: Client-side validation prevents unnecessary API calls and gives immediate
feedback, which is especially important on slow mobile connections.

**Independent Test**: Leave all fields empty and tap Submit. Confirm that each field shows its
own error message and the API is not called.

**Acceptance Scenarios**:

1. **Given** Sucursal is not selected, **When** the visitor submits, **Then** an error "Selecciona
   una sucursal" appears under the Sucursal field.
2. **Given** Fecha is empty, **When** the visitor submits, **Then** an error appears under Fecha.
3. **Given** a past date is entered, **When** the visitor submits, **Then** the error states the
   date must be today or future.
4. **Given** a date more than 30 days ahead is entered, **When** the visitor submits, **Then**
   the error states the date must be within 30 days.
5. **Given** Hora is not selected, **When** the visitor submits, **Then** an error appears.
6. **Given** party size is 0 or empty, **When** the visitor submits, **Then** an error "Entre 1
   y 20 personas" appears.
7. **Given** Nombre completo is empty, **When** the visitor submits, **Then** an error appears.
8. **Given** WhatsApp is not a valid 10-digit Mexican number (allowing optional +52 prefix),
   **When** the visitor submits, **Then** the error "Número de WhatsApp inválido" appears.
9. **Given** all fields are valid, **When** the visitor submits, **Then** no client-side errors
   appear and the API call is made.

---

### User Story 5 — Generate time slots from branch hours (Priority: P1)

After selecting a branch and a date, the Hora dropdown is populated with 30-minute slots between
the branch's opening and closing times. For today's date, slots in the past are excluded.

**Why this priority**: Slot generation is the core derived-data behavior of the form. An incorrect
slot list would result in reservations outside business hours.

**Independent Test**: Select a branch with schedule `{ open: "13:00", close: "22:00" }` and
tomorrow's date. Confirm the Hora `<input type="time">` has `min="13:00"` and `max="21:30"`
(22:00 close minus 30 min), with `step="900"` for 15-minute intervals. Then select today's
date and confirm `min` advances to exclude past slots.

**Acceptance Scenarios**:

1. **Given** a branch with open=13:00 and close=22:00 and a future date, **When** Fecha is set,
   **Then** the Hora input has `min="13:00"` and `max="21:30"` (last slot is close minus 30 min)
   with 15-min step (step=900).
2. **Given** today's date and the current time is 15:45, **When** Hora is computed, **Then** the
   `min` attribute advances to 16:00 (current and past slots excluded).
3. **Given** no branch selected, **When** a date is picked, **Then** the Hora input is disabled
   and a hint text "Selecciona una sucursal primero" appears below it.
4. **Given** a branch with no `schedule` data, **When** a date is picked, **Then** a fallback
   message "Horarios no disponibles" appears below the Hora input.
5. **Given** the branch selection changes after a Hora was chosen, **When** the branch changes,
   **Then** the Hora selection is cleared and slots are recomputed for the new branch.

---

### Edge Cases

- What if the branch list from the API is empty? → Show an inline message "No hay sucursales
  disponibles" and disable the submit button.
- What if the API is unavailable when the page loads? → Show an error state in place of the branch
  dropdown with a retry option; the rest of the form is still rendered.
- What if `?branch` is a valid UUID but the branch is no longer active? → It won't appear in the
  dropdown list (the API only returns active branches); the field is unselected on load.
- What if the user navigates back after seeing the confirmation screen? → Browser back navigation
  exits the page (no custom back interception needed).
- What if the user refreshes on the confirmation screen? → The page reloads to the empty form
  state (confirmation is transient client state, not URL-persisted).
- What if party size is entered as a decimal (e.g., 2.5)? → The input type is number with step=1;
  the value is coerced to integer before submission.
- What if the Tipo dropdown changes after a time slot was selected? → Hora is cleared (type
  affects meal availability but slot boundaries come from branch hours; this is a UX safety reset).
- What if the user accesses `/reserve` with `?type=invalid`? → Tipo defaults to "AYCE" silently.
- What happens under reduced motion? → Form entrance animations and any transition effects are
  disabled or instant; the confirmation screen appears without animation.

---

## Requirements *(mandatory)*

### Functional Requirements

**Page & rendering**

- **FR-001**: The system MUST serve the reservation form at the route `/reserve` without requiring
  authentication.
- **FR-002**: `routeRules['/reserve'] = { ssr: true }` MUST be present in `nuxt.config.ts`.
  The branch list is fetched server-side on every request (no ISR, no prerender).
- **FR-003**: The branch list MUST be fetched via `useAsyncData` calling `GET /api/v1/branches`
  during server-side render so the initial HTML includes the full branch list. No DB client
  may be imported under `app/`.
- **FR-004**: The page template (`app/pages/reserve.vue`) MUST NOT exceed 100 lines of
  template markup (Article I). Sections are decomposed into feature components under
  `app/features/reservation/components/`.

**Query-param pre-fill**

- **FR-005**: On load, if `?branch=<uuid>` is present and matches a branch in the fetched list,
  the Sucursal field MUST be pre-selected to that branch.
- **FR-006**: On load, if `?type=ayce` is present, Tipo MUST default to "AYCE" and the page
  scope MUST have `--accent: var(--orange)`. If `?type=express`, Tipo MUST default to "Express"
  and `--accent: var(--blue)`.
- **FR-007**: If `?branch` is absent, not a UUID, or not in the branch list, the Sucursal field
  MUST remain unselected with no error shown on load.
- **FR-008**: If `?type` is absent or not one of `ayce|express`, Tipo MUST default to "AYCE".

**Form fields**

- **FR-009**: The Sucursal field MUST be a select populated from the server-fetched branch list.
  Each option label is `branch.name`; the value is `branch.id`.
- **FR-010**: The Tipo field MUST be a select with exactly two options: "AYCE" and "Express".
- **FR-011**: The Fecha field MUST be a date input constrained to [today, today + 30 days]. Dates
  outside this range MUST be unselectable (via `min`/`max` attributes or equivalent).
- **FR-012**: The Hora field MUST be an `<input type="time">` with `min`, `max`, and `step="900"`
  attributes derived from the branch schedule for the selected date. It MUST be disabled when no
  branch or date is selected. When no branch is selected, a hint text MUST appear below the input:
  "Selecciona una sucursal primero". When a branch is selected but has no schedule, a hint text
  "Horarios no disponibles" MUST appear below the input.
- **FR-013**: The party size field MUST accept integers 1–20. Values outside this range MUST
  be rejected by client-side validation before submit.
- **FR-014**: The Nombre completo field MUST be a text input accepting 1–100 characters.
- **FR-015**: The WhatsApp field MUST accept a Mexican phone number. Valid formats: 10 digits
  (`5512345678`) or with the `+52` prefix (`+525512345678`). The `+52` prefix is stripped
  before the value is sent to the API. The stripped value MUST be exactly 10 digits.

**Slot generation**

- **FR-016**: Slot generation MUST be implemented as a pure function `generateSlots(open: string,
  close: string, date: string): string[]` exported from
  `app/features/reservation/composables/useReservationSlots.ts`.
- **FR-017**: The function MUST return 15-minute interval strings in `HH:MM` format from `open`
  (inclusive) to `close` (exclusive — the last slot is `close` minus 30 min). If `open` or
  `close` is empty/null, it returns `[]`.
- **FR-018**: When `date` equals today (ISO date string, client timezone), any slot whose time
  is ≤ the current local time MUST be excluded from the result.
- **FR-019**: The Hora dropdown MUST recompute whenever the selected branch or selected date
  changes. The current Hora value MUST be cleared on recompute.

**Accent / type context**

- **FR-020**: The `--accent` CSS variable MUST be scoped to the page wrapper element (not
  `:root`). When Tipo is "AYCE", `--accent: var(--orange)`. When Tipo is "Express",
  `--accent: var(--blue)`.
- **FR-021**: The `--accent` swap MUST be implemented via a `:style` binding on the wrapper
  element, not by duplicating Tailwind/CSS rules for each type.

**Submit behavior**

- **FR-022**: On submit, the system MUST first run client-side validation on all fields. If any
  field is invalid, the submit MUST be aborted and per-field error messages MUST be displayed.
  The API MUST NOT be called.
- **FR-023**: On valid submit, the submit button MUST enter a loading state (spinner or disabled
  label) and all fields MUST be disabled until the API responds.
- **FR-024**: The request payload MUST match the `CreateReservationSchema` shape:
  `{ branchId, contactName, contactPhone, partySize, reservationDate, reservationTime }`.
  `contactPhone` is the stripped 10-digit string.
- **FR-025**: On API success (201), the form MUST be replaced by a confirmation screen showing:
  folio number (from response), branch name, date, time, party size, and the WhatsApp
  confirmation reminder. No page navigation occurs.
- **FR-026**: The confirmation screen MUST include a "Hacer otra reservación" action that resets
  the form state and shows the form again without a full page reload.
- **FR-027**: On API error (any non-2xx or network failure), the submit button MUST be restored
  to its default state, all fields MUST be re-enabled, and an inline error banner MUST appear
  below the form. The error banner MUST be cleared when the user edits any field.

**Internationalisation**

- **FR-028**: All UI copy (labels, placeholders, error messages, confirmation text, button labels)
  MUST be available in Spanish (default) and English via `@nuxtjs/i18n`.

**Accessibility**

- **FR-029**: All form fields MUST have associated `<label>` elements or `aria-label`. Error
  messages MUST be linked via `aria-describedby`.
- **FR-030**: All interactive elements MUST be keyboard-navigable with visible focus indicators.
  Hit targets MUST be ≥ 44 × 44 px.

**Layout & responsiveness**

- **FR-031**: The page MUST be mobile-first. At < 520px the form is a single column. At ≥ 520px
  a two-column layout MAY be used for field pairs (e.g., Fecha + Hora side by side).
- **FR-032**: The page uses the existing default Nuxt layout (`layouts/default.vue`). No new
  layout is created.

**Routing — existing pages update**

- **FR-033**: The "Reservar" button on each branch card in `app/features/branches/` MUST be
  updated to link to `/reserve?branch=<id>&type=<branch.type>` instead of calling
  `useReservationModal().openReservation()`.
- **FR-034**: Any homepage CTA that previously invoked the reservation modal MUST be updated
  to navigate to `/reserve`.

**Tests**

- **FR-035**: `useReservationSlots.test.ts` MUST test `generateSlots` with: future date (full
  slot range), today with past slots excluded, branch with no hours (returns `[]`), boundary
  values (exact open/close times).
- **FR-036**: `ReservationForm.spec.ts` MUST test: pre-fill from query params, per-field
  validation errors, submit success (confirmation rendered with folio), submit error (inline
  error rendered), slot recompute on branch change.
- **FR-037**: Test coverage for `app/features/reservation/` MUST meet the 70% threshold for
  composables defined in Article IV.

### Key Entities

- **Branch** (read-only for this feature): Public branch record as returned by
  `GET /api/v1/branches`. Relevant attributes: `id`, `name`, `type` (`'ayce' | 'express'`),
  `schedule` (per-day keys `{ mon, tue, wed, thu, fri, sat, sun }` each `{ open: string, close: string } | null`, or `null` if unavailable). Sourced from feature 013's backend delta.

- **ReservationDraft** (transient client state): The in-progress form values.
  `{ branchId: string | null, tipo: 'ayce' | 'express', date: string, time: string,
  partySize: number | null, name: string, phone: string }`. Never persisted.

- **ReservationConfirmation** (transient client state after successful submit):
  `{ folio: string, branchName: string, date: string, time: string, partySize: number }`.
  Displayed in the confirmation screen; cleared on "Hacer otra reservación".

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A visitor arriving from a branch card lands on a form with the branch and type
  already selected — they complete the reservation in fewer than 2 minutes on a mobile device.
- **SC-002**: All seven fields validate correctly before the form is submitted; no invalid
  reservation reaches the API.
- **SC-003**: The confirmation screen with folio appears within the API round-trip time after
  a successful submit (no additional navigation or loading step).
- **SC-004**: On a 4G mobile connection, the page is fully interactive in under 2 seconds
  (Lighthouse Performance ≥ 90).
- **SC-005**: All time slots shown in the Hora dropdown fall within the selected branch's
  operating hours; no past slots appear when today's date is selected.
- **SC-006**: The page is fully usable in both Spanish and English without a full reload.
- **SC-007**: An API or network error never leaves the form in a broken or unrecoverable state;
  the visitor can always attempt to resubmit.
- **SC-008**: Zero unhandled JavaScript exceptions surface to the visitor during any form
  interaction.

---

## Assumptions

- The backend endpoint `POST /api/v1/reservations` (feature 002) is stable and its
  `CreateReservationSchema` shape will not change during this feature's implementation.
- `GET /api/v1/branches` already exposes the `schedule` field (added in feature 013's
  backend delta). If a branch has `schedule: null`, the Hora dropdown falls back to
  "Horarios no disponibles".
- Branch `schedule` uses per-day keys (`{ mon, tue, wed, thu, fri, sat, sun }`) where each is
  `{ open: string, close: string } | null`. The slot generator maps the date's day of week to
  the corresponding key to resolve the open/close times.
- The `folio` field is present in the 201 response body from `POST /api/v1/reservations`
  (confirmed in `server/api/v1/reservations/index.post.ts`).
- Slot generation uses the **client's local timezone** to determine "today" and current time.
  No server-side timezone conversion is required for this feature.
- The `useReservationModal` composable (feature 010) is replaced as the reservation entry
  point by the direct link to `/reserve`. The composable may remain in the codebase for
  backward compatibility but its callers in branch cards and homepage CTAs are updated.
- No authentication is required to submit a reservation. The endpoint is public.
- The WhatsApp number field strips the `+52` prefix before sending to the API; the API's
  `contactPhone` field accepts any non-empty string up to 20 characters, so 10 digits always
  passes server-side validation.
- Party size is displayed as a `<select>` (options 1–20) rather than a free-text number input,
  to avoid mobile keyboard issues and out-of-range entries.
- `docs/business/rendering-strategy.md` §4 table MUST be updated to add
  `/reserve → ssr: true` as part of this feature's delivery.
