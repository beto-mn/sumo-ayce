# API Contracts: Flujo de Confirmación de Reservaciones vía WhatsApp

**Date**: 2026-05-24 | **Branch**: `feat/003-twilio-notifications`

---

## Endpoints Existentes (comportamiento modificado)

### POST /api/reservations

Crea una nueva reservación. **Cambio**: después del INSERT, dispara las notificaciones de WhatsApp de forma asíncrona (sin bloquear la respuesta HTTP).

**Request** (sin cambios):
```json
{
  "branchId": "uuid",
  "contactName": "string (1-100)",
  "contactPhone": "string (1-20)",
  "partySize": "integer > 0",
  "reservationDate": "YYYY-MM-DD",
  "reservationTime": "HH:MM",
  "notes": "string (opcional)"
}
```

**Response 201** (ampliada con `folio`):
```json
{
  "ok": true,
  "data": {
    "id": "uuid",
    "folio": "A3F9B21C",
    "branchId": "uuid",
    "contactName": "string",
    "contactPhone": "string",
    "partySize": 4,
    "reservationDate": "2026-07-01",
    "reservationTime": "19:00",
    "status": "pending",
    "notes": null,
    "createdAt": "ISO timestamp",
    "updatedAt": "ISO timestamp"
  }
}
```

**Comportamiento post-creación**:
1. INSERT reservación con folio generado.
2. Fetch de la sucursal para obtener `name`, `whatsappReservaciones`.
3. Enviar `msgClientePendiente` al cliente.
4. Enviar `msgEncargadoSolicitud` al número primario de la sucursal.
5. Si cualquier envío falla → log de error + `ExternalServiceError` registrado, pero la respuesta HTTP sigue siendo 201.

---

## Endpoints Nuevos

### POST /api/webhooks/twilio

Recibe mensajes entrantes de WhatsApp via Twilio. **No requiere autenticación de la app** — se verifica la firma de Twilio en cambio.

**Seguridad**: Valida `X-Twilio-Signature` con `twilio.validateRequest`. Si la firma es inválida → `403 Forbidden`.

**Request** (form-urlencoded, enviado por Twilio):
```
From=whatsapp%3A%2B5281XXXXXXXX
To=whatsapp%3A%2B19XXXXXXXXX
Body=ACEPTAR+A3F9B21C
```

Campos relevantes:
| Campo | Descripción |
|-------|-------------|
| `From` | Número del encargado que respondió (formato `whatsapp:+52...`) |
| `Body` | Texto del mensaje |

**Lógica**:
1. Extraer `from` (normalizado a E.164) y `body` (trim, uppercase).
2. Parsear `body` → keyword (`ACEPTAR`/`RECHAZAR`) + folio.
3. Si no se reconoce el formato → enviar `msgEncargadoKeywordInvalido` y responder 200.
4. Buscar reservación por `folio` con `status IN ('pending', 'escalated')`.
5. Si no se encuentra o ya tiene estado terminal → ignorar, responder 200.
6. Actualizar `status` según keyword → `confirmed` o `rejected`.
7. Enviar mensaje al cliente según resultado.
8. Responder 200 (Twilio espera 200 independientemente del resultado de negocio).

**Response** (Twilio ignora el body, solo espera HTTP 200):
```xml
<?xml version="1.0" encoding="UTF-8"?>
<Response/>
```

---

### POST /api/cron/reservation-timeouts

Procesa reservaciones con timeouts pendientes. Invocado por Vercel Cron cada 15 minutos.

**Seguridad**: Valida `Authorization: Bearer {CRON_SECRET}`. Si falta o es inválido → `401`.

**Request**: body vacío.

**Lógica** (en orden, sobre reservaciones no terminales):

1. **Primer recordatorio** (T+30min):
   - Buscar: `status='pending'` AND `firstReminderAt IS NULL` AND `createdAt < now() - 30min`
   - Por cada resultado: enviar `msgEncargadoRecordatorio` al primario → set `firstReminderAt = now()`

2. **Escalación** (T+60min):
   - Buscar: `status='pending'` AND `firstReminderAt IS NOT NULL` AND `firstReminderAt < now() - 30min`
   - Por cada resultado:
     - Enviar `msgEncargadoRecordatorio` al primario
     - Si `whatsappReservacionesBackup` existe → enviar `msgSecundarioEscalacion`
     - Set `status='escalated'`, `escalatedAt = now()`

3. **Cancelación automática** (T+120min):
   - Buscar: `status='escalated'` AND `escalatedAt < now() - 60min`
   - Por cada resultado:
     - Enviar `msgClienteCanceladoAuto` al cliente
     - Enviar `msgEncargadoCanceladoAuto` al primario
     - Si `whatsappReservacionesBackup` existe → enviar `msgEncargadoCanceladoAuto` al secundario
     - Set `status='cancelled_auto'`

**Response 200**:
```json
{
  "ok": true,
  "data": {
    "processed": {
      "firstReminder": 2,
      "escalated": 1,
      "cancelledAuto": 0
    }
  }
}
```

---

## Mensajes de WhatsApp — Contenido

### Al cliente — reservación pendiente
```
🍣 *SUMO All You Can Eat*

Hola {nombre}, recibimos tu solicitud de reservación.

📍 Sucursal: {sucursal}
📅 Fecha: {fecha}
🕐 Hora: {hora}
👥 Personas: {partySize}

En breve te confirmamos si hay disponibilidad. ¡Gracias por preferirnos!
```

### Al encargado — solicitud de reservación
```
🍣 *SUMO — Nueva Reservación*

*Folio:* {folio}
*Cliente:* {nombre}
*Teléfono:* {telefono}
*Sucursal:* {sucursal}
*Fecha:* {fecha}
*Hora:* {hora}
*Personas:* {partySize}

Para responder escribe:
✅ ACEPTAR {folio}
❌ RECHAZAR {folio}
```

### Al cliente — confirmada
```
✅ *Reservación Confirmada — SUMO*

¡Tu reservación está confirmada, {nombre}!

📍 Sucursal: {sucursal}
📅 Fecha: {fecha}
🕐 Hora: {hora}
👥 Personas: {partySize}

*Condiciones:*
• Se aceptará un máximo de 15 minutos de tolerancia
• En caso de no presentarse, la reservación será liberada
• Si necesitas cancelar, contáctanos directamente a la sucursal

¡Te esperamos!
```

### Al cliente — rechazada
```
❌ *SUMO All You Can Eat*

Hola {nombre}, lamentamos informarte que en este momento la sucursal *{sucursal}* no tiene disponibilidad para tu reservación el {fecha} a las {hora}.

Puedes:
• Visitar la sucursal para verificar disponibilidad directamente
• Intentar reservar en otra de nuestras sucursales

¡Gracias por tu comprensión!
```

### Al encargado — recordatorio (primer y segundo reenvío)
```
🔔 *Recordatorio — Reservación Pendiente*

*Folio:* {folio}
Aún está pendiente la siguiente reservación:

*Cliente:* {nombre}
*Fecha:* {fecha} · {hora}
*Personas:* {partySize}

Responde:
✅ ACEPTAR {folio}
❌ RECHAZAR {folio}
```

### Al secundario — escalación
```
⚠️ *SUMO — Alerta Reservación Sin Respuesta*

La siguiente reservación lleva más de 30 minutos sin respuesta en el número principal:

*Folio:* {folio}
*Sucursal:* {sucursal}
*Cliente:* {nombre}
*Fecha:* {fecha} · {hora}
*Personas:* {partySize}

Por favor verificar con el encargado de sucursal.
```

### Al cliente — cancelada automáticamente
```
ℹ️ *SUMO All You Can Eat*

Hola {nombre}, lamentamos informarte que tu reservación (Folio: {folio}) en la sucursal *{sucursal}* fue cancelada automáticamente por no recibir confirmación a tiempo.

Puedes:
• Hacer una nueva reservación
• Visitar la sucursal directamente

Disculpa los inconvenientes.
```

### Al encargado (primario y secundario) — cancelada automáticamente
```
ℹ️ *SUMO — Reservación Cancelada Automáticamente*

La reservación *{folio}* fue cancelada automáticamente por falta de respuesta.

*Cliente:* {nombre} · {telefono}
*Fecha:* {fecha} · {hora}
*Personas:* {partySize}
```

### Al encargado — keyword no reconocido
```
❓ No reconocí tu respuesta.

Para aceptar: ACEPTAR {folio}
Para rechazar: RECHAZAR {folio}

El folio aparece en el mensaje de la reservación.
```
