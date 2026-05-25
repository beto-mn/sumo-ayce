# Quickstart: Flujo de Confirmación de Reservaciones vía WhatsApp

**Branch**: `feat/003-twilio-notifications`

---

## Prerequisitos

- Docker Desktop corriendo (para la DB local)
- Cuenta de Twilio con WhatsApp Sandbox habilitado
- ngrok (o similar) para exponer el webhook localmente
- `.env.local` configurado (ver sección Variables de Entorno)
- `pnpm install` corrido tras agregar el SDK de Twilio

---

## 1. Instalar el SDK de Twilio

```bash
pnpm add twilio
```

---

## 2. Variables de Entorno

Agregar al `.env.local`:

```bash
# Ya existentes
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886   # número del sandbox de Twilio

# Nuevo
CRON_SECRET=un-secreto-local-para-dev           # cualquier string en desarrollo

# Timeouts de reservación (opcionales — defaults: 30 / 30 / 60 minutos)
# RESERVATION_FIRST_REMINDER_MIN=30
# RESERVATION_ESCALATION_MIN=30
# RESERVATION_AUTO_CANCEL_MIN=60
```

El número del sandbox de Twilio Sandbox es siempre `+14155238886` para cuentas en prueba.

---

## 3. Configurar Twilio WhatsApp Sandbox

1. Ir a [Twilio Console → Messaging → Try it out → Send a WhatsApp message](https://console.twilio.com/us1/develop/sms/try-it-out/whatsapp-learn)
2. Conectar tu número personal al sandbox enviando el código indicado al número del sandbox
3. Repetir para el número del "encargado" (puede ser otro dispositivo o el mismo)

---

## 4. Aplicar migraciones de DB

```bash
docker compose up -d        # levantar PostgreSQL local
pnpm db:migrate             # aplicar 0004_twilio_notifications.sql
```

Verificar en Drizzle Studio (`pnpm db:studio`):
- Tabla `branches`: columnas `whatsapp_reservaciones`, `whatsapp_reservaciones_backup`
- Tabla `reservations`: columnas `folio`, `first_reminder_at`, `escalated_at`
- Enum `reservation_status`: incluye `rejected`, `escalated`, `cancelled_auto`

---

## 5. Registrar una sucursal con número de WhatsApp

Insertar directamente en la DB (vía Drizzle Studio o psql):

```sql
UPDATE branches
SET 
  whatsapp_reservaciones = '+521234567890',
  whatsapp_reservaciones_backup = '+529876543210'
WHERE name = 'Sucursal de prueba';
```

O usar el endpoint de gestión de sucursales cuando esté disponible.

---

## 6. Exponer el webhook con ngrok

```bash
ngrok http 3000
```

Ngrok genera un URL público como `https://abc123.ngrok.io`. Anotar ese URL.

---

## 7. Configurar el webhook en Twilio Console

1. Ir a Twilio Console → Messaging → Settings → WhatsApp Sandbox Settings
2. En "When a message comes in", colocar:
   ```
   https://abc123.ngrok.io/api/webhooks/twilio
   ```
3. Método: `HTTP POST`
4. Guardar

> **Nota**: el URL de ngrok cambia cada vez que reinicias. Repetir el paso 7 después de cada reinicio de ngrok.

---

## 8. Correr el servidor de desarrollo

```bash
pnpm dev
```

Servidor en `http://localhost:3000`.

---

## 9. Probar el flujo completo

### Paso 1 — Crear una reservación

```bash
curl -X POST http://localhost:3000/api/v1/reservations \
  -H "Content-Type: application/json" \
  -d '{
    "branchId": "<uuid-de-sucursal>",
    "contactName": "Juan Pérez",
    "contactPhone": "8112345678",
    "partySize": 4,
    "reservationDate": "2026-07-01",
    "reservationTime": "19:00"
  }'
```

**Esperado**: respuesta 201 con `folio` en el data. El número del cliente y el del encargado deben recibir WhatsApp.

### Paso 2 — Aceptar la reservación

Desde el WhatsApp del "encargado", enviar al número del sandbox:
```
ACEPTAR {FOLIO}
```

**Esperado**: el cliente recibe confirmación con datos + condiciones.

### Paso 3 — Probar rechazo

Crear otra reservación y responder:
```
RECHAZAR {FOLIO}
```

**Esperado**: el cliente recibe mensaje de no disponibilidad.

### Paso 4 — Probar el cron manualmente

```bash
curl -X POST http://localhost:3000/api/cron/reservation-timeouts \
  -H "Authorization: Bearer un-secreto-local-para-dev"
```

**Esperado**: respuesta con conteo de reservaciones procesadas. Para ver el cron en acción, crear una reservación y modificar `createdAt` en la DB a 35 minutos atrás.

---

## 10. Correr las pruebas

```bash
pnpm test
```

Los tests de la integración Twilio usan el mock centralizado en `tests/mocks/twilio.ts` — no se hacen llamadas reales a Twilio en el test suite.

---

## Consideraciones para Producción

1. **Templates de WhatsApp aprobados**: Antes de deployment, registrar y aprobar en [Twilio Content Library](https://console.twilio.com/us1/develop/sms/content-template-builder) todos los templates de mensajes. El proceso tarda 1-7 días hábiles con Meta.
2. **Número de WhatsApp dedicado**: En producción, reemplazar el sandbox por un número de WhatsApp Business verificado.
3. **`CRON_SECRET`**: Vercel lo inyecta automáticamente — no es necesario configurarlo manualmente en las variables de entorno de Vercel.
4. **`vercel.json`**: Configurar el cron job para que se ejecute cada 15 minutos (ver `vercel.json` en la raíz del proyecto).
