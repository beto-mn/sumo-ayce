# Quickstart: Branch Finder por Ubicación

**Feature**: `004-branch-finder-location`  
**Date**: 2026-05-24

## Prerequisites

- App corriendo: `pnpm dev`
- Al menos una sucursal en BD con `lat`/`lng` y `is_active = true`
- `.env.local` con `DATABASE_URL` válido

## Scenario 1: Búsqueda con coordenadas (sucursal cercana)

```bash
# Usando coordenadas del centro de Polanco, CDMX
curl "http://localhost:3000/api/v1/branches?lat=19.4326&lng=-99.1332"
```

**Expected**:
```json
{
  "data": [
    { "id": "...", "name": "SUMO Polanco", "distanceKm": 0.85, ... }
  ],
  "error": null,
  "meta": null,
  "searchContext": { "radiusUsed": 10, "expanded": false, "noResults": false }
}
```

## Scenario 2: Expansión de radio automática

```bash
# Coordenadas de una zona sin sucursales cercanas (ej. aeropuerto AIFA)
curl "http://localhost:3000/api/v1/branches?lat=19.7472&lng=-99.0145"
```

**Expected**: `searchContext.expanded = true`, `radiusUsed > 10`

## Scenario 3: Sin resultados

```bash
# Coordenadas fuera de cobertura (ej. Cancún)
curl "http://localhost:3000/api/v1/branches?lat=21.1619&lng=-86.8515"
```

**Expected**:
```json
{
  "data": [],
  "error": null,
  "meta": null,
  "searchContext": { "radiusUsed": 50, "expanded": true, "noResults": true }
}
```

## Scenario 4: Listado completo sin coordenadas

```bash
curl "http://localhost:3000/api/v1/branches"
```

**Expected**: todas las sucursales activas, sin `distanceKm`, sin `searchContext`.

## Scenario 5: Validación — lat sin lng

```bash
curl "http://localhost:3000/api/v1/branches?lat=19.43"
```

**Expected**: HTTP 400, mensaje de error descriptivo.

## Scenario 6: Validación — coordenadas inválidas

```bash
curl "http://localhost:3000/api/v1/branches?lat=999&lng=-99.13"
```

**Expected**: HTTP 400.

## Verificar expansión de radio manual con env var

```bash
# Reducir el default a 1 km para forzar expansión
BRANCH_FINDER_DEFAULT_RADIUS_KM=1 pnpm dev
curl "http://localhost:3000/api/v1/branches?lat=19.4326&lng=-99.1332"
# Debe mostrar searchContext.expanded=true si no hay sucursales a 1 km del punto
```
