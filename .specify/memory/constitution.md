<!--
## Sync Impact Report

**Version Change**: 3.0.0 → 3.1.0 (MINOR — Article V "Performance" materially expanded: rendering-mode specifics (which routes are ISR vs SSR vs dynamic) deferred to a new file `docs/business/rendering-strategy.md` as the single source of truth. The principle itself is preserved; specifics moved to keep the constitution free of route-level config that should evolve with the app.)

**Materially expanded principles**:
- V. "Performance" — added explicit deferral to `docs/business/rendering-strategy.md` for per-route rendering decisions and the hard constraints around backend logic never being static. Existing rules (Lighthouse 90+, image optimization, mobile-first SEO concern) are preserved.

**Added artifacts**:
- `docs/business/rendering-strategy.md` — per-route rendering rules (ISR 3600 / ISR 60 / SSR / dynamic), hard constraints (backend logic never static, separated data sources, on-demand revalidation), reviewer enforcement checklist, anti-patterns.

**Templates Status**:
- `.specify/templates/plan-template.md` ✅ No updates required.
- `.specify/templates/spec-template.md` ✅ No updates required.
- `.specify/templates/tasks-template.md` ✅ No updates required.
- `.specify/templates/checklist-template.md` ✅ No updates required.

**Deferred Items**: None.

---

## Prior Sync Impact Reports

### 2.0.0 → 3.0.0 (MAJOR)
Article VII "UX Consistency & Component Documentation" had concrete visual rules (dark theme, exact hex colors, typeface choice, Express-blue gradient rule) removed and deferred to `docs/business/overview.md` as the single source of truth. Article VII now focuses on process rules: mobile-first responsive discipline, Storybook coverage, logo-unmodified usage, per-type `--accent` swap discipline, Express-accent-exclusive rule. Removing previously-enforced concrete rules from a principle is a backward-incompatible redefinition (MAJOR per governance).

### 1.2.0 → 2.0.0 (MAJOR)
Added Article I "Code Organization & Reusability (NON-NEGOTIABLE)"; renumbered existing I-XII to II-XIII; corrected Nuxt 3 → Nuxt 4 in Architecture and Technology Stack; updated cross-references in `docs/harness/verification.md` and `docs/harness/specs.md`. Renumbering articles is backward-incompatible for any reference by number.
-->

# SUMO AYCE Constitution

## Core Principles

### I. Code Organization & Reusability (NON-NEGOTIABLE)

The codebase MUST be organized by **feature** (vertical slice), not by technical layer.
A feature is a coherent unit of business functionality (reservations, loyalty, branches,
staff, etc.). Each feature owns its UI components, composables, server routes, validators,
and types in its own folder.

**Backend structure** — server routes under `server/`:

```
server/
  api/v1/
    reservations/        # endpoints + utils + validators for this feature
    loyalty/
    branches/
    staff/
  utils/                 # cross-feature only (db, twilio, drive, env, error-handler)
  db/                    # schema, migrations, client
```

**Frontend structure** — Nuxt app under `app/`:

```
app/
  pages/                 # routes (Nuxt convention)
  layouts/
  components/
    ui/                  # primitives reusable across features (Button, Input, Modal, Card)
    layout/              # shell components (Header, Footer, Sidebar)
  features/
    reservations/
      components/        # feature-specific components (ReservationForm, ReservationList)
      composables/       # feature composables (useReservation)
      types.ts           # feature-local types
    loyalty/
    branches/
    staff/
  composables/           # cross-feature only (useAuth, useToast)
```

**Hard rules — folder boundaries:**

- A feature MUST NOT import from another feature directly. If shared logic is needed,
  it MUST be lifted to `server/utils/`, `app/composables/`, or `app/components/ui/`.
- A new feature MUST live entirely under `server/api/v1/<feature>/` and
  `app/features/<feature>/`. Spreading a feature across `app/components/` or
  `server/utils/` is prohibited.
- Cross-cutting concerns (auth, error handling, notifications) MUST live in
  `server/utils/` and `app/composables/` — never embedded in a single feature folder.

**Hard rules — component reuse (DRY), applied to every Vue component in `app/`:**

- A component MUST be parameterized via `defineProps<>()` to handle visual variation.
  Design variants (Primary/Secondary, sizes, states, modifiers) MUST be expressed through
  props on a single component, NOT by duplicating component files.
- If two components share more than 60% of their markup, they MUST be merged into one
  component with props controlling the difference.
- If the same markup pattern appears in 2 or more places, it MUST be extracted into a
  reusable component — in `app/components/ui/` if it crosses features, or in
  `app/features/<feature>/components/` if scoped to one feature.
- A page file (`app/pages/*.vue`) MUST NOT exceed 100 lines of template. If a page exceeds
  100 lines, it MUST be decomposed into feature-specific components before being merged.
- An inline conditional chain (`v-if` / `v-else-if`) with more than 3 branches MUST be
  lifted into a dedicated component or composable.

**Storybook is the enforcement surface for component reuse** — every new UI component MUST
have a `.stories.ts` covering default + significant variants + mobile/desktop breakpoints
(full requirements in Article VII, UX Consistency & Component Documentation). A component
that cannot be told as an isolated story is by definition not reusable and MUST NOT be
merged.

**Rationale**: Feature-based organization keeps related code physically close, making
ownership obvious and refactors local. Forbidding cross-feature imports prevents the
"distributed monolith" failure mode where features secretly couple. DRY for components is
the difference between a parameterized design system and 12 copies of "the same card with
slightly different padding" — the former scales with the product, the latter buries the
team in maintenance. Storybook is non-optional because it is the mechanism that makes the
reuse rule self-enforcing: a component that resists being told as a story is a component
that is not actually reusable.

### II. TypeScript & Framework Standards

All code MUST be written in TypeScript strict mode with no `any` types. Vue components MUST
use the Composition API exclusively — Options API is prohibited. Server routes MUST follow
RESTful conventions under `/server/api/`. Types shared between frontend and backend MUST live
in the `/types/` directory; no type duplication across boundaries is permitted.

**Rationale**: Strict typing and consistent API patterns eliminate entire categories of runtime
errors and make the codebase navigable without tribal knowledge. Shared types are the contract
between layers — duplicating them is how divergence starts.

### III. Architecture

The project MUST remain a single Nuxt 4 repository: frontend pages and backend server routes
co-located in one repo, one deploy. WordPress MUST be treated as a headless CMS only
(menu, promotions, branch info). Features with transactional state (reservations, loyalty,
staff portal) MUST connect directly to Neon PostgreSQL — never through WordPress. All
WordPress-sourced pages MUST use ISR with a 60-second revalidation interval. All external
service credentials MUST be injected via environment variables.

**Rationale**: Keeping everything in one repo eliminates deployment coordination overhead.
Bypassing WordPress for transactional data avoids coupling a content tool to business logic.
ISR at 60 s gives editors near-real-time updates without sacrificing edge-cached performance.

### IV. Testing

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

### V. Performance

**Performance budget**

Every public page MUST achieve a Lighthouse score of 90+ on all metrics. Images MUST be
optimized and lazy-loaded.

**Rendering strategy — deferred to the rendering doc**

The per-route rendering strategy (which routes are statically generated with ISR, which
are server-rendered on every request, and which are dynamic API endpoints) lives in
`docs/business/rendering-strategy.md` and is the **single source of truth** for that
decision. Every new route added to `app/pages/` MUST have a matching `routeRules` entry
in `nuxt.config.ts` per the strategy doc.

**Hard constraints enforced by this article (independent of which mode each route uses)**

- **Backend logic is never static.** All Neon reads/writes and loyalty calculations live in
  `server/api/**` and run live on every request. ISR/SSG MUST NOT touch them. Importing
  Drizzle/Neon clients into `app/pages/*.vue` or `app/components/*.vue` at top level is
  prohibited.
- **WordPress is fetched server-side at build/revalidation time**, not on every visitor
  request. Use `useFetch`/`useAsyncData` so Nitro caches it within the ISR window.
- **WordPress and Neon are separated data sources.** They MUST be queried via distinct
  composables; they MUST NOT be merged in a single fetch layer.
- **Per-user routes (loyalty, staff) are SSR**, never ISR. Caching per-user data across
  visitors is a privacy bug.

**Rationale**: Restaurant discovery is mobile-dominated and often on slow connections.
A 90+ Lighthouse score is a concrete, auditable commitment, not a vague aspiration.
Locking specific ISR intervals or specific route lists into the constitution made every
content-strategy revision a constitutional amendment; the rendering doc lets the team
tune intervals and add routes without amending governance. The hard constraints
(backend-never-static, source separation, per-user-never-cached) are the rules that
DON'T change with content strategy and stay enforced here.

### VI. Security

The staff portal MUST implement role-based authentication with three roles: `staff`, `manager`, and `admin`.
Every public API endpoint MUST validate input with Zod schemas before processing. Public API
routes MUST be rate-limited. CORS MUST be restricted to `sumo.com.mx` (and `localhost` in
development). No credentials, tokens, or secrets MAY be committed to the repository.

**Rationale**: The staff portal accesses loyalty transaction data and visit validation —
privilege escalation here has direct financial consequences. Input validation at the boundary
prevents injection and malformed-data bugs from propagating inward. Rate limiting protects
against abuse of the reservation and loyalty endpoints without requiring authentication.

### VII. UX Consistency & Component Documentation

**Visual specifics — deferred to the design context**

The complete visual specification (color palette, typography, theme, per-type accent system,
component visual specs, micro-interactions, breakpoint pixel values) lives in
`docs/business/overview.md` and is the **single source of truth** for visual decisions.
Every UI implementation MUST follow the design context for tokens, component anatomy,
and per-type color rules (AYCE accent vs. Express accent). When the design context is
ambiguous or evolves, it MUST be updated there — never silently in the codebase.

**Process rules enforced by this article (independent of which design direction is active)**

- The SUMO logo MUST be used unmodified — square format, orange background, white "SUMO"
  text, black "ALL YOU CAN EAT" bar. Any logo treatment (color shift, crop, recolor) is
  prohibited regardless of the design direction.
- All UI MUST be implemented **mobile-first**. Mobile is the primary surface for this
  product's audience, not an afterthought.
- Every layout and component MUST be fully responsive. The exact breakpoint pixel values
  are defined in the design context; the discipline is constitutional: a component that
  breaks at any documented breakpoint is considered incomplete and MUST NOT be merged.
- Per-type accent (AYCE vs. Express) MUST be implemented as an `--accent` swap on a
  scope/wrapper, NOT by duplicating rules. The constitution forbids per-rule rewrites;
  the design context defines which color each context maps to.
- Express accent (whatever color the design context assigns to it) is **exclusive to the
  Express line** — it MUST NOT be used as a base color on non-Express pages.

**Storybook coverage (NON-NEGOTIABLE)**

Every Vue component intended for UI MUST have a co-located Storybook story file
(`ComponentName.stories.ts`). Each story file MUST include:

- A **Default** story showing the component in its baseline state.
- Stories covering all significant prop variants (e.g., disabled state, loading state,
  error state, AYCE accent vs. Express accent if applicable).
- A **Responsive** story or viewport annotation demonstrating behavior at mobile and
  desktop breakpoints as defined in the design context.

Components without a story file MUST NOT be merged to the main branch. Autodocs
(`autodocs: 'tag'`) is enabled — components tagged with `@satisfies Meta` will generate
documentation pages automatically.

**Rationale**: Visual consistency is enforced by a single source of truth (`docs/business/overview.md`),
not by re-stating colors and typography in five places that will inevitably drift. The
constitution owns the *discipline* (mobile-first, responsiveness, logo integrity, story
coverage); the design context owns the *specifics* (palette, typography, breakpoints,
component anatomy). Storybook is non-optional: it is the mechanism that makes the design
context auditable component-by-component and forces components to be reusable enough to
be shown in isolation.

### VIII. Clean Code Discipline

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

### IX. Quality Gates (NON-NEGOTIABLE)

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

### X. KISS — Keep It Simple, Stupid

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

### XI. Absolute Imports via Alias

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

### XII. Error Handling Convention

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

### XIII. Environment Validation

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

**Frontend**: Nuxt 4 (Vue 3 + TypeScript), deployed to Vercel.
**Backend**: Nuxt 4 server routes (`/server/api/`), deployed on the same Vercel project.
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
validation), vue-tsc (type-checking), Storybook 10 with `@storybook/vue3-vite` and
`@storybook/addon-docs` (component documentation and visual review).

Monthly infrastructure costs are bounded at approximately $550–2,950 MXN + $20 USD (Vercel Pro),
with Twilio being the primary variable cost.

## Development Workflow

Code MUST be reviewed before merging to the main branch. All commits MUST pass the three-stage
quality gate defined in Principle IX — no exceptions. All external service credentials MUST
be present in `.env.local` (development) and Vercel environment settings (production) — never
in code or committed files. A `.env.example` MUST be kept current (Principle XIII). The daily
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

**Version**: 3.1.0 | **Ratified**: 2026-05-21 | **Last Amended**: 2026-06-16
