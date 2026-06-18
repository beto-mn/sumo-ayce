# Implementation Plan: Staff Portal

**Branch**: `feat/006-staff-portal` | **Date**: 2026-05-28 | **Spec**: [spec.md](./spec.md)

## Summary

Construir el portal de operaciones para el personal de SUMO que permite: registrar visitas, crear clientes, canjear recompensas (todos los roles), y administrar historial/anulaciones/métricas (admin+). Implementa autenticación con sesiones opacas almacenadas en BD, con acceso diferenciado por rol (`staff`, `admin`, `owner`).

## Technical Context

**Language/Version**: TypeScript 5.x (strict mode), Node.js 20 (Vercel)
**Primary Dependencies**: Nuxt 4, Vue 3, Drizzle ORM, Zod, h3 (built-in), `node:crypto` (built-in)
**Storage**: Neon PostgreSQL — tablas `staff_users`, `staff_sessions`, `loyalty_transactions`, `customers`, `rewards`, `redemptions` (ya existen)
**Testing**: Vitest (unit co-located), Playwright vía `@nuxt/test-utils` (E2E)
**Target Platform**: Vercel (server routes + frontend), tablet/desktop (≥768px)
**Project Type**: Full-stack web application (Nuxt 4 monorepo)
**Performance Goals**: Dashboard carga <2s, operaciones individuales <500ms
**Constraints**: Sesiones 8h TTL, roles jerárquicos, staff ligado a una sucursal
**Scale/Scope**: ~50 usuarios staff, ~100–500 transacciones/día

## Constitution Check

| Principio | Estado | Notas |
|-----------|--------|-------|
| I. TypeScript strict, Composition API, `/server/api/` | PASS | Aplicado en todas las rutas nuevas |
| II. Single Nuxt repo, PostgreSQL directo | PASS | No hay capa intermedia |
| III. Unit tests co-located, E2E para login + flujo cajero | PASS | Ver sección de estructura |
| IV. Performance (Lighthouse 90+) | PASS | Portal interno optimizado para tablet |
| V. RBAC con tres roles | **VIOLATION** | Schema usa `manager`/`admin`; user requiere `admin`/`owner` — ver Complexity Tracking |
| VI. Dark theme, Lato, Storybook, responsive 3 breakpoints | PASS | Obligatorio en todos los componentes Vue |
| VII. Funciones <30 líneas, componentes <200 líneas | PASS | Aplicado en diseño |
| VIII. Quality gates: Biome, commitlint, pre-push | PASS | Sin cambios en pipeline |
| IX. KISS — `node:crypto` para sesiones, sin librería JWT | PASS | Ver research.md |
| X. Absolute imports via aliases | PASS | `@/server/`, `@/types/`, etc. |
| XI. Error handler centralizado | PASS | Añadir `AuthError` (401) al handler existente |
| XII. Env validation — no nueva variable requerida | PASS | Tokens opacos no requieren secreto |

## Project Structure

### Documentation (this feature)

```text
specs/006-staff-portal/
├── plan.md              ← este archivo
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── api.md
└── tasks.md             ← generado por /speckit-tasks
```

### Source Code

```text
server/
├── api/v1/staff/
│   ├── auth/
│   │   ├── login.post.ts
│   │   ├── logout.post.ts
│   │   └── me.get.ts
│   ├── customers/
│   │   ├── [phone].get.ts
│   │   └── index.post.ts
│   ├── transactions/
│   │   └── index.post.ts
│   ├── redemptions/
│   │   └── index.post.ts
│   └── admin/
│       ├── transactions/
│       │   ├── index.get.ts
│       │   └── [id]/void.post.ts
│       └── reports/
│           └── daily.get.ts
├── utils/
│   └── staff-auth.ts           ← NEW: requireStaffAuth(event, minRole?)
└── db/
    └── migrations/
        └── 0007_*.sql          ← rename enum + add void columns

app/
├── pages/staff/
│   ├── login.vue
│   ├── dashboard.vue
│   ├── customers/[phone].vue
│   └── admin/
│       ├── index.vue
│       └── transactions/[id].vue
├── components/staff/
│   ├── LoginForm.vue + LoginForm.stories.ts
│   ├── CustomerCard.vue + CustomerCard.stories.ts
│   ├── VisitButton.vue + VisitButton.stories.ts
│   ├── RewardsList.vue + RewardsList.stories.ts
│   └── TransactionTable.vue + TransactionTable.stories.ts
└── composables/
    ├── useStaffAuth.ts + useStaffAuth.test.ts
    └── useStaffCustomer.ts + useStaffCustomer.test.ts

types/
└── staff.ts                    ← StaffUser, StaffRole, StaffSession
```

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|--------------------------------------|
| Principio V: roles `admin`/`owner` vs schema `manager`/`admin` | El usuario definió explícitamente `staff`, `admin`, `owner` como jerarquía del negocio. `owner` es más claro que `admin` para el dueño de la cadena. | Mantener `manager`/`admin` confunde a futuros desarrolladores — el nombre `manager` sugiere gerente de sucursal, no dueño. La migración 0007 actualiza el enum antes de que haya datos en producción. |
