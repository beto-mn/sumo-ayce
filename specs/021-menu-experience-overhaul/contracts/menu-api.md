# Contract — Menu API (021)

> **Reconciled 2026-07-14.** `type` now accepts `kids`; the response carries a `drinkGroups`
> metadata array (DB-driven labels + order + group promo) and a per-category `note`; drink groups
> are `beers`/`destilados`/`sodas` (not `beers_spirits`/`non_alcoholic`).

`GET /api/v1/menu` — `server/api/v1/menu/index.get.ts` → `getFullMenu` in
`server/utils/menu-queries.ts`.

## Request

```
GET /api/v1/menu?type=<ayce|express|kids>&modality=<buffet|carta>
```
- `type` (required): `ayce` | `express` | `kids`.
- `modality` (optional, default `buffet`): `buffet` | `carta`. Express and Kids are coerced to a
  fixed view (Kids always uses `carta` pricing).

The 4-way primary navigation maps to this endpoint as:
- AYCE → `type=ayce` (+ modality).
- Express → `type=express`.
- Kids → `type=kids` (returns the `kids` category regardless of location scope).
- Bebidas y coctelería → drinks are returned in every AYCE/Express response (`locationType='both'`);
  the Bebidas selection is a **client-side view** over the returned drinks, no separate request.

## Response — `FullMenuResult` (unchanged core shape)

```jsonc
{
  "locationType": "ayce",           // resolved: 'ayce' | 'express' | 'kids'
  "modality": "buffet",             // Express/Kids coerced (Kids → 'carta')
  "categories": [
    {
      "key": "appetizers",
      "name": { "es": "Entradas", "en": "Appetizers" },   // ⬅ DB-driven label (sweet_rolls = "Sushi Dulce")
      "note": { "es": "Incluye…", "en": "Includes…" } | null,  // ⬅ NEW (category section note; kids)
      "displayOrder": 0,
      "dishes": [
        {
          "id": "uuid",
          "name": { "es": "...", "en": "..." },
          "description": { "es": "...", "en": "..." },
          "imageUrl": "https://blob.../menu/ayce/x.webp?v=<MENU_IMAGE_VERSION> | null",  // ⬅ cache-busted
          "badge": { "es": "...", "en": "..." } | null,
          "price": "159.00 | null",        // present in carta OR for drinks
          "incluido": true,                // buffet food only
          "includedInAyce": true,          // ⬅ splits the Kids view
          "drinkGroup": "destilados | beers | sodas | ... | null",   // ⬅ beers_spirits→beers; +destilados; -non_alcoholic
          "drinkSubGroup": { "key": "...", "name": {...}, "subtitle": {...}|null, "promo": {...}|null, "displayOrder": 0 } | null,
          "requiresSauce": false,          // ⬅ now false for wings (sauce picker removed)
          "featured": true                 // ⬅ Garantía Sumo star (flagged on every location row)
        }
      ]
    }
  ],
  "sauces": [ { "id": "uuid", "name": {...}, "imageUrl": "..."|null, "spiceLevel": 0 } ],
  "drinkGroups": [                    // ⬅ NEW — DB-driven group metadata in display order
    { "key": "jumbo_cocktails", "name": {...}, "displayOrder": 0, "promo": null },
    { "key": "destilados", "name": {...}, "displayOrder": 4, "promo": { "es": "Combo Mezcladores $189…", "en": "…" } }
  ]
}
```

### Deltas introduced by 021 (as delivered)

| Field / behaviour | Delta |
|---|---|
| `type` param | Accepts `kids` in addition to `ayce`/`express`; the Kids view returns the `kids` category regardless of location scope, always `modality:'carta'`. |
| `category.name` | DB-driven label (single source of truth), read from `menu_categories.name_es/en`. `sweet_rolls` = "Sushi Dulce". |
| `category.note` | NEW — `menu_categories.note_es/en`; the Kids combo inclusion box. Null for other categories. |
| `drinkGroups` | NEW top-level array — DB-driven `{ key, name, displayOrder, promo }` per group, ordered by `display_order`. Carries the Bebidas chip/heading labels + the single Destilados group promo. |
| `dish.drinkGroup` | `beers_spirits`→`beers`; `+ destilados`; `non_alcoholic` items fold into `sodas`. |
| `dish.includedInAyce` / `dish.featured` | Exposed on every dish: `includedInAyce` splits the Kids view; `featured` drives the Garantía star (set on every location row for the 11 dishes). |
| `dish.imageUrl` | Carries `?v=<MENU_IMAGE_VERSION>` cache-busting suffix. |
| `dish.requiresSauce` | Now `false` for Alitas & Boneless. |
| Buffet vs carta items | Differentiated by the existing `includedInAyce` modality filter — no contract change. |

### Error behaviour (Article XII)

DB reads are retried on transient Neon errors (`withDbRetry`, 3 attempts). If the DB stays
unavailable the query raises a handled `DatabaseUnavailableError` (503, logged WARN); the `/menu`
route catches it and returns `emptyMenuResult(...)` so the page shows a friendly
`menu.unavailable` state instead of a raw 500.

## Featured rail — `GET /api/v1/menu/featured`

`getFeaturedDishes()` selects `featured=true AND isActive=true` ordered by `displayOrder`, then
**dedupes by name** — because each Garantía Sumo dish is flagged featured on EVERY location/modality
row (so the star shows in every menu view), the rail must list each exactly once. After the seed
update it returns exactly the 11 unique Garantías Sumo dishes in `displayOrder`:

Burger del Barrio, Papas Smash, Mac & Cheese, Smash Dog, Bora Bora, Coco Roll, Canela Roll,
Kushiage de Queso, Ramen XL, Tostiburger, Sumo Fries.
