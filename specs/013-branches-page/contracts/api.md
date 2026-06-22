# API Contract Delta: Branches Page

**Feature**: `013-branches-page`
**Date**: 2026-06-21
**Base contract**: `specs/004-branch-finder-location/contracts/api.md`

This file documents only the **delta** from feature 004's contract. Unchanged behaviour
(query parameters, expansion logic, 400 error shapes, `searchContext`) is inherited from
feature 004 without repetition.

---

## What changed in feature 013

### New fields in every branch object

Three fields that existed in the `branches` DB table but were stripped from the public
response in feature 004 are now exposed:

| Field | Type | Source | Notes |
|-------|------|--------|-------|
| `type` | `'ayce' \| 'express'` | `branches.type` | Branch category. Drives pin color and type chip. |
| `schedule` | `BranchSchedule \| null` | `branches.schedule` (JSONB) | Operating hours. Null if unset. |
| `phone` | `string \| null` | `branches.whatsappReservaciones` | Renamed in response. Used for `tel:` link. |

`whatsappReservaciones` MUST NOT appear in the response. `whatsappReservacionesBackup` remains
excluded.

### `BranchSchedule` shape

```typescript
interface BranchScheduleSlot {
  open: string   // "HH:MM" 24-hour format
  close: string  // "HH:MM" 24-hour format
}

interface BranchSchedule {
  weekdays?: BranchScheduleSlot
  weekends?: BranchScheduleSlot
}
```

If the `schedule` column is `null` or does not match this shape, the API returns `null` for
the `schedule` field (no 500 on malformed JSONB).

---

## Updated response examples

### `GET /api/v1/branches` — no coordinates (full list)

```json
{
  "data": [
    {
      "id": "uuid",
      "name": "SUMO Buenavista",
      "address": "Eje 1 Norte s/n, Buenavista, Cuauhtémoc",
      "lat": "19.44980000",
      "lng": "-99.15030000",
      "isActive": true,
      "type": "express",
      "schedule": {
        "weekdays": { "open": "13:00", "close": "22:00" },
        "weekends": { "open": "12:00", "close": "23:00" }
      },
      "phone": "+52551234567"
    },
    {
      "id": "uuid",
      "name": "SUMO Polanco",
      "address": "Av. Presidente Masaryk 123, Polanco",
      "lat": "19.43260000",
      "lng": "-99.19240000",
      "isActive": true,
      "type": "ayce",
      "schedule": null,
      "phone": null
    }
  ],
  "error": null,
  "meta": null
}
```

Ordered by `name` ascending.

### `GET /api/v1/branches?lat=19.43&lng=-99.13` — with coordinates

```json
{
  "data": [
    {
      "id": "uuid",
      "name": "SUMO Polanco",
      "address": "Av. Presidente Masaryk 123, Polanco",
      "lat": "19.43260000",
      "lng": "-99.19240000",
      "isActive": true,
      "type": "ayce",
      "schedule": {
        "weekdays": { "open": "12:00", "close": "22:00" }
      },
      "phone": "+52551234567",
      "distanceKm": 1.23
    }
  ],
  "error": null,
  "meta": null,
  "searchContext": {
    "radiusUsed": 10,
    "expanded": false,
    "noResults": false
  }
}
```

Ordered by `distanceKm` ascending.

---

## Unchanged from feature 004

- Query parameters (`lat`, `lng`, `radius`) — same validation rules and 400 errors.
- Expansion logic (`buildRadii`, three attempts) — unchanged.
- `searchContext` shape — unchanged.
- `distanceKm` on coordinate queries — unchanged.
- Fields still excluded: `whatsappReservacionesBackup`, `postalCode`, `createdAt`, `updatedAt`.

---

## Frontend usage by feature 013

| Field | Used by | How |
|-------|---------|-----|
| `type` | `BranchCard` | Type chip color (`orange` = AYCE, `blue` = Express). `MapMarker.color`. |
| `schedule` | `BranchCard` | Hours summary display. Null → "Horarios no disponibles". |
| `phone` | `BranchCard` | `tel:{phone}` href for Call button. Null → button hidden. |
| `lat` / `lng` | `useBranches` | Haversine sort (client-side). Map pin position. Directions URL. |
| `name` | `BranchCard`, `MapMarker.popupContent` | Display name. |
| `address` | `BranchCard` | Address line. |
| `id` | `MapMarker.id`, list key | Cross-link map ↔ list. |

---

## Test additions required

In addition to the existing feature 004 tests (which MUST still pass), the following new
test cases must be added to the branches API spec:

| Test case | Input | Expected |
|-----------|-------|----------|
| `type` included in no-coords response | no params | Each item has `type: 'ayce' \| 'express'` |
| `type` included in coords response | `lat=19.43&lng=-99.13` | Each item has `type` |
| `schedule` included and may be null | no params | Each item has `schedule: BranchSchedule \| null` |
| `phone` included (renamed from `whatsappReservaciones`) | no params | Each item has `phone: string \| null` |
| `whatsappReservaciones` NOT in response | no params | No item has a `whatsappReservaciones` key |
| `whatsappReservacionesBackup` NOT in response | no params | No item has a `whatsappReservacionesBackup` key |
