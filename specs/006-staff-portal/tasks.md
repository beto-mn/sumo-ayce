# Tasks: Staff Portal

**Input**: Design documents from `specs/006-staff-portal/`
**Branch**: `feat/006-staff-portal`
**Spec**: [spec.md](./spec.md) | **Plan**: [plan.md](./plan.md)

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on each other)
- **[Story]**: Which user story this task belongs to (US1–US5)
- File paths are relative to repo root

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Tipos compartidos e infraestructura de base para todos los stories.

- [x] T001 Create shared TypeScript types `types/staff.ts` — `StaffRole`, `StaffUser`, `StaffSession`, `ROLE_RANK`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Infraestructura de auth y BD que TODOS los stories necesitan. Nada puede empezar hasta que esta fase esté completa.

**⚠️ CRÍTICO**: Ningún story puede implementarse hasta completar esta fase.

- [x] T002 Update `server/db/schema.ts` — rename `staffRole` enum values to `('staff', 'admin', 'owner')` and add `voidedBy`, `voidedAt`, `voidReason` columns to `loyaltyTransactions`
- [x] T003 Run `pnpm db:generate` and apply migration `0007` — verify enum rename and new columns in local DB
- [x] T004 Add `AuthError` class (status 401) to `server/utils/error-handler.ts` — used for unauthenticated requests
- [x] T005 [P] Create `server/utils/staff-auth.ts` — export `requireStaffAuth(event, minRole?: StaffRole): Promise<StaffUser>` using `node:crypto` session token lookup
- [x] T006 Create `server/utils/staff-auth.test.ts` — unit tests for `requireStaffAuth`: valid session, expired session, wrong role, missing cookie
- [x] T007 [P] Create `app/middleware/staff-auth.ts` — Nuxt route middleware that redirects to `/staff/login` when no valid session cookie; exempt: `/staff/login`
- [x] T008 Create `server/scripts/create-staff-user.ts` — CLI script to seed a staff user with scrypt-hashed password (used in local dev and quickstart)

**Checkpoint**: Auth infrastructure completa — implementación de user stories puede comenzar

---

## Phase 3: User Story 1 — Login + Buscar cliente + Registrar visita (Priority: P1) 🎯 MVP

**Goal**: Un cajero puede iniciar sesión, buscar un cliente y registrar una visita para acumular puntos.

**Independent Test**: Login con credenciales válidas → buscar teléfono existente → click "Registrar visita" → verificar puntos actualizados en perfil del cliente y notificación WhatsApp disparada.

### Backend — US1

- [x] T009 [US1] Create `server/api/v1/staff/auth/login.post.ts` — valida email+password con scrypt, crea sesión en `staff_sessions`, set httpOnly cookie `staff_session`
- [x] T010 [US1] Create `server/api/v1/staff/auth/login.post.test.ts` — casos: credenciales correctas, contraseña incorrecta, usuario inactivo, usuario no existe
- [x] T011 [P] [US1] Create `server/api/v1/staff/auth/logout.post.ts` — elimina fila en `staff_sessions`, limpia cookie
- [x] T012 [P] [US1] Create `server/api/v1/staff/auth/me.get.ts` — devuelve datos del usuario de la sesión activa
- [x] T013 [US1] Create `server/api/v1/staff/auth/logout.post.test.ts` — logout exitoso, doble logout idempotente
- [x] T014 [US1] Create `server/api/v1/staff/customers/[phone].get.ts` — busca cliente por teléfono normalizado; protegido con `requireStaffAuth`
- [x] T015 [US1] Create `server/api/v1/staff/customers/[phone].get.test.ts` — cliente encontrado, no encontrado, sin sesión (401)
- [x] T016 [US1] Create `server/api/v1/staff/transactions/index.post.ts` — registra visita (earn); `staffId` y `branchId` desde sesión; reutiliza lógica de `loyalty/transactions`
- [x] T017 [US1] Create `server/api/v1/staff/transactions/index.post.test.ts` — earn exitoso, cliente ya ganó hoy (409), ticketId duplicado (409), sin sesión (401)

### Frontend — US1

- [x] T018 [P] [US1] Create `app/composables/useStaffAuth.ts` — `login()`, `logout()`, `me()`, estado reactivo de sesión; co-located test `useStaffAuth.test.ts`
- [x] T019 [P] [US1] Create `app/composables/useStaffCustomer.ts` — `findByPhone()`, `registerVisit()`; co-located test `useStaffCustomer.test.ts`
- [x] T020 [US1] Create `app/components/staff/LoginForm.vue` — form email+password, estado loading/error; Lato, dark theme `#1A1A1A`, accent `#F37021`
- [x] T021 [US1] Create `app/components/staff/LoginForm.stories.ts` — stories: Default, Loading, Error
- [x] T022 [US1] Create `app/pages/staff/login.vue` — página pública, usa `LoginForm`, redirige a `/staff/dashboard` tras login exitoso
- [x] T023 [US1] Create `app/components/staff/CustomerCard.vue` — muestra nombre, teléfono, saldo de puntos, botón "Registrar visita"
- [x] T024 [US1] Create `app/components/staff/CustomerCard.stories.ts` — stories: Default, HighBalance, ZeroPoints, Responsive
- [x] T025 [US1] Create `app/components/staff/VisitButton.vue` — input ticket ID + confirmar; estados: idle, loading, success, error
- [x] T026 [US1] Create `app/components/staff/VisitButton.stories.ts` — stories: Default, Loading, Success, Error
- [x] T027 [US1] Create `app/pages/staff/dashboard.vue` — búsqueda por teléfono, muestra `CustomerCard` con `VisitButton`; protegido con `staff-auth` middleware

**Checkpoint**: US1 completo y testeable de forma independiente — portal funcional básico

---

## Phase 4: User Story 2 — Cajero crea cliente nuevo (Priority: P2)

**Goal**: Cuando el teléfono no existe, el cajero puede crear un cliente y registrar su primera visita de inmediato.

**Independent Test**: Ingresar un teléfono no registrado → aparece formulario de creación → ingresar nombre → cliente creado con 0 puntos → inmediatamente registrar visita.

### Backend — US2

- [x] T028 [US2] Create `server/api/v1/staff/customers/index.post.ts` — crea cliente; si teléfono ya existe devuelve 409 con datos del cliente existente en body
- [x] T029 [US2] Create `server/api/v1/staff/customers/index.post.test.ts` — creación exitosa, teléfono duplicado (409 con datos), sin sesión (401)

### Frontend — US2

- [x] T030 [US2] Extend `app/pages/staff/dashboard.vue` — cuando búsqueda devuelve 404 mostrar formulario inline de creación (nombre + whatsapp opt-in); tras crear, mostrar `CustomerCard` listo para visita

**Checkpoint**: US1 + US2 independientemente funcionales — cajero puede operar con clientes nuevos y existentes

---

## Phase 5: User Story 3 — Cajero canjea recompensa (Priority: P3)

**Goal**: El cajero puede canjear una recompensa del catálogo para un cliente con puntos suficientes.

**Independent Test**: Navegar al perfil del cliente → sección recompensas disponibles → seleccionar reward → ingresar ticket ID → confirmar; verificar puntos descontados y notificación WhatsApp.

### Backend — US3

- [x] T031 [US3] Create `server/api/v1/staff/redemptions/index.post.ts` — canjea reward; `staffId` y `branchId` desde sesión; verifica puntos suficientes; previene duplicados por ticketId
- [x] T032 [US3] Create `server/api/v1/staff/redemptions/index.post.test.ts` — canje exitoso, puntos insuficientes (409), reward inactiva (404), ticketId duplicado (409), sin sesión (401)

### Frontend — US3

- [x] T033 [US3] Create `app/components/staff/RewardsList.vue` — lista rewards activas con costo; deshabilita las que el cliente no puede pagar; cada item tiene botón canje + input ticket ID
- [x] T034 [US3] Create `app/components/staff/RewardsList.stories.ts` — stories: Default, AllAffordable, NoneAffordable, LoadingState, Responsive
- [x] T035 [US3] Create `app/pages/staff/customers/[phone].vue` — perfil completo del cliente: datos, historial de puntos, `RewardsList`; link de regreso al dashboard

**Checkpoint**: US1 + US2 + US3 completos — ciclo completo del cajero operativo

---

## Phase 6: User Story 4 — Admin revisa historial y anula transacciones (Priority: P4)

**Goal**: Un admin puede ver todas las transacciones de su sucursal y anular una transacción con razón registrada.

**Independent Test**: Login como admin → `/staff/admin` → historial de transacciones con paginación → anular una transacción → verificar puntos revertidos en cliente y registro de auditoría.

### Backend — US4

- [x] T036 [US4] Create `server/api/v1/staff/admin/transactions/index.get.ts` — lista transacciones de la sucursal del admin; paginación, filtros por tipo y fecha; requiere rol `admin` o `owner`
- [x] T037 [US4] Create `server/api/v1/staff/admin/transactions/index.get.test.ts` — lista paginada, filtros, staff (403), sin sesión (401), transacciones solo de la sucursal del admin
- [x] T038 [US4] Create `server/api/v1/staff/admin/transactions/[id]/void.post.ts` — anula transacción: set `deleted_at`, `voided_by`, `voided_at`, `void_reason`; revierte `points_balance` del cliente; atómico en transacción DB
- [x] T039 [US4] Create `server/api/v1/staff/admin/transactions/[id]/void.post.test.ts` — anulación exitosa, ya anulada (409), transacción de otra sucursal (404), staff (403), sin sesión (401)

### Frontend — US4

- [x] T040 [P] [US4] Create `app/components/staff/TransactionTable.vue` — tabla con columnas: fecha, cajero, cliente, tipo, puntos, estado (anulada/activa), acción anular
- [x] T041 [US4] Create `app/components/staff/TransactionTable.stories.ts` — stories: Default, WithVoided, Empty, Responsive
- [x] T042 [US4] Create `app/pages/staff/admin/index.vue` — usa `TransactionTable` con paginación y filtros; accesible solo a admin+
- [x] T043 [US4] Create `app/pages/staff/admin/transactions/[id].vue` — detalle de transacción + formulario de anulación (input razón + confirmar)

**Checkpoint**: US1–US4 completos — admin puede operar con control completo de la sucursal

---

## Phase 7: User Story 5 — Admin consulta métricas del día (Priority: P5)

**Goal**: El admin ve visitas del día, canjes, clientes nuevos y puntos emitidos de su sucursal.

**Independent Test**: Login como admin → métricas visibles en `/staff/admin` → deben reflejar transacciones del día actual; filtrar por fecha pasada debe mostrar datos históricos correctos.

### Backend — US5

- [x] T044 [US5] Create `server/api/v1/staff/admin/reports/daily.get.ts` — agrega métricas del día (visits, redemptions, new customers, points issued, voided); query param `date` (default: today)
- [x] T045 [US5] Create `server/api/v1/staff/admin/reports/daily.get.test.ts` — métricas correctas, día sin datos (ceros), fecha futura (ceros), staff (403), sin sesión (401)

### Frontend — US5

- [x] T046 [US5] Extend `app/pages/staff/admin/index.vue` — añadir sección de métricas diarias sobre la tabla: tarjetas con visitas, canjes, clientes nuevos, puntos emitidos; selector de fecha

**Checkpoint**: Todos los stories completos — portal operativo al 100%

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Detalles de UX, CSS, y validación final.

- [x] T047 [P] Create `app/assets/css/staff.css` — CSS custom properties de brand tokens: `--color-dark`, `--color-surface`, `--color-brand`, `--color-text`; importar Lato; estilos base del portal
- [x] T048 [P] Verify all Storybook stories render at mobile (<768px), tablet (768–1024px) and desktop (>1024px) — run `pnpm storybook` and validate responsive stories for: LoginForm, CustomerCard, VisitButton, RewardsList, TransactionTable
- [x] T049 Run `pnpm test --coverage` — verify ≥80% coverage on all `server/api/v1/staff/` routes and ≥70% on composables
- [x] T050 Run quickstart.md validation end-to-end: seed staff user → login → register visit → create customer → redeem reward → admin void → daily report

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: Sin dependencias — empezar inmediatamente
- **Phase 2 (Foundational)**: Depende de Phase 1 — bloquea todos los stories
- **Phases 3–7 (User Stories)**: Todas dependen de Phase 2
  - Se pueden ejecutar en orden P1→P2→P3→P4→P5
  - O en paralelo si hay más de un desarrollador (excepto US2 que extiende el dashboard de US1)
- **Phase 8 (Polish)**: Depende de que todos los stories estén completos

### User Story Dependencies

| Story | Depende de | Puede iniciar con |
|-------|------------|-------------------|
| US1 (P1) | Phase 2 completa | T009 |
| US2 (P2) | Phase 2 + US1 backend (T014) para el flujo de dashboard | T028 |
| US3 (P3) | Phase 2 | T031 (independiente de US1/US2) |
| US4 (P4) | Phase 2 + T002/T003 (columnas void) | T036 |
| US5 (P5) | Phase 2 | T044 (independiente) |

### Parallel Opportunities Within Phase 2

```
T005 staff-auth.ts  ──┐
T007 middleware     ──┤→ T006 staff-auth.test.ts (tras T005)
T008 seed script    ──┘
T004 AuthError      ─── independiente
```

### Parallel Opportunities Within Phase 3

```
T018 useStaffAuth composable    ──┐
T019 useStaffCustomer composable ─┤→ (frontend puede avanzar en paralelo al backend)
T011 logout route               ──┤
T012 me route                   ──┘
```

---

## Implementation Strategy

### MVP (User Story 1 — Login + Registrar visita)

1. Completar Phase 1 + Phase 2
2. Completar Phase 3 (T009–T027)
3. **Validar**: Cajero puede iniciar sesión, buscar cliente y registrar visita
4. Deploy/demo si está listo

### Incremental Delivery

1. Phase 1 + Phase 2 → Fundación lista
2. US1 → Login + visitas (MVP cajero)
3. US2 → Crear clientes
4. US3 → Canje de recompensas (ciclo completo cajero)
5. US4 → Panel admin + anulaciones
6. US5 → Métricas del día

---

## Notes

- Tests para server routes van en el mismo directorio que el route (co-located, per constitución III)
- Storybook story obligatoria para cada componente Vue (per constitución VI) — sin story = no merge
- `branchId` y `staffId` se extraen siempre de la sesión — NUNCA del body del request
- El enum de `staff_role` en Drizzle debe coincidir exactamente con los valores de la migración 0007 antes de correr tests
- Todos los imports usan aliases (`@/server/`, `@/types/`, etc.) — sin `../` entre directorios

---

## Phase 9: Post-Implementation Fixes (QA Manual 2026-05-30)

Bugs y mejoras encontrados durante pruebas manuales del flujo completo.

- [x] TF01 Fix `app/app.vue` — reemplazar `<NuxtWelcome/>` por `<NuxtPage/>` para que el router funcione
- [x] TF02 Fix component names en pages — Nuxt auto-importa con prefijo de carpeta: `LoginForm` → `StaffLoginForm`, `CustomerCard` → `StaffCustomerCard`, etc.
- [x] TF03 Fix `LoginForm.vue` — input background era `--color-surface` igual al card; cambiar a `--color-dark` para que sea visible
- [x] TF04 Fix `CustomerCard.vue` — eliminar botón "Registrar visita" duplicado; el componente es solo informativo, la acción vive en `VisitButton`
- [x] TF05 Fix `dashboard.vue` `search()` y `reset()` — limpiar `newCustomerName` y `newCustomerOptIn` en cada búsqueda para evitar que persistan valores de creaciones anteriores
- [x] TF06 Fix `VisitButton.vue` — agregar `watch` sobre prop `state`: cuando vuelve a `'idle'` resetear `showInput` y `ticketId` internos para que nueva búsqueda muestre botón limpio
- [x] TF07 Fix `useStaffAuth.ts` `logout()` — agregar `navigateTo('/staff/login')` tras limpiar sesión; sin esto el botón Salir no redirigía
- [x] TF08 Fix `loyalty-config.ts` — cambiar fallback de `pointsPerVisit` de `10` a `1`; controlable vía `LOYALTY_POINTS_PER_VISIT` env var
- [x] TF09 Add regla de negocio en `redemptions/index.post.ts` — un cliente solo puede canjear una recompensa por día (409 si ya canjeó hoy)
- [x] TF10 Add `server/utils/rate-limiter.ts` + integración en `login.post.ts` — máx 5 intentos fallidos por IP en ventana de 15 min; se resetea tras login exitoso; protección contra brute force
- [x] TF11 Add `server/scripts/hash-password.ts` — CLI para generar hashes scrypt listos para insertar en BD; uso: `tsx server/scripts/hash-password.ts <password>`
- [x] TF12 Add `PATCH /api/v1/staff/customers/[phone]` (`server/api/v1/staff/customers/[phone].patch.ts`) — actualiza `name` y/o `phone`; valida teléfono duplicado (409); requiere al menos un campo
- [x] TF13 Add `updateCustomer(phone, fields)` en `useStaffCustomer.ts` — llama al PATCH y actualiza estado local
- [x] TF14 Add inline edit UI en `app/pages/staff/customers/[phone].vue` — botón "Editar datos del cliente" expande form con nombre y teléfono; si cambia el teléfono redirige a la nueva URL
