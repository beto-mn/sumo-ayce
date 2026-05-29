# Quickstart: Staff Portal

## Pre-requisitos

- El proyecto ya corre con `pnpm dev` (BD, Twilio, etc. configurados)
- Feature 005 (loyalty program) desplegada — tablas `staff_users`, `staff_sessions`, `loyalty_transactions` existen
- Un usuario staff creado directamente en BD (ver más abajo)

---

## 1. Ejecutar la migración 0007

```bash
pnpm db:generate   # genera la migración desde el schema actualizado
pnpm db:migrate    # aplica la migración (renombra enum + añade columnas void)
```

**Qué hace la migración 0007**:
- Renombra enum: `manager` → `admin`, `admin` → `owner`
- Añade columnas `voided_by`, `voided_at`, `void_reason` a `loyalty_transactions`

---

## 2. Crear un usuario staff en BD (seed manual)

```sql
-- Generar hash de contraseña con el script de seed (ver server/utils/staff-auth.ts)
-- O usar el script de utilidad:
npx tsx server/scripts/create-staff-user.ts \
  --name "Juan Cajero" \
  --email "juan@sumo.com" \
  --password "password123" \
  --role "staff" \
  --branch-id "<uuid-de-sucursal>"
```

> En desarrollo, insertar directamente:
```sql
INSERT INTO staff_users (name, email, role, branch_id, password_hash, is_active)
VALUES ('Juan Cajero', 'juan@sumo.com', 'staff', '<branch_uuid>',
        '<salt:hash generado>', true);
```

---

## 3. Acceder al portal

```
http://localhost:3000/staff/login
```

Credenciales del usuario creado arriba.

---

## Flujos principales

### Cajero: registrar visita
1. Login → `/staff/dashboard`
2. Ingresar teléfono del cliente → buscar
3. Ver perfil → clic en "Registrar visita"
4. Ingresar ticket ID → confirmar

### Cajero: crear cliente nuevo
1. Login → `/staff/dashboard`
2. Ingresar teléfono → si no existe, aparece opción "Crear cliente"
3. Ingresar nombre → confirmar
4. Inmediatamente registrar primera visita

### Cajero: canjear recompensa
1. Buscar cliente → ver perfil en `/staff/customers/:phone`
2. Sección "Recompensas disponibles" → seleccionar reward
3. Ingresar ticket ID → confirmar canje

### Admin: anular transacción
1. Login como admin → `/staff/admin`
2. Historial de transacciones → buscar por fecha/cliente
3. Clic en transacción → "Anular" → ingresar razón → confirmar

### Admin: ver métricas del día
1. Login como admin → `/staff/admin`
2. Panel de métricas en la parte superior — visitas, canjes, clientes nuevos

---

## Variables de entorno

No se requieren nuevas variables para el staff portal. La autenticación usa tokens opacos almacenados en BD.

---

## Testing rápido

```bash
# Unit tests
pnpm test

# Levantar Storybook para revisar componentes
pnpm storybook

# Verificar types
pnpm typecheck
```
