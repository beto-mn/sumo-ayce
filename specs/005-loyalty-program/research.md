# Research: Loyalty Program

**Branch**: `feat/005-loyalty-program` | **Date**: 2026-05-26

---

## 1. Atomic balance updates (earn & redeem)

**Decision**: DB transaction with `SELECT ... FOR UPDATE` + conditional check before deducting.

**Rationale**: `UPDATE ... WHERE points_balance >= cost` con conteo de filas afectadas no es fiable en Drizzle sin acceso a `rowCount`. El patrón `FOR UPDATE` dentro de una `db.transaction()` es el estándar en PostgreSQL para locks optimistas: bloquea la fila durante la transacción, evita lecturas sucias y garantiza que el check de saldo sea atómico con el descuento.

**Alternatives considered**:
- SQL expression `SET points_balance = points_balance - cost WHERE points_balance >= cost` — válido pero Drizzle no expone `rowsAffected` directamente en Neon HTTP driver; requiere workaround frágil.
- Application-level lock — descartado: no funciona en entorno serverless con múltiples instancias.

**Implementation pattern**:
```
db.transaction(async tx => {
  const [customer] = await tx.select().from(customers)
    .where(eq(customers.id, id)).for('update')
  if (customer.pointsBalance < cost) throw new UnprocessableError(...)
  await tx.update(customers)
    .set({ pointsBalance: sql`${customers.pointsBalance} - ${cost}` })
    .where(eq(customers.id, id))
  // insert loyaltyTransaction + redemption
})
```

---

## 2. Redemption code (short alphanumeric)

**Decision**: Reutilizar `server/utils/folio.ts` — genera códigos 8-char `[A-Z0-9]`, unique index en BD.

**Rationale**: El patrón ya existe y es probado. Un UUID completo es impráctico para que el cliente lo muestre al staff verbalmente o en pantalla. 8 caracteres ofrecen ~2.8 billones de combinaciones; colisiones negligibles a la escala de SUMO (<50 sucursales).

**Schema impact**: Se requiere una migración para agregar `code varchar(8) NOT NULL UNIQUE` a la tabla `redemptions`. Sin cambio en otras tablas.

**Alternatives considered**:
- UUID como código — único pero ilegible para el cliente (36 chars).
- Código numérico de 6 dígitos — solo 1M combinaciones; colisiones posibles a mediano plazo.

---

## 3. WhatsApp "SALDO" keyword en webhook existente

**Decision**: Extender `server/api/webhooks/twilio.post.ts` con un check previo al regex de reservaciones.

**Rationale**: El webhook ya maneja la verificación de firma Twilio y la normalización de teléfono. Agregar un branch para `body === 'SALDO'` antes del KEYWORD_REGEX de reservaciones reutiliza toda esa infraestructura sin duplicar lógica. Case-insensitive via `.trim().toUpperCase()` ya aplicado.

**Flow**:
```
body = params.Body.trim().toUpperCase()

if (body === 'SALDO') → loyalty balance lookup
else if KEYWORD_REGEX.test(body) → reservation keyword handler
else → msgEncargadoKeywordInvalido
```

**Alternatives considered**:
- Webhook separado `/api/webhooks/twilio-loyalty` — descartado: Twilio solo admite un webhook URL por número; split requeriría un router intermedio.
- Regex unificado — descartado: la semántica de SALDO es distinta a ACEPTAR/RECHAZAR y mezclarlos complica el parsing.

---

## 4. Detección de recompensas desbloqueadas al ganar puntos

**Decision**: Comparar saldo previo vs nuevo contra `rewards.pointsCost` en memoria, después del UPDATE.

**Rationale**: Con <50 recompensas activas, un `SELECT` de todas las recompensas activas y un filter JS es más que suficiente. La lógica es: `rewards.filter(r => r.pointsCost > prevBalance && r.pointsCost <= newBalance)`. Esto garantiza que solo se notifican las recompensas que el cliente acaba de desbloquear con esa visita, no las que ya tenía alcanzadas antes.

**Alternatives considered**:
- SQL WHERE clause en la query — equivalente en resultado, pero más difícil de testear unitariamente.
- Notificar todas las recompensas alcanzables siempre — descartado: spam de notificaciones en cada visita si ya tenías puntos suficientes.

---

## 5. Auth en endpoints de staff (feat/005 vs feat/006)

**Decision**: Los endpoints de staff (`POST /transactions`, `GET /customers/:phone`, `POST /redemptions`, `PATCH /redemptions/:id/use`) se implementan sin auth en feat/005. Auth se agrega en feat/006 (Staff Portal).

**Rationale**: La autenticación de staff es responsabilidad de feat/006. Implementarla aquí en 005 duplicaría trabajo. Los endpoints estarán documentados como "requieren staff auth" en los contratos — feat/006 añade el middleware. Mientras tanto, están protegidos solo por rate limiting global.

**Risk**: Los endpoints son técnicamente accesibles sin auth en este sprint. Aceptable dado que están en desarrollo y prod no está en vivo aún.

---

## 6. Env vars nuevas

| Variable | Default | Descripción |
|----------|---------|-------------|
| `LOYALTY_POINTS_PER_VISIT` | `10` | Puntos fijos que se acreditan por visita |
| `LOYALTY_REDEMPTION_EXPIRY_HOURS` | `72` | Horas antes de que un canje 'pending' expire |

Ambas opcionales (fallback en código). No bloquean startup si no están presentes.
