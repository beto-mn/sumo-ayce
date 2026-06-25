# Data Model: Menu Page

**Feature**: 011-menu-page  
**Date**: 2026-06-23

---

## API Contract: `GET /api/v1/menu`

### Request

```
GET /api/v1/menu?type=ayce&modality=buffet
GET /api/v1/menu?type=ayce&modality=carta
GET /api/v1/menu?type=express
```

**Query params (Zod-validated)**:

| Param | Type | Required | Default | Notes |
|-------|------|----------|---------|-------|
| `type` | `'ayce' \| 'express'` | Yes | — | 400 if missing or invalid |
| `modality` | `'buffet' \| 'carta'` | No | `'buffet'` | `'carta'` is silently coerced to `'buffet'` when `type='express'` |

### Response `200 OK`

```ts
// types/menu.ts — FullMenuResult
{
  locationType: 'ayce' | 'express'
  modality: 'buffet' | 'carta'
  categories: Array<{
    key: MenuCategoryKey         // 'appetizers', 'burgers', 'drinks', etc.
    name: { es: string; en: string }
    displayOrder: number
    dishes: Array<{
      id: string
      name: { es: string; en: string }
      description: { es: string; en: string }
      imageUrl: string | null    // fully-resolved path, e.g. '/menu/ayce/bora_bora.webp'
      badge: { es: string; en: string } | null
      price: string | null       // e.g. '128.00' — only set for carta items
      incluido: boolean          // true in buffet view for included items
      drinkGroup: DrinkGroup | null
      requiresSauce: boolean
    }>
  }>
  sauces: Array<{
    id: string
    name: { es: string; en: string }
    spiceLevel: number           // 0–5
  }>
}
```

### Error responses

| Code | Condition |
|------|-----------|
| `400` | `type` is missing or not `'ayce'|'express'`; `modality` is not `'buffet'|'carta'` |
| `500` | DB failure |

---

## Image path resolution (implemented in the API route)

```ts
function resolveImageUrl(
  fileName: string | null,
  locationType: 'ayce' | 'express' | 'both',
  categoryKey: string,
  includedInAyce: boolean
): string | null {
  if (!fileName) return null
  if (locationType === 'both') return `/menu/drinks/${fileName}`
  if (categoryKey === 'kids') return `/menu/kids/${fileName}`
  if (categoryKey === 'desserts') return `/menu/desserts/${fileName}`
  if (locationType === 'express') return `/menu/express/${fileName}`
  // ayce
  return includedInAyce ? `/menu/ayce/${fileName}` : `/menu/ala-carta/${fileName}`
}
```

---

## Component state model

```ts
// useMenuFilters.ts
interface MenuFiltersState {
  activeType: 'ayce' | 'express'
  activeModality: 'buffet' | 'carta'
  activeCategory: string | null  // null = no chip selected
}

// Derived
const showModalityToggle = computed(() => activeType.value === 'ayce')
const accentStyle = computed(() => ({
  '--accent': activeType.value === 'ayce'
    ? 'var(--color-orange)'
    : 'var(--color-express-blue)'
}))
```

---

## i18n Key List

All keys live under `menu.*` in `locales/es.json` and `locales/en.json`.

### Type toggle
```
menu.type.ayce          → "AYCE" / "AYCE"
menu.type.express       → "Express" / "Express"
```

### Modality toggle
```
menu.modality.buffet    → "All You Can Eat" / "All You Can Eat"
menu.modality.carta     → "À la carte" / "À la carte"
```

### Category chips
```
menu.category.appetizers   → "Entradas" / "Appetizers"
menu.category.salads       → "Ensaladas" / "Salads"
menu.category.rice         → "Arroz" / "Rice"
menu.category.ramen        → "Ramen" / "Ramen"
menu.category.burgers      → "Burgers" / "Burgers"
menu.category.sandwiches   → "Sándwiches" / "Sandwiches"
menu.category.burritos     → "Burritos" / "Burritos"
menu.category.hot_dogs     → "Hot Dogs" / "Hot Dogs"
menu.category.cold_rolls   → "Sushi Frío" / "Cold Rolls"
menu.category.hot_rolls    → "Sushi Caliente" / "Hot Rolls"
menu.category.sweet_rolls  → "Rollos Dulces" / "Sweet Rolls"
menu.category.desserts     → "Postres" / "Desserts"
menu.category.wings        → "Alitas & Boneless" / "Wings & Boneless"
menu.category.kids         → "Menú Kids" / "Kids Menu"
menu.category.drinks       → "Bebidas" / "Drinks"
```

### Dish card
```
menu.dish.incluido        → "Incluido" / "Included"
menu.dish.price_prefix    → "$" / "$"
menu.dish.no_image_alt    → "Platillo SUMO" / "SUMO dish"
menu.dish.sauce_required  → "Elige tu salsa" / "Choose your sauce"
```

### Drink groups
```
menu.drink_group.jumbo_cocktails        → "Coctelería Jumbo" / "Jumbo Cocktails"
menu.drink_group.cantaritos_sumo_cups   → "Cantaritos y Vasos Sumo" / "Cantaritos & Sumo Cups"
menu.drink_group.non_alcoholic          → "Bebidas Sin Alcohol" / "Non-Alcoholic Drinks"
menu.drink_group.sodas                  → "Refrescos y Bebidas" / "Sodas & Beverages"
menu.drink_group.coffee_digestifs       → "Café y Digestivos" / "Coffee & Digestifs"
menu.drink_group.beers_spirits          → "Cervezas y Destilados" / "Beers & Spirits"
```

### Sauce picker
```
menu.sauce.spicy_indicator  → "Picante" / "Spicy"
```

### CTA
```
menu.cta.ver_carta          → "Ver carta completa" / "View full menu"
```

### SEO meta
```
menu.seo.title_ayce         → "Menú AYCE – SUMO All You Can Eat" / "AYCE Menu – SUMO All You Can Eat"
menu.seo.title_express      → "Menú Express – SUMO All You Can Eat" / "Express Menu – SUMO All You Can Eat"
menu.seo.description        → "Descubre todo el menú de SUMO: sushi, burgers, hot dogs, alitas, bebidas y más." / "Explore the full SUMO menu: sushi, burgers, hot dogs, wings, drinks and more."
```

**Total**: 35 keys (≥ 30 required by constitution gate).

---

## File structure

```text
specs/011-menu-page/
├── spec.md
├── plan.md
├── research.md
├── data-model.md       ← this file
├── quickstart.md
└── contracts/
    └── menu-page.md

app/
├── pages/
│   └── menu.vue                                  # route; ≤100 lines; useAsyncData
└── features/
    └── menu/
        ├── types.ts                              # MenuPageState local types
        ├── composables/
        │   ├── useMenuFilters.ts                 # type/modality/category state + URL sync
        │   └── useMenuFilters.test.ts
        └── components/
            ├── MenuShell.vue                     # orchestrator; owns FullMenuResult
            ├── MenuTypeToggle.vue
            ├── MenuTypeToggle.stories.ts
            ├── MenuModalityToggle.vue
            ├── MenuModalityToggle.stories.ts
            ├── MenuCategoryChips.vue
            ├── MenuCategoryChips.stories.ts
            ├── MenuDishGrid.vue
            ├── MenuDishCard.vue
            ├── MenuDishCard.spec.ts
            ├── MenuDishCard.stories.ts
            ├── MenuSaucePicker.vue
            ├── MenuSaucePicker.spec.ts
            ├── MenuSaucePicker.stories.ts
            └── MenuDrinkSection.vue

server/api/v1/menu/
└── index.get.ts                                  # GET /api/v1/menu

locales/
├── es.json                                       # +35 menu.* keys
└── en.json                                       # +35 menu.* keys

public/menu/
├── ayce/          ← copy from assets AYCE/
├── ala-carta/     ← copy from assets A la carta/
├── drinks/        ← copy from assets Drinks/
├── kids/          ← copy from assets Kids/
├── desserts/      ← copy from assets Desserts/
└── express/       ← empty for now (Express images pending)
```
