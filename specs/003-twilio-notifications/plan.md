# Implementation Plan: Flujo de Confirmación de Reservaciones vía WhatsApp

**Branch**: `feat/003-twilio-notifications` | **Date**: 2026-05-24 | **Spec**: [spec.md](spec.md)

---

## Summary

Implementar el flujo bidireccional de confirmación de reservaciones por WhatsApp: al crear una reservación el cliente recibe un acuse de "pendiente" y el encargado de la sucursal recibe una solicitud de aceptación/rechazo. El encargado responde con palabras clave (`ACEPTAR {folio}` / `RECHAZAR {folio}`). Si no responde en 30 min, el sistema reenvía; a los 60 min escala al número secundario; a los 120 min auto-cancela y notifica a los tres números involucrados. Todo el flujo es por WhatsApp via Twilio. Requiere ampliar el schema de DB (enum + columnas en `branches` y `reservations`), un webhook entrante de Twilio, un endpoint de cron protegido, y tres utilidades nuevas.

---

## Technical Context

**Language/Version**: TypeScript 5.9 en strict mode (Nuxt 3 / Node.js)
**Primary Dependencies**: Nuxt 3, Drizzle ORM, Zod, Twilio SDK (`pnpm add twilio`), Pino
**Storage**: Neon PostgreSQL — Drizzle ORM (neon serverless driver en producción, `pg` en local)
**Testing**: Vitest + `@nuxt/test-utils`. Mocks centralizados en `tests/mocks/`.
**Target Platform**: Vercel serverless + Vercel Cron
**Performance Goals**: Notificaciones enviadas en <10s post-creación de reservación
**Constraints**: Fallo de Twilio no cancela la reservación (graceful degradation). Todos los errors de mensajería se loggean. Funciones ≤30 líneas.
**Scale/Scope**: ~decenas de reservaciones/día por sucursal

---

## Constitution Check

| Principio | Estado | Notas |
|-----------|--------|-------|
| I. TypeScript strict, no `any`, Composition API | ✅ | Solo server-side, no hay componentes Vue en esta feature |
| II. Single Nuxt repo, transaccional en Neon | ✅ | Twilio es servicio externo, datos en Neon |
| III. Tests antes de implementación, mocks centralizados | ✅ | `tests/mocks/twilio.ts` requerido. Cobertura ≥80% en rutas |
| IV. Lighthouse 90+, SSR | N/A | Feature sin UI |
| V. Zod en todos los endpoints públicos, rate-limiting | ✅ | Webhook Twilio validado por firma. Cron por CRON_SECRET. |
| VI. Dark theme, mobile-first, Storybook | N/A | Feature sin UI |
| VII. Funciones ≤30 líneas, naming conventions, sin console.log | ✅ | Usar logger existente. Rutas en kebab-case. |
| VIII. Husky pre-commit/pre-push, Biome, commitlint | ✅ | Sin excepciones |
| IX. KISS — Twilio SDK explícitamente permitido | ✅ | Ninguna abstracción adicional |
| X. Absolute imports via aliases | ✅ | `@/server/`, `@/types/` |
| XI. Error handler centralizado, ExternalServiceError para Twilio | ✅ | Twilio failures → `ExternalServiceError`, logged, non-blocking |
| XII. CRON_SECRET en env.ts con Zod | ✅ | Agregar a schema con `.optional()` (no requerido en dev sin cron) |

**GATE**: ✅ Pasa todos los principios. Sin violaciones que justificar.

---

## Project Structure

### Documentation (esta feature)

```text
specs/003-twilio-notifications/
├── plan.md              # Este archivo
├── research.md          # Decisiones de diseño
├── data-model.md        # Schema changes y utilidades
├── quickstart.md        # Setup para desarrollo
├── contracts/
│   └── api.md           # Endpoints + contenido de mensajes
└── checklists/
    └── requirements.md  # Checklist de calidad de spec
```

### Source Code — cambios a la raíz del repo

```text
server/
├── api/
│   ├── cron/
│   │   └── reservation-timeouts.post.ts   ← NUEVO
│   ├── reservations/
│   │   └── index.post.ts                  ← MODIFICADO
│   └── webhooks/
│       └── twilio.post.ts                 ← NUEVO
├── db/
│   ├── migrations/
│   │   └── 0004_twilio_notifications.sql  ← NUEVO
│   └── schema.ts                          ← MODIFICADO
└── utils/
    ├── env.ts                             ← MODIFICADO
    ├── folio.ts                           ← NUEVO
    ├── twilio.ts                          ← NUEVO
    └── whatsapp-messages.ts               ← NUEVO

tests/
└── mocks/
    └── twilio.ts                          ← NUEVO

vercel.json                                ← NUEVO (cron config)
```

---

## Fases de Implementación

### Fase 1 — Schema y Migración

Objetivo: DB actualizada con todos los campos necesarios antes de escribir cualquier lógica.

1. Ampliar `reservationStatus` enum en `schema.ts`: agregar `rejected`, `escalated`, `cancelled_auto`.
2. Agregar columnas a `branches`: `whatsappReservaciones`, `whatsappReservacionesBackup`.
3. Agregar columnas a `reservations`: `folio` (varchar 8, unique, not null), `firstReminderAt`, `escalatedAt`.
4. Generar migración: `pnpm db:generate` → revisar SQL generado.
5. Aplicar: `pnpm db:migrate`.

Tests: Ninguno en esta fase (es DDL puro). Verificar con `pnpm db:studio`.

---

### Fase 2 — Utilidades Core

Objetivo: las tres utilidades nuevas con sus tests antes de usarlas en rutas.

**2a. `server/utils/folio.ts`**
- `generateFolio(id: string): string` — primeros 8 chars del UUID sin guiones, uppercase.
- Test: `folio.test.ts` — verifica longitud, uppercase, sin guiones, determinismo.

**2b. `server/utils/reservation-config.ts`**
- Exporta `reservationTimeouts` con `firstReminderMin`, `escalationMin`, `autoCancelMin`.
- Lee de `process.env` con defaults `30 / 30 / 60`.
- Test: `reservation-config.test.ts` — verifica defaults y override via `process.env`.

**2b. `tests/mocks/twilio.ts`**
- Mock del cliente Twilio: `vi.fn()` para `messages.create`.
- Exportar helper `resetTwilioMock()` para limpiar entre tests.

**2c. `server/utils/twilio.ts`**
- `normalizePhone(raw: string): string` — normaliza a E.164 +52.
- `sendWhatsAppMessage(to: string, body: string): Promise<void>` — envía via Twilio, lanza `ExternalServiceError` si falla.
- `verifyTwilioSignature(authToken, signature, url, params): boolean` — wrapper de `twilio.validateRequest`.
- Tests: `twilio.test.ts` — casos de normalización (10 dígitos, +52, con espacios), mock de `sendWhatsAppMessage`, verificación de firma con token inválido.

**2d. `server/utils/whatsapp-messages.ts`**
- Todas las funciones de templates listadas en `data-model.md`.
- Tests: `whatsapp-messages.test.ts` — cada función retorna string con los datos interpolados correctamente.

**2e. `server/utils/env.ts`** — agregar `CRON_SECRET: z.string().min(1).optional()`.

---

### Fase 3 — Modificar POST /api/reservations

Objetivo: al crear una reservación, disparar las notificaciones WhatsApp.

Cambios en `server/api/reservations/index.post.ts`:
1. Generar UUID en la aplicación (antes del INSERT): `const id = crypto.randomUUID()`.
2. Calcular `folio = generateFolio(id)`.
3. INSERT con `id` y `folio` explícitos.
4. Fetch de la sucursal para obtener `name`, `whatsappReservaciones`.
5. Llamar `sendWhatsAppMessage` al cliente y al encargado (en paralelo, con `Promise.allSettled`).
6. Loggear errores de envío; no propagar a la respuesta HTTP.

Tests: `index.post.test.ts` — verificar que la respuesta incluye `folio`, que `sendWhatsAppMessage` fue llamado 2 veces, que una falla de Twilio no retorna 5xx.

---

### Fase 4 — Webhook Twilio (Mensajes Entrantes)

Objetivo: procesar respuestas del encargado via WhatsApp.

`server/api/webhooks/twilio.post.ts`:
1. Leer `X-Twilio-Signature` del header.
2. Reconstruir el URL del webhook desde los headers de la request.
3. Parsear body (form-urlencoded) — `From`, `Body`.
4. Verificar firma. Si inválida → `403`.
5. Normalizar `from`, trim + uppercase `body`.
6. Parsear keyword y folio de `body`. Regex: `/^(ACEPTAR|RECHAZAR)\s+([A-Z0-9]{8})$/`.
7. Si no matchea → enviar `msgEncargadoKeywordInvalido(folio)`, responder `<Response/>`.
8. Buscar reservación por folio donde `status IN ('pending', 'escalated')`.
9. Si no encontrada → responder `<Response/>` (idempotencia).
10. Actualizar `status = confirmed | rejected`.
11. Enviar mensaje al cliente según resultado.
12. Responder `<Response/>` con Content-Type `text/xml`.

Tests: `twilio.post.test.ts` — firma inválida retorna 403, `ACEPTAR FOLIO` actualiza a confirmed y envía mensaje al cliente, `RECHAZAR FOLIO` actualiza a rejected, keyword inválido envía mensaje de ayuda, folio inexistente responde 200 sin crash.

---

### Fase 5 — Cron de Timeouts

Objetivo: procesar reservaciones con timeout sin intervención manual.

`server/api/cron/reservation-timeouts.post.ts`:
1. Verificar `Authorization: Bearer {CRON_SECRET}`. Si inválido → `401`.
2. Importar `reservationTimeouts` de `@/server/utils/reservation-config` — los tiempos vienen de variables de entorno con defaults `30 / 30 / 60`.
3. Query 1 (primer recordatorio): `status='pending'` AND `firstReminderAt IS NULL` AND `createdAt < now - FIRST_REMINDER_MIN min` → `sendWhatsAppMessage` al primario, `UPDATE firstReminderAt = now()`.
4. Query 2 (escalación): `status='pending'` AND `firstReminderAt < now - ESCALATION_MIN min` → `sendWhatsAppMessage` al primario + al secundario (si existe), `UPDATE status='escalated', escalatedAt = now()`.
5. Query 3 (auto-cancel): `status='escalated'` AND `escalatedAt < now - AUTO_CANCEL_MIN min` → enviar a los 3 números, `UPDATE status='cancelled_auto'`.
6. Retornar conteo de procesados por categoría.

`vercel.json`:
```json
{
  "crons": [
    {
      "path": "/api/cron/reservation-timeouts",
      "schedule": "*/15 * * * *"
    }
  ]
}
```

Tests: `reservation-timeouts.post.test.ts` — sin CRON_SECRET retorna 401, reservación con 35min sin respuesta dispara primer recordatorio, reservación escalada con 65min dispara auto-cancel, conteo correcto en respuesta.

---

## Orden de Implementación

```
Fase 1 (Schema)
    ↓
Fase 2 (Utilidades + tests)
    ↓
Fase 3 (POST /api/reservations + tests)
    ↓
Fase 4 (Webhook + tests)
    ↓
Fase 5 (Cron + tests + vercel.json)
```

Cada fase tiene sus tests colocados antes de la siguiente.
