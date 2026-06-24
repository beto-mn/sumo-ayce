# Quickstart: Reservation Page (014)

**Feature**: 014 — Reservation Page (/reservar)
**Branch**: `feat/018-reservation-page`

---

## Prerequisites

1. Feature branches for 002 (reservations API), 003 (Twilio), 004 (branches API), 007 (design system), 008 (test setup), 013 (branches page) must all be merged.
2. `.env.local` populated with `DATABASE_URL`, `TWILIO_*`, `MAPBOX_TOKEN`.
3. `pnpm install` completed.

---

## Local Development

```bash
# Start dev server (SSR mode)
pnpm dev

# The page is at:
# http://localhost:3000/reservar
# http://localhost:3000/reservar?branch=<uuid>&type=ayce
```

---

## File Locations

| Purpose                        | Path                                                              |
|-------------------------------|-------------------------------------------------------------------|
| Page route                    | `app/pages/reservar.vue`                                          |
| Form orchestrator component   | `app/features/reservation/components/ReservationForm.vue`         |
| Confirmation component        | `app/features/reservation/components/ReservationConfirmation.vue` |
| Slot generator composable     | `app/features/reservation/composables/useReservationSlots.ts`     |
| Form submit composable        | `app/features/reservation/composables/useReservationSubmit.ts`    |
| Feature types                 | `app/features/reservation/types.ts`                               |
| Slot generator tests          | `app/features/reservation/composables/useReservationSlots.test.ts`|
| Form component tests          | `app/features/reservation/components/ReservationForm.spec.ts`     |
| Storybook stories             | `app/features/reservation/components/*.stories.ts`                |

---

## Running Tests

```bash
# Unit tests only (reservation feature)
pnpm vitest run app/features/reservation

# Coverage report
pnpm vitest run --coverage app/features/reservation

# Type-check
pnpm vue-tsc --noEmit

# Lint + format
pnpm biome check .
```

---

## Key Acceptance Checks

1. **Pre-fill**: `http://localhost:3000/reservar?branch=<valid-uuid>&type=ayce`
   - Sucursal dropdown shows correct branch name
   - Page accent is orange

2. **Slot generation**: Select a branch with known hours + tomorrow's date
   - Hora dropdown shows 30-min slots from open to close-30min

3. **Submit flow**: Fill all 7 fields → Submit
   - Loading state on button
   - Confirmation screen appears with folio

4. **Error flow**: Mock `POST /api/v1/reservations` to 500
   - Inline error banner appears
   - Form fields re-enabled

5. **Validation**: Submit empty form
   - Each field shows its own error
   - No API call made

---

## Storybook

```bash
pnpm storybook

# Stories to verify:
# - ReservationForm: Default, AYCE, Express, Loading, Error, Confirmation
# - ReservationConfirmation: Default
```

---

## routeRules Update Required

In `nuxt.config.ts`, ensure:

```ts
routeRules: {
  // ... existing rules ...
  '/reservar': { ssr: true },
}
```

Also update `docs/business/rendering-strategy.md` §4 table to add:

| Feature                        | Route(s)    | Mode       | Notes                                                      |
|-------------------------------|-------------|------------|------------------------------------------------------------|
| 014 Reservation Page          | `/reservar` | `ssr: true`| Branch list fetched server-side. Pre-fill from query params.|
