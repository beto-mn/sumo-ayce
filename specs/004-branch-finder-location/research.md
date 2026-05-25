# Research: Branch Finder por Ubicación

**Feature**: `004-branch-finder-location`  
**Date**: 2026-05-24

---

## Decision 1: Haversine vs PostGIS vs librería npm

**Decision**: Implementar Haversine en TypeScript puro en `server/utils/haversine.ts`.

**Rationale**: La fórmula Haversine cabe en ~12 líneas de TypeScript. PostGIS requiere extensión en Neon y mayor complejidad de setup. Librerías npm como `geolib` o `haversine` salvan <100 líneas — no justifican una dependencia según Constitution IX (KISS). La precisión de Haversine (asume tierra esférica) es ±0.5% máximo, suficiente para distancias ≤50 km en CDMX.

**Alternatives considered**:
- PostGIS `ST_Distance`: más precisa, permite filtrar en SQL, pero requiere habilitar extensión en Neon + schema change + migración. Overhead no justificado para catálogo <50 sucursales.
- `geolib` / `haversine` npm: salva ~12 líneas. No supera el umbral de 100 líneas de Constitution IX.
- Formula Vincenty: más precisa (elipsoide), ~50 líneas. La diferencia vs Haversine a 50 km es <0.3 m — irrelevante para este uso.

---

## Decision 2: Fetch-all vs SQL bounding box vs PostGIS

**Decision**: Fetch-all de sucursales activas con `lat`/`lng` no nulos, filtrado en JavaScript.

**Rationale**: SUMO tiene <50 sucursales en total. Hacer `SELECT * FROM branches WHERE is_active = true AND lat IS NOT NULL` regresa un payload mínimo (<5 KB). Filtrar en JS con Haversine sobre 50 registros es imperceptible (~0.1 ms). Un bounding box SQL (`lat BETWEEN`, `lng BETWEEN`) añade complejidad sin beneficio medible a esta escala. PostGIS descartado (ver Decision 1).

**Alternatives considered**:
- SQL bounding box + Haversine en JS: reduce filas consultadas, pero el overhead de la query extra supera el beneficio a <50 registros.
- PostGIS: descartado (ver Decision 1).
- Solo SQL con aproximación de distancia lineal: impreciso en latitudes no-ecuatoriales, no recomendable.

---

## Decision 3: Estrategia de expansión de radio

**Decision**: Generar 4 radios con progresión geométrica a partir de `defaultRadius` y `maxRadius`:

```typescript
function buildRadii(min: number, max: number): number[] {
  const r = (max / min) ** (1 / 3)
  return [min, Math.round(min * r), Math.round(min * r * r), max]
}

// Ejemplos:
buildRadii(10, 50)  // [10, 17, 29, 50]
buildRadii(10, 100) // [10, 22, 46, 100]
buildRadii(7, 128)  // [7, 18, 49, 128]
```

Los intermedios se calculan en runtime — nunca hardcodeados. El loop para en el primer radio que devuelve al menos un resultado.

**Rationale**: Hardcodear 25 y 50 funciona solo cuando min=10 y max=50. Si el cliente cambia los env vars (ej. min=7, max=128), los intermedios fijos ya no tienen sentido geográfico. La progresión geométrica (escala logarítmica) produce pasos perceptiblemente iguales a cualquier rango — cada nivel cubre ~2.5× el anterior, que es intuitivo para el usuario (de "mi zona" a "mi ciudad" a "mi metrópolis" a "región"). Los intermedios se calculan una sola vez al arrancar el servidor en `branch-finder-config.ts`.

**Alternatives considered**:
- Intermedios hardcodeados (25 y 50): solo válidos para el rango default. Se rompen con cualquier otro min/max.
- Incremento lineal: pasos pequeños al inicio (inútiles), pasos grandes al final (salto abrupto).
- Solo dos intentos (default → max): pierde granularidad intermedia.

---

## Decision 4: Validación de query params

**Decision**: Zod schema en el handler para `lat`, `lng`, `radius`. `lat` y `lng` validados como par (ambos o ninguno) con `z.object().refine()`. Rango: `lat ∈ [-90, 90]`, `lng ∈ [-180, 180]`, `radius > 0`.

**Rationale**: Consistente con el patrón existente en el proyecto (body validation usa Zod + `handleError`). Los query params llegan como strings — Zod los coerce a número con `z.coerce.number()`.

**Alternatives considered**:
- Validación manual: más verboso, inconsistente con el proyecto.
- Validación solo de tipos sin rangos: permite coordenadas imposibles como `lat=999`.

---

## Decision 5: Tipo de retorno de `lat`/`lng` en Drizzle

**Decision**: El campo `decimal` de Drizzle regresa `string | null` en runtime. Parsear a `number` con `parseFloat()` dentro de `haversine()`. Ignorar sucursales donde `lat` o `lng` sea `null`.

**Rationale**: Drizzle mapea `decimal` a `string` para preservar precisión. `parseFloat` es suficiente para coordenadas (8 decimales). Sucursales sin coordenadas simplemente se excluyen del filtrado — no son un error.

---

## Decision 6: Env vars y defaults

**Decision**: `BRANCH_FINDER_DEFAULT_RADIUS_KM` (default 10) y `BRANCH_FINDER_MAX_RADIUS_KM` (default 50). Opcionales en Zod con `.optional()` y default en código. No agregar al grupo de variables requeridas de Constitution XII.

**Rationale**: Son parámetros de comportamiento del buscador, no credenciales ni URLs de servicios externos. Un valor ausente tiene un default sensato. Agregarlos como requeridos causaría startup failure innecesario en entornos existentes que no han seteado estas vars.

**Implementation**: Nueva utilidad `server/utils/branch-finder-config.ts`, patrón idéntico a `reservation-config.ts` existente.
