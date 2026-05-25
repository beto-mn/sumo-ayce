# Tasks: Flujo de Confirmación de Reservaciones vía WhatsApp

**Input**: Design documents from `specs/003-twilio-notifications/`
**Branch**: `feat/003-twilio-notifications`
**Prerequisites**: plan.md ✅ · spec.md ✅ · research.md ✅ · data-model.md ✅ · contracts/api.md ✅

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Puede correr en paralelo (archivos distintos, sin dependencias incompletas)
- **[Story]**: User story al que pertenece la tarea (US1–US5)
- Todos los paths son relativos al root del repositorio

---

## Phase 1: Setup

**Purpose**: Preparar dependencias antes de tocar cualquier archivo de código.

- [x] T001 Add Twilio SDK dependency — run `pnpm add twilio` and verify `package.json` updated

**Checkpoint**: `node_modules/twilio` existe y `pnpm typecheck` pasa.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Schema de DB y utilidades core. Ninguna user story puede implementarse sin esta fase.

**⚠️ CRITICAL**: No iniciar ningún user story hasta completar T002–T010.

### Schema y Migración

- [x] T002 Update `server/db/schema.ts` — (a) expand `reservationStatus` pgEnum adding `'rejected'`, `'escalated'`, `'cancelled_auto'`; (b) add `whatsappReservaciones: varchar(20)` and `whatsappReservacionesBackup: varchar(20)` to `branches` table; (c) add `folio: varchar(8).notNull().unique()`, `firstReminderAt: timestamp`, `escalatedAt: timestamp` to `reservations` table
- [x] T003 Generate DB migration — run `pnpm db:generate`, verify the SQL in `server/db/migrations/` includes ALTER TYPE, ALTER TABLE branches, ALTER TABLE reservations
- [x] T004 Apply DB migration — run `pnpm db:migrate`, verify schema in Drizzle Studio (`pnpm db:studio`): enum has 6 values, branches has 2 new columns, reservations has 3 new columns

### Core Utilities

- [x] T005 [P] Create `tests/mocks/twilio.ts` — export `mockTwilioClient` with `messages.create` as `vi.fn()`, export `resetTwilioMock()` helper, export `vi.mock('twilio', ...)` factory
- [x] T006 [P] Create `server/utils/folio.ts` — export `generateFolio(id: string): string` returning first 8 chars of UUID (no dashes, uppercase); create `tests/server/utils/folio.test.ts` verifying length=8, all uppercase, no dashes, determinism
- [x] T007 [P] Create `server/utils/reservation-config.ts` — export `reservationTimeouts` object reading `RESERVATION_FIRST_REMINDER_MIN` (default 30), `RESERVATION_ESCALATION_MIN` (default 30), `RESERVATION_AUTO_CANCEL_MIN` (default 60) from `process.env` parsed as integers; create `tests/server/utils/reservation-config.test.ts` verifying defaults and env override
- [x] T008 [P] Create `server/utils/whatsapp-messages.ts` — implement all 9 message template functions from `contracts/api.md`: `msgClientePendiente`, `msgEncargadoSolicitud`, `msgClienteConfirmado`, `msgClienteRechazado`, `msgEncargadoKeywordInvalido`, `msgEncargadoRecordatorio`, `msgSecundarioEscalacion`, `msgClienteCanceladoAuto`, `msgEncargadoCanceladoAuto`; create `tests/server/utils/whatsapp-messages.test.ts` verifying each function interpolates all required data fields
- [x] T009 Update `server/utils/env.ts` — add `CRON_SECRET: z.string().min(1).optional()` to the Zod schema
- [x] T010 Create `server/utils/twilio.ts` — implement `normalizePhone(raw: string): string` (E.164 +52 normalization per research.md), `sendWhatsAppMessage(to: string, body: string): Promise<void>` (throws `ExternalServiceError` on failure), `verifyTwilioSignature(authToken: string, signature: string, url: string, params: Record<string, string>): boolean`; create `tests/server/utils/twilio.test.ts` with mock from T005 verifying: phone normalization cases (10-digit, +52, with spaces), send success, send throws ExternalServiceError on Twilio error, invalid signature returns false (depends on T005)

**Checkpoint**: `pnpm test` pasa para todos los archivos de T006–T010. Foundation lista para user stories.

---

## Phase 3: US1 — Cliente y encargado notificados al crear reservación (Priority: P1) 🎯 MVP

**Goal**: Al hacer POST /api/v1/reservations, el cliente recibe acuse de "pendiente" y el encargado recibe solicitud de aceptación/rechazo. La reservación se guarda aunque Twilio falle.

**Independent Test**: Crear reservación via curl, verificar respuesta incluye `folio`, y que ambos WhatsApp llegan (o los logs muestran el intento si no hay Twilio configurado).

- [x] T011 [US1] Update `tests/server/api/v1/reservations/index.post.test.ts` — add test cases: (a) response data includes `folio` field with 8-char string; (b) `sendWhatsAppMessage` called twice (client + branch) after successful insert; (c) Twilio failure does not cause 5xx — still returns 201; (d) branch without `whatsappReservaciones` still returns 201 (mock second DB select returning branch without whatsapp field)
- [x] T012 [US1] Modify `server/api/v1/reservations/index.post.ts` — (a) pre-generate `const id = crypto.randomUUID()` and `const folio = generateFolio(id)`; (b) INSERT with explicit `id` and `folio`; (c) fetch branch with `name` and `whatsappReservaciones`; (d) call `sendWhatsAppMessage` for client and branch in parallel via `Promise.allSettled`; (e) log errors via logger, never rethrow; imports from `@/server/utils/folio`, `@/server/utils/twilio`, `@/server/utils/whatsapp-messages`

**Checkpoint**: `pnpm test` pasa T011. POST /api/v1/reservations retorna `folio` en la respuesta. Twilio mock muestra 2 llamadas.

---

## Phase 4: US2 + US3 — Encargado acepta o rechaza via WhatsApp (Priority: P1)

**Goal**: El webhook procesa la respuesta `ACEPTAR {folio}` / `RECHAZAR {folio}` del encargado, actualiza el estado de la reservación y notifica al cliente con el resultado.

**Independent Test**: Enviar POST a `/api/webhooks/twilio` con firma válida y body `ACEPTAR {folio}` — verificar DB cambia a `confirmed` y cliente recibe mensaje de confirmación.

- [x] T013 [P] [US2] [US3] Create `tests/server/api/webhooks/twilio.post.test.ts` — test cases: (a) missing/invalid `X-Twilio-Signature` → 403; (b) `ACEPTAR {folio}` with valid signature → status=`confirmed`, `sendWhatsAppMessage` called with `msgClienteConfirmado`; (c) `RECHAZAR {folio}` with valid signature → status=`rejected`, `sendWhatsAppMessage` called with `msgClienteRechazado`; (d) unrecognized keyword → `sendWhatsAppMessage` with `msgEncargadoKeywordInvalido`, returns 200; (e) unknown folio → returns 200 no crash; (f) folio with terminal status (`confirmed`) → ignored, no DB update, returns 200
- [x] T014 [US2] [US3] Create `server/api/webhooks/twilio.post.ts` — (a) read `X-Twilio-Signature` header; (b) reconstruct full webhook URL from request headers; (c) parse form-urlencoded body (`From`, `Body`); (d) call `verifyTwilioSignature` — return 403 if invalid; (e) normalize `from`, trim+uppercase `body`; (f) parse with regex `/^(ACEPTAR|RECHAZAR)\s+([A-Z0-9]{8})$/`; (g) if no match: send `msgEncargadoKeywordInvalido`, respond `<Response/>`; (h) query reservations by folio where status IN `('pending','escalated')`; (i) if not found: respond `<Response/>`; (j) update status to `confirmed` or `rejected`; (k) fetch branch name + client phone; (l) send appropriate client message; (m) respond with `Content-Type: text/xml` and `<Response/>`

**Checkpoint**: `pnpm test` pasa T013. Webhook procesa ACEPTAR y RECHAZAR correctamente. Respuesta inválida retorna 403.

---

## Phase 5: US4 + US5 — Escalación y cancelación automática (Priority: P2)

**Goal**: El cron detecta reservaciones sin respuesta del encargado y las escala o cancela automáticamente, notificando a los números correspondientes.

**Independent Test**: Crear reservación, modificar `createdAt` a 35 min atrás en DB, llamar manualmente `POST /api/cron/reservation-timeouts` con CRON_SECRET — verificar que `firstReminderAt` se setea y encargado recibe WhatsApp de recordatorio.

- [x] T015 [P] [US4] [US5] Create `tests/server/api/cron/reservation-timeouts.post.test.ts` — test cases: (a) missing `Authorization` header → 401; (b) wrong secret → 401; (c) reservation at T+35min with `firstReminderAt=null` → `sendWhatsAppMessage` to primary, `firstReminderAt` set, count `firstReminder: 1`; (d) reservation at T+65min past `firstReminderAt` → status=`escalated`, `escalatedAt` set, message to primary AND secondary (if exists); (e) reservation at T+125min past `escalatedAt` → status=`cancelled_auto`, messages to client + primary + secondary; (f) branch without secondary number → still cancels, only notifies primary; (g) response body contains correct counts per category
- [x] T016 [US4] [US5] Create `server/api/cron/reservation-timeouts.post.ts` — (a) validate `Authorization: Bearer {env.CRON_SECRET}` → 401 if invalid; (b) import `reservationTimeouts` from `@/server/utils/reservation-config`; (c) Query 1: `status='pending'` AND `firstReminderAt IS NULL` AND `createdAt < now() - firstReminderMin min` → send `msgEncargadoRecordatorio` to primary, UPDATE `firstReminderAt=now()`; (d) Query 2: `status='pending'` AND `firstReminderAt < now() - escalationMin min` → send `msgEncargadoRecordatorio` to primary, send `msgSecundarioEscalacion` to secondary (if exists), UPDATE `status='escalated'`, `escalatedAt=now()`; (e) Query 3: `status='escalated'` AND `escalatedAt < now() - autoCancelMin min` → send `msgClienteCanceladoAuto` to client, send `msgEncargadoCanceladoAuto` to primary and secondary (if exists), UPDATE `status='cancelled_auto'`; (f) return counts per category using `ok({ processed: { firstReminder, escalated, cancelledAuto } })`
- [x] T017 [US4] [US5] Create `vercel.json` at repo root — add cron entry `{ "path": "/api/cron/reservation-timeouts", "schedule": "*/15 * * * *" }`

**Checkpoint**: `pnpm test` pasa T015. Cron responde 401 sin secret. Con secret, procesa correctamente los 3 tipos de timeout.

---

## Phase 6: Polish & Cross-Cutting

**Purpose**: Completar la configuración de entorno y validar el flujo end-to-end.

- [x] T018 [P] Update `.env.example` at repo root — add entries for `CRON_SECRET`, `RESERVATION_FIRST_REMINDER_MIN`, `RESERVATION_ESCALATION_MIN`, `RESERVATION_AUTO_CANCEL_MIN` with descriptions but no values, following existing format
- [x] T019 Run full end-to-end validation per `specs/003-twilio-notifications/quickstart.md` — (a) verify `pnpm test` passes all new tests; (b) create reservation via curl and confirm `folio` in response; (c) send ACEPTAR via Twilio sandbox and verify status in DB; (d) call cron endpoint manually and verify processing counts; (e) confirm `pnpm typecheck` passes with no errors

**Checkpoint**: Todos los tests pasan, flujo end-to-end validado manualmente. Feature lista para review.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: Sin dependencias — empezar aquí.
- **Phase 2 (Foundational)**: Depende de Phase 1. **Bloquea todas las user stories**.
  - T002 → T003 → T004 (secuencial — misma DB)
  - T005, T006, T007, T008, T009 pueden correr en paralelo entre sí
  - T010 depende de T005 (necesita el mock)
- **Phase 3 (US1)**: Depende de Phase 2 completo.
- **Phase 4 (US2+US3)**: Depende de Phase 2. Puede correr en paralelo con Phase 3.
- **Phase 5 (US4+US5)**: Depende de Phase 2. Puede correr en paralelo con Phase 3 y 4.
- **Phase 6 (Polish)**: Depende de Phases 3, 4, 5.

### Story Dependencies

- **US1 (Phase 3)**: Sin dependencias de otras stories. MVP mínimo.
- **US2+US3 (Phase 4)**: Sin dependencias de US1. Comparten el mismo webhook.
- **US4+US5 (Phase 5)**: Sin dependencias de US1–US3. Comparten el mismo cron.

### Dentro de Cada Fase

- Tests escritos antes de implementación (constitución III).
- T013 y T015 llevan [P] porque pueden escribirse mientras se implementan otras tareas de la fase anterior.

---

## Parallel Opportunities

### Phase 2 — Utilities en paralelo (tras T004)

```
T005 tests/mocks/twilio.ts
T006 server/utils/folio.ts + test
T007 server/utils/reservation-config.ts + test
T008 server/utils/whatsapp-messages.ts + test
T009 server/utils/env.ts
  ↓ todos completos
T010 server/utils/twilio.ts + test
```

### Phases 3, 4, 5 — Pueden avanzar en paralelo (tras Phase 2)

```
Phase 3: T011 → T012   (POST /api/v1/reservations)
Phase 4: T013 → T014   (webhook)
Phase 5: T015 → T016 → T017  (cron)
```

---

## Implementation Strategy

### MVP (Solo US1 — Phase 1 + 2 + 3)

1. Phase 1: instalar Twilio SDK.
2. Phase 2: schema + utilidades core.
3. Phase 3: modificar POST /api/v1/reservations.
4. **VALIDAR**: crear reservación, confirmar `folio` en respuesta, confirmar WhatsApp al cliente y encargado.
5. **Deployable**: el cliente ya puede ver el flujo de notificación inicial.

### Entrega Incremental

1. MVP (US1) → Demo al cliente: cliente y encargado reciben WhatsApp al crear reservación.
2. + US2+US3 → Demo: encargado puede aceptar/rechazar, cliente recibe resultado.
3. + US4+US5 → Demo completo: reservaciones sin respuesta se escalan y cancelan solas.

---

## Summary

| Fase | User Story | Tareas | Archivos principales |
|------|-----------|--------|---------------------|
| 1 Setup | — | T001 | package.json |
| 2 Foundation | — | T002–T010 | schema.ts, migrations/, utils/ |
| 3 | US1 (P1) | T011–T012 | reservations/index.post.ts |
| 4 | US2+US3 (P1) | T013–T014 | webhooks/twilio.post.ts |
| 5 | US4+US5 (P2) | T015–T017 | cron/reservation-timeouts.post.ts, vercel.json |
| 6 Polish | — | T018–T019 | .env.example |

**Total**: 19 tareas · 6 fases · MVP en T001–T012
