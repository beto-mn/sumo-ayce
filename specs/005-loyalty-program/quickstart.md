# Quickstart: Loyalty Program

**Branch**: `feat/005-loyalty-program` | **Date**: 2026-05-26

## Prerequisites

```bash
# .env.local debe tener las variables de feat/001–004 más las nuevas:
LOYALTY_POINTS_PER_VISIT=10
```

## Setup: Migración de schema

```bash
pnpm drizzle-kit generate
pnpm drizzle-kit migrate
```

## Scenario 1 — Registrar nuevo cliente

```bash
curl -s -X POST http://localhost:3000/api/v1/loyalty/customers \
  -H "Content-Type: application/json" \
  -d '{"name":"Ana García","phone":"5512345678","whatsappOptIn":true}' | jq .
```

**Esperado**: `201`, `data.pointsBalance=0`. WhatsApp de bienvenida enviado.

## Scenario 2 — Registrar mismo teléfono (duplicado)

```bash
curl -s -X POST http://localhost:3000/api/v1/loyalty/customers \
  -H "Content-Type: application/json" \
  -d '{"name":"Ana García","phone":"5512345678"}' | jq .
```

**Esperado**: `409`, devuelve perfil existente sin crear duplicado.

## Scenario 3 — Registrar visita y ganar puntos

```bash
# Requiere branchId y staffId válidos de la BD
curl -s -X POST http://localhost:3000/api/v1/loyalty/transactions \
  -H "Content-Type: application/json" \
  -d '{"phone":"5512345678","branchId":"<uuid-sucursal>","ticketId":"T-001","staffId":"<uuid-staff>"}' | jq .
```

**Esperado**: `201`, `data.pointsDelta=10`, `data.newBalance=10`. WhatsApp enviado con saldo. Si el saldo alcanza para alguna recompensa, se envía un segundo WhatsApp listando qué puede canjear (sin código).

## Scenario 4 — Consultar catálogo de recompensas

```bash
curl -s http://localhost:3000/api/v1/loyalty/rewards | jq .
```

**Esperado**: `200`, array de recompensas activas ordenadas por `pointsCost ASC`.

## Scenario 5 — Consultar perfil de cliente (staff)

```bash
curl -s "http://localhost:3000/api/v1/loyalty/customers/5512345678" | jq .
```

**Esperado**: `200`, `data.pointsBalance` actualizado, `data.transactions` con historial.

## Scenario 6 — Canjear recompensa

El mesero consulta al cliente, selecciona la recompensa en el portal y la procesa en un solo paso.

```bash
curl -s -X POST http://localhost:3000/api/v1/loyalty/redemptions \
  -H "Content-Type: application/json" \
  -d '{"phone":"5512345678","rewardId":"<uuid-reward>","branchId":"<uuid-sucursal>","ticketId":"T-00421","staffId":"<uuid-staff>"}' | jq .
```

**Esperado**: `201`, `data.status=used`, `data.ticketId=T-00421`, `data.usedAt` presente, `data.remainingBalance` actualizado. WhatsApp enviado al cliente con nombre de recompensa y saldo restante.

## Scenario 7 — Intentar canjear con puntos insuficientes

```bash
curl -s -X POST http://localhost:3000/api/v1/loyalty/redemptions \
  -H "Content-Type: application/json" \
  -d '{"phone":"5512345678","rewardId":"<uuid-reward-caro>","branchId":"<uuid>","ticketId":"T-00422","staffId":"<uuid-staff>"}' | jq .
```

**Esperado**: `422 Unprocessable`, mensaje de puntos insuficientes.

## Scenario 8 — WhatsApp SALDO (simular webhook)

```bash
# Simular mensaje entrante de Twilio (sin verificación de firma en dev)
curl -s -X POST http://localhost:3000/api/webhooks/twilio \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "From=whatsapp%3A%2B5215512345678&Body=saldo"
```

**Esperado**: TwiML vacío como respuesta HTTP. Cliente recibe WhatsApp con saldo.

## Validación final

```bash
pnpm test                    # Todos los tests nuevos pasan
pnpm typecheck               # Sin errores TypeScript
```
