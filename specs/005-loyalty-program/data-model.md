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
| `created_by` | `uuid` NOT NULL FK → staff_users | Colaborador que procesó el canje |
| `used_by` | `uuid` nullable FK → staff_users | Colaborador que marcó el canje como usado |
| `status` | `enum('pending','used','expired')` DEFAULT 'pending' | |
| `used_at` | `timestamp` nullable | Cuando el staff marcó como usado |
| `created_at` | `timestamp` | |
| `updated_at` | `timestamp` | |

---

## Schema Migrations Required

### Migration 1: Add `ticket_id` and `created_by` to `loyalty_transactions`

```sql
ALTER TABLE loyalty_transactions
  ADD COLUMN ticket_id VARCHAR(100),
  ADD COLUMN created_by UUID REFERENCES staff_users(id);
```

Ambas columnas son nullable — los registros de tipo `redeem` no tienen ticket ni createdBy.

### Migration 2: Add `code` and `created_by` to `redemptions`

La tabla `redemptions` no tiene código corto ni registro de quién creó el canje.

**Change**: Agregar columnas `code varchar(8) NOT NULL UNIQUE` y `created_by uuid NOT NULL REFERENCES staff_users(id)` a `redemptions`.

```sql
ALTER TABLE redemptions ADD COLUMN code VARCHAR(8) NOT NULL DEFAULT '';
CREATE UNIQUE INDEX redemptions_code_idx ON redemptions(code);
-- Luego remover el DEFAULT en Drizzle schema
```

**Drizzle schema update**:
```typescript
code: varchar('code', { length: 8 }).notNull(),
// + uniqueIndex('redemptions_code_idx').on(t.code) en el array de table config
```

**Generation**: Reutilizar `server/utils/folio.ts` (mismo patrón que reservaciones).

---

## State Transitions

### Redemption Status

```
[created] → used   (staff processes redemption on the spot — single operation)
used      → (terminal)
```

> `pending` y `expired` se conservan en el enum de BD para uso futuro pero no se usan en esta feature.

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
