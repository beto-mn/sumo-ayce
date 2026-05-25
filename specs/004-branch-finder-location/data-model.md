# Data Model: Branch Finder por Ubicación

**Feature**: `004-branch-finder-location`  
**Date**: 2026-05-24

## No se requieren cambios de schema

La tabla `branches` ya tiene todos los campos necesarios. No hay migración.

---

## Entidad: Branch (existente)

| Campo | Tipo DB | Tipo TS | Notas |
|-------|---------|---------|-------|
| `id` | `uuid` | `string` | PK |
| `name` | `varchar(100)` | `string` | |
| `address` | `text` | `string` | |
| `postalCode` | `varchar(10)` | `string \| null` | |
| `phone` | `varchar(20)` | `string \| null` | |
| `lat` | `decimal(10,8)` | `string \| null`* | Drizzle retorna decimal como string |
| `lng` | `decimal(11,8)` | `string \| null`* | Drizzle retorna decimal como string |
| `schedule` | `jsonb` | `unknown \| null` | Horarios |
| `whatsappReservaciones` | `varchar(20)` | `string \| null` | |
| `whatsappReservacionesBackup` | `varchar(20)` | `string \| null` | |
| `isActive` | `boolean` | `boolean` | Filtro principal |
| `createdAt` | `timestamp` | `Date` | |
| `updatedAt` | `timestamp` | `Date` | |

*Drizzle mapea `decimal` a `string` en runtime — se parsea con `parseFloat()` en la utilidad Haversine.

**Índices existentes relevantes**:
- `branches_active_idx` — partial index `WHERE is_active = true`
- `branches_coords_idx` — composite index `(lat, lng)`

---

## Tipos de Response (no persistidos)

### `BranchWithDistance`

Extensión del row de `branches` con campo adicional para búsquedas con coordenadas:

```typescript
type BranchWithDistance = {
  id: string
  name: string
  address: string
  postalCode: string | null
  phone: string | null
  lat: string | null
  lng: string | null
  schedule: unknown | null
  isActive: boolean
  distanceKm: number   // añadido — redondeado a 2 decimales
}
```

### `SearchContext`

Objeto incluido en el response cuando se filtra por coordenadas:

```typescript
type SearchContext = {
  radiusUsed: number    // radio en km que produjo los resultados
  expanded: boolean     // true si se expandió más allá del radio inicial
  noResults: boolean    // true si ningún radio produjo resultados
}
```

### Response shapes

**Con coordenadas (resultados encontrados)**:
```json
{
  "data": [
    { "id": "...", "name": "...", "distanceKm": 3.45, ... }
  ],
  "error": null,
  "meta": null,
  "searchContext": { "radiusUsed": 10, "expanded": false, "noResults": false }
}
```

**Con coordenadas (sin resultados tras expansión)**:
```json
{
  "data": [],
  "error": null,
  "meta": null,
  "searchContext": { "radiusUsed": 50, "expanded": true, "noResults": true }
}
```

**Sin coordenadas**:
```json
{
  "data": [ { "id": "...", "name": "...", ... } ],
  "error": null,
  "meta": null
}
```
