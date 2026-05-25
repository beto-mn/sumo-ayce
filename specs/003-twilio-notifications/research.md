# Research: Flujo de Confirmación de Reservaciones vía WhatsApp

**Date**: 2026-05-24 | **Branch**: `feat/003-twilio-notifications`

---

## Decisión 1: SDK de Twilio vs. fetch directo

**Decision**: Usar el paquete npm `twilio` (Twilio SDK).

**Rationale**: La Constitution (IX) lo lista explícitamente como librería permitida. El SDK provee `validateRequest` para verificación de firma de webhooks entrantes — implementar HMAC-SHA1 manualmente son ~80 líneas. Para envío de mensajes también simplifica autenticación y construcción de parámetros.

**Alternatives considered**: `fetch` directo a la Twilio REST API — funciona pero requiere implementar la verificación de firma manualmente y construir los headers de autenticación Basic, sumando >100 líneas de boilerplate.

**Install**: `pnpm add twilio`

---

## Decisión 2: Mecanismo de asociación webhook → reservación (folio)

**Decision**: El mensaje al encargado incluye un folio corto (primeros 8 chars del UUID de la reservación, en mayúsculas). El encargado responde `ACEPTAR {folio}` o `RECHAZAR {folio}`. El webhook parsea ambas partes.

**Rationale**: Permite múltiples reservaciones pendientes para la misma sucursal sin ambigüedad. El folio es lo suficientemente corto para que el encargado lo copie fácilmente desde el mensaje.

**Alternatives considered**:
- Matching por número de teléfono a la reservación más reciente — frágil cuando hay múltiples pendientes simultáneamente.
- Links con tokens únicos — el flujo de confirmación es 100% WhatsApp, no aplica.
- Keyword simple sin folio — inviable con múltiples reservaciones pendientes.

**Implementation**: `folio = reservation.id.replace(/-/g, '').slice(0, 8).toUpperCase()` — generado al crear la reservación y almacenado en la columna `folio` de la tabla `reservations`.

---

## Decisión 3: Verificación de firma del webhook de Twilio

**Decision**: Verificar `X-Twilio-Signature` usando `twilio.validateRequest(authToken, signature, url, params)` antes de procesar cualquier mensaje entrante.

**Rationale**: Sin verificación, cualquier actor externo puede enviar POST falsos a `/api/webhooks/twilio` para cambiar el estado de reservaciones arbitrariamente. La firma usa HMAC-SHA1 sobre el URL completo + parámetros del body, firmado con el Auth Token.

**Implementation**: El handler necesita el URL público del webhook. Se construye desde los headers de la request (`x-forwarded-proto`, `host`, path). En desarrollo con ngrok, el URL público del túnel debe coincidir con el configurado en Twilio Console.

---

## Decisión 4: Templates de WhatsApp para producción

**Decision**: Para desarrollo/sandbox, usar mensajes de texto libre. Para producción, se requieren templates aprobados por WhatsApp antes del deployment.

**Rationale**: WhatsApp Business API solo permite mensajes de texto libre dentro de una ventana de 24h después de que el usuario escribe primero. Fuera de esa ventana (caso de todos los mensajes de esta feature — notificaciones outbound), se requieren Content Templates aprobados por Meta.

**Production requirement**: Antes del deployment a producción, registrar y aprobar en Twilio Content Library los templates correspondientes a cada tipo de mensaje (confirmación al cliente, solicitud al encargado, recordatorios, cancelación). El proceso toma entre 1-7 días hábiles.

**Development**: El Twilio WhatsApp Sandbox permite mensajes de texto libre sin templates aprobados. Suficiente para desarrollo y pruebas.

---

## Decisión 5: Timing de timeouts y mecanismo de cron

**Decision**: Cron en Vercel (`vercel.json` → `crons`) ejecuta `POST /api/cron/reservation-timeouts` cada 15 minutos. La lógica de timeouts es:

| Condición | Acción | Umbral |
|-----------|--------|--------|
| `status='pending'` AND `firstReminderAt IS NULL` AND `createdAt < now - 30min` | Primer reenvío al primario | T+30min |
| `status='pending'` AND `firstReminderAt IS NOT NULL` AND `firstReminderAt < now - 30min` | Escalación: reenvío al primario + aviso al secundario → status='escalated' | T+60min |
| `status='escalated'` AND `escalatedAt < now - 60min` | Auto-cancelación → status='cancelled_auto', aviso a los 3 números | T+120min |

**Rationale**: El intervalo de 15 min da una granularidad razonable con bajo costo de ejecución (Vercel Hobby: 1 ejecución/día; Pro: ilimitadas — este proyecto usa Pro a $20/mo). Los umbrales de 30/60/120 min son configurables vía constantes en el cron handler.

**Protection**: El endpoint de cron se protege con `Authorization: Bearer {CRON_SECRET}`. Vercel inyecta este header automáticamente cuando invoca el cron; se añade `CRON_SECRET` al schema de env.

---

## Decisión 6: Almacenamiento de logs de mensajes

**Decision**: No crear tabla de logs — usar logging estructurado con pino (ya existente en `server/utils/logger.ts`).

**Rationale**: La Constitution (IX, KISS) prohíbe abstracciones sin segunda necesidad concreta. Los logs de pino son suficientes para diagnóstico. Una tabla de `message_logs` agregaría complejidad y writes a la DB en cada notificación sin beneficio claro para v1.

**What gets logged**: por cada envío — `{ reservationId, folio, recipient: 'client'|'primary'|'secondary', messageType, status: 'sent'|'error', errorCode? }`.

---

## Decisión 7: Normalización de números de teléfono

**Decision**: Normalizar todos los números al formato E.164 (+52XXXXXXXXXX para México) en `server/utils/twilio.ts` antes de pasar a Twilio.

**Rationale**: Twilio requiere E.164. Los usuarios pueden ingresar `8112345678` (10 dígitos), `52 81 1234 5678`, o `+5281...`. Una función de normalización centralizada evita duplicar lógica.

**Implementation**: Strip non-digits → si tiene 10 dígitos y no empieza con `52`, prepend `+52`. Si tiene 12 y empieza con `52`, prepend `+`. Si ya tiene `+`, dejar como está. Para números del encargado almacenados en DB: normalizar al guardar en la sucursal.
