# SUMO AYCE Menu Feature Architecture Map

**Created:** 2026-07-08  
**Project:** Nuxt 4 SPA, PostgreSQL, Drizzle ORM, Vue 3 + Composition API  
**Scope:** Complete menu data model, API contract, and frontend component architecture

---

## 1. Database Schema

### File: `server/db/schema.ts`

#### Menu Categories Table (lines 256–274)

**Table:** `menu_categories`

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | UUID | PK, default random |
| `key` | `menuCategoryKey` enum | NOT NULL, UNIQUE |
| `nameEs` | varchar(80) | NOT NULL |
| `nameEn` | varchar(80) | NOT NULL |
| `displayOrder` | integer | NOT NULL, ≥ 0 |
| `isActive` | boolean | NOT NULL, default true |
| `fileName` | text | nullable |
| `createdAt` | timestamp | NOT NULL, default now |
| `updatedAt` | timestamp | NOT NULL, default now |

**Key Enum:** `menuCategoryKey` (lines 68–86)
```
'appetizers' | 'salads' | 'rice' | 'ramen' | 'burgers' | 'sandwiches' |
'burritos' | 'hot_dogs' | 'cold_rolls' | 'hot_rolls' | 'sweet_rolls' |
'desserts' | 'wings' | 'sauces' | 'extras' | 'drinks' | 'kids'
```
Total: 17 fixed category keys.

---

#### Menu Items Table (lines 276–313)

**Table:** `menu_items`

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | UUID | PK, default random | |
| `categoryId` | UUID | FK → `menuCategories.id` | NOT NULL |
| `nameEs` | varchar(120) | NOT NULL | |
| `nameEn` | varchar(120) | NOT NULL | |
| `descriptionEs` | text | NOT NULL, default '' | |
| `descriptionEn` | text | NOT NULL, default '' | |
| `locationType` | `menuLocationType` enum | NOT NULL, default 'both' | Controls AYCE/Express availability |
| `price` | decimal(8,2) | nullable | Present only for à-la-carte items & drinks |
| `includedInAyce` | boolean | NOT NULL, default true | Buffet (true) vs. à-la-carte (false) |
| `fileName` | text | nullable | Image blob path (e.g., `menu/drinks/sumo_cup.webp`) |
| `badgeEs` | varchar(40) | nullable | Optional badge label (e.g., "Sabor a elegir") |
| `badgeEn` | varchar(40) | nullable | English badge |
| `featured` | boolean | NOT NULL, default false | Displayed on homepage rail |
| `drinkGroupId` | UUID | FK → `drinkGroups.id` | nullable, only for drinks |
| `drinkSubGroupId` | UUID | FK → `drinkSubGroups.id` | nullable, only for drinks with subcategory |
| `requiresSauce` | boolean | NOT NULL, default false | Wings/boneless only |
| `isActive` | boolean | NOT NULL, default true | |
| `displayOrder` | integer | NOT NULL, default 0 | Sort within category |
| `createdAt` | timestamp | NOT NULL, default now | |
| `updatedAt` | timestamp | NOT NULL, default now | |

**Indexes:**
- `menu_items_featured_active_idx`: on `(featured, isActive)` where active featured items
- `menu_items_category_order_idx`: on `(categoryId, displayOrder)`
- `menu_items_location_type_idx`: on `locationType`

**Key Enum:** `menuLocationType` (lines 61–65)
```
'ayce' | 'express' | 'both'
```
Controls which branch type(s) can serve this item.

---

#### Sauces Table (lines 315–329)

**Table:** `sauces`

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | UUID | PK, default random | |
| `nameEs` | varchar(60) | NOT NULL | e.g., "Wasabi", "Mayo Picante" |
| `nameEn` | varchar(60) | NOT NULL | |
| `spiceLevel` | integer | NOT NULL, default 0 | 0=no heat, 1=mild, 2=medium, 3=hot, 4=extra hot |
| `fileName` | text | nullable | Optional image blob path |
| `isActive` | boolean | NOT NULL, default true | |
| `createdAt` | timestamp | NOT NULL, default now | |
| `updatedAt` | timestamp | NOT NULL, default now | |

**Used by:** Wings category (`requiresSauce = true`). Sauces are returned globally in `FullMenuResult.sauces[]` and rendered in `MenuSaucePicker`.

---

#### Drink Groups Table (lines 331–340)

**Table:** `drink_group`

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | UUID | PK, default random | |
| `groupKey` | varchar(60) | NOT NULL, UNIQUE | Identifier (e.g., 'beers_spirits', 'jumbo_cocktails') |
| `subtitleEs` | text | nullable | Display subtitle |
| `subtitleEn` | text | nullable | |
| `promoEs` | text | nullable | Promotional note |
| `promoEn` | text | nullable | |
| `createdAt` | timestamp | NOT NULL, default now | |
| `updatedAt` | timestamp | NOT NULL, default now | |

**Seeded Group Keys:**
- `jumbo_cocktails` (subtitle: "960 ml")
- `cantaritos_sumo_cups`
- `non_alcoholic`
- `sodas`
- `coffee_digestifs`
- `beers_spirits` (has 2x1 subtitle + mixer combo promo)

---

#### Drink Sub-Groups Table (lines 342–363)

**Table:** `drink_sub_group`

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | UUID | PK, default random | |
| `drinkGroupId` | UUID | FK → `drinkGroups.id` | NOT NULL |
| `key` | varchar(60) | NOT NULL, UNIQUE | Identifier (e.g., 'ron', 'cerveza_nacional', 'caguamon') |
| `nameEs` | text | NOT NULL | Display name |
| `nameEn` | text | NOT NULL | |
| `subtitleEs` | text | nullable | Secondary info (e.g., "2x1 promotion text") |
| `subtitleEn` | text | nullable | |
| `promoEs` | text | nullable | Promotional detail (e.g., "Combo Mezcladores $189") |
| `promoEn` | text | nullable | |
| `displayOrder` | integer | NOT NULL, default 0 | Sort within drink group |
| `createdAt` | timestamp | NOT NULL, default now | |
| `updatedAt` | timestamp | NOT NULL, default now | |

**Subcategory Grouping within `beers_spirits`:**
- `cerveza_nacional` (Indio, Tecate, etc.)
- `cerveza_premium` (Bohemia, Heineken, etc.)
- `cerveza` (850ml, 1.8L sizes)
- `caguamon` (Beer bag)
- `ron` (Rum — 2x1 with detailed subtitle/promo)
- `vodka` (Vodka — 2x1)
- `brandy` (Brandy — 2x1)
- `mezcal` (Mezcal — 2x1)
- `ginebra` (Gin — 2x1)
- `tequila` (Tequila — 2x1)
- `whisky` (Whisky — 2x1)
- `cremas_licores` (Cream liqueurs — 2x1)
- `extras_bebidas` (Add-on shots)

**Note on Subcategories in Food:** No food categories have internal grouping. Food items are organized only by `categoryId` and `displayOrder`. The drinking section introduces a NEW grouping paradigm beyond what food uses.

---

## 2. Seed Files

### File: `server/db/seeds/menuCategories.ts`

**Coverage:** All 17 category definitions (lines 23–149).

Example entry:
```typescript
{
  key: 'drinks',
  nameEs: 'Bebidas y coctelería',
  nameEn: 'Drinks & cocktails',
  displayOrder: 15,
  isActive: true,
}
```

### File: `server/db/seeds/drinkGroups.ts`

**Coverage:** 6 top-level drink groups (lines 4–56).

Key detail: `beers_spirits` includes the 2x1 promotion metadata:
```typescript
{
  groupKey: 'beers_spirits',
  subtitleEs: '2x1 Todos los días • Recibe 2 copas de 60 ml del mismo destilado...',
  subtitleEn: '2x1 Every day • Get 2 glasses of 60 ml of the same spirit...',
  promoEs: 'Combo Mezcladores $189: incluye 2 sabores y 2 minerales...',
  promoEn: 'Mixer Combo $189: includes 2 flavors and 2 mineral waters...',
}
```

### File: `server/db/seeds/drinkSubGroups.ts`

**Coverage:** 13 sub-groups, all within `beers_spirits` (lines 25–151).

Notable patterns:

1. **Beer subcategories (displayOrder 0–3):**
   - `cerveza_nacional` (display 0)
   - `cerveza_premium` (display 1)
   - `cerveza` (display 2)
   - `caguamon` (display 3)

2. **Spirit subcategories (displayOrder 4–11):** All carry the same `SPIRIT_SUBTITLE_ES` and `SPIRIT_PROMO_ES` (lines 4–11):
   ```typescript
   const SPIRIT_SUBTITLE_ES = '2x1 Todos los días • Recibe 2 copas de 60 ml...'
   const SPIRIT_PROMO_ES = 'Combo Mezcladores $189: incluye 2 sabores...'
   ```
   Applied to: `ron`, `vodka`, `brandy`, `mezcal`, `ginebra`, `tequila`, `whisky`, `cremas_licores`.

3. **Extras (displayOrder 12):**
   - `extras_bebidas` (no subtitle/promo)

### File: `server/db/seeds/drinks.ts`

**Coverage:** All ~80+ drink items organized into 7 sections.

#### Section 1: Jumbo Cocktails (lines 32–104)
6 items with images:
- Sangría Sumo (`sumo_sangria.webp`)
- Margacheve (`margacheve.webp`, badge: "Sabor + cerveza a elegir")
- Limonada Eléctrica (`electric_lemonade.webp`)
- Baby Sumo (`baby_sumo.webp`)
- Mojito (`mojito.webp`, badge: "Sabor a elegir")
- Asumito (`asumito.webp`)

All 960 ml, priced $139–$169, `includedInAyce: false`.

#### Section 2: Cantaritos & Vaso Sumo (lines 106–204)
8 items, mostly sharing `sumo_cup.webp`:
- **Cantarito Fest** (`cantarito.webp`, $155, badge: "Sabor a elegir")
- **Vaso Sumo Ron** (`sumo_cup.webp`, $159, 120ml Bacardí blanco)
- **Vaso Sumo Tequila** (`sumo_cup.webp`, $159, 120ml Jose Cuervo)
- **Vaso Sumo Vodka** (`sumo_cup.webp`, $159, 120ml Skyy)
- **Vaso Sumo Whisky** (`sumo_cup.webp`, $159, 120ml Black & White)
- **Vaso New Mix** (`sumo_cup.webp`, $159, badge: "Pikosito o paloma")
- **Vaso Jack Daniel's** (`sumo_cup.webp`, $159, badge: "Mineral, ginger o manzana")
- **Tropical Sumo** (`sumo_cup.webp`, $169, no badge)

**Critical finding:** Multiple "Vaso Sumo" items share the same image file. This is intentional — the image is generic; the distinction is in `nameEn` (Rum/Tequila/Vodka/Whisky) and description.

#### Section 3: Non-Alcoholic (lines 206–285)
6 items with images:
- Piñada, Bora Bora, Punch, Iceberg Lemon, Sakura Fresa, Lychee Cooler
- Prices $79–$139
- Badges include options and upcharges: "+$25 vino tinto", "+$25 ron", "+$25 vodka"

#### Section 4: Sodas & Beverages (lines 287–369)
9 items, **no individual images** (fileName null):
- Refresco (355ml, $69)
- Refresco Jumbo (960ml, $129)
- Té Helado, Agua Embotellada, etc.
- Limonada Jumbo ($99, badge: "Sabor a elegir")
- Jugs (Limonada/Naranjada pitcher 1.9L, Jugo pitcher 1.9L)

#### Section 5: Coffee & Digestifs (lines 371–426)
6 items, 3 with images:
- Café Americano, Espresso, Bunny Shot (**no images**)
- Carajillo Mazapán (`mazapan.webp`, $149)
- Carajillo Clásico (`classic.webp`, $149)
- Carajillo Baileys (`baileys.webp`, $169)

#### Section 6: Beers & Spirits (lines 428–858)
Largest section (~60 items), split into 3 subsections:

**Beers (lines 431–566):**
- 6 national bottled (Indio, Tecate, XX Ambar, Sol) → `drinkSubGroupKey: 'cerveza_nacional'`
- 2 large sizes (850ml, 1.8L pitcher) → `drinkSubGroupKey: 'cerveza'`
- 5 premium (Bohemia, Amstel, Heineken) → `drinkSubGroupKey: 'cerveza_premium'`
- 1 **Caguamón en Bolsa** (`caguamon_en_bolsa.webp`, $149, badge: "Indio o XX Lager") → `drinkSubGroupKey: 'caguamon'`

**Critical finding:** **"Caguamón" (beer bag) is stored as a drink item in the `beers_spirits` group, mapped to the `caguamon` sub-group.** It has a distinct image and badge.

**Spirits / 2x1 Copeos (lines 629–858):**
All follow pattern: `drinkSubGroupKey: one of ron|vodka|brandy|mezcal|ginebra|tequila|whisky|cremas_licores`

Examples:
- Bacardí Blanco (ron, $119, badge: "700 ml · Botella $699")
- Skyy Vodka (vodka, $139, badge: "750 ml · Botella $699")
- Jose Cuervo Tradicional Plata (tequila, $159)
- Jack Daniel's (whisky, $249)

**No images** for any spirit item; prices shown in `badgeEs/badgeEn` (bottle size + price).

**Critical finding:** The "2x1" and "Combo Mezcladores" promo text lives in the **`drinkSubGroupId.subtitleEs` and `.promoEs`**, NOT in the item badge. The **same text is reused** across all spirit sub-groups (see drinkSubGroups.ts lines 4–11).

#### Section 7: Extras (lines 567–622)
Drink add-ons under `drinkSubGroupKey: 'extras_bebidas'`:
- Tarro Chico/Grande Michelado (30ml / 60ml)
- Tarro Chico/Grande Cubano (35ml / 70ml)
- Tarro Chico/Grande con Clamato (120ml / 240ml)

Prices $20–$54, **no images**.

---

### Files: `ayceMenu.ts`, `expressMenu.ts`, `alaCarta.ts`, `kidsMenu.ts`, `desserts.ts`

These seed files populate non-drink categories. Key pattern: `includedInAyce: true` for buffet items, `false` for à-la-carte. The `drinks.ts` seed handles all drink category items with `includedInAyce: false`.

---

## 3. API Contract

### Endpoint: `server/api/v1/menu/index.get.ts`

**Route:** `GET /api/v1/menu`

**Query Parameters (Zod schema, lines 6–9):**
```typescript
{
  type: 'ayce' | 'express' (required),
  modality: 'buffet' | 'carta' (optional, default 'buffet')
}
```

**Response Shape:** `FullMenuResult` (see types/menu.ts, lines 92–100)

```typescript
{
  locationType: 'ayce' | 'express',
  modality: 'buffet' | 'carta',
  categories: FullMenuCategory[],
  sauces: FullMenuSauce[]
}
```

### Data Transformation: `server/utils/menu-queries.ts`

**Key Function:** `getFullMenu(params)` (lines 284–297)

**Modality Resolution (lines 118–124):**
- Express is **always coerced to buffet** (à-la-carte is AYCE-only)
- AYCE can be buffet or carta (query param controls)

**Location Scope Filter (lines 237–239):**
```typescript
inArray(menuItems.locationType, [locationType, 'both'])
```
Includes items marked for the requested branch type OR marked 'both'.

**Modality Filter (lines 247–256):**
```typescript
or(
  eq(menuItems.locationType, 'both'),  // drinks always shown
  eq(menuItems.includedInAyce, modality !== 'carta')  // buffet shows included, carta shows not-included
)
```

**Category Grouping (lines 170–189):**
- All returned rows grouped by `categoryKey`
- Preserved in `displayOrder` sequence
- Returns `FullMenuCategory[]` with nested `dishes[]`

**Sauce Catalog (lines 258–277):**
- Queries all active sauces
- Sorts by `spiceLevel` ascending
- Returns flat array (not category-specific)

### Image URL Resolution: `server/api/v1/menu/resolveImageUrl.ts`

**Function:** `resolveImageUrl(filePath)` (lines 10–15)

```typescript
export function resolveImageUrl(filePath: string | null): string | null {
  if (!filePath) return null
  const base = env.BLOB_BASE_URL.replace(/\/$/, '')  // e.g., 'https://...'
  const path = filePath.replace(/^\//, '')
  return `${base}/${path}`
}
```

**Usage:**
- Called for each item's `fileName` → returns full image URL or null
- Called for each sauce's `fileName`
- BLOB_BASE_URL from environment (Vercel Blob or similar)

**Items Without Images:**
- Most spirit/beer items (no `fileName`)
- Sodas/small items (no `fileName`)
- Returns `imageUrl: null` in response → component skips image block

---

## 4. Frontend Components

### Directory: `app/features/menu/components/`

#### MenuShell.vue

**Responsibility:** Top-level menu layout and orchestration.

**Props:**
- `menuData: FullMenuResult` — complete menu from API
- `initialType: MenuType` — 'ayce' or 'express' from route
- `initialModality: MenuModality` — 'buffet' or 'carta' from route

**Key State:**
- `activeType`, `activeModality`, `activeCategory` (from `useMenuFilters`)
- `activeCategory === null` → show all food categories + drinks section
- `activeCategory === 'drinks'` → show only drinks, categorized by drink group
- `activeCategory === (food key)` → show only that food category

**Child Components:**
1. `MenuTypeToggle` — AYCE/Express switch
2. `MenuModalityToggle` — Buffet/À-la-carte switch (AYCE-only, computed via `showModalityToggle`)
3. Drinks toggle button — "Bebidas y coctelería" (line 117)
4. `MenuCategoryChips` — shows food categories OR drink groups (toggles at line 131/137)
5. `MenuDishGrid` — renders food categories (line 148)
6. `MenuDrinkSection` — renders drinks (line 154)
7. Scroll-to-top button (line 162)

**Styling:**
- CSS variable `--accent` set to orange (AYCE) or blue (Express) or soft (drinks)
- All child components use this accent for theming

---

#### MenuTypeToggle.vue

**Responsibility:** Switch between AYCE and Express menus.

**Props:**
- `activeType: MenuType`

**Events:**
- `'update:active-type': MenuType`

**Behavior:**
- Two buttons (AYCE, Express)
- Active button: orange (AYCE) / blue (Express) background
- Inactive: transparent with hover effect
- Uses `min-h-[44px]` for touch accessibility

---

#### MenuModalityToggle.vue

**Responsibility:** Switch between Buffet and À-la-carte (AYCE only).

**Props:**
- `activeModality: MenuModality`

**Events:**
- `'update:active-modality': MenuModality`

**Behavior:**
- Two buttons (Buffet/À-la-carte)
- Active button: dark ink background
- Labels from i18n: `menu.modality.buffet` / `menu.modality.carta`

**Note:** Only shown when `showModalityToggle` is true (AYCE type).

---

#### MenuCategoryChips.vue

**Responsibility:** Category filter chips.

**Props:**
- `categories: FullMenuCategory[]`
- `activeCategory: string | null`
- `translationPrefix?: string` (default: `'menu.category'`)

**Events:**
- `'update:active-category': string | null`

**Behavior:**
- Renders one chip per category
- Chip text from i18n: `{translationPrefix}.{category.key}`
- Click toggles: active → null, inactive → active
- For drinks, prefix changes to `'menu.drink_group'`

---

#### MenuDishCard.vue

**Responsibility:** Single dish card (food only, not drinks).

**Props:**
- `dish: FullMenuDish`
- `sauces: FullMenuSauce[]` (for `MenuSaucePicker`)
- `modality: MenuModality`

**Sections:**
1. **Image (lines 36–46):** Conditionally rendered if `dish.imageUrl` exists
   - `h-44` (176px) fixed height
   - `object-contain` (preserves aspect ratio)
   - **No hover effect visible in this component**
   - Badge (if exists) overlaid top-right

2. **Name (line 54):** Large, bold uppercase title

3. **Description (line 55):** Smaller text

4. **Price or "Incluido" (lines 56–63):**
   - Buffet modality: shows "Incluido" if `incluido === true`
   - Carta modality: shows price with `menu.dish.price_prefix` ("$")

5. **Sauce Picker (line 64):** Rendered if `dish.requiresSauce === true`

---

#### MenuDishGrid.vue

**Responsibility:** Grid layout for food categories.

**Props:**
- `categories: FullMenuCategory[]` (already filtered to visible set)
- `sauces: FullMenuSauce[]`
- `modality: MenuModality`

**Rendering:**
- Loop over categories (line 29)
- Each category is a `<section>` with `id={key}` and `scroll-mt-24`
- Category header from `menu.category.{key}` i18n key OR category.name bilingual fallback
- Grid of `MenuDishCard` (responsive: 1 col mobile, 2 tablet, 3 desktop)

---

#### MenuSaucePicker.vue

**Responsibility:** Sauce selection for wings/boneless items.

**Props:**
- `sauces: FullMenuSauce[]` (all active sauces for Wings category)

**Local State:**
- `selectedId: Ref<string | null>` (toggle selection)

**Rendering:**
- Sorts sauces by `spiceLevel` ascending
- Each sauce button shows name + spicy indicator (🌶 × count for level ≥ 3)
- Click to toggle selection (selected → deselected, vice versa)
- Button styling: dark bg when selected, light when not

**Wiring:**
- Used in `MenuDishCard` when `dish.requiresSauce === true`
- No model binding to cart/order (UI-only in this component; order integration would be elsewhere)

---

#### MenuDrinkSection.vue

**Responsibility:** Drink category rendering with sub-group structure.

**Props:**
- `drinks: FullMenuDish[]` (all drink items)
- `activeGroup?: string | null` (current filtered drink group)

**Grouping Logic:**
1. Group drinks by `drinkGroup` (top-level: jumbo_cocktails, beers_spirits, etc.)
2. Filter by `activeGroup` if set (line 25)
3. For `beers_spirits` group: further sub-group by `drinkSubGroup` (lines 37–60)

**Rendering per Drink Group:**

**For `beers_spirits`:**
- Iterate over `beerSpiritSubGroups` (computed, lines 37–60)
- For each sub-group:
  - H4 header with sub-group name (lines 94–98)
  - Optional subtitle text (line 100)
  - Optional promo badge (yellow background, line 106)
  - Grid of drink cards
- Each drink card includes:
  - Image (if exists)
  - Name
  - Badge (if exists) — shows bottle size + price for spirits
  - Price (from `drink.price`)

**For Other Groups (jumbo_cocktails, sodas, etc.):**
- Simple grid of drink cards (line 140)
- No sub-grouping headers

---

## 5. State Management & URL Sync

### File: `app/features/menu/composables/useMenuFilters.ts`

**Composable:** `useMenuFilters(initialType, initialModality)`

**State Variables:**
```typescript
activeType: Ref<MenuType>              // from prop
activeModality: Ref<MenuModality>      // from prop
activeCategory: Ref<string | null>     // from route.query.category ?? null
showModalityToggle: ComputedRef<boolean> // true when activeType === 'ayce'
accentStyle: ComputedRef<{ '--accent': string }> // orange/blue based on type
```

**Methods:**
1. `setType(type)` — Update activeType, reset modality to 'buffet', clear category, sync URL
2. `setModality(modality)` — Update modality, clear category, sync URL
3. `setCategory(key | null)` — Update activeCategory, sync URL

**URL Synchronization (lines 40–55):**
- `router.replace({ query: { ...rest, type, modality, category } })`
- Query params persist across page refreshes
- Clearing a filter removes its param from the query string

**Initial State:**
- `activeCategory` reads from `route.query.category` (line 27)
- If route has no category param, starts at `null` (shows all food)

**Key Behavior:**
When modality changes:
```typescript
activeCategory.value = null  // Reset to show all food
```
This ensures the user sees the full buffet/carta view after toggling.

---

## 6. i18n Integration

### File: `i18n/locales/es.json` & `en.json`

**Menu-Specific Keys:**

#### Type Labels (es.json lines 216–219, en.json lines 216–219)
```json
"menu": {
  "type": {
    "ayce": "AYCE",
    "express": "Express"
  }
}
```

#### Modality Labels (es.json lines 220–223, en.json lines 220–223)
```json
"modality": {
  "buffet": "All You Can Eat",
  "carta": "À la carte"
}
```

#### Category Labels (es.json lines 224–241, en.json lines 224–241)

**Spanish Examples:**
```json
"appetizers": "Entradas",
"salads": "Ensaladas",
"rice": "Arroz",
"ramen": "Ramen",
"burgers": "Burgers",
"sandwiches": "Sándwiches",
"burritos": "Burritos",
"hot_dogs": "Hot Dogs",
"cold_rolls": "Sushi Frío",
"hot_rolls": "Sushi Caliente",
"sweet_rolls": "Rollos Dulces",
"desserts": "Postres",
"wings": "Alitas & Boneless",
"kids": "Menú Kids",
"drinks": "Bebidas y coctelería",
"empty": "Sin platillos en esta categoría"
```

**English Examples:**
```json
"appetizers": "Appetizers",
"cold_rolls": "Cold Rolls",
"hot_rolls": "Hot Rolls",
"sweet_rolls": "Sweet Rolls",
"desserts": "Desserts",
"wings": "Wings & Boneless",
"kids": "Kids Menu",
"drinks": "Drinks & cocktails",
"empty": "No dishes in this category"
```

#### Drink Group Labels (es.json lines 248–255, en.json lines 248–255)

**Spanish:**
```json
"drink_group": {
  "jumbo_cocktails": "Coctelería Jumbo",
  "cantaritos_sumo_cups": "Cantaritos y Vasos Sumo",
  "non_alcoholic": "Bebidas Sin Alcohol",
  "sodas": "Refrescos y Bebidas",
  "coffee_digestifs": "Café y Digestivos",
  "beers_spirits": "Cervezas y Destilados"
}
```

**English:**
```json
"drink_group": {
  "jumbo_cocktails": "Jumbo Cocktails",
  "cantaritos_sumo_cups": "Cantaritos & Sumo Cups",
  "non_alcoholic": "Non-Alcoholic Drinks",
  "sodas": "Sodas & Beverages",
  "coffee_digestifs": "Coffee & Digestifs",
  "beers_spirits": "Beers & Spirits"
}
```

#### Dish Labels (es.json lines 242–247, en.json lines 242–247)

```json
"dish": {
  "incluido": "Incluido" / "Included",
  "price_prefix": "$",
  "no_image_alt": "Platillo SUMO" / "SUMO dish",
  "sauce_required": "Elige tu salsa" / "Choose your sauce"
}
```

#### Sauce Labels (es.json lines 256–258, en.json lines 256–258)

```json
"sauce": {
  "spicy_indicator": "Picante" / "Spicy"
}
```

---

## 7. Menu Loading & Default State

### Initial Menu Display Behavior

**When page loads (MenuShell.vue):**

1. **Route Query Parsing:**
   - `useMenuFilters` reads `route.query.type` and `route.query.modality` from URL
   - Falls back to props `initialType` and `initialModality` if not in query

2. **activeCategory Initialization:**
   - Reads from `route.query.category`
   - **Default: `null`** (no category selected)

3. **Rendering with activeCategory = null:**
   - `visibleFoodCategories` (line 74) returns **all food categories**
   - `showFoods` and `showDrinks` both true
   - **MenuShell displays BOTH food grid AND drink section simultaneously**

4. **Clicking a Category Chip:**
   - Sets `activeCategory` to that key
   - `visibleFoodCategories` (line 74) filters to just that one category
   - URL updates: `?type=ayce&modality=buffet&category=appetizers`

5. **Clicking "Bebidas y coctelería" button:**
   - Sets `activeCategory = 'drinks'`
   - `showFoods` becomes false
   - Only drink section renders

**Summary:** Menu starts showing all categories (food + drinks) on page load. No single category is "default selected" in the UI — the default is "show everything."

---

## 8. Architecture Summary: Data Flow

```
Route (type, modality, category)
    ↓
MenuShell (receives props, initializes useMenuFilters)
    ↓
API call: GET /api/v1/menu?type=ayce&modality=buffet
    ↓
server/utils/menu-queries.ts (getFullMenu)
    ├─ queryMenuRows: joins items + categories + drink groups + drink sub-groups
    ├─ groupByCategory: organizes by categoryKey
    ├─ querySauces: fetches Wings sauces
    └─ returns FullMenuResult
    ↓
MenuShell receives FullMenuResult
    ├─ filters into foodCategories (all except 'drinks')
    ├─ filters into drinkItems (drinks category only)
    ├─ watches activeCategory
    ├─ conditionally renders:
    │  ├─ MenuCategoryChips (food OR drink groups)
    │  ├─ MenuDishGrid (food categories, responsive grid)
    │  └─ MenuDrinkSection (drinks with sub-group structure)
    └─ each MenuDishCard can show MenuSaucePicker if requiresSauce
```

---

## 9. Key Findings & Constraints

### Database Design

1. **17 fixed menu categories** — defined in `menuCategoryKey` enum. No dynamic category creation.
2. **Drink sub-grouping** — unique to drinks; food has no internal grouping beyond displayOrder.
3. **Sauce catalog** — global, not category-specific. All sauces returned in one array; only shown on items where `requiresSauce === true`.
4. **Images** — optional per item; NULL results in no image block in card; drinks & spirits often have NULL (text-only).

### API & Modality Logic

1. **Express coerces to buffet** — line 123 in menu-queries.ts. À-la-carte is AYCE-only.
2. **Price visibility rule:**
   - Buffet modality: shows "Incluido" for food, shows price only for drinks
   - Carta modality: shows price for all items (food + drinks)
3. **Location type filtering** — items marked 'ayce', 'express', or 'both' control availability per branch type.

### Frontend Display

1. **Default category selection:** NONE. Shows all categories on first load.
2. **Drinks section:** Separated from food grid, uses drink-group sub-structure (unique to beers_spirits).
3. **Image handling:** Lazy loading + async decode; missing images don't break layout.
4. **Sauce picker state:** UI-only toggle; no cart integration in this component.

### i18n Keys

1. **Category labels:** `menu.category.{key}`
2. **Drink group labels:** `menu.drink_group.{key}`
3. **Modality labels:** `menu.modality.{type}`
4. **Type labels:** `menu.type.{type}`

---

## 10. Known Gaps & Open Questions

1. **Hover effects** — MenuDishCard has no CSS `:hover` or animation on the image. Is this intentional?
2. **Sauce picker persistence** — No form submission or local state persistence; selection is lost on navigation.
3. **Drink image sharing** — Multiple "Vaso Sumo" items share `sumo_cup.webp`. Is there a UI affordance to differentiate (besides name)?
4. **Mobile responsiveness** — Components use responsive grid classes; no mobile-specific breakpoints tested here.
5. **Pagination/virtualization** — No infinite scroll or lazy loading of items. Full menu loaded at once.
6. **Sub-category expansion** — Other categories (food) may need sub-grouping in future; current schema supports only drink sub-groups.

---

## 11. Files Summary Table

| File | Purpose | Key Lines |
|------|---------|-----------|
| `server/db/schema.ts` | DB tables + enums | 256–363 |
| `server/db/seeds/menuCategories.ts` | 17 category definitions | 23–149 |
| `server/db/seeds/drinkGroups.ts` | 6 drink group definitions | 4–56 |
| `server/db/seeds/drinkSubGroups.ts` | 13 sub-group definitions (beers_spirits) | 25–151 |
| `server/db/seeds/drinks.ts` | 80+ drink items (7 sections) | 32–858 |
| `server/api/v1/menu/index.get.ts` | GET /api/v1/menu endpoint | 6–25 |
| `server/utils/menu-queries.ts` | Menu query + transformation logic | All |
| `server/api/v1/menu/resolveImageUrl.ts` | Image URL resolution | 10–15 |
| `types/menu.ts` | API response types + enums | All |
| `app/features/menu/composables/useMenuFilters.ts` | Filter state + URL sync | All |
| `app/features/menu/types.ts` | MenuType + MenuPageQuery | All |
| `app/features/menu/components/MenuShell.vue` | Top-level layout | All |
| `app/features/menu/components/MenuTypeToggle.vue` | AYCE/Express switch | All |
| `app/features/menu/components/MenuModalityToggle.vue` | Buffet/Carta switch | All |
| `app/features/menu/components/MenuCategoryChips.vue` | Category filter chips | All |
| `app/features/menu/components/MenuDishCard.vue` | Individual dish card | All |
| `app/features/menu/components/MenuDishGrid.vue` | Food grid layout | All |
| `app/features/menu/components/MenuSaucePicker.vue` | Sauce selector | All |
| `app/features/menu/components/MenuDrinkSection.vue` | Drinks w/ sub-groups | All |
| `i18n/locales/es.json` | Spanish labels | lines 215–267 |
| `i18n/locales/en.json` | English labels | lines 215–267 |

