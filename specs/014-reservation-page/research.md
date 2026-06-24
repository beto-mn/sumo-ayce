# Research: Reservation Page (014)

**Feature**: 014 — Reservation Page (/reservar)
**Branch**: `feat/018-reservation-page`
**Phase**: 0 — Research

---

## Decision Log

### D-001: Rendering mode for /reservar

**Decision**: `ssr: true` in `routeRules`

**Rationale**: The branch list must be included in the initial HTML so the form is fully rendered before JS hydrates. ISR would cache one user's branch list for all visitors, which is fine for branches but SSR is required here because the route also depends on query-param state that must be resolved server-side (pre-fill). Aligns with FR-002, rendering-strategy §3.1, and constitution Article V.

**Alternatives considered**:
- `isr: 3600` — rejected; branch list could become stale mid-session and pre-fill logic needs live context.
- `prerender: true` + client-side fetch — rejected; contradicts FR-003 which requires server-side `useAsyncData`.

---

### D-002: Slot generation as pure function

**Decision**: Export `generateSlots(open, close, date): string[]` from `app/features/reservation/composables/useReservationSlots.ts`.

**Rationale**: A pure function is trivially testable with Vitest, has no Vue reactivity coupling, and satisfies FR-016/FR-017. The composable file exports both the pure function and any reactive wrappers that consume it, keeping Article IV's co-located test rule easy to satisfy.

**Alternatives considered**:
- Inline slot computation in the form component — rejected; violates Article VIII (30-line function limit) and makes unit testing impossible without mounting a component.
- Separate `utils/` file — rejected; Article I forbids spreading a feature across `app/components/` or utilities when the logic is feature-scoped.

---

### D-003: Accent swap via :style binding

**Decision**: Bind `{ '--accent': tipo === 'ayce' ? 'var(--orange)' : 'var(--blue)' }` on the page wrapper `<div>` via `:style`.

**Rationale**: FR-020/FR-021 mandate a single scoped swap, not per-rule duplication. A `:style` binding on the wrapper element scopes the custom property to the subtree without any CSS duplication. Article VII forbids per-rule rewrites; the design context (docs/business/overview.md) assigns orange→AYCE and blue→Express.

**Alternatives considered**:
- Conditional Tailwind classes — rejected; FR-021 explicitly forbids duplicating CSS rules per type.
- CSS-in-JS — rejected; not in the stack, violates Article X (no library unless justified).

---

### D-004: Confirmation screen state management

**Decision**: Local `ref<'form' | 'confirmation'>` toggled on API success. Confirmation data held in a `ref<ReservationConfirmation | null>`.

**Rationale**: The confirmation is transient client state (spec Assumptions §6). No URL persistence, no Pinia store needed. A local reactive ref keeps the component self-contained and avoids premature abstraction (Article X).

**Alternatives considered**:
- URL-based state (`/reservar?confirmed=folio`) — rejected; spec edge-case §5 states a refresh should return to the empty form, not the confirmation.
- Pinia store — rejected; no second consumer of this state exists; Article X forbids abstraction for anticipated future use.

---

### D-005: Phone number stripping

**Decision**: Strip the `+52` prefix in the composable before building the API payload, not in the component template.

**Rationale**: FR-015 specifies stripping before submission. Doing it in a composable keeps the component clean and makes the stripping logic independently testable (Article IV).

**Alternatives considered**:
- Strip in component `<template>` binding — rejected; mixes presentation and data transformation.
- Strip server-side — rejected; the API's `contactPhone` field accepts the 10-digit string directly; no server-side change is warranted (feature is frontend-only).

---

### D-006: Existing UI primitives to reuse

**Confirmed available in `app/components/ui/`**:
- `Button.vue` — submit button (loading + disabled states via props)
- `Input.vue` — text inputs (Nombre, WhatsApp)
- `Select.vue` — dropdowns (Sucursal, Tipo, Hora)
- `Card.vue` — confirmation panel wrapper

**New components needed** (feature-scoped, in `app/features/reservation/components/`):
- `ReservationForm.vue` — main form orchestrator
- `ReservationConfirmation.vue` — post-submit confirmation screen
- `ReservationFieldError.vue` — inline per-field error display (or reuse `Input`'s error slot if one exists)

Each new component requires a co-located `.stories.ts` (Article VII).

---

### D-007: i18n key namespace

**Decision**: Use namespace `reservation.*` for all keys in the `@nuxtjs/i18n` locale files.

**Rationale**: Keeps reservation copy isolated and avoids collisions with existing keys from other features. Consistent with the pattern used by feature 017 (contact page).

---

### D-008: Branch card link update strategy

**Decision**: Update `app/features/branches/` components to use `<NuxtLink :to="'/reservar?branch=' + branch.id + '&type=' + branch.type"` replacing `useReservationModal().openReservation()` calls.

**Rationale**: FR-033/FR-034 mandate this update. Using `NuxtLink` (not `router.push`) keeps the link crawlable and pre-fetchable. The modal composable remains in the codebase for backward compatibility but its call-sites in branch cards and homepage CTAs are removed.

---

## Open Questions at Research Completion

None. All acceptance criteria, API shapes, rendering mode, and component boundaries are fully specified.
