# SUMO AYCE — Rendering Strategy

> **Hybrid:** static where possible, dynamic where needed. Backend logic
> (loyalty, reservations) is **never** static. This document is the source of
> truth for how each route is rendered.

---

## 1. Stack context

- **Frontend**: Nuxt 4 on Vercel.
- **Content source**: headless WordPress at `https://cms.sumo.com.mx/wp-json/wp/v2/...` — menu items, promotions, branches.
- **App backend**: Neon Postgres + Nuxt server API routes — loyalty points and reservations live here.

The two data sources are **kept separate**: WordPress for content, Neon for transactional/per-user state. Don't mix them in the same fetch layer.

---

## 2. Per-route rendering rules

| Route pattern   | Mode              | Why                                                                                   |
|-----------------|-------------------|---------------------------------------------------------------------------------------|
| `/`             | `isr: 3600`       | Home — WordPress content, changes rarely. Long revalidation.                          |
| `/menu`         | `isr: 3600`       | Menu / Bebidas — WordPress CPT `menu_item`, changes rarely.                           |
| `/sucursales`   | `isr: 3600`       | Branches — WordPress CPT `sucursales`, changes rarely.                                |
| `/promociones`  | `isr: 60`         | Promotions — WordPress CPT `promociones`, the most dynamic content; clients edit it.  |
| `/lealtad`      | `ssr: true`       | Loyalty user portal — per-user data (points balance, history). Never cache statically.|
| `/staff/**`     | `ssr: true`       | Staff portal — per-user, role-gated, real-time validation. Never cache statically.    |
| `/api/**`       | dynamic (default) | Backend endpoints — always live. No ISR, no prerender, no static cache.               |

### Canonical `nuxt.config.ts` shape

```ts
export default defineNuxtConfig({
  routeRules: {
    '/':             { isr: 3600 },
    '/menu':         { isr: 3600 },
    '/sucursales':   { isr: 3600 },
    '/promociones':  { isr: 60 },
    '/lealtad':      { ssr: true },
    '/staff/**':     { ssr: true },
    '/api/**':       { },
  },
})
```

Any new route added to `app/pages/` MUST have a matching `routeRules` entry (or
match an existing pattern). The reviewer checks this.

---

## 3. Hard constraints (NON-NEGOTIABLE)

### 3.1 — Backend logic is never static

All Neon reads/writes and loyalty-point calculations live in `server/api/**`
and run live on every request as Vercel functions. ISR/SSG must not touch them.
**Forbidden:** importing Drizzle/Neon clients into `app/pages/*.vue` or `app/components/*.vue` at top level. DB access ALWAYS goes through `server/api/**`.

### 3.2 — Static/ISR pages may call dynamic API client-side

A statically-rendered page (e.g. `/` with `isr: 3600`) MAY call `/api/**`
endpoints from the client (via `useFetch` with `server: false`, or `$fetch`
in `onMounted`) to fetch live data (current points, current reservation
slots, etc.). This is the recommended pattern to mix cached HTML shell with
live data.

### 3.3 — WordPress is fetched at build/revalidation time, not per request

For ISR routes, use `useFetch`/`useAsyncData` so WordPress calls run during
server-side render (build or revalidation), not on every visitor request.
WordPress is hit at most once per ISR interval per route.

### 3.4 — On-demand revalidation when content changes

When the client publishes/edits content in WordPress, ISR revalidation
refreshes the affected pages within their interval. For instant refresh,
configure an on-demand revalidation webhook from WordPress to a Nuxt route
(e.g. `POST /api/revalidate` with a secret) — full redeploy MUST NOT be
required for content updates.

### 3.5 — Data sources stay separated

WordPress (content) and Neon (loyalty/reservations) are queried via
**separate** composables:
- `useWordPress*` / `useContent*` composables for WP fetches
- `useLoyalty*` / `useReservation*` composables for Neon-backed API calls

Don't merge them into a single fetch layer. Don't import WordPress fetches
inside loyalty composables, or vice versa.

---

## 4. Per-feature mapping (current backlog)

How the rendering rules apply to each feature in `feature_list.json`:

| Feature                            | Route(s)          | Mode                    | Notes                                                                                       |
|------------------------------------|-------------------|-------------------------|---------------------------------------------------------------------------------------------|
| 008 Homepage                       | `/`               | `isr: 3600`             | WP-driven content. Reservation modal opens via state, not a separate page.                 |
| 009 Menu page                      | `/menu`           | `isr: 3600`             | WP CPT `menu_item`. Filters (type/modality/category) are client-side over fetched data.    |
| 010 Promotions page                | `/promociones`    | `isr: 60`               | Most dynamic — short ISR window because the client edits this frequently.                  |
| 011 Branches page                  | `/sucursales`     | `isr: 3600`             | WP CPT `sucursales`. Geolocation + Mapbox + distance happen client-side over cached list. |
| 012 Reservation modal              | (overlay)         | n/a                     | Renders on top of any page. Form posts to `/api/v1/reservations` (dynamic Vercel function). |
| 013 Loyalty user portal            | `/lealtad`        | `ssr: true`             | Per-user balance + history. Always SSR for fresh data + SEO-safe shell.                    |
| Staff portal (already shipped 006) | `/staff/**`       | `ssr: true`             | Role-gated, per-user. Never cache statically.                                              |

If a new feature adds a route, this table MUST be updated at the same time as the spec.

---

## 5. Reviewer enforcement

When a feature touches `app/pages/` or adds API endpoints, the reviewer verifies:

- [ ] Every new page route has a matching entry in `routeRules` (or matches an existing pattern).
- [ ] No DB client import (`drizzle-orm`, `@neondatabase/serverless`) appears anywhere under `app/`.
- [ ] WordPress fetches happen via `useFetch`/`useAsyncData` server-side, not via runtime `$fetch` on every render.
- [ ] Loyalty / reservation composables call `server/api/**`, never the DB directly.
- [ ] If the route is in `app/pages/staff/` or `app/pages/lealtad/`, the route rule is `ssr: true` (not ISR).

A violation of any of these → REJECTED with the specific rule cited.

---

## 6. Anti-patterns

- ❌ Adding `isr: 60` to `/lealtad` "to make it faster" — breaks per-user freshness; one user could see another's balance.
- ❌ Calling `db.select(...)` directly inside a Vue component — circumvents the API layer and leaks DB schema to the client.
- ❌ Using `await $fetch('https://cms.sumo.com.mx/...')` inside a setup script of an ISR page — works but bypasses caching; use `useFetch` so Nitro caches it.
- ❌ Forgetting to add an entry in `nuxt.config.ts > routeRules` for a new route — the route inherits the default (SSR every request) and silently loses ISR.
- ❌ Mixing WordPress content with Neon reads in the same composable — couples the two data sources and makes one's outage break the other.

---

## 7. Operational checklist (when adding a route)

1. Decide rendering mode: ISR (3600 / 60), SSR, or dynamic (`/api/**`).
2. Add the entry to `nuxt.config.ts > routeRules`.
3. If ISR: ensure `useFetch`/`useAsyncData` for all server-side fetches.
4. If SSR: ensure any per-user data uses fresh request context (cookies, session).
5. If `/api/**`: ensure no caching headers; route must run on every call.
6. Update `docs/business/rendering-strategy.md` §4 table with the new route.
7. Write a Storybook story for the page-level component (Article VII).
