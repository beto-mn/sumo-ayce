# API Contract: Reservaciones — Backend CRUD API

**Version**: 1.0.0 | **Date**: 2026-05-23

---

## Convenciones Generales

- Todas las respuestas son `application/json`
- Estructura de respuesta: `{ data, error, meta }`
- Timestamps en ISO 8601 UTC
- IDs en UUID v4
- Fechas de reservación en formato `YYYY-MM-DD`
- Horas de reservación en formato `HH:MM:SS`

### Estructura de Éxito

```json
{ "data": <object|array>, "error": null, "meta": null }
{ "data": <array>, "error": null, "meta": { "page": 1, "limit": 20, "total": 45 } }
```

### Estructura de Error

```json
{ "data": null, "error": { "message": "string", "issues": [...] }, "meta": null }
```

### Códigos HTTP

| Código | Significado |
|--------|-------------|
| 200 | OK |
| 201 | Creado |
| 400 | Bad Request (malformado) |
| 404 | No encontrado |
| 409 | Conflicto de estado |
| 422 | Validación fallida |
| 500 | Error interno |

---

## GET /api/branches

Lista las sucursales activas para el selector del formulario de reservación.

**Auth**: No requerida (endpoint público)

**Query params**: Ninguno

**Response 200**:
```json
{
  "data": [
    {
      "id": "uuid",
      "name": "SUMO Monterrey Centro",
      "address": "Av. Constitución 1234, Centro, Monterrey, NL",
      "postalCode": "64000"
    }
  ],
  "error": null,
  "meta": null
}
```

**Ordenamiento**: Alfabético por `name` ASC.
**Filtro**: Solo `is_active = true`.
**Notas**: Sucursales sin `postal_code` retornan `postalCode: null`.

---

## POST /api/reservations

Crea una nueva reservación con estado `pending`.

**Auth**: No requerida (endpoint público)

**Request Body**:
```json
{
  "branchId": "uuid",
  "contactName": "Juan Pérez",
  "contactPhone": "8112345678",
  "partySize": 4,
  "reservationDate": "2026-06-15",
  "reservationTime": "19:30",
  "notes": "Cumpleaños, mesa cerca de la ventana"
}
```

| Campo | Tipo | Requerido | Validación |
|-------|------|-----------|------------|
| `branchId` | UUID | ✓ | Debe existir en `branches` |
| `contactName` | string | ✓ | 1–100 caracteres |
| `contactPhone` | string | ✓ | 1–20 caracteres |
| `partySize` | integer | ✓ | > 0 |
| `reservationDate` | string | ✓ | Formato `YYYY-MM-DD`, fecha futura |
| `reservationTime` | string | ✓ | Formato `HH:MM` |
| `notes` | string | — | Máx 500 caracteres |

**Response 201**:
```json
{
  "data": {
    "id": "uuid",
    "branchId": "uuid",
    "contactName": "Juan Pérez",
    "contactPhone": "8112345678",
    "partySize": 4,
    "reservationDate": "2026-06-15",
    "reservationTime": "19:30:00",
    "status": "pending",
    "notes": "Cumpleaños, mesa cerca de la ventana",
    "createdAt": "2026-05-23T18:00:00.000Z",
    "updatedAt": "2026-05-23T18:00:00.000Z",
    "deletedAt": null
  },
  "error": null,
  "meta": null
}
```

**Errores**:
- `422` — Campo inválido o faltante (incluye lista de `issues`)
- `422` — `branchId` no existe en la base de datos
- `422` — `reservationDate` es pasada o inválida

---

## GET /api/reservations

Lista reservaciones con soporte para filtros y paginación.

**Auth**: No requerida (por ahora)

**Query Params**:

| Param | Tipo | Default | Descripción |
|-------|------|---------|-------------|
| `branchId` | UUID | — | Filtra por sucursal |
| `status` | enum | — | `pending` \| `confirmed` \| `cancelled` |
| `reservationDate` | `YYYY-MM-DD` | — | Filtra por fecha exacta |
| `page` | integer | `1` | Página actual |
| `limit` | integer | `20` | Registros por página (máx 100) |

**Response 200**:
```json
{
  "data": [ <Reservacion>... ],
  "error": null,
  "meta": { "page": 1, "limit": 20, "total": 45 }
}
```

**Notas**:
- Siempre excluye registros con `deleted_at IS NOT NULL` (a menos que `status=cancelled` esté incluido en el filtro — en ese caso aparecen los cancelados con soft-delete)
- Ordenamiento: `reservation_date ASC, reservation_time ASC` (próximas primero)

---

## GET /api/reservations/:id

Retorna una reservación por su UUID.

**Auth**: No requerida (por ahora)

**Path Params**: `id` — UUID de la reservación

**Response 200**:
```json
{ "data": <Reservacion>, "error": null, "meta": null }
```

**Errores**:
- `404` — Reservación no encontrada o eliminada

---

## PATCH /api/reservations/:id

Actualiza campos editables de una reservación existente.

**Auth**: No requerida (por ahora)

**Path Params**: `id` — UUID de la reservación

**Request Body** (todos los campos son opcionales, al menos uno requerido):
```json
{
  "status": "confirmed",
  "reservationDate": "2026-06-16",
  "reservationTime": "20:00",
  "partySize": 6,
  "notes": "Actualización: ahora son 6 personas"
}
```

| Campo | Tipo | Validación |
|-------|------|------------|
| `status` | enum | Solo `pending` o `confirmed` (no se puede poner `cancelled` vía PATCH) |
| `reservationDate` | `YYYY-MM-DD` | Fecha futura |
| `reservationTime` | `HH:MM` | Formato válido |
| `partySize` | integer | > 0 |
| `notes` | string \| null | Máx 500 caracteres |

**Response 200**:
```json
{ "data": <Reservacion actualizada>, "error": null, "meta": null }
```

**Errores**:
- `404` — Reservación no encontrada
- `409` — Reservación tiene `status = cancelled` — no se puede modificar
- `422` — Payload vacío o campo inválido

---

## DELETE /api/reservations/:id

Cancela una reservación (soft-delete): marca `status = cancelled` y `deleted_at = NOW()`.

**Auth**: No requerida (por ahora)

**Path Params**: `id` — UUID de la reservación

**Response 200**:
```json
{
  "data": {
    "id": "uuid",
    "status": "cancelled",
    "deletedAt": "2026-05-23T18:30:00.000Z",
    ...
  },
  "error": null,
  "meta": null
}
```

**Errores**:
- `404` — Reservación no encontrada
- `409` — Reservación ya está cancelada
