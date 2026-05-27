# Quickstart: Loyalty Program

**Branch**: `feat/005-loyalty-program` | **Date**: 2026-05-26

## Prerequisites

```bash
# .env.local debe tener las variables de feat/001–004 más las nuevas:
LOYALTY_POINTS_PER_VISIT=10
LOYALTY_REDEMPTION_EXPIRY_HOURS=72
```

## Setup: Migración de schema

```bash
# Agregar columna 'code' a redemptions
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
# Requiere branchId válido de la BD
curl -s -X POST http://localhost:3000/api/v1/loyalty/transactions \
  -H "Content-Type: application/json" \
  -d '{"phone":"5512345678","branchId":"<uuid-sucursal>"}' | jq .
```

**Esperado**: `201`, `data.pointsDelta=10`, `data.newBalance=10`. WhatsApp enviado con saldo.

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

```bash
curl -s -X POST http://localhost:3000/api/v1/loyalty/redemptions \
  -H "Content-Type: application/json" \
  -d '{"phone":"5512345678","rewardId":"<uuid-reward>","branchId":"<uuid-sucursal>"}' | jq .
```

**Esperado**: `201`, `data.code` de 8 chars, `data.status=pending`. WhatsApp con código enviado.

## Scenario 7 — Intentar canjear con puntos insuficientes

```bash
curl -s -X POST http://localhost:3000/api/v1/loyalty/redemptions \
  -H "Content-Type: application/json" \
  -d '{"phone":"5512345678","rewardId":"<uuid-reward-caro>","branchId":"<uuid>"}' | jq .
```

**Esperado**: `422 Unprocessable`, mensaje de puntos insuficientes.

## Scenario 8 — Marcar canje como usado

```bash
curl -s -X PATCH "http://localhost:3000/api/v1/loyalty/redemptions/<redemption-id>/use" \
  -H "Content-Type: application/json" \
  -d '{}' | jq .
```

**Esperado**: `200`, `data.status=used`, `data.usedAt` presente.

## Scenario 9 — WhatsApp SALDO (simular webhook)

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
