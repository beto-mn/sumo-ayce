# Feature Specification: Branch Finder por Ubicación

**Feature Branch**: `feat/004-branch-finder-location`  
**Created**: 2026-05-24  
**Status**: Draft  
**Scope**: Backend únicamente — endpoint `GET /api/v1/branches`  
**Input**: User description: "Buscar sucursales SUMO por ubicación del usuario"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Búsqueda por Coordenadas (Priority: P1)

Un cliente (frontend u otro consumidor) envía coordenadas `lat`/`lng` al endpoint. El sistema calcula la distancia desde ese punto a cada sucursal, filtra por radio, aplica expansión automática si no hay resultados, y regresa las sucursales ordenadas por distancia junto con contexto de búsqueda.

**Why this priority**: Es el caso de uso central de la feature. Todo el valor del Branch Finder depende de que este cálculo y filtrado funcionen correctamente.

**Independent Test**: `GET /api/v1/branches?lat=19.4326&lng=-99.1332` — verificar que el response incluye sucursales con `distanceKm` y `searchContext.radiusUsed`.

**Acceptance Scenarios**:

1. **Given** hay sucursales dentro de 10 km del punto enviado, **When** se llama con `lat` y `lng`, **Then** el sistema regresa solo esas sucursales con `distanceKm` y `searchContext.radiusUsed=10`, `expanded=false`, `noResults=false`.
2. **Given** no hay sucursales en 10 km pero sí en 25 km, **When** se llama con `lat` y `lng`, **Then** el sistema expande y regresa esas sucursales con `searchContext.radiusUsed=25`, `expanded=true`.
3. **Given** no hay sucursales en 10 km ni 25 km pero sí en 50 km, **When** se llama con `lat` y `lng`, **Then** regresa esas sucursales con `searchContext.radiusUsed=50`, `expanded=true`.
4. **Given** no hay sucursales en ningún radio hasta el techo, **When** se llama con `lat` y `lng`, **Then** regresa `data: []`, `searchContext.noResults=true`.

---

### User Story 2 - Listado Completo sin Filtro (Priority: P2)

El consumidor del endpoint no envía coordenadas. El sistema regresa todas las sucursales activas sin calcular distancias ni aplicar filtros.

**Why this priority**: Fallback necesario. Si no hay coordenadas disponibles, el consumidor igual debe poder obtener el catálogo completo de sucursales.

**Independent Test**: `GET /api/v1/branches` sin parámetros — verificar que regresa todas las sucursales sin `distanceKm` ni `searchContext`.

**Acceptance Scenarios**:

1. **Given** el endpoint recibe una solicitud sin `lat` ni `lng`, **When** se procesa, **Then** regresa todas las sucursales activas sin `distanceKm` ni `searchContext`, ordenadas por nombre ascendente.
2. **Given** existen 5 sucursales en la BD, **When** se llama sin coordenadas, **Then** regresa las 5 sin filtrado.

---

### Edge Cases

- Si `lat` viene sin `lng` o viceversa → respuesta 400, se requieren ambas.
- Si `lat`, `lng` o `radius` contienen valores no numéricos → respuesta 400 con mensaje descriptivo.
- Si las coordenadas están fuera de rango válido (ej. lat > 90) → respuesta 400.
- Si la BD no tiene sucursales activas → `data: []` (con o sin `searchContext` según si vienen coordenadas).
- Si `BRANCH_FINDER_DEFAULT_RADIUS_KM` se configura como 0 o negativo → el sistema usa 10 como default.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: El endpoint `GET /api/v1/branches` DEBE aceptar parámetros de query opcionales: `lat` (número), `lng` (número), `radius` (número, km).
- **FR-002**: Si se reciben `lat` y `lng`, el sistema DEBE calcular la distancia de cada sucursal al punto usando la fórmula Haversine.
- **FR-003**: Si se reciben coordenadas, el sistema DEBE filtrar sucursales dentro del radio activo (default o especificado), devolviendo solo las que están dentro.
- **FR-004**: Si el radio inicial no produce resultados, el sistema DEBE expandir automáticamente: radio inicial → 25 km → radio máximo (default 50 km). Se usan exactamente 3 intentos.
- **FR-005**: Si ningún radio produce resultados, el sistema DEBE regresar `data: []` con `searchContext.noResults: true`.
- **FR-006**: Cada sucursal en el response filtrado DEBE incluir `distanceKm` redondeado a 2 decimales.
- **FR-007**: El response filtrado DEBE incluir `searchContext: { radiusUsed: number, expanded: boolean, noResults: boolean }`.
- **FR-008**: Si no se reciben `lat` ni `lng`, el sistema DEBE regresar todas las sucursales activas sin `distanceKm` ni `searchContext`.
- **FR-009**: `lat` y `lng` son todo-o-nada: si se recibe uno sin el otro, el sistema DEBE responder 400.
- **FR-010**: El radio por defecto y el radio máximo DEBEN ser configurables via variables de entorno (`BRANCH_FINDER_DEFAULT_RADIUS_KM` default 10, `BRANCH_FINDER_MAX_RADIUS_KM` default 50).
- **FR-011**: Las sucursales con coordenadas se ordenan por `distanceKm` ascendente; sin coordenadas, por nombre ascendente.
- **FR-012**: El sistema DEBE excluir sucursales con soft delete (`deletedAt IS NOT NULL`) de todos los resultados.

### Key Entities *(include if feature involves data)*

- **Branch (Sucursal)**: Entidad existente en la BD con `id`, `name`, `address`, `lat`, `lng`, `phone`, `hours`. La BD ya tiene coordenadas en estas columnas.
- **SearchContext**: Objeto en el response (no persistido): `{ radiusUsed: number, expanded: boolean, noResults: boolean }`.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: El endpoint responde en menos de 500 ms para cualquier combinación válida de parámetros.
- **SC-002**: El 100% de solicitudes con parámetros inválidos reciben 400 con mensaje legible, nunca 500.
- **SC-003**: El cálculo de distancia tiene precisión de ±100 m para distancias hasta 50 km.
- **SC-004**: La expansión de radio usa siempre el radio más pequeño que produce resultados — nunca devuelve sucursales a 50 km si hay resultados a 10 km.
- **SC-005**: Todos los casos de expansión y `noResults` están cubiertos por tests unitarios.

## Assumptions

- La tabla `branches` ya tiene columnas `lat` y `lng` de tipo decimal con coordenadas válidas para todas las sucursales activas.
- El consumidor del endpoint (frontend) es responsable de obtener las coordenadas (geolocalización o conversión CP → lat/lng via Mapbox). El backend solo recibe números.
- El radio de expansión usa niveles fijos: default → 25 km → max. No es configurable por el consumidor más allá del parámetro `radius`.
- No se requiere autenticación para este endpoint.
- La fórmula Haversine es suficiente para distancias hasta 50 km en contexto de CDMX.
