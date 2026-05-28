# Data Model: Loyalty Program

**Branch**: `feat/005-loyalty-program` | **Date**: 2026-05-26

## Existing Tables (no changes)

Todas las tablas existen desde `feat/001-db-schema-drizzle`. No se requiere migración de estructura base.

### `customers`

| Column | Type | Notes |
|--------|------|-------|
| `id` | `uuid` PK | Auto-generated |
| `name` | `varchar(100)` NOT NULL | Nombre del cliente |
| `phone` | `varchar(20)` NOT NULL UNIQUE | Teléfono (normalizado con +521…) |
| `whatsapp_opt_in` | `boolean` NOT NULL DEFAULT false | Acepta notificaciones |
| `points_balance` | `integer` NOT NULL DEFAULT 0 | Saldo actual de puntos |
| `created_at` | `timestamp` | |
| `updated_at` | `timestamp` | |
| `deleted_at` | `timestamp` nullable | Soft delete |

**Constraints**: `points_balance >= 0` (enforced at application level via DB transaction).

### `loyalty_transactions`

| Column | Type | Notes |
|--------|------|-------|
| `id` | `uuid` PK | |
| `customer_id` | `uuid` FK → customers | |
| `branch_id` | `uuid` FK → branches | Sucursal donde ocurrió |
| `points_delta` | `integer` NOT NULL | Positivo (earn) o negativo (redeem). ≠ 0 |
| `transaction_type` | `enum('earn','redeem')` | |
| `reference_id` | `uuid` nullable | FK a `redemptions.id` si type=redeem |
| `ticket_id` | `varchar(100)` nullable | ID del ticket/folio del POS. Solo aplica a type=earn. |
| `created_by` | `uuid` nullable FK → staff_users | Colaborador que registró la visita. Solo aplica a type=earn. |
| `created_at` | `timestamp` | |
| `deleted_at` | `timestamp` nullable | |

**Indexes**: `customer_id`, `(branch_id, created_at)`

### `rewards`

| Column | Type | Notes |
|--------|------|-------|
| `id` | `uuid` PK | |
| `name` | `varchar(100)` NOT NULL | Nombre de la recompensa |
| `description` | `text` nullable | Descripción para el cliente |
| `points_cost` | `integer` NOT NULL | > 0 (check constraint) |
| `is_active` | `boolean` NOT NULL DEFAULT true | |
| `created_at` | `timestamp` | |
| `updated_at` | `timestamp` | |

### `redemptions`

| Column | Type | Notes |
|--------|------|-------|
| `id` | `uuid` PK | |
| `customer_id` | `uuid` FK → customers | |
| `reward_id` | `uuid` FK → rewards | |
| `branch_id` | `uuid` FK → branches | Sucursal donde se procesó |
| `ticket_id` | `varchar(100)` NOT NULL | Folio del ticket del POS asociado al canje |
| `created_by` | `uuid` NOT NULL FK → staff_users | Colaborador que procesó el canje |
| `status` | `enum('pending','used','expired')` DEFAULT 'used' | Siempre 'used' en esta versión |
| `used_at` | `timestamp` NOT NULL | Momento en que se procesó el canje |
| `created_at` | `timestamp` | |
| `updated_at` | `timestamp` | |

**Constraints**:
- `UNIQUE (ticket_id)` — un ticket solo puede usarse para un canje
- `UNIQUE (ticket_id)` en `loyalty_transactions WHERE transaction_type = 'earn'` — un ticket solo puede acumular puntos una vez

---

## Schema Migrations Required

### Migration 1: Add `ticket_id` and `created_by` to `loyalty_transactions`

```sql
ALTER TABLE loyalty_transactions
  ADD COLUMN ticket_id VARCHAR(100),
  ADD COLUMN created_by UUID REFERENCES staff_users(id);
```

Ambas columnas son nullable — los registros de tipo `redeem` no tienen ticket ni createdBy.

### Migration 2: Add `ticket_id` and `created_by` to `redemptions`

La tabla `redemptions` no tiene folio del ticket ni registro de quién procesó el canje.

**Change**: Agregar columnas `ticket_id VARCHAR(100) NOT NULL` y `created_by UUID NOT NULL REFERENCES staff_users(id)`.

```sql
ALTER TABLE redemptions
  ADD COLUMN ticket_id VARCHAR(100) NOT NULL DEFAULT '',
  ADD COLUMN created_by UUID REFERENCES staff_users(id);

CREATE UNIQUE INDEX redemptions_ticket_id_idx ON redemptions(ticket_id);
-- Luego remover el DEFAULT en Drizzle schema
```

**Migration 2b**: Agregar unique index en `loyalty_transactions` para prevenir earn duplicado por ticket.

```sql
CREATE UNIQUE INDEX loyalty_transactions_ticket_earn_idx
  ON loyalty_transactions(ticket_id)
  WHERE transaction_type = 'earn';
```

**Drizzle schema update**:
```typescript
ticketId: varchar('ticket_id', { length: 100 }).notNull(),
createdBy: uuid('created_by').notNull().references(() => staffUsers.id),
// + uniqueIndex('redemptions_ticket_id_idx').on(t.ticketId)
```

### Migration 3: Add `manager_phone` to `branches`

Requerido para alertas de velocidad (FR-018). El campo es nullable — sucursales sin manager_phone no reciben alertas.

```sql
ALTER TABLE branches ADD COLUMN manager_phone VARCHAR(20);
```

**Drizzle schema update**:
```typescript
managerPhone: varchar('manager_phone', { length: 20 }),
```

---

## Anti-Fraud Constraints

| Regla | Mecanismo | Capa |
|-------|-----------|------|
| Un ticket → un solo earn | Unique index parcial `(ticket_id) WHERE type='earn'` | DB |
| Un ticket → un solo canje | Unique index `redemptions(ticket_id)` | DB |
| Max 1 earn por cliente por día | Check `COUNT earn WHERE customer + date = today` | App |
| Empleado no opera su propia cuenta | Comparar `staff_users.phone` vs `customers.phone` | App |
| Earn y canje del mismo ticket requieren dos empleados | Verificar `earn.created_by ≠ staffId` cuando `ticket_id` coincide | App |
| Alerta de velocidad por empleado | Contar earns del staff en última hora; notificar si supera umbral | App (fire-and-forget) |

---

## State Transitions

### Redemption Status

```
[created] → used   (staff processes redemption — single atomic operation)
used      → (terminal)
```

> Todo canje se crea directamente en `used`. No existe estado intermedio. El staff selecciona la recompensa en el portal, se descuentan los puntos y se notifica al cliente vía WhatsApp — sin códigos ni pasos adicionales.

### Customer Points Balance

```
Registration:  balance = 0
Earn visit:    balance += LOYALTY_POINTS_PER_VISIT
Redeem reward: balance -= reward.pointsCost  (atomic, balance cannot go below 0)
```

---

## Entity Relationships

```
customers ─────────────── loyalty_transactions (1:N)
customers ─────────────── redemptions (1:N)
rewards   ─────────────── redemptions (1:N)
branches  ─────────────── loyalty_transactions (1:N)
branches  ─────────────── redemptions (1:N)
staff_users ──────────── redemptions.used_by (1:N, nullable)
redemptions ─────────── loyalty_transactions.reference_id (1:1, nullable)
```
