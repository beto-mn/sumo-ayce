# API Contract: Branch Finder

**Feature**: `004-branch-finder-location`  
**Date**: 2026-05-24

---

## `GET /api/branches`

Regresa sucursales activas, con filtrado por radio opcional basado en coordenadas.

### Query Parameters

| Param | Type | Required | Constraints | Default |
|-------|------|----------|-------------|---------|
| `lat` | number | conditional* | `[-90, 90]` | — |
| `lng` | number | conditional* | `[-180, 180]` | — |
| `radius` | number | no | `> 0` | env `BRANCH_FINDER_DEFAULT_RADIUS_KM` (10) |

*`lat` y `lng` son todo-o-nada: si se envía uno sin el otro → 400.

### Responses

#### 200 — Con coordenadas, resultados encontrados

```json
{
  "data": [
    {
      "id": "uuid",
      "name": "SUMO Polanco",
      "address": "Av. Presidente Masaryk 123, Polanco",
      "postalCode": "11560",
      "phone": "+5255XXXXXXXX",
      "lat": "19.43260000",
      "lng": "-99.19240000",
      "schedule": null,
      "isActive": true,
      "distanceKm": 1.23
    }
  ],
  "error": null,
  "meta": null,
  "searchContext": {
    "radiusUsed": 10,
    "expanded": false,
    "noResults": false
  }
}
```

Sucursales ordenadas por `distanceKm` ascendente.

#### 200 — Con coordenadas, sin resultados tras expansión

```json
{
  "data": [],
  "error": null,
  "meta": null,
  "searchContext": {
    "radiusUsed": 50,
    "expanded": true,
    "noResults": true
  }
}
```

#### 200 — Sin coordenadas (listado completo)

```json
{
  "data": [
    {
      "id": "uuid",
      "name": "SUMO Polanco",
      "address": "...",
      "postalCode": "11560",
      "phone": "+5255XXXXXXXX",
      "lat": "19.43260000",
      "lng": "-99.19240000",
      "schedule": null,
      "isActive": true
    }
  ],
  "error": null,
  "meta": null
}
```

Sin campo `distanceKm`. Sin campo `searchContext`. Ordenado por `name` ascendente.

#### 400 — Validación fallida

```json
{
  "statusCode": 400,
  "statusMessage": "Validation Error",
  "data": [
    { "code": "custom", "message": "lat and lng must be provided together", "path": [] }
  ]
}
```

Casos que producen 400:
- `lat` sin `lng` (o viceversa)
- `lat` fuera de `[-90, 90]`
- `lng` fuera de `[-180, 180]`
- `radius` ≤ 0 o no numérico
- `lat` o `lng` no numérico (no coercible a float)

### Lógica de Expansión

Los radios se generan con progresión geométrica a partir de `defaultRadius` y `maxRadius`:

```
r = (maxRadius / defaultRadius) ^ (1/3)
radios = [defaultRadius, round(defaultRadius × r), round(defaultRadius × r²), maxRadius]

Ejemplos:
  defaultRadius=10, maxRadius=50  → [10, 17, 29, 50]
  defaultRadius=10, maxRadius=100 → [10, 22, 46, 100]
  defaultRadius=7,  maxRadius=128 → [7, 18, 47, 128]
```

Algoritmo de búsqueda:

```
Para cada radio en radios:
  candidatos = branches donde distanceKm <= radio
  Si candidatos.length > 0:
    return { data: candidatos, searchContext: { radiusUsed: radio, expanded: radio > defaultRadius, noResults: false } }

return { data: [], searchContext: { radiusUsed: maxRadius, expanded: true, noResults: true } }
```

### Campos excluidos del response

- `whatsappReservaciones` — información interna del sistema de reservaciones
- `whatsappReservacionesBackup` — ídem
- `createdAt`, `updatedAt` — campos de auditoría no relevantes para el consumidor

### Test Requirements

| Caso | Input | Expected |
|------|-------|----------|
| Coordenadas con sucursales en radio default | `lat=19.43, lng=-99.13` (sucursal a 5 km) | 200, `data.length >= 1`, `searchContext.expanded=false` |
| Coordenadas sin sucursales en default, sí en 25 km | lat/lng alejado | 200, `searchContext.radiusUsed=25`, `expanded=true` |
| Coordenadas sin sucursales en ningún radio | lat/lng muy alejado | 200, `data=[]`, `searchContext.noResults=true` |
| Sin params | — | 200, todas las sucursales activas, sin `searchContext` |
| Solo `lat` sin `lng` | `lat=19.43` | 400 |
| `lat` fuera de rango | `lat=999&lng=-99` | 400 |
| `radius` negativo | `lat=19&lng=-99&radius=-5` | 400 |
| `lat` no numérico | `lat=abc&lng=-99` | 400 |
