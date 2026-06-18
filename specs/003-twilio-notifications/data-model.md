# Data Model: Flujo de Confirmación de Reservaciones vía WhatsApp

**Date**: 2026-05-24 | **Branch**: `feat/003-twilio-notifications`

---

## Schema Changes

### `reservationStatus` — Enum ampliado

El enum existente (`pending`, `confirmed`, `cancelled`) se amplía con tres estados nuevos para modelar el flujo completo:

```ts
// server/db/schema.ts
export const reservationStatus = pgEnum('reservation_status', [
  'pending',       // recién creada, esperando respuesta del encargado
  'confirmed',     // encargado aceptó
  'rejected',      // encargado rechazó  ← NUEVO
  'cancelled',     // cancelación manual (futuro)
  'escalated',     // timeout: secundario notificado ← NUEVO
  'cancelled_auto', // timeout total: auto-cancelada, 3 números avisados ← NUEVO
])
```

**Migración SQL**:
```sql
ALTER TYPE "reservation_status" ADD VALUE 'rejected';
ALTER TYPE "reservation_status" ADD VALUE 'escalated';
ALTER TYPE "reservation_status" ADD VALUE 'cancelled_auto';
```

> Nota: PostgreSQL permite agregar valores a un enum existente sin recrearlo. No se requiere migración destructiva.

---

### `branches` — Números de WhatsApp

Dos columnas nuevas, ambas opcionales:

```ts
// server/db/schema.ts — tabla branches
whatsappReservaciones: varchar('whatsapp_reservaciones', { length: 20 }),
whatsappReservacionesBackup: varchar('whatsapp_reservaciones_backup', { length: 20 }),
```

| Campo | Tipo | Nullable | Descripción |
|-------|------|----------|-------------|
| `whatsapp_reservaciones` | varchar(20) | sí | Número primario que recibe solicitudes de reservación y responde ACEPTAR/RECHAZAR |
| `whatsapp_reservaciones_backup` | varchar(20) | sí | Número secundario que recibe alertas de escalación y cancelación automática |

Ambos se almacenan en formato E.164 (`+52XXXXXXXXXX`). La normalización ocurre al insertar/actualizar la sucursal.

**Migración SQL**:
```sql
ALTER TABLE "branches"
  ADD COLUMN "whatsapp_reservaciones" varchar(20),
  ADD COLUMN "whatsapp_reservaciones_backup" varchar(20);
```

---

### `reservations` — Folio y timestamps de timeout

Tres columnas nuevas:

```ts
// server/db/schema.ts — tabla reservations
folio: varchar('folio', { length: 8 }).notNull().unique(),
firstReminderAt: timestamp('first_reminder_at'),
escalatedAt: timestamp('escalated_at'),
```

| Campo | Tipo | Nullable | Descripción |
|-------|------|----------|-------------|
| `folio` | varchar(8) | no | Identificador corto legible (ej. `A3F9B21C`). El encargado lo usa para responder: `ACEPTAR A3F9B21C`. |
| `first_reminder_at` | timestamp | sí | Momento en que se envió el primer reenvío al número primario (T+30min). `NULL` = aún no se reenvió. |
| `escalated_at` | timestamp | sí | Momento en que se notificó al número secundario (T+60min). `NULL` = no escalada. |

**Generación de folio**: primeros 8 caracteres del UUID de la reservación sin guiones, en mayúsculas.
```ts
const folio = id.replace(/-/g, '').slice(0, 8).toUpperCase()
```

**Migración SQL**:
```sql
ALTER TABLE "reservations"
  ADD COLUMN "folio" varchar(8) NOT NULL UNIQUE,
  ADD COLUMN "first_reminder_at" timestamptz,
  ADD COLUMN "escalated_at" timestamptz;
```

> Nota: `folio` es `NOT NULL` pero se genera en la aplicación, no en la DB. Al insertar una reservación, se calcula el folio del UUID generado antes del INSERT, o se hace un UPDATE inmediato después del INSERT.

**Estrategia recomendada** (evitar dos queries): generar el UUID en la aplicación (`crypto.randomUUID()`), calcular el folio, e insertar ambos en el mismo INSERT.

---

## Estado de la Reservación — Máquina de Estados

```
                    ┌─────────────────┐
                    │    PENDING      │ ← estado inicial al crear
                    └────────┬────────┘
                             │
              ┌──────────────┼──────────────┐
              │              │              │
         ACEPTA         RECHAZA        T+30min sin respuesta
              │              │              │
              ▼              ▼              ▼
        CONFIRMED       REJECTED    firstReminderAt = now
                                   (sigue en PENDING)
                                          │
                                    T+60min sin respuesta
                                    (desde firstReminderAt)
                                          │
                                          ▼
                                      ESCALATED
                                     escalatedAt = now
                                          │
                                    T+120min sin respuesta
                                    (desde escalatedAt)
                                          │
                                          ▼
                                   CANCELLED_AUTO
```

Estados terminales (inmutables): `CONFIRMED`, `REJECTED`, `CANCELLED_AUTO`
Estado `CANCELLED` queda reservado para cancelaciones manuales futuras por el cliente.

---

## Nuevas Utilidades del Servidor

### `server/utils/folio.ts`
Genera el folio a partir de un UUID.

### `server/utils/reservation-config.ts`
Lee y exporta los timeouts como números desde las variables de entorno, con defaults.

### `server/utils/twilio.ts`
- Cliente Twilio singleton
- `sendWhatsAppMessage(to: string, body: string): Promise<void>`
- `normalizePhone(raw: string): string` — normaliza a E.164 +52
- `verifyTwilioSignature(authToken, signature, url, params): boolean`

### `server/utils/whatsapp-messages.ts`
Funciones que retornan el texto de cada mensaje:

| Función | Destinatario | Trigger |
|---------|-------------|---------|
| `msgClientePendiente(data)` | Cliente | Reservación creada |
| `msgEncargadoSolicitud(data)` | Primario | Reservación creada |
| `msgClienteConfirmado(data)` | Cliente | Encargado aceptó |
| `msgClienteRechazado(data)` | Cliente | Encargado rechazó |
| `msgEncargadoKeywordInvalido(folio)` | Primario | Respuesta no reconocida |
| `msgEncargadoRecordatorio(data)` | Primario | T+30min y T+60min |
| `msgSecundarioEscalacion(data)` | Secundario | T+60min |
| `msgClienteCanceladoAuto(data)` | Cliente | T+120min |
| `msgEncargadoCanceladoAuto(data)` | Primario + Secundario | T+120min |

---

## Nuevas Variables de Entorno

| Variable | Requerida | Default | Descripción |
|----------|-----------|---------|-------------|
| `CRON_SECRET` | Sí (producción) | — | Token que Vercel inyecta en llamadas a endpoints de cron. Se valida con `Authorization: Bearer {CRON_SECRET}`. |
| `RESERVATION_FIRST_REMINDER_MIN` | No | `30` | Minutos desde la creación hasta enviar el primer reenvío al encargado primario. |
| `RESERVATION_ESCALATION_MIN` | No | `30` | Minutos desde el primer reenvío hasta escalar al número secundario. |
| `RESERVATION_AUTO_CANCEL_MIN` | No | `60` | Minutos desde la escalación hasta la cancelación automática. |

`TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_WHATSAPP_NUMBER` ya están en `server/utils/env.ts`.

### Archivo de configuración de timeouts

Para centralizar el acceso a estos valores, se crea `server/utils/reservation-config.ts`:

```ts
export const reservationTimeouts = {
  firstReminderMin: parseInt(process.env.RESERVATION_FIRST_REMINDER_MIN ?? '30', 10),
  escalationMin:    parseInt(process.env.RESERVATION_ESCALATION_MIN    ?? '30', 10),
  autoCancelMin:    parseInt(process.env.RESERVATION_AUTO_CANCEL_MIN   ?? '60', 10),
}
```

Línea de tiempo con defaults (total ~2 horas desde la creación):

```
T+0   → Creación: cliente y encargado notificados
T+30  → Primer reenvío al primario            (firstReminderMin)
T+60  → Escalación: reenvío + aviso secundario (firstReminderMin + escalationMin)
T+120 → Cancelación automática                (+ autoCancelMin)
```

El cliente puede cambiar estos valores desde el panel de Vercel → Environment Variables sin necesidad de un nuevo deploy de código.

---

## Archivos Nuevos y Modificados

```
server/
├── api/
│   ├── cron/
│   │   └── reservation-timeouts.post.ts   ← NUEVO
│   ├── reservations/
│   │   └── index.post.ts                  ← MODIFICADO (agrega WhatsApp post-insert)
│   └── webhooks/
│       └── twilio.post.ts                 ← NUEVO
├── db/
│   ├── migrations/
│   │   └── 0004_twilio_notifications.sql  ← NUEVO
│   └── schema.ts                          ← MODIFICADO
└── utils/
    ├── env.ts                             ← MODIFICADO (CRON_SECRET)
    ├── folio.ts                           ← NUEVO
    ├── reservation-config.ts              ← NUEVO (timeouts configurables)
    ├── twilio.ts                          ← NUEVO
    └── whatsapp-messages.ts               ← NUEVO

tests/
└── mocks/
    └── twilio.ts                          ← NUEVO (mock centralizado)

vercel.json                                ← NUEVO o MODIFICADO (cron config)
```
