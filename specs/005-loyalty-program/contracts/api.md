# API Contract: Loyalty Program

**Base path**: `/api/v1/loyalty`  
**Branch**: `feat/005-loyalty-program` | **Date**: 2026-05-26

> **Auth note**: Endpoints marcados con `[staff]` requieren autenticación de staff. En feat/005 se implementan sin auth — feat/006 agrega el middleware.

---

## POST /api/v1/loyalty/customers

Registra un nuevo cliente en el programa de lealtad. Si el teléfono ya existe, devuelve el cliente existente con `409`.

**Auth**: Pública (llamada por staff desde el portal)

**Request body**:
```json
{
  "name": "Ana García",
  "phone": "5512345678",
  "whatsappOptIn": true
}
```

| Campo | Tipo | Req | Validación |
|-------|------|-----|------------|
| `name` | string | ✅ | 1–100 chars |
| `phone` | string | ✅ | 10 dígitos MX o formato E.164 |
| `whatsappOptIn` | boolean | ❌ | default `false` |

**Response 201** — cliente nuevo:
```json
{
  "data": {
    "id": "uuid",
    "name": "Ana García",
    "phone": "+5215512345678",
    "whatsappOptIn": true,
    "pointsBalance": 0,
    "createdAt": "2026-05-26T12:00:00Z"
  },
  "error": null,
  "meta": null
}
```

**Response 409** — teléfono ya registrado (devuelve perfil existente):
```json
{
  "data": { /* cliente existente */ },
  "error": "Customer already registered",
  "meta": null
}
```

**Response 400** — validación fallida.

**Side effect**: Si `whatsappOptIn=true`, envía WhatsApp de bienvenida al cliente.

---

## GET /api/v1/loyalty/customers/:phone `[staff]`

Devuelve perfil completo y las últimas 20 transacciones del cliente.

**Auth**: Staff (feat/006 agrega middleware)

**Path param**: `phone` — número de teléfono (10 dígitos o E.164)

**Response 200**:
```json
{
  "data": {
    "id": "uuid",
    "name": "Ana García",
    "phone": "+5215512345678",
    "whatsappOptIn": true,
    "pointsBalance": 45,
    "createdAt": "2026-05-26T12:00:00Z",
    "transactions": [
      {
        "id": "uuid",
        "transactionType": "earn",
        "pointsDelta": 10,
        "branchName": "SUMO Polanco",
        "createdAt": "2026-05-26T14:00:00Z"
      }
    ]
  },
  "error": null,
  "meta": null
}
```

**Response 404** — cliente no encontrado (o tiene `deletedAt`).

---

## POST /api/v1/loyalty/transactions `[staff]`

Registra una visita y acredita puntos al cliente.

**Auth**: Staff (feat/006 agrega middleware)

**Request body**:
```json
{
  "phone": "5512345678",
  "branchId": "uuid",
  "ticketId": "T-00421",
  "staffId": "uuid"
}
```

| Campo | Tipo | Req | Validación |
|-------|------|-----|------------|
| `phone` | string | ✅ | teléfono del cliente |
| `branchId` | string | ✅ | UUID de sucursal activa |
| `ticketId` | string | ✅ | ID del ticket/folio del POS, 1–100 chars |
| `staffId` | string | ✅ | UUID del colaborador que registra la visita |

**Response 201**:
```json
{
  "data": {
    "transactionId": "uuid",
    "customerId": "uuid",
    "pointsDelta": 10,
    "newBalance": 45,
    "transactionType": "earn",
    "branchId": "uuid",
    "ticketId": "T-00421",
    "createdBy": "uuid",
    "createdAt": "2026-05-26T14:00:00Z"
  },
  "error": null,
  "meta": null
}
```

**Response 404** — cliente no encontrado.  
**Response 400** — cliente inactivo o branch no válido.

**Side effects**:
1. WhatsApp al cliente con nuevo saldo (si opt-in).
2. Si el nuevo saldo desbloquea recompensas nuevas: WhatsApp adicional con detalle de recompensas.

---

## GET /api/v1/loyalty/rewards

Devuelve catálogo de recompensas activas. Solo lectura.

**Auth**: Pública

**Response 200**:
```json
{
  "data": [
    {
      "id": "uuid",
      "name": "Refresco gratis",
      "description": "Un refresco de cualquier tamaño sin costo",
      "pointsCost": 10
    },
    {
      "id": "uuid",
      "name": "Postre gratis",
      "description": "Selecciona un postre del menú",
      "pointsCost": 20
    }
  ],
  "error": null,
  "meta": null
}
```

Ordenadas por `pointsCost ASC`. Solo recompensas con `isActive=true`.

---

## POST /api/v1/loyalty/redemptions `[staff]`

Procesa un canje de recompensa para un cliente.

**Auth**: Staff (feat/006 agrega middleware)

**Request body**:
```json
{
  "phone": "5512345678",
  "rewardId": "uuid",
  "branchId": "uuid",
  "staffId": "uuid"
}
```

| Campo | Tipo | Req | Validación |
|-------|------|-----|------------|
| `phone` | string | ✅ | teléfono del cliente |
| `rewardId` | string | ✅ | UUID de recompensa activa |
| `branchId` | string | ✅ | UUID de sucursal activa |
| `staffId` | string | ✅ | UUID del colaborador que procesa el canje |

**Response 201**:
```json
{
  "data": {
    "redemptionId": "uuid",
    "code": "AB3X9KP2",
    "customerId": "uuid",
    "rewardId": "uuid",
    "rewardName": "Postre gratis",
    "pointsDeducted": 20,
    "remainingBalance": 25,
    "status": "pending",
    "createdBy": "uuid",
    "createdAt": "2026-05-26T15:00:00Z"
  },
  "error": null,
  "meta": null
}
```

**Response 404** — cliente o recompensa no encontrados.  
**Response 422** — puntos insuficientes.  
**Response 400** — cliente inactivo, recompensa inactiva, o branch inválido.

**Side effect**: WhatsApp al cliente con nombre de recompensa, descripción, saldo restante y código de canje.

---

## PATCH /api/v1/loyalty/redemptions/:id/use `[staff]`

Marca un canje pendiente como utilizado.

**Auth**: Staff (feat/006 agrega middleware)

**Path param**: `id` — UUID del canje

**Request body**: vacío `{}`

**Response 200**:
```json
{
  "data": {
    "redemptionId": "uuid",
    "code": "AB3X9KP2",
    "status": "used",
    "usedAt": "2026-05-26T15:30:00Z"
  },
  "error": null,
  "meta": null
}
```

**Response 404** — canje no encontrado.  
**Response 409** — canje ya fue usado o está expirado.

---

## WhatsApp Webhook (extended) — SALDO keyword

**Endpoint**: `POST /api/webhooks/twilio` (existente)

Cuando un cliente envía `SALDO` (case-insensitive) al número de WhatsApp de SUMO:

**Response WhatsApp (cliente registrado)**:
```
🍣 *SUMO Lealtad*

Hola Ana, tienes *45 puntos* acumulados.

Puedes canjearlos en tu próxima visita.
¡Gracias por ser parte de SUMO!
```

**Response WhatsApp (número no registrado)**:
```
🍣 *SUMO Lealtad*

No encontramos una cuenta asociada a este número.

Visita cualquiera de nuestras sucursales para registrarte en el programa de lealtad. ¡Es gratis!
```

**Keyword detection** (case-insensitive, trim):
- `SALDO` → balance lookup
- `ACEPTAR [FOLIO]` / `RECHAZAR [FOLIO]` → reservation handler (sin cambios)
- cualquier otro → mensaje de ayuda existente
