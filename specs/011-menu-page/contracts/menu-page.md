# UI + API Contract: Menu Page

**Feature**: 011-menu-page  
**Date**: 2026-06-23

---

## API Contract

### Endpoint

```
GET /api/v1/menu
```

### Query Parameters (Zod schema)

```ts
const MenuQuerySchema = z.object({
  type:     z.enum(['ayce', 'express']),
  modality: z.enum(['buffet', 'carta']).default('buffet'),
})
```

### Successful Response Body (`FullMenuResult`)

```ts
{
  locationType: 'ayce' | 'express'
  modality: 'buffet' | 'carta'
  categories: Array<{
    key: string
    name: { es: string; en: string }
    displayOrder: number
    dishes: Array<{
      id: string
      name: { es: string; en: string }
      description: { es: string; en: string }
      imageUrl: string | null       // fully-resolved: '/menu/ayce/bora_bora.webp' or null
      badge: { es: string; en: string } | null
      price: string | null          // '128.00' — null when buffet or item has no price
      incluido: boolean             // true in buffet for included AYCE items
      drinkGroup: string | null     // 'jumbo_cocktails', 'non_alcoholic', etc.
      requiresSauce: boolean
    }>
  }>
  sauces: Array<{
    id: string
    name: { es: string; en: string }
    spiceLevel: number
  }>
}
```

**Note**: The `drinks` category (`key === 'drinks'`) is always included in the response regardless of type or modality. The frontend is responsible for separating drink items from food items for the drink section rendering.

---

## Component Props Contract

### `MenuShell.vue`

| Prop | Type | Required | Notes |
|------|------|----------|-------|
| `menuData` | `FullMenuResult` | Yes | Full API response |
| `initialType` | `'ayce' \| 'express'` | Yes | From URL query |
| `initialModality` | `'buffet' \| 'carta'` | Yes | From URL query, default 'buffet' |

### `MenuDishCard.vue`

| Prop | Type | Required | Notes |
|------|------|----------|-------|
| `dish` | `FullMenuDish` | Yes | Single dish to render |
| `sauces` | `FullMenuSauce[]` | Yes | Full sauce catalog (for SaucePicker) |
| `modality` | `MenuModality` | Yes | Controls price vs. incluido display |

### `MenuSaucePicker.vue`

| Prop | Type | Required | Notes |
|------|------|----------|-------|
| `sauces` | `FullMenuSauce[]` | Yes | All active sauces |

### `MenuTypeToggle.vue`

| Prop | Type | Required | Notes |
|------|------|----------|-------|
| `activeType` | `'ayce' \| 'express'` | Yes | Currently selected type |

**Emits**: `update:active-type` → `'ayce' | 'express'`

### `MenuModalityToggle.vue`

| Prop | Type | Required | Notes |
|------|------|----------|-------|
| `activeModality` | `'buffet' \| 'carta'` | Yes | Currently selected modality |

**Emits**: `update:active-modality` → `'buffet' | 'carta'`

### `MenuCategoryChips.vue`

| Prop | Type | Required | Notes |
|------|------|----------|-------|
| `categories` | `FullMenuCategory[]` | Yes | Ordered list (drinks always last) |
| `activeCategory` | `string \| null` | Yes | Currently highlighted chip |

**Emits**: `update:active-category` → `string`

### `MenuDishGrid.vue`

| Prop | Type | Required | Notes |
|------|------|----------|-------|
| `categories` | `FullMenuCategory[]` | Yes | Food categories (drinks excluded) |
| `sauces` | `FullMenuSauce[]` | Yes | Full sauce catalog |
| `modality` | `MenuModality` | Yes | Controls card price display |

### `MenuDrinkSection.vue`

| Prop | Type | Required | Notes |
|------|------|----------|-------|
| `drinks` | `FullMenuDish[]` | Yes | All drink items from response |

---

## `useMenuFilters` Composable Contract

```ts
function useMenuFilters(
  initialType: 'ayce' | 'express',
  initialModality: 'buffet' | 'carta'
): {
  activeType: Ref<'ayce' | 'express'>
  activeModality: Ref<'buffet' | 'carta'>
  activeCategory: Ref<string | null>
  showModalityToggle: ComputedRef<boolean>
  accentStyle: ComputedRef<{ '--accent': string }>
  setType: (type: 'ayce' | 'express') => void
  setModality: (modality: 'buffet' | 'carta') => void
  setCategory: (key: string | null) => void
}
```

**Invariants**:
- `setType('express')` always resets `activeModality` to `'buffet'` and `activeCategory` to `null`
- `setType` calls `router.replace({ query: { type: newType, modality: 'buffet' } })`
- `setModality` calls `router.replace({ query: { ...currentQuery, modality: newModality } })`
- `showModalityToggle` is `true` IFF `activeType === 'ayce'`
- `accentStyle['--accent']` is `'var(--color-orange)'` for AYCE, `'var(--color-express-blue)'` for Express

---

## Image Path Resolution

The API route computes `imageUrl` using this mapping (in `server/api/v1/menu/index.get.ts`):

| DB `locationType` | Category key | `includedInAyce` | Resolved path |
|-------------------|--------------|------------------|---------------|
| `'both'` (drinks) | any | any | `/menu/drinks/{fileName}` |
| `'ayce'` or `'both'` | `'kids'` | false | `/menu/kids/{fileName}` |
| `'ayce'` or `'both'` | `'desserts'` | false | `/menu/desserts/{fileName}` |
| `'ayce'` | any | `true` | `/menu/ayce/{fileName}` |
| `'ayce'` | any | `false` | `/menu/ala-carta/{fileName}` |
| `'express'` | any | any | `/menu/express/{fileName}` |
| any | any | any | `null` when `fileName = null` |
