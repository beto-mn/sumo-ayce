# WordPress (headless) endpoints

> Canonical reference for the WordPress REST endpoints consumed by the site.
> Base URL comes from the `WORDPRESS_API_URL` env var = the bare **origin**
> `https://cms.sumo.com.mx` (no path, no trailing slash), validated in
> `server/utils/env.ts`. Local dev MUST also point at `https://cms.sumo.com.mx`
> (do NOT use `localhost` — there is no local WordPress).

## Promociones (custom post type)

**Endpoint:** `GET {WORDPRESS_API_URL}/wp-json/wp/v2/promociones`

Use the pretty-permalink form `/wp-json/wp/v2/promociones` (NOT the
`?rest_route=/wp/v2/promociones` form). Returns a JSON **array** of promotion
objects.

### Query parameters (server-side filters added in WP)

| Query | Returns |
|---|---|
| _(none)_ | ALL promotions |
| `?activa=1` | only ACTIVE promotions (`acf.activa === true`) |
| `?activa=0` | only DEACTIVATED promotions |
| `?home=1` | only promotions flagged to show on the home (`acf.home === true`) |
| `?home=0` | only promotions NOT flagged for the home |
| `?per_page=N` | page size (standard WP); combine with the filters above |

These compose: `?activa=1&home=1` = active AND home-flagged.

### Per-feature selection logic

**Homepage (010)** — `server/api/v1/content/promotions.get.ts`, max **3** cards:
1. **Primary**: `?activa=1&home=1&per_page=100` → active promos chosen for the home. The query does NOT guarantee ≤3, so the route caps to the **3 newest** (publish-date desc).
2. **Fallback** (only if the primary returns ZERO): `?activa=1&per_page=100` → all active, again capped to the **3 newest**.
3. If the fallback is also empty → the section does not render.

> `per_page=100` returns a small set because the query already filters server-side;
> the route slices the 3 newest in code. The fallback guarantees the home still
> shows promos even if none are explicitly flagged for the home.

**Promotions page (012)** — uses `?activa=1` (all active, no `home` filter, no cap).

### Response shape (TypeScript type)

The raw response is typed in **`types/wordpress.ts`** (`WpPromotion`,
`WpPromotionAcf`, `WpPromotionsResponse`). Both features parse it via
`server/api/v1/content/validators.ts` (runtime Zod is the source of truth; the
TS type documents the upstream shape). The content-bearing fields live under
`acf`:

| `acf` field | Type | Notes |
|---|---|---|
| `badge_es` / `badge_en` | string | bilingual badge |
| `titulo_es` / `titulo_en` | string | bilingual title |
| `descripcion_es` / `descripcion_en` | string | bilingual description |
| `vigencia_es` / `vigencia_en` | string | bilingual validity |
| `color` | string | decorative color (`orange`, `blue`, …) |
| `tipo` | string | location/line type (`ayce`, `express`, `all`) |
| `activa` | boolean | `false` → hidden everywhere |
| `home` | boolean | `true` → eligible for the homepage promotions rail (see selection logic above) |
| `imagen` | number | WordPress media attachment **ID** (0 = none). This is the FULL promo flyer/detail image — it is NOT shown inline in the card. The card shows only the text; clicking the promotion opens this image large in a **lightbox** (`app/components/ui/Lightbox.vue`) to read the details. Same behavior on the homepage and the promotions page (012). |

Top-level fields used: `id`, `date` (ordering), `slug`, `status`, `title.rendered`.

### Media (image) resolution

`acf.imagen` is a media **ID**, not a URL. Resolve it via
`GET {WORDPRESS_API_URL}/wp-json/wp/v2/media/{id}` → read `source_url`. On any
failure the card degrades to no image (`imageUrl: null`).
