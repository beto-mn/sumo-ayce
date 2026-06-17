# Contracts — Scaffold & Design System (Mercado Pop)

**Feature**: 007 | **Plan**: [../plan.md](../plan.md)

## No API contracts in this feature

This feature is the frontend chassis: design tokens, base UI primitives, default layout, i18n setup, route rendering rules, and Storybook coverage. It does NOT introduce any server route, public API endpoint, RPC interface, or external integration contract.

Per the constitution (Article III — Architecture), backend logic lives under `server/api/v1/<feature>/` and is the responsibility of the features that need it. The contracts for those features live in their respective spec folders:

- `specs/001-db-schema-drizzle/` — Drizzle schema for `reservations`, `customers`, `loyalty_transactions`, `branches`, `staff_users`, `staff_sessions`, `rewards`, `redemptions`.
- `specs/002-reservaciones-crud/contracts/api.md` — reservation API.
- `specs/003-twilio-notifications/contracts/api.md` — WhatsApp notification API.
- `specs/004-branch-finder-location/contracts/api.md` — branch search API.
- `specs/005-loyalty-program/contracts/api.md` — loyalty customer / transaction / redemption API.
- `specs/006-staff-portal/contracts/api.md` — staff portal API.

## Design-time contracts

The design-time contracts this feature DOES define live in [`../data-model.md`](../data-model.md):

- **Design Token Set** — the canonical Mercado Pop tokens (colors, radii, shadows, type scale, breakpoints).
- **Accent Scope** — the `.scope-express` class contract.
- **i18n Locale File** — the seed key set and the brand-copy locked values.
- **UI Base Component** — prop tables for the ten base primitives.

These contracts are enforced by Storybook stories, code review, and grep checks against the codebase. There is no API surface to publish here.
