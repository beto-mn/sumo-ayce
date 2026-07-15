# Contract — WordPress `promociones` (NEW restructured ACF model)

> Authoritative for feature 022 implementation. **Supersedes** the promotions section of
> `docs/business/wordpress-endpoints.md`, which still documents the OLD model
> (titulo/descripcion/vigencia/single `imagen`) and is now STALE — a follow-up doc update is
> recommended (out of code scope).

## Endpoint

`GET {WORDPRESS_API_URL}/wp-json/wp/v2/promociones` → JSON array of promotion objects.
Base URL = `https://cms.sumo.com.mx` (env `WORDPRESS_API_URL`). Pretty-permalink form.

### Query params (delivered)

| Query | Returns |
|---|---|
| `?activa=1` | only active (`acf.activa === true`) — the ONLY selection filter used |
| `?per_page=N` | page size |

Compose: **`?activa=1&per_page=100`** — used by BOTH the homepage and the promotions page (all
active, newest-first, **NO cap**). The `?home=1` filter was **removed** (WordPress served a stale
cache for it and no promo is home-flagged); `home` is still parsed but unused for selection. The
internal `?all=1` flag on the promotions-page request only distinguishes the caller in logs.

## Top-level fields used

| Field | Type | Notes |
|---|---|---|
| `id` | number/string | promo id |
| `date` | string (ISO) | ordering (newest-first, no cap) |
| `title.rendered` | string | **SOURCE OF THE PROMO TITLE** — HTML-encoded; MUST be entity-decoded (`2&#215;1` → `2×1`) |
| `slug`, `status` | string | logging/diagnostics |

## `acf` fields (the ONLY acf fields in the new model)

| acf field | Type | Notes |
|---|---|---|
| `badge_es` | string (required) | bilingual badge ES |
| `badge_en` | string (optional) | falls back to `badge_es` |
| `color` | string | `orange`/`pink`/`blue`/`yellow`/`green`; unknown → default `orange` |
| `tipo` | `all`/`ayce`/`express` | line/type |
| `activa` | bool-ish | `1/0/'1'/'0'/true/false` → boolean |
| `home` | bool-ish (optional) | parsed but NO LONGER used for selection (home-flag curation deferred) |
| `imagen_desktop` | number (media ID) | desktop image; `0`/absent = none |
| `imagen_tablet` | number (media ID) | tablet; `0`/dup/unresolved → **desktop fallback** |
| `imagen_movil` | number (media ID) | mobile; `0`/dup/unresolved → **desktop fallback** |

### REMOVED (do NOT read/require)

`titulo_es`, `titulo_en`, `descripcion_es`, `descripcion_en`, `vigencia_es`, `vigencia_en`, single `imagen`.

> The old validator required `acf.titulo_es` (`min(1)`), which no longer exists → it currently
> drops **every** promotion. Removing that requirement is the core fix.

## Media resolution (delivered: SINGLE batched request)

Each image field is a media **ID**, not a URL. All distinct positive IDs across every promo's
desktop/tablet/mobile fields are resolved in ONE batched call
`GET {WORDPRESS_API_URL}/wp-json/wp/v2/media?include=<ids>&per_page=100` → a `Map<id, source_url>`
(instead of one `/media/{id}` call per image). Transient media failure → WARN + empty map (promos
still render image-less rather than the whole call failing).

Fallback rules (per slide):
1. Resolve `imageDesktopUrl` from `imagen_desktop`.
2. `imageTabletUrl` / `imageMovilUrl`: if the media ID is null or unresolved → reuse the desktop URL.
3. Desktop itself falls back to whichever size DID resolve (`desktop ?? tablet ?? movil`).
4. A promo with NO configured image ID at all is dropped; a promo with any configured ID is kept
   even if a transient media fetch failed.

Note: the three IDs may all point to the same placeholder media ID; the dedup/fallback handles
identical IDs gracefully.

## Consumer projection

Maps to `Promotion` (`types/content.ts`): `{ id, badge{es,en}, title (decoded string), color, type,
active, publishedAt, imageDesktopUrl, imageTabletUrl, imageMovilUrl }`. See `data-model.md`. In the
UI, `type` drives the top-left type pill + the type-coloured carousel nav; `color` drives the
top-right badge sticker tone.

## Degradation

Any upstream failure (timeout/unreachable/non-array) → route returns `{ promotions: [], ok: false }`
and logs an `ExternalServiceError` (Article XII). Individual malformed items are dropped and logged;
the whole response is never failed by one bad item.
