# API Contract: Staff Portal

**Base path**: `/api/v1/staff`  
**Auth**: Cookie `staff_session` (httpOnly, Secure, SameSite=Strict) en todos los endpoints excepto `POST /auth/login`  
**Errores comunes**:
- `401 Unauthorized` — sin sesión o sesión expirada
- `403 Forbidden` — rol insuficiente
- `400 Bad Request` — validación Zod fallida

---

## Auth

### POST `/api/v1/staff/auth/login`

Autentica al usuario y establece la cookie de sesión.

**Body**
```json
{ "email": "cajero@sumo.com", "password": "••••••••" }
```

**Response 200**
```json
{
  "data": {
    "id": "uuid",
    "name": "Juan Pérez",
    "role": "staff",
    "branchId": "uuid",
    "branchName": "SUMO Satelite"
  }
}
```

**Response 401** — credenciales inválidas o usuario inactivo  
**Headers**: `Set-Cookie: staff_session=<token>; HttpOnly; Secure; SameSite=Strict; Max-Age=28800`

---

### POST `/api/v1/staff/auth/logout`

Elimina la sesión del servidor y limpia la cookie.

**Body**: vacío  
**Response 200**: `{ "data": { "ok": true } }`  
**Headers**: `Set-Cookie: staff_session=; Max-Age=0`

---

### GET `/api/v1/staff/auth/me`

Devuelve el usuario de la sesión activa.

**Response 200**
```json
{
  "data": {
    "id": "uuid",
    "name": "Juan Pérez",
    "role": "staff",
    "branchId": "uuid",
    "branchName": "SUMO Satelite"
  }
}
```

---

## Operaciones de cajero (todos los roles)

### GET `/api/v1/staff/customers/:phone`

Busca un cliente por teléfono. La sucursal del staff se obtiene de la sesión.

**Response 200**
```json
{
  "data": {
    "id": "uuid",
    "name": "María García",
    "phone": "+525512345678",
    "pointsBalance": 45,
    "whatsappOptIn": true,
    "createdAt": "2026-01-15T10:00:00Z"
  }
}
```

**Response 404** — cliente no encontrado

---

### POST `/api/v1/staff/customers`

Crea un nuevo cliente en el programa de lealtad.

**Body**
```json
{ "name": "María García", "phone": "+525512345678", "whatsappOptIn": true }
```

**Response 201**
```json
{
  "data": {
    "id": "uuid",
    "name": "María García",
    "phone": "+525512345678",
    "pointsBalance": 0
  }
}
```

**Response 409** — teléfono ya registrado (devuelve el cliente existente en `data`)

---

### POST `/api/v1/staff/transactions`

Registra una visita y acumula puntos. `staffId` y `branchId` se obtienen de la sesión.

**Body**
```json
{ "phone": "+525512345678", "ticketId": "TKT-001" }
```

`ticketId`: identificador único del ticket de caja. Previene duplicados.

**Response 201**
```json
{
  "data": {
    "transactionId": "uuid",
    "customerId": "uuid",
    "pointsDelta": 1,
    "newBalance": 46,
    "transactionType": "earn",
    "ticketId": "TKT-001",
    "createdAt": "2026-05-28T14:30:00Z"
  }
}
```

**Response 404** — cliente no encontrado  
**Response 409** — cliente ya acumuló puntos hoy o ticketId duplicado

---

### POST `/api/v1/staff/redemptions`

Canjea una recompensa para el cliente.

**Body**
```json
{ "phone": "+525512345678", "rewardId": "uuid", "ticketId": "TKT-002" }
```

**Response 201**
```json
{
  "data": {
    "redemptionId": "uuid",
    "customerId": "uuid",
    "rewardId": "uuid",
    "rewardName": "Postre gratis",
    "pointsSpent": 10,
    "newBalance": 36,
    "ticketId": "TKT-002",
    "createdAt": "2026-05-28T14:35:00Z"
  }
}
```

**Response 404** — cliente o recompensa no encontrada  
**Response 409** — puntos insuficientes o ticketId duplicado

---

## Operaciones de administrador (rol `admin` o `owner`)

### GET `/api/v1/staff/admin/transactions`

Historial completo de transacciones de la sucursal del admin autenticado.

**Query params**
| Param | Tipo | Default | Descripción |
|-------|------|---------|-------------|
| `page` | int | 1 | Paginación |
| `limit` | int | 50 | Máx 100 |
| `type` | `earn`\|`redeem` | — | Filtro por tipo |
| `date` | `YYYY-MM-DD` | — | Filtro por fecha exacta |

**Response 200**
```json
{
  "data": {
    "transactions": [
      {
        "id": "uuid",
        "type": "earn",
        "pointsDelta": 1,
        "customer": { "id": "uuid", "name": "María García", "phone": "+52..." },
        "createdBy": { "id": "uuid", "name": "Juan Cajero" },
        "ticketId": "TKT-001",
        "voidedAt": null,
        "createdAt": "2026-05-28T14:30:00Z"
      }
    ],
    "total": 120,
    "page": 1,
    "limit": 50
  }
}
```

---

### POST `/api/v1/staff/admin/transactions/:id/void`

Anula una transacción y revierte los puntos al cliente.

**Body**
```json
{ "reason": "Ticket duplicado — error del cajero" }
```

**Response 200**
```json
{
  "data": {
    "transactionId": "uuid",
    "voidedAt": "2026-05-28T15:00:00Z",
    "voidedBy": "uuid",
    "customerNewBalance": 45
  }
}
```

**Response 404** — transacción no encontrada en la sucursal del admin  
**Response 409** — transacción ya estaba anulada

---

### GET `/api/v1/staff/admin/reports/daily`

Métricas del día de la sucursal del admin autenticado.

**Query params**
| Param | Tipo | Default | Descripción |
|-------|------|---------|-------------|
| `date` | `YYYY-MM-DD` | hoy | Fecha a consultar |

**Response 200**
```json
{
  "data": {
    "date": "2026-05-28",
    "branchId": "uuid",
    "branchName": "SUMO Satelite",
    "visitsCount": 42,
    "pointsEarned": 42,
    "redemptionsCount": 7,
    "pointsRedeemed": 65,
    "newCustomers": 3,
    "voidedCount": 1
  }
}
```
