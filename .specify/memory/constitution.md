<!--
## Sync Impact Report

**Version Change**: 1.1.0 → 1.1.1 (PATCH — structural consolidation, no rules lost or added)

**Modified Principles**:
- I. "Code Quality" → I. "TypeScript & Framework Standards" (rename for clarity)
- III. "Testing" → III. "Testing" (merged with former VIII, content expanded)

**Removed Sections**:
- VIII. "Test Discipline" — absorbed entirely into III. Testing

**Fixes Applied**:
- Removed redundant try/catch sentence from VII (covered by XI Error Handling Convention)
- Bare console.log prohibition retained in VII as a standalone rule
- Principles renumbered after former VIII removal: IX→VIII, X→IX, XI→X, XII→XI, XIII→XII

**Templates Status**:
- `.specify/templates/plan-template.md` ✅ No updates required
- `.specify/templates/spec-template.md` ✅ No updates required
- `.specify/templates/tasks-template.md` ✅ No updates required
- `.specify/templates/checklist-template.md` ✅ No updates required

**Deferred Items**: None
-->

# SUMO AYCE Constitution

## Core Principles

### I. TypeScript & Framework Standards

All code MUST be written in TypeScript strict mode with no `any` types. Vue components MUST
use the Composition API exclusively — Options API is prohibited. Server routes MUST follow
RESTful conventions under `/server/api/`. Types shared between frontend and backend MUST live
in the `/types/` directory; no type duplication across boundaries is permitted.

**Rationale**: Strict typing and consistent API patterns eliminate entire categories of runtime
errors and make the codebase navigable without tribal knowledge. Shared types are the contract
between layers — duplicating them is how divergence starts.

### II. Architecture

The project MUST remain a single Nuxt 3 repository: frontend pages and backend server routes
co-located in one repo, one deploy. WordPress MUST be treated as a headless CMS only
(menu, promotions, branch info). Features with transactional state (reservations, loyalty,
staff portal) MUST connect directly to Neon PostgreSQL — never through WordPress. All
WordPress-sourced pages MUST use ISR with a 60-second revalidation interval. All external
service credentials MUST be injected via environment variables.

**Rationale**: Keeping everything in one repo eliminates deployment coordination overhead.
Bypassing WordPress for transactional data avoids coupling a content tool to business logic.
ISR at 60 s gives editors near-real-time updates without sacrificing edge-cached performance.

### III. Testing

Every server route and composable MUST have unit tests. Unit tests MUST be co-located with
the code they test (`useReservation.ts` → `useReservation.test.ts`). Critical user flows
(reservation submission, loyalty registration) MUST have E2E tests. External integrations
(Twilio, Google Drive) MUST have API integration tests that can run against real sandbox
credentials in CI. Tests MUST be written before the implementation they cover for server-side
logic.

Test names MUST describe behavior, not implementation (e.g., "should send WhatsApp
confirmation when reservation is created", not "test sendMessage function"). Mocks for
external services (Twilio, Google Drive, Mapbox) MUST be centralized in `/tests/mocks/`.
No test MAY depend on another test's state. Coverage thresholds MUST be enforced: 80%
minimum for server routes, 70% minimum for composables.

**Rationale**: Co-location keeps tests discoverable and removes the friction of parallel
directory trees. Server routes carry business logic and external side-effects — unit coverage
is the minimum safety net. E2E tests on reservations and loyalty protect the revenue-critical
paths. Behavior-driven names make failing tests self-explanatory in CI. Centralized mocks
prevent drift where different tests mock the same service differently. State-independent tests
eliminate ordering dependencies that produce intermittent failures.

### IV. Performance

Every public page MUST achieve a Lighthouse score of 90+ on all metrics. Images MUST be
optimized and lazy-loaded. SEO-critical pages (homepage, menu, branches, SUMO Express, contact)
MUST be server-side rendered. Interactive features (maps, reservation form, loyalty portal) MUST
use client-side hydration only for their interactive shell.

**Rationale**: Restaurant discovery is mobile-dominated and often on slow connections. A 90+
Lighthouse score is a concrete, auditable commitment, not a vague aspiration. SSR ensures
search engines index content correctly, directly affecting discoverability.

### V. Security

The staff portal MUST implement role-based authentication with three roles: `staff`, `manager`, and `admin`.
Every public API endpoint MUST validate input with Zod schemas before processing. Public API
routes MUST be rate-limited. CORS MUST be restricted to `sumo.com.mx` (and `localhost` in
development). No credentials, tokens, or secrets MAY be committed to the repository.

**Rationale**: The staff portal accesses loyalty transaction data and visit validation —
privilege escalation here has direct financial consequences. Input validation at the boundary
prevents injection and malformed-data bugs from propagating inward. Rate limiting protects
against abuse of the reservation and loyalty endpoints without requiring authentication.

### VI. UX Consistency

All pages MUST use the dark theme (`#0F0F0F` / `#1A1A1A` backgrounds). Brand orange `#F37021`
is the primary accent color. Express blue `#2B3990` is reserved exclusively for SUMO Express
content and MUST be introduced via gradient transitions from the dark theme — never as a
standalone base color on non-Express pages. The SUMO logo MUST be used as-is: square format,
orange background, white "SUMO" text, black bar. All layouts MUST be mobile-first. The Lato
typeface MUST be used site-wide.

**Rationale**: Visual consistency across a chain's digital presence builds brand recognition.
The Express blue constraint prevents the sub-brand color from diluting the primary identity.
Mobile-first is non-negotiable given the restaurant's Mexican market where smartphone browsing
dominates.

### VII. Clean Code Discipline

Functions MUST do one thing and do it well. No function MAY exceed 30 lines — if it does,
it MUST be decomposed. No component file MAY exceed 200 lines. Dead code, commented-out code,
and TODO comments MUST NOT exist in the main branch. Variable and function names MUST be
self-documenting — no abbreviations, no single-letter names except loop counters. Bare
`console.log` statements are prohibited. Composables MUST use the `use` prefix
(`useReservation`, `useLoyalty`). Vue components MUST use PascalCase filenames. Server routes
MUST use kebab-case filenames.

**Rationale**: The 30-line function limit and 200-line file limit are hard constraints, not
guidelines — they force decomposition before complexity becomes load-bearing. Self-documenting
names eliminate the need for explanatory comments, which rot. The naming conventions (`use*`,
PascalCase, kebab-case) make file type and purpose deterministic from the filename alone.

### VIII. Quality Gates (NON-NEGOTIABLE)

Every commit MUST pass pre-commit hooks enforced by Husky. These gates MUST NOT be bypassed
with `--no-verify` under any circumstances:

- **Pre-commit**: Biome linting passes, Biome formatting passes, type-check passes
  (`vue-tsc --noEmit`).
- **Commit message**: Conventional Commits format enforced via commitlint. Allowed prefixes:
  `feat:`, `fix:`, `chore:`, `refactor:`, `test:`, `docs:`, `ci:`.
- **Pre-push**: All unit tests pass, all integration tests pass, no TypeScript errors.

Biome is the sole linter and formatter — ESLint and Prettier MUST NOT be installed. The Biome
configuration file MUST be committed to the repository. The CI pipeline MUST mirror all three
gates identically.

**Rationale**: Gates enforced by tooling, not convention, cannot be forgotten or skipped under
deadline pressure. A single toolchain (Biome) eliminates the configuration conflicts and
performance overhead of running ESLint and Prettier separately. Mirrored CI gates mean a
passing commit is guaranteed to pass CI — no surprises on push.

### IX. KISS — Keep It Simple, Stupid

The simplest solution that satisfies the spec MUST be preferred. A library MAY NOT be added
unless it saves more than 100 lines of equivalent hand-written code or provides functionality
not feasible to implement (Twilio SDK, Mapbox GL, Prisma/Drizzle). Abstraction layers MUST NOT
be created for anticipated future use — abstract only when a concrete second use case already
exists in the codebase. No design pattern MAY be introduced unless the problem demonstrably
requires one. Over-engineering is treated as a defect and MUST be flagged in code review.

**Rationale**: Abstraction has a carrying cost: every layer added is a layer that must be read,
tested, and maintained. For a project of this scale, premature abstraction produces complexity
without payoff. The 100-line threshold for library adoption makes the trade-off explicit and
auditable.

### X. Absolute Imports via Alias

All imports MUST use path aliases configured in `tsconfig.json` and `nuxt.config.ts`. The
following aliases are mandatory and MUST NOT be redefined or removed:

| Alias | Resolves to |
|-------|-------------|
| `@/components/` | Vue components |
| `@/composables/` | Composables |
| `@/server/` | Server routes and utilities |
| `@/types/` | Shared TypeScript types |
| `@/utils/` | Shared utility functions |

Relative imports (`../`) are prohibited except within the same directory. This constraint
applies to both frontend and server-side code.

**Rationale**: Relative imports break silently on file moves and produce long `../../..` chains
that obscure the logical structure. Aliases are refactor-safe, readable, and make the import's
origin unambiguous regardless of where the importing file lives.

### XI. Error Handling Convention

All server routes MUST delegate error responses to a centralized error handler utility at
`/server/utils/error-handler.ts`. Errors MUST be categorized using these types with their
corresponding HTTP status codes:

| Error type | Status |
|------------|--------|
| `ValidationError` | 400 |
| `AuthError` | 401 / 403 |
| `NotFoundError` | 404 |
| `ExternalServiceError` | 502 |
| `InternalError` | 500 |

All errors MUST be logged with structured context: timestamp, route, error type, message, and
stack trace (development only). User-facing error responses MUST never expose internal details,
stack traces, or database information. External service failures (Twilio, Google Drive,
WordPress API) MUST fail gracefully — fallback behavior MUST be documented in the feature spec.

**Rationale**: A centralized handler means error shape, logging format, and safe-response policy
are enforced in one place. Typed error categories make HTTP status codes deterministic and
auditable. Stripping internals from user-facing responses prevents information leakage that
aids attackers.

### XII. Environment Validation

The application MUST validate all required environment variables at startup before accepting
any requests. A missing or empty required variable MUST cause an immediate startup failure with
a clear error message listing every missing variable. Environment variables MUST be typed and
validated via a Zod schema in `/server/utils/env.ts`. The following variable groups are
required:

| Group | Variables |
|-------|-----------|
| `DATABASE` | Neon PostgreSQL connection string (`DATABASE_URL`) |
| `TWILIO` | Account SID, auth token, WhatsApp number |
| `GOOGLE_DRIVE` | Service account credentials JSON, target folder ID |
| `WORDPRESS` | API base URL |
| `MAPBOX` | Public token |

`.env.local` MUST be used in development and MUST be gitignored. A `.env.example` file MUST
be committed to the repository containing all required variable names with descriptions but
no values.

**Rationale**: Silent misconfiguration — where the app starts but fails mid-request — is harder
to debug than a startup crash with a clear variable list. Zod validation makes the environment
contract explicit, typed, and testable. A committed `.env.example` ensures new developers know
exactly what they need without reading code.

## Technology Stack & Infrastructure

**Frontend**: Nuxt 3 (Vue 3 + TypeScript), deployed to Vercel.
**Backend**: Nuxt server routes (`/server/api/`), deployed on the same Vercel project.
**Database**: Neon PostgreSQL (serverless HTTP driver) accessed via Drizzle ORM.
**CMS**: WordPress (headless) on Hospedando.mx — REST API only, no WPGraphQL required.
**Maps**: Mapbox GL JS — branch finder with geolocation and postal code fallback.
**Messaging**: Twilio WhatsApp Business API (~$0.03 USD/message). Used for reservation
confirmations to clients and notifications to branch managers.
**Storage**: Google Drive API via Service Account — daily CSV cron job uploads reservation
data at end of day.
**DNS/Hosting**: Hospedando.mx (domain + email); optionally Cloudflare for DNS.
**Font**: Lato (self-hosted or Google Fonts).
**Toolchain**: Biome (lint + format), Husky (git hooks), commitlint (commit message
validation), vue-tsc (type-checking).

Monthly infrastructure costs are bounded at approximately $550–2,950 MXN + $20 USD (Vercel Pro),
with Twilio being the primary variable cost.

## Development Workflow

Code MUST be reviewed before merging to the main branch. All commits MUST pass the three-stage
quality gate defined in Principle VIII — no exceptions. All external service credentials MUST
be present in `.env.local` (development) and Vercel environment settings (production) — never
in code or committed files. A `.env.example` MUST be kept current (Principle XII). The daily
CSV cron job MUST be implemented as a Vercel Cron function. The WordPress admin interface is
the sole content management surface for the client — no developer intervention MUST be required
for routine content updates (menu, promotions, branch info). Feature branches MUST be created
per specification before implementation begins.

## Governance

This Constitution supersedes all other practices, conventions, and prior agreements. Any
amendment MUST be documented here with a version bump following semantic versioning:

- **MAJOR**: Backward-incompatible removal or redefinition of an existing principle.
- **MINOR**: Addition of a new principle, section, or materially expanded guidance.
- **PATCH**: Clarifications, wording improvements, or non-semantic refinements.

All implementation plans MUST include a Constitution Check gate before Phase 0 research.
Complexity that violates a principle MUST be justified in the plan's Complexity Tracking table.
This document is the authoritative reference for all code review and specification decisions.

**Version**: 1.1.3 | **Ratified**: 2026-05-21 | **Last Amended**: 2026-05-22
