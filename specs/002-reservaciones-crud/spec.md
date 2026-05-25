# Feature Specification: Reservaciones — Backend CRUD API

**Feature Branch**: `feat/002-reservaciones-crud`
**Created**: 2026-05-23
**Status**: Draft
**Input**: User description: "Sistema de Reservaciones — Backend CRUD API. Endpoints REST en /server/api/v1/reservations/ para crear, leer, actualizar y cancelar reservaciones contra Neon PostgreSQL usando Drizzle ORM. Sin integración Twilio por ahora (solo el CRUD puro). Incluye validación de input, manejo de errores, y tests."

---

## User Scenarios & Testing *(mandatory)*

### User Story 0 - Listar sucursales activas (Priority: P1)

El formulario de reservación necesita mostrar un selector con las sucursales disponibles. El sistema expone un endpoint que devuelve únicamente las sucursales activas con los campos necesarios para poblar el selector: `id`, `name` y `address`.

**Why this priority**: Sin este endpoint el formulario de reservación no puede renderizarse. Es un prerequisito de US1 — crear una reservación requiere seleccionar una sucursal válida.

**Independent Test**: Insertar sucursales en la base de datos (algunas activas, otras inactivas) y verificar que el endpoint devuelve solo las activas, ordenadas por nombre.

**Acceptance Scenarios**:

1. **Given** sucursales activas e inactivas en la base de datos, **When** se hace `GET /api/v1/branches`, **Then** se devuelven solo las sucursales con `is_active = true`, ordenadas alfabéticamente por nombre, con código `200`.
2. **Given** ninguna sucursal activa en la base de datos, **When** se hace `GET /api/v1/branches`, **Then** se devuelve un array vacío con código `200`.
3. **Given** el endpoint responde, **When** se revisa la estructura del objeto, **Then** cada elemento contiene al menos `id`, `name` y `address`.

---

### User Story 1 - Crear una reservación (Priority: P1)

Un visitante del sitio (o el staff en su nombre) envía el formulario de reservación con su nombre, teléfono, sucursal, fecha, hora y número de personas. El sistema registra la reservación con estado `pending` y devuelve el identificador único de la reservación creada.

**Why this priority**: Es el flujo central del feature. Sin poder crear reservaciones, ningún otro endpoint tiene valor.

**Independent Test**: Enviar una petición POST con datos válidos y verificar que la reservación queda persistida en la base de datos con los campos correctos y `status = pending`.

**Acceptance Scenarios**:

1. **Given** una petición POST con todos los campos obligatorios válidos, **When** se procesa la petición, **Then** se crea una reservación con `status = pending` y se devuelve `201` con el objeto de la reservación incluyendo `id`.
2. **Given** una petición POST con un campo obligatorio faltante (ej. `party_size`), **When** se procesa la petición, **Then** se devuelve `422` con un mensaje que identifica el campo inválido.
3. **Given** una petición POST con `branch_id` que no existe en la base de datos, **When** se procesa la petición, **Then** se devuelve `422` con un mensaje indicando que la sucursal no es válida.
4. **Given** una petición POST con `party_size = 0`, **When** se procesa la petición, **Then** se devuelve `422` indicando que el número de personas debe ser mayor a cero.
5. **Given** una petición POST con `reservation_date` en el pasado, **When** se procesa la petición, **Then** se devuelve `422` indicando que la fecha debe ser futura.

---

### User Story 2 - Consultar reservaciones (Priority: P2)

Un miembro del staff consulta la lista de reservaciones, con soporte para filtrar por sucursal, fecha o estado. También puede consultar una reservación individual por su ID para ver todos sus detalles.

**Why this priority**: El staff necesita ver las reservaciones existentes para gestionarlas. Sin lectura, los demás CRUDs no tienen contexto.

**Independent Test**: Crear algunas reservaciones en la base de datos directamente y llamar al endpoint GET para verificar que se devuelven correctamente con los filtros aplicados.

**Acceptance Scenarios**:

1. **Given** varias reservaciones en la base de datos, **When** se hace GET sin filtros, **Then** se devuelven todas las reservaciones no eliminadas en orden cronológico (más próximas primero), paginadas.
2. **Given** reservaciones de múltiples sucursales, **When** se hace GET con `?branch_id=<uuid>`, **Then** solo se devuelven las reservaciones de esa sucursal.
3. **Given** reservaciones con distintos estados, **When** se hace GET con `?status=confirmed`, **Then** solo se devuelven las reservaciones confirmadas.
4. **Given** una reservación existente, **When** se hace GET por su `id`, **Then** se devuelven todos los campos de esa reservación con `200`.
5. **Given** un `id` que no existe, **When** se hace GET por ese `id`, **Then** se devuelve `404`.
6. **Given** reservaciones con `deleted_at` no nulo, **When** se hace GET, **Then** esas reservaciones NO aparecen en los resultados.

---

### User Story 3 - Actualizar estado de una reservación (Priority: P2)

El staff confirma o actualiza una reservación existente: puede cambiar su estado a `confirmed` o actualizar campos como `notes`. Esta acción es la principal interacción de gestión del staff.

**Why this priority**: Confirmar reservaciones es la acción más frecuente del staff después de crearlas. Permite completar el ciclo de vida de la reservación.

**Independent Test**: Crear una reservación con `status = pending`, luego llamar al endpoint PATCH para cambiarla a `confirmed` y verificar el cambio en la base de datos.

**Acceptance Scenarios**:

1. **Given** una reservación `pending`, **When** el staff hace PATCH con `status: confirmed`, **Then** la reservación queda con `status = confirmed` y se devuelve `200` con el objeto actualizado.
2. **Given** una reservación existente, **When** el staff hace PATCH solo con `notes`, **Then** solo el campo `notes` se actualiza, el resto de campos permanece igual.
3. **Given** una reservación `cancelled`, **When** se intenta actualizar su estado, **Then** se devuelve `409` indicando que una reservación cancelada no puede modificarse.
4. **Given** un `id` que no existe, **When** se hace PATCH, **Then** se devuelve `404`.
5. **Given** un payload PATCH con un campo no permitido (ej. `branch_id`), **When** se procesa la petición, **Then** el campo es ignorado y solo se aplican los campos permitidos.

---

### User Story 4 - Cancelar una reservación (Priority: P2)

El staff o el sistema cancela una reservación existente. La reservación no se elimina físicamente — se marca como `cancelled` y registra el `deleted_at` para auditoría.

**Why this priority**: Cancelar reservaciones es parte del ciclo de vida normal. El soft-delete garantiza que el historial quede intacto.

**Independent Test**: Crear una reservación, llamar al endpoint DELETE, y verificar que el registro aún existe en la DB pero con `status = cancelled` y `deleted_at` no nulo.

**Acceptance Scenarios**:

1. **Given** una reservación existente, **When** se hace DELETE por su `id`, **Then** la reservación queda con `status = cancelled` y `deleted_at` con la fecha actual. Se devuelve `200` con el objeto actualizado.
2. **Given** una reservación ya cancelada, **When** se hace DELETE nuevamente, **Then** se devuelve `409` indicando que ya está cancelada.
3. **Given** un `id` que no existe, **When** se hace DELETE, **Then** se devuelve `404`.

---

### Edge Cases

- ¿Qué sucede cuando `DATABASE_URL` no está configurado al iniciar el servidor?
- ¿Qué sucede si se envía un `reservation_date` en formato inválido (ej. `"32-13-2026"`)?
- ¿Qué sucede si `contact_phone` contiene caracteres no numéricos o tiene más de 20 caracteres?
- ¿Qué sucede si la sucursal referenciada en `branch_id` tiene `is_active = false`?
- ¿Qué sucede si una sucursal no tiene `postal_code` registrado y se busca por CP?
- ¿Qué sucede si una sucursal no tiene `lat`/`lng` registrados y se hace búsqueda por geolocalización?
- ¿Qué sucede si se intenta crear una reservación con `reservation_time` fuera del horario de operación de la sucursal?
- ¿Qué sucede cuando la base de datos no está disponible (timeout de conexión)?
- ¿Qué sucede con múltiples peticiones concurrentes de creación para la misma sucursal/hora?

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-000**: El sistema DEBE exponer un endpoint `GET /api/v1/branches` que devuelva la lista de sucursales con `is_active = true`, ordenadas alfabéticamente por nombre, con campos mínimos `id`, `name`, `address` y `postal_code`.
- **FR-000a**: La tabla `branches` DEBE agregar una columna `postal_code varchar(10)` nullable para soportar búsqueda por código postal, y generar la migración incremental correspondiente.
- **FR-000b**: La tabla `branches` DEBE agregar los siguientes índices: (1) índice parcial en `is_active` filtrando `WHERE is_active = true`, (2) índice en `postal_code`, (3) índice compuesto en `(lat, lng)` para filtrado por bounding box en búsqueda por geolocalización.
- **FR-001**: El sistema DEBE exponer un endpoint `POST /api/v1/reservations` que cree una nueva reservación con `status = pending`.
- **FR-002**: El sistema DEBE exponer un endpoint `GET /api/v1/reservations` que devuelva la lista paginada de reservaciones no eliminadas, con soporte para filtros por `branch_id`, `status` y `reservation_date`.
- **FR-003**: El sistema DEBE exponer un endpoint `GET /api/v1/reservations/:id` que devuelva una reservación individual por su UUID.
- **FR-004**: El sistema DEBE exponer un endpoint `PATCH /api/v1/reservations/:id` que permita actualizar campos editables: `status`, `notes`, `reservation_date`, `reservation_time`, `party_size`.
- **FR-005**: El sistema DEBE exponer un endpoint `DELETE /api/v1/reservations/:id` que cancele (soft-delete) una reservación: marcar `status = cancelled` y poblar `deleted_at`.
- **FR-006**: El sistema DEBE validar todos los campos de entrada y devolver `422` con mensajes descriptivos cuando la validación falle.
- **FR-007**: El sistema DEBE devolver `404` cuando se referencie un `id` de reservación que no existe o está eliminado.
- **FR-008**: El sistema DEBE devolver `409` cuando se intente modificar o cancelar una reservación ya cancelada.
- **FR-009**: El sistema DEBE excluir automáticamente los registros con `deleted_at IS NOT NULL` de todos los endpoints de lectura y modificación, salvo consultas de auditoría explícitas.
- **FR-010**: El sistema DEBE validar que `party_size > 0`, que `reservation_date` sea una fecha válida no pasada, y que `branch_id` corresponda a una sucursal existente.
- **FR-011**: Los endpoints DEBEN devolver respuestas JSON consistentes con estructura `{ data, error, meta }`.
- **FR-012**: El sistema DEBE incluir pruebas automatizadas que cubran los flujos felices y casos de error de cada endpoint, incluyendo `GET /api/v1/branches`.

### Key Entities

- **Reservation**: Registro de una reservación de mesa. Campos clave: `id`, `branch_id`, `contact_name`, `contact_phone`, `party_size`, `reservation_date`, `reservation_time`, `status`, `notes`, `created_at`, `updated_at`, `deleted_at`. El `status` sigue el ciclo `pending → confirmed → cancelled`.
- **Branch**: Sucursal del restaurante. Referenciada en cada reservación. Campos clave: `id`, `name`, `address` (texto libre para display), `postal_code` (para búsqueda por CP), `lat`/`lng` (para búsqueda por geolocalización), `is_active`. Solo sucursales existentes son válidas como `branch_id`.

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Todos los endpoints responden en menos de 500ms bajo carga normal de desarrollo local.
- **SC-002**: Los tests cubren el 100% de los endpoints (listar sucursales, crear, listar, obtener por ID, actualizar, cancelar reservaciones) incluyendo al menos un caso de error por endpoint.
- **SC-003**: Ninguna petición con datos inválidos produce un error 500 — todos los errores de validación devuelven 4xx con mensajes claros.
- **SC-004**: Las reservaciones canceladas nunca aparecen en los endpoints de lectura sin un filtro explícito de auditoría.
- **SC-005**: El sistema maneja la ausencia de `DATABASE_URL` con un error claro al iniciar, sin crashes silenciosos en runtime.

---

## Assumptions

- La autenticación y autorización están fuera del scope de este feature. Los endpoints son accesibles sin token por ahora.
- La integración con Twilio (notificaciones WhatsApp) es una feature separada que se construirá sobre estos endpoints.
- La paginación por defecto devuelve 20 registros por página con soporte para `?page` y `?limit`.
- No se valida el horario de operación de la sucursal en esta versión — solo se valida que la sucursal exista.
- Las sucursales con `is_active = false` se aceptan como válidas para reservaciones en esta versión (el staff puede necesitar gestionar reservaciones históricas).
- La validación de formato de teléfono acepta cualquier string de hasta 20 caracteres no vacío.
- Se usa Nuxt 3 server routes (`/server/api/`) como capa de API REST.
- El schema de base de datos ya existe y fue migrado en el feature `001-db-schema-drizzle`.
- La tabla `branches` no tiene índices adicionales más allá del PK. Con el volumen esperado (10–20 sucursales), un full scan es aceptable y no requiere índice en `is_active`.
- El endpoint `GET /api/v1/branches` es público (sin auth) ya que lo consume el formulario de reservación del sitio público.
