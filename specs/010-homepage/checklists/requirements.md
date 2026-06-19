# Specification Quality Checklist: Homepage (`/`)

**Purpose**: Validate specification completeness and quality before proceeding to planning
**Created**: 2026-06-19
**Feature**: [spec.md](../spec.md)

## Content Quality

- [x] No implementation details (languages, frameworks, APIs)
- [x] Focused on user value and business needs
- [x] Written for non-technical stakeholders
- [x] All mandatory sections completed

## Requirement Completeness

- [x] No [NEEDS CLARIFICATION] markers remain
- [x] Requirements are testable and unambiguous
- [x] Success criteria are measurable
- [x] Success criteria are technology-agnostic (no implementation details)
- [x] All acceptance scenarios are defined
- [x] Edge cases are identified
- [x] Scope is clearly bounded
- [x] Dependencies and assumptions identified

## Feature Readiness

- [x] All functional requirements have clear acceptance criteria
- [x] User scenarios cover primary flows
- [x] Feature meets measurable outcomes defined in Success Criteria
- [x] No implementation details leak into specification

## Notes

- The spec contains no `[NEEDS CLARIFICATION]` markers.
- **Reconciled to built state (2026-06-20):** the spec set was edited to match what was
  actually built. Sourcing as built: promotions → WordPress `promociones` endpoint via a
  Nitro route (two-step home-flag → active fallback, fetch timeouts, `acf.imagen` flyer
  resolved into a lightbox); featured dishes/drinks → **static committed fixture** via
  `useFeaturedDishes` (route-compatible shape, swappable later — NOT a DB route; no
  Drizzle/Neon anywhere); reviews → static committed fixture. The promo badge color is the
  editor `acf.color` and a decorative type-bar encodes `acf.tipo` (express→blue). Visual
  language is "Mercado Pop"; shell components live under `app/components/layout/`; a new
  `UiLightbox` primitive was added. The DB-route-specific constitution gate clauses are
  N/A as built (no DB read) and the gates remain satisfied. spec/plan/tasks/data-model/
  research/both contracts/quickstart were all patched. No new clarification markers were
  introduced.
- **Every acceptance criterion maps to a test:** ~350 tests across co-located `.spec.ts`
  per component/composable + the promotions server-route spec + `home-degradation.spec.ts`.
- All tasks in `tasks.md` are `[x]` except **T042** (Lighthouse), which is legitimately
  `[~]` deferred to post-deploy verification on the CI preview link (feature 009).
- The reduced scope of the reserve CTA (open-intent only while feature 014 is pending)
  has a reasonable default recorded in Assumptions; the Reservar button is wired in the
  global `SiteHeader`.
