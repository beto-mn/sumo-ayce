# Data Model — Feature 022

> **Reconciled 2026-07-14.** The selection logic and image-resolution notes below were updated to
> match what shipped: media is resolved in a SINGLE batched request; BOTH surfaces use the same
> `?activa=1` query with NO cap (the `home=1` filter and the homepage 3-cap were removed).

Only Part B touches data shapes. Parts A (font) and C (static i18n copy) have no data model.

## Raw WordPress promotion (new model) — `types/wordpress.ts`

`WpPromotionAcf` (the ONLY acf fields now):

| acf field | Type | Notes |
|---|---|---|
| `badge_es` | string | bilingual badge (ES) |
| `badge_en` | string (optional) | bilingual badge (EN); falls back to ES |
| `color` | string | decorative token (`orange`/`pink`/`blue`/`yellow`/`green`) |
| `tipo` | `'all' \| 'ayce' \| 'express'` | line/type |
| `activa` | bool-ish (1/0/'1'/'0'/true/false) | active flag (the ONLY selection filter used) |
| `home` | bool-ish (optional) | parsed but NO LONGER used for selection (home-flag curation deferred) |
| `imagen_desktop` | number (media ID) | desktop image; 0 = none |
| `imagen_tablet` | number (media ID) | tablet image; 0/dup → desktop fallback |
| `imagen_movil` | number (media ID) | mobile image; 0/dup → desktop fallback |

`WpPromotion` top-level fields used: `id`, `date`, `slug`, `status`, **`title.rendered`** (NEW — source of the promo title).

**REMOVED from acf** (must no longer be read/required): `titulo_es`, `titulo_en`, `descripcion_es`, `descripcion_en`, `vigencia_es`, `vigencia_en`, `imagen`.

The compile-time guard `_AcfFieldsMatchUpstream` in `validators.ts` must still hold against the updated `WpPromotionAcf`.

## Projected Promotion — `types/content.ts` (old → new diff)

| Field | Old | New | Change |
|---|---|---|---|
| `id` | string | string | keep |
| `badge` | `Bilingual` | `Bilingual` | keep |
| `title` | `Bilingual` | **`string`** (decoded from `title.rendered`) | CHANGED — single decoded string |
| `description` | `Bilingual` | — | **REMOVED** |
| `validity` | `Bilingual` | — | **REMOVED** |
| `color` | union | union | keep (`orange\|pink\|blue\|yellow\|green`) |
| `type` | `SumoType` | `SumoType` | keep |
| `active` | boolean | boolean | keep |
| `publishedAt` | string (ISO) | string (ISO) | keep (ordering) |
| `imageUrl` | `string \| null` | — | **REMOVED** |
| `imageDesktopUrl` | — | `string \| null` | **ADDED** |
| `imageTabletUrl` | — | `string \| null` (desktop fallback) | **ADDED** |
| `imageMovilUrl` | — | `string \| null` (desktop fallback) | **ADDED** |

`type` (`'all' | 'ayce' | 'express'`) drives two delivered presentation behaviours: a **type
pill** overlaid top-left of each slide (AYCE → orange, Express → blue, Ambos/`all` → orange→blue
gradient, always labelled for a11y) and the **carousel nav accent** (arrows + active dot follow the
ACTIVE slide's type). `color` drives the top-right badge sticker tone (default orange).

## Intermediate: `ParsedPromotion` — `validators.ts` (pre image-resolution)

Old: `Omit<Promotion,'imageUrl'> & { imageMediaId: number | null }`.
New: carries three media IDs instead of one:

```
ParsedPromotion = Omit<Promotion, 'imageDesktopUrl' | 'imageTabletUrl' | 'imageMovilUrl'>
                  & { desktopMediaId: number | null
                      tabletMediaId: number | null
                      movilMediaId: number | null }
```

`mapPromotion(raw)`:
- `title = decodeHtmlEntities(raw.title.rendered.trim())` (empty → left empty; UI falls back to generic label / alt).
- `badge = { es: acf.badge_es, en: acf.badge_en ?? acf.badge_es }`.
- `color = toPromotionColor(acf.color)` (unchanged helper, default orange).
- `type = acf.tipo`, `active = acf.activa`, `publishedAt = raw.date`.
- `desktopMediaId/tabletMediaId/movilMediaId = toMediaId(acf.imagen_desktop/tablet/movil)` (reuse existing `toMediaId`).

## Image resolution — `promotions.get.ts` (as delivered)

Media is resolved in ONE **batched** request (`/wp/v2/media?include=<ids>&per_page=100`) rather
than per-image calls: `resolveMediaMap(parsed)` collects every distinct positive media ID across
all promos' desktop/tablet/mobile fields and fetches them in a single call (WARN + empty map on
transient failure). Then `projectPromotion(parsed, media)`:
1. Resolve `imageDesktopUrl` from `desktopMediaId`.
2. For tablet/mobile: if its ID is null or unresolved, fall back to the desktop URL.
3. Desktop itself falls back to whichever size DID resolve (`desktop ?? tablet ?? movil`), so a
   promo with any resolvable image still renders full-bleed.

`resolveImages(parsed)` keeps every promo that has **at least one configured image media ID** and
drops only promos with NO image at all (nothing to show in an image-only carousel).

**Selection logic (CHANGED from the draft):** BOTH surfaces use the SAME query
`?activa=1&per_page=100` — all active, newest-first, **NO cap**. The former `home=1` primary query
and the homepage 3-newest cap were **removed** (no promo is home-flagged and WordPress served a
stale/broken cache for `home=1`). The `?all=1` flag on the promotions-page request is retained only
to distinguish the caller in logs. Graceful degradation: any upstream failure logs an
`ExternalServiceError` (WARN + 502 via the handler) and the route returns
`{ promotions: [], ok: false }` (always HTTP 200 to the client).

## Validation rules (Zod, `rawPromotionSchema` / `acfSchema`)

- `title: z.object({ rendered: z.string() })` at top level (NEW).
- `acf`: `badge_es` required (`min(1)`); `badge_en` optional; `color` required string (normalized later); `tipo` enum `['all','ayce','express']`; `activa` bool-ish transform; `home` optional bool-ish; `imagen_desktop/tablet/movil` optional media-ID coercion.
- Removed: `titulo_es` (was `min(1)` — the cause of the drop-all regression), `titulo_en`, `descripcion_*`, `vigencia_*`, `imagen`.
- Items failing validation are dropped individually and logged (unchanged behavior).
