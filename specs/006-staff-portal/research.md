# Research: Staff Portal

## Auth — Session Tokens vs JWT

**Decision**: Tokens opacos (`crypto.randomUUID()`) almacenados en la tabla `staff_sessions`, enviados en cookie `httpOnly; Secure; SameSite=Strict`.

**Rationale**: La tabla `staff_sessions` ya existe en el schema. Tokens opacos son revocables (logout elimina el row), no requieren librería adicional (`node:crypto` es built-in), y el overhead de un SELECT por request es despreciable a la escala del proyecto (~50 usuarios). JWT agregaría complejidad sin beneficio real.

**Alternatives considered**:
- `jose` (JWT): Descartado — stateless pero no revocable sin blacklist. La tabla `staff_sessions` ya existe para revocación, por lo que JWT no añade valor.
- `bcrypt`: Descartado para hashing de contraseña — requiere dependencia. `crypto.scrypt` (built-in, memory-hard) es equivalente en seguridad.

---

## Password Hashing — `node:crypto` scrypt

**Decision**: `crypto.scrypt` con salt aleatorio de 16 bytes. Formato de almacenamiento: `${salt}:${hash}` (ambos en hex).

**Rationale**: `scrypt` es un KDF memory-hard integrado en Node.js desde v10. Evita instalar `bcrypt` (que requiere compilación nativa) o `argon2`. El KISS principle dice que solo se añade una librería si ahorra >100 líneas — aquí no aplica.

**Parameters**: `N=16384, r=8, p=1, keylen=64` — configuración estándar de seguridad moderada, adecuada para uso interno.

---

## Role Enum — Migración de nombres

**Decision**: Actualizar enum `staff_role` de `('staff', 'manager', 'admin')` a `('staff', 'admin', 'owner')` en migración 0007.

**Rationale**: El schema fue definido en feature 005 con los nombres de la Constitution, pero antes de que el usuario refinara la jerarquía de roles para el portal. La migración ocurre antes de que haya datos de staff en producción. El nombre `owner` es más intuitivo para el dueño de la cadena que `admin`.

**Migration strategy**: `ALTER TYPE staff_role RENAME VALUE 'manager' TO 'admin'; ALTER TYPE staff_role RENAME VALUE 'admin' TO 'owner';` — soportado en PostgreSQL 10+. No requiere reescribir rows.

---

## Void de transacciones — columnas adicionales en `loyalty_transactions`

**Decision**: Añadir columnas `voided_by` (UUID FK → staff_users), `voided_at` (timestamp), `void_reason` (text) a `loyalty_transactions`. El `deleted_at` existente marca la anulación lógica; las nuevas columnas guardan auditoría.

**Rationale**: La tabla ya tiene `deleted_at` para soft-delete. Añadir tres columnas en la misma tabla es más simple que una tabla `transaction_voids` separada y evita un JOIN en cada consulta de historial.

---

## Middleware de autenticación — utilidad `requireStaffAuth`

**Decision**: Función utilitaria `server/utils/staff-auth.ts` que exporta `requireStaffAuth(event, minRole?)`. No usar Nuxt server middleware global (afectaría todas las rutas).

```typescript
// Flujo interno:
// 1. getCookie(event, 'staff_session')
// 2. SELECT staff_sessions JOIN staff_users WHERE token = ? AND expires_at > NOW()
// 3. Si no existe → throw AuthError(401)
// 4. Si role < minRole → throw ForbiddenError(403)
// 5. return staffUser
```

**Rationale**: Cada ruta declara explícitamente qué nivel de acceso requiere. Es más legible que un middleware implícito y permite rutas públicas (login) sin configuración especial.

---

## Frontend — Estilos sin framework CSS

**Decision**: CSS con variables de CSS custom properties para los tokens de diseño. Sin Tailwind ni otro framework.

**Rationale**: No hay framework CSS instalado actualmente. El proyecto tiene ~5 páginas de staff portal. Añadir Tailwind (~200KB) para un portal interno no cumple el umbral KISS. Variables CSS como `--color-brand`, `--color-dark`, `--color-surface` son suficientes y alineadas con la constitution (dark theme, #F37021, Lato).

---

## AuthError en error-handler

**Decision**: Añadir `AuthError` (status 401) a `server/utils/error-handler.ts`. Actualmente existe `ForbiddenError` (403) pero no hay clase para no-autenticado (401).

**Rationale**: Necesario para distinguir "no tienes sesión" (401, redirige a login) de "tienes sesión pero sin permiso" (403, muestra error de acceso).
