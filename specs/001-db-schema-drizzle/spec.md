# Feature Specification: Database Schema & Local Development Environment

**Feature Branch**: `001-db-schema-drizzle`
**Created**: 2026-05-22
**Status**: Draft
**Input**: User description: "Crear los schemas en Drizzle para todas las entidades del sistema, con una propuesta inicial modificable. Levantar PostgreSQL local con Docker Compose para validar migraciones y hacer pruebas locales."

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Define and migrate the full data schema (Priority: P1)

A developer defines all entities (branches, users, reservations, loyalty points, rewards, staff) in the schema and runs a migration against a local database. The database reflects the schema exactly, with correct column types, constraints, and relationships.

**Why this priority**: All backend features depend on this schema. Without it, no other feature can be developed or tested.

**Independent Test**: Run `db:migrate` against the local database and verify that all tables exist with the correct structure using a database inspection tool.

**Acceptance Scenarios**:

1. **Given** a fresh local PostgreSQL instance, **When** the developer runs the migration command, **Then** all tables are created with the correct columns, types, constraints, and foreign keys — with zero errors.
2. **Given** an existing database with a prior migration, **When** the developer modifies the schema and runs the migration again, **Then** only the delta is applied and existing data is preserved.
3. **Given** a schema with invalid or conflicting definitions, **When** the developer runs the migration, **Then** the command fails with a clear error message identifying the problem.

---

### User Story 2 - Spin up local PostgreSQL with Docker Compose (Priority: P1)

A developer runs a single command to start a local PostgreSQL instance. The database is immediately reachable, uses project-specific credentials from `.env.local`, and persists data across container restarts.

**Why this priority**: Without a local database, no migration or test can run. This unblocks the entire backend team.

**Independent Test**: Run `docker compose up -d`, then connect with the configured credentials and verify the connection succeeds.

**Acceptance Scenarios**:

1. **Given** Docker is installed, **When** the developer runs `docker compose up -d`, **Then** a PostgreSQL instance starts and is reachable on the configured port within 10 seconds.
2. **Given** the container is stopped and restarted, **When** the developer reconnects, **Then** previously migrated tables and data are still present.
3. **Given** `.env.local` credentials are missing or wrong, **When** the developer attempts to connect, **Then** a clear connection error is shown.

---

### User Story 3 - Iterate on schema and re-migrate (Priority: P2)

A developer modifies an existing table (adds a column, changes a type, adds an index) and applies the change to the local database without destroying existing data or needing to reset the database.

**Why this priority**: Schema changes are frequent early in development. The workflow must support fast iteration.

**Independent Test**: Add a column to an existing table, run the migration, and verify the column exists without data loss.

**Acceptance Scenarios**:

1. **Given** a migrated local database, **When** the developer adds a nullable column to any table and runs the migration, **Then** the column is added and all existing rows have a null value for it.
2. **Given** a migrated local database, **When** the developer adds an index to an existing column and runs the migration, **Then** the index is created without errors.

---

### Edge Cases

- What happens when `DATABASE_URL` is not set when running the migration command?
- What happens if Docker is not installed or the port is already in use?
- What happens if a migration attempts to drop a column that has data?
- What happens if two developers create conflicting migrations on separate branches?
- What happens when the schema references an enum value not yet supported by the database?

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST define tables for all core entities: branches (sucursales), customers, reservations, loyalty points, loyalty rewards, loyalty transactions, staff users, and staff sessions.
- **FR-002**: Each table MUST have a primary key, created-at and updated-at timestamps, and relevant foreign key constraints.
- **FR-003**: The schema MUST enforce referential integrity between related entities (e.g., a reservation must reference a valid branch and customer).
- **FR-004**: The migration tool MUST generate incremental SQL migration files from schema changes, not destructive full-drops.
- **FR-005**: The local environment MUST include a Docker Compose configuration that starts a PostgreSQL instance with project credentials loaded from environment variables.
- **FR-006**: The developer MUST be able to run the migration against the local database with a single command.
- **FR-007**: The schema MUST support soft-delete (deleted_at nullable timestamp) for entities where data retention is required: customers, reservations, loyalty transactions.
- **FR-008**: Branch-specific entities (reservations, staff) MUST include a foreign key to the branches table.
- **FR-009**: The server MUST validate all required environment variables at startup using a schema validator. If any required variable is missing or malformed, the server MUST refuse to start and output a clear error listing which variables are missing. The database connection string is a required variable.

### Key Entities

- **Branch (sucursal)**: A physical restaurant location. Has name, address, phone, coordinates (lat/lng), schedule, and active status.
- **Customer**: A loyalty program member created exclusively by staff — there is no public self-registration. Staff registers the customer (name + phone) at the branch. Has name, phone (unique), WhatsApp opt-in flag, and accumulated points balance.
- **Reservation**: A booking created from the public landing page form. Has branch, date, time, party size, contact name, phone, and status (pending/confirmed/cancelled). Reservations are completely independent — no customer account is required or linked. Every visitor fills in their own data directly in the form.
- **LoyaltyTransaction**: Records each point event (earn or redeem). Has customer reference, branch (where the visit happened — for tracking only), points delta, transaction type, and timestamp. The loyalty balance is brand-wide: points accumulate across all branches and are not tied to any single location.
- **Reward**: A redeemable reward in the loyalty catalog. Has name, description, points cost, and active status.
- **Redemption**: Links a customer to a reward they redeemed. Has customer, reward, branch, redemption date, and status.
- **StaffUser**: A staff or admin account. Has name, email, role (staff/manager/admin), branch assignment, hashed password, and active status. `manager` role has read access to branch reports and receives WhatsApp notifications for reservations; `staff` can validate loyalty visits; `admin` has full access across all branches.
- **StaffSession**: Tracks active login sessions for staff. Has staff user reference, token, expiry, and IP address.

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A developer can go from zero to a fully migrated local database in under 5 minutes following the project README.
- **SC-002**: All 8 core tables are created correctly on first migration with zero errors.
- **SC-003**: Schema changes can be iterated and re-migrated in under 30 seconds on a local machine.
- **SC-004**: The local database persists data across container restarts 100% of the time.
- **SC-005**: All foreign key constraints are enforced — inserting an orphaned record (e.g., reservation with no valid branch) is rejected by the database.

---

## Assumptions

- Docker Desktop (or Docker Engine) is installed on developer machines.
- The local PostgreSQL instance runs on a non-conflicting port (default 5432 or configurable via `.env.local`).
- The schema is designed for the full system upfront but tables are populated incrementally as features are developed.
- The production database is **Neon PostgreSQL** (serverless-native, HTTP-based, free tier) — not Vercel Postgres or any other provider. `DATABASE_URL` is the Neon connection string.
- The MySQL instance on Hospedando.mx (cPanel) is exclusively for WordPress. It is not used by the Nuxt backend under any circumstances.
- Soft-delete is applied only to entities with legal/audit retention requirements; administrative tables (rewards, branches, staff) use hard delete or deactivation via `active` flag.
- The schema does not include WordPress-managed entities (menu items, promotions, branch info for the CMS) since those are read via REST API at runtime and not stored in the backend database.
- All monetary amounts (if added later) would be stored in integer cents to avoid floating-point issues; no monetary fields are in scope for this feature.
