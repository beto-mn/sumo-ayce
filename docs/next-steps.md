# Next Steps

Ordered checklist of everything needed before feature development can begin.

---

## 1. Configuración Inmediata

Tasks required to have a working local dev environment.

### 1.1 Path Aliases

Configure `@/` aliases in `nuxt.config.ts` and `tsconfig.json` per Constitution Principle X.

Required aliases:
- `@/components/` → `app/components/`
- `@/composables/` → `app/composables/`
- `@/layouts/` → `app/layouts/`
- `@/server/` → `server/`
- `@/types/` → `types/`
- `@/utils/` → `utils/`

### 1.2 Base Directory Structure

Create the expected project skeleton:

```
app/
  pages/
  components/
  composables/
  layouts/
server/
  api/
    reservaciones/
    lealtad/
    staff/
    csv/
  utils/
    env.ts
    error-handler.ts
    db.ts
types/
utils/
tests/
  mocks/
```

### 1.3 `.env.example`

Required by Constitution Principle XII. Must include all 5 variable groups:

```
# Database (Vercel Postgres)
DATABASE_URL=
POSTGRES_PRISMA_URL=

# WordPress
WORDPRESS_API_URL=

# Twilio
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_WHATSAPP_NUMBER=

# Google Drive
GOOGLE_SERVICE_ACCOUNT_EMAIL=
GOOGLE_PRIVATE_KEY=
GOOGLE_DRIVE_FOLDER_ID=

# Mapbox
NUXT_PUBLIC_MAPBOX_TOKEN=
```

---

## 2. Configuración de Entorno

### 2.1 `server/utils/env.ts`

Zod schema that validates all env vars at startup. Constitution Principle XII: **the server must not start with missing or malformed credentials.**

### 2.2 `server/utils/error-handler.ts`

Centralized error handler for all server routes. Constitution Principle XI: one place to normalize errors, log them, and return consistent API responses.

---

## 3. Tooling de Desarrollo

### 3.1 VS Code Settings

Create `.vscode/settings.json` with Biome as the default formatter and format-on-save enabled. This ensures consistent formatting across the team without relying on global VS Code config.

### 3.2 Vitest

Set up Vitest for unit testing. Constitution Principle III requires tests from the start. Minimum setup:
- `vitest.config.ts` with Nuxt/Vue support
- `tests/` directory structure
- At least one test to confirm the setup works

### 3.3 Storybook

Instalado con `@storybook/vue3-vite@10.4.1` (sin módulo Nuxt). Corre independiente del dev server.

```bash
pnpm storybook        # dev server en :6006
pnpm storybook:build  # build estático
```

Stories junto a los componentes: `app/components/**/*.stories.ts`

> Migrar a `@nuxtjs/storybook` cuando liberen el estable con soporte Nuxt 4.

---

## 4. Decisión Pendiente

### 4.1 ORM: Prisma vs Drizzle

**Must be decided before any database work begins.**

| | Prisma | Drizzle |
|-|--------|---------|
| DX | Excellent — auto-complete, migrations GUI | Good — SQL-first, explicit |
| Bundle size | Heavy | Lightweight |
| Edge runtime | Limited | Native |
| Learning curve | Low | Medium |
| Vercel Postgres | ✅ First-class support | ✅ Supported |

Recommendation: Drizzle if bundle size and edge compatibility matter; Prisma if faster onboarding is the priority.

---

## Recommended Order

```
1. Path aliases
2. Directory structure
3. .env.example
4. VS Code settings
5. Vitest
6. env.ts + error-handler.ts
7. ORM decision + install
```
