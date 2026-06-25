# Research: Menu Page (`/menu`)

**Feature**: 011-menu-page  
**Date**: 2026-06-23

---

## Decision 1 — Image serving strategy

**Question**: Where do the 123 menu images (237 MB) live, and how does the frontend access them?

**Options considered**:
1. Serve from `public/menu/` — committed to git, Vercel edge CDN serves them statically
2. Vercel Blob / external CDN — store off-repo, reference by URL
3. Store full URL in the DB `fileName` field

**Decision**: **Option 1 — `public/menu/`**

**Rationale**:
- Simplest path with no new infrastructure
- All other static assets (`public/brand/`) follow this pattern
- 237 MB is within Vercel's static asset limits
- WebP format is already optimized; Nuxt Image will handle resizing at request time
- The `fileName` field stays as a bare filename; the API computes the full path using a deterministic rule

**Image subfolder mapping** (codified in `server/api/v1/menu/index.get.ts`):
```
locationType = 'both' (drinks)           → /menu/drinks/{fileName}
category key = 'kids'                    → /menu/kids/{fileName}
category key = 'desserts'                → /menu/desserts/{fileName}
locationType = 'ayce', includedInAyce    → /menu/ayce/{fileName}
locationType = 'ayce', !includedInAyce   → /menu/ala-carta/{fileName}
locationType = 'express'                 → /menu/express/{fileName}
fileName = null                          → null
```

**Pre-implementation step** (must happen before Phase 3):
```bash
cp -r "/path/to/assets/Menu/AYCE/AYCE/"       public/menu/ayce/
cp -r "/path/to/assets/Menu/AYCE/A la carta/"  public/menu/ala-carta/
cp -r "/path/to/assets/Menu/AYCE/Drinks/"      public/menu/drinks/
cp -r "/path/to/assets/Menu/AYCE/Kids/"        public/menu/kids/
cp -r "/path/to/assets/Menu/AYCE/Desserts/"    public/menu/desserts/
```

Note: The `mac_&_cheese.webp` filename with `&` is valid on Vercel (Linux). On macOS dev, it may need quoting in shell commands but Nuxt/Express will serve it correctly.

---

## Decision 2 — Category chips: scroll vs. filter

**Question**: Do category chips filter the grid (hide other categories) or scroll to the section?

**Options considered**:
1. Scroll (anchor navigation) — always render the full grid; chips are jump links
2. Filter — only the active category's dishes are visible

**Decision**: **Scroll to section**

**Rationale**:
- The reference prototype uses scroll behavior
- Keeping all categories visible is better for discovery (users see other categories as they scroll)
- Simpler implementation — no conditional rendering logic, just `element.scrollIntoView()`
- Active chip tracks scroll position via `IntersectionObserver`

**Implementation note**: Each category renders in a `<section :id="category.key">`. The chips link to `#${key}`. An `IntersectionObserver` tracks which section is most visible to update the active chip.

---

## Decision 3 — URL sync strategy

**Question**: How much state lives in the URL vs. component state?

**Decision**:
- `?type` and `?modality` are in the URL — they control the API call and determine which data is shown
- Active category chip is **client-local state** — not URL-synced (it resets on type/modality change)
- URL updates use `router.replace()` (shallow) to avoid re-running `useAsyncData`

**Rationale**: Type and modality change the data set (different API call). Category only changes the scroll position within the same data. Syncing only meaningful state keeps the URL clean.

---

## Decision 4 — Data fetching architecture

**Question**: Does the frontend call the API on every type/modality switch, or does it cache?

**Decision**: **Fetch once server-side; re-fetch on type/modality change client-side**

- `useAsyncData` with a computed key `() => \`menu-${type}-${modality}\`` re-fetches automatically when the key changes
- ISR caches the server-rendered page for 3600 s; type/modality switches after hydration hit the API (which is also ISR-cached at the route level)
- The full `FullMenuResult` for all type+modality combinations is O(~100 items) — small enough to re-fetch on toggle without pagination

---

## Decision 5 — `useMenuFilters` composable scope

**Question**: What state does the composable own?

**Decision**: The composable manages:
- `activeType: Ref<'ayce' | 'express'>` — initialized from URL, synced on change
- `activeModality: Ref<'buffet' | 'carta'>` — initialized from URL, reset to 'buffet' on type change
- `activeCategory: Ref<string | null>` — client-local, reset on type/modality change
- Computed: `showModalityToggle` (only when type=ayce), `accentStyle`
- Methods: `setType()`, `setModality()`, `setCategory()` — each updates state and URL as appropriate

The composable does NOT own menu data (dishes, sauces) — that stays in `useAsyncData` in the page.

---

## Decision 6 — Sauce picker scope

**Question**: Does sauce selection need to be persisted or communicated to the server?

**Decision**: **Client-local only**

The sauce picker is a UI affordance that shows the visitor what sauce they would choose. In the actual restaurant they verbally tell the server. No server state is needed. Each `MenuDishCard` manages its own selected sauce via a local `ref`. This may be revisited when the ordering system is built.
