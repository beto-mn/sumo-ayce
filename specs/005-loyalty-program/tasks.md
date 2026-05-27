# Tasks: Loyalty Program

**Input**: Design documents from `specs/005-loyalty-program/`
**Branch**: `feat/005-loyalty-program`
**Prerequisites**: plan.md ✅ · spec.md ✅ · research.md ✅ · data-model.md ✅ · contracts/api.md ✅

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Puede correr en paralelo (archivos distintos, sin dependencias incompletas)
- **[Story]**: User story al que pertenece la tarea (US1–US5)
- Todos los paths son relativos al root del repositorio

---

## Phase 1: Setup

**Purpose**: Migraciones de BD y configuración de entorno. Sin esto no corre ninguna user story.

- [ ] T001 Update `.env.example` — add `LOYALTY_POINTS_PER_VISIT=10` with description, following existing format
- [ ] T002 [P] Create DB migration for `loyalty_transactions` — add columns `ticket_id VARCHAR(100)` (nullable) and `created_by UUID REFERENCES staff_users(id)` (nullable); run `pnpm drizzle-kit generate` and verify migration file in `server/db/migrations/`
- [ ] T003 [P] Create DB migration for `redemptions` — add columns `code VARCHAR(8) NOT NULL` with unique index and `created_by UUID NOT NULL REFERENCES staff_users(id)`; run `pnpm drizzle-kit generate` and verify migration file; update Drizzle schema in `server/db/schema.ts` to add both columns to `redemptions` table and update `loyaltyTransactions` table with `ticketId` and `createdBy`

**Checkpoint**: `pnpm drizzle-kit migrate` ejecuta sin errores. Schema actualizado en `server/db/schema.ts`.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Utilidades compartidas que todas las user stories necesitan. Ningún endpoint puede implementarse sin estas.

**⚠️ CRITICAL**: No iniciar ningún user story hasta completar T004–T005.

- [ ] T004 [P] Create `server/utils/loyalty-config.ts` — export `loyaltyConfig` object reading `LOYALTY_POINTS_PER_VISIT` from `process.env` parsed as integer (default 10, reject 0 or negative); create `tests/server/utils/loyalty-config.test.ts` verifying: (a) default 10 when env absent; (b) env override; (c) fallback to 10 when env is 0 or negative

- [ ] T005 [P] Create `server/utils/loyalty-messages.ts` — export the following pure functions (no side effects, inputs typed, returns `string`): `msgLoyaltyBienvenida(name: string): string` (welcome on registration); `msgLoyaltyPuntosGanados(name: string, pointsEarned: number, newBalance: number): string` (earn confirmation); `msgLoyaltyRecompensasDesbloqueadas(rewards: { name: string; description: string | null; pointsCost: number }[]): string` (rewards unlocked notification); `msgLoyaltyCanje(name: string, rewardName: string, rewardDescription: string | null, remainingBalance: number): string` (redemption confirmation); `msgLoyaltySaldo(name: string, balance: number): string` (WhatsApp SALDO reply); `msgLoyaltySaldoNoEncontrado(): string` (SALDO reply for unregistered number); create `tests/server/utils/loyalty-messages.test.ts` verifying each function returns a non-empty string containing the key data (name, balance, reward name, etc.)

**Checkpoint**: `pnpm test` pasa T004 y T005. Utilidades listas para las user stories.

---

## Phase 3: US1 — Registro de Cliente (Priority: P1) 🎯 MVP

**Goal**: `POST /api/v1/loyalty/customers` registra un cliente nuevo. Si el teléfono ya existe, devuelve el perfil existente con 409.

**Independent Test**: `curl -X POST /api/v1/loyalty/customers -d '{"name":"Ana","phone":"5512345678","whatsappOptIn":true}'` → 201 con `pointsBalance=0`. WhatsApp de bienvenida enviado.

- [ ] T006 [US1] Write test cases in `tests/server/api/v1/loyalty/customers/index.post.test.ts` — (a) new customer with valid name+phone → 201, `data.pointsBalance=0`, phone normalized to E.164; (b) `whatsappOptIn=true` → `sendWhatsAppMessage` called with welcome message; (c) `whatsappOptIn=false` → `sendWhatsAppMessage` NOT called; (d) duplicate phone → 409, response includes existing customer data; (e) phone with invalid format (letters) → 400; (f) name exceeding 100 chars → 400; (g) missing required field (name or phone) → 400

- [ ] T007 [US1] Create `server/api/v1/loyalty/customers/index.post.ts` — (a) define Zod schema: `name` string 1–100 chars, `phone` string validated with `normalizePhone`, `whatsappOptIn` boolean default false; (b) check if customer with normalized phone already exists via `db.select()` from `customers` where `phone = normalizedPhone`; if exists return `{ data: existing, error: 'Customer already registered' }` with status 409; (c) if not exists: `db.insert(customers)` with `{ name, phone: normalizedPhone, whatsappOptIn }`; (d) if `whatsappOptIn=true`: call `sendWhatsAppMessage(phone, msgLoyaltyBienvenida(name))` wrapped in `.catch(err => logger.error(...))` — Twilio failure must NOT block the response; (e) return `ok(newCustomer)` with status 201; wrap handler in try/catch with `handleError`; imports from `@/server/utils/loyalty-messages`, `@/server/utils/twilio`, `@/server/utils/db`, `@/server/utils/error-handler`, `@/server/utils/response`

**Checkpoint**: `pnpm test` pasa T006. `curl` de registro devuelve 201 con `pointsBalance=0`.

---

## Phase 4: US2 — Acumulación de Puntos por Visita (Priority: P1)

**Goal**: `POST /api/v1/loyalty/transactions` registra una visita, acredita puntos, guarda `ticketId` y `staffId`, envía WhatsApp. Si el nuevo saldo desbloquea recompensas nuevas, envía segundo WhatsApp.

**Independent Test**: `curl -X POST /api/v1/loyalty/transactions -d '{"phone":"5512345678","branchId":"<uuid>","ticketId":"T-001","staffId":"<uuid>"}'` → 201, `data.pointsDelta=10`, `data.newBalance=10`. WhatsApp enviado.

- [ ] T008 [US2] Write test cases in `tests/server/api/v1/loyalty/transactions/index.post.test.ts` — (a) valid request → 201, `data.pointsDelta` equals `LOYALTY_POINTS_PER_VISIT`, `data.newBalance` equals previous + delta; (b) unknown phone → 404; (c) customer with `deletedAt` → 404; (d) invalid `branchId` (not a UUID) → 400; (e) missing `ticketId` → 400; (f) missing `staffId` → 400; (g) `whatsappOptIn=true` → `sendWhatsAppMessage` called with earn message containing new balance; (h) `whatsappOptIn=false` → earn WhatsApp NOT sent; (i) new balance crosses threshold of an active reward (e.g., prevBalance=0, newBalance=10, reward costs 10) → second `sendWhatsAppMessage` call with unlocked rewards message; (j) new balance doesn't cross any new threshold → no second WhatsApp; (k) transaction recorded in `loyalty_transactions` with `transactionType='earn'`, `ticketId`, `createdBy`, `branchId`

- [ ] T009 [US2] Create `server/api/v1/loyalty/transactions/index.post.ts` — (a) Zod schema: `phone` string, `branchId` UUID, `ticketId` string 1–100 chars, `staffId` UUID; (b) lookup customer by normalized phone where `deletedAt IS NULL`; throw `NotFoundError` if not found; (c) fetch all active rewards via `db.select().from(rewards).where(eq(rewards.isActive, true))`; (d) store `prevBalance = customer.pointsBalance`; (e) `db.transaction(async tx => { await tx.update(customers).set({ pointsBalance: sql\`${customers.pointsBalance} + ${loyaltyConfig.pointsPerVisit}\` }).where(eq(customers.id, customer.id)); await tx.insert(loyaltyTransactions).values({ customerId: customer.id, branchId, pointsDelta: loyaltyConfig.pointsPerVisit, transactionType: 'earn', ticketId, createdBy: staffId }); })`; (f) compute `newBalance = prevBalance + loyaltyConfig.pointsPerVisit`; (g) if `customer.whatsappOptIn`: send `msgLoyaltyPuntosGanados` (fire-and-forget, catch error); (h) compute `unlocked = activeRewards.filter(r => r.pointsCost > prevBalance && r.pointsCost <= newBalance)`; if `unlocked.length > 0` and `whatsappOptIn`: send `msgLoyaltyRecompensasDesbloqueadas(unlocked)` (fire-and-forget); (i) return `ok({ transactionId, customerId, pointsDelta, newBalance, transactionType: 'earn', branchId, ticketId, createdBy: staffId, createdAt })` with status 201

**Checkpoint**: `pnpm test` pasa T008. `curl` registra visita, saldo incrementa y WhatsApp se envía.

---

## Phase 5: US3 — Consulta de Saldo e Historial (Priority: P2)

**Goal**: Dos canales — staff consulta perfil completo vía `GET /customers/:phone`; cliente envía "SALDO" por WhatsApp y recibe solo su saldo.

**Independent Test (staff)**: `curl /api/v1/loyalty/customers/5512345678` → 200 con `data.pointsBalance` y `data.transactions` en orden descendente.
**Independent Test (WhatsApp)**: Enviar "saldo" → cliente recibe mensaje con total de puntos.

- [ ] T010 [P] [US3] Write test cases in `tests/server/api/v1/loyalty/customers/[phone]/index.get.test.ts` — (a) existing customer → 200 with name, pointsBalance, and up to 20 transactions newest-first; (b) non-existent phone → 404; (c) customer with deletedAt → 404; (d) transactions include type, pointsDelta, branchId, createdAt; (e) customer with 0 transactions → empty array; (f) customer with 25 transactions → only latest 20 returned

- [ ] T011 [P] [US3] Write test cases for SALDO keyword in `tests/server/api/webhooks/twilio.post.test.ts` (extend existing test file) — (a) body='SALDO' from registered number with opt-in → `sendWhatsAppMessage` called with balance message; (b) body='saldo' (lowercase) → same behavior; (c) body='SALDO' from unregistered number → `sendWhatsAppMessage` called with not-found message; (d) body='SALDO' doesn't interfere with existing ACEPTAR/RECHAZAR handling

- [ ] T012 [US3] Create `server/api/v1/loyalty/customers/[phone]/index.get.ts` — (a) normalize phone param using `normalizePhone`; (b) query customer where `phone = normalized` and `deletedAt IS NULL`; throw `NotFoundError('Customer')` if not found; (c) query last 20 loyalty_transactions for customer ordered by `createdAt DESC`, selecting `id, transactionType, pointsDelta, branchId, ticketId, createdBy, createdAt`; (d) return `ok({ ...customer, transactions })` omitting `passwordHash`-equivalent internal fields; wrap in try/catch with `handleError`

- [ ] T013 [US3] Extend `server/api/webhooks/twilio.post.ts` with SALDO keyword handler — add check `if (body === 'SALDO')` BEFORE the existing `KEYWORD_REGEX` check; lookup customer by normalized `from` phone where `deletedAt IS NULL`; if found: send `msgLoyaltySaldo(customer.name, customer.pointsBalance)` via `sendWhatsAppMessage` (catch error, log); if not found: send `msgLoyaltySaldoNoEncontrado()`; in both cases: set content-type header and return `TWIML_EMPTY`

**Checkpoint**: `pnpm test` pasa T010 y T011. Staff lookup devuelve historial. WhatsApp "saldo" responde con balance.

---

## Phase 6: US4 — Catálogo de Recompensas (Priority: P2)

**Goal**: `GET /api/v1/loyalty/rewards` devuelve recompensas activas ordenadas por costo. Solo lectura, sin auth.

**Independent Test**: `curl /api/v1/loyalty/rewards` → array de recompensas activas ordenadas por `pointsCost ASC`.

- [ ] T014 [P] [US4] Write test cases in `tests/server/api/v1/loyalty/rewards/index.get.test.ts` — (a) returns only active rewards; (b) inactive rewards excluded; (c) results ordered by pointsCost ascending; (d) response includes name, description, pointsCost; (e) empty catalog (no active rewards) → empty array, not 404

- [ ] T015 [P] [US4] Create `server/api/v1/loyalty/rewards/index.get.ts` — query `db.select({ id, name, description, pointsCost }).from(rewards).where(eq(rewards.isActive, true)).orderBy(asc(rewards.pointsCost))`; return `ok(results)`; wrap in try/catch with `handleError`; no Zod validation needed (no input)

**Checkpoint**: `pnpm test` pasa T014. `curl` sin params devuelve catálogo activo ordenado.

---

## Phase 7: US5 — Canje de Recompensa (Priority: P3)

**Goal**: `POST /api/v1/loyalty/redemptions` procesa el canje en un solo paso atómico: descuenta puntos, crea redemption en estado 'used', registra loyaltyTransaction, envía WhatsApp de confirmación.

**Independent Test**: `curl -X POST /api/v1/loyalty/redemptions -d '{"phone":"...","rewardId":"...","branchId":"...","staffId":"..."}'` → 201, `data.status=used`, puntos descontados, WhatsApp enviado.

- [ ] T016 [US5] Write test cases in `tests/server/api/v1/loyalty/redemptions/index.post.test.ts` — (a) sufficient balance → 201, `data.status='used'`, `data.usedAt` present, `data.remainingBalance = prevBalance - reward.pointsCost`; (b) insufficient balance → 422 with clear error message; (c) unknown phone → 404; (d) customer with deletedAt → 404; (e) inactive reward → 400; (f) invalid rewardId → 404; (g) `whatsappOptIn=true` → `sendWhatsAppMessage` called with redemption confirmation (reward name, description, remaining balance); (h) `whatsappOptIn=false` → no WhatsApp sent; (i) loyaltyTransaction inserted with `transactionType='redeem'`, `pointsDelta = -reward.pointsCost`, `referenceId = redemption.id`; (j) redemption inserted with `createdBy=staffId`, `usedBy=staffId`, `usedAt=now()`

- [ ] T017 [US5] Create `server/api/v1/loyalty/redemptions/index.post.ts` — (a) Zod schema: `phone` string, `rewardId` UUID, `branchId` UUID, `staffId` UUID; (b) lookup customer by normalized phone where `deletedAt IS NULL`; throw `NotFoundError` if not found; (c) lookup reward where `id = rewardId` and `isActive = true`; throw `NotFoundError` if not found; (d) `db.transaction(async tx => { const [fresh] = await tx.select().from(customers).where(eq(customers.id, customer.id)).for('update'); if (fresh.pointsBalance < reward.pointsCost) throw new UnprocessableError('Insufficient points'); const code = generateFolio(); const [redemption] = await tx.insert(redemptions).values({ customerId: customer.id, rewardId, branchId, code, createdBy: staffId, usedBy: staffId, status: 'used', usedAt: new Date() }).returning(); await tx.update(customers).set({ pointsBalance: sql\`${customers.pointsBalance} - ${reward.pointsCost}\` }).where(eq(customers.id, customer.id)); await tx.insert(loyaltyTransactions).values({ customerId: customer.id, branchId, pointsDelta: -reward.pointsCost, transactionType: 'redeem', referenceId: redemption.id, createdBy: staffId }); return redemption; })`; (e) if `customer.whatsappOptIn`: send `msgLoyaltyCanje(customer.name, reward.name, reward.description, remainingBalance)` (fire-and-forget); (f) return `ok({ redemptionId, code, customerId, rewardId, rewardName, pointsDeducted, remainingBalance, status: 'used', usedAt, createdBy, createdAt })` with status 201

**Checkpoint**: `pnpm test` pasa T016. Canje atómico funciona — saldo no puede quedar negativo.

---

## Phase 8: Polish & Cross-Cutting

**Purpose**: Validación final end-to-end.

- [ ] T018 Run full validation per `specs/005-loyalty-program/quickstart.md` — (a) `pnpm drizzle-kit migrate` aplica las 2 migraciones sin error; (b) `pnpm test` pasa todos los tests nuevos (T004–T017); (c) `pnpm typecheck` pasa sin errores TypeScript; (d) ejecutar los 9 escenarios del quickstart.md con curl y verificar responses; (e) confirmar que ningún WhatsApp se envía cuando `whatsappOptIn=false`; (f) confirmar que el saldo nunca puede quedar negativo con dos peticiones concurrentes de canje

**Checkpoint**: Todos los tests pasan, typecheck limpio, 9 escenarios validados.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: Sin dependencias — empezar aquí. T002 y T003 en paralelo.
- **Phase 2 (Foundational)**: Depende de Phase 1. **Bloquea todas las user stories.** T004 y T005 en paralelo.
- **Phase 3 (US1)**: Depende de Phase 2. T006 antes de T007 (TDD).
- **Phase 4 (US2)**: Depende de Phase 3 (necesita customers existentes para las pruebas). T008 antes de T009.
- **Phase 5 (US3)**: Depende de Phase 4. T010, T011 en paralelo → T012, T013 en paralelo.
- **Phase 6 (US4)**: Depende de Phase 2 únicamente — **puede correr en paralelo con Phase 5**. T014 y T015 en paralelo.
- **Phase 7 (US5)**: Depende de Phases 3, 4 y 6. T016 antes de T017.
- **Phase 8 (Polish)**: Depende de Phases 3–7.

### Parallel Opportunities

```
Phase 1:
  T002 migration loyalty_transactions   ← en paralelo
  T003 migration redemptions            ← en paralelo

Phase 2:
  T004 loyalty-config.ts + test         ← en paralelo
  T005 loyalty-messages.ts + test       ← en paralelo

Phase 5 + Phase 6 (simultáneas):
  T010 tests GET /customers/:phone      ← en paralelo entre sí
  T011 tests SALDO webhook              ← en paralelo entre sí
  T014 tests GET /rewards               ← en paralelo con Phase 5
  T015 impl GET /rewards                ← en paralelo con T012/T013
```

---

## Implementation Strategy

### MVP (Solo US1 + US2 — Phases 1–4)

1. Phase 1: migraciones + env.
2. Phase 2: utilidades (config + messages).
3. Phase 3 (US1): registro de clientes.
4. Phase 4 (US2): acumulación de puntos.
5. **VALIDAR**: registro y earn funcionan con WhatsApp.
6. **Deployable**: el Staff Portal (feat/006) ya puede registrar clientes y visitas.

### Entrega Incremental

1. MVP (US1+US2) → clientes registrados, puntos acumulándose.
2. + US3+US4 → staff ve saldos, clientes consultan por WhatsApp, catálogo visible.
3. + US5 → canjes funcionando.
4. + Polish → typecheck y quickstart validados.

---

## Summary

| Fase | User Story | Tareas | Archivos principales |
|------|-----------|--------|---------------------|
| 1 Setup | — | T001–T003 | .env.example, migrations |
| 2 Foundation | — | T004–T005 | loyalty-config.ts, loyalty-messages.ts |
| 3 | US1 (P1) | T006–T007 | customers/index.post.ts |
| 4 | US2 (P1) | T008–T009 | transactions/index.post.ts |
| 5 | US3 (P2) | T010–T013 | customers/[phone]/index.get.ts, twilio.post.ts |
| 6 | US4 (P2) | T014–T015 | rewards/index.get.ts |
| 7 | US5 (P3) | T016–T017 | redemptions/index.post.ts |
| 8 Polish | — | T018 | — |

**Total**: 18 tareas · 8 fases · MVP en T001–T009
