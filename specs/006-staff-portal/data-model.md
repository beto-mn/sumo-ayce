# Data Model: Staff Portal

## Cambios al schema existente

### 1. Enum `staff_role` — renombrar valores (migración 0007)

```sql
ALTER TYPE staff_role RENAME VALUE 'manager' TO 'admin';
ALTER TYPE staff_role RENAME VALUE 'admin' TO 'owner';
-- Resultado: ('staff', 'admin', 'owner')
```

**Jerarquía de permisos** (ascendente): `staff` < `admin` < `owner`

### 2. Tabla `loyalty_transactions` — añadir columnas de auditoría de anulación

```sql
ALTER TABLE loyalty_transactions
  ADD COLUMN voided_by   UUID REFERENCES staff_users(id),
  ADD COLUMN voided_at   TIMESTAMP,
  ADD COLUMN void_reason TEXT;
```

**Regla**: `voided_by` y `voided_at` son NOT NULL cuando `deleted_at IS NOT NULL`. Validado a nivel de aplicación.

---

## Tablas existentes (sin cambios estructurales)

### `staff_users`

| Columna | Tipo | Notas |
|---------|------|-------|
| `id` | UUID PK | Auto-generado |
| `name` | varchar(100) | Nombre visible en UI |
| `email` | varchar(255) UNIQUE | Identificador de login (username) |
| `phone` | varchar(20) | Opcional, para contacto |
| `role` | staff_role enum | `staff` \| `admin` \| `owner` |
| `branch_id` | UUID FK → branches | Sucursal asignada (owner: puede ser NULL en futuro) |
| `password_hash` | varchar(255) | `salt:hash` en hex (scrypt) |
| `is_active` | boolean | Soft-disable de cuenta |
| `created_at` | timestamp | |
| `updated_at` | timestamp | |

**Notas de diseño**:
- `email` se usa como username en el formulario de login
- `branch_id` es NOT NULL en esta versión para todos los roles; future multi-sucursal del owner se resuelve en feature posterior
- La creación de usuarios se hace directamente en BD en esta versión (no hay UI de gestión)

### `staff_sessions`

| Columna | Tipo | Notas |
|---------|------|-------|
| `id` | UUID PK | |
| `staff_user_id` | UUID FK → staff_users | |
| `token` | varchar(255) UNIQUE | UUID v4 aleatorio (128 bits) |
| `expires_at` | timestamp | Creación + 8 horas |
| `ip_address` | text | Opcional, para auditoría |
| `created_at` | timestamp | |

**Ciclo de vida**:
1. Login exitoso → INSERT staff_sessions con `expires_at = NOW() + 8h`
2. Request autenticado → SELECT WHERE token = ? AND expires_at > NOW()
3. Logout → DELETE WHERE token = ?
4. Cleanup (no implementado en v1): DELETE WHERE expires_at < NOW()

### `loyalty_transactions` (tras migración 0007)

Columnas nuevas añadidas a la tabla existente:

| Columna | Tipo | Notas |
|---------|------|-------|
| `voided_by` | UUID FK → staff_users | NULL si activa, NOT NULL si anulada |
| `voided_at` | timestamp | NULL si activa, NOT NULL si anulada |
| `void_reason` | text | Razón de la anulación |

**Estado de una transacción**:
- `deleted_at IS NULL` → activa
- `deleted_at IS NOT NULL` → anulada (voided_by/voided_at/void_reason deben estar presentes)

---

## Diagrama de relaciones (staff portal)

```
staff_users ──── branch_id ──► branches
     │
     ├── id ◄── staff_user_id ── staff_sessions
     │
     ├── id ◄── created_by ─── loyalty_transactions
     │                  └── voided_by ─ (misma tabla)
     │
     └── id ◄── created_by ─── redemptions
                    └── used_by ──── (misma tabla)
```

---

## Drizzle schema changes

```typescript
// Enum actualizado en schema.ts
export const staffRole = pgEnum('staff_role', ['staff', 'admin', 'owner'])

// Columnas nuevas en loyaltyTransactions
voidedBy: uuid('voided_by').references(() => staffUsers.id),
voidedAt: timestamp('voided_at'),
voidReason: text('void_reason'),
```

---

## Types compartidos (`types/staff.ts`)

```typescript
export type StaffRole = 'staff' | 'admin' | 'owner'

export interface StaffUser {
  id: string
  name: string
  email: string
  role: StaffRole
  branchId: string
  isActive: boolean
}

export interface StaffSession {
  staffUser: StaffUser
  expiresAt: Date
}

// Orden de privilegios para comparación
export const ROLE_RANK: Record<StaffRole, number> = {
  staff: 1,
  admin: 2,
  owner: 3,
}
```
