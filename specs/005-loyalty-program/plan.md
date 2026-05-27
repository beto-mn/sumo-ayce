# Implementation Plan: Loyalty Program

**Branch**: `feat/005-loyalty-program` | **Date**: 2026-05-26 | **Spec**: [spec.md](spec.md)  
**Input**: Feature specification from `specs/005-loyalty-program/spec.md`

## Summary

Implementar el sistema de lealtad de SUMO: registro de clientes, acumulación de puntos por visita, catálogo de recompensas y canje. Las notificaciones WhatsApp reutilizan la infraestructura Twilio de feat/003. El webhook existente se extiende con el keyword `SALDO` para que los clientes consulten su saldo. Se requiere una migración menor (columna `code` en `redemptions`). No hay frontend en esta feature — todos los endpoints son consumidos por el Staff Portal (feat/006).

## Technical Context

**Language/Version**: TypeScript 5 strict mode  
**Primary Dependencies**: Nuxt 3 server routes (h3), Drizzle ORM, Zod, Twilio SDK (ya instalados)  
**Storage**: Neon PostgreSQL — tablas `customers`, `loyalty_transactions`, `rewards`, `redemptions` existentes + migración menor (`code` en `redemptions`)  
**Testing**: Vitest + `@nuxt/test-utils`, mocks en `/tests/mocks/` (patrón existente)  
**Target Platform**: Vercel (Nuxt server routes)  
**Project Type**: web-service (backend endpoints)  
**Performance Goals**: < 500 ms p95 para earn/redeem (incluye escritura BD + envío WhatsApp async)  
**Constraints**: Sin dependencias nuevas. Atomicidad en balance via `db.transaction()`. 30 líneas máx por función (Constitution VII). Sin auth en esta feature — feat/006 agrega middleware.  
**Scale/Scope**: < 50 sucursales, < 5,000 clientes iniciales. Fetch-all de rewards en JS es seguro.

## Constitution Check

| Principio | Estado | Notas |
|-----------|--------|-------|
| I. TypeScript strict | ✅ | `decimal` de Drizzle → `string` en runtime; parsear a `number` donde aplique. No `any`. |
| II. Arquitectura | ✅ | Rutas en `server/api/v1/loyalty/`, utils en `server/utils/`. Sin WordPress. DB directo. |
| III. Testing | ✅ | Tests antes de implementación. Mocks de Twilio en `/tests/mocks/`. 80% coverage mínimo. |
| IV. Performance | ✅ | Sin frontend en esta feature — no aplica Lighthouse. |
| V. Seguridad | ✅ | Zod en todos los endpoints. Rate limiting global aplica. Auth se agrega en feat/006 (documentado). |
| VI. UX | ✅ | Sin componentes Vue en esta feature. |
| VII. Clean Code | ✅ | Funciones ≤ 30 líneas. Utility `loyalty-messages.ts` separa templates. `loyalty-config.ts` separa configuración. |
| VIII. Quality Gates | ✅ | Biome + vue-tsc + pre-push tests deben pasar en cada commit. |
| IX. KISS | ✅ | Sin nuevas dependencias. `folio.ts` reutilizado para código de canje. Balance check en JS sobre array pequeño. |
| X. Imports | ✅ | Alias `@/server/utils/...` en todos los imports. Sin rutas relativas cross-directory. |
| XI. Error Handling | ✅ | `handleError` centralizado. `UnprocessableError` para puntos insuficientes. `NotFoundError` para cliente no encontrado. Twilio falla silenciosa (log + no bloquea respuesta). |
| XII. Env Validation | ✅ | `LOYALTY_POINTS_PER_VISIT` y `LOYALTY_REDEMPTION_EXPIRY_HOURS` son opcionales (defaults en código). No bloquean startup. |

**Resultado**: Sin violaciones. No se requiere tabla de Complexity Tracking.

## Project Structure

### Documentation (this feature)

```text
specs/005-loyalty-program/
├── plan.md              ← este archivo
├── research.md          ← Phase 0 ✅
├── data-model.md        ← Phase 1 ✅
├── quickstart.md        ← Phase 1 ✅
├── contracts/
│   └── api.md           ← Phase 1 ✅
└── tasks.md             ← /speckit-tasks (no creado aquí)
```

### Source Code

```text
server/
├── api/
│   ├── v1/
│   │   └── loyalty/
│   │       ├── customers/
│   │       │   ├── index.post.ts              # POST /api/v1/loyalty/customers
│   │       │   └── [phone]/
│   │       │       └── index.get.ts           # GET /api/v1/loyalty/customers/:phone
│   │       ├── transactions/
│   │       │   └── index.post.ts              # POST /api/v1/loyalty/transactions
│   │       ├── rewards/
│   │       │   └── index.get.ts               # GET /api/v1/loyalty/rewards
│   │       └── redemptions/
│   │           ├── index.post.ts              # POST /api/v1/loyalty/redemptions
│   │           └── [id]/
│   │               └── use.patch.ts           # PATCH /api/v1/loyalty/redemptions/:id/use
│   └── webhooks/
│       └── twilio.post.ts                     # Extender con SALDO keyword (existente)
└── utils/
    ├── loyalty-config.ts                      # LOYALTY_POINTS_PER_VISIT config (nuevo)
    └── loyalty-messages.ts                    # WhatsApp templates de lealtad (nuevo)

tests/server/
├── api/v1/loyalty/
│   ├── customers/
│   │   ├── index.post.test.ts
│   │   └── [phone]/index.get.test.ts
│   ├── transactions/index.post.test.ts
│   ├── rewards/index.get.test.ts
│   └── redemptions/
│       ├── index.post.test.ts
│       └── [id]/use.patch.test.ts
└── utils/
    └── loyalty-messages.test.ts
```

**Structure Decision**: Single Nuxt 3 project. Backend only — sin páginas Vue. Todos los endpoints bajo `/api/v1/loyalty/` siguiendo el patrón establecido en feat/002–004.

## Key Design Decisions

### Atomicidad del balance
`db.transaction()` con `SELECT ... FOR UPDATE` antes de cualquier deducción. Garantiza que el saldo nunca llega a negativo incluso con concurrencia.

### Código de canje
Reutilizar `server/utils/folio.ts` (8 chars `[A-Z0-9]`). Requiere migración para agregar columna `code VARCHAR(8) NOT NULL UNIQUE` a `redemptions`.

### Detección de recompensas desbloqueadas
Después de acreditar puntos, query de rewards activas en JS: `rewards.filter(r => r.pointsCost > prevBalance && r.pointsCost <= newBalance)`. Solo notifica las recién desbloqueadas.

### SALDO keyword
Extender el webhook existente `twilio.post.ts` con un check `body === 'SALDO'` antes del regex de reservaciones. Lookup por teléfono normalizado.

### Auth diferida
Endpoints de staff sin auth en feat/005. Feat/006 agrega middleware de autenticación. Documentado en contratos como `[staff]`.

### Twilio falla silenciosa
Si Twilio falla, se loguea el error pero no se bloquea la respuesta al staff. La transacción de BD ya fue confirmada. El cliente simplemente no recibe el WhatsApp.
